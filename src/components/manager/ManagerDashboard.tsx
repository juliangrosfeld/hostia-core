'use client';

import { useEffect, useState } from 'react';
import { Users, Plus, X, Trash2 } from 'lucide-react';

import { type StaffMember } from '@/lib/staff-data';
import { type UserProfile } from '@/lib/useUser';
import { getGreeting } from '@/lib/greeting';

import StaffRow from './StaffRow';

// ─── CRUD helpers ────────────────────────────────────────────

const COLOR_PRESETS = [
  { value: '#F5A623', label: 'Brand yellow' },
  { value: '#E07A5F', label: 'Coral' },
  { value: '#81B29A', label: 'Sage green' },
  { value: '#D4A574', label: 'Gold' },
  { value: '#8DA9C4', label: 'Ocean blue' },
  { value: '#4A5568', label: 'Slate' },
];

const ROLE_DEPT: Record<string, string> = {
  'Mesero':  'Floor',
  'Runner':  'Floor',
  'Capitán': 'Floor',
  'Bar Staff': 'Bar',
  'Kitchen': 'Kitchen',
  'Manager': 'Management',
};

const ROLES = Object.keys(ROLE_DEPT);

function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0][0] ?? '?').toUpperCase();
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase();
}

function makeId(): string {
  return `s-${Date.now()}`;
}

// Turn a stored last_active timestamp into a short relative string.
function formatLastActive(ts: string | null): string {
  if (!ts) return 'Never';
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// Raw users-table row returned by /api/staff/list.
interface StaffRowData {
  id: string;
  full_name: string;
  email: string;
  xp: number | null;
  streak_days: number | null;
  last_active: string | null;
}

// Map a real staff user into the roster's display shape. Analytics fields
// (score, skills, level…) aren't tracked yet, so they start at zero — these are
// genuine starting values for a new hire, not mock data.
function mapToStaffMember(u: StaffRowData): StaffMember {
  return {
    id: u.id,
    name: u.full_name,
    initials: makeInitials(u.full_name || u.email || '?'),
    role: 'Staff',
    dept: 'Floor',
    level: 1,
    xp: u.xp ?? 0,
    streak: u.streak_days ?? 0,
    score: 0,
    lessons: 0,
    total: 28,
    lastActive: formatLastActive(u.last_active),
    status: 'new',
    joined: '',
    color: '#F5A623',
    badges: 0,
    skills: { greetings: 0, serviceFlow: 0, language: 0, complaints: 0, floor: 0, guestPsychology: 0, casualDiningFloor: 0 },
  };
}

// ─── Form state type ─────────────────────────────────────────

interface FormState { name: string; role: string; color: string; email: string; password: string; }
const BLANK_FORM: FormState = { name: '', role: 'Mesero', color: '#F5A623', email: '', password: '' };

// ─── Main dashboard ──────────────────────────────────────────

interface ManagerDashboardProps {
  onOpenStaff: (s: StaffMember) => void;
  user: UserProfile | null;
  propertyName: string;
}

export default function ManagerDashboard({ onOpenStaff, user, propertyName }: ManagerDashboardProps) {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);

  // Time-of-day greeting — computed client-side so it uses the viewer's tz.
  const [greeting, setGreeting] = useState('Good evening');
  useEffect(() => { setGreeting(getGreeting()); }, []);

  // Manager's display name, falling back to the part before @ in their email.
  const managerName = user?.full_name?.trim() || user?.email?.split('@')[0] || 'there';
  const managerFirst = managerName.split(' ')[0];

  // Modal state
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [nameError, setNameError] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Load the real staff roster for this property ─────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/staff/list');
        const data = await res.json();
        if (!cancelled && res.ok) {
          setStaffList((data.staff ?? []).map(mapToStaffMember));
        }
      } catch {
        // Leave the list empty — the empty state will render.
      } finally {
        if (!cancelled) setStaffLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── CRUD actions ─────────────────────────────────────────
  const openAdd = () => {
    setForm(BLANK_FORM);
    setEditTarget(null);
    setNameError(false);
    setShowRemoveConfirm(false);
    setSubmitError(null);
    setModalMode('add');
  };

  const openEdit = (s: StaffMember) => {
    setForm({ name: s.name, role: s.role, color: s.color, email: '', password: '' });
    setEditTarget(s);
    setNameError(false);
    setShowRemoveConfirm(false);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditTarget(null);
    setShowRemoveConfirm(false);
    setSubmitError(null);
  };

  const handleAdd = async () => {
    if (!form.name.trim()) { setNameError(true); return; }
    if (!form.email.trim() || !form.password.trim()) {
      setSubmitError('Email and password are required');
      return;
    }
    if (form.password.length < 8) {
      setSubmitError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/staff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: 'staff',
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || 'Failed to create staff member');
        setSubmitting(false);
        return;
      }

      const member: StaffMember = {
        id: data.user?.id ?? makeId(),
        name: form.name.trim(),
        initials: makeInitials(form.name),
        role: 'Staff',
        dept: ROLE_DEPT[form.role] ?? 'Floor',
        level: 1,
        xp: 0,
        streak: 0,
        score: 0,
        lessons: 0,
        total: 28,
        lastActive: 'Just added',
        status: 'new',
        joined: 'Today',
        color: form.color,
        badges: 0,
        skills: { greetings: 0, serviceFlow: 0, language: 0, complaints: 0, floor: 0, guestPsychology: 0, casualDiningFloor: 0 },
      };
      setStaffList((prev) => [...prev, member]);
      setSubmitting(false);
      closeModal();
    } catch {
      setSubmitError('Network error — please try again');
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    if (!form.name.trim()) { setNameError(true); return; }
    setStaffList((prev) => prev.map((s) =>
      s.id !== editTarget?.id ? s : {
        ...s,
        name: form.name.trim(),
        initials: makeInitials(form.name),
        role: form.role,
        dept: ROLE_DEPT[form.role] ?? s.dept,
        color: form.color,
      }
    ));
    closeModal();
  };

  const handleRemove = () => {
    setStaffList((prev) => prev.filter((s) => s.id !== editTarget?.id));
    closeModal();
  };

  const n = staffList.length;
  const roster = [...staffList].sort((a, b) => a.name.localeCompare(b.name));

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="mgr-page animate-fade-up">
      <div className="container">

        {/* ─ Header ─ */}
        <div className="mgr-header">
          <div>
            <div className="label-mono">Manager dashboard</div>
            <h1 className="display mgr-title">{greeting}, {managerFirst}.</h1>
            <p className="mgr-sub">Here&apos;s how {propertyName} is performing.</p>
          </div>
          {!staffLoading && n > 0 && (
            <div className="mgr-meta">
              <div className="mgr-meta-item"><Users size={14} />{n} staff</div>
            </div>
          )}
        </div>

        {staffLoading ? (
          <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--ink-soft)', fontSize: 15 }}>
            Loading team…
          </div>
        ) : n === 0 ? (
          /* ─ Empty state — brand new property, no staff yet ─ */
          <div
            className="card"
            style={{ textAlign: 'center', padding: '56px 32px', maxWidth: 480, margin: '40px auto' }}
          >
            <div
              style={{
                width: 56, height: 56, borderRadius: '50%', background: 'var(--sand-warm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
              }}
            >
              <Users size={26} color="var(--ink-soft)" />
            </div>
            <h2 className="display" style={{ fontSize: 22, color: 'var(--brand-deep)', margin: '0 0 8px' }}>
              No team yet
            </h2>
            <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.55, margin: '0 0 24px' }}>
              Invite your first staff member to start tracking their progress
            </p>
            <button className="btn-brand" style={{ margin: '0 auto' }} onClick={openAdd}>
              <Plus size={15} /> Invite Staff
            </button>
          </div>
        ) : (
          <>
            {/* ─ Team roster ─ */}
            <div className="section-head">
              <div>
                <h2 className="display section-title">Team roster</h2>
                <p className="section-sub">Click anyone to drill into their progress</p>
              </div>
              <button
                onClick={openAdd}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8,
                  background: 'var(--brand)', border: 'none',
                  color: 'var(--brand-deep)', fontWeight: 700,
                  fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                }}
              >
                <Plus size={14} /> Add staff member
              </button>
            </div>

            <div className="roster-table">
              <div className="roster-head">
                <div style={{ flex: 2 }}>Staff</div>
                <div style={{ flex: 1.2 }}>Department</div>
                <div style={{ width: 70 }}>Level</div>
                <div style={{ width: 80 }}>Score</div>
                <div style={{ flex: 1.2 }}>Progress</div>
                <div style={{ width: 110 }}>Last active</div>
                <div style={{ width: 80 }}>Status</div>
                <div style={{ width: 64 }} />
              </div>
              {roster.map((s) => (
                <StaffRow
                  key={s.id}
                  staff={s}
                  onClick={() => onOpenStaff(s)}
                  onEdit={() => openEdit(s)}
                />
              ))}
            </div>
          </>
        )}

      </div>

      {/* ─ Staff CRUD Modal ─────────────────────────────── */}
      {modalMode !== null && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(17,17,17,0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: 'var(--sand)', borderRadius: 20,
              padding: 32, width: '100%', maxWidth: 440,
              boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
              animation: 'slideIn 0.2s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {showRemoveConfirm ? (
              /* ── Confirm remove ── */
              <>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'rgba(224,122,95,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <Trash2 size={22} color="var(--coral-deep)" />
                  </div>
                  <h2 className="display" style={{ fontSize: 22, color: 'var(--brand-deep)', margin: '0 0 8px' }}>
                    Remove {editTarget?.name.split(' ')[0]} from {propertyName}?
                  </h2>
                  <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.55, margin: 0 }}>
                    This cannot be undone.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    style={{
                      flex: 1, padding: '11px 0', borderRadius: 10,
                      border: 'none', background: 'var(--coral)',
                      color: 'white', fontWeight: 700, cursor: 'pointer',
                      fontSize: 14, fontFamily: 'inherit',
                    }}
                    onClick={handleRemove}
                  >
                    Remove {editTarget?.name.split(' ')[0]}
                  </button>
                  <button
                    style={{
                      flex: 1, padding: '11px 0', borderRadius: 10,
                      border: '1.5px solid var(--sand-deeper)', background: 'white',
                      fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
                    }}
                    onClick={() => setShowRemoveConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              /* ── Add / Edit form ── */
              <>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 className="display" style={{ fontSize: 24, color: 'var(--brand-deep)', margin: 0 }}>
                    {modalMode === 'add' ? 'Add staff member' : 'Edit staff member'}
                  </h2>
                  <button
                    onClick={closeModal}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', padding: 4, display: 'flex', alignItems: 'center' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Full name */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Full name <span style={{ color: 'var(--coral)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setNameError(false); }}
                    placeholder="e.g. María Perez"
                    autoFocus
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: `1.5px solid ${nameError ? 'var(--coral)' : 'var(--sand-deeper)'}`,
                      borderRadius: 10, fontSize: 14, background: 'white',
                      outline: 'none', fontFamily: 'inherit', color: 'var(--ink)',
                    }}
                  />
                  {nameError && <div style={{ fontSize: 12, color: 'var(--coral-deep)', marginTop: 4 }}>Name is required</div>}
                </div>

        {modalMode === 'add' && (
          <>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Email <span style={{ color: 'var(--coral)' }}>*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setSubmitError(null); }}
                placeholder="staff@example.com"
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '1.5px solid var(--sand-deeper)',
                  borderRadius: 10, fontSize: 14, background: 'white',
                  outline: 'none', fontFamily: 'inherit', color: 'var(--ink)',
                }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Temporary password <span style={{ color: 'var(--coral)' }}>*</span>
              </label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setSubmitError(null); }}
                placeholder="Min. 8 characters"
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '1.5px solid var(--sand-deeper)',
                  borderRadius: 10, fontSize: 14, background: 'white',
                  outline: 'none', fontFamily: 'inherit', color: 'var(--ink)',
                }}
              />
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
                Staff will use this to log in. Share it with them directly.
              </div>
            </div>

            {submitError && (
              <div style={{ fontSize: 13, color: 'var(--coral-deep)', background: 'var(--sand-deeper)', padding: '8px 12px', borderRadius: 8, marginBottom: 18 }}>
                {submitError}
              </div>
            )}
          </>
        )}

                {/* Role */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: '1.5px solid var(--sand-deeper)',
                      borderRadius: 10, fontSize: 14, background: 'white',
                      outline: 'none', fontFamily: 'inherit', cursor: 'pointer', color: 'var(--ink)',
                    }}
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* Department (auto-filled, read-only) */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Department{' '}
                    <span style={{ fontSize: 10, fontWeight: 400, letterSpacing: 0, textTransform: 'none', opacity: 0.7 }}>
                      (auto-filled)
                    </span>
                  </label>
                  <div style={{
                    padding: '10px 14px', border: '1.5px solid var(--sand-deeper)',
                    borderRadius: 10, fontSize: 14, background: 'var(--sand-warm)', color: 'var(--ink-soft)',
                  }}>
                    {ROLE_DEPT[form.role] ?? 'Floor'}
                  </div>
                </div>

                {/* Profile color */}
                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Profile color
                  </label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.value}
                        title={c.label}
                        onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                        style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: c.value, border: 'none',
                          cursor: 'pointer', padding: 0, flexShrink: 0,
                          boxShadow: form.color === c.value
                            ? `0 0 0 2px var(--sand), 0 0 0 4.5px ${c.value}`
                            : 'none',
                          transition: 'box-shadow 0.15s ease',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Primary actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn-brand"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={modalMode === 'add' ? handleAdd : handleEdit}
            disabled={submitting}
                  >
                    {submitting ? 'Creating…' : (modalMode === 'add' ? 'Add to team' : 'Save changes')}
                  </button>
                  <button
                    onClick={closeModal}
                    style={{
                      padding: '11px 20px', borderRadius: 10,
                      border: '1.5px solid var(--sand-deeper)', background: 'white',
                      fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
                    }}
                  >
                    Cancel
                  </button>
                </div>

                {/* Remove button (edit only) */}
                {modalMode === 'edit' && (
                  <button
                    onClick={() => setShowRemoveConfirm(true)}
                    style={{
                      marginTop: 14, width: '100%', padding: '10px 0', borderRadius: 10,
                      border: '1.5px solid rgba(224,122,95,0.3)',
                      background: 'rgba(224,122,95,0.06)',
                      color: 'var(--coral-deep)', fontWeight: 600, cursor: 'pointer',
                      fontSize: 14, fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <Trash2 size={13} /> Remove from team
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
