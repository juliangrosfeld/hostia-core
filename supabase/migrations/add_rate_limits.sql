-- Rate limiting — shared counters in Postgres.
--
-- WHY POSTGRES: the previous limiter (an in-memory Map in
-- src/app/api/roleplay/route.ts) counted per serverless INSTANCE, so on Vercel
-- the real ceiling was limit × instance count and every cold start reset it —
-- it loosened exactly as load rose. Counters have to live somewhere all
-- instances share, and Supabase is the only shared store this project already
-- has (no Redis/KV is provisioned).
--
-- FIXED WINDOW, not sliding: one row per (bucket, subject, window). A caller
-- can in theory spend 2× the limit across a window boundary. That is an
-- accepted trade for a single atomic UPSERT per check — these limits exist to
-- stop runaway cost and brute-forcing, not to meter usage precisely.
--
-- Run this in the Supabase SQL editor. Until it is applied, every limit check
-- fails open (logged as "[rate-limit] … RPC failed") and NOTHING is limited.

-- ---------------------------------------------------------------------------
-- 1. Counter table
--
-- `subject` is the identity being limited — 'user:<users.id>' where the caller
-- is authenticated, 'ip:<addr>' on public routes. `expires_at` is what the GC
-- sweeps on, so a row carries its own lifetime and the sweep never has to know
-- which window length produced it.

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket       text        NOT NULL,
  subject      text        NOT NULL,
  window_start timestamptz NOT NULL,
  expires_at   timestamptz NOT NULL,
  count        integer     NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, subject, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON rate_limits(expires_at);

-- No policies: RLS on with zero policies means the anon and authenticated keys
-- cannot read or write this table at all. Only the service role (which bypasses
-- RLS) touches it, via the function below.
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. consume_rate_limit(bucket, subject, limit, window_seconds)
--
-- Records one hit and reports whether it is allowed. The INSERT … ON CONFLICT
-- DO UPDATE … RETURNING is a single atomic statement, so two concurrent
-- requests can never read the same count and both decide they are under it.
--
-- The counter keeps climbing past the limit (no cap) — that is deliberate, so
-- rate_limits doubles as a record of how hard a subject is hammering.

CREATE OR REPLACE FUNCTION consume_rate_limit(
  p_bucket         text,
  p_subject        text,
  p_limit          integer,
  p_window_seconds integer
)
RETURNS TABLE (allowed boolean, remaining integer, reset_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now          timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_reset_at     timestamptz;
  v_count        integer;
BEGIN
  IF p_window_seconds IS NULL OR p_window_seconds <= 0 THEN
    RAISE EXCEPTION 'consume_rate_limit: window_seconds must be positive';
  END IF;

  -- Snap to a fixed window boundary so every caller in the same window shares
  -- one row (and one primary key) rather than each creating its own.
  v_window_start := to_timestamp(
    floor(extract(epoch FROM v_now) / p_window_seconds) * p_window_seconds
  );
  v_reset_at := v_window_start + make_interval(secs => p_window_seconds);

  INSERT INTO rate_limits AS rl (bucket, subject, window_start, expires_at, count)
  VALUES (p_bucket, p_subject, v_window_start, v_reset_at, 1)
  ON CONFLICT (bucket, subject, window_start)
  DO UPDATE SET count = rl.count + 1
  RETURNING rl.count INTO v_count;

  -- Opportunistic GC. A cron job would be tidier, but this table is only ever
  -- written by this function, so sweeping here keeps the whole mechanism in one
  -- object. ~0.5% of calls pay for it; expired rows are useless to everyone.
  IF random() < 0.005 THEN
    DELETE FROM rate_limits WHERE expires_at < v_now - interval '1 hour';
  END IF;

  RETURN QUERY SELECT
    v_count <= p_limit,
    greatest(p_limit - v_count, 0),
    v_reset_at;
END;
$$;

-- Only the service role may spend limit budget. If the anon or authenticated
-- key could call this, anyone could burn another subject's allowance by
-- passing their id — turning the limiter itself into a denial-of-service tool.
REVOKE ALL ON FUNCTION consume_rate_limit(text, text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION consume_rate_limit(text, text, integer, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION consume_rate_limit(text, text, integer, integer) TO service_role;
