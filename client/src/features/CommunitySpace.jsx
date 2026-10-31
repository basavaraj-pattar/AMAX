import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, LoaderCircle, Plus, Users, X } from 'lucide-react'
import { apiRequest } from '../services/api'
import ChatComposer from '../components/ChatComposer'
import ChatMessageAttachments from '../components/ChatMessageAttachments'

const PAGE_SIZE = 50

function formatMessageTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function createClientMessageId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID().replaceAll('-', '')
  return `${Date.now()}_${Math.random().toString(36).slice(2, 14)}`
}

export default function CommunitySpace({ community, user, socket }) {
  const [channels, setChannels] = useState([])
  const [channelId, setChannelId] = useState('')
  const [messages, setMessages] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [sending, setSending] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [requests, setRequests] = useState([])
  const [requestsOpen, setRequestsOpen] = useState(false)
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [reviewingId, setReviewingId] = useState('')
  const [channelFormOpen, setChannelFormOpen] = useState(false)
  const [channelName, setChannelName] = useState('')
  const [channelDescription, setChannelDescription] = useState('')
  const [creatingChannel, setCreatingChannel] = useState(false)
  const scrollRef = useRef(null)
  const messageEndRef = useRef(null)
  const pendingClientMessageIdRef = useRef(null)

  const loadRequests = useCallback(async () => {
    if (!community.canManage) return
    setRequestsLoading(true)
    try { setRequests(await apiRequest(`/communities/${encodeURIComponent(community.id)}/requests`)) }
    catch (requestError) { setError(requestError.message || 'Unable to load membership requests.') }
    finally { setRequestsLoading(false) }
  }, [community.canManage, community.id])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setMessages([])
    setChannelId('')
    apiRequest(`/communities/${encodeURIComponent(community.id)}/channels`)
      .then(result => {
        if (!active) return
        const availableChannels = result.channels || []
        setChannels(availableChannels)
        setChannelId(current => availableChannels.some(channel => channel.id === current) ? current : availableChannels[0]?.id || '')
      })
      .catch(requestError => { if (active) setError(requestError.message || 'Unable to open this community space.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [community.id])

  useEffect(() => {
    if (community.canManage) loadRequests()
    else { setRequests([]); setRequestsOpen(false) }
  }, [community.canManage, loadRequests])

  useEffect(() => {
    if (!channelId) return undefined
    let active = true
    setLoading(true)
    setError('')
    setMessages([])
    apiRequest(`/communities/${encodeURIComponent(community.id)}/channels/${encodeURIComponent(channelId)}/messages?limit=${PAGE_SIZE}`)
      .then(result => {
        if (!active) return
        setMessages(result.messages || [])
        setHasMore(Boolean(result.hasMore))
        requestAnimationFrame(() => messageEndRef.current?.scrollIntoView({ block: 'end' }))
      })
      .catch(requestError => { if (active) setError(requestError.message || 'Unable to load this discussion.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [channelId, community.id])

  useEffect(() => {
    if (!socket || !community.id) return undefined
    const receiveMessage = message => {
      if (message.communityId !== community.id || message.channelId !== channelId) return
      setMessages(current => current.some(item => item.id === message.id) ? current : [...current, message])
      requestAnimationFrame(() => messageEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }))
    }
    const receiveRequest = event => {
      if (event.communityId === community.id && community.canManage) loadRequests()
    }
    const receiveChannel = event => {
      if (event.communityId !== community.id || !event.channel?.id) return
      setChannels(current => current.some(channel => channel.id === event.channel.id) ? current : [...current, event.channel])
    }
    socket.on('community:message:new', receiveMessage)
    socket.on('community:request:new', receiveRequest)
    socket.on('community:channel:new', receiveChannel)
    socket.emit('community:join', community.id, response => {
      if (response?.error) setError(response.error)
    })
    return () => {
      socket.off('community:message:new', receiveMessage)
      socket.off('community:request:new', receiveRequest)
      socket.off('community:channel:new', receiveChannel)
      socket.emit('community:leave', community.id)
    }
  }, [channelId, community.canManage, community.id, loadRequests, socket])

  const loadOlder = async () => {
    const oldest = messages[0]
    if (!oldest || loadingOlder) return
    setLoadingOlder(true)
    setError('')
    const container = scrollRef.current
    const previousHeight = container?.scrollHeight || 0
    try {
      const query = new URLSearchParams({ limit: String(PAGE_SIZE), before: oldest.createdAt, beforeId: oldest.id })
      const result = await apiRequest(`/communities/${encodeURIComponent(community.id)}/channels/${encodeURIComponent(channelId)}/messages?${query}`)
      setMessages(current => [...(result.messages || []), ...current.filter(item => !(result.messages || []).some(incoming => incoming.id === item.id))])
      setHasMore(Boolean(result.hasMore))
      requestAnimationFrame(() => { if (container) container.scrollTop += container.scrollHeight - previousHeight })
    } catch (requestError) { setError(requestError.message || 'Unable to load older messages.') }
    finally { setLoadingOlder(false) }
  }

  const sendMessage = async ({ body, attachmentIds }) => {
    if ((!body && !attachmentIds.length) || sending || !channelId) return false
    setSending(true)
    setError('')
    try {
      const message = await apiRequest(`/communities/${encodeURIComponent(community.id)}/channels/${encodeURIComponent(channelId)}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body, attachmentIds, clientMessageId: pendingClientMessageIdRef.current || (pendingClientMessageIdRef.current = createClientMessageId()) })
      })
      setMessages(current => current.some(item => item.id === message.id) ? current : [...current, message])
      pendingClientMessageIdRef.current = null
      setDraft('')
      requestAnimationFrame(() => messageEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }))
      return true
    } catch (requestError) { setError(requestError.message || 'Unable to send your message.') }
    finally { setSending(false) }
    return false
  }

  const reviewRequest = async (request, decision) => {
    setReviewingId(request.id)
    setError('')
    try {
      await apiRequest(`/communities/${encodeURIComponent(community.id)}/requests/${encodeURIComponent(request.id)}`, {
        method: 'PATCH', body: JSON.stringify({ decision })
      })
      setRequests(current => current.filter(item => item.id !== request.id))
    } catch (requestError) { setError(requestError.message || 'Unable to review this request.') }
    finally { setReviewingId('') }
  }

  const createChannel = async event => {
    event.preventDefault()
    const name = channelName.trim()
    if (!name || creatingChannel) return
    setCreatingChannel(true)
    setError('')
    try {
      const channel = await apiRequest(`/communities/${encodeURIComponent(community.id)}/channels`, {
        method: 'POST', body: JSON.stringify({ name, description: channelDescription.trim() })
      })
      setChannels(current => [...current, channel])
      setChannelId(channel.id)
      setChannelName('')
      setChannelDescription('')
      setChannelFormOpen(false)
    } catch (requestError) { setError(requestError.message || 'Unable to create this channel.') }
    finally { setCreatingChannel(false) }
  }

  const selectedChannel = channels.find(channel => channel.id === channelId)

  return <section className="chat-panel community-workspace" aria-label={`${community.name} discussion`}>
    <header className="chat-panel-header community-space-header">
      <div className="community-space-identity"><span className="community-space-mark"><Users size={17}/></span><span><strong>{community.name}</strong><small>{Number(community.memberCount || 0).toLocaleString('en-IN')} members · community discussion</small></span></div>
      {community.canManage && <div className="community-manager-actions"><button className="community-channel-create-toggle" onClick={() => setChannelFormOpen(open => !open)}><Plus size={14}/> Channel</button><button className={`community-request-toggle ${requestsOpen ? 'active' : ''}`} onClick={() => { setRequestsOpen(open => !open); if (!requests.length) loadRequests() }}><Users size={14}/> Requests{requests.length ? ` · ${requests.length}` : ''}</button></div>}
    </header>

    {channels.length > 1 && <nav className="community-channel-tabs" aria-label="Discussion channels">{channels.map(channel => <button className={channel.id === channelId ? 'active' : ''} key={channel.id} onClick={() => setChannelId(channel.id)}># {channel.name}</button>)}</nav>}

    {channelFormOpen && community.canManage && <form className="community-channel-form" onSubmit={createChannel}><label>Channel name<input autoFocus maxLength={40} value={channelName} onChange={event => setChannelName(event.target.value)} placeholder="e.g. lighting-talk" required/></label><label>Description<input maxLength={180} value={channelDescription} onChange={event => setChannelDescription(event.target.value)} placeholder="What belongs in this channel?"/></label><button className="primary-button" disabled={creatingChannel || !channelName.trim()}>{creatingChannel ? 'Creating…' : 'Create channel'}</button></form>}

    {requestsOpen && community.canManage && <section className="community-request-review" aria-label="Pending membership requests">
      <div className="community-request-review-heading"><strong>Pending access requests</strong><span>{requests.length}</span></div>
      {requestsLoading ? <p className="community-inline-note">Loading requests…</p> : requests.length ? requests.map(request => <article className="community-request-row" key={request.id}>
        <div className="community-request-person"><strong>{request.user.name}</strong><small>@{request.user.username}{request.message ? ` · ${request.message}` : ''}</small></div>
        <div className="community-request-actions"><button aria-label={`Approve ${request.user.name}`} disabled={Boolean(reviewingId)} onClick={() => reviewRequest(request, 'approve')}><Check size={15}/></button><button aria-label={`Decline ${request.user.name}`} disabled={Boolean(reviewingId)} onClick={() => reviewRequest(request, 'reject')}><X size={15}/></button></div>
      </article>) : <p className="community-inline-note">No pending requests.</p>}
    </section>}

    <div className="community-channel-heading"><span className="community-channel-hash">#</span><div><strong>{selectedChannel?.name || 'General'}</strong><small>{selectedChannel?.description || 'The shared community conversation.'}</small></div></div>
    <div className="community-chat-messages" ref={scrollRef} aria-live="polite">
      {hasMore && !loading && <button className="load-older-messages" disabled={loadingOlder} onClick={loadOlder}>{loadingOlder ? 'Loading…' : 'Load older messages'}</button>}
      {loading && <p className="community-chat-empty"><LoaderCircle size={16} className="message-spinner"/> Loading discussion…</p>}
      {!loading && !messages.length && <div className="community-chat-empty"><span className="community-empty-icon"><Users size={21}/></span><strong>Start the conversation</strong><p>Introduce yourself or share something the {community.name} community can build on.</p></div>}
      {messages.map(message => <article className={`community-message ${message.senderId === user.id ? 'own' : ''}`} key={message.id}>
        <img src={message.senderAvatarUrl || '/profile-avatar-placeholder.svg'} alt=""/>
        <div className="community-message-content"><div className="community-message-meta"><strong>{message.senderName}</strong><small>{formatMessageTime(message.createdAt)}</small></div>{message.body && <p>{message.body}</p>}<ChatMessageAttachments attachments={message.attachments}/></div>
      </article>)}
      <div ref={messageEndRef}/>
    </div>
    {error && <p className="message-error chat-send-error" role="alert">{error}</p>}
    <ChatComposer draft={draft} setDraft={setDraft} sending={sending || loading} onSend={sendMessage} onDraftChange={() => setError('')} className="community-chat-composer" placeholder={`Message #${selectedChannel?.name?.toLowerCase() || 'general'}`} ariaLabel="Community message"/>
  </section>
}
