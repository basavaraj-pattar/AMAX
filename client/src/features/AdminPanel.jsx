import { useEffect, useState, useCallback } from 'react'
import { useAdminSession } from '../context/AdminSession'
import { adminRequest } from '../services/adminApi'
import { apiRequest } from '../services/api'
import DirectionalChevron from '../components/DirectionalChevron'

// ─── Utilities ────────────────────────────────────────────────────────────────
function fmt(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtFull(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ status }) {
  const colors = {
    active: '#3d9970', suspended: '#e8a838', banned: '#e84738',
    published: '#3d9970', removed: '#e84738',
    pending: '#e8a838', under_review: '#4a9edd', resolved: '#3d9970', dismissed: '#888',
    true: '#3d9970', false: '#e84738', featured: '#3d9970', not_featured: '#788398'
  }
  const labels = {
    active: 'Active', suspended: 'Suspended', banned: 'Banned',
    published: 'Published', removed: 'Removed',
    pending: 'Pending', under_review: 'Under Review', resolved: 'Resolved', dismissed: 'Dismissed',
    featured: 'Featured', not_featured: 'Not Featured'
  }
  const key = String(status)
  return (
    <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", fontWeight: 600, padding: '3px 8px', borderRadius: 3, background: `${colors[key] || '#555'}22`, color: colors[key] || '#ccc', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      {labels[key] || key}
    </span>
  )
}

function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel, requireReason = false, requireConfirmText }) {
  const [reason, setReason] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) { setError('Please enter a reason.'); return }
    if (requireConfirmText && confirmText !== requireConfirmText) { setError(`Type "${requireConfirmText}" to confirm.`); return }
    setLoading(true); setError('')
    try { await onConfirm(reason) }
    catch (e) { setError(e.message); setLoading(false) }
  }

  return (
    <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="admin-modal">
        <h3 className="admin-modal-title">{title}</h3>
        <p className="admin-modal-message">{message}</p>
        {requireReason && (
          <textarea className="admin-textarea" placeholder="Reason for this action (required)..." value={reason} onChange={e => setReason(e.target.value)} rows={3} />
        )}
        {requireConfirmText && (
          <input className="admin-input" placeholder={`Type "${requireConfirmText}" to confirm`} value={confirmText} onChange={e => setConfirmText(e.target.value)} />
        )}
        {error && <p className="admin-error" role="alert">{error}</p>}
        <div className="admin-modal-actions">
          <button className="admin-btn admin-btn-ghost" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className={`admin-btn ${danger ? 'admin-btn-danger' : 'admin-btn-primary'}`} onClick={handleConfirm} disabled={loading}>
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null
  return (
    <div className="admin-pagination">
      <button className="admin-btn admin-btn-ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}><DirectionalChevron direction="left" size={15}/> Prev</button>
      <span className="admin-pagination-info">Page {page} of {pages}</span>
      <button className="admin-btn admin-btn-ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next <DirectionalChevron size={15}/></button>
    </div>
  )
}

// ─── Login ────────────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const data = await adminRequest('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
      onLogin(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <div className="admin-login-logo">
          <span className="admin-logo-mark">A</span>
          <div>
            <div className="admin-login-brand">MG Admin</div>
            <div className="admin-login-sub">A-MAX Administration</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <label className="admin-label" htmlFor="admin-username">Username</label>
          <input id="admin-username" className="admin-input" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={80} placeholder="MG Admin" value={username} onChange={e => setUsername(e.target.value)} required />
          <label className="admin-label" htmlFor="admin-password" style={{ marginTop: 16 }}>Password</label>
          <input id="admin-password" className="admin-input" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p className="admin-error" role="alert">{error}</p>}
          <button className="admin-btn admin-btn-primary admin-login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Change Password ──────────────────────────────────────────────────────────
function ChangePasswordForm({ onDone }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault(); setError('')
    if (form.newPassword !== form.confirmPassword) { setError('New passwords do not match.'); return }
    if (form.newPassword.length < 10) { setError('New password must be at least 10 characters.'); return }
    setLoading(true)
    try {
      const data = await adminRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      })
      onDone(data.token)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <div className="admin-login-logo">
          <span className="admin-logo-mark">A</span>
          <div>
            <div className="admin-login-brand">Change Password</div>
            <div className="admin-login-sub">You must change your password before continuing.</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="admin-login-form">
          {['currentPassword', 'newPassword', 'confirmPassword'].map(field => (
            <div key={field} style={{ marginBottom: 14 }}>
              <label className="admin-label">{field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}</label>
              <input className="admin-input" type="password" value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} required />
            </div>
          ))}
          {error && <p className="admin-error" role="alert">{error}</p>}
          <button className="admin-btn admin-btn-primary admin-login-btn" type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Change Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Overview / Dashboard ─────────────────────────────────────────────────────
function Overview() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminRequest('/stats').then(setStats).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="admin-loading">Loading statistics…</div>
  if (error) return <div className="admin-error">{error}</div>

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, sub: `${stats.suspendedUsers} suspended · ${stats.bannedUsers} banned` },
    { label: 'Filmmakers', value: stats.totalFilmmakers },
    { label: 'Cinephiles', value: stats.totalCinephiles },
    { label: 'Published Films', value: stats.totalFilms },
    { label: 'Scripts', value: stats.totalScripts },
    { label: 'Stories', value: stats.totalStories },
    { label: 'Equipment Listings', value: stats.totalEquipment },
    { label: 'Pending Reports', value: stats.pendingReports, highlight: stats.pendingReports > 0 },
    { label: 'Total Reports', value: stats.totalReports },
    { label: 'Admin Actions', value: stats.totalAuditActions }
  ]

  const actionLabels = {
    user_suspended: 'Suspended user', user_restored: 'Restored user', user_banned: 'Banned user',
    content_removed: 'Removed content', content_restored: 'Restored content', content_deleted_permanently: 'Deleted content',
    equipment_deactivated: 'Deactivated listing', equipment_reactivated: 'Reactivated listing',
    report_updated: 'Updated report', comment_removed: 'Removed comment', admin_password_changed: 'Changed password'
  }

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Platform Overview</h2>
      <div className="admin-stat-grid">
        {cards.map(card => (
          <div key={card.label} className={`admin-stat-card${card.highlight ? ' admin-stat-card--alert' : ''}`}>
            <div className="admin-stat-value">{(card.value ?? 0).toLocaleString()}</div>
            <div className="admin-stat-label">{card.label}</div>
            {card.sub && <div className="admin-stat-sub">{card.sub}</div>}
          </div>
        ))}
      </div>
      {stats.recentActions?.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h3 className="admin-sub-title">Recent Admin Activity</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Action</th><th>Target</th><th>Admin</th><th>Time</th></tr></thead>
              <tbody>
                {stats.recentActions.map(a => (
                  <tr key={a._id}>
                    <td><span className="admin-mono">{actionLabels[a.action] || a.action}</span></td>
                    <td>{a.targetLabel || a.targetId}</td>
                    <td><span className="admin-mono">{a.adminUsername}</span></td>
                    <td className="admin-muted">{fmtFull(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Users ────────────────────────────────────────────────────────────────────
function Users() {
  const [data, setData] = useState({ items: [], total: 0, pages: 1 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState(null)
  const [actionMsg, setActionMsg] = useState('')

  const load = useCallback(async (p = 1) => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ page: p, limit: 20 })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const result = await adminRequest(`/users?${params}`)
      setData(result); setPage(p)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [search, statusFilter])

  useEffect(() => { load(1) }, [load])

  const doAction = async (id, endpoint, reason, msgOk) => {
    await adminRequest(`/users/${id}/${endpoint}`, { method: 'PATCH', body: JSON.stringify({ reason }) })
    setActionMsg(msgOk)
    setDialog(null)
    load(page)
    setTimeout(() => setActionMsg(''), 3000)
  }

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">User Management</h2>
      <div className="admin-filter-row">
        <input className="admin-input admin-search" placeholder="Search username, name, email…" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1)} />
        <select className="admin-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setTimeout(() => load(1), 0) }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        <button className="admin-btn admin-btn-primary" onClick={() => load(1)}>Search</button>
      </div>
      {actionMsg && <div className="admin-success">{actionMsg}</div>}
      {error && <div className="admin-error">{error}</div>}
      {loading ? <div className="admin-loading">Loading users…</div> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>User</th><th>Identity</th><th>Status</th><th>Content</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {data.items.length === 0 ? (
                  <tr><td colSpan={6} className="admin-empty">No users found.</td></tr>
                ) : data.items.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="admin-user-cell">
                        {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="admin-avatar" /> : <div className="admin-avatar admin-avatar-placeholder">{u.name?.[0] || '?'}</div>}
                        <div>
                          <div className="admin-user-name">{u.name}</div>
                          <div className="admin-mono admin-muted">@{u.username}</div>
                          <div className="admin-mono admin-muted" style={{ fontSize: 10 }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="admin-muted">{u.primaryIdentity}</td>
                    <td><StatusBadge status={u.accountStatus || 'active'} /></td>
                    <td className="admin-center">{u.contentCount}</td>
                    <td className="admin-muted">{fmt(u.createdAt)}</td>
                    <td>
                      <div className="admin-action-btns">
                        {(u.accountStatus === 'active' || !u.accountStatus) && (
                          <button className="admin-btn admin-btn-sm admin-btn-warn" onClick={() => setDialog({ type: 'suspend', user: u })}>Suspend</button>
                        )}
                        {(u.accountStatus === 'suspended' || u.accountStatus === 'banned') && (
                          <button className="admin-btn admin-btn-sm admin-btn-success" onClick={() => setDialog({ type: 'restore', user: u })}>Restore</button>
                        )}
                        {u.accountStatus !== 'banned' && (
                          <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => setDialog({ type: 'ban', user: u })}>Ban</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={data.pages} onPage={p => load(p)} />
        </>
      )}

      {dialog?.type === 'suspend' && (
        <ConfirmDialog title={`Suspend @${dialog.user.username}?`} message="The user will be blocked from all restricted operations. Enter a reason:" confirmLabel="Suspend" danger requireReason
          onConfirm={r => doAction(dialog.user.id, 'suspend', r, `@${dialog.user.username} has been suspended.`)}
          onCancel={() => setDialog(null)} />
      )}
      {dialog?.type === 'restore' && (
        <ConfirmDialog title={`Restore @${dialog.user.username}?`} message="This will re-enable the account." confirmLabel="Restore"
          onConfirm={() => doAction(dialog.user.id, 'restore', 'Restored by admin', `@${dialog.user.username} has been restored.`)}
          onCancel={() => setDialog(null)} />
      )}
      {dialog?.type === 'ban' && (
        <ConfirmDialog title={`Permanently ban @${dialog.user.username}?`} message="This is a permanent ban. The user will be blocked indefinitely. Provide a reason:" confirmLabel="Ban" danger requireReason
          onConfirm={r => doAction(dialog.user.id, 'ban', r, `@${dialog.user.username} has been banned.`)}
          onCancel={() => setDialog(null)} />
      )}
    </div>
  )
}

// ─── Content ──────────────────────────────────────────────────────────────────
function ContentSection() {
  const [data, setData] = useState({ items: [], total: 0, pages: 1 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState(null)
  const [msg, setMsg] = useState('')

  const load = useCallback(async (p = 1) => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ page: p, limit: 20 })
      if (search) params.set('search', search)
      if (typeFilter) params.set('type', typeFilter)
      if (statusFilter) params.set('status', statusFilter)
      const result = await adminRequest(`/content?${params}`)
      setData(result); setPage(p)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [search, typeFilter, statusFilter])

  useEffect(() => { load(1) }, [load])

  const doRemove = async (id, reason) => {
    await adminRequest(`/content/${id}/remove`, { method: 'PATCH', body: JSON.stringify({ reason }) })
    setMsg('Content removed from public access.'); setDialog(null); load(page)
    setTimeout(() => setMsg(''), 3000)
  }

  const doRestore = async (id) => {
    await adminRequest(`/content/${id}/restore`, { method: 'PATCH', body: JSON.stringify({ reason: 'Restored by admin' }) })
    setMsg('Content restored.'); setDialog(null); load(page)
    setTimeout(() => setMsg(''), 3000)
  }

  const doDelete = async (id, reason) => {
    await adminRequest(`/content/${id}`, { method: 'DELETE', body: JSON.stringify({ reason, confirmed: true }) })
    setMsg('Content permanently deleted.'); setDialog(null); load(page)
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Films, Scripts & Stories</h2>
      <div className="admin-filter-row">
        <input className="admin-input admin-search" placeholder="Search title…" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1)} />
        <select className="admin-select" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setTimeout(() => load(1), 0) }}>
          <option value="">All types</option>
          <option value="film">Film</option>
          <option value="script">Script</option>
          <option value="story">Story</option>
          <option value="trailer">Trailer</option>
          <option value="bts">BTS</option>
        </select>
        <select className="admin-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setTimeout(() => load(1), 0) }}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="removed">Removed</option>
        </select>
        <button className="admin-btn admin-btn-primary" onClick={() => load(1)}>Search</button>
      </div>
      {msg && <div className="admin-success">{msg}</div>}
      {error && <div className="admin-error">{error}</div>}
      {loading ? <div className="admin-loading">Loading content…</div> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Title</th><th>Type</th><th>Creator</th><th>Status</th><th>Reports</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {data.items.length === 0 ? <tr><td colSpan={7} className="admin-empty">No content found.</td></tr>
                  : data.items.map(c => (
                    <tr key={c._id}>
                      <td><div className="admin-content-title">{c.title}</div></td>
                      <td><span className="admin-mono">{c.type}</span></td>
                      <td className="admin-muted">@{c.creator?.username || '—'}</td>
                      <td><StatusBadge status={c.moderationStatus || 'published'} /></td>
                      <td className="admin-center">{c.reportCount > 0 ? <span className="admin-badge-warn">{c.reportCount}</span> : '0'}</td>
                      <td className="admin-muted">{fmt(c.createdAt)}</td>
                      <td>
                        <div className="admin-action-btns">
                          {(c.moderationStatus === 'published' || !c.moderationStatus) && (
                            <button className="admin-btn admin-btn-sm admin-btn-warn" onClick={() => setDialog({ type: 'remove', item: c })}>Remove</button>
                          )}
                          {c.moderationStatus === 'removed' && (
                            <button className="admin-btn admin-btn-sm admin-btn-success" onClick={() => setDialog({ type: 'restore', item: c })}>Restore</button>
                          )}
                          <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => setDialog({ type: 'delete', item: c })}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={data.pages} onPage={p => load(p)} />
        </>
      )}
      {dialog?.type === 'remove' && (
        <ConfirmDialog title={`Remove "${dialog.item.title}"?`} message="This will hide the content from all public views. Enter a reason:" confirmLabel="Remove" danger requireReason
          onConfirm={r => doRemove(dialog.item._id, r)} onCancel={() => setDialog(null)} />
      )}
      {dialog?.type === 'restore' && (
        <ConfirmDialog title={`Restore "${dialog.item.title}"?`} message="This will make the content publicly visible again." confirmLabel="Restore"
          onConfirm={() => doRestore(dialog.item._id)} onCancel={() => setDialog(null)} />
      )}
      {dialog?.type === 'delete' && (
        <ConfirmDialog title={`Permanently delete "${dialog.item.title}"?`} message="This CANNOT be undone. All comments and reports for this item will also be deleted. Enter a reason:" confirmLabel="Delete Permanently" danger requireReason requireConfirmText="DELETE"
          onConfirm={r => doDelete(dialog.item._id, r)} onCancel={() => setDialog(null)} />
      )}
    </div>
  )
}

// ─── Equipment ────────────────────────────────────────────────────────────────
function EquipmentSection() {
  const [data, setData] = useState({ items: [], total: 0, pages: 1 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState(null)
  const [msg, setMsg] = useState('')

  const load = useCallback(async (p = 1) => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ page: p, limit: 20 })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const result = await adminRequest(`/equipment?${params}`)
      setData(result); setPage(p)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [search, statusFilter])

  useEffect(() => { load(1) }, [load])

  const doAction = async (id, endpoint, reason, okMsg) => {
    await adminRequest(`/equipment/${id}/${endpoint}`, { method: 'PATCH', body: JSON.stringify({ reason }) })
    setMsg(okMsg); setDialog(null); load(page)
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Equipment Marketplace</h2>
      <div className="admin-filter-row">
        <input className="admin-input admin-search" placeholder="Search title or category…" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1)} />
        <select className="admin-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setTimeout(() => load(1), 0) }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="admin-btn admin-btn-primary" onClick={() => load(1)}>Search</button>
      </div>
      {msg && <div className="admin-success">{msg}</div>}
      {error && <div className="admin-error">{error}</div>}
      {loading ? <div className="admin-loading">Loading equipment…</div> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Title</th><th>Category</th><th>Seller</th><th>Status</th><th>Reports</th><th>Listed</th><th>Actions</th></tr></thead>
              <tbody>
                {data.items.length === 0 ? <tr><td colSpan={7} className="admin-empty">No equipment found.</td></tr>
                  : data.items.map(e => (
                    <tr key={e.id}>
                      <td><div className="admin-content-title">{e.title}</div></td>
                      <td className="admin-muted">{e.category}</td>
                      <td className="admin-muted">@{e.seller?.username || '—'}</td>
                      <td><StatusBadge status={e.active ? 'active' : 'removed'} /></td>
                      <td className="admin-center">{e.reportCount > 0 ? <span className="admin-badge-warn">{e.reportCount}</span> : '0'}</td>
                      <td className="admin-muted">{fmt(e.createdAt)}</td>
                      <td>
                        <div className="admin-action-btns">
                          {e.active
                            ? <button className="admin-btn admin-btn-sm admin-btn-warn" onClick={() => setDialog({ type: 'deactivate', item: e })}>Deactivate</button>
                            : <button className="admin-btn admin-btn-sm admin-btn-success" onClick={() => setDialog({ type: 'reactivate', item: e })}>Reactivate</button>
                          }
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={data.pages} onPage={p => load(p)} />
        </>
      )}
      {dialog?.type === 'deactivate' && (
        <ConfirmDialog title={`Remove "${dialog.item.title}"?`} message="This will hide the listing from public access. Provide a reason:" confirmLabel="Deactivate" danger requireReason
          onConfirm={r => doAction(dialog.item.id, 'deactivate', r, 'Listing deactivated.')} onCancel={() => setDialog(null)} />
      )}
      {dialog?.type === 'reactivate' && (
        <ConfirmDialog title={`Reactivate "${dialog.item.title}"?`} message="This listing will become publicly visible again." confirmLabel="Reactivate"
          onConfirm={() => doAction(dialog.item.id, 'reactivate', '', 'Listing reactivated.')} onCancel={() => setDialog(null)} />
      )}
    </div>
  )
}

// ─── Reports ──────────────────────────────────────────────────────────────────
const categoryLabels = {
  nudity_sexual: 'Nudity / Sexual', vulgar_abusive: 'Vulgar / Abusive', harassment_bullying: 'Harassment',
  hate_speech_threats: 'Hate Speech / Threats', illegal_content: 'Illegal Content',
  copyright_infringement: 'Copyright', fraud_scam_impersonation: 'Fraud / Scam', spam: 'Spam', other: 'Other'
}

function Reports() {
  const [data, setData] = useState({ items: [], total: 0, pages: 1 })
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [resolution, setResolution] = useState({ status: '', note: '' })
  const [updating, setUpdating] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async (p = 1) => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ page: p, limit: 20 })
      if (statusFilter) params.set('status', statusFilter)
      const result = await adminRequest(`/reports?${params}`)
      setData(result); setPage(p)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { load(1) }, [load])

  const handleUpdate = async () => {
    if (!resolution.status) return
    setUpdating(true)
    try {
      await adminRequest(`/reports/${selected._id}`, { method: 'PATCH', body: JSON.stringify({ status: resolution.status, resolutionNote: resolution.note }) })
      setMsg('Report updated.'); setSelected(null); load(page)
      setTimeout(() => setMsg(''), 3000)
    } catch (e) { setError(e.message) }
    finally { setUpdating(false) }
  }

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">User Reports</h2>
      <div className="admin-filter-row">
        <select className="admin-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setTimeout(() => load(1), 0) }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>
      {msg && <div className="admin-success">{msg}</div>}
      {error && <div className="admin-error">{error}</div>}
      {loading ? <div className="admin-loading">Loading reports…</div> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Category</th><th>Target Type</th><th>Reporter</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
              <tbody>
                {data.items.length === 0 ? <tr><td colSpan={6} className="admin-empty">No reports found.</td></tr>
                  : data.items.map(r => (
                    <tr key={r._id}>
                      <td>{categoryLabels[r.category] || r.category}</td>
                      <td><span className="admin-mono">{r.contentType}</span></td>
                      <td className="admin-muted">@{r.reporter?.username || '—'}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td className="admin-muted">{fmt(r.createdAt)}</td>
                      <td>
                        <button className="admin-btn admin-btn-sm admin-btn-primary" onClick={() => { setSelected(r); setResolution({ status: '', note: '' }) }}>Review</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={data.pages} onPage={p => load(p)} />
        </>
      )}

      {selected && (
        <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="admin-modal admin-modal-wide">
            <h3 className="admin-modal-title">Review Report</h3>
            <div className="admin-report-grid">
              <div><span className="admin-label">Category</span><div>{categoryLabels[selected.category]}</div></div>
              <div><span className="admin-label">Content Type</span><div className="admin-mono">{selected.contentType}</div></div>
              <div><span className="admin-label">Content ID</span><div className="admin-mono" style={{ fontSize: 11, wordBreak: 'break-all' }}>{String(selected.contentId)}</div></div>
              <div><span className="admin-label">Reporter</span><div>@{selected.reporter?.username || '—'}</div></div>
              <div><span className="admin-label">Status</span><div><StatusBadge status={selected.status} /></div></div>
              <div><span className="admin-label">Submitted</span><div>{fmtFull(selected.createdAt)}</div></div>
            </div>
            {selected.explanation && <div style={{ margin: '14px 0' }}><span className="admin-label">Reporter's Explanation</span><p className="admin-report-note">{selected.explanation}</p></div>}
            {selected.resolutionNote && <div style={{ margin: '14px 0' }}><span className="admin-label">Previous Resolution Note</span><p className="admin-report-note">{selected.resolutionNote}</p></div>}
            <div style={{ margin: '20px 0 10px' }}>
              <label className="admin-label">Update Status</label>
              <select className="admin-select" style={{ display: 'block', width: '100%', marginTop: 8 }} value={resolution.status} onChange={e => setResolution(r => ({ ...r, status: e.target.value }))}>
                <option value="">Select new status…</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="admin-label">Resolution Note (optional)</label>
              <textarea className="admin-textarea" style={{ marginTop: 8 }} rows={3} value={resolution.note} onChange={e => setResolution(r => ({ ...r, note: e.target.value }))} placeholder="Internal note about this decision…" />
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn-ghost" onClick={() => setSelected(null)}>Close</button>
              <button className="admin-btn admin-btn-primary" onClick={handleUpdate} disabled={!resolution.status || updating}>{updating ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
function AuditLogSection() {
  const [data, setData] = useState({ items: [], total: 0, pages: 1 })
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (p = 1) => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ page: p, limit: 25 })
      if (typeFilter) params.set('targetType', typeFilter)
      const result = await adminRequest(`/audit?${params}`)
      setData(result); setPage(p)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [typeFilter])

  useEffect(() => { load(1) }, [load])

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Audit Log</h2>
      <div className="admin-filter-row">
        <select className="admin-select" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setTimeout(() => load(1), 0) }}>
          <option value="">All types</option>
          <option value="user">User</option>
          <option value="content">Content</option>
          <option value="equipment">Equipment</option>
          <option value="comment">Comment</option>
          <option value="report">Report</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {error && <div className="admin-error">{error}</div>}
      {loading ? <div className="admin-loading">Loading audit log…</div> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Action</th><th>Target</th><th>Type</th><th>Reason</th><th>Admin</th><th>Time</th></tr></thead>
              <tbody>
                {data.items.length === 0 ? <tr><td colSpan={6} className="admin-empty">No audit entries found.</td></tr>
                  : data.items.map(a => (
                    <tr key={a._id}>
                      <td><span className="admin-mono">{a.action}</span></td>
                      <td>{a.targetLabel || <span className="admin-mono" style={{ fontSize: 10 }}>{String(a.targetId)}</span>}</td>
                      <td><span className="admin-mono">{a.targetType}</span></td>
                      <td className="admin-muted admin-truncate">{a.reason || '—'}</td>
                      <td><span className="admin-mono">{a.adminUsername}</span></td>
                      <td className="admin-muted">{fmtFull(a.createdAt)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={data.pages} onPage={p => load(p)} />
        </>
      )}
    </div>
  )
}

function CommunityRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try { setRequests(await adminRequest('/community-requests?status=pending')) }
    catch (requestError) { setError(requestError.message || 'Unable to load community requests.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const review = async (request, decision) => {
    setBusyId(request.id)
    setError('')
    setMessage('')
    try {
      await adminRequest(`/community-requests/${request.id}`, { method: 'PATCH', body: JSON.stringify({ decision }) })
      setMessage(`${request.user.name} ${decision === 'approve' ? 'was approved for' : 'was declined from'} ${request.community.name}.`)
      await load()
    } catch (requestError) { setError(requestError.message || 'Unable to review this request.') }
    finally { setBusyId('') }
  }

  return <div className="admin-section">
    <div className="admin-showcase-heading">
      <div><h2 className="admin-section-title">Community access requests</h2><p className="admin-muted">Review new requests for the studio’s public communities.</p></div>
      <button className="admin-btn admin-btn-ghost" onClick={load} disabled={loading}>Refresh</button>
    </div>
    {error && <div className="admin-error" role="alert">{error}</div>}
    {message && <div className="admin-success" role="status">{message}</div>}
    {loading ? <div className="admin-loading">Loading requests…</div> : <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>Community</th><th>Applicant</th><th>Note</th><th>Requested</th><th>Review</th></tr></thead>
        <tbody>{requests.length === 0 ? <tr><td colSpan={5} className="admin-empty">No pending membership requests.</td></tr> : requests.map(request => <tr key={request.id}>
          <td><div className="admin-content-title">{request.community.name}</div></td>
          <td><div className="admin-content-title">{request.user.name}</div><div className="admin-muted">@{request.user.username}</div></td>
          <td className="admin-muted">{request.message || '—'}</td>
          <td className="admin-muted">{fmtFull(request.requestedAt)}</td>
          <td><div className="admin-action-btns"><button className="admin-btn admin-btn-success admin-btn-sm" disabled={Boolean(busyId)} onClick={() => review(request, 'approve')}>{busyId === request.id ? 'Saving…' : 'Approve'}</button><button className="admin-btn admin-btn-danger admin-btn-sm" disabled={Boolean(busyId)} onClick={() => review(request, 'reject')}>Decline</button></div></td>
        </tr>)}</tbody>
      </table>
    </div>}
  </div>
}

// ─── Weekly homepage showcase ────────────────────────────────────────────────
const blankShowcaseEvent = () => ({
  title: '', eventType: 'festival', summary: '', description: '', posterUrl: '', region: '',
  startAt: '', endAt: '', submissionDeadline: '', applicationUrl: '', eventUrl: '', status: 'draft'
})

function localDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function ShowcaseSection() {
  const [week, setWeek] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [events, setEvents] = useState([])
  const [form, setForm] = useState(blankShowcaseEvent)
  const [editingId, setEditingId] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [snapshot, candidateData, eventData] = await Promise.all([
        apiRequest('/showcase/current'),
        adminRequest('/showcase/short-films/candidates'),
        adminRequest('/showcase/events')
      ])
      setWeek({ ...snapshot.week, sources: snapshot.sources, trailerCount: snapshot.trailers?.length || 0 })
      setCandidates(candidateData.items || [])
      setEvents(eventData.items || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const runAction = async action => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const text = await action()
      if (text) setMessage(text)
      await load()
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  const setApproval = item => runAction(async () => {
    const result = await adminRequest(`/showcase/short-films/${item._id}/approval`, {
      method: 'PATCH', body: JSON.stringify({ approved: !item.showcaseApproved })
    })
    return `${item.title} ${result.showcaseApproved ? 'approved for' : 'removed from'} the homepage showcase.`
  })

  const submitEvent = async event => {
    event.preventDefault()
    await runAction(async () => {
      const path = editingId ? `/showcase/events/${editingId}` : '/showcase/events'
      const result = await adminRequest(path, { method: editingId ? 'PATCH' : 'POST', body: JSON.stringify(form) })
      setForm(blankShowcaseEvent())
      setEditingId('')
      return `“${result.title}” saved as ${result.status}.`
    })
  }

  const editEvent = event => {
    setEditingId(event._id)
    setForm({
      title: event.title || '', eventType: event.eventType || 'festival', summary: event.summary || '',
      description: event.description || '', posterUrl: event.posterUrl || '', region: event.region || '',
      startAt: localDateTime(event.startAt), endAt: localDateTime(event.endAt),
      submissionDeadline: localDateTime(event.submissionDeadline), applicationUrl: event.applicationUrl || '',
      eventUrl: event.eventUrl || '', status: event.status || 'draft'
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateEventStatus = event => runAction(async () => {
    const status = event.status === 'published' ? 'draft' : 'published'
    await adminRequest(`/showcase/events/${event._id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
    return `“${event.title}” moved to ${status}.`
  })

  const archiveEvent = event => runAction(async () => {
    await adminRequest(`/showcase/events/${event._id}`, { method: 'DELETE' })
    return `“${event.title}” archived.`
  })

  const refreshTrailers = () => runAction(async () => {
    const result = await adminRequest('/showcase/refresh', { method: 'POST' })
    return `Weekly trailer set refreshed: ${result.trailers?.length || 0} slides.`
  })

  const refreshFestivals = () => runAction(async () => {
    const result = await adminRequest('/showcase/events/refresh', { method: 'POST' })
    return `Festival scan checked ${result.checkedCount} of ${result.sourceCount} official sites; found ${result.opportunityCount} open calls and published or updated ${result.publishedOrUpdated}.${result.errorCount ? ` ${result.errorCount} sites could not be scanned.` : ''}`
  })

  const change = field => event => setForm(current => ({ ...current, [field]: event.target.value }))

  return (
    <div className="admin-section admin-showcase">
      <div className="admin-showcase-heading">
        <div>
          <h2 className="admin-section-title">Weekly homepage showcase</h2>
          <p className="admin-muted">Approve community shorts, scan official festival sites weekly for open film submissions, and curate the homepage listings.</p>
        </div>
        <div className="admin-showcase-heading-actions">
          <button className="admin-btn admin-btn-primary" onClick={refreshFestivals} disabled={busy}>
            {busy ? 'Scanning…' : 'Scan festival sites'}
          </button>
          <button className="admin-btn admin-btn-primary" onClick={refreshTrailers} disabled={busy || !week?.sources?.youtubeConfigured}>
            {busy ? 'Working…' : 'Refresh YouTube picks'}
          </button>
        </div>
      </div>
      {week && <div className="admin-showcase-status">
        <span><b>Week of</b> {week.key}</span>
        <span><b>YouTube</b> {week.sources?.youtubeConfigured ? 'Connected' : 'API key missing'}</span>
        <span><b>Searches</b> {week.sources?.youtubeSearchCount || 0} completed</span>
        <span><b>Trailer slides</b> {week.trailerCount}</span>
        <span><b>Festival scan</b> {week.sources?.festivalScanAt ? `${week.sources.festivalCheckedCount || 0}/${week.sources.festivalSourceCount || 0} sites · ${week.sources.festivalOpportunityCount || 0} open calls · ${fmt(week.sources.festivalScanAt)}` : 'Waiting for first scan'}</span>
        {!!week.sources?.festivalScanErrorCount && <span><b>Scan errors</b> {week.sources.festivalScanErrorCount}</span>}
      </div>}
      {week?.sources?.youtubeConfigured && !week.sources.youtubeSearchCount && <div className="admin-error" role="alert">The YouTube key is configured, but no searches succeeded. Check that YouTube Data API v3 is enabled for its Google Cloud project and that the API key is allowed to call it, then use “Refresh YouTube picks”.</div>}
      {error && <div className="admin-error" role="alert">{error}</div>}
      {message && <div className="admin-success" role="status">{message}</div>}
      {loading ? <div className="admin-loading">Loading weekly showcase…</div> : <>
        <section className="admin-showcase-block">
          <h3 className="admin-sub-title">Short-film shortlist <span className="admin-muted">· highest likes this week</span></h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Film</th><th>Creator</th><th>Likes</th><th>Homepage</th><th>Action</th></tr></thead>
              <tbody>{candidates.length === 0
                ? <tr><td colSpan={5} className="admin-empty">No published short films are available to review yet.</td></tr>
                : candidates.map(item => <tr key={item._id}>
                  <td><div className="admin-content-title">{item.title}</div><div className="admin-muted">{fmt(item.createdAt)}</div></td>
                  <td>{item.creator?.name || item.creator?.username || 'Creator'}</td>
                  <td>{Number(item.likeCount || 0).toLocaleString('en-IN')}</td>
                  <td><StatusBadge status={item.showcaseApproved ? 'featured' : 'not_featured'} /></td>
                  <td><button className={`admin-btn admin-btn-sm ${item.showcaseApproved ? 'admin-btn-warn' : 'admin-btn-success'}`} disabled={busy} onClick={() => setApproval(item)}>{item.showcaseApproved ? 'Unapprove' : 'Approve'}</button></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-showcase-block">
          <h3 className="admin-sub-title">Film festivals & competitions</h3>
          <div className="admin-settings-card admin-event-editor">
            <h4 className="admin-sub-title">{editingId ? 'Edit listing' : 'Add a listing'}</h4>
            <p className="admin-muted">Open calls found on official festival sites are published automatically after a future deadline and a direct HTTPS submission link are confirmed. Edit or archive a listing to take control of it.</p>
            <form onSubmit={submitEvent}>
              <div className="admin-showcase-form-grid">
                <label><span className="admin-label">Title</span><input className="admin-input" value={form.title} onChange={change('title')} maxLength={160} required /></label>
                <label><span className="admin-label">Type</span><select className="admin-select" value={form.eventType} onChange={change('eventType')}><option value="festival">Festival</option><option value="competition">Competition</option><option value="grant">Grant</option><option value="industry-event">Industry event</option></select></label>
                <label><span className="admin-label">Region</span><input className="admin-input" value={form.region} onChange={change('region')} maxLength={100} placeholder="e.g. India · Online" /></label>
                <label><span className="admin-label">Status</span><select className="admin-select" value={form.status} onChange={change('status')}><option value="draft">Draft</option><option value="published">Published</option></select></label>
                <label className="admin-showcase-form-wide"><span className="admin-label">Summary</span><input className="admin-input" value={form.summary} onChange={change('summary')} maxLength={320} /></label>
                <label className="admin-showcase-form-wide"><span className="admin-label">Description</span><textarea className="admin-textarea" value={form.description} onChange={change('description')} maxLength={3000} rows={3} /></label>
                <label><span className="admin-label">Apply-by deadline</span><input className="admin-input" type="datetime-local" value={form.submissionDeadline} onChange={change('submissionDeadline')} /></label>
                <label><span className="admin-label">Event end date</span><input className="admin-input" type="datetime-local" value={form.endAt} onChange={change('endAt')} /></label>
                <label><span className="admin-label">Event start date</span><input className="admin-input" type="datetime-local" value={form.startAt} onChange={change('startAt')} /></label>
                <label><span className="admin-label">Poster image HTTPS URL</span><input className="admin-input" type="url" value={form.posterUrl} onChange={change('posterUrl')} placeholder="https://…" /></label>
                <label className="admin-showcase-form-wide"><span className="admin-label">Application URL · required HTTPS</span><input className="admin-input" type="url" value={form.applicationUrl} onChange={change('applicationUrl')} placeholder="https://festival.example/apply" required /></label>
                <label className="admin-showcase-form-wide"><span className="admin-label">Event information URL</span><input className="admin-input" type="url" value={form.eventUrl} onChange={change('eventUrl')} placeholder="https://…" /></label>
              </div>
              <div className="admin-showcase-form-actions">
                {editingId && <button type="button" className="admin-btn admin-btn-ghost" disabled={busy} onClick={() => { setEditingId(''); setForm(blankShowcaseEvent()) }}>Cancel edit</button>}
                <button className="admin-btn admin-btn-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : editingId ? 'Save changes' : 'Add event'}</button>
              </div>
            </form>
          </div>
          <div className="admin-table-wrap admin-event-table">
            <table className="admin-table">
              <thead><tr><th>Listing</th><th>Status</th><th>Deadline / end</th><th>Actions</th></tr></thead>
              <tbody>{events.length === 0
                ? <tr><td colSpan={4} className="admin-empty">No festival listings added yet.</td></tr>
                : events.map(event => <tr key={event._id}>
                  <td><div className="admin-content-title">{event.title}</div><div className="admin-muted">{event.region || event.eventType}{event.autoManaged && event.sourceUrl && <> · Auto-found at <a href={event.sourceUrl} target="_blank" rel="noreferrer">official site</a></>}</div></td>
                  <td><StatusBadge status={event.status} /></td>
                  <td className="admin-muted">{fmt(event.submissionDeadline || event.endAt)}</td>
                  <td><div className="admin-action-btns">
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" disabled={busy} onClick={() => editEvent(event)}>Edit</button>
                    <button className={`admin-btn admin-btn-sm ${event.status === 'published' ? 'admin-btn-warn' : 'admin-btn-success'}`} disabled={busy} onClick={() => updateEventStatus(event)}>{event.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                    {event.status !== 'archived' && <button className="admin-btn admin-btn-danger admin-btn-sm" disabled={busy} onClick={() => archiveEvent(event)}>Archive</button>}
                  </div></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </section>
      </>}
    </div>
  )
}

// ─── Admin Settings ───────────────────────────────────────────────────────────
function AdminSettings({ admin }) {
  const { updateToken, clearAdminSession } = useAdminSession()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setMsg('')
    if (form.newPassword !== form.confirmPassword) { setError('New passwords do not match.'); return }
    if (form.newPassword.length < 10) { setError('New password must be at least 10 characters.'); return }
    setLoading(true)
    try {
      const data = await adminRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      })
      updateToken(data.token)
      setMsg('Password changed successfully.')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Admin Settings</h2>
      <div className="admin-settings-card">
        <div className="admin-settings-row">
          <div className="admin-label">Logged in as</div>
          <div><strong>{admin.displayName}</strong> <span className="admin-mono admin-muted">({admin.username})</span></div>
        </div>
        {admin.lastLoginAt && <div className="admin-settings-row"><div className="admin-label">Last login</div><div className="admin-muted">{fmtFull(admin.lastLoginAt)}</div></div>}
      </div>
      <div className="admin-settings-card" style={{ marginTop: 24 }}>
        <h3 className="admin-sub-title">Change Password</h3>
        <form onSubmit={handleSubmit} style={{ maxWidth: 380 }}>
          {['currentPassword', 'newPassword', 'confirmPassword'].map(field => (
            <div key={field} style={{ marginBottom: 14 }}>
              <label className="admin-label">{field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}</label>
              <input className="admin-input" style={{ marginTop: 6 }} type="password" value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} required />
            </div>
          ))}
          {error && <p className="admin-error">{error}</p>}
          {msg && <p className="admin-success">{msg}</p>}
          <button className="admin-btn admin-btn-primary" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Change Password'}</button>
        </form>
      </div>
      <div className="admin-settings-card" style={{ marginTop: 24 }}>
        <h3 className="admin-sub-title" style={{ color: '#e84738' }}>Session</h3>
        <button className="admin-btn admin-btn-danger" onClick={clearAdminSession}>Sign Out</button>
      </div>
    </div>
  )
}

// ─── Shell / Layout ───────────────────────────────────────────────────────────
const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'content', label: 'Films & Content' },
  { id: 'showcase', label: 'Weekly Showcase' },
  { id: 'communities', label: 'Community Requests' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'reports', label: 'Reports' },
  { id: 'audit', label: 'Audit Log' },
  { id: 'settings', label: 'Settings' }
]

function AdminShell({ admin }) {
  const { clearAdminSession } = useAdminSession()
  const [activeTab, setActiveTab] = useState('overview')

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <Overview />
      case 'users': return <Users />
      case 'content': return <ContentSection />
      case 'showcase': return <ShowcaseSection />
      case 'communities': return <CommunityRequests />
      case 'equipment': return <EquipmentSection />
      case 'reports': return <Reports />
      case 'audit': return <AuditLogSection />
      case 'settings': return <AdminSettings admin={admin} />
      default: return <Overview />
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span className="admin-logo-mark">A</span>
          <div>
            <div className="admin-sidebar-name">MG Admin</div>
            <div className="admin-sidebar-sub">A-MAX Platform</div>
          </div>
        </div>
        <nav className="admin-nav">
          {NAV.map(item => (
            <button key={item.id} className={`admin-nav-item${activeTab === item.id ? ' active' : ''}`} onClick={() => setActiveTab(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="admin-avatar admin-avatar-placeholder">{admin.username?.[0]?.toUpperCase() || 'A'}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{admin.displayName}</div>
              <div style={{ fontSize: 10, color: '#777' }}>Administrator</div>
            </div>
          </div>
          <button className="admin-btn admin-btn-ghost admin-signout-btn" onClick={clearAdminSession}>Sign Out</button>
        </div>
      </aside>
      <main className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar-title">{NAV.find(n => n.id === activeTab)?.label}</div>
        </div>
        <div className="admin-content-wrap">{renderTab()}</div>
      </main>
    </div>
  )
}

// ─── Root Export ──────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { token, admin, loading, acceptAdminSession, updateToken } = useAdminSession()

  if (loading) return <div className="admin-page-loading">Restoring admin session…</div>
  if (!token || !admin) return <AdminLogin onLogin={data => acceptAdminSession(data)} />
  if (admin.mustChangePassword) return <ChangePasswordForm onDone={newToken => { updateToken(newToken); window.location.reload() }} />
  return <AdminShell admin={admin} />
}
