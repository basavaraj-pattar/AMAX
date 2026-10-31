import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, LoaderCircle, MessageCircle, Search, Users, Wifi, WifiOff } from 'lucide-react'
import DirectionalChevron from '../components/DirectionalChevron'
import ChatComposer from '../components/ChatComposer'
import ChatMessageAttachments from '../components/ChatMessageAttachments'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthSession } from '../context/AuthSession'
import { apiRequest } from '../services/api'
import { readJoinedCommunities } from '../data/communities'
import CommunitySpace from './CommunitySpace'

function timeLabel(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const today = new Date()
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function uniqueMessages(messages) {
  return [...new Map(messages.map(message => [message.id, message])).values()]
}

const messagePreviews = [
  { name: 'Maya Chen', username: 'mayachen', role: 'Director · Cinematographer', avatar: 'https://i.pravatar.cc/160?img=47' },
  { name: 'Elias Ford', username: 'eliasford', role: 'Editor · Storyteller', avatar: 'https://i.pravatar.cc/160?img=12' },
  { name: 'Sofia Reyes', username: 'sofia-reyes', role: 'Documentary filmmaker', avatar: 'https://i.pravatar.cc/160?img=32' }
]

function PublicMessagesPreview() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const people = messagePreviews.filter(person => `${person.name} ${person.role}`.toLowerCase().includes(search.trim().toLowerCase()))
  const goToLogin = () => navigate('/login', { state: { from: '/messages' } })

  useEffect(() => {
    if (searchParams.has('recipient')) {
      navigate('/login', { replace: true, state: { from: `${location.pathname}${location.search}` } })
    }
  }, [location.pathname, location.search, navigate, searchParams])

  return <div className="messages-page messages-preview">
    <div className="messages-heading"><div><span className="eyebrow warm">YOUR STUDIO LINE</span><h1>Messages</h1><p>Meet filmmakers and start a private conversation.</p></div></div>
    <label className="messages-search"><Search size={16}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Discover filmmakers…" aria-label="Search featured filmmakers"/></label>
    <div className="message-preview-layout">
      <section className="message-preview-people">
        <div className="conversation-stack-heading"><span className="eyebrow">Meet the community</span><small>{people.length} filmmakers</small></div>
        <div className="message-list">
          {people.map(person => <article className="message-thread message-preview-person" key={person.username}>
            <img src={person.avatar} alt=""/>
            <div className="message-thread-copy"><div className="message-thread-title"><strong>{person.name}</strong></div><span>@{person.username}</span><p>{person.role}</p></div>
            <button className="outline-button" onClick={goToLogin}>Message <DirectionalChevron size={14}/></button>
          </article>)}
          {!people.length && <p className="message-empty">No filmmakers match your search.</p>}
        </div>
      </section>
      <aside className="message-preview-card">
        <span className="message-preview-icon"><MessageCircle size={23}/></span>
        <span className="eyebrow">PRIVATE, REAL-TIME CONVERSATIONS</span>
        <h2>Your next collaboration starts with a hello.</h2>
        <p>Sign in to find filmmakers, send messages, and keep every conversation in one place.</p>
        <button className="primary-button" onClick={goToLogin}>Sign in to get started <DirectionalChevron size={15}/></button>
      </aside>
    </div>
  </div>
}

function AuthenticatedMessagesPage() {
  const { user, socket, clearSession } = useAuthSession()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [joinedCommunities, setJoinedCommunities] = useState([])
  const [pendingCommunities, setPendingCommunities] = useState([])
  const [communitiesLoading, setCommunitiesLoading] = useState(true)
  const [communityError, setCommunityError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [draft, setDraft] = useState('')
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [sending, setSending] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')
  const [searchError, setSearchError] = useState('')
  const [sendError, setSendError] = useState('')
  const [equipmentRequest, setEquipmentRequest] = useState(null)
  const [equipmentRequestBusy, setEquipmentRequestBusy] = useState(false)
  const [equipmentRequestError, setEquipmentRequestError] = useState('')
  const socketRef = useRef(null)
  const selectedIdRef = useRef(selectedId)
  const messagesEndRef = useRef(null)
  const chatMessagesRef = useRef(null)
  const previousScrollHeightRef = useRef(null)
  const pendingClientMessageIdRef = useRef(null)
  const migratedLegacyCommunitiesRef = useRef(false)
  const selectedCommunitySlug = searchParams.get('community')

  const activeConversation = conversations.find(conversation => conversation.id === selectedId) || null
  const activeCommunity = joinedCommunities.find(community => community.slug === selectedCommunitySlug) || null
  const activePendingCommunity = pendingCommunities.find(community => community.slug === selectedCommunitySlug) || null
  const handleRequestError = useCallback((requestError, setErrorMessage) => {
    if (requestError.status === 401) {
      clearSession()
      navigate('/login', { replace: true })
      return
    }
    setErrorMessage(requestError.message || 'Something went wrong. Please try again.')
  }, [clearSession, navigate])

  const refreshCommunityMembership = useCallback(async ({ migrateLegacy = false } = {}) => {
    setCommunitiesLoading(true)
    setCommunityError('')
    try {
      let membership = await apiRequest('/communities/mine')
      if (migrateLegacy && !migratedLegacyCommunitiesRef.current) {
        const legacyCommunities = readJoinedCommunities()
        if (legacyCommunities.length) {
          const catalog = await apiRequest('/communities')
          for (const legacy of legacyCommunities) {
            const community = catalog.find(item => item.slug === legacy.slug || item.name === legacy.name)
            if (!community || ['member', 'pending'].includes(community.membershipStatus)) continue
            await apiRequest(`/communities/${encodeURIComponent(community.id)}/requests`, { method: 'POST', body: JSON.stringify({}) })
          }
          localStorage.removeItem('a-max-joined-communities')
          window.dispatchEvent(new Event('amax:joined-communities-updated'))
        }
        migratedLegacyCommunitiesRef.current = true
        membership = await apiRequest('/communities/mine')
      }
      setJoinedCommunities(Array.isArray(membership.joined) ? membership.joined : [])
      setPendingCommunities(Array.isArray(membership.pending) ? membership.pending : [])
      return membership
    } catch (requestError) {
      if (requestError.status === 401) handleRequestError(requestError, setCommunityError)
      else setCommunityError(requestError.message || 'Unable to load your communities.')
      throw requestError
    } finally {
      setCommunitiesLoading(false)
    }
  }, [handleRequestError])

  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])

  useEffect(() => {
    refreshCommunityMembership({ migrateLegacy: true }).catch(() => {})
  }, [refreshCommunityMembership, user.id])

  useEffect(() => {
    if (!socket) return undefined
    const handleMembershipUpdate = () => refreshCommunityMembership().catch(() => {})
    socket.on('community:membership:updated', handleMembershipUpdate)
    return () => socket.off('community:membership:updated', handleMembershipUpdate)
  }, [refreshCommunityMembership, socket])

  const refreshConversations = useCallback(async () => {
    const result = await apiRequest('/messages/conversations')
    setConversations(result)
    return result
  }, [])

  useEffect(() => {
    let active = true
    setLoadingConversations(true)
    setError('')
    refreshConversations()
      .catch(requestError => { if (active) handleRequestError(requestError, setError) })
      .finally(() => { if (active) setLoadingConversations(false) })
    return () => { active = false }
  }, [handleRequestError, refreshConversations, user.id])

  useEffect(() => {
    const query = search.trim()
    setSearchError('')
    if (query.length < 2) {
      setSearchResults([])
      return undefined
    }
    let active = true
    const timer = window.setTimeout(() => {
      apiRequest(`/messages/users?q=${encodeURIComponent(query)}`)
        .then(results => { if (active) setSearchResults(results) })
        .catch(requestError => { if (active) handleRequestError(requestError, setSearchError) })
    }, 250)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [handleRequestError, search])

  useEffect(() => {
    if (!socket) {
      socketRef.current = null
      setConnected(false)
      return undefined
    }
    socketRef.current = socket
    const handleConnect = () => {
      setConnected(true)
      refreshConversations().catch(requestError => handleRequestError(requestError, setError))
      const selectedId = selectedIdRef.current
      if (selectedId) {
        socket.emit('conversation:join', selectedId, result => {
          if (result?.error) setError(result.error)
        })
        apiRequest(`/messages/conversations/${selectedId}/messages`)
          .then(result => {
            setMessages(current => uniqueMessages([...current, ...result.messages]))
            setHasMore(result.hasMore)
            return apiRequest(`/messages/conversations/${selectedId}/read`, { method: 'POST' })
          })
          .then(() => refreshConversations())
          .catch(requestError => handleRequestError(requestError, setError))
      }
    }
    const handleDisconnect = () => setConnected(false)
    const handleConnectError = socketError => {
      setConnected(false)
      if (/expired|invalid session|authentication required/i.test(socketError.message)) {
        clearSession()
        navigate('/login', { replace: true })
      } else {
        setError(socketError.message || 'Live messaging is temporarily unavailable.')
      }
    }
    const handleMessage = message => {
      if (selectedIdRef.current === message.conversationId) {
        setMessages(current => uniqueMessages([...current, message]))
        apiRequest(`/messages/conversations/${message.conversationId}/read`, { method: 'POST' })
          .then(() => refreshConversations())
          .catch(requestError => handleRequestError(requestError, setError))
      }
    }
    const handleConversationUpdated = () => {
      refreshConversations().catch(requestError => handleRequestError(requestError, setError))
    }
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.on('message:new', handleMessage)
    socket.on('conversation:updated', handleConversationUpdated)
    if (socket.connected) handleConnect()
    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.off('message:new', handleMessage)
      socket.off('conversation:updated', handleConversationUpdated)
      if (socketRef.current === socket) socketRef.current = null
    }
  }, [clearSession, handleRequestError, navigate, refreshConversations, socket])

  useEffect(() => {
    pendingClientMessageIdRef.current = null
    if (!selectedId) {
      setMessages([])
      return undefined
    }
    let active = true
    setMessages([])
    setLoadingMessages(true)
    setHasMore(false)
    setSendError('')
    const socket = socketRef.current
    if (socket?.connected) socket.emit('conversation:join', selectedId, result => {
      if (result?.error) setError(result.error)
    })
    apiRequest(`/messages/conversations/${selectedId}/messages`)
      .then(async result => {
        if (!active) return
        setMessages(result.messages)
        setHasMore(result.hasMore)
        await apiRequest(`/messages/conversations/${selectedId}/read`, { method: 'POST' })
        if (active) await refreshConversations()
      })
      .catch(requestError => { if (active) handleRequestError(requestError, setError) })
      .finally(() => { if (active) setLoadingMessages(false) })
    return () => {
      active = false
      if (socket?.connected) socket.emit('conversation:leave', selectedId)
    }
  }, [handleRequestError, refreshConversations, selectedId])

  const equipmentListingId = searchParams.get('listing')
  const equipmentRequestId = searchParams.get('request')

  useEffect(() => {
    let active = true
    if (equipmentListingId && selectedId) {
      setEquipmentRequest(null)
      setEquipmentRequestError('')
      const requestQuery = equipmentRequestId ? `?request=${encodeURIComponent(equipmentRequestId)}` : ''
      const buyerParam = activeConversation?.participant?.id ? `&buyer=${encodeURIComponent(activeConversation.participant.id)}` : ''
      apiRequest(`/equipment/${encodeURIComponent(equipmentListingId)}/request${requestQuery ? `${requestQuery}${buyerParam}` : `?${buyerParam.slice(1)}`}`)
        .then(result => { if (active) setEquipmentRequest({ ...result, listingId: equipmentListingId }) })
        .catch(requestError => {
          if (active) setEquipmentRequestError(requestError.message || 'Unable to load the listing request.')
        })
    } else if (!equipmentListingId && activeConversation?.participant?.id) {
      apiRequest(`/equipment/chat-context/${encodeURIComponent(activeConversation.participant.id)}`)
        .then(result => {
          if (active && result) setEquipmentRequest(result)
          else if (active) setEquipmentRequest(null)
        })
        .catch(() => { if (active) setEquipmentRequest(null) })
    } else {
      setEquipmentRequest(null)
      setEquipmentRequestError('')
    }
    return () => { active = false }
  }, [activeConversation?.participant?.id, equipmentListingId, equipmentRequestId, selectedId])

  useEffect(() => {
    const targetListingId = equipmentListingId || equipmentRequest?.listingId
    if (!targetListingId) return undefined
    let active = true
    const refreshEquipmentRequest = event => {
      if (event.listingId !== targetListingId) return
      const requestQuery = equipmentRequestId ? `?request=${encodeURIComponent(equipmentRequestId)}` : ''
      apiRequest(`/equipment/${encodeURIComponent(targetListingId)}/request${requestQuery}`)
        .then(result => { if (active) setEquipmentRequest({ ...result, listingId: targetListingId }) })
        .catch(requestError => {
          if (active) setEquipmentRequestError(requestError.message || 'Unable to refresh the listing request.')
        })
    }
    socket?.on('equipment:request:updated', refreshEquipmentRequest)
    return () => {
      active = false
      socket?.off('equipment:request:updated', refreshEquipmentRequest)
    }
  }, [equipmentListingId, equipmentRequest?.listingId, equipmentRequestId, socket])

  useEffect(() => {
    if (previousScrollHeightRef.current !== null && chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop += chatMessagesRef.current.scrollHeight - previousScrollHeightRef.current
      previousScrollHeightRef.current = null
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, selectedId])

  const openRecipient = useCallback(async recipient => {
    setSearchError('')
    setSearch('')
    try {
      const conversation = await apiRequest('/messages/conversations', {
        method: 'POST',
        body: JSON.stringify({ recipientId: recipient.id })
      })
      setConversations(current => [conversation, ...current.filter(item => item.id !== conversation.id)])
      setSelectedId(conversation.id)
    } catch (requestError) {
      handleRequestError(requestError, setSearchError)
    }
  }, [handleRequestError])

  useEffect(() => {
    const recipientName = searchParams.get('recipient')?.trim()
    if (!recipientName) return
    let active = true
    setSearch(recipientName)
    apiRequest(`/messages/users?q=${encodeURIComponent(recipientName)}`)
      .then(async results => {
        if (!active) return
        const normalizedTarget = recipientName.toLowerCase().replace(/^@/, '')
        const recipient = results.find(person =>
          person.name.toLowerCase() === normalizedTarget
          || person.username.toLowerCase() === normalizedTarget
          || person.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === normalizedTarget
        )
        if (!recipient) {
          setSearchError(`Could not find ${recipientName} in the AMAX messaging network.`)
          return
        }
        await openRecipient(recipient)
        if (active) setSearchParams(current => {
          const next = new URLSearchParams(current)
          next.delete('recipient')
          return next
        }, { replace: true })
      })
      .catch(requestError => {
        if (active) handleRequestError(requestError, setSearchError)
      })
    return () => { active = false }
  }, [handleRequestError, openRecipient, searchParams, setSearchParams])

  const loadOlderMessages = async () => {
    if (!messages.length || loadingOlder || !hasMore) return
    setLoadingOlder(true)
    setError('')
    try {
      if (chatMessagesRef.current) previousScrollHeightRef.current = chatMessagesRef.current.scrollHeight
      const cursor = encodeURIComponent(messages[0].createdAt)
      const beforeId = encodeURIComponent(messages[0].id)
      const result = await apiRequest(`/messages/conversations/${selectedId}/messages?before=${cursor}&beforeId=${beforeId}`)
      setMessages(current => uniqueMessages([...result.messages, ...current]))
      setHasMore(result.hasMore)
    } catch (requestError) {
      handleRequestError(requestError, setError)
    } finally {
      setLoadingOlder(false)
    }
  }

  const sendMessage = async ({ body, attachmentIds }) => {
    if ((!body && !attachmentIds.length) || !activeConversation || sending) return false
    setSending(true)
    setSendError('')
    try {
      const message = await apiRequest(`/messages/conversations/${selectedId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body, attachmentIds, clientMessageId: pendingClientMessageIdRef.current || (pendingClientMessageIdRef.current = crypto.randomUUID()) })
      })
      setMessages(current => uniqueMessages([...current, message]))
      pendingClientMessageIdRef.current = null
      setDraft('')
      refreshConversations().catch(requestError => setError(requestError.message || 'Unable to refresh conversations.'))
      return true
    } catch (requestError) {
      handleRequestError(requestError, setSendError)
      return false
    } finally {
      setSending(false)
    }
  }

  const requestEquipment = async () => {
    const targetListingId = equipmentListingId || equipmentRequest?.listingId
    if (!targetListingId || equipmentRequestBusy) return
    setEquipmentRequestBusy(true)
    setEquipmentRequestError('')
    try {
      const result = await apiRequest(`/equipment/${encodeURIComponent(targetListingId)}/request`, { method: 'POST' })
      setEquipmentRequest(current => ({ ...(current || {}), ...result, listingId: targetListingId }))
    } catch (requestError) {
      setEquipmentRequestError(requestError.message || 'Unable to send the seller a request.')
    } finally {
      setEquipmentRequestBusy(false)
    }
  }

  const approveEquipmentRequest = async () => {
    if (!equipmentRequest?.requestId || equipmentRequestBusy) return
    setEquipmentRequestBusy(true)
    setEquipmentRequestError('')
    try {
      const result = await apiRequest(`/equipment/requests/${encodeURIComponent(equipmentRequest.requestId)}/approve`, { method: 'PATCH' })
      setEquipmentRequest(current => ({ ...current, ...result, status: 'approved', active: false }))
      try {
        const stored = JSON.parse(localStorage.getItem('a-max-published-equipment') || '[]')
        localStorage.setItem('a-max-published-equipment', JSON.stringify(stored.filter(item => item.id !== result.listingId)))
      } catch {}
      window.dispatchEvent(new Event('amax:equipment-listing-updated'))
    } catch (requestError) {
      setEquipmentRequestError(requestError.message || 'Unable to approve the equipment request.')
    } finally {
      setEquipmentRequestBusy(false)
    }
  }

  const hasEquipmentContext = Boolean(equipmentListingId || equipmentRequest?.listingId)

  return <div className="messages-page">
    <div className="messages-heading"><div><span className="eyebrow warm">YOUR STUDIO LINE</span><h1>Messages</h1></div><span className={`message-connection ${connected ? 'online' : ''}`} role="status">{connected ? <Wifi size={14}/> : <WifiOff size={14}/>} {connected ? 'Live' : 'Reconnecting'}</span></div>
    <label className="messages-search"><Search size={16}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Find an AMAX member by name or username…" aria-label="Search AMAX members"/></label>
    {(searchResults.length > 0 || searchError || search.trim().length >= 2) && <div className="user-search-results">{searchResults.map(recipient => <button key={recipient.id} onClick={() => openRecipient(recipient)}><img src={recipient.avatarUrl || `https://i.pravatar.cc/80?u=${encodeURIComponent(recipient.username)}`} alt=""/><span><strong>{recipient.name}</strong><small>@{recipient.username}</small></span><DirectionalChevron size={15}/></button>)}{searchError && <p role="alert">{searchError}</p>}{!searchError && !searchResults.length && <p>No matching AMAX members.</p>}</div>}
    {error && <p className="message-error" role="alert">{error}<button onClick={() => { setError(''); refreshConversations().catch(requestError => setError(requestError.message)) }}>Retry</button></p>}
    <div className="messages-layout">
      <section className="conversation-stack">
        <div className="conversation-stack-heading"><span className="eyebrow">Conversations</span><small>{conversations.length} chats</small></div>
        <div className="message-list">
          {loadingConversations && <p className="message-empty"><LoaderCircle size={16} className="message-spinner"/> Loading conversations…</p>}
          {!loadingConversations && conversations.map(conversation => {
            const participant = conversation.participant
            return <button className={`message-thread ${conversation.unreadCount ? 'unread' : ''} ${selectedId === conversation.id ? 'selected' : ''}`} key={conversation.id} onClick={() => {
              setSelectedId(conversation.id)
              if (searchParams.has('listing') || searchParams.has('request') || searchParams.has('community')) {
                setSearchParams(current => {
                  const next = new URLSearchParams(current)
                  next.delete('listing')
                  next.delete('request')
                  next.delete('community')
                  return next
                }, { replace: true })
              }
            }}>
              <img src={participant?.avatarUrl || `https://i.pravatar.cc/80?u=${encodeURIComponent(participant?.username || 'amax')}`} alt=""/>
              <div className="message-thread-copy"><div className="message-thread-title"><strong>{participant?.name || 'AMAX member'}</strong><small>{timeLabel(conversation.lastActivityAt)}</small></div><span>@{participant?.username}</span><p>{conversation.lastMessage ? `${conversation.lastMessage.senderId === user.id ? 'You: ' : ''}${conversation.lastMessage.body || (conversation.lastMessage.attachments?.[0]?.kind === 'image' ? 'Photo' : conversation.lastMessage.attachments?.[0]?.kind === 'video' ? 'Video' : 'Attachment')}` : 'Start a conversation'}</p></div>
              {conversation.unreadCount > 0 && <b className="message-unread-count">{conversation.unreadCount}</b>}
            </button>
          })}
          {!loadingConversations && conversations.length === 0 && <p className="message-empty">No conversations yet. Search for an AMAX member above to start one.</p>}
        </div>
        <section className="messages-joined-communities" aria-label="Your communities">
          <div className="joined-communities-heading"><span className="eyebrow">Your communities</span><small>{joinedCommunities.length} joined{pendingCommunities.length ? ` · ${pendingCommunities.length} pending` : ''}</small></div>
          {communityError && <p className="community-inline-error" role="alert">{communityError}<button onClick={() => refreshCommunityMembership().catch(() => {})}>Retry</button></p>}
          <div className="messages-community-list">
            {communitiesLoading && <p className="message-empty"><LoaderCircle size={15} className="message-spinner"/> Loading communities…</p>}
            {[...joinedCommunities, ...pendingCommunities].map(community => {
              const pending = community.membershipStatus === 'pending'
              return <button type="button" className={`messages-community-item ${community.slug === selectedCommunitySlug ? 'is-selected' : ''} ${pending ? 'is-pending' : ''}`} key={community.slug} onClick={() => {
                const next = new URLSearchParams(searchParams)
                next.set('community', community.slug)
                next.delete('listing')
                next.delete('request')
                setSearchParams(next)
              }}>
                <span className="messages-community-icon"><Users size={17}/></span>
                <span className="messages-community-copy"><strong>{community.name}</strong><small>{Number(community.memberCount || 0).toLocaleString('en-IN')} members</small><span>{community.description}</span></span>
                <span className={`messages-community-status ${pending ? 'pending' : ''}`}>{pending ? 'PENDING' : community.slug === selectedCommunitySlug ? 'OPEN' : 'OPEN CHAT'}</span>
              </button>
            })}
            {!communitiesLoading && !communityError && !joinedCommunities.length && !pendingCommunities.length && <p className="message-empty">Your joined communities and access requests will appear here.</p>}
          </div>
        </section>
      </section>
      {selectedCommunitySlug ? activeCommunity ? <CommunitySpace community={activeCommunity} user={user} socket={socket}/>
        : activePendingCommunity ? <section className="chat-panel community-pending-panel" aria-live="polite">
          <header className="chat-panel-header community-space-header"><div className="community-space-identity"><span className="community-space-mark"><Users size={17}/></span><span><strong>{activePendingCommunity.name}</strong><small>Community access request</small></span></div><span className="community-pending-pill">Awaiting approval</span></header>
          <div className="community-pending-content"><span className="community-empty-icon"><Check size={21}/></span><span className="eyebrow">REQUEST RECEIVED</span><h2>Your request is with the moderators.</h2><p>When an owner, moderator, or community admin approves it, this discussion will open here automatically.</p><button className="outline-button" onClick={() => navigate('/communities')}>Explore communities <DirectionalChevron size={14}/></button></div>
        </section>
        : communitiesLoading ? <section className="chat-panel chat-empty-panel"><p className="message-empty"><LoaderCircle size={16} className="message-spinner"/> Loading community access…</p></section>
          : <section className="chat-panel chat-empty-panel"><div><span className="eyebrow">COMMUNITY ACCESS</span><h2>This community isn’t in your list yet.</h2><p>Request to join from Communities, or check here again after an admin reviews your request.</p><button className="outline-button" onClick={() => navigate('/communities')}>Browse communities <DirectionalChevron size={14}/></button></div></section>
        : activeConversation ? <section className="chat-panel">
        <header className="chat-panel-header">
          {hasEquipmentContext && equipmentRequest?.role === 'buyer' && <button className="equipment-chat-action" disabled={equipmentRequestBusy || equipmentRequest.status !== 'none' || !equipmentRequest.active} onClick={requestEquipment}>{equipmentRequestBusy ? 'Sending…' : equipmentRequest.status === 'pending' ? `Request sent${equipmentRequest.listingTitle ? ` (${equipmentRequest.listingTitle})` : ''}` : equipmentRequest.status === 'approved' || !equipmentRequest.active ? `"${equipmentRequest.listingTitle || 'Listing'}" closed` : `Request ${equipmentRequest.listingTitle ? `"${equipmentRequest.listingTitle}"` : 'listing'}`}</button>}
          {hasEquipmentContext && equipmentRequest?.role === 'seller' && equipmentRequest.status === 'pending' && <button className="equipment-chat-action approve" disabled={equipmentRequestBusy} onClick={approveEquipmentRequest}>{equipmentRequestBusy ? 'Approving…' : `Approve "${equipmentRequest.listingTitle || 'request'}"`}</button>}
          <div><img src={activeConversation.participant?.avatarUrl || `https://i.pravatar.cc/80?u=${encodeURIComponent(activeConversation.participant?.username || 'amax')}`} alt=""/><span><strong>{activeConversation.participant?.name || 'AMAX member'}</strong><small>@{activeConversation.participant?.username}</small></span></div>
        </header>
        {equipmentRequestError && <p className="message-error chat-send-error" role="alert">{equipmentRequestError}</p>}
        {hasEquipmentContext && equipmentRequest?.status === 'approved' && <p className="equipment-request-status" role="status">Request approved for {equipmentRequest.listingTitle ? `"${equipmentRequest.listingTitle}"` : 'this listing'}. This item has been removed from the marketplace. Other listed items remain available.</p>}
        <div className="chat-messages" aria-live="polite" ref={chatMessagesRef}>
          {loadingMessages && <p className="message-empty"><LoaderCircle size={16} className="message-spinner"/> Loading messages…</p>}
          {!loadingMessages && hasMore && <button className="load-older-messages" disabled={loadingOlder} onClick={loadOlderMessages}>{loadingOlder ? 'Loading…' : 'Load older messages'}</button>}
          {!loadingMessages && messages.length === 0 && <p className="message-empty">This is the beginning of your conversation. Say hello.</p>}
          {messages.map(message => <article className={`chat-message-bubble ${message.senderId === user.id ? 'chat-sent' : 'chat-received'}`} key={message.id}>
            {message.body && <p>{message.body}</p>}
            <ChatMessageAttachments attachments={message.attachments}/>
            <small>{timeLabel(message.createdAt)}</small>
          </article>)}
          <div ref={messagesEndRef}/>
        </div>
        <ChatComposer draft={draft} setDraft={setDraft} sending={sending} onSend={sendMessage} onDraftChange={() => setSendError('')} placeholder={`Message @${activeConversation.participant?.username || 'member'}`} ariaLabel="Message body"/>
        {sendError && <p className="message-error chat-send-error" role="alert">{sendError}</p>}
      </section> : null}
    </div>
  </div>
}

export default function MessagesPage() {
  const { user } = useAuthSession()
  return user ? <AuthenticatedMessagesPage /> : <PublicMessagesPreview />
}
