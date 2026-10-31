import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthSession } from './AuthSession'
import { apiRequest } from '../services/api'

const BookmarksContext = createContext(null)
const STORAGE_KEY = 'a-max-bookmarks'

function readBookmarks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function getBookmarkKey(item) {
  if (item.contentId) return `${item.type}:${item.contentId}`
  return `${item.type}:${item.title}:${item.creator}`
}

function mapSavedContent(item) {
  const documentType = item.mediaUrl?.split('?')[0].split('.').pop()?.toLowerCase() || ''
  return {
    type: item.type,
    contentId: item._id,
    title: item.title,
    creator: item.creator?.name || 'AMAX filmmaker',
    creatorUsername: item.creator?.username || '',
    image: item.posterUrl,
    genre: item.genre,
    format: item.category,
    documentUrl: item.type === 'script' || item.type === 'story' ? item.mediaUrl : undefined,
    documentType,
    video: item.type === 'film' ? item.mediaUrl : undefined,
    bookmarks: item.bookmarks,
    writerProfile: item.creator?.username ? {
      name: item.creator.name,
      image: item.creator.avatarUrl,
      to: `/profile/${item.creator.username}`
    } : undefined
  }
}

export function BookmarksProvider({ children }) {
  const [bookmarks, setBookmarks] = useState(readBookmarks)
  const [savedCounts, setSavedCounts] = useState({})
  const [savedStates, setSavedStates] = useState({})
  const [savedTotals, setSavedTotals] = useState({ film: 0, script: 0, story: 0 })
  const [savedPage, setSavedPage] = useState(1)
  const [hasMoreSaved, setHasMoreSaved] = useState(false)
  const [loadingMoreSaved, setLoadingMoreSaved] = useState(false)
  const [savedLoading, setSavedLoading] = useState(false)
  const [savedError, setSavedError] = useState('')
  const { user } = useAuthSession()
  const navigate = useNavigate()
  const location = useLocation()
  const pendingRequests = useRef(new Set())

  useEffect(() => {
    let active = true
    const savedScripts = readBookmarks().filter(item => item.type !== 'film' && item.contentId)
    if (!user) {
      setBookmarks(savedScripts)
      setSavedCounts({})
      setSavedStates({})
      setSavedTotals({ film: 0, script: 0, story: 0 })
      setSavedPage(1)
      setHasMoreSaved(false)
      setSavedLoading(false)
      setSavedError('')
      return () => { active = false }
    }
    setBookmarks([])
    setSavedPage(1)
    setSavedCounts({})
    setSavedStates({})
    setSavedTotals({ film: 0, script: 0, story: 0 })
    setSavedLoading(true)
    setSavedError('')
    apiRequest('/content/saved?page=1&limit=50')
      .then(result => {
        if (!Array.isArray(result.items)) throw new Error('Saved content response is invalid.')
        if (!active) return
        const savedContent = result.items.map(mapSavedContent)
        setBookmarks(savedContent)
        setSavedPage(result.page)
        setHasMoreSaved(result.hasMore)
        setSavedCounts(Object.fromEntries(savedContent.map(item => [`${item.type}:${item.contentId}`, item.bookmarks])))
        setSavedStates(Object.fromEntries(savedContent.map(item => [`${item.type}:${item.contentId}`, true])))
        setSavedTotals(result.countsByType || { film: 0, script: 0, story: 0 })
      })
      .catch(error => {
        if (active) setSavedError(error.message || 'Unable to load saved content.')
      })
      .finally(() => {
        if (active) setSavedLoading(false)
      })
    return () => { active = false }
  }, [user?.id])

  const loadMoreSaved = async () => {
    if (!user || !hasMoreSaved || loadingMoreSaved) return
    setLoadingMoreSaved(true)
    setSavedError('')
    try {
      const result = await apiRequest(`/content/saved?page=${savedPage + 1}&limit=50`)
      if (!Array.isArray(result.items)) throw new Error('Saved content response is invalid.')
      const nextContent = result.items.map(mapSavedContent)
      setBookmarks(current => {
        const currentIds = new Set(current.map(getBookmarkKey))
        return [...current, ...nextContent.filter(item => !currentIds.has(getBookmarkKey(item)))]
      })
      setSavedCounts(current => ({
        ...current,
        ...Object.fromEntries(nextContent.map(item => [`${item.type}:${item.contentId}`, item.bookmarks]))
      }))
      setSavedStates(current => ({
        ...current,
        ...Object.fromEntries(nextContent.map(item => [`${item.type}:${item.contentId}`, true]))
      }))
      setSavedPage(result.page)
      setHasMoreSaved(result.hasMore)
      setSavedTotals(result.countsByType || savedTotals)
    } catch (error) {
      setSavedError(error.message || 'Unable to load more saved content.')
      throw error
    } finally {
      setLoadingMoreSaved(false)
    }
  }

  const toggleBookmark = async item => {
    const bookmark = { ...item, key: getBookmarkKey(item) }
    if (!user) {
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } })
      return
    }
    if (!item.contentId || !['film', 'script', 'story'].includes(item.type)) {
      throw new Error('This item is not published to AMAX and cannot be saved across devices.')
    }
    if (pendingRequests.current.has(bookmark.key)) return null
    pendingRequests.current.add(bookmark.key)
    const isSaved = isBookmarked(item)
    try {
      const result = await apiRequest(`/content/${encodeURIComponent(item.contentId)}/bookmark`, {
        method: 'PUT',
        body: JSON.stringify({ bookmarked: !isSaved })
      })
      setBookmarks(current => result.bookmarked
        ? [...current.filter(existing => getBookmarkKey(existing) !== bookmark.key), bookmark]
        : current.filter(existing => getBookmarkKey(existing) !== bookmark.key))
      setSavedStates(current => ({ ...current, [bookmark.key]: result.bookmarked }))
      setSavedCounts(current => ({ ...current, [bookmark.key]: result.bookmarks }))
      setSavedTotals(current => ({
        ...current,
        [item.type]: Math.max(0, (current[item.type] || 0) + (result.bookmarked === isSaved ? 0 : result.bookmarked ? 1 : -1))
      }))
      return result
    } finally {
      pendingRequests.current.delete(bookmark.key)
    }
  }

  const isBookmarked = item => {
    const key = getBookmarkKey(item)
    return Object.hasOwn(savedStates, key)
      ? savedStates[key]
      : bookmarks.some(saved => getBookmarkKey(saved) === key) || Boolean(item.bookmarked)
  }
  const getSavedCount = item => {
    const key = getBookmarkKey(item)
    const storedCount = savedCounts[key]
    if (Number.isFinite(storedCount)) return storedCount
    const itemCount = Number(item.bookmarks)
    return Number.isFinite(itemCount) ? itemCount : 0
  }
  const setSavedCount = (item, count) => {
    if (!item.contentId || !Number.isFinite(Number(count))) return
    const key = getBookmarkKey(item)
    setSavedCounts(current => current[key] === Number(count) ? current : { ...current, [key]: Number(count) })
  }

  return <BookmarksContext.Provider value={{ bookmarks, toggleBookmark, isBookmarked, getSavedCount, setSavedCount, loadMoreSaved, hasMoreSaved, loadingMoreSaved, savedLoading, savedError, savedTotals }}>{children}</BookmarksContext.Provider>
}

export function useBookmarks() {
  const context = useContext(BookmarksContext)
  if (!context) throw new Error('useBookmarks must be used inside BookmarksProvider')
  return context
}
