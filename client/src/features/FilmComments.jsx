import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MessageCircle, Send, Trash2, Flag } from 'lucide-react'
import { useAuthSession } from '../context/AuthSession'
import { apiRequest } from '../services/api'
import ReportModal from './ReportModal'

function formatCommentTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

function CommentItem({ comment, contentId, userId, onChanged, onReply, onError }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.body)
  const [busy, setBusy] = useState(false)
  const [reporting, setReporting] = useState(false)
  const isOwner = String(comment.author?._id) === String(userId)

  const saveEdit = async () => {
    setBusy(true)
    onError('')
    try {
      await apiRequest(`/content/${contentId}/comments/${comment._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ body: draft })
      })
      setEditing(false)
      onChanged()
    } catch (error) {
      onError(error.message || 'Unable to update this comment.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!window.confirm('Delete this comment and any replies? This cannot be undone.')) return
    setBusy(true)
    onError('')
    try {
      await apiRequest(`/content/${contentId}/comments/${comment._id}`, { method: 'DELETE' })
      onChanged()
    } catch (error) {
      onError(error.message || 'Unable to delete this comment.')
    } finally {
      setBusy(false)
    }
  }

  const author = comment.author || {}
  return <article className="film-comment">
    <img src={author.avatarUrl || `https://i.pravatar.cc/80?u=${encodeURIComponent(author.username || author.name || 'amax')}`} alt=""/>
    <div className="film-comment-body">
      <header><strong>{author.username ? <Link to={`/profile/${author.username}`}>{author.name || author.username}</Link> : author.name || 'AMAX member'}</strong><time>{formatCommentTime(comment.createdAt)}</time></header>
      {editing
        ? <><textarea value={draft} maxLength={1000} onChange={event => setDraft(event.target.value)} aria-label="Edit comment"/><div className="film-comment-actions"><button disabled={busy || !draft.trim()} onClick={saveEdit}>Save</button><button disabled={busy} onClick={() => setEditing(false)}>Cancel</button></div></>
        : <p>{comment.body}</p>}
      {!editing && <div className="film-comment-actions">
        {!comment.parent && <button onClick={() => onReply(comment)}>Reply</button>}
        {isOwner && <button onClick={() => { setDraft(comment.body); setEditing(true) }}>Edit</button>}
        {isOwner && <button disabled={busy} onClick={remove}><Trash2 size={13}/> Delete</button>}
        {!isOwner && Boolean(userId) && <button disabled={busy} onClick={() => setReporting(true)} title="Report comment" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Flag size={12}/> Report</button>}
      </div>}
      {reporting && <ReportModal contentType="comment" contentId={comment._id} title="Report Comment" onClose={() => setReporting(false)} />}
      {comment.replies?.length > 0 && <div className="film-comment-replies">{comment.replies.map(reply => <CommentItem key={reply._id} comment={reply} contentId={contentId} userId={userId} onChanged={onChanged} onReply={onReply} onError={onError}/>)}</div>}
    </div>
  </article>
}

export default function FilmComments({ contentId }) {
  const { user } = useAuthSession()
  const navigate = useNavigate()
  const [comments, setComments] = useState([])
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const requestId = useRef('')
  const attemptedBody = useRef('')

  const loadComments = async (nextPage = 1, append = false) => {
    setLoading(!append)
    setError('')
    try {
      const result = await apiRequest(`/content/${encodeURIComponent(contentId)}/comments?page=${nextPage}&limit=30`)
      setComments(current => append ? [...current, ...result.comments] : result.comments)
      setHasMore(result.hasMore)
      setTotal(result.total)
      setPage(result.page)
    } catch (requestError) {
      setError(requestError.message || 'Unable to load comments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [contentId])

  const submit = async event => {
    event.preventDefault()
    if (!user) {
      navigate('/login', { state: { from: `/?film=${encodeURIComponent(contentId)}` } })
      return
    }
    const body = draft.trim()
    if (!body || posting) return
    const requestShape = `${replyTo?._id || ''}:${body}`
    if (attemptedBody.current !== requestShape) requestId.current = crypto.randomUUID()
    attemptedBody.current = requestShape
    setPosting(true)
    setError('')
    try {
      await apiRequest(`/content/${encodeURIComponent(contentId)}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body, clientRequestId: requestId.current, ...(replyTo ? { parent: replyTo._id } : {}) })
      })
      setDraft('')
      setReplyTo(null)
      requestId.current = ''
      attemptedBody.current = ''
      await loadComments()
    } catch (requestError) {
      setError(requestError.message || 'Unable to post your comment.')
    } finally {
      setPosting(false)
    }
  }

  return <section className="film-comments" id="film-discussion" aria-label="Film discussion">
    <div className="film-comment-heading"><h2><MessageCircle size={18}/> Discussion</h2><span>{total}</span></div>
    <form className="film-comment-form" onSubmit={submit}>
      {replyTo && <div className="film-replying">Replying to {replyTo.author?.name || 'comment'} <button type="button" onClick={() => setReplyTo(null)}>Cancel</button></div>}
      <textarea id="film-comment-input" value={draft} maxLength={1000} onChange={event => setDraft(event.target.value)} placeholder={user ? 'Add to the conversation…' : 'Sign in to join the conversation…'} aria-label="Write a comment"/>
      <button className="primary-button" disabled={posting || !draft.trim()}><Send size={14}/>{posting ? 'Posting…' : 'Post'}</button>
    </form>
    {error && <p className="film-comment-error" role="alert">{error}</p>}
    {loading && comments.length === 0 ? <p className="film-comments-empty">Loading comments…</p>
      : comments.length ? <div className="film-comment-list">{comments.map(comment => <CommentItem key={comment._id} comment={comment} contentId={contentId} userId={user?.id} onChanged={() => loadComments()} onReply={setReplyTo} onError={setError}/>)}</div>
        : <p className="film-comments-empty">No comments yet. Start the discussion.</p>}
    {hasMore && <button className="film-comments-more" disabled={loading} onClick={() => loadComments(page + 1, true)}>{loading ? 'Loading…' : 'Load more comments'}</button>}
  </section>
}
