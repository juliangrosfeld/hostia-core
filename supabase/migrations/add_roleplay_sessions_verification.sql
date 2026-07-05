-- Server-side verification of roleplay grading (HMAC turn proofs).
--
-- `verified` — TRUE when the session's passed/warmth_score/turns were derived
-- server-side from an HMAC-verified per-turn warmth chain (see
-- src/lib/roleplay-proof.ts). FALSE for legacy sessions logged before the
-- proof rollout (accept-and-flag) — the DEFAULT makes every pre-existing row
-- read as unverified, which is accurate.
--
-- `proof_chain_hash` — SHA-256 of the chain's final proof token. Unique so a
-- captured proof chain can't be replayed to farm duplicate sessions/XP.
-- NULL for unverified sessions (partial index keeps those unconstrained).
--
-- MUST be applied BEFORE deploying the code that writes these columns —
-- the insert in /api/roleplay-sessions names them explicitly.

ALTER TABLE roleplay_sessions
  ADD COLUMN verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN proof_chain_hash TEXT;

CREATE UNIQUE INDEX roleplay_sessions_proof_chain_hash_key
  ON roleplay_sessions (proof_chain_hash)
  WHERE proof_chain_hash IS NOT NULL;
