'use client';

import { useEffect, useMemo, useState, type ElementType } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Library, GripVertical, Plus, X, Check, Save,
  Eye, EyeOff, BookOpen, Sparkles, AlertCircle,
  ArrowLeft, GraduationCap,
  Star, Trophy, Utensils, UtensilsCrossed, Hand, MessageSquare, Shield, Brain, House,
} from 'lucide-react';
import { useUser } from '@/lib/useUser';

// Newer modules store Lucide icon names (e.g. 'Star') instead of emoji strings.
// Map known names to components; fall back to rendering the raw string (legacy emoji).
const ICON_MAP: Record<string, ElementType> = {
  BookOpen, Brain, Eye, Hand, House, MessageSquare, Shield, Star, Trophy, Utensils, UtensilsCrossed,
};

function renderModuleIcon(icon: string | undefined, size: number) {
  if (icon && ICON_MAP[icon]) {
    const Icon = ICON_MAP[icon];
    return <Icon size={size} />;
  }
  return icon;
}

const PROPERTY_ID = 'f86752e5-f7f1-46a2-acd3-90764ce1c403';

// ─── Types ───────────────────────────────────────────────────

interface Module {
  id: string;
  title: string;
  description: string;
  track: string;
  icon: string;
  total_lessons: number;
  xp_total: number;
  order_index: number;
}

interface PropertyModule {
  module_id: string;
  order_index: number;
  is_active: boolean;
}

// A row in the assigned column: just the id + active flag; order is array order.
interface Assigned {
  module_id: string;
  is_active: boolean;
}

// ─── Track presentation ──────────────────────────────────────

const TRACK_META: Record<string, { label: string; color: string }> = {
  onboarding:      { label: 'Onboarding',     color: '#8DA9C4' },
  universal:       { label: 'Universal',      color: '#D4A574' },
  'casual-dining': { label: 'Casual Dining',  color: '#2D6A4F' },
  'fast-casual':   { label: 'Fast Casual',    color: '#81B29A' },
  'fine-dining':   { label: 'Fine Dining',    color: '#E07A5F' },
  manager:         { label: 'Manager',        color: '#051956' },
};

const TRACK_ORDER = ['onboarding', 'universal', 'casual-dining', 'fast-casual', 'fine-dining', 'manager'];

function trackMeta(track: string) {
  return TRACK_META[track] ?? { label: track, color: '#4A5568' };
}

function TrackTag({ track }: { track: string }) {
  const { label, color } = trackMeta(track);
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '2px 8px', borderRadius: 999,
        background: `${color}1A`, color,
        fontSize: 10, fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

// ─── Drag state ──────────────────────────────────────────────

type Drag =
  | { type: 'new'; moduleId: string }
  | { type: 'reorder'; index: number }
  | null;

// ─── Page ────────────────────────────────────────────────────

export default function LibraryAdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const isAdmin = user?.role === 'admin';

  // ── Auth gate ──────────────────────────────────────────────
  // Not authenticated → /login. Authenticated non-admin → /manager.
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'admin') router.replace('/manager');
  }, [authLoading, user, router]);

  const [allModules, setAllModules] = useState<Module[]>([]);
  const [assigned, setAssigned] = useState<Assigned[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const [drag, setDrag] = useState<Drag>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [overDropZone, setOverDropZone] = useState(false);

  // ── Load ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/library?property_id=${PROPERTY_ID}`);
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setLoadError(data.error || 'Failed to load library');
          return;
        }
        if (cancelled) return;
        const mods: Module[] = (data.allModules ?? []).slice().sort(
          (a: Module, b: Module) => a.order_index - b.order_index
        );
        const pm: PropertyModule[] = (data.propertyModules ?? [])
          .slice()
          .sort((a: PropertyModule, b: PropertyModule) => a.order_index - b.order_index);
        setAllModules(mods);
        setAssigned(pm.map((p) => ({ module_id: p.module_id, is_active: p.is_active })));
      } catch {
        if (!cancelled) setLoadError('Network error — please try again');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAdmin]);

  // ── Derived ────────────────────────────────────────────────
  const moduleById = useMemo(() => {
    const m = new Map<string, Module>();
    allModules.forEach((mod) => m.set(mod.id, mod));
    return m;
  }, [allModules]);

  const assignedIds = useMemo(
    () => new Set(assigned.map((a) => a.module_id)),
    [assigned]
  );

  // Group all modules by track for the left column.
  const groupedModules = useMemo(() => {
    const groups = new Map<string, Module[]>();
    allModules.forEach((m) => {
      if (!groups.has(m.track)) groups.set(m.track, []);
      groups.get(m.track)!.push(m);
    });
    const ordered: { track: string; modules: Module[] }[] = [];
    TRACK_ORDER.forEach((t) => {
      if (groups.has(t)) { ordered.push({ track: t, modules: groups.get(t)! }); groups.delete(t); }
    });
    groups.forEach((modules, track) => ordered.push({ track, modules }));
    return ordered;
  }, [allModules]);

  // ── Mutations ──────────────────────────────────────────────
  const assignModule = (id: string) => {
    if (assignedIds.has(id)) return;
    setAssigned((prev) => [...prev, { module_id: id, is_active: true }]);
    setSaveMsg(null);
  };

  const removeModule = (id: string) => {
    setAssigned((prev) => prev.filter((a) => a.module_id !== id));
    setSaveMsg(null);
  };

  const toggleActive = (id: string) => {
    setAssigned((prev) =>
      prev.map((a) => (a.module_id === id ? { ...a, is_active: !a.is_active } : a))
    );
    setSaveMsg(null);
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    setAssigned((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
    setSaveMsg(null);
  };

  // ── Drag handlers ──────────────────────────────────────────
  const handleColumnDrop = () => {
    if (drag?.type === 'new') {
      assignModule(drag.moduleId);
    } else if (drag?.type === 'reorder' && dragOverIndex != null) {
      reorder(drag.index, dragOverIndex);
    }
    setDrag(null);
    setDragOverIndex(null);
    setOverDropZone(false);
  };

  // ── Save ───────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: PROPERTY_ID,
          modules: assigned.map((a, i) => ({
            module_id: a.module_id,
            order_index: i,
            is_active: a.is_active,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveMsg({ tone: 'err', text: data.error || 'Failed to save' });
      } else {
        setSaveMsg({ tone: 'ok', text: 'Saved' });
      }
    } catch {
      setSaveMsg({ tone: 'err', text: 'Network error — please try again' });
    } finally {
      setSaving(false);
    }
  };

  const activeCount = assigned.filter((a) => a.is_active).length;

  // ── Auth gate: hold the UI until an admin is confirmed ─────
  if (authLoading || !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sand)' }}>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: 'var(--brand-deep)' }}>Loading…</div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--sand)' }}>

      {/* ─ Header ─ */}
      <div style={{ background: 'var(--ocean-deep)', color: 'white' }}>
        <div
          style={{
            maxWidth: 1200, margin: '0 auto',
            padding: '28px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(245,166,35,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--brand)', flexShrink: 0,
              }}
            >
              <Library size={22} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
                Admin
              </div>
              <h1 style={{ margin: '2px 0 0', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
                Module Library
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link
              href="/manager"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 600,
                color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
              }}
            >
              <ArrowLeft size={15} /> Back
            </Link>
            <Link
              href="/staff"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 600,
                color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
              }}
            >
              <GraduationCap size={15} /> View as Staff
            </Link>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              {assigned.length} assigned · {activeCount} active
            </div>
            {saveMsg && (
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 600,
                  color: saveMsg.tone === 'ok' ? '#9BE3C4' : '#FFB4A2',
                }}
              >
                {saveMsg.tone === 'ok' ? <Check size={15} /> : <AlertCircle size={15} />}
                {saveMsg.text}
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving || loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 20px', borderRadius: 10,
                background: 'var(--brand)', border: 'none',
                color: 'var(--brand-deep)', fontWeight: 700, fontSize: 14,
                cursor: saving || loading ? 'default' : 'pointer',
                opacity: saving || loading ? 0.6 : 1,
                fontFamily: 'inherit',
              }}
            >
              <Save size={15} /> {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>

      {/* ─ Body ─ */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>

        {loadError ? (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '20px 24px', borderRadius: 14,
              background: 'rgba(224,122,95,0.08)',
              border: '1px solid rgba(224,122,95,0.25)',
              color: 'var(--coral-deep)', fontSize: 15, fontWeight: 500,
            }}
          >
            <AlertCircle size={20} /> {loadError}
          </div>
        ) : loading ? (
          <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--ink-soft)', fontSize: 15 }}>
            Loading library…
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: 24,
              alignItems: 'start',
            }}
          >

            {/* ── LEFT: all modules ── */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <BookOpen size={16} color="var(--ink-soft)" />
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--brand-deep)' }}>
                  All modules
                </h2>
                <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  Drag onto a property to assign →
                </span>
              </div>

              {groupedModules.map(({ track, modules }) => (
                <div key={track} style={{ marginBottom: 22 }}>
                  <div style={{ marginBottom: 10 }}>
                    <TrackTag track={track} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {modules.map((m) => {
                      const isAssigned = assignedIds.has(m.id);
                      return (
                        <div
                          key={m.id}
                          draggable={!isAssigned}
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'copy';
                            setDrag({ type: 'new', moduleId: m.id });
                          }}
                          onDragEnd={() => { setDrag(null); setOverDropZone(false); setDragOverIndex(null); }}
                          onClick={() => !isAssigned && assignModule(m.id)}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 12,
                            padding: 14, borderRadius: 14,
                            background: 'white',
                            border: '1px solid var(--sand-deeper)',
                            cursor: isAssigned ? 'default' : 'grab',
                            opacity: isAssigned ? 0.5 : 1,
                            boxShadow: '0 1px 2px rgba(5,25,86,0.04)',
                            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                          }}
                        >
                          <div style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{renderModuleIcon(m.icon, 22)}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--brand-deep)' }}>
                                {m.title}
                              </span>
                              {isAssigned && (
                                <span
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 3,
                                    fontSize: 10, fontWeight: 700, color: 'var(--sage-deep)',
                                    letterSpacing: '0.06em', textTransform: 'uppercase',
                                  }}
                                >
                                  <Check size={11} /> Assigned
                                </span>
                              )}
                            </div>
                            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                              {m.description}
                            </p>
                            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums' }}>
                              {m.total_lessons} lessons · {m.xp_total} XP
                            </div>
                          </div>
                          {!isAssigned && (
                            <button
                              onClick={(e) => { e.stopPropagation(); assignModule(m.id); }}
                              title="Assign"
                              style={{
                                flexShrink: 0, width: 28, height: 28, borderRadius: 8,
                                border: '1px solid var(--sand-deeper)', background: 'var(--sand)',
                                color: 'var(--brand-deep)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              <Plus size={15} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {allModules.length === 0 && (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ink-soft)', fontSize: 14 }}>
                  No modules in the database yet.
                </div>
              )}
            </section>

            {/* ── RIGHT: assigned to property ── */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Sparkles size={16} color="var(--gold-deep)" />
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--brand-deep)' }}>
                  Assigned to property
                </h2>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (drag?.type === 'new') setOverDropZone(true);
                }}
                onDragLeave={(e) => {
                  // only clear when leaving the column entirely
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverDropZone(false);
                }}
                onDrop={(e) => { e.preventDefault(); handleColumnDrop(); }}
                style={{
                  minHeight: 240,
                  padding: 14,
                  borderRadius: 16,
                  background: overDropZone ? 'rgba(245,166,35,0.08)' : 'var(--sand-warm)',
                  border: overDropZone
                    ? '2px dashed var(--brand)'
                    : '2px dashed var(--sand-deeper)',
                  transition: 'background 0.15s ease, border-color 0.15s ease',
                }}
              >
                {assigned.length === 0 ? (
                  <div
                    style={{
                      height: 200, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 10,
                      color: 'var(--ink-soft)', textAlign: 'center',
                    }}
                  >
                    <Plus size={26} color="var(--sand-deeper)" />
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Drag modules here</div>
                    <div style={{ fontSize: 12.5, maxWidth: 240, lineHeight: 1.5 }}>
                      Drop modules from the left to assign them to this property, then drag to reorder.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {assigned.map((a, i) => {
                      const m = moduleById.get(a.module_id);
                      const isDragTarget = drag?.type === 'reorder' && dragOverIndex === i;
                      return (
                        <div
                          key={a.module_id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'move';
                            setDrag({ type: 'reorder', index: i });
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (drag?.type === 'reorder') setDragOverIndex(i);
                          }}
                          onDragEnd={() => { setDrag(null); setDragOverIndex(null); setOverDropZone(false); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: 12, borderRadius: 12,
                            background: 'white',
                            border: isDragTarget
                              ? '1px solid var(--brand)'
                              : '1px solid var(--sand-deeper)',
                            boxShadow: isDragTarget
                              ? '0 4px 12px rgba(5,25,86,0.10)'
                              : '0 1px 2px rgba(5,25,86,0.04)',
                            opacity: drag?.type === 'reorder' && drag.index === i ? 0.4 : 1,
                            cursor: 'grab',
                          }}
                        >
                          <GripVertical size={16} color="var(--sand-deeper)" style={{ flexShrink: 0 }} />

                          <div
                            style={{
                              width: 22, height: 22, borderRadius: 6,
                              background: 'var(--sand-warm)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)',
                              flexShrink: 0, fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {i + 1}
                          </div>

                          <div style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
                            {renderModuleIcon(m?.icon, 18) ?? '📘'}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 14, fontWeight: 700,
                                color: a.is_active ? 'var(--brand-deep)' : 'var(--ink-soft)',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}
                            >
                              {m?.title ?? a.module_id}
                            </div>
                            <div style={{ marginTop: 2 }}>
                              <TrackTag track={m?.track ?? 'universal'} />
                            </div>
                          </div>

                          {/* Active toggle */}
                          <button
                            onClick={() => toggleActive(a.module_id)}
                            title={a.is_active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '5px 10px', borderRadius: 999,
                              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                              fontSize: 11, fontWeight: 700,
                              background: a.is_active ? 'rgba(129,178,154,0.18)' : 'var(--sand-warm)',
                              color: a.is_active ? 'var(--sage-deep)' : 'var(--ink-soft)',
                              flexShrink: 0,
                            }}
                          >
                            {a.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                            {a.is_active ? 'Active' : 'Off'}
                          </button>

                          {/* Remove */}
                          <button
                            onClick={() => removeModule(a.module_id)}
                            title="Remove from property"
                            style={{
                              flexShrink: 0, width: 26, height: 26, borderRadius: 7,
                              border: 'none', background: 'transparent',
                              color: 'var(--ink-soft)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  );
}
