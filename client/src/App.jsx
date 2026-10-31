import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import mvLogo from './assets/mv-logo.png'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Bell, BookOpen, Bookmark, Camera, Check, ChevronDown, Compass, ExternalLink, Expand, Film, FileText, Heart, Home as HomeIcon, LogIn, LogOut, MessageCircle, Mic, Minimize2, MoreVertical, Pencil, Play, Plus, Search, ScrollText, Send, Settings, ShoppingBag, SlidersHorizontal, Sparkles, Upload, UserCircle, Users } from 'lucide-react'
import DirectionalChevron from './components/DirectionalChevron'
import { AuthSessionProvider, RequireAuth, useAuthSession } from './context/AuthSession'
import { Onboarding, PreferenceSettings } from './features/Preferences'
import CinematicIntro from './features/CinematicIntro'
import CinematicVideoPlayer from './features/CinematicVideoPlayer'
import MessagesPage from './features/MessagesPage'
import FilmComments from './features/FilmComments'
import { apiRequest, apiUrl } from './services/api'
import { learningCourses, learningTopics, getCourseBySlugOrTopic } from './data/learningCourses'
import { getLearnCoursePortrait } from './data/learnCoursePortraits'
import { scrollPageToTop } from './features/GlobalSmoothScroll'
import AdminPanel from './features/AdminPanel'
import { AdminSessionProvider } from './context/AdminSession'
import './styles.admin.css'

const PROFILE_AVATAR_PLACEHOLDER = '/profile-avatar-placeholder.svg'
const PROFILE_PROFESSIONAL_FIELDS = ['Filmmaker', 'Director', 'Screenwriter', 'Cinematographer', 'Actor', 'Editor', 'Producer', 'Production Designer', 'Composer', 'Sound Designer', 'Colorist', 'Animator', 'Documentary Filmmaker', 'Film Student', 'Film Critic', 'Film Enthusiast']
const isGeneratedProfileAvatar = image => typeof image === 'string' && /^https?:\/\/i\.pravatar\.cc\/(?:80|160)\?img=57(?:&|$)/i.test(image)
const profileAvatar = (...images) => images.find(image => image && !isGeneratedProfileAvatar(image)) || PROFILE_AVATAR_PLACEHOLDER
const usePlaceholderOnAvatarError = event => { event.currentTarget.onerror = null; event.currentTarget.src = PROFILE_AVATAR_PLACEHOLDER }

function storeScriptDocument(key, data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('a-max-script-documents', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('documents')
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('documents', 'readwrite')
      transaction.objectStore('documents').put(data, key)
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => { database.close(); reject(transaction.error) }
      transaction.onabort = () => { database.close(); reject(transaction.error || new Error('Unable to save the script document.')) }
    }
    request.onerror = () => reject(request.error)
  })
}

function readScriptDocument(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('a-max-script-documents', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('documents')
    request.onsuccess = () => { const transaction = request.result.transaction('documents', 'readonly'); const read = transaction.objectStore('documents').get(key); read.onsuccess = () => resolve(read.result || ''); read.onerror = () => reject(read.error) }
    request.onerror = () => reject(request.error)
  })
}

function storeFilmVideo(key, video) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('a-max-film-videos', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('videos')
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('videos', 'readwrite')
      transaction.objectStore('videos').put(video, key)
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => { database.close(); reject(transaction.error) }
      transaction.onabort = () => { database.close(); reject(transaction.error || new Error('Unable to save the film video.')) }
    }
    request.onerror = () => reject(request.error)
  })
}

function readFilmVideo(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('a-max-film-videos', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('videos')
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('videos', 'readonly')
      const read = transaction.objectStore('videos').get(key)
      read.onsuccess = () => { database.close(); resolve(read.result || null) }
      read.onerror = () => { database.close(); reject(read.error) }
    }
    request.onerror = () => reject(request.error)
  })
}

function storeMediaAsset(key, data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('a-max-media-assets', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('assets')
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('assets', 'readwrite')
      transaction.objectStore('assets').put(data, key)
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => { database.close(); reject(transaction.error) }
      transaction.onabort = () => { database.close(); reject(transaction.error || new Error('Unable to save the uploaded image.')) }
    }
    request.onerror = () => reject(request.error)
  })
}

function readMediaAsset(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('a-max-media-assets', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('assets')
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('assets', 'readonly')
      const read = transaction.objectStore('assets').get(key)
      read.onsuccess = () => { database.close(); resolve(read.result || null) }
      read.onerror = () => { database.close(); reject(read.error) }
    }
    request.onerror = () => reject(request.error)
  })
}

function readPublishedItems(key) {
  try {
    const items = JSON.parse(localStorage.getItem(key) || '[]')
    if (Array.isArray(items)) return items
    console.error(`Stored content in ${key} is not a list.`)
  } catch (error) {
    console.error(`Unable to read published content from ${key}:`, error)
  }
  return []
}

function notifyPublishedContent() {
  window.dispatchEvent(new Event('amax:published-content'))
}

function parseCrewUsernames(value) {
  return value.split(',').map(item => item.trim().replace(/^@/, '').toLowerCase()).filter(Boolean)
}

const MAX_FILM_CREW_MEMBERS = 9
const MAX_FILM_CREW_OPTIONS = 7

function renderFilmPosterCrop(file, { zoom = 1, offsetX = 50, offsetY = 50, width = 900, height = 1350 } = {}) {
  return createImageBitmap(file).then(bitmap => {
    const aspect = width / height
    let cropWidth = bitmap.width
    let cropHeight = bitmap.height
    if (bitmap.width / bitmap.height > aspect) cropWidth = bitmap.height * aspect
    else cropHeight = bitmap.width / aspect
    cropWidth /= Math.max(1, Number(zoom) || 1)
    cropHeight /= Math.max(1, Number(zoom) || 1)
    const maxX = Math.max(0, bitmap.width - cropWidth)
    const maxY = Math.max(0, bitmap.height - cropHeight)
    const sourceX = maxX * Math.min(100, Math.max(0, Number(offsetX) || 0)) / 100
    const sourceY = maxY * Math.min(100, Math.max(0, Number(offsetY) || 0)) / 100
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) {
      bitmap.close()
      throw new Error('Unable to prepare the poster crop.')
    }
    context.drawImage(bitmap, sourceX, sourceY, cropWidth, cropHeight, 0, 0, width, height)
    bitmap.close()
    const dataUrl = canvas.toDataURL('image/jpeg', .88)
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve({ dataUrl, blob }) : reject(new Error('Unable to save the poster crop.')), 'image/jpeg', .88)
    })
  })
}

function getFilmPosterDataUrl(file) {
  return createImageBitmap(file).then(bitmap => {
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    return canvas.toDataURL('image/jpeg', .82)
  })
}

function mapApiFilm(item) {
  return {
    id: item._id,
    contentId: item._id,
    title: item.title,
    creator: typeof item.creator === 'object' ? item.creator?.name || 'AMAX filmmaker' : 'AMAX filmmaker',
    genre: item.genre || item.category || 'Film',
    description: item.description || '',
    image: item.posterUrl || films[0].image,
    likes: item.likes || 0,
    liked: Boolean(item.liked),
    bookmarked: Boolean(item.bookmarked),
    views: item.views || 0,
    accent: 'Community release',
    video: item.mediaUrl ? resolveApiMediaUrl(item.mediaUrl) : ''
  }
}

function mapApiScript(item) {
  const creator = typeof item.creator === 'object' ? item.creator : {}
  const documentType = item.mediaUrl?.split('?')[0].split('.').pop()?.toLowerCase() || ''
  return {
    contentId: item._id,
    title: item.title,
    creator: creator.name || 'AMAX Writer',
    creatorUsername: creator.username || '',
    type: item.genre || item.category || (item.type === 'story' ? 'Story' : 'Script'),
    contentType: item.type,
    genre: item.category || '',
    pageCount: item.pageCount || null,
    description: item.description || '',
    image: item.posterUrl || scripts[0].image,
    documentUrl: item.mediaUrl ? resolveApiMediaUrl(item.mediaUrl) : '',
    documentType,
    bookmarks: item.bookmarks || 0,
    bookmarked: Boolean(item.bookmarked),
    writerProfile: creator.username ? {
      name: creator.name,
      image: creator.avatarUrl,
      to: `/profile/${creator.username}`
    } : undefined
  }
}

function resolveApiMediaUrl(mediaUrl) {
  return new URL(mediaUrl, new URL(apiUrl).origin).toString()
}

function MediaImage({ image, imageKey, alt = '', ...props }) {
  const [src, setSrc] = useState(image || undefined)
  useEffect(() => {
    let active = true
    let objectUrl = ''
    setSrc(image || undefined)
    if (!imageKey) return undefined
    readMediaAsset(imageKey)
      .then(asset => {
        if (!asset) throw new Error(`Uploaded image asset "${imageKey}" was not found.`)
        objectUrl = URL.createObjectURL(asset)
        if (active) setSrc(objectUrl)
        else URL.revokeObjectURL(objectUrl)
      })
      .catch(error => console.error('Unable to load uploaded image:', error))
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [image, imageKey])
  return <img {...props} src={src || undefined} alt={alt}/>
}

function Learn() {
  const [params] = useSearchParams()
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(() => params.get('view') === 'all')
  const filteredCourses = learningCourses.filter(course =>
    course.course.toLowerCase().includes(search.trim().toLowerCase()) ||
    course.slug.toLowerCase().includes(search.trim().toLowerCase())
  )
  const searching = Boolean(search.trim())
  const visibleCourses = searching ? filteredCourses : showAll ? learningCourses : learningCourses.slice(0, 15)
  const renderCourse = course => {
    const totalResources = (course.resources.books?.length || 0) + (course.resources.videos?.length || 0) + (course.resources.websites?.length || 0)
    const portrait = getLearnCoursePortrait(course)
    return <Link className="topic-card-link" to={`/learn/${course.slug}`} key={course.slug}>
      <article>
        <span className="course-card-portrait" aria-hidden="true">
          <img className={portrait.flip ? 'course-card-portrait-flipped' : undefined} src={portrait.src} alt={`${portrait.name}, monochrome portrait`} loading="lazy" decoding="async" style={{ objectPosition: portrait.position }} onError={event => { event.currentTarget.style.display = 'none' }}/>
        </span>
        <div className="course-card-copy">
          <span>{String(course.id).padStart(2, '0')}</span>
          <h3>{course.course}</h3>
          <p>{totalResources} curated resources</p>
        </div>
        <span className="course-card-portrait-name">{portrait.name}</span>
        <DirectionalChevron size={18}/>
      </article>
    </Link>
  }

  return <div className="learn-index-page">
    <div className="learn-page-header">
      <div className="learn-heading-copy"><h1 className="marketplace-wordmark">LEARN</h1><span className="eyebrow section-page-tagline">THE FILMMAKER'S WORKSHOP</span></div>
      <label className="learn-search"><Search size={16}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search courses, masterclasses, skills..." aria-label="Search courses"/></label>
    </div>
    <div className="topic-grid">
      {visibleCourses.length
        ? visibleCourses.map(renderCourse)
        : <p className="learn-empty">No courses match your search.</p>}
    </div>
    {!searching && !showAll && <div className="learn-view-all">
      <button className="text-button learn-view-all-button" type="button" onClick={() => setShowAll(true)}><span>View all courses</span><ChevronDown size={16} aria-hidden="true"/></button>
    </div>}
  </div>
}

function LearnTopicPage() {
  const { topic } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const course = getCourseBySlugOrTopic(topic)

  if (!course) {
    return (
      <div className="placeholder">
        <h1>Course not found</h1>
        <p>The filmmaking course you requested could not be found.</p>
        <button className="primary-button" onClick={() => navigate('/learn')}>Back to Learn</button>
      </div>
    )
  }

  const allBooks = course.resources.books || []
  const allVideos = course.resources.videos || []
  const allWebsites = course.resources.websites || []
  const allMovies = course.resources.movies || []

  const q = searchQuery.trim().toLowerCase()
  const books = allBooks.filter(b => !q || (b.title && b.title.toLowerCase().includes(q)) || (b.author && b.author.toLowerCase().includes(q)) || (b.description && b.description.toLowerCase().includes(q)))
  const videos = allVideos.filter(v => !q || (v.title && v.title.toLowerCase().includes(q)) || (v.creator && v.creator.toLowerCase().includes(q)) || (v.description && v.description.toLowerCase().includes(q)))
  const websites = allWebsites.filter(w => !q || (w.title && w.title.toLowerCase().includes(q)) || (w.domain && w.domain.toLowerCase().includes(q)) || (w.description && w.description.toLowerCase().includes(q)))
  const movies = allMovies.filter(movie => !q || [movie.title, movie.director, movie.year, movie.description, movie.reason].some(value => String(value || '').toLowerCase().includes(q)))

  const totalCount = books.length + videos.length + websites.length + movies.length

  return (
    <div className="course-page">
      <button className="upload-back" onClick={() => navigate('/learn')}><DirectionalChevron direction="left" size={17}/> Back to Learn</button>
      <header className="course-page-heading">
        <span className="eyebrow warm">COURSE #{String(course.id).padStart(2, '0')} · {course.category ? course.category.toUpperCase() : 'THE WORKSHOP'}</span>
        <h1>{course.course}</h1>
        <p>{course.description || `Explore books, video tutorials, recommended websites, and movies curated for ${course.course.toLowerCase()}.`}</p>
      </header>

      <div className="course-controls-bar">
        <div className="course-tabs-group" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            className={`course-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Resources <span className="course-tab-count">{totalCount}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'books'}
            className={`course-tab-btn ${activeTab === 'books' ? 'active' : ''}`}
            onClick={() => setActiveTab('books')}
          >
            <FileText size={14}/> Books / E-books <span className="course-tab-count">{books.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'videos'}
            className={`course-tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            <Play size={14}/> Video Tutorials <span className="course-tab-count">{videos.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'websites'}
            className={`course-tab-btn ${activeTab === 'websites' ? 'active' : ''}`}
            onClick={() => setActiveTab('websites')}
          >
            <ExternalLink size={14}/> Recommended Websites <span className="course-tab-count">{websites.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'movies'}
            className={`course-tab-btn ${activeTab === 'movies' ? 'active' : ''}`}
            onClick={() => setActiveTab('movies')}
          >
            <Film size={14}/> Movie Recommendation <span className="course-tab-count">{movies.length}</span>
          </button>
        </div>
        <div className="course-in-search">
          <Search size={15}/>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search within ${course.course}...`}
            aria-label="Filter course resources"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '0 4px', fontSize: '13px' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="course-resource-grid">
        {(activeTab === 'all' || activeTab === 'books') && (
          <section className="course-resource-section" style={{ gridColumn: activeTab === 'books' ? '1 / -1' : 'auto' }}>
            <div className="course-resource-heading">
              <span className="eyebrow"><FileText size={16}/> Books / E-Books</span>
              <small>{books.length} publications</small>
            </div>
            <div className="course-resource-list">
              {books.length ? books.map((book, bIdx) => (
                <a
                  href={book.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={book.id || book.title || bIdx}
                  title={`Open direct PDF / e-book: ${book.title}`}
                >
                  <div>
                    <div className="resource-meta-row">
                      <span className="resource-badge badge-pdf">DIRECT PDF</span>
                      {book.author && <span className="resource-source-tag">{book.author}</span>}
                      {book.sourceName && <span className="resource-source-tag">· {book.sourceName}</span>}
                    </div>
                    <h2>{book.title}</h2>
                    <p>{book.description}</p>
                  </div>
                  <ExternalLink size={15}/>
                </a>
              )) : (
                <p className="marketplace-empty">No books match your search.</p>
              )}
            </div>
          </section>
        )}

        {(activeTab === 'all' || activeTab === 'videos') && (
          <section className="course-resource-section" style={{ gridColumn: activeTab === 'videos' ? '1 / -1' : 'auto' }}>
            <div className="course-resource-heading">
              <span className="eyebrow"><Play size={16}/> Video Tutorials</span>
              <small>{videos.length} videos</small>
            </div>
            <div className="course-resource-list">
              {videos.length ? videos.map((video, vIdx) => (
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={video.id || video.title || vIdx}
                  title={`Watch on YouTube: ${video.title}`}
                >
                  <div>
                    <div className="resource-meta-row">
                      <span className="resource-badge badge-video">YOUTUBE</span>
                      {video.creator && <span className="resource-source-tag">{video.creator}</span>}
                    </div>
                    <h2>{video.title}</h2>
                    <p>{video.description}</p>
                  </div>
                  <ExternalLink size={15}/>
                </a>
              )) : (
                <p className="marketplace-empty">No video tutorials match your search.</p>
              )}
            </div>
          </section>
        )}

        {(activeTab === 'all' || activeTab === 'websites') && (
          <section className="course-resource-section" style={{ gridColumn: activeTab === 'websites' ? '1 / -1' : 'auto' }}>
            <div className="course-resource-heading">
              <span className="eyebrow"><ExternalLink size={16}/> Recommended Websites</span>
              <small>{websites.length} websites</small>
            </div>
            <div className="course-resource-list">
              {websites.length ? websites.map((site, sIdx) => (
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={site.id || site.title || sIdx}
                  title={`Visit ${site.title} (${site.domain || site.url})`}
                >
                  <div>
                    <div className="resource-meta-row">
                      <span className="resource-badge badge-web">OFFICIAL WEB</span>
                      {site.domain && <span className="resource-source-tag">{site.domain}</span>}
                    </div>
                    <h2>{site.title}</h2>
                    <p>{site.description}</p>
                  </div>
                  <ExternalLink size={15}/>
                </a>
              )) : (
                <p className="marketplace-empty">No recommended websites match your search.</p>
              )}
            </div>
          </section>
        )}

        {(activeTab === 'all' || activeTab === 'movies') && (
          <section className="course-resource-section course-movie-recommendations" style={{ gridColumn: activeTab === 'movies' ? '1 / -1' : 'auto' }}>
            <div className="course-resource-heading">
              <span className="eyebrow"><Film size={16}/> Movie Recommendation</span>
              <small>{movies.length} films</small>
            </div>
            <div className="course-movie-grid">
              {movies.length ? movies.map((movie, movieIdx) => (
                <article className="course-movie-card" key={movie.id || movie.title || movieIdx}>
                  {movie.image && <img src={movie.image} alt={`${movie.title} film artwork`} loading="lazy"/>}
                  <div className="course-movie-copy">
                    <div className="resource-meta-row">
                      <span className="resource-badge badge-video">COURSE PICK</span>
                      {movie.year && <span className="resource-source-tag">{movie.year}</span>}
                    </div>
                    <h2>{movie.title}</h2>
                    {movie.director && <small className="course-movie-director">Directed by {movie.director}</small>}
                    {(movie.reason || movie.description) && <p>{movie.reason || movie.description}</p>}
                    {movie.url && <a className="course-movie-link" href={movie.url} target="_blank" rel="noopener noreferrer">Explore film <ExternalLink size={13}/></a>}
                  </div>
                </article>
              )) : (
                <div className="course-movie-empty" role="status">
                  <Film size={22}/>
                  <strong>No movie recommendations yet</strong>
                  <p>Curated films to complement {course.course.toLowerCase()} will appear here when added.</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

import { BookmarksProvider, useBookmarks } from './context/BookmarksContext'

const sampleFilmVideo = 'https://media.w3.org/2010/05/sintel/trailer.mp4'
const films = [
  { id: 'film-last-light', title: 'The Last Light', creator: 'Maya Chen', genre: 'Drama · 12 min', image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80', accent: 'New release', description: 'As the last light fades over a familiar city, a filmmaker returns home to reckon with the people and memories that shaped her.', rating: '8.7', likes: 142, director: 'Maya Chen', cast: [{ name: 'Maya Chen', role: 'Director · Lead', username: 'maya-chen', image: 'https://i.pravatar.cc/160?img=47' }, { name: 'Elias Ford', role: 'Editor', username: 'elias-ford', image: 'https://i.pravatar.cc/160?img=12' }], video: sampleFilmVideo },
  { id: 'film-nocturne-in-blue', title: 'Nocturne in Blue', creator: 'Elias Ford', genre: 'Experimental · 08 min', image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80', accent: 'Trending', description: 'One restless night unfolds in fragments of color, music, and movement in this atmospheric experimental short.', rating: '7.9', likes: 89, director: 'Elias Ford', cast: [{ name: 'Elias Ford', role: 'Director · Editor', username: 'elias-ford', image: 'https://i.pravatar.cc/160?img=12' }], video: sampleFilmVideo },
  { id: 'film-field-notes', title: 'Field Notes', creator: 'Sofia Reyes', genre: 'Documentary · 18 min', image: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=900&q=80', accent: 'Staff pick', description: 'A quiet documentary portrait of the people, places, and small rituals that keep a community connected.', rating: '8.5', likes: 215, director: 'Sofia Reyes', cast: [{ name: 'Sofia Reyes', role: 'Director · Documentary filmmaker', username: 'sofia-reyes', image: 'https://i.pravatar.cc/160?img=32' }], video: sampleFilmVideo },
  { id: 'film-a-place-between', title: 'A Place Between', creator: 'Theo Hart', genre: 'Short film · 14 min', image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=80', accent: 'Most watched', description: 'Caught between leaving and beginning again, a young artist discovers that home can be a choice.', rating: '8.2', likes: 74, director: 'Theo Hart', cast: [{ name: 'Theo Hart', role: 'Director · Writer', username: 'theo-hart', image: 'https://i.pravatar.cc/160?img=11' }], video: sampleFilmVideo },
]

const creators = [
  { name: 'Maya Chen', role: 'Director · Cinematographer', image: 'https://i.pravatar.cc/160?img=47', color: '#e7b45e' },
  { name: 'Elias Ford', role: 'Editor · Storyteller', image: 'https://i.pravatar.cc/160?img=12', color: '#85a9a4' },
  { name: 'Sofia Reyes', role: 'Documentary filmmaker', image: 'https://i.pravatar.cc/160?img=32', color: '#bc8971' },
]

const HOME_CONTRIBUTORS_CACHE_KEY = 'a-max-home-weekly-contributors'
const HOME_COMMUNITY_CACHE_KEY = 'a-max-home-community-highlights'

function homeContributorDayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function readHomeContributorsCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(HOME_CONTRIBUTORS_CACHE_KEY) || 'null')
    return cached && Array.isArray(cached.profiles) ? cached : null
  } catch {
    return null
  }
}

function cacheHomeContributors(profiles) {
  try {
    localStorage.setItem(HOME_CONTRIBUTORS_CACHE_KEY, JSON.stringify({ date: homeContributorDayKey(), profiles }))
  } catch (error) {
    console.warn('Unable to cache the weekly contributor list:', error)
  }
}

function readHomeCommunityCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(HOME_COMMUNITY_CACHE_KEY) || 'null')
    return cached && Array.isArray(cached.communities) ? cached : null
  } catch {
    return null
  }
}

function cacheHomeCommunityHighlights(communities) {
  try {
    localStorage.setItem(HOME_COMMUNITY_CACHE_KEY, JSON.stringify({ date: homeContributorDayKey(), communities }))
  } catch (error) {
    console.warn('Unable to cache the homepage community highlights:', error)
  }
}

function shuffleForDay(items, seed) {
  let state = 2166136261
  for (const character of seed) state = Math.imul(state ^ character.charCodeAt(0), 16777619) >>> 0
  const shuffled = [...items]
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

function selectHomeCommunityHighlights(communities, day = homeContributorDayKey()) {
  const candidates = communities.flatMap(community => {
    const channels = (community.channels || []).filter(channel => typeof channel.description === 'string' && channel.description.trim())
    if (!channels.length) return []
    // Pick one real channel per community, with the choice stable for the whole local day.
    const channel = shuffleForDay(channels, `${day}:${community.id}:${community.slug || community.name}`)[0]
    return [{
      id: community.id,
      slug: community.slug,
      name: community.name,
      memberCount: Number(community.memberCount || 0),
      channelName: channel.name,
      channelSlug: channel.slug,
      description: channel.description.trim()
    }]
  })
  if (!candidates.length) return []
  const [featured] = [...candidates].sort((left, right) => right.memberCount - left.memberCount)
  const stack = shuffleForDay(candidates.filter(community => community.id !== featured.id), day).slice(0, 3)
  return [featured, ...shuffleForDay(stack, `${day}:stack`)]
}

const scripts = [
  { title: 'The Shape of Rain', creator: 'Nia Okafor', type: 'Screenplay · 24 pages', description: 'A daughter returns home after the first rain in years and faces the silence her family left behind.', image: 'https://images.unsplash.com/photo-1455390582262-044c7d9a9c2b?auto=format&fit=crop&w=700&q=80' },
  { title: 'Second Take', creator: 'Jon Bell', type: 'Short story · 08 pages', description: 'Two strangers keep meeting at a neighborhood cinema, each hiding the ending of their own story.', image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=700&q=80' },
  { title: 'After the Static', creator: 'Priya Shah', type: 'Screenplay · 31 pages', description: 'A late-night radio host hears a voice that knows what she has tried to forget.', image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=700&q=80' },
  { title: 'Blue Hour', creator: 'Rafael Costa', type: 'Story idea · 04 pages', description: 'A brief encounter at dawn changes the way a city bus driver sees his last route.', image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=700&q=80' },
]

const equipment = [
  { title: 'ARRI Alexa Mini', seller: 'Frame House Rentals', detail: 'Camera · Excellent', price: '$180 / day', image: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=700&q=80' },
  { title: 'Cooke S4 Prime Set', seller: 'Kiran Menon', detail: 'Lenses · Like new', price: '$4,200', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=80' },
  { title: 'Aputure 600D Pro', seller: 'Studio North', detail: 'Lighting · Good', price: '$95 / day', image: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&w=700&q=80' },
  { title: 'Zoom F6 Recorder', seller: 'Sound Dept.', detail: 'Audio · Excellent', price: '$580', image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=700&q=80' },
]

const featuredTrailers = [
  { kind: 'empty', type: 'WEEKLY SHOWCASE', title: 'The next story starts here', poster: films[0].image, detail: 'Approved short films, new trailers, standout scripts, and film competitions will rotate here each week.', action: 'Explore short films', actionUrl: '/explore?section=short-films' },
]

function promoTitle(title) {
  const words = title.trim().split(/\s+/)
  return words.length > 3 ? `${words.slice(0, 3).join(' ')}...` : title
}

function notificationCopy(notification) {
  const actor = notification.actor?.name || 'An AMAX member'
  const title = notification.content?.title || 'your film'
  if (notification.type === 'community_join_request') {
    const communityName = notification.community?.name || 'your community'
    const status = notification.communityMembershipRequest?.status
    if (status === 'approved') return { title: `${actor} joined ${communityName}`, detail: 'You approved this membership request.' }
    if (status === 'rejected') return { title: `${actor} requested to join ${communityName}`, detail: 'This membership request was declined.' }
    return { title: `${actor} wants to join ${communityName}`, detail: notification.communityMembershipRequest?.message || 'Review this membership request.' }
  }
  if (notification.type === 'equipment_request') {
    return { title: `${actor} wants to order ${notification.equipmentListing?.title || 'your equipment'}`, detail: 'Review this order request. Approving it closes the listing.' }
  }
  if (notification.type === 'equipment_request_approved') {
    return { title: 'Your order request was accepted', detail: `The seller accepted your request for ${notification.equipmentListing?.title || 'this listing'}. Message them to arrange the handoff.` }
  }
  if (notification.type === 'like') return { title: `${actor} liked your film`, detail: title }
  if (notification.type === 'reply') return { title: `${actor} replied to your comment`, detail: title }
  return { title: `${actor} commented on your film`, detail: title }
}

async function approveCommunityJoinRequest(notification) {
  const communityId = notification.community?._id || notification.community?.id
  const requestId = notification.communityMembershipRequest?._id || notification.communityMembershipRequest?.id
  if (!communityId || !requestId) throw new Error('This community request is no longer available.')
  return apiRequest(`/communities/${encodeURIComponent(communityId)}/requests/${encodeURIComponent(requestId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ decision: 'approve' })
  })
}

function formatRelativeTime(value) {
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return ''
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function NotificationMenu({ onUnreadCountChange }) {
  const { user, socket } = useAuthSession()
  const navigate = useNavigate()
  const notificationMenuRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [error, setError] = useState('')
  const [approvingCommunityRequestId, setApprovingCommunityRequestId] = useState('')

  useEffect(() => {
    if (!open) return undefined
    const closeOnOutsideClick = event => {
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) setOpen(false)
    }
    const closeOnEscape = event => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  useEffect(() => {
    let active = true
    const refresh = async () => {
      try {
        const result = await apiRequest('/notifications')
        if (!Array.isArray(result.notifications)) throw new Error('Notifications response is invalid.')
        if (!active) return
        setNotifications(result.notifications.slice(0, 5))
        setUnreadCount(result.unreadCount)
        onUnreadCountChange(result.unreadCount)
        setError('')
      } catch (requestError) {
        if (active) setError(requestError.message || 'Unable to load notifications.')
      }
    }
    if (user) {
      socket?.on('connect', refresh)
      socket?.on('notification:new', refresh)
      window.addEventListener('amax:notifications-read', refresh)
      refresh()
    } else {
      setNotifications([])
      setUnreadCount(0)
      onUnreadCountChange(0)
    }
    return () => {
      active = false
      socket?.off('connect', refresh)
      socket?.off('notification:new', refresh)
      window.removeEventListener('amax:notifications-read', refresh)
    }
  }, [onUnreadCountChange, socket, user])

  const approveNotificationRequest = async (notification, event) => {
    event?.stopPropagation()
    const requestId = notification.equipmentRequest?._id
    if (!requestId) return
    setError('')
    try {
      await apiRequest(`/equipment/requests/${encodeURIComponent(requestId)}/approve`, { method: 'PATCH' })
      const readAt = new Date().toISOString()
      setNotifications(current => current.map(item => item._id === notification._id
        ? { ...item, readAt, equipmentRequest: { ...item.equipmentRequest, status: 'approved' }, equipmentListing: { ...item.equipmentListing, active: false } }
        : item))
      if (!notification.readAt) {
        const result = await apiRequest(`/notifications/${encodeURIComponent(notification._id)}/read`, { method: 'PATCH' })
        setUnreadCount(result.unreadCount)
        onUnreadCountChange(result.unreadCount)
        window.dispatchEvent(new Event('amax:notifications-read'))
      }
      try {
        const stored = JSON.parse(localStorage.getItem('a-max-published-equipment') || '[]')
        const listingId = notification.equipmentListing?._id
        if (listingId) {
          localStorage.setItem('a-max-published-equipment', JSON.stringify(stored.filter(item => item.id !== String(listingId))))
        }
      } catch {}
      window.dispatchEvent(new Event('amax:equipment-listing-updated'))
    } catch (requestError) {
      setError(requestError.message || 'Unable to approve this equipment request.')
    }
  }

  const approveCommunityRequest = async (notification, event) => {
    event?.stopPropagation()
    setApprovingCommunityRequestId(notification._id)
    setError('')
    try {
      const result = await approveCommunityJoinRequest(notification)
      const readAt = new Date().toISOString()
      setNotifications(current => current.map(item => item._id === notification._id
        ? { ...item, readAt, communityMembershipRequest: { ...item.communityMembershipRequest, status: result.status } }
        : item))
      window.dispatchEvent(new Event('amax:notifications-read'))
    } catch (requestError) {
      setError(requestError.message || 'Unable to approve this community request.')
    } finally {
      setApprovingCommunityRequestId('')
    }
  }

  const openNotification = async notification => {
    try {
      if (!notification.readAt) {
        const result = await apiRequest(`/notifications/${encodeURIComponent(notification._id)}/read`, { method: 'PATCH' })
        setUnreadCount(result.unreadCount)
        onUnreadCountChange(result.unreadCount)
        window.dispatchEvent(new Event('amax:notifications-read'))
      }
      const contentId = notification.content?._id
      setOpen(false)
      if (notification.type === 'community_join_request') {
        const slug = notification.community?.slug
        navigate(slug ? `/messages?community=${encodeURIComponent(slug)}` : '/communities')
      } else if (notification.type === 'equipment_request' || notification.type === 'equipment_request_approved') {
        const listingId = notification.equipmentListing?._id
        const recipient = notification.actor?.username
        const requestId = notification.equipmentRequest?._id
        navigate(listingId && recipient
          ? `/messages?recipient=${encodeURIComponent(recipient)}&listing=${encodeURIComponent(listingId)}${requestId ? `&request=${encodeURIComponent(requestId)}` : ''}`
          : '/notifications')
      } else {
        navigate(contentId ? `/?film=${encodeURIComponent(contentId)}` : '/notifications')
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to open this notification.')
    }
  }

  return <div className="notification-menu" ref={notificationMenuRef}>
    <button className="icon-button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={open} onClick={() => setOpen(!open)}><Bell size={18}/>{unreadCount > 0 && <i/>}</button>
    {open && <div className="notification-panel">
      <div className="notification-header"><div><span className="eyebrow">YOUR STUDIO</span><h2>Notifications</h2></div><span className="notification-count">{unreadCount} unread</span></div>
      {error && <p className="notification-error" role="alert">{error}</p>}
      {notifications.length ? notifications.map(notification => {
        const copy = notificationCopy(notification)
        return <div className={`notification-item-card ${notification.readAt ? 'read' : 'unread'}`} key={notification._id}>
          <button className={`notification-item ${notification.readAt ? 'read' : 'unread'}`} onClick={() => openNotification(notification)}>
            <span className={`notification-dot notification-${notification.type}`}><Bell size={13}/></span>
            <span><strong>{copy.title}</strong><p>{copy.detail}</p></span>
            {!notification.readAt && <b/>}
          </button>
          {notification.type === 'equipment_request' && notification.equipmentRequest?.status === 'pending' && notification.equipmentListing?.active && (
            <button className="equipment-notification-approve" onClick={event => approveNotificationRequest(notification, event)}>Accept order</button>
          )}
          {notification.type === 'community_join_request' && notification.communityMembershipRequest?.status === 'pending' && (
            <button type="button" className="community-notification-approve" disabled={approvingCommunityRequestId === notification._id} onClick={event => approveCommunityRequest(notification, event)}>
              {approvingCommunityRequestId === notification._id ? 'Approving…' : 'Approve request'}
            </button>
          )}
        </div>
      }) : !error && <p className="notification-empty">You’re all caught up. Film activity will show up here.</p>}
      <Link className="notification-footer" to="/notifications" onClick={() => setOpen(false)}>View all activity <DirectionalChevron size={14}/></Link>
    </div>}
  </div>
}

function Shell({ children, homePreview = false }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clearSession, socket } = useAuthSession()
  const isHome = location.pathname === '/' || homePreview
  const isAuthenticated = Boolean(user)
  const isFilmmaker = Boolean(user && user.preferences?.primaryIdentity === 'filmmaker')
  const isCinephile = Boolean(user && !isFilmmaker)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [remoteFilmResults, setRemoteFilmResults] = useState([])
  const [remoteScriptResults, setRemoteScriptResults] = useState([])
  const [searchFocused, setSearchFocused] = useState(false)
  const [voiceSearchActive, setVoiceSearchActive] = useState(false)
  const [voiceSearchError, setVoiceSearchError] = useState('')
  const [recentSearches, setRecentSearches] = useState(() => { try { return JSON.parse(localStorage.getItem('a-max-recent-searches') || '[]').slice(0, 5) } catch { return [] } })
  const [createOpen, setCreateOpen] = useState(false)
  const [cinephileMenuOpen, setCinephileMenuOpen] = useState(false)
  const [navbarProfile, setNavbarProfile] = useState(() => { try { return JSON.parse(localStorage.getItem('a-max-profile') || 'null') } catch { return null } })
  const filmInputRef = useRef(null)
  const scriptInputRef = useRef(null)
  const createMenuRef = useRef(null)
  const cinephileMenuRef = useRef(null)
  const voiceSearchRef = useRef(null)
  const searchWrapRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = event => {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target)) {
        setCreateOpen(false)
      }
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target)) {
        setSearchFocused(false)
      }
      if (cinephileMenuRef.current && !cinephileMenuRef.current.contains(event.target)) {
        setCinephileMenuOpen(false)
      }
    }
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        setSearchFocused(false)
        setCreateOpen(false)
        setCinephileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    setSearchFocused(false)
    setCinephileMenuOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => () => voiceSearchRef.current?.abort(), [])

  const signOutCinephile = async () => {
    setCinephileMenuOpen(false)
    try { await clearSession() } catch {}
    navigate('/login')
  }

  useEffect(() => {
    if (!user) {
      setUnreadMessageCount(0)
      return undefined
    }
    let active = true
    const refreshUnreadCount = async () => {
      try {
        const conversations = await apiRequest('/messages/conversations')
        if (active) setUnreadMessageCount(conversations.reduce((count, conversation) => count + conversation.unreadCount, 0))
      } catch (error) {
        if (active) console.error('Unable to refresh unread message count:', error)
      }
    }
    const handleConversationUpdate = () => refreshUnreadCount()
    socket?.on('connect', refreshUnreadCount)
    socket?.on('conversation:updated', handleConversationUpdate)
    socket?.on('conversation:read', handleConversationUpdate)
    refreshUnreadCount()
    return () => {
      active = false
      socket?.off('connect', refreshUnreadCount)
      socket?.off('conversation:updated', handleConversationUpdate)
      socket?.off('conversation:read', handleConversationUpdate)
    }
  }, [socket, user])

  useEffect(() => {
    if (!user) {
      setUnreadNotificationCount(0)
      return undefined
    }
    let active = true
    const refreshUnreadNotifications = async () => {
      try {
        const result = await apiRequest('/notifications/unread-count')
        if (active) setUnreadNotificationCount(result.unreadCount)
      } catch (error) {
        if (active) console.error('Unable to refresh unread notification count:', error)
      }
    }
    socket?.on('connect', refreshUnreadNotifications)
    socket?.on('notification:new', refreshUnreadNotifications)
    window.addEventListener('amax:notifications-read', refreshUnreadNotifications)
    refreshUnreadNotifications()
    return () => {
      active = false
      socket?.off('connect', refreshUnreadNotifications)
      socket?.off('notification:new', refreshUnreadNotifications)
      window.removeEventListener('amax:notifications-read', refreshUnreadNotifications)
    }
  }, [socket, user])

  useEffect(() => {
    const syncProfile = () => {
      try { setNavbarProfile(JSON.parse(localStorage.getItem('a-max-profile') || 'null')) } catch { setNavbarProfile(null) }
    }
    syncProfile()
    window.addEventListener('storage', syncProfile)
    window.addEventListener('a-max-profile-updated', syncProfile)
    return () => {
      window.removeEventListener('storage', syncProfile)
      window.removeEventListener('a-max-profile-updated', syncProfile)
    }
  }, [])
  const executeSearch = () => {
    const value = searchQuery.trim()
    if (value) {
      const next = [value, ...recentSearches.filter(item => item.toLowerCase() !== value.toLowerCase())].slice(0, 5)
      setRecentSearches(next)
      localStorage.setItem('a-max-recent-searches', JSON.stringify(next))
      navigate(`/explore?search=${encodeURIComponent(value)}`)
      setSearchFocused(false)
    }
  }

  const submitSearch = event => {
    if (event.key === 'Enter') {
      executeSearch()
    } else if (event.key === 'Escape') {
      setSearchFocused(false)
    }
  }
  const startVoiceSearch = () => {
    if (voiceSearchActive) {
      voiceSearchRef.current?.stop()
      return
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      setVoiceSearchError('Voice search is not available in this browser.')
      setSearchFocused(true)
      return
    }
    setVoiceSearchError('')
    setSearchFocused(true)
    try {
      const recognition = new Recognition()
      recognition.lang = navigator.language || 'en-IN'
      recognition.interimResults = false
      recognition.maxAlternatives = 1
      recognition.onstart = () => setVoiceSearchActive(true)
      recognition.onend = () => {
        setVoiceSearchActive(false)
        if (voiceSearchRef.current === recognition) voiceSearchRef.current = null
      }
      recognition.onerror = event => {
        setVoiceSearchActive(false)
        setVoiceSearchError(event.error === 'not-allowed'
          ? 'Allow microphone access to use voice search.'
          : event.error === 'no-speech'
            ? 'No speech detected. Tap the microphone and try again.'
            : 'Voice search could not start. Please try again.')
      }
      recognition.onresult = event => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim()
        if (transcript) setSearchQuery(transcript)
      }
      voiceSearchRef.current = recognition
      recognition.start()
    } catch {
      setVoiceSearchActive(false)
      setVoiceSearchError('Voice search could not start. Please try again.')
    }
  }
  const localFilms = (() => { try { return JSON.parse(localStorage.getItem('a-max-published-films') || '[]') } catch { return [] } })()
  const localScripts = (() => { try { return JSON.parse(localStorage.getItem('a-max-published-scripts') || '[]').filter(item => item.contentId) } catch { return [] } })()
  const navProfile = {
    name: user?.name || navbarProfile?.name || 'Arjun Mehta',
    role: isFilmmaker ? (navbarProfile?.role && navbarProfile.role !== 'Cinephile' ? navbarProfile.role : 'Filmmaker') : isCinephile ? 'Cinephile' : (navbarProfile?.role || 'Director · Writer'),
    image: profileAvatar(user?.avatarUrl, navbarProfile?.image)
  }
  const query = searchQuery.trim().toLowerCase()
  useEffect(() => {
    if (!query) {
      setRemoteScriptResults([])
      setRemoteFilmResults([])
      return undefined
    }
    let active = true
    const timer = window.setTimeout(async () => {
      try {
        const [serverFilms, serverScripts, serverStories] = await Promise.all([
          apiRequest('/content?type=film'),
          apiRequest('/content?type=script'),
          apiRequest('/content?type=story')
        ])
        if (!Array.isArray(serverFilms) || !Array.isArray(serverScripts) || !Array.isArray(serverStories)) {
          throw new Error('Search response is invalid.')
        }
        if (active) {
          setRemoteFilmResults(serverFilms.map(mapApiFilm))
          setRemoteScriptResults([...serverScripts, ...serverStories].map(mapApiScript))
        }
      } catch (error) {
        if (active) console.error('Unable to search published content:', error)
      }
    }, 250)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [query])

  const allFilmsForSearch = (() => {
    const map = new Map()
    films.forEach(film => map.set(film.id || film.title, film))
    localFilms.forEach(film => map.set(film.contentId || film.localId || film.id || film.title, film))
    remoteFilmResults.forEach(film => map.set(film.contentId || film.id || film.title, film))
    return Array.from(map.values())
  })()

  const searchResults = query ? [
    ...creators.filter(creator => `${creator.name} ${creator.name.toLowerCase().replace(/\s+/g, '-')}`.toLowerCase().includes(query)).map(creator => ({ kind: 'Filmmaker', title: creator.name, detail: creator.role, image: creator.image, path: `/profile/${creator.name.toLowerCase().replace(/\s+/g, '-')}` })),
    ...allFilmsForSearch.filter(film => `${film.title} ${film.creator} ${film.genre || ''}`.toLowerCase().includes(query)).map(film => ({ kind: 'Film', title: film.title, detail: film.creator || 'AMAX Filmmaker', image: film.image || films[0].image, path: film.contentId ? `/?film=${encodeURIComponent(film.contentId)}` : `/explore?search=${encodeURIComponent(film.title)}` })),
    ...[...localScripts, ...remoteScriptResults].filter(script => `${script.title} ${script.creator}`.toLowerCase().includes(query)).map(script => ({ kind: 'Script / Story', title: script.title, detail: script.creator, image: script.image, path: `/explore?section=scripts&search=${encodeURIComponent(script.title)}` })),
  ].slice(0, 6) : []
  const chooseFilm = event => {
    const file = event.target.files?.[0]
    if (file) navigate('/upload?type=film', { state: { file } })
    event.target.value = ''
  }
  const chooseScript = event => {
    const file = event.target.files?.[0]
    if (file) navigate('/upload-script', { state: { file } })
    event.target.value = ''
  }
  return <div className="app-shell">
    <aside className="sidebar" aria-label="Main navigation">
      <a className="brand" href="/" aria-label="AMAX studios"><img className="mv-logo-img mv-collapsed-mark" src={mvLogo} alt="AMAX studios logo" /><span className="mv-wordmark"><img className="mv-logo-img-sm" src={mvLogo} alt="" aria-hidden="true" /><span className="mv-wordmark-text"><span className="mv-wordmark-name">AMAX</span><span className="mv-wordmark-subtitle">studios</span></span></span></a>
      <div className="sidebar-label">Your studio</div>
      <nav className="primary-nav">
        <NavItem to="/" icon={<HomeIcon size={17}/>} label="Home" />
        <NavItem to="/explore" icon={<Compass size={17}/>} label="Explore" />
        <NavItem to="/learn" icon={<BookOpen size={17} strokeWidth={1.8}/>} label="Learn" />
        <NavItem to="/marketplace" icon={<TripodCameraIcon/>} label="Marketplace" />
        <NavItem to="/communities" icon={<ThreePeopleIcon/>} label="Communities" />
      </nav>
      <div className="sidebar-label space-label">Stay connected</div>
      <nav className="primary-nav">
        <NavItem to="/messages" icon={<MessageCircle size={17}/>} label="Messages" badge={unreadMessageCount ? String(Math.min(unreadMessageCount, 99)) : undefined} />
        <NavItem to="/bookmarks" icon={<Bookmark size={17}/>} label="Bookmarks" />
        <NavItem to="/notifications" icon={<Bell size={17}/>} label="Notifications" badge={unreadNotificationCount ? String(Math.min(unreadNotificationCount, 99)) : undefined} />
        {isAuthenticated && <NavItem to="/settings/preferences" icon={<SlidersHorizontal size={17} strokeWidth={1.8}/>} label="Preferences" />}
      </nav>
      <div className="sidebar-bottom">
        {isAuthenticated ? (
          isCinephile ? (
            <div className="cinephile-profile-wrap" ref={cinephileMenuRef}>
              <button className="profile-mini cinephile-profile-btn" onClick={() => setCinephileMenuOpen(o => !o)} aria-expanded={cinephileMenuOpen}>
                <img src={navProfile.image} onError={usePlaceholderOnAvatarError} alt=""/>
                <span><strong>{navProfile.name}</strong><small className="eyebrow warm">CINEPHILE</small></span>
                <ChevronDown size={15}/>
              </button>
              {cinephileMenuOpen && (
                <div className="cinephile-dropdown">
                  <button className="cinephile-signout-btn" onClick={signOutCinephile}><LogOut size={15}/> Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <Link className="profile-mini" to="/profile"><img src={navProfile.image} onError={usePlaceholderOnAvatarError} alt=""/><span><strong>{navProfile.name}</strong><small>{navProfile.role}</small></span><DirectionalChevron size={15}/></Link>
          )
        ) : (
          <Link className="profile-mini guest-profile" to="/login"><UserCircle size={32}/><span><strong>Sign in</strong><small>Access your profile</small></span><LogIn size={15}/></Link>
        )}
        <div className="studio-note"><Sparkles size={15}/><span>Make something<br/><strong>worth watching.</strong></span></div>
      </div>
    </aside>
    <main className={`main-content ${isHome ? 'main-content-home' : ''}`}>
      {isHome && <header className="topbar">
        <a className="mobile-brand" href="/" aria-label="AMAX studios home"><span className="mv-wordmark"><span className="mv-wordmark-name">AMAX</span><span className="mv-wordmark-subtitle">studios</span></span></a>
        <div ref={searchWrapRef} className={`search-wrap ${voiceSearchActive ? 'voice-listening' : ''}`}>
          <div className="search-trigger">
            <button
              type="button"
              className="search-leading-btn"
              onClick={executeSearch}
              title="Search"
              aria-label="Submit search"
            >
              <Search className="search-leading-icon" size={20} aria-hidden="true"/>
            </button>
            <input
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onChange={event => { setSearchQuery(event.target.value); setVoiceSearchError('') }}
              onKeyDown={submitSearch}
              placeholder="Search films, people, ideas..."
              aria-label="Search films, people, ideas"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => { setSearchQuery(''); setSearchFocused(false) }}
                title="Clear search"
                aria-label="Clear search query"
              >
                ✕
              </button>
            )}
            <button className={`voice-search-button ${voiceSearchActive ? 'is-listening' : ''}`} type="button" onMouseDown={event => event.preventDefault()} onClick={startVoiceSearch} aria-label={voiceSearchActive ? 'Stop voice search' : 'Search by voice'} aria-pressed={voiceSearchActive} title={voiceSearchActive ? 'Listening — click to stop' : 'Search by voice'}>
              <Mic size={20} aria-hidden="true"/>
            </button>
          </div>
          {searchFocused && (query
            ? <div className="search-results">{searchResults.length ? searchResults.map(result => <Link key={`${result.kind}-${result.title}`} to={result.path} onClick={() => { setSearchQuery(''); setSearchFocused(false) }}><img src={result.image} alt=""/><span><strong>{result.title}</strong><small>{result.kind} · {result.detail}</small></span><DirectionalChevron size={14}/></Link>) : <p className="search-empty">No films, filmmakers, or scripts found.</p>}</div>
            : voiceSearchError
              ? <div className="search-results"><p className="search-empty" role="status">{voiceSearchError}</p></div>
              : recentSearches.length > 0 && <div className="search-results recent-searches"><div className="recent-heading"><span>Recent searches</span><button onMouseDown={event => event.preventDefault()} onClick={() => { setRecentSearches([]); localStorage.removeItem('a-max-recent-searches') }}>Clear</button></div>{recentSearches.slice(0, 5).map(item => <button className="recent-search-item" key={item} onMouseDown={event => event.preventDefault()} onClick={() => { setSearchQuery(item); navigate(`/explore?search=${encodeURIComponent(item)}`); setSearchFocused(false) }}><Search size={14}/><span>{item}</span><DirectionalChevron size={13}/></button>)}</div>)}
        </div>
        <div className="top-actions">
          <NotificationMenu onUnreadCountChange={setUnreadNotificationCount}/>
          {(!isAuthenticated || isFilmmaker) && <div className="create-menu" ref={createMenuRef}>
            <button className="upload-button" onClick={() => isAuthenticated ? setCreateOpen(!createOpen) : navigate('/login')} aria-expanded={isAuthenticated ? createOpen : undefined}><Camera size={20} strokeWidth={2.1}/><span>Create</span></button>
            {createOpen && <div className="create-dropdown">
              <button onClick={() => { setCreateOpen(false); filmInputRef.current?.click() }}><Film size={16}/><strong>Film</strong></button>
              <button onClick={() => { setCreateOpen(false); scriptInputRef.current?.click() }}><ScrollText size={16}/><strong>Script/Story</strong></button>
              <button type="button" onClick={() => { setCreateOpen(false); navigate('/upload?type=equipment') }}><Camera size={16}/><strong>Equipment</strong></button>
            </div>}
          </div>}
          <input ref={filmInputRef} className="hidden-file-input" type="file" accept="video/mp4,.mp4" onChange={chooseFilm}/>
          <input ref={scriptInputRef} className="hidden-file-input" type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,.pdf,.doc,.docx,.txt" onChange={chooseScript}/>
        </div>
      </header>}
      <div className="page-wrap">{children}</div>
    </main>
  </div>
}

function TripodCameraIcon() {
  return <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="5" r="2.2"/><circle cx="14.5" cy="5" r="2.7"/>
    <rect x="3" y="9" width="13" height="7" rx="1.3"/><path d="M16 11h3l2-1.5v6L19 14h-3"/>
    <path d="M9.5 16v2.5m0 0L5 23m4.5-4.5L14 23m-4.5-4.5V23"/>
  </svg>
}

function ThreePeopleIcon() {
  return <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="6.5" r="3.1"/><circle cx="5" cy="8.2" r="2.25"/><circle cx="19" cy="8.2" r="2.25"/>
    <path d="M4.3 20.5a7.7 7.7 0 0 1 15.4 0"/><path d="M1.5 18.8a4.5 4.5 0 0 1 5.4-4.4m15.6 4.4a4.5 4.5 0 0 0-5.4-4.4"/>
  </svg>
}

function NavItem({ to, icon, label, badge }) { return <NavLink className="nav-item" to={to} title={label}>{icon}<span>{label}</span>{badge !== undefined && <b>{badge || '•'}</b>}</NavLink> }

function GlassPointerTracker() {
  useEffect(() => {
    const interactiveSelector = 'button, .nav-item, a.primary-button, a.outline-button, a.text-button, a.upload-button, a.hero-action-button, a.publish-button'
    let activeControl = null
    let pendingPointer = null
    let frame = 0

    const clearActiveControl = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      pendingPointer = null
      activeControl?.style.removeProperty('--glass-x')
      activeControl?.style.removeProperty('--glass-y')
      activeControl = null
    }

    const handlePointerMove = event => {
      if (event.pointerType === 'touch') return
      const target = event.target instanceof Element ? event.target.closest(interactiveSelector) : null
      if (!target || target.matches(':disabled')) {
        clearActiveControl()
        return
      }

      const bounds = target.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return
      pendingPointer = {
        target,
        x: Math.max(0, Math.min(bounds.width, event.clientX - bounds.left)),
        y: Math.max(0, Math.min(bounds.height, event.clientY - bounds.top))
      }

      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0
          if (!pendingPointer) return
          const { target: nextControl, x, y } = pendingPointer
          if (activeControl && activeControl !== nextControl) {
            activeControl.style.removeProperty('--glass-x')
            activeControl.style.removeProperty('--glass-y')
          }
          activeControl = nextControl
          activeControl.style.setProperty('--glass-x', `${x}px`)
          activeControl.style.setProperty('--glass-y', `${y}px`)
        })
      }
    }

    const handlePointerOut = event => {
      const nextTarget = event.relatedTarget
      if (activeControl && event.target instanceof Node && activeControl.contains(event.target) && !(nextTarget instanceof Node && activeControl.contains(nextTarget))) {
        clearActiveControl()
      }
    }

    const handlePointerDown = event => {
      if (event.pointerType === 'touch') clearActiveControl()
    }

    document.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.addEventListener('pointerout', handlePointerOut, true)
    document.addEventListener('pointerdown', handlePointerDown, { passive: true })
    window.addEventListener('blur', clearActiveControl)
    document.addEventListener('visibilitychange', clearActiveControl)
    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerout', handlePointerOut, true)
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('blur', clearActiveControl)
      document.removeEventListener('visibilitychange', clearActiveControl)
      clearActiveControl()
    }
  }, [])

  return null
}

export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { scrollPageToTop() }, [pathname])
  return null
}

function SectionTitle({ eyebrow, title, action = 'View all', to }) { return <div className="section-title"><div>{title ? <><h2>{title}</h2><span className="eyebrow">{eyebrow}</span></> : <h2 className="section-title-primary">{eyebrow}</h2>}</div>{to ? <Link className="text-button" to={to}>{action}<DirectionalChevron size={15}/></Link> : <button>{action}<DirectionalChevron size={15}/></button>}</div> }

function FilmDetailsOverlay({ film, liked, likeCount, likeError, onToggleLike, onClose }) {
  const [playing, setPlaying] = useState(false)
  const [videoSource, setVideoSource] = useState('')
  const [videoError, setVideoError] = useState('')

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = event => {
      if (event.key === 'Escape' && !playing) onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose, playing])

  useEffect(() => () => {
    if (videoSource.startsWith('blob:')) URL.revokeObjectURL(videoSource)
  }, [videoSource])

  const playFilm = async () => {
    setVideoError('')
    try {
      let source = film.video || ''
      if (film.videoKey) {
        const video = await readFilmVideo(film.videoKey)
        if (video) source = URL.createObjectURL(video)
      }
      if (!source) throw new Error('This film has no playable video attached. Re-publish it with the original MP4 to enable playback.')
      setVideoSource(source)
      setPlaying(true)
    } catch (error) {
      setVideoError(error.message || 'Unable to play this film.')
    }
  }

  const discussFilm = () => {
    const commentInput = document.getElementById('film-comment-input')
    if (!commentInput) return
    commentInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.setTimeout(() => commentInput.focus({ preventScroll: true }), 300)
  }

  const cast = film.cast?.length
    ? film.cast
    : [{ name: film.creator || 'A-MAX filmmaker', role: 'Filmmaker', username: (film.creator || 'filmmaker').toLowerCase().replace(/[^a-z0-9]+/g, '-'), image: `https://i.pravatar.cc/160?u=${encodeURIComponent(film.creator || film.title)}` }]
  return createPortal(<div className="film-overlay-backdrop" role="dialog" aria-modal="true" aria-label={`${film.title} film details`} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    {playing ? <section className="film-fullscreen-player" aria-label={`${film.title} video player`}><CinematicVideoPlayer src={videoSource} title={film.title} creator={film.creator} poster={film.image} onBack={() => { setPlaying(false); setVideoError('') }}/></section> : <article className="film-overlay-panel">
      <button className="film-overlay-close" onClick={onClose} aria-label="Close film details">×</button>
      <header className="film-overlay-hero">
        <MediaImage className="film-overlay-poster" image={film.image} imageKey={film.imageKey} alt={`${film.title} poster`}/>
        <div className="film-overlay-gradient"/>
        <div className="film-overlay-copy">
          {film.accent && film.accent !== 'Community release' && <span className="eyebrow warm">{film.accent}</span>}
          <h1>{film.title}</h1>
          <div className="film-overlay-meta"><span>{film.genre || 'Short film'}</span><span>AMAX RATING · {film.rating || 'Not rated'}</span></div>
          <div className="film-overlay-actions">
            <button className="primary-button" onClick={playFilm}><Play size={16} fill="currentColor"/> Watch film</button>
            <button className={`outline-button film-like-action ${liked ? 'liked' : ''}`} aria-pressed={liked} onClick={onToggleLike}><Heart size={16} fill={liked ? 'currentColor' : 'none'}/>{liked ? 'Liked' : 'Like'} · {likeCount}</button>
            {film.contentId && <button className="outline-button film-like-action film-discuss-action" onClick={discussFilm}><MessageCircle size={14}/> Discuss</button>}
          </div>
          {likeError && <p className="film-play-error" role="alert">{likeError}</p>}
          {videoError && <p className="film-play-error" role="alert">{videoError}</p>}
        </div>
      </header>
      <div className="film-overlay-details">
        <section className="film-overlay-summary"><span className="eyebrow">ABOUT THE FILM</span><p>{film.description || `${film.title} is a ${film.genre || 'short film'} by ${film.creator || 'the A-MAX community'}. Discover the story and the artists behind it.`}</p></section>
        <section className="film-overlay-cast"><div className="film-overlay-section-heading"><span className="eyebrow">CAST & CREW</span></div><div className="film-cast-list">{cast.map(person => <Link className="film-person-row" to={`/profile/${person.username}`} key={`${person.name}-${person.role}`} onClick={onClose}><img src={person.image || `https://i.pravatar.cc/160?u=${encodeURIComponent(person.name)}`} alt=""/><span><strong>{person.name}</strong><small>{person.role}</small></span><DirectionalChevron size={15}/></Link>)}</div></section>
      </div>
      {film.contentId && <FilmComments contentId={film.contentId}/>}
    </article>}
  </div>, document.body)
}

function getFilmLikeKey(film) {
  if (!film) return ''
  return String(film.contentId || film.id || film.title || '').trim().toLowerCase()
}

function getStoredFilmLikeState(film, userId) {
  try {
    const key = getFilmLikeKey(film)
    if (!key) return false
    const storageKey = `a-max-film-likes-${userId || 'guest'}`
    const likesMap = JSON.parse(localStorage.getItem(storageKey) || '{}')
    return Boolean(likesMap[key])
  } catch {
    return false
  }
}

function setStoredFilmLikeState(film, userId, isLiked) {
  try {
    const key = getFilmLikeKey(film)
    if (!key) return
    const storageKey = `a-max-film-likes-${userId || 'guest'}`
    const likesMap = JSON.parse(localStorage.getItem(storageKey) || '{}')
    if (isLiked) {
      likesMap[key] = true
    } else {
      delete likesMap[key]
    }
    localStorage.setItem(storageKey, JSON.stringify(likesMap))
    window.dispatchEvent(new CustomEvent('amax:film-like-updated', {
      detail: { filmKey: key, liked: isLiked, userId: userId || 'guest' }
    }))
  } catch {}
}

function getStoredFilmLikeCount(film, baseCount = 0) {
  try {
    const key = getFilmLikeKey(film)
    if (!key) return baseCount
    const storedCounts = JSON.parse(localStorage.getItem('a-max-film-like-counts') || '{}')
    if (typeof storedCounts[key] === 'number') {
      return storedCounts[key]
    }
    return baseCount
  } catch {
    return baseCount
  }
}

function setStoredFilmLikeCount(film, count) {
  try {
    const key = getFilmLikeKey(film)
    if (!key) return
    const storedCounts = JSON.parse(localStorage.getItem('a-max-film-like-counts') || '{}')
    storedCounts[key] = Math.max(0, count)
    localStorage.setItem('a-max-film-like-counts', JSON.stringify(storedCounts))
    window.dispatchEvent(new CustomEvent('amax:film-like-count-updated', {
      detail: { filmKey: key, count: storedCounts[key] }
    }))
  } catch {}
}

function FilmCard({ film, wide = false, showAccent = true, profileContext = false }) {
  const { user } = useAuthSession()
  const [searchParams, setSearchParams] = useSearchParams()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [liked, setLiked] = useState(() => Boolean(film.liked || getStoredFilmLikeState(film, user?.id)))
  const [likeCount, setLikeCount] = useState(() => getStoredFilmLikeCount(film, Number(film.likes) || 0))
  const [likeError, setLikeError] = useState('')
  const likeRequest = useRef(false)
  const filmKey = String(film.contentId || film.id || film.localId || film.title || '')
  const autoOpen = searchParams.get('film') === filmKey

  useEffect(() => {
    setLiked(Boolean(film.liked || getStoredFilmLikeState(film, user?.id)))
    setLikeCount(getStoredFilmLikeCount(film, Number(film.likes) || 0))
  }, [film.contentId, film.id, film.liked, film.likes, film.title, user?.id])

  useEffect(() => {
    const key = getFilmLikeKey(film)
    const handleLikeUpdate = event => {
      if (event.detail?.filmKey === key) {
        setLiked(event.detail.liked)
      }
    }
    const handleCountUpdate = event => {
      if (event.detail?.filmKey === key) {
        setLikeCount(event.detail.count)
      }
    }
    window.addEventListener('amax:film-like-updated', handleLikeUpdate)
    window.addEventListener('amax:film-like-count-updated', handleCountUpdate)
    return () => {
      window.removeEventListener('amax:film-like-updated', handleLikeUpdate)
      window.removeEventListener('amax:film-like-count-updated', handleCountUpdate)
    }
  }, [film])

  useEffect(() => {
    setDetailsOpen(autoOpen)
  }, [autoOpen])

  const closeDetails = () => {
    setDetailsOpen(false)
    if (autoOpen) {
      const next = new URLSearchParams(searchParams)
      next.delete('film')
      setSearchParams(next, { replace: true, preventScrollReset: true })
    }
  }

  const openDetails = () => {
    if (profileContext && filmKey) {
      const next = new URLSearchParams(searchParams)
      next.delete('script')
      next.set('film', filmKey)
      setSearchParams(next, { preventScrollReset: true })
      return
    }
    setDetailsOpen(true)
  }

  const toggleLike = async event => {
    event?.stopPropagation()
    if (likeRequest.current) return
    likeRequest.current = true
    setLikeError('')

    const wasLiked = liked
    const nextLiked = !wasLiked
    const nextCount = Math.max(0, likeCount + (nextLiked ? 1 : -1))

    setLiked(nextLiked)
    setLikeCount(nextCount)
    setStoredFilmLikeState(film, user?.id, nextLiked)
    setStoredFilmLikeCount(film, nextCount)

    if (film.contentId && user) {
      try {
        const result = await apiRequest(`/content/${encodeURIComponent(film.contentId)}/like`, {
          method: 'PUT',
          body: JSON.stringify({ liked: nextLiked })
        })
        if (typeof result.liked === 'boolean') {
          setLiked(result.liked)
          setStoredFilmLikeState(film, user?.id, result.liked)
        }
        if (typeof result.likes === 'number') {
          setLikeCount(result.likes)
          setStoredFilmLikeCount(film, result.likes)
        }
      } catch (error) {
        setLiked(wasLiked)
        setLikeCount(likeCount)
        setStoredFilmLikeState(film, user?.id, wasLiked)
        setStoredFilmLikeCount(film, likeCount)
        setLikeError(error.message || 'Unable to update this film like.')
      } finally {
        likeRequest.current = false
      }
    } else {
      likeRequest.current = false
    }
  }

  return <>
    <article className={`film-card ${wide ? 'wide' : ''}`} onClick={openDetails} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDetails() } }} role="button" tabIndex="0" aria-label={`View ${film.title}`}>
      <div className="film-image"><MediaImage image={film.image} imageKey={film.imageKey} alt={`${film.title} poster`}/>{showAccent && film.accent && film.accent !== 'Community release' && <span className="film-accent">{film.accent}</span>}<button className="play-button" aria-label={`Watch ${film.title}`} onClick={event => { event.stopPropagation(); openDetails() }}><Play size={15} fill="currentColor"/></button><button className={`heart-button ${liked ? 'liked' : ''}`} aria-label={liked ? `Unlike ${film.title}` : `Like ${film.title}`} aria-pressed={liked} onClick={toggleLike} title={liked ? `Liked (${likeCount})` : `Like (${likeCount})`}><Heart size={17} fill={liked ? 'currentColor' : 'none'}/></button></div>
      <div className="film-meta"><div><h3>{film.title}</h3><small>{film.genre}</small></div></div>
    </article>
    {likeError && !detailsOpen && <p className="film-card-error" role="alert">{likeError}</p>}
    {detailsOpen && <FilmDetailsOverlay film={film} liked={liked} likeCount={likeCount} likeError={likeError} onToggleLike={toggleLike} onClose={closeDetails}/>}
  </>
}

function ScriptReader({ script, saved, savedCount, saving, saveError, onToggleBookmark, onClose }) {
  const [documentUrl, setDocumentUrl] = useState(script.documentUrl || '')
  const [documentContent, setDocumentContent] = useState('')
  const [documentKind, setDocumentKind] = useState('loading')
  const [documentError, setDocumentError] = useState('')
  const [immersive, setImmersive] = useState(false)
  const [immersiveFallback, setImmersiveFallback] = useState(false)
  const viewerRef = useRef(null)
  const writer = script.writerProfile || (() => {
    const knownCreator = creators.find(creator => creator.name.toLowerCase() === script.creator?.toLowerCase())
    const username = script.creator?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'writer'
    return {
      name: script.creator || 'AMAX Writer',
      image: knownCreator?.image || `https://i.pravatar.cc/160?u=${encodeURIComponent(script.creator || 'amax-writer')}`,
      to: knownCreator ? `/profile/${username}` : script.creator === 'Arjun Mehta' ? '/profile' : `/profile/${username}`
    }
  })()

  useEffect(() => {
    let active = true
    const extension = script.documentType || documentUrl.split('?')[0].split('.').pop()?.toLowerCase() || 'pdf'
    if (documentUrl) {
      if (extension === 'pdf') {
        setDocumentKind('pdf')
        setDocumentError('')
        return () => { active = false }
      }
      if (extension === 'doc') {
        setDocumentKind('unsupported')
        setDocumentError('')
        return () => { active = false }
      }
      if (!['docx', 'txt'].includes(extension)) {
        setDocumentKind('error')
        setDocumentError('This document format cannot be previewed.')
        return () => { active = false }
      }
      fetch(documentUrl)
        .then(response => {
          if (!response.ok) throw new Error(`Document request failed (${response.status}).`)
          return extension === 'txt' ? response.text() : response.arrayBuffer()
        })
        .then(async content => {
          if (extension === 'txt') return content
          const mammothModule = await import('mammoth')
          const mammoth = mammothModule.default || mammothModule
          return mammoth.extractRawText({ arrayBuffer: content })
        })
        .then(result => {
          if (!active) return
          const text = typeof result === 'string' ? result : result.value
          setDocumentContent(text)
          setDocumentKind('text')
        })
        .catch(error => {
          if (!active) return
          setDocumentKind('error')
          setDocumentError(error.message || 'Unable to load the uploaded document.')
        })
      return () => { active = false }
    }
    if (!script.documentKey) {
      setDocumentKind('error')
      setDocumentError('No uploaded document is available for this script.')
      return () => { active = false }
    }
    readScriptDocument(script.documentKey)
      .then(document => {
        if (!active) return
        if (!document) {
          setDocumentKind('error')
          setDocumentError('The uploaded script PDF could not be found in this browser.')
          return
        }
        setDocumentUrl(document instanceof Blob ? URL.createObjectURL(document) : document)
      })
      .catch(error => {
        if (!active) return
        setDocumentKind('error')
        setDocumentError(error.message || 'Unable to load the uploaded document.')
      })
    return () => { active = false }
  }, [documentUrl, script.documentKey, script.documentType])

  useEffect(() => () => {
    if (documentUrl.startsWith('blob:')) URL.revokeObjectURL(documentUrl)
  }, [documentUrl])

  useEffect(() => {
    const closeOnEscape = event => {
      if (event.key !== 'Escape') return
      if (document.fullscreenElement === viewerRef.current) return
      if (immersive) {
        event.preventDefault()
        setImmersive(false)
        setImmersiveFallback(false)
        return
      }
      onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [immersive, onClose])
  useEffect(() => {
    const syncFullscreen = () => {
      const isFullscreen = document.fullscreenElement === viewerRef.current
      setImmersive(isFullscreen)
      if (isFullscreen) setImmersiveFallback(false)
      else setImmersiveFallback(false)
    }
    document.addEventListener('fullscreenchange', syncFullscreen)
    return () => document.removeEventListener('fullscreenchange', syncFullscreen)
  }, [])
  useEffect(() => {
    document.body.classList.add('script-reader-open')
    return () => document.body.classList.remove('script-reader-open')
  }, [])

  const enterImmersive = async () => {
    const viewer = viewerRef.current
    if (viewer?.requestFullscreen) {
      try {
        await viewer.requestFullscreen()
        setImmersive(true)
        setImmersiveFallback(false)
        return
      } catch {
        // Keep a CSS-only immersive mode available when native fullscreen is blocked.
      }
    }
    setImmersive(true)
    setImmersiveFallback(true)
  }
  const exitImmersive = async () => {
    setImmersive(false)
    setImmersiveFallback(false)
    if (document.fullscreenElement && document.exitFullscreen) {
      try { await document.exitFullscreen() } catch { /* The CSS viewer state is already restored. */ }
    }
  }
  const toggleImmersive = () => immersive ? exitImmersive() : enterImmersive()
  const pdfViewerUrl = documentUrl ? `${documentUrl}${documentUrl.includes('#') ? '&' : '#'}toolbar=0&navpanes=0&scrollbar=1&view=FitH` : ''

  return createPortal(<div className="script-viewer-backdrop" role="dialog" aria-modal="true" aria-label={`${script.title} reader`}><section ref={viewerRef} className={`script-viewer${immersive ? ' is-immersive' : ''}`}><header className="script-viewer-header"><Link className="script-writer-profile" to={writer.to} onClick={onClose}><img src={writer.image} alt=""/><span><small>WRITTEN BY</small><strong>{writer.name}</strong></span></Link><div className="script-reader-title"><span className="eyebrow warm">READING NOW</span><h1>{script.title}</h1><p>{script.type}</p></div><div className="script-reader-actions">{script.contentId && <button className={`script-reader-save ${saved ? 'saved' : ''}`} disabled={saving} aria-pressed={saved} onClick={onToggleBookmark}><Bookmark size={15} fill={saved ? 'currentColor' : 'none'}/><span>{saving ? 'Saving…' : `${savedCount} saves`}</span></button>}<button className="script-reader-immersive" onClick={toggleImmersive} aria-label="Enter immersive reading mode" title="Immersive reading"><Expand size={18}/></button><button className="script-viewer-close" onClick={onClose} aria-label="Close script reader" title="Close reader"><span aria-hidden="true">×</span></button></div></header>{saveError && <p className="script-save-error script-reader-save-error" role="alert">{saveError}</p>}{immersive && immersiveFallback && <button className="script-immersive-exit" onClick={exitImmersive} aria-label="Exit immersive reading mode" title="Exit immersive reading"><Minimize2 size={18}/></button>}<div className="script-viewer-page">{documentKind === 'pdf' && documentUrl ? <iframe className="script-document-frame" src={pdfViewerUrl} title={`${script.title} uploaded PDF`} /> : documentKind === 'text' ? <article className="script-document script-document-text">{documentContent}</article> : documentKind === 'unsupported' ? <div className="script-document-empty" role="status"><strong>Preview unavailable</strong><p>This legacy Word document can’t be previewed. Ask the writer to upload a PDF.</p></div> : <div className="script-document-empty" role={documentKind === 'error' ? 'alert' : 'status'}>{documentError || 'Loading uploaded document…'}</div>}</div></section></div>, document.body)
}

function ScriptCard({ script, profileContext = false }) {
  const { user } = useAuthSession()
  const { toggleBookmark, isBookmarked, getSavedCount } = useBookmarks()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [readerOpen, setReaderOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const type = script.contentType || (script.type?.toLowerCase().includes('story') ? 'story' : 'script')
  const pageCount = Number(script.pageCount) || Number(script.type?.match(/\b(\d+)\s*pages?\b/i)?.[1]) || 0
  const item = { ...script, type }
  const saved = isBookmarked(item)
  const savedCount = getSavedCount(item)
  const scriptKey = String(script.contentId || script.id || script.title || '')
  const autoOpen = searchParams.get('script') === scriptKey
  const openReader = () => {
    if (profileContext && scriptKey) {
      const next = new URLSearchParams(searchParams)
      next.delete('film')
      next.set('script', scriptKey)
      setSearchParams(next, { preventScrollReset: true })
      return
    }
    setReaderOpen(true)
  }

  useEffect(() => {
    setReaderOpen(autoOpen)
  }, [autoOpen])

  useEffect(() => {
    if (!readerOpen || !script.contentId || !user?.id) return
    apiRequest(`/content/${encodeURIComponent(script.contentId)}/view`, { method: 'POST' }).catch(() => {})
  }, [readerOpen, script.contentId, user?.id])

  const closeReader = () => {
    setReaderOpen(false)
    if (autoOpen) {
      const next = new URLSearchParams(searchParams)
      next.delete('script')
      setSearchParams(next, { replace: true, preventScrollReset: true })
    }
  }

  const save = async event => {
    event.stopPropagation()
    setSaveError('')
    if (!user) {
      navigate('/login', { state: { from: script.contentId ? `/?script=${encodeURIComponent(script.contentId)}` : '/explore?section=scripts' } })
      return
    }
    if (!script.contentId) {
      setSaveError('This script is not published to your AMAX library and cannot be saved.')
      return
    }
    if (saving) return
    setSaving(true)
    try {
      await toggleBookmark(item)
    } catch (error) {
      setSaveError(error.message || 'Unable to save this script. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return <>
    <article className="script-card" onClick={openReader} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openReader() } }} role="button" tabIndex="0" aria-label={`Read ${script.title}${pageCount ? `, ${pageCount} pages` : ''}`}>
      <div className="script-card-cover"><MediaImage image={script.image} imageKey={script.imageKey} alt={`${script.title} cover`}/>{pageCount > 0 && <span className="script-page-count">{pageCount} {pageCount === 1 ? 'page' : 'pages'}</span>}</div>
      <div className="script-card-copy">
        <h3>{script.title}</h3>
        <p className="script-card-writer">{script.creatorUsername
          ? <Link to={`/profile/${script.creatorUsername}`} onClick={event => event.stopPropagation()}>{script.creator}</Link>
          : script.creator}</p>
        {script.description && <p className="script-card-logline">{script.description}</p>}
      </div>
      <button className={`script-bookmark-button ${saved ? 'saved' : ''}`} disabled={saving || !script.contentId} aria-label={saving ? `Saving ${script.title}` : saved ? `Remove ${script.title} from saved items` : `Save ${script.title}`} title={saved ? 'Saved' : 'Save'} aria-pressed={saved} onClick={save}>
        <Bookmark size={16} fill={saved ? 'currentColor' : 'none'}/>
      </button>
      {saveError && <span className="script-save-error" role="alert">{saveError}</span>}
    </article>
    {readerOpen && <ScriptReader script={script} saved={saved} savedCount={savedCount} saving={saving} saveError={saveError} onToggleBookmark={save} onClose={closeReader}/>}
  </>
}

function EquipmentCard({ item }) { return <Link className="equipment-card" to={`/marketplace/${item.id}`}><div><MediaImage image={item.image} imageKey={item.imageKey} alt={item.title}/></div><div className="equipment-meta"><h3>{item.title}</h3><small>{item.category}</small><strong>{listingPrice(item)}</strong></div></Link> }

function ExploreProfileCard({ profile }) {
  const username = profile.username || profile.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'filmmaker'
  const name = profile.name || username
  return <article className="creator-card creator-card-link">
    <Link className="creator-card-profile" to={`/profile/${username}`}>
      <img src={profile.image || PROFILE_AVATAR_PLACEHOLDER} alt="" onError={usePlaceholderOnAvatarError}/>
      <div><h3>{name}</h3><p>{profile.role || 'Filmmaker'}</p></div>
    </Link>
    <Link className="creator-network-link" to={`/messages?recipient=${encodeURIComponent(name)}`}>Network <DirectionalChevron size={13}/></Link>
  </article>
}

function marketplaceListings() {
  const featured = equipment.map((item, index) => {
    const [category, condition] = item.detail.split(' · ')
    const isRental = item.price.includes('/ day')
    return { ...item, id: `featured-${index}`, category, condition, listingType: isRental ? 'rent' : 'sale', salePrice: isRental ? '' : item.price, rentalPrice: isRental ? item.price.replace(' / day', '') : '', location: 'A-MAX community', description: `${item.title} available from ${item.seller}. Contact the seller to confirm availability and collection details.` }
  })
  let posted = []
  try { posted = JSON.parse(localStorage.getItem('a-max-published-equipment') || '[]') } catch { posted = [] }
  return [...posted.map((item, index) => ({ ...item, id: item.id || `posted-${index}`, category: item.category || item.detail?.split(' · ')[0] || 'Equipment', condition: item.condition || item.detail?.split(' · ')[1] || 'Used', listingType: item.listingType || (item.rentalPrice || item.price?.includes('/ day') ? 'rent' : item.salePrice || item.price ? 'sale' : 'exchange'), salePrice: item.listingType === 'exchange' ? '' : item.salePrice || (item.price && !item.price.includes('/ day') ? item.price : ''), rentalPrice: item.listingType === 'exchange' ? '' : item.rentalPrice || (item.price?.includes('/ day') ? item.price.replace(' / day', '') : ''), location: item.location || 'A-MAX community', description: item.description || 'A community marketplace listing. Contact the seller for more details.' })), ...featured]
}

function mapApiEquipment(item) {
  return {
    ...item,
    category: item.category || 'Equipment',
    condition: item.condition || 'Used',
    listingType: item.listingType || (item.rentalPrice !== '' && item.rentalPrice != null ? 'rent' : item.salePrice !== '' && item.salePrice != null ? 'sale' : 'exchange'),
    salePrice: item.salePrice ?? '',
    rentalPrice: item.rentalPrice ?? ''
  }
}

function listingPrice(item) {
  if (item.listingType === 'exchange') return 'Open to exchange'
  if (item.listingType === 'rent' || (item.rentalPrice !== '' && item.rentalPrice != null)) return `${formatInr(item.rentalPrice)} / day`
  return formatInr(item.salePrice) || 'Price on request'
}

function formatInr(value) {
  if (value === undefined || value === null || value === '') return ''
  const numericValue = Number(String(value).replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(numericValue)) return String(value).replace(/\$/g, '₹')
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(numericValue)
}

function MarketplacePage() {
  const { socket } = useAuthSession()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [listingsSource, setListingsSource] = useState(marketplaceListings)
  const [loadError, setLoadError] = useState('')
  useEffect(() => {
    let active = true
    apiRequest('/equipment')
      .then(items => {
        if (!Array.isArray(items)) throw new Error('Marketplace response is invalid.')
        if (!active) return
        const localListings = marketplaceListings()
        const serverItems = items.map(mapApiEquipment)
        const serverIds = new Set(serverItems.map(item => item.id))
        setListingsSource([...serverItems, ...localListings.filter(item => !serverIds.has(item.id))])
      })
      .catch(error => {
        if (active) setLoadError(error.message || 'Unable to load marketplace listings.')
      })
    return () => { active = false }
  }, [])
  useEffect(() => {
    const handleListingCreated = newListing => {
      const mapped = mapApiEquipment(newListing)
      setListingsSource(current => [mapped, ...current.filter(item => item.id !== mapped.id)])
    }
    const handleListingRemoved = event => {
      setListingsSource(current => current.filter(item => item.id !== event.listingId))
    }
    socket?.on('equipment:listing:created', handleListingCreated)
    socket?.on('equipment:listing:removed', handleListingRemoved)
    return () => {
      socket?.off('equipment:listing:created', handleListingCreated)
      socket?.off('equipment:listing:removed', handleListingRemoved)
    }
  }, [socket])
  const listings = listingsSource.filter(item => {
    const matchesSearch = `${item.title} ${item.seller} ${item.category} ${item.location}`.toLowerCase().includes(search.trim().toLowerCase())
    const matchesFilter = filter === 'all'
      || (filter === 'rent' && (item.listingType === 'rent' || Boolean(item.rentalPrice)))
      || (filter === 'sale' && item.listingType !== 'exchange' && (item.listingType === 'sale' || Boolean(item.salePrice)))
      || (filter === 'exchange' && item.listingType === 'exchange')
    return matchesSearch && matchesFilter
  })
  return <div className="marketplace-page"><div className="marketplace-heading"><div className="marketplace-heading-copy"><h1 className="marketplace-wordmark"><span className="logo-a">M</span><span className="logo-max">ARKETPLACE</span></h1><span className="eyebrow section-page-tagline">GEAR FOR EVERY FRAME</span></div><label className="marketplace-search"><Search size={16}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search cameras, lenses, lighting..." aria-label="Search marketplace"/></label></div><div className="marketplace-toolbar"><div className="filter-row marketplace-filter-row" role="group" aria-label="Marketplace filters"><button aria-pressed={filter === 'all'} className={filter === 'all' ? 'filter-active' : ''} onClick={() => setFilter('all')}>All items</button><button aria-pressed={filter === 'sale'} className={filter === 'sale' ? 'filter-active' : ''} onClick={() => setFilter('sale')}>For sale</button><button aria-pressed={filter === 'rent'} className={filter === 'rent' ? 'filter-active' : ''} onClick={() => setFilter('rent')}>For rent</button><button aria-pressed={filter === 'exchange'} className={filter === 'exchange' ? 'filter-active' : ''} onClick={() => setFilter('exchange')}>Exchange</button></div><small className="listing-count">{listings.length} listings</small></div>{loadError && <p className="message-error" role="alert">{loadError}</p>}{listings.length ? <div className="equipment-table-wrap"><table className="equipment-table"><thead><tr><th>Item</th><th>Details</th><th>Seller</th><th>Price</th><th>Location</th></tr></thead><tbody>{listings.map(item => <tr key={item.id}><td><Link to={`/marketplace/${item.id}`}><img src={item.image} alt={`${item.title} listing`}/></Link></td><td><Link to={`/marketplace/${item.id}`}><strong>{item.title}</strong><small>{item.category} · {item.condition}</small><p>{item.description}</p></Link></td><td><strong>{item.seller}</strong></td><td><b>{listingPrice(item)}</b>{item.salePrice && item.rentalPrice && <small>Sale: {formatInr(item.salePrice)}</small>}</td><td><small>{item.location}</small></td></tr>)}</tbody></table></div> : <div className="marketplace-empty">No marketplace listings match your search.</div>}</div>
}

function EquipmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, socket } = useAuthSession()
  const [item, setItem] = useState(() => marketplaceListings().find(listing => listing.id === id) || null)
  const [loadError, setLoadError] = useState('')
  const [orderRequest, setOrderRequest] = useState(null)
  const [orderRequestLoading, setOrderRequestLoading] = useState(false)
  const [orderRequestBusy, setOrderRequestBusy] = useState(false)
  const [orderRequestError, setOrderRequestError] = useState('')
  const [orderRequestNotice, setOrderRequestNotice] = useState('')
  useEffect(() => {
    if (!id || marketplaceListings().some(listing => listing.id === id)) return undefined
    let active = true
    apiRequest(`/equipment/${encodeURIComponent(id)}`)
      .then(listing => {
        if (active) setItem(mapApiEquipment(listing))
      })
      .catch(error => {
        if (!active) return
        setLoadError(error.message || 'Unable to load this equipment listing.')
      })
    return () => { active = false }
  }, [id])
  const isOwnListing = item && (
    Boolean(user?.username && item.sellerUsername && user.username.toLowerCase() === item.sellerUsername.toLowerCase())
    || Boolean(user?.id && item.sellerId && String(user.id) === String(item.sellerId))
  )
  const canRequestOrder = Boolean(item?.sellerId && /^[a-f\d]{24}$/i.test(String(item.id || '')))

  useEffect(() => {
    if (!user || !item?.id || !canRequestOrder || isOwnListing) {
      setOrderRequest(null)
      setOrderRequestLoading(false)
      setOrderRequestError('')
      return undefined
    }
    let active = true
    setOrderRequest(null)
    setOrderRequestLoading(true)
    setOrderRequestError('')
    apiRequest(`/equipment/${encodeURIComponent(item.id)}/request`)
      .then(result => { if (active) setOrderRequest(result) })
      .catch(error => { if (active) setOrderRequestError(error.message || 'Unable to check this order request.') })
      .finally(() => { if (active) setOrderRequestLoading(false) })
    return () => { active = false }
  }, [canRequestOrder, id, isOwnListing, item?.id, user?.id])

  useEffect(() => {
    if (!socket || !id) return undefined
    const refreshOrderRequest = event => {
      if (event.listingId !== id) return
      if (orderRequest?.requestId && event.requestId !== orderRequest.requestId) return
      apiRequest(`/equipment/${encodeURIComponent(id)}/request${event.requestId ? `?request=${encodeURIComponent(event.requestId)}` : ''}`)
        .then(result => {
          setOrderRequest(result)
          if (result.status === 'approved' && result.role === 'buyer') setOrderRequestNotice('The seller accepted your order request.')
        })
        .catch(() => {})
    }
    socket.on('equipment:request:updated', refreshOrderRequest)
    return () => socket.off('equipment:request:updated', refreshOrderRequest)
  }, [id, orderRequest?.requestId, socket])

  useEffect(() => {
    if (!socket || !id) return undefined
    const handleListingRemoved = async event => {
      if (event.listingId !== id) return
      if (user && orderRequest?.requestId) {
        try {
          const result = await apiRequest(`/equipment/${encodeURIComponent(id)}/request?request=${encodeURIComponent(orderRequest.requestId)}`)
          setOrderRequest(result)
          if (result.status === 'approved' && result.role === 'buyer') {
            setOrderRequestNotice('The seller accepted your order request.')
            return
          }
        } catch {}
      }
      setItem(null)
      setLoadError('This equipment listing has been removed.')
    }
    socket.on('equipment:listing:removed', handleListingRemoved)
    return () => socket.off('equipment:listing:removed', handleListingRemoved)
  }, [id, orderRequest?.requestId, socket, user])

  const messageSeller = () => {
    const recipient = item?.sellerUsername || item?.seller
    if (!recipient) return
    if (isOwnListing) return
    navigate(`/messages?recipient=${encodeURIComponent(recipient)}&listing=${encodeURIComponent(item.id)}`)
  }
  const placeOrder = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/marketplace/${id}` } })
      return
    }
    if (!canRequestOrder || isOwnListing || orderRequestBusy || orderRequestLoading || orderRequest?.status === 'pending' || orderRequest?.status === 'approved') return
    setOrderRequestBusy(true)
    setOrderRequestError('')
    setOrderRequestNotice('')
    try {
      const result = await apiRequest(`/equipment/${encodeURIComponent(item.id)}/request`, { method: 'POST' })
      setOrderRequest(result)
      setOrderRequestNotice('Your order request has been sent to the seller.')
    } catch (error) {
      setOrderRequestError(error.message || 'Unable to send the order request.')
      if (error.status === 409) {
        apiRequest(`/equipment/${encodeURIComponent(item.id)}/request`)
          .then(setOrderRequest)
          .catch(() => {})
      }
    } finally {
      setOrderRequestBusy(false)
    }
  }
  if (!item) return <div className="placeholder"><span className="eyebrow">THE EXCHANGE</span><h1>{loadError ? 'Listing unavailable' : 'Loading listing…'}</h1>{loadError && <p role="alert">{loadError}</p>}<button className="primary-button" onClick={() => navigate('/marketplace')}>Back to marketplace</button></div>
    return <div className="equipment-detail-page"><button className="upload-back" onClick={() => navigate('/marketplace')}><DirectionalChevron direction="left" size={17}/> Back to marketplace</button><div className="equipment-detail-layout"><div className="equipment-detail-image"><img src={item.image} alt={item.title}/><span className="equipment-tag">{item.listingType === 'exchange' ? 'FOR EXCHANGE' : item.listingType === 'rent' || item.rentalPrice ? 'AVAILABLE TO RENT' : 'FOR SALE'}</span></div><div className="equipment-detail-copy"><span className="eyebrow warm">{item.category}</span><h1>{item.title}</h1><p className="equipment-detail-seller">Listed by <strong>{item.seller}</strong></p><div className="equipment-detail-facts"><span><small>Condition</small>{item.condition}</span><span><small>Location</small>{item.location}</span></div><p className="equipment-detail-description">{item.description}</p><div className="equipment-detail-purchase"><strong>{listingPrice(item)}</strong>{isOwnListing ? <span className="equipment-own-listing">Your listing</span> : <div className="equipment-detail-actions"><button className="primary-button equipment-place-order" disabled={!canRequestOrder || orderRequestLoading || orderRequestBusy || ['pending', 'approved', 'closed'].includes(orderRequest?.status)} title={!canRequestOrder ? 'Orders are available for active marketplace listings.' : undefined} onClick={placeOrder}>{orderRequestLoading ? 'Checking…' : orderRequestBusy ? 'Sending…' : orderRequest?.status === 'pending' ? 'Request sent' : orderRequest?.status === 'approved' ? 'Order accepted' : orderRequest?.status === 'closed' ? 'Unavailable' : <><ShoppingBag size={15}/> Place order</>}</button><button className="outline-button equipment-message-seller" onClick={messageSeller}>Message seller <DirectionalChevron size={15}/></button></div>}</div>{orderRequestError && !isOwnListing && <p className="equipment-order-feedback error" role="alert">{orderRequestError}</p>}{orderRequestNotice && !isOwnListing && <p className="equipment-order-feedback success" role="status">{orderRequestNotice}</p>}{!canRequestOrder && !isOwnListing && <p className="equipment-order-feedback">Order requests are available for active marketplace listings.</p>}</div></div></div>
}

function HorizontalRail({ children, className = '', controls = false, startAtLeft = false }) {
  const railRef = useRef(null)
  const hasPositionedInitialItems = useRef(false)
  const [canScrollBack, setCanScrollBack] = useState(false)
  const scrollRail = direction => railRef.current?.scrollBy({ left: direction * railRef.current.clientWidth * 0.82, behavior: 'smooth' })
  useLayoutEffect(() => {
    const rail = railRef.current
    if (!startAtLeft || !rail?.firstElementChild || hasPositionedInitialItems.current) return

    // Anchor the first rendered item at the leading (left) edge once content arrives.
    // This runs after the initial DOM commit, including when films load asynchronously.
    hasPositionedInitialItems.current = true
    rail.scrollLeft = 0
    rail.scrollTo(0, 0)
    requestAnimationFrame(() => {
      rail.scrollLeft = 0
      rail.scrollTo(0, 0)
    })
  }, [children, startAtLeft])
  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    let frameId
    const resetToStart = () => {
      rail.scrollLeft = 0
      cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(() => { rail.scrollLeft = 0 })
    }
    resetToStart()
    window.addEventListener('pageshow', resetToStart)
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('pageshow', resetToStart)
    }
  }, [])
  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const updateScrollPosition = () => setCanScrollBack(rail.scrollLeft > 2)
    updateScrollPosition()
    rail.addEventListener('scroll', updateScrollPosition, { passive: true })
    window.addEventListener('resize', updateScrollPosition)
    return () => {
      rail.removeEventListener('scroll', updateScrollPosition)
      window.removeEventListener('resize', updateScrollPosition)
    }
  }, [children])
  return <div dir="ltr" className={`rail-shell ${controls ? 'has-controls' : ''}`}><div ref={railRef} dir="ltr" className={`horizontal-rail ${className}`}>{children}</div>{controls && <>{canScrollBack && <div className="rail-zone rail-zone-left"><button className="rail-arrow rail-prev" onClick={() => scrollRail(-1)} aria-label="Show previous items"><DirectionalChevron direction="left" size={20}/></button></div>}<div className="rail-zone rail-zone-right"><button className="rail-arrow rail-next" onClick={() => scrollRail(1)} aria-label="Show more items"><DirectionalChevron size={20}/></button></div></>}</div>
}

function Home({ preview = false }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, socket } = useAuthSession()
  const [activeTrailer, setActiveTrailer] = useState(0)
  const [homeTrailers, setHomeTrailers] = useState(featuredTrailers)
  const [reminderDismissed, setReminderDismissed] = useState(() => user ? localStorage.getItem(`a-max-onboarding-reminder-${user.id}`) === 'dismissed' : false)
  const [homeFilms, setHomeFilms] = useState(() => [...readPublishedItems('a-max-published-films'), ...films])
  const [homeScripts, setHomeScripts] = useState(() => readPublishedItems('a-max-published-scripts').filter(script => script.contentId))
  const [homeEquipment, setHomeEquipment] = useState(() => marketplaceListings())
  const [homeContributors, setHomeContributors] = useState(() => {
    const cached = readHomeContributorsCache()
    return cached?.profiles?.length ? cached.profiles : creators.map(creator => ({ ...creator, contributionCount: 0 }))
  })
  const [homeCommunityHighlights, setHomeCommunityHighlights] = useState(() => readHomeCommunityCache()?.communities || [])
  const [filmSyncNotice, setFilmSyncNotice] = useState(() => sessionStorage.getItem('a-max-film-sync-notice') || '')
  const trailerRef = useRef(null)
  const trailer = homeTrailers[activeTrailer] || featuredTrailers[0]
  const featuredTitle = ['short-film', 'script-story'].includes(trailer.kind) ? trailer.title : promoTitle(trailer.title)
  const hasLongFeaturedTitle = featuredTitle.trim().length > 18
  const posterContent = trailer.kind === 'short-film'
    ? homeFilms.find(film => String(film.contentId || film.id || '') === String(trailer.contentId || ''))
    : trailer.kind === 'script-story'
      ? homeScripts.find(script => String(script.contentId || '') === String(trailer.contentId || ''))
      : null
  const trailerPoster = trailer.kind === 'festival'
    ? '/film-crew-festival-banner.png'
    : trailer.posterUrl || trailer.poster || trailer.thumbnailUrl
    || (trailer.videoId ? `https://i.ytimg.com/vi/${encodeURIComponent(trailer.videoId)}/hqdefault.jpg` : '')
    || posterContent?.image
    || (trailer.kind === 'script-story' ? scripts[0].image : films[0].image)
  const trailerPosterFallbacks = [
    trailer.videoId ? `https://i.ytimg.com/vi/${encodeURIComponent(trailer.videoId)}/hqdefault.jpg` : '',
    posterContent?.image,
    films[0].image
  ].filter((image, index, images) => image && image !== trailerPoster && images.indexOf(image) === index)
  const preferredGenres = user?.preferences?.genres || []
  const requestedFilmId = searchParams.get('film')
  const requestedScriptId = searchParams.get('script')
  const genreMatchedFilms = preferredGenres.length
    ? homeFilms.filter(film => preferredGenres.some(genre => film.genre?.toLowerCase().includes(genre.toLowerCase())))
    : []
  const publishedFilms = homeFilms.filter(film => film.contentId || film.localId || film.accent === 'Just published')
  const selectedFilms = genreMatchedFilms.length ? genreMatchedFilms : homeFilms
  const personalizedFilms = [...publishedFilms, ...selectedFilms.filter(film =>
    !publishedFilms.some(published => published.contentId && published.contentId === film.contentId
      || published.localId && published.localId === film.localId
      || published.title === film.title && published.creator === film.creator)
  )]

  useEffect(() => {
    if (preview) return undefined
    const timer = window.setInterval(() => setActiveTrailer(current => (current + 1) % homeTrailers.length), 9000)
    return () => window.clearInterval(timer)
  }, [homeTrailers.length, preview])

  useEffect(() => {
    if (preview) return undefined
    let active = true
    let refreshing = false
    let refreshTimer
    let lastSuccessfulDay = ''
    const cached = readHomeContributorsCache()

    const refreshContributors = async (force = false) => {
      const today = homeContributorDayKey()
      if (refreshing) return
      if (!force && cached?.date === today && cached.profiles.length) {
        lastSuccessfulDay = today
        setHomeContributors(cached.profiles)
        return
      }
      refreshing = true
      try {
        const profiles = await apiRequest('/profiles/contributors')
        if (!Array.isArray(profiles)) throw new Error('Contributor profiles response is invalid.')
        if (!active) return
        if (profiles.length) {
          setHomeContributors(profiles)
          cacheHomeContributors(profiles)
        }
        lastSuccessfulDay = today
      } catch (error) {
        if (active) console.error('Unable to refresh weekly contributor profiles:', error)
        if (active && cached?.profiles?.length) setHomeContributors(cached.profiles)
      } finally {
        refreshing = false
      }
    }

    const scheduleNextDailyRefresh = () => {
      const nextRefresh = new Date()
      nextRefresh.setHours(24, 0, 0, 250)
      refreshTimer = window.setTimeout(async () => {
        await refreshContributors(true)
        if (active) scheduleNextDailyRefresh()
      }, Math.max(1, nextRefresh.getTime() - Date.now()))
    }

    const refreshIfDayChanged = () => {
      if (document.visibilityState === 'visible' && lastSuccessfulDay !== homeContributorDayKey()) {
        refreshContributors(true)
      }
    }

    refreshContributors()
    scheduleNextDailyRefresh()
    document.addEventListener('visibilitychange', refreshIfDayChanged)
    window.addEventListener('pageshow', refreshIfDayChanged)
    return () => {
      active = false
      window.clearTimeout(refreshTimer)
      document.removeEventListener('visibilitychange', refreshIfDayChanged)
      window.removeEventListener('pageshow', refreshIfDayChanged)
    }
  }, [preview])

  useEffect(() => {
    if (preview) return undefined
    let active = true
    let refreshing = false
    let refreshTimer
    let lastSuccessfulDay = ''
    const cached = readHomeCommunityCache()

    const refreshCommunities = async (force = false) => {
      const today = homeContributorDayKey()
      if (refreshing) return
      if (!force && cached?.date === today && cached.communities.length) {
        lastSuccessfulDay = today
        setHomeCommunityHighlights(cached.communities)
        return
      }
      refreshing = true
      try {
        const communities = await apiRequest('/communities')
        if (!Array.isArray(communities)) throw new Error('Communities response is invalid.')
        if (!active) return
        const highlights = selectHomeCommunityHighlights(communities, today)
        setHomeCommunityHighlights(highlights)
        cacheHomeCommunityHighlights(highlights)
        lastSuccessfulDay = today
      } catch (error) {
        if (active) console.error('Unable to load homepage community channels:', error)
        if (active && cached?.communities?.length) setHomeCommunityHighlights(cached.communities)
      } finally {
        refreshing = false
      }
    }

    const scheduleNextDailyRefresh = () => {
      const nextRefresh = new Date()
      nextRefresh.setHours(24, 0, 0, 250)
      refreshTimer = window.setTimeout(async () => {
        await refreshCommunities(true)
        if (active) scheduleNextDailyRefresh()
      }, Math.max(1, nextRefresh.getTime() - Date.now()))
    }

    const refreshIfDayChanged = () => {
      if (document.visibilityState === 'visible' && lastSuccessfulDay !== homeContributorDayKey()) {
        refreshCommunities(true)
      }
    }

    refreshCommunities()
    scheduleNextDailyRefresh()
    document.addEventListener('visibilitychange', refreshIfDayChanged)
    window.addEventListener('pageshow', refreshIfDayChanged)
    return () => {
      active = false
      window.clearTimeout(refreshTimer)
      document.removeEventListener('visibilitychange', refreshIfDayChanged)
      window.removeEventListener('pageshow', refreshIfDayChanged)
    }
  }, [preview])

  useEffect(() => {
    let active = true
    apiRequest('/showcase/current')
      .then(showcase => {
        if (!Array.isArray(showcase?.slides)) throw new Error('Weekly showcase response is invalid.')
        if (!active) return
        if (showcase.slides.length) {
          setHomeTrailers(showcase.slides)
          setActiveTrailer(0)
        }
      })
      .catch(error => {
        console.error('Unable to load the weekly homepage showcase:', error)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    const refreshPublishedContent = async () => {
      const localFilms = readPublishedItems('a-max-published-films')
      const localScripts = readPublishedItems('a-max-published-scripts').filter(script => script.contentId)
      setHomeFilms([...localFilms, ...films])
      setHomeScripts(localScripts)
      setHomeEquipment(marketplaceListings())
      try {
        const marketplace = await apiRequest('/equipment')
        if (!Array.isArray(marketplace)) throw new Error('Marketplace response is invalid.')
        if (!active) return
        const serverEquipment = marketplace.map(mapApiEquipment)
        const serverIds = new Set(serverEquipment.map(item => item.id))
        setHomeEquipment([...serverEquipment, ...marketplaceListings().filter(item => !serverIds.has(item.id))])
      } catch (error) {
        console.error('Unable to load equipment listings from the server:', error)
      }
      try {
        const published = await apiRequest('/content?type=film')
        if (!Array.isArray(published)) throw new Error('Published films response is invalid.')
        if (!active) return
        const apiFilms = published.map(item => {
          const apiFilm = mapApiFilm(item)
          const localFilm = localFilms.find(film => film.contentId === apiFilm.contentId)
          if (!localFilm) return apiFilm
          return {
            ...apiFilm,
            ...localFilm,
            contentId: apiFilm.contentId,
            creator: apiFilm.creator || localFilm.creator,
            image: item.posterUrl || localFilm.image,
            video: apiFilm.video || localFilm.video,
            videoKey: localFilm.videoKey
          }
        })
        const apiIds = new Set(apiFilms.map(film => film.contentId))
        setHomeFilms([...localFilms.filter(film => !apiIds.has(film.contentId)), ...apiFilms, ...films])
      } catch (error) {
        console.error('Unable to load published films from the server:', error)
      }
      try {
        const [publishedScripts, publishedStories] = await Promise.all([
          apiRequest('/content?type=script'),
          apiRequest('/content?type=story')
        ])
        if (!Array.isArray(publishedScripts) || !Array.isArray(publishedStories)) {
          throw new Error('Published scripts and stories response is invalid.')
        }
        if (!active) return
        const mappedScripts = [...publishedScripts, ...publishedStories].map(item => {
          const apiScript = mapApiScript(item)
          const localScript = localScripts.find(script => script.contentId === apiScript.contentId)
          return localScript ? { ...localScript, ...apiScript, documentKey: localScript.documentKey, imageKey: localScript.imageKey } : apiScript
        })
        const serverIds = new Set(mappedScripts.map(script => script.contentId))
        setHomeScripts([...localScripts.filter(script => !serverIds.has(script.contentId)), ...mappedScripts])
      } catch (error) {
        console.error('Unable to load published scripts and stories from the server:', error)
      }
    }
    window.addEventListener('amax:published-content', refreshPublishedContent)
    window.addEventListener('storage', refreshPublishedContent)
    const handleListingCreated = newListing => {
      const mapped = mapApiEquipment(newListing)
      setHomeEquipment(current => [mapped, ...current.filter(item => item.id !== mapped.id)])
    }
    const handleListingRemoved = event => {
      try {
        const stored = JSON.parse(localStorage.getItem('a-max-published-equipment') || '[]')
        localStorage.setItem('a-max-published-equipment', JSON.stringify(stored.filter(item => item.id !== event.listingId)))
      } catch {}
      setHomeEquipment(current => current.filter(item => item.id !== event.listingId))
    }
    window.addEventListener('amax:equipment-listing-updated', refreshPublishedContent)
    socket?.on('equipment:listing:created', handleListingCreated)
    socket?.on('equipment:listing:removed', handleListingRemoved)
    socket?.on('content:published', refreshPublishedContent)
    refreshPublishedContent()
    return () => {
      active = false
      window.removeEventListener('amax:published-content', refreshPublishedContent)
      window.removeEventListener('storage', refreshPublishedContent)
      window.removeEventListener('amax:equipment-listing-updated', refreshPublishedContent)
      socket?.off('equipment:listing:created', handleListingCreated)
      socket?.off('equipment:listing:removed', handleListingRemoved)
      socket?.off('content:published', refreshPublishedContent)
    }
  }, [socket])

  useEffect(() => {
    if (!requestedFilmId) return undefined
    let active = true
    apiRequest(`/content/${encodeURIComponent(requestedFilmId)}`)
      .then(item => {
        if (!active) return
        if (item.type !== 'film') throw new Error('This content is not a published film.')
        const apiFilm = mapApiFilm(item)
        const localFilm = readPublishedItems('a-max-published-films').find(film => film.contentId === apiFilm.contentId)
        const film = localFilm ? { ...apiFilm, ...localFilm, contentId: apiFilm.contentId, video: apiFilm.video || localFilm.video } : apiFilm
        setHomeFilms(current => [film, ...current.filter(existing => existing.contentId !== film.contentId)])
      })
      .catch(error => {
        if (active) console.error('Unable to load the requested published film:', error)
      })
    return () => { active = false }
  }, [requestedFilmId])

  useEffect(() => {
    if (!requestedScriptId) return undefined
    let active = true
    apiRequest(`/content/${encodeURIComponent(requestedScriptId)}`)
      .then(item => {
        if (!active) return
        if (!['script', 'story'].includes(item.type)) throw new Error('This content is not a published script or story.')
        const apiScript = mapApiScript(item)
        const localScript = readPublishedItems('a-max-published-scripts').find(script => script.contentId === apiScript.contentId)
        const script = localScript
          ? { ...localScript, ...apiScript, documentKey: localScript.documentKey, imageKey: localScript.imageKey }
          : apiScript
        setHomeScripts(current => [script, ...current.filter(existing => existing.contentId !== script.contentId)])
      })
      .catch(error => {
        if (active) console.error('Unable to load the requested published script or story:', error)
      })
    return () => { active = false }
  }, [requestedScriptId])

  const previousTrailer = () => setActiveTrailer(current => (current - 1 + homeTrailers.length) % homeTrailers.length)
  const nextTrailer = () => setActiveTrailer(current => (current + 1) % homeTrailers.length)
  const startTrailer = () => {
    if (trailer.kind === 'empty' && trailer.actionUrl) {
      navigate(trailer.actionUrl)
      return
    }
    if (['short-film', 'script-story'].includes(trailer.kind) && trailer.actionUrl) {
      navigate(trailer.actionUrl)
      return
    }
    const destination = trailer.kind === 'festival' ? trailer.applicationUrl : trailer.watchUrl
    if (destination) {
      try {
        const url = new URL(destination, window.location.origin)
        if (url.origin === window.location.origin) navigate(`${url.pathname}${url.search}${url.hash}`)
        else if (url.protocol === 'https:') window.open(url.toString(), '_blank', 'noopener,noreferrer')
      } catch {}
      return
    }
    trailerRef.current?.play()
  }
  const dismissReminder = () => {
    localStorage.setItem(`a-max-onboarding-reminder-${user.id}`, 'dismissed')
    setReminderDismissed(true)
  }

  return <>
  {user?.onboardingSkipped && !reminderDismissed && <aside className="home-preference-reminder"><span><strong>Make your FilmVerse yours.</strong> Add a few preferences for more relevant film and craft discovery.</span><Link to="/settings/preferences">Set preferences <DirectionalChevron size={14}/></Link><button aria-label="Dismiss preference reminder" onClick={dismissReminder}>×</button></aside>}
  {filmSyncNotice && <aside className="home-preference-reminder" role="status"><span>{filmSyncNotice}</span><button aria-label="Dismiss film sync notice" onClick={() => { sessionStorage.removeItem('a-max-film-sync-notice'); setFilmSyncNotice('') }}>×</button></aside>}
  <section className="hero odyssey-hero">
    <div className="hero-poster-frame" aria-hidden="true">
      <img
        className={trailer.kind === 'festival' ? 'hero-poster-flipped' : undefined}
        key={`${trailer.videoId || trailer.contentId || trailer.title}-${activeTrailer}`}
        src={trailerPoster}
        alt=""
        onError={event => {
          const image = event.currentTarget
          const fallbackIndex = Number(image.dataset.fallbackIndex || 0)
          const fallback = trailerPosterFallbacks[fallbackIndex]
          if (fallback) {
            image.dataset.fallbackIndex = String(fallbackIndex + 1)
            image.src = fallback
          } else {
            image.style.opacity = '0'
          }
        }}
      />
    </div>
    <button className="hero-click-zone hero-click-left" onClick={previousTrailer} aria-label="Previous feature" />
    <div className="hero-click-zone hero-click-center" onClick={startTrailer} role="button" tabIndex="0" aria-label="Open featured item" />
    <button className="hero-click-zone hero-click-right" onClick={nextTrailer} aria-label="Next feature" />
    <div className="hero-copy">
      <span className="eyebrow warm">{trailer.type}</span>
      <h1 className={hasLongFeaturedTitle ? 'hero-title-long' : undefined} title={trailer.title} aria-label={trailer.title}>{featuredTitle}</h1>
      {trailer.rating
        ? <div className="odyssey-rating"><span>IMDb</span><strong>{trailer.rating}</strong><small>/ 10</small></div>
        : trailer.kind === 'short-film'
          ? <div className="hero-showcase-count"><strong>{Number(trailer.likeCount || 0).toLocaleString('en-IN')}</strong><span>total likes</span></div>
          : trailer.kind === 'script-story'
            ? <div className="hero-showcase-count"><strong>{Number(trailer.viewCount || 0).toLocaleString('en-IN')}</strong><span>reads this week</span></div>
            : <p className="hero-promo-detail">{trailer.detail}</p>}
      <button className="hero-action-button" onClick={startTrailer}>
        {trailer.kind === 'script-story' ? <FileText size={16}/> : trailer.kind === 'festival' ? <DirectionalChevron size={16}/> : <Play size={15} fill="currentColor"/>}
        {trailer.action || 'Watch now'}
      </button>
    </div>
    <div className="trailer-bubbles" aria-label="Featured promotions">{homeTrailers.map((item, index) => <button key={`${item.videoId || item.contentId || item.title}-${index}`} className={index === activeTrailer ? 'active' : ''} onClick={() => setActiveTrailer(index)} aria-label={`Show ${item.type || 'feature'}: ${item.title}`} />)}</div>
  </section>
  <section className="home-section">
    <SectionTitle eyebrow="Short Films & Documentaries" title="" action="View all" to="/explore?section=short-films"/>
    <HorizontalRail className="film-rail home-film-rail" controls startAtLeft>
      {personalizedFilms.map((film, index) => <FilmCard key={`short-film-${film.contentId || film.localId || film.id || index}`} film={film} showAccent={false}/>)}
    </HorizontalRail>
  </section>

  <section className="home-section"><SectionTitle eyebrow="Published scripts" title="" action="Read more" to="/explore?section=scripts"/><HorizontalRail className="script-rail" controls>{homeScripts.map((script, index) => <ScriptCard key={`${script.title}-${index}`} script={script}/>)}</HorizontalRail></section>
  <section className="home-section creator-section"><SectionTitle eyebrow="Top contributors this week" title="" action="Discover people" to="/explore?section=profiles"/><HorizontalRail className="creator-rail" controls>{homeContributors.map(creator => {
    const profilePath = `/profile/${encodeURIComponent(creator.username || creator.name.toLowerCase().replace(/\s+/g, '-'))}`
    const weeklyCount = Number(creator.contributionCount || 0)
    return <article className="creator-card creator-card-link" key={creator.id || creator.username || creator.name}>
      <Link className="creator-card-profile" to={profilePath}>
        <img src={creator.image} alt={`${creator.name} profile`}/>
        <div><h3>{creator.name}</h3><p>{creator.role}</p><small className="creator-contribution-count">{weeklyCount ? `${weeklyCount} ${weeklyCount === 1 ? 'contribution' : 'contributions'} this week` : 'Community profile'}</small></div>
      </Link>
      <Link className="creator-network-link" to={`/messages?recipient=${encodeURIComponent(creator.username || creator.name)}`}>Network <DirectionalChevron size={13}/></Link>
    </article>
  })}</HorizontalRail></section>
  <section className="home-section"><SectionTitle eyebrow="Film equipment" title="" action="Browse marketplace" to="/marketplace"/><HorizontalRail className="equipment-rail" controls>{homeEquipment.map(item => <EquipmentCard key={item.id} item={item}/>)}</HorizontalRail></section>
  <section className="home-section"><SectionTitle eyebrow="The community cut" title="" to="/communities"/>{homeCommunityHighlights.length ? <div className="community-conversation-grid"><div className="community-banner"><div className="community-banner-copy"><span className="eyebrow warm">{homeCommunityHighlights[0].name} · #{homeCommunityHighlights[0].channelName}</span><small className="community-member-count">{homeCommunityHighlights[0].memberCount.toLocaleString('en-IN')} members</small><h2>{homeCommunityHighlights[0].description}</h2><Link to="/communities" className="outline-button">Join the conversation <DirectionalChevron size={15}/></Link></div><div className="community-banner-image"><img src="/community-discussion-still.png" alt="Community conversation"/></div></div><div className="community-conversation-list">{homeCommunityHighlights.slice(1).map(community => <Link to="/communities" className="community-conversation" key={`${community.id}-${community.channelSlug}`}><span className="eyebrow warm">{community.name}</span><small>{community.memberCount.toLocaleString('en-IN')} members</small><h3>#{community.channelName}</h3><p>{community.description}</p><DirectionalChevron size={17}/></Link>)}</div></div> : <div className="community-home-empty">Community channel descriptions will appear here.</div>}</section>
</> }

function Explore() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { socket } = useAuthSession()
  const [registeredFilmmakers, setRegisteredFilmmakers] = useState([])
  const [publishedScripts, setPublishedScripts] = useState([])
  const [serverFilms, setServerFilms] = useState([])
  const [exploreEquipment, setExploreEquipment] = useState(() => marketplaceListings())
  const [scriptLoadError, setScriptLoadError] = useState('')
  const [filmmakerLoadError, setFilmmakerLoadError] = useState('')
  const [equipmentLoadError, setEquipmentLoadError] = useState('')
  const [loadingScripts, setLoadingScripts] = useState(false)
  const [loadingFilmmakers, setLoadingFilmmakers] = useState(false)
  const [loadingFilms, setLoadingFilms] = useState(false)
  const [loadingEquipment, setLoadingEquipment] = useState(false)
  const [masonryColumnCount, setMasonryColumnCount] = useState(() => {
    if (typeof window === 'undefined') return 4
    return window.innerWidth < 520 ? 1 : window.innerWidth < 820 ? 2 : window.innerWidth < 1180 ? 3 : 4
  })
  const search = params.get('search')?.trim().toLowerCase() || ''
  const section = params.get('section') || ''
  const category = section || 'for-you'
  const localFilms = (() => { try { return JSON.parse(localStorage.getItem('a-max-published-films') || '[]') } catch { return [] } })()
  const localScripts = (() => { try { return JSON.parse(localStorage.getItem('a-max-published-scripts') || '[]').filter(item => item.contentId) } catch { return [] } })()

  const exploreFilms = (() => {
    const map = new Map()
    localFilms.forEach(f => map.set(f.contentId || f.localId || f.id || f.title, f))
    serverFilms.forEach(f => {
      const key = f.contentId || f.id || f.title
      if (map.has(key)) {
        const local = map.get(key)
        map.set(key, { ...f, ...local, contentId: f.contentId, video: f.video || local.video })
      } else {
        map.set(key, f)
      }
    })
    films.forEach(f => {
      const key = f.id || f.title
      if (!map.has(key)) map.set(key, f)
    })
    return Array.from(map.values())
  })()

  const exploreScripts = publishedScripts
  const filmmakerProfiles = registeredFilmmakers
  const result = search ? [...exploreFilms, ...exploreScripts].find(item => `${item.title} ${item.creator || ''}`.toLowerCase().includes(search)) : null
  const isScript = result && (result.contentType === 'script' || result.contentType === 'story')
  const heading = category === 'short-films' ? 'Short films' : category === 'scripts' ? 'Scripts & stories' : category === 'documentary' ? 'Documentary' : category === 'trending' ? 'Trending' : category === 'profiles' ? 'Filmmaker profiles' : category === 'equipment' ? 'Film equipment' : 'Explore'

  const searchedFilms = search
    ? exploreFilms.filter(film => `${film.title} ${film.creator || ''} ${film.genre || ''}`.toLowerCase().includes(search))
    : exploreFilms

  const displayedFilms = category === 'trending'
    ? searchedFilms.filter(film => film.accent === 'Trending')
    : category === 'documentary'
      ? searchedFilms.filter(film => (film.genre || '').toLowerCase().includes('documentary'))
      : searchedFilms

  const matchesExploreSearch = item => !search || [item.title, item.creator, item.genre, item.category, item.seller, item.role, item.description, item.condition, item.location].filter(Boolean).join(' ').toLowerCase().includes(search)
  const matchedScripts = exploreScripts.filter(matchesExploreSearch)
  const matchedProfiles = filmmakerProfiles.filter(matchesExploreSearch)
  const matchedEquipment = exploreEquipment.filter(matchesExploreSearch)
  const mixedGroups = [
    { type: 'film', items: searchedFilms.filter(matchesExploreSearch) },
    { type: 'script', items: matchedScripts },
    { type: 'profile', items: matchedProfiles },
    { type: 'equipment', items: matchedEquipment }
  ]
  const forYouItems = []
  for (let index = 0; index < Math.max(...mixedGroups.map(group => group.items.length)); index += 1) {
    mixedGroups.forEach(group => {
      const item = group.items[index]
      if (item) forYouItems.push({ type: group.type, item })
    })
  }

  const arrangeMasonryColumns = entries => {
    if (!entries.length) return []
    const columnCount = Math.max(1, Math.min(masonryColumnCount, entries.length))
    const columns = Array.from({ length: columnCount }, () => [])
    const heights = Array(columnCount).fill(0)
    const contentWidth = typeof window === 'undefined' ? 1200 : Math.min(window.innerWidth, 1520) - 100
    const columnWidth = Math.max(160, (contentWidth - (columnCount - 1) * 20) / columnCount)
    entries.forEach(entry => {
      const index = heights.indexOf(Math.min(...heights))
      const estimatedHeight = entry.type === 'film'
        ? columnWidth / 1.52 + 58
        : entry.type === 'script'
          ? Math.max(164, columnWidth * .62)
          : entry.type === 'profile'
            ? 82
            : columnWidth * .8 + 95
      columns[index].push(entry)
      heights[index] += estimatedHeight + 20
    })
    return columns
  }

  const forYouColumns = arrangeMasonryColumns(forYouItems)
  const shortFilmColumns = arrangeMasonryColumns(displayedFilms.map(item => ({ type: 'film', item })))
  const equipmentColumns = arrangeMasonryColumns(matchedEquipment.map(item => ({ type: 'equipment', item })))
  const renderMasonryItem = entry => {
    const item = entry.item
    const key = item.contentId || item.id || item.username || item.title || item.name || entry.type
    if (entry.type === 'film') return <div className="explore-pin explore-pin-film" key={`film-${key}`}><FilmCard film={item}/></div>
    if (entry.type === 'script') return <div className="explore-pin explore-pin-script" key={`script-${key}`}><ScriptCard script={item}/></div>
    if (entry.type === 'profile') return <div className="explore-pin explore-pin-profile" key={`profile-${key}`}><ExploreProfileCard profile={item}/></div>
    return <div className="explore-pin explore-pin-equipment" key={`equipment-${key}`}><EquipmentCard item={item}/></div>
  }
  const renderMasonryColumns = columns => <div className="explore-masonry" style={{ '--explore-column-count': columns.length || 1 }}>{columns.map((items, index) => <div className="explore-masonry-column" key={`masonry-column-${index}`}>{items.map(renderMasonryItem)}</div>)}</div>

  const chooseCategory = nextCategory => { const nextParams = new URLSearchParams(params); nextParams.delete('search'); nextParams.set('section', nextCategory); setParams(nextParams) }

  useEffect(() => {
    let active = true
    const loadFilms = async () => {
      setLoadingFilms(true)
      try {
        const published = await apiRequest('/content?type=film')
        if (Array.isArray(published) && active) {
          setServerFilms(published.map(mapApiFilm))
        }
      } catch (err) {
        if (active) console.error('Unable to fetch films in explore:', err)
      } finally {
        if (active) setLoadingFilms(false)
      }
    }
    loadFilms()
    const handleRefresh = () => loadFilms()
    window.addEventListener('amax:published-content', handleRefresh)
    window.addEventListener('storage', handleRefresh)
    socket?.on('content:published', handleRefresh)
    return () => {
      active = false
      window.removeEventListener('amax:published-content', handleRefresh)
      window.removeEventListener('storage', handleRefresh)
      socket?.off('content:published', handleRefresh)
    }
  }, [socket])

  useEffect(() => {
    if (category !== 'profiles' && category !== 'for-you') return undefined
    let active = true
    setLoadingFilmmakers(true)
    setFilmmakerLoadError('')
    apiRequest('/profiles/filmmakers')
      .then(profiles => {
        if (!Array.isArray(profiles)) throw new Error('Filmmaker profiles response is invalid.')
        if (active) setRegisteredFilmmakers(profiles)
      })
      .catch(error => {
        if (active) setFilmmakerLoadError(error.message || 'Unable to load filmmaker profiles.')
      })
      .finally(() => { if (active) setLoadingFilmmakers(false) })
    return () => { active = false }
  }, [category])

  useEffect(() => {
    if (category !== 'scripts' && category !== 'for-you' && !search) return undefined
    let active = true
    setLoadingScripts(true)
    setScriptLoadError('')
    Promise.all([apiRequest('/content?type=script'), apiRequest('/content?type=story')])
      .then(([serverScripts, serverStories]) => {
        if (!Array.isArray(serverScripts) || !Array.isArray(serverStories)) {
          throw new Error('Published scripts and stories response is invalid.')
        }
        if (!active) return
        const mapped = [...serverScripts, ...serverStories].map(item => {
          const apiScript = mapApiScript(item)
          const localScript = localScripts.find(script => script.contentId === apiScript.contentId)
          return localScript ? { ...localScript, ...apiScript, documentKey: localScript.documentKey, imageKey: localScript.imageKey } : apiScript
        })
        const serverIds = new Set(mapped.map(script => script.contentId))
        setPublishedScripts([...localScripts.filter(script => !serverIds.has(script.contentId)), ...mapped])
      })
      .catch(error => {
        if (active) setScriptLoadError(error.message || 'Unable to load published scripts and stories.')
      })
      .finally(() => { if (active) setLoadingScripts(false) })
    return () => { active = false }
  }, [category, search])

  useEffect(() => {
    if (category !== 'equipment' && category !== 'for-you' && !search) return undefined
    let active = true
    const loadEquipment = async () => {
      setLoadingEquipment(true)
      setEquipmentLoadError('')
      try {
        const response = await apiRequest('/equipment')
        if (!Array.isArray(response)) throw new Error('Marketplace response is invalid.')
        if (!active) return
        const serverItems = response.map(mapApiEquipment)
        const serverIds = new Set(serverItems.map(item => String(item.id)))
        setExploreEquipment([...serverItems, ...marketplaceListings().filter(item => !serverIds.has(String(item.id)))])
      } catch (error) {
        if (active) setEquipmentLoadError(error.message || 'Unable to load marketplace listings.')
      } finally {
        if (active) setLoadingEquipment(false)
      }
    }
    loadEquipment()
    const refresh = () => loadEquipment()
    window.addEventListener('amax:equipment-listing-updated', refresh)
    window.addEventListener('storage', refresh)
    socket?.on('equipment:listing:created', refresh)
    socket?.on('equipment:listing:removed', refresh)
    return () => {
      active = false
      window.removeEventListener('amax:equipment-listing-updated', refresh)
      window.removeEventListener('storage', refresh)
      socket?.off('equipment:listing:created', refresh)
      socket?.off('equipment:listing:removed', refresh)
    }
  }, [category, search, socket])

  useEffect(() => {
    const updateColumnCount = () => setMasonryColumnCount(window.innerWidth < 520 ? 1 : window.innerWidth < 820 ? 2 : window.innerWidth < 1180 ? 3 : 4)
    updateColumnCount()
    window.addEventListener('resize', updateColumnCount)
    return () => window.removeEventListener('resize', updateColumnCount)
  }, [])

  return <div className="explore-page">
    <div className="page-heading explore-heading"><h1>{heading}</h1><span className="eyebrow">THE WORLD OF CINEMA</span></div>
    {result && <article className="explore-feature"><img src={result.image} alt=""/><div><span className="eyebrow warm">{isScript ? 'SCRIPT / STORY' : 'FEATURED FILM'}</span><h2>{result.title}</h2><div className="feature-facts"><span><b>{isScript ? 'Writer' : 'Director'}</b>{result.creator}</span><span><b>{isScript ? 'Format' : 'Genre'}</b>{isScript ? result.type : result.genre}</span><span><b>IMDb</b>{isScript ? '—' : '8.7 / 10'}</span></div><p>{isScript ? 'A published story from the A-MAX creative library, ready to be discovered.' : (result.description || 'An independent film selected from the A-MAX showcase.')}</p><button className="primary-button" onClick={() => isScript && result.contentId ? navigate(`/?script=${encodeURIComponent(result.contentId)}`) : result ? navigate(`/?film=${encodeURIComponent(result.contentId || result.id)}`) : undefined}><Play size={15} fill="currentColor"/> {isScript ? 'Read script' : 'Watch film'}</button></div></article>}
    <div className="filter-row explore-filter-row" role="group" aria-label="Explore categories"><button aria-pressed={category === 'for-you'} className={category === 'for-you' ? 'filter-active' : ''} onClick={() => chooseCategory('for-you')}>For you</button><button aria-pressed={category === 'trending'} className={category === 'trending' ? 'filter-active' : ''} onClick={() => chooseCategory('trending')}>Trending</button><button aria-pressed={category === 'short-films'} className={category === 'short-films' ? 'filter-active' : ''} onClick={() => chooseCategory('short-films')}>Short films</button><button aria-pressed={category === 'scripts'} className={category === 'scripts' ? 'filter-active' : ''} onClick={() => chooseCategory('scripts')}>Scripts & stories</button><button aria-pressed={category === 'profiles'} className={category === 'profiles' ? 'filter-active' : ''} onClick={() => chooseCategory('profiles')}>Filmmakers</button><button aria-pressed={category === 'equipment'} className={category === 'equipment' ? 'filter-active' : ''} onClick={() => chooseCategory('equipment')}>Equipment</button><button aria-pressed={category === 'documentary'} className={category === 'documentary' ? 'filter-active' : ''} onClick={() => chooseCategory('documentary')}>Documentary</button></div>
    {category === 'scripts'
      ? <>{loadingScripts && <p className="message-empty" role="status">Loading published scripts and stories…</p>}{scriptLoadError && <p className="message-error" role="alert">{scriptLoadError}</p>}{!loadingScripts && !scriptLoadError && !exploreScripts.length && <p className="message-empty">No scripts or stories have been published yet.</p>}<div className="explore-grid">{exploreScripts.map(script => <ScriptCard key={script.contentId} script={script}/>)}</div></>
        : category === 'profiles'
          ? <>{filmmakerLoadError && <p className="message-error" role="alert">{filmmakerLoadError}</p>}{loadingFilmmakers && <p className="message-empty" role="status">Loading filmmaker profiles…</p>}{!loadingFilmmakers && !filmmakerLoadError && !filmmakerProfiles.length && <p className="message-empty">No filmmaker profiles yet.</p>}<div className="creator-grid">{filmmakerProfiles.map(profile => <article className="creator-card creator-card-link" key={profile.username}><Link className="creator-card-profile" to={`/profile/${profile.username}`}><img src={profile.image} alt=""/><div><h3>{profile.name}</h3><p>{profile.role}</p></div></Link><Link className="creator-network-link" to={`/messages?recipient=${encodeURIComponent(profile.name)}`}>Network <DirectionalChevron size={13}/></Link></article>)}</div></>
          : category === 'for-you'
            ? <>{!forYouItems.length && (loadingFilms || loadingScripts || loadingFilmmakers || loadingEquipment) && <p className="message-empty" role="status">Gathering films, stories, filmmakers, and gear…</p>}{!forYouItems.length && !(loadingFilms || loadingScripts || loadingFilmmakers || loadingEquipment) && <p className="message-empty">No discoveries found. Try another search.</p>}{renderMasonryColumns(forYouColumns)}</>
            : category === 'equipment'
              ? <>{loadingEquipment && !matchedEquipment.length && <p className="message-empty" role="status">Loading equipment listings…</p>}{equipmentLoadError && !matchedEquipment.length && <p className="message-error" role="alert">{equipmentLoadError}</p>}{!loadingEquipment && !matchedEquipment.length && !equipmentLoadError && <p className="message-empty">No equipment listings match your search.</p>}{renderMasonryColumns(equipmentColumns)}</>
              : <>{loadingFilms && !displayedFilms.length && <p className="message-empty" role="status">Loading films…</p>}{!loadingFilms && !displayedFilms.length && search && <p className="message-empty">No films found matching "{search}".</p>}{category === 'short-films' ? renderMasonryColumns(shortFilmColumns) : <div className="explore-grid">{displayedFilms.map((film, index) => <FilmCard key={film.contentId || `${film.title}-${index}`} film={film} wide={index % 3 === 0}/>)}</div>}</>}
  </div>
}

function Profile() {
  const { username } = useParams()
  const creator = creators.find(item => item.name.toLowerCase().replace(/\s+/g, '-') === username) || { name: 'Arjun Mehta', role: 'Director · Writer · Editor', image: 'https://i.pravatar.cc/160?img=57' }
  const isOwnProfile = !username || username === 'arjun-mehta'
  const savedProfile = (() => { try { return JSON.parse(localStorage.getItem('a-max-profile') || 'null') } catch { return null } })()
  const [profile, setProfile] = useState(() => savedProfile || creator)
  const [activeTab, setActiveTab] = useState('about')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => savedProfile || creator)
  const editField = field => event => setDraft(current => ({ ...current, [field]: event.target.value }))
  const chooseProfileImage = event => { const image = event.target.files?.[0]; if (!image) return; const reader = new FileReader(); reader.onload = result => setDraft(current => ({ ...current, image: result.target.result })); reader.readAsDataURL(image) }
  const saveProfile = event => {
    event.preventDefault()
    const nextProfile = { ...profile, ...draft }
    setProfile(nextProfile)
    setDraft(nextProfile)
    localStorage.setItem('a-max-profile', JSON.stringify(nextProfile))
    window.dispatchEvent(new CustomEvent('a-max-profile-updated', { detail: nextProfile }))
    setEditing(false)
  }
  return <><div className="profile-hero"><img className="cover-image" src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1500&q=80" alt=""/><div className="profile-info"><img className="avatar" src={profile.image} alt=""/><div><span className="eyebrow warm">{profile.role}</span><h1>{profile.name}</h1><p>{profile.bio || 'Stories about the quiet, strange, and beautiful parts of being human.'}</p><span className="location">{profile.location || 'Mumbai, India'}</span></div>{isOwnProfile && <button className="outline-button" onClick={() => { setDraft(profile); setEditing(true) }}>Edit profile</button>}</div></div><div className="profile-tabs"><b>About</b><span>Portfolio <small>08</small></span><span>Films <small>12</small></span><span>Activity</span></div><div className="profile-body"><section><SectionTitle eyebrow="Selected work" title="A body of work in progress"/><div className="film-grid">{films.slice(1).map(film => <FilmCard key={film.title} film={film}/>)}</div></section><aside className="about-panel"><span className="eyebrow">About {profile.name}</span><p>{profile.bio || 'Filmmaker exploring the space between what we say and what we mean. Currently developing a debut feature.'}</p><div className="skill-list"><span>Direction</span><span>Screenwriting</span><span>Editing</span><span>Visual storytelling</span></div></aside></div>{editing && <div className="profile-editor-backdrop"><form className="profile-editor" onSubmit={saveProfile}><div className="editor-header"><div><span className="eyebrow warm">YOUR PROFILE</span><h2>Edit profile</h2></div><button type="button" onClick={() => setEditing(false)}>×</button></div><div className="editor-avatar"><img src={draft.image} alt="Profile preview"/><input id="profile-picture" className="hidden-file-input" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={chooseProfileImage}/><label htmlFor="profile-picture" className="outline-button">Change profile picture</label></div><label>Name<input required value={draft.name} onChange={editField('name')} /></label><label>Film profession<input required value={draft.role} onChange={editField('role')} placeholder="Director · Writer · DOP" /></label><label>About<textarea value={draft.bio || ''} onChange={editField('bio')} placeholder="Tell people what you make." /></label><label>Location<input value={draft.location || ''} onChange={editField('location')} placeholder="City, country" /></label><div className="editor-actions"><button type="button" className="upload-back" onClick={() => setEditing(false)}>Cancel</button><button className="publish-button" type="submit">Save profile <DirectionalChevron size={16}/></button></div></form></div>}</> }

function LegacyProfileView() {
  const { user } = useAuthSession()
  const isFilmmaker = Boolean(user && user.preferences?.primaryIdentity === 'filmmaker')
  if (!isFilmmaker) {
    return <Navigate to="/" replace />
  }
  const { username } = useParams()
  const creator = creators.find(item => item.name.toLowerCase().replace(/\s+/g, '-') === username) || { name: 'Arjun Mehta', role: 'Director · Writer · Editor', image: 'https://i.pravatar.cc/160?img=57' }
  const savedProfile = (() => { try { return JSON.parse(localStorage.getItem('a-max-profile') || 'null') } catch { return null } })()
  const profile = !username || username === 'arjun-mehta' ? savedProfile || creator : creator
  const isOwnProfile = !username || username === 'arjun-mehta'
  const [activeTab, setActiveTab] = useState('about')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile)
  const editField = field => event => setDraft(current => ({ ...current, [field]: event.target.value }))
  const saveProfile = event => {
    event.preventDefault()
    localStorage.setItem('a-max-profile', JSON.stringify(draft))
    window.dispatchEvent(new CustomEvent('a-max-profile-updated', { detail: draft }))
    setEditing(false)
  }
  const localFilms = (() => { try { return JSON.parse(localStorage.getItem('a-max-published-films') || '[]') } catch { return [] } })()
  const profileFilms = [...localFilms, ...films]
  const profileActivity = [{ type: 'NEW WORK', text: 'Published a new film to the A-MAX showcase.', time: '2 days ago' }, { type: 'COLLABORATION', text: 'Joined the Independent Filmmakers community.', time: '1 week ago' }, { type: 'CURATION', text: 'Bookmarked Field Notes by Sofia Reyes.', time: '2 weeks ago' }]
  const tabContent = activeTab === 'portfolio' ? <><div className="profile-tab-heading"><span className="eyebrow">PORTFOLIO</span><h2>A visual language in progress</h2></div><div className="portfolio-photo-grid">{profileFilms.slice(0, 4).map(film => <img key={film.title} src={film.image} alt={film.title}/>)}</div><div className="portfolio-links"><a href="https://www.imdb.com" target="_blank" rel="noreferrer"><strong>IMDb profile</strong><span>imdb.com</span><b>↗</b></a><a href="https://www.instagram.com" target="_blank" rel="noreferrer"><strong>Behind the scenes</strong><span>instagram.com</span><b>↗</b></a></div></> : activeTab === 'films' ? <><div className="profile-tab-heading"><span className="eyebrow">FILMS</span><h2>Selected screen work</h2></div><div className="profile-film-list">{profileFilms.slice(0, 4).map(film => <article key={film.title}><img src={film.image} alt=""/><div><strong>{film.title}</strong><span>{film.creator} · {film.genre}</span><small>Available in the A-MAX showcase</small></div><b className="profile-recommend-mark">FEATURED</b></article>)}</div></> : activeTab === 'activity' ? <><div className="profile-tab-heading"><span className="eyebrow">ACTIVITY</span><h2>Recent movements</h2></div><div className="profile-activity-list">{profileActivity.map(item => <article key={item.text}><span>{item.type}</span><p>{item.text}</p><small>{item.time}</small></article>)}</div></> : <><section><SectionTitle eyebrow="Selected work" title="A body of work in progress"/><div className="film-grid">{films.slice(1).map(film => <FilmCard key={film.title} film={film}/>)}</div></section><aside className="about-panel"><span className="eyebrow">About {profile.name}</span><p>{profile.bio || 'Filmmaker exploring the space between what we say and what we mean. Currently developing a debut feature.'}</p><div className="skill-list"><span>Direction</span><span>Screenwriting</span><span>Editing</span><span>Visual storytelling</span></div></aside></>
  return <><div className="profile-hero"><img className="cover-image" src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1500&q=80" alt=""/><div className="profile-info"><img className="avatar" src={profile.image} alt=""/><div><span className="eyebrow warm">{profile.role}</span><h1>{profile.name}</h1><p>{profile.bio || 'Stories about the quiet, strange, and beautiful parts of being human.'}</p><span className="location">{profile.location || 'Mumbai, India'}</span></div>{isOwnProfile && <button className="outline-button" onClick={() => { setDraft(profile); setEditing(true) }}>Edit profile</button>}</div></div><div className="profile-tabs" role="tablist" aria-label="Profile sections"><button className={activeTab === 'about' ? 'active' : ''} role="tab" aria-selected={activeTab === 'about'} onClick={() => setActiveTab('about')}>About</button><button className={activeTab === 'portfolio' ? 'active' : ''} role="tab" aria-selected={activeTab === 'portfolio'} onClick={() => setActiveTab('portfolio')}>Portfolio <small>08</small></button><button className={activeTab === 'films' ? 'active' : ''} role="tab" aria-selected={activeTab === 'films'} onClick={() => setActiveTab('films')}>Films <small>12</small></button><button className={activeTab === 'activity' ? 'active' : ''} role="tab" aria-selected={activeTab === 'activity'} onClick={() => setActiveTab('activity')}>Activity</button></div><div className={`profile-body ${activeTab !== 'about' ? 'profile-tab-panel' : ''}`}>{tabContent}</div>{editing && <div className="profile-editor-backdrop"><form className="profile-editor" onSubmit={saveProfile}><div className="editor-header"><div><span className="eyebrow warm">YOUR PROFILE</span><h2>Edit profile</h2></div><button type="button" onClick={() => setEditing(false)}>×</button></div><label>Name<input value={draft.name || ''} onChange={editField('name')} /></label><label>Role<input value={draft.role || ''} onChange={editField('role')} /></label><label>Location<input value={draft.location || ''} onChange={editField('location')} /></label><label>Bio<textarea value={draft.bio || ''} onChange={editField('bio')} /></label><button className="primary-button" type="submit">Save changes</button></form></div>}</>
}

function ProfileView() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user, setUser, clearSession } = useAuthSession()
  const isFilmmaker = Boolean(user && user.preferences?.primaryIdentity === 'filmmaker')
  if (!isFilmmaker) {
    return <Navigate to="/" replace />
  }
  const creator = creators.find(item => item.name.toLowerCase().replace(/\s+/g, '-') === username) || { name: user?.name || 'Arjun Mehta', role: user?.preferences?.primaryIdentity === 'filmmaker' ? 'Filmmaker' : 'Director · Writer · Editor', image: user?.avatarUrl || PROFILE_AVATAR_PLACEHOLDER, coverImage: user?.coverUrl || '' }
  const isOwnProfile = !username || username === user?.username
  const savedProfile = (() => { try { return JSON.parse(localStorage.getItem('a-max-profile') || 'null') } catch { return null } })()
  const initialProfile = isOwnProfile ? {
    ...creator,
    ...(savedProfile || {}),
    name: savedProfile?.name || user?.name || creator.name,
    image: profileAvatar(isOwnProfile ? savedProfile?.image : null, user?.avatarUrl, isOwnProfile ? null : creator.image),
    coverImage: savedProfile?.coverImage || savedProfile?.coverUrl || user?.coverUrl || creator.coverImage || '',
    about: savedProfile?.about || user?.about || creator.about || '',
    bio: savedProfile?.bio || user?.bio || creator.bio || '',
    location: savedProfile?.location || user?.location || creator.location || '',
    creativeStyle: savedProfile?.creativeStyle || user?.creativeStyle || creator.creativeStyle || '',
    skills: savedProfile?.skills || user?.skills || creator.skills || [],
    socialLinks: savedProfile?.socialLinks || user?.socialLinks || creator.socialLinks || {},
    filmTaste: (Array.isArray(savedProfile?.filmTaste) ? savedProfile.filmTaste : Array.isArray(user?.filmTaste) ? user.filmTaste : Array.isArray(creator.filmTaste) ? creator.filmTaste : []).map((item, index) => ({ ...item, id: item.id || `saved-film-${index}` }))
  } : creator
  const [profile, setProfile] = useState(initialProfile)
  const [draft, setDraft] = useState(initialProfile)
  const [activeTab, setActiveTab] = useState('work')
  const [editing, setEditing] = useState(false)
  const [inlineEditCard, setInlineEditCard] = useState('')
  const [inlineEditDraft, setInlineEditDraft] = useState({ name: '', location: '', about: '', bio: '', creativeStyle: '' })
  const [inlineEditSaving, setInlineEditSaving] = useState(false)
  const [inlineEditError, setInlineEditError] = useState('')
  const [professionalFieldSaving, setProfessionalFieldSaving] = useState(false)
  const [professionalFieldMessage, setProfessionalFieldMessage] = useState('')
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const [profileMessage, setProfileMessage] = useState('')
  const [coverImageError, setCoverImageError] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [connectLinks, setConnectLinks] = useState(() => initialProfile.socialLinks || {})
  const [connectSaving, setConnectSaving] = useState(false)
  const [connectMessage, setConnectMessage] = useState('')
  const [filmTasteItems, setFilmTasteItems] = useState(() => Array.isArray(initialProfile.filmTaste) ? initialProfile.filmTaste : [])
  const [filmTasteSaving, setFilmTasteSaving] = useState(false)
  const [filmTasteMessage, setFilmTasteMessage] = useState('')
  const [filmTastePosterError, setFilmTastePosterError] = useState('')

  const [userFilms, setUserFilms] = useState(() => isOwnProfile ? readPublishedItems('a-max-published-films') : [])
  const [userScripts, setUserScripts] = useState(() => isOwnProfile ? readPublishedItems('a-max-published-scripts').filter(item => item.contentId) : [])
  const [userEquipment, setUserEquipment] = useState(() => isOwnProfile ? readPublishedItems('a-max-published-equipment') : [])

  useEffect(() => {
    if (isOwnProfile || !username) return undefined
    let active = true
    apiRequest('/profiles/filmmakers')
      .then(profiles => {
        if (!active || !Array.isArray(profiles)) return
        const publicProfile = profiles.find(item => item.username === username)
        if (publicProfile) setProfile(current => ({ ...current, ...publicProfile }))
      })
      .catch(error => console.warn('Unable to load filmmaker profile:', error))
    return () => { active = false }
  }, [username, isOwnProfile])

  useEffect(() => {
    if (!profileMenuOpen) return undefined
    const closeMenu = event => {
      if (!profileMenuRef.current?.contains(event.target)) setProfileMenuOpen(false)
    }
    const closeOnEscape = event => {
      if (event.key === 'Escape') setProfileMenuOpen(false)
    }
    document.addEventListener('mousedown', closeMenu)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeMenu)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [profileMenuOpen])

  const loadWork = async () => {
    try {
      const localFilms = isOwnProfile ? readPublishedItems('a-max-published-films') : []
      const localScripts = isOwnProfile ? readPublishedItems('a-max-published-scripts').filter(item => item.contentId) : []
      const localEquipment = isOwnProfile ? readPublishedItems('a-max-published-equipment') : []

      const [apiFilmsRes, apiScriptsRes, apiStoriesRes, apiEquipRes] = await Promise.allSettled([
        apiRequest('/content?type=film'),
        apiRequest('/content?type=script'),
        apiRequest('/content?type=story'),
        apiRequest('/equipment')
      ])

      const rawFilms = apiFilmsRes.status === 'fulfilled' && Array.isArray(apiFilmsRes.value) ? apiFilmsRes.value : []
      const rawScripts = [
        ...(apiScriptsRes.status === 'fulfilled' && Array.isArray(apiScriptsRes.value) ? apiScriptsRes.value : []),
        ...(apiStoriesRes.status === 'fulfilled' && Array.isArray(apiStoriesRes.value) ? apiStoriesRes.value : [])
      ]
      const rawEquipment = apiEquipRes.status === 'fulfilled' && Array.isArray(apiEquipRes.value) ? apiEquipRes.value : []

      // Filter films for this user
      const filteredApiFilms = rawFilms.filter(f => {
        if (isOwnProfile) {
          const creatorObj = typeof f.creator === 'object' ? f.creator : null
          return (user?._id && (creatorObj?._id === user._id || f.creator === user._id)) ||
                 (user?.username && creatorObj?.username === user.username) ||
                 (user?.name && (creatorObj?.name === user.name || f.creator === user.name)) ||
                 (profile.name && (creatorObj?.name === profile.name || f.creator === profile.name))
        }
        const creatorObj = typeof f.creator === 'object' ? f.creator : null
        return (username && (creatorObj?.username === username || creatorObj?.name?.toLowerCase().replace(/\s+/g, '-') === username)) ||
               (profile.name && (creatorObj?.name === profile.name || f.creator === profile.name))
      }).map(mapApiFilm)

      // Merge local and API films without duplicates
      const filmMap = new Map()
      localFilms.forEach(f => {
        const key = f.contentId || f.localId || f.id || f.title
        filmMap.set(key, f)
      })
      filteredApiFilms.forEach(f => {
        const key = f.contentId || f.id || f.title
        if (!filmMap.has(key)) filmMap.set(key, f)
      })
      setUserFilms(Array.from(filmMap.values()))

      // Filter scripts for this user
      const filteredApiScripts = rawScripts.filter(s => {
        if (isOwnProfile) {
          const creatorObj = typeof s.creator === 'object' ? s.creator : null
          return (user?._id && (creatorObj?._id === user._id || s.creator === user._id)) ||
                 (user?.username && (creatorObj?.username === user.username || s.creatorUsername === user.username)) ||
                 (user?.name && (creatorObj?.name === user.name || s.creator === user.name)) ||
                 (profile.name && (creatorObj?.name === profile.name || s.creator === profile.name))
        }
        const creatorObj = typeof s.creator === 'object' ? s.creator : null
        return (username && (creatorObj?.username === username || s.creatorUsername === username || creatorObj?.name?.toLowerCase().replace(/\s+/g, '-') === username)) ||
               (profile.name && (creatorObj?.name === profile.name || s.creator === profile.name))
      }).map(mapApiScript)

      const scriptMap = new Map()
      localScripts.forEach(s => {
        const key = s.contentId || s.id || s.title
        scriptMap.set(key, s)
      })
      filteredApiScripts.forEach(s => {
        const key = s.contentId || s.id || s.title
        if (!scriptMap.has(key)) scriptMap.set(key, s)
      })
      setUserScripts(Array.from(scriptMap.values()))

      // Filter equipment for this user
      const filteredApiEquip = rawEquipment.filter(item => {
        if (isOwnProfile) {
          return (user?._id && (String(item.sellerId) === String(user._id))) ||
                 (user?.id && (String(item.sellerId) === String(user.id))) ||
                 (user?.username && item.sellerUsername === user.username) ||
                 (user?.name && item.seller === user.name) ||
                 (profile.name && item.seller === profile.name) ||
                 item.seller === 'You'
        }
        return (username && (item.sellerUsername === username || item.seller?.toLowerCase().replace(/\s+/g, '-') === username)) ||
               (profile.name && item.seller === profile.name)
      }).map(mapApiEquipment)

      const equipMap = new Map()
      localEquipment.forEach(item => {
        const key = item.id || item.title
        equipMap.set(key, item)
      })
      filteredApiEquip.forEach(item => {
        const key = item.id || item.title
        if (!equipMap.has(key)) equipMap.set(key, item)
      })
      setUserEquipment(Array.from(equipMap.values()))
    } catch (err) {
      console.warn('Unable to refresh user work:', err)
    }
  }

  useEffect(() => {
    loadWork()
    const handleUpdate = () => loadWork()
    window.addEventListener('amax:published-content', handleUpdate)
    window.addEventListener('amax:equipment-listing-updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('amax:published-content', handleUpdate)
      window.removeEventListener('amax:equipment-listing-updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [username, user?._id, profile.name])

  const editField = field => event => setDraft(current => ({ ...current, [field]: event.target.value }))
  const chooseProfileImage = event => {
    const image = event.target.files?.[0]
    if (!image) return
    const reader = new FileReader()
    reader.onload = result => setDraft(current => ({ ...current, image: result.target.result }))
    reader.readAsDataURL(image)
  }

  const chooseProfileCover = async event => {
    const input = event.currentTarget
    const image = input.files?.[0]
    input.value = ''
    if (!image) return
    setCoverImageError('')
    if (!image.type.startsWith('image/')) {
      setCoverImageError('Choose an image file for your profile background.')
      return
    }
    if (image.size > 12 * 1024 * 1024) {
      setCoverImageError('Choose an image smaller than 12 MB.')
      return
    }
    try {
      const bitmap = await createImageBitmap(image)
      const scale = Math.min(1, 1600 / bitmap.width, 1000 / bitmap.height)
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      const context = canvas.getContext('2d')
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      bitmap.close()
      let blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .82))
      if (!blob) throw new Error('This image could not be processed. Try another image.')
      if (blob.size > 1_000_000) blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .68))
      if (!blob || blob.size > 1_100_000) throw new Error('This image is still too large after compression. Choose a smaller image.')
      const reader = new FileReader()
      reader.onload = result => setDraft(current => ({ ...current, coverImage: result.target.result }))
      reader.onerror = () => setCoverImageError('Unable to read this image. Try another one.')
      reader.readAsDataURL(blob)
    } catch (error) {
      setCoverImageError(error.message || 'Unable to process this background image.')
    }
  }

  const saveProfile = async event => {
    event.preventDefault()
    setProfileSaving(true)
    setProfileMessage('')
    try {
      const updatedUser = await apiRequest('/auth/me/profile', { method: 'PUT', body: JSON.stringify({ name: draft.name, avatarUrl: profileAvatar(draft.image) === PROFILE_AVATAR_PLACEHOLDER ? '' : draft.image, coverUrl: draft.coverImage || '', about: draft.about || '', bio: draft.bio || '', location: draft.location || '', creativeStyle: draft.creativeStyle || '' }) })
      setUser(updatedUser)
      const nextProfile = { ...draft, name: updatedUser.name, image: profileAvatar(updatedUser.avatarUrl, draft.image), coverImage: updatedUser.coverUrl || draft.coverImage || '', about: updatedUser.about ?? draft.about ?? '', bio: updatedUser.bio ?? draft.bio ?? '', location: updatedUser.location ?? draft.location ?? '', creativeStyle: updatedUser.creativeStyle ?? draft.creativeStyle ?? '' }
      setProfile(nextProfile)
      localStorage.setItem('a-max-profile', JSON.stringify(nextProfile))
      window.dispatchEvent(new CustomEvent('a-max-profile-updated', { detail: nextProfile }))
      setEditing(false)
    } catch (error) {
      setProfileMessage(error.message || 'Unable to save your profile. Please try again.')
    } finally {
      setProfileSaving(false)
    }
  }

  const beginAboutCardEdit = card => {
    setInlineEditDraft({
      name: profile.name || '',
      location: profile.location || '',
      about: profile.about || '',
      bio: profile.bio || '',
      creativeStyle: profile.creativeStyle || '',
    })
    setInlineEditError('')
    setInlineEditCard(card)
  }

  const saveAboutCardEdit = async () => {
    if (inlineEditSaving) return
    setInlineEditSaving(true)
    setInlineEditError('')
    const payload = inlineEditCard === 'overview'
      ? { name: inlineEditDraft.name, location: inlineEditDraft.location, about: inlineEditDraft.about }
      : inlineEditCard === 'biography'
        ? { bio: inlineEditDraft.bio }
        : { creativeStyle: inlineEditDraft.creativeStyle }
    try {
      const updatedUser = await apiRequest('/auth/me/profile', { method: 'PUT', body: JSON.stringify(payload) })
      setUser(updatedUser)
      const nextProfile = {
        ...profile,
        ...payload,
        name: updatedUser.name || profile.name,
        about: updatedUser.about ?? (payload.about ?? profile.about),
        bio: updatedUser.bio ?? (payload.bio ?? profile.bio),
        location: updatedUser.location ?? (payload.location ?? profile.location),
        creativeStyle: updatedUser.creativeStyle ?? (payload.creativeStyle ?? profile.creativeStyle),
      }
      setProfile(nextProfile)
      setDraft(current => ({ ...current, ...nextProfile }))
      localStorage.setItem('a-max-profile', JSON.stringify(nextProfile))
      window.dispatchEvent(new CustomEvent('a-max-profile-updated', { detail: nextProfile }))
      setInlineEditCard('')
    } catch (error) {
      setInlineEditError(error.message || 'Unable to save these profile details.')
    } finally {
      setInlineEditSaving(false)
    }
  }

  const saveProfessionalField = async value => {
    if (professionalFieldSaving) return
    setProfessionalFieldSaving(true)
    setProfessionalFieldMessage('')
    const skills = value ? [value] : []
    try {
      const updatedUser = await apiRequest('/auth/me/profile', { method: 'PUT', body: JSON.stringify({ skills }) })
      setUser(updatedUser)
      const nextProfile = { ...profile, skills: updatedUser.skills || skills }
      setProfile(nextProfile)
      setDraft(current => ({ ...current, ...nextProfile }))
      localStorage.setItem('a-max-profile', JSON.stringify(nextProfile))
      window.dispatchEvent(new CustomEvent('a-max-profile-updated', { detail: nextProfile }))
      setProfessionalFieldMessage('Saved')
    } catch (error) {
      setProfessionalFieldMessage(error.message || 'Unable to save your professional field.')
    } finally {
      setProfessionalFieldSaving(false)
    }
  }

  const saveConnectLinks = async event => {
    event.preventDefault()
    setConnectSaving(true)
    setConnectMessage('')
    try {
      const updatedUser = await apiRequest('/auth/me/profile', { method: 'PUT', body: JSON.stringify({ socialLinks: connectLinks }) })
      setUser(updatedUser)
      const nextProfile = { ...profile, socialLinks: updatedUser.socialLinks || connectLinks }
      setProfile(nextProfile)
      setConnectLinks(nextProfile.socialLinks)
      localStorage.setItem('a-max-profile', JSON.stringify(nextProfile))
      window.dispatchEvent(new CustomEvent('a-max-profile-updated', { detail: nextProfile }))
      setConnectMessage('Your profile links are saved.')
    } catch (error) {
      setConnectMessage(error.message || 'Unable to save your profile links.')
    } finally {
      setConnectSaving(false)
    }
  }

  const addFilmTasteItem = () => {
    if (filmTasteItems.length >= 6) return
    const id = globalThis.crypto?.randomUUID?.() || `taste-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setFilmTasteItems(items => [...items, { id, title: '', posterUrl: '', note: '' }])
    setFilmTasteMessage('')
  }

  const updateFilmTasteItem = (id, field, value) => {
    setFilmTasteItems(items => items.map((item, index) => (item.id || `film-taste-${index}`) === id ? { ...item, id, [field]: value } : item))
    setFilmTasteMessage('')
  }

  const chooseFilmTastePoster = async (id, event) => {
    const input = event.currentTarget
    const image = input.files?.[0]
    input.value = ''
    if (!image) return
    setFilmTastePosterError('')
    if (!image.type.startsWith('image/')) {
      setFilmTastePosterError('Choose an image for this film poster.')
      return
    }
    if (image.size > 12 * 1024 * 1024) {
      setFilmTastePosterError('Choose a poster image smaller than 12 MB.')
      return
    }
    let bitmap
    try {
      bitmap = await createImageBitmap(image)
      let scale = Math.min(1, 480 / bitmap.width, 720 / bitmap.height)
      let canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      let context = canvas.getContext('2d')
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      let blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .64))
      if (!blob) throw new Error('This poster could not be processed. Try another image.')
      if (blob.size > 180_000) {
        scale = Math.min(scale, 400 / bitmap.width, 600 / bitmap.height)
        canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(bitmap.width * scale))
        canvas.height = Math.max(1, Math.round(bitmap.height * scale))
        context = canvas.getContext('2d')
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .45))
      }
      if (!blob || blob.size > 180_000) throw new Error('This poster is too large after compression. Choose a smaller image.')
      const reader = new FileReader()
      reader.onload = result => updateFilmTasteItem(id, 'posterUrl', result.target.result)
      reader.onerror = () => setFilmTastePosterError('Unable to read this poster image.')
      reader.readAsDataURL(blob)
    } catch (error) {
      setFilmTastePosterError(error.message || 'Unable to process this poster image.')
    } finally {
      bitmap?.close?.()
    }
  }

  const saveFilmTaste = async event => {
    event.preventDefault()
    setFilmTasteSaving(true)
    setFilmTasteMessage('')
    try {
      const updatedUser = await apiRequest('/auth/me/profile', { method: 'PUT', body: JSON.stringify({ filmTaste: filmTasteItems }) })
      setUser(updatedUser)
      const nextProfile = { ...profile, filmTaste: updatedUser.filmTaste || filmTasteItems }
      setProfile(nextProfile)
      setFilmTasteItems(nextProfile.filmTaste)
      localStorage.setItem('a-max-profile', JSON.stringify(nextProfile))
      window.dispatchEvent(new CustomEvent('a-max-profile-updated', { detail: nextProfile }))
      setFilmTasteMessage('Your Cinematic DNA has been saved.')
    } catch (error) {
      setFilmTasteMessage(error.message || 'Unable to save your film selections.')
    } finally {
      setFilmTasteSaving(false)
    }
  }

  const signOut = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  const profileFocusAreas = Array.isArray(profile.skills) && profile.skills.length
    ? profile.skills
    : (profile.role || '').split('·').map(item => item.trim()).filter(Boolean)
  const safeSocialHref = value => {
    try {
      const url = new URL(value)
      return url.protocol === 'https:' ? url.href : ''
    } catch { return '' }
  }
  const profileSocialLinks = [
    ['instagram', 'Instagram'],
    ['youtube', 'YouTube'],
    ['imdb', 'IMDb'],
    ['website', 'Website']
  ].map(([key, label]) => ({ key, label, href: safeSocialHref(profile.socialLinks?.[key] || '') })).filter(item => item.href)
  const visibleFilmTaste = isOwnProfile ? filmTasteItems : Array.isArray(profile.filmTaste) ? profile.filmTaste : []
  const filmTasteIsIncomplete = filmTasteItems.some(item => !item.title?.trim() || !item.posterUrl || !item.note?.trim())

  const tabs = [
    ['work', 'Work'],
    ['about', 'About'],
    ['taste', 'Cinematic DNA'],
    ['connect', 'Connect']
  ]

  const filmsSection = (
    <div className="profile-work-section">
      <div className="section-title">
        <div>
          <span className="eyebrow warm">SHORT FILMS</span>
        </div>
      </div>
      {userFilms.length ? (
        <div className="film-grid">
          {userFilms.map(film => <FilmCard key={film.contentId || film.localId || film.id || film.title} film={film} showAccent={false} profileContext/>)}
        </div>
      ) : (
        <div className="profile-empty-work">
          <Film size={26}/>
          <div>
            <h4>No short films uploaded yet</h4>
            <p>Upload and showcase your short films, documentaries, or scenes in MP4 format.</p>
          </div>
        </div>
      )}
    </div>
  )

  const scriptsSection = (
    <div className="profile-work-section">
      <div className="section-title">
        <div>
          <span className="eyebrow warm">WRITING</span>
        </div>
      </div>
      {userScripts.length ? (
        <div className="explore-grid">
          {userScripts.map(script => <ScriptCard key={script.contentId || script.title} script={script} profileContext/>)}
        </div>
      ) : (
        <div className="profile-empty-work">
          <FileText size={26}/>
          <div>
            <h4>No scripts or stories published yet</h4>
            <p>Publish screenplays, treatments, or stories in PDF format for filmmakers to read.</p>
          </div>
        </div>
      )}
    </div>
  )

  const equipmentSection = (
    <div className="profile-work-section">
      <div className="section-title">
        <div>
          <span className="eyebrow warm">MARKETPLACE</span>
          <h2>Listed Equipment</h2>
        </div>
      </div>
      {userEquipment.length ? (
        <div className="equipment-table-wrap">
          <table className="equipment-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Details</th>
                <th>Price</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {userEquipment.map(item => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/marketplace/${item.id}`}>
                      <MediaImage image={item.image} imageKey={item.imageKey} alt={item.title}/>
                    </Link>
                  </td>
                  <td>
                    <Link to={`/marketplace/${item.id}`}>
                      <strong>{item.title}</strong>
                      <small>{item.category} · {item.condition}</small>
                      <p>{item.description}</p>
                    </Link>
                  </td>
                  <td>
                    <b>{listingPrice(item)}</b>
                    {item.salePrice && item.rentalPrice && <small>Sale: {formatInr(item.salePrice)}</small>}
                  </td>
                  <td>
                    <small>{item.location}</small>
                  </td>
                  <td>
                    <span className="equipment-tag" style={{ position: 'static' }}>ACTIVE</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="profile-empty-work">
          <Camera size={26}/>
          <div>
            <h4>No equipment listed yet</h4>
            <p>Put your gear to work by listing cameras, lenses, or lighting for sale or rent.</p>
          </div>
        </div>
      )}
    </div>
  )

  let tabContent = null
  if (activeTab === 'work') {
    tabContent = (
      <div className="profile-main-work">
        <h2 className="profile-worked-on-title">Worked On</h2>
        {filmsSection}
        {scriptsSection}
        {equipmentSection}
      </div>
    )
  } else if (activeTab === 'about') {
    tabContent = (
      <div className="profile-about-tab-content">
        <section className={`profile-about-card profile-overview-card${inlineEditCard === 'overview' ? ' is-editing' : ''}`}>
          {isOwnProfile && <button className="profile-about-edit" type="button" aria-label={inlineEditCard === 'overview' ? 'Save about details' : 'Edit about details'} title={inlineEditCard === 'overview' ? 'Save changes' : 'Edit about details'} disabled={inlineEditSaving} onClick={inlineEditCard === 'overview' ? saveAboutCardEdit : () => beginAboutCardEdit('overview')}>{inlineEditCard === 'overview' ? <Check size={15}/> : <Pencil size={14}/>}</button>}
          <span className="eyebrow">ABOUT</span>
          {inlineEditCard === 'overview' ? <div className="profile-about-inline-fields">
            <label>Name<input maxLength={80} value={inlineEditDraft.name} onChange={event => setInlineEditDraft(current => ({ ...current, name: event.target.value }))}/></label>
            <label>Location<input maxLength={120} value={inlineEditDraft.location} onChange={event => setInlineEditDraft(current => ({ ...current, location: event.target.value }))} placeholder="City, country"/></label>
            <label className="profile-about-inline-bio-field">About you<textarea className="profile-about-inline-textarea" aria-label="Write about yourself" maxLength={3000} value={inlineEditDraft.about} onKeyDown={event => { if (event.key === 'Escape') setInlineEditCard('') }} onChange={event => setInlineEditDraft(current => ({ ...current, about: event.target.value }))} placeholder="Write about yourself, your journey, and what you care about as a filmmaker…"/></label>
            <button className="profile-about-inline-cancel" type="button" onClick={() => setInlineEditCard('')}>Cancel</button>
          </div> : <><h2>{profile.name}</h2><div className="profile-about-facts">
            <div><span>FILMMAKER</span><strong>{profile.role || 'Filmmaker'}</strong></div>
            {profile.location && <div><span>BASED IN</span><strong>{profile.location}</strong></div>}
          </div>{profile.about && <p className="profile-about-description">{profile.about}</p>}</>}
          {inlineEditCard === 'overview' && inlineEditError && <p className="profile-about-inline-error" role="alert">{inlineEditError}</p>}
        </section>
        <section className={`profile-about-card profile-biography-card${inlineEditCard === 'biography' ? ' is-editing' : ''}`}>
          {isOwnProfile && <button className="profile-about-edit" type="button" aria-label={inlineEditCard === 'biography' ? 'Save biography' : 'Edit biography'} title={inlineEditCard === 'biography' ? 'Save changes' : 'Edit biography'} disabled={inlineEditSaving} onClick={inlineEditCard === 'biography' ? saveAboutCardEdit : () => beginAboutCardEdit('biography')}>{inlineEditCard === 'biography' ? <Check size={15}/> : <Pencil size={14}/>}</button>}
          <span className="eyebrow">BIOGRAPHY</span>
          <h2>{profile.name}</h2>
          {inlineEditCard === 'biography' ? <><textarea className="profile-about-inline-textarea" aria-label="Biography" maxLength={1200} value={inlineEditDraft.bio} onKeyDown={event => { if (event.key === 'Escape') setInlineEditCard('') }} onChange={event => setInlineEditDraft(current => ({ ...current, bio: event.target.value }))} placeholder="Introduce yourself and your filmmaking journey."/><button className="profile-about-inline-cancel" type="button" onClick={() => setInlineEditCard('')}>Cancel</button></> : <p>{profile.bio || 'Add a short biography to introduce yourself and your work.'}</p>}
          {profile.location && <span className="profile-about-location">{profile.location}</span>}
          {inlineEditCard === 'biography' && inlineEditError && <p className="profile-about-inline-error" role="alert">{inlineEditError}</p>}
        </section>
        <section className={`profile-about-card profile-style-card${inlineEditCard === 'creativeStyle' ? ' is-editing' : ''}`}>
          {isOwnProfile && <button className="profile-about-edit" type="button" aria-label={inlineEditCard === 'creativeStyle' ? 'Save creative style' : 'Edit creative style'} title={inlineEditCard === 'creativeStyle' ? 'Save changes' : 'Edit creative style'} disabled={inlineEditSaving} onClick={inlineEditCard === 'creativeStyle' ? saveAboutCardEdit : () => beginAboutCardEdit('creativeStyle')}>{inlineEditCard === 'creativeStyle' ? <Check size={15}/> : <Pencil size={14}/>}</button>}
          <span className="eyebrow">CREATIVE STYLE</span>
          <h2>How I tell stories</h2>
          {inlineEditCard === 'creativeStyle' ? <><textarea className="profile-about-inline-textarea" aria-label="Creative style" maxLength={1000} value={inlineEditDraft.creativeStyle} onKeyDown={event => { if (event.key === 'Escape') setInlineEditCard('') }} onChange={event => setInlineEditDraft(current => ({ ...current, creativeStyle: event.target.value }))} placeholder="Describe the visual language, themes, and stories that define your work."/><button className="profile-about-inline-cancel" type="button" onClick={() => setInlineEditCard('')}>Cancel</button></> : <p>{profile.creativeStyle || 'Describe your visual language, the stories you gravitate toward, or the way you like to work.'}</p>}
          <div className="profile-about-focus">
            <span>PROFESSIONAL FIELD</span>
            {isOwnProfile ? (
              <div className="profile-professional-field-wrap">
                <select aria-label="Choose your professional field" value={profile.skills?.[0] || profileFocusAreas[0] || ''} disabled={professionalFieldSaving} onChange={event => saveProfessionalField(event.target.value)}>
                  <option value="">Choose your field</option>
                  {!PROFILE_PROFESSIONAL_FIELDS.includes(profile.skills?.[0] || profileFocusAreas[0]) && (profile.skills?.[0] || profileFocusAreas[0]) && <option value={profile.skills?.[0] || profileFocusAreas[0]}>{profile.skills?.[0] || profileFocusAreas[0]}</option>}
                  {PROFILE_PROFESSIONAL_FIELDS.map(field => <option value={field} key={field}>{field}</option>)}
                </select>
                <ChevronDown size={13} aria-hidden="true"/>
              </div>
            ) : (
              <div className="skill-list">{profileFocusAreas.map(skill => <span key={skill}>{skill}</span>)}</div>
            )}
            {isOwnProfile && professionalFieldMessage && <small className={`profile-professional-field-message${professionalFieldMessage === 'Saved' ? ' is-saved' : ' is-error'}`} role="status">{professionalFieldMessage}</small>}
          </div>
          {inlineEditCard === 'creativeStyle' && inlineEditError && <p className="profile-about-inline-error" role="alert">{inlineEditError}</p>}
        </section>
      </div>
    )
  } else if (activeTab === 'taste') {
    tabContent = isOwnProfile ? (
      <form className="profile-taste-editor" onSubmit={saveFilmTaste}>
        <div className="profile-taste-heading">
          <div><span className="eyebrow">CINEMATIC DNA</span><h2>Films that shaped your eye</h2><p>Choose up to six films from anywhere in world cinema and tell people what you love about each one.</p></div>
          <span className="profile-taste-count">{filmTasteItems.length} / 6</span>
        </div>
        {filmTasteItems.length > 0 && <div className="profile-taste-edit-list">{filmTasteItems.map((item, index) => {
          const itemId = item.id || `film-taste-${index}`
          return <article className="profile-taste-edit-card" key={itemId}>
            <div className="profile-taste-poster-picker">
              {item.posterUrl ? <img src={item.posterUrl} alt={`${item.title || 'Film'} poster preview`}/> : <div className="profile-taste-poster-empty"><Film size={24}/><span>ADD POSTER</span></div>}
              <input id={`taste-poster-${itemId}`} className="hidden-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => chooseFilmTastePoster(itemId, event)}/>
              <label htmlFor={`taste-poster-${itemId}`}>{item.posterUrl ? 'Change poster' : 'Upload poster'}</label>
            </div>
            <div className="profile-taste-fields">
              <label>Film title<input maxLength={140} required value={item.title || ''} onChange={event => updateFilmTasteItem(item.id, 'title', event.target.value)} placeholder="Name of the film"/></label>
              <label>What do you love about it?<textarea maxLength={800} required value={item.note || ''} onChange={event => updateFilmTasteItem(item.id, 'note', event.target.value)} placeholder="The visual language, performances, themes, or the way it made you feel…"/></label>
            </div>
            <button className="profile-taste-remove" type="button" onClick={() => setFilmTasteItems(items => items.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${item.title || 'film'}`}>Remove</button>
          </article>
        })}</div>}
        {filmTasteItems.length < 6 && <button className="profile-taste-add" type="button" onClick={addFilmTasteItem}><Plus size={16}/> Add a film</button>}
        {filmTastePosterError && <p className="profile-taste-message error" role="alert">{filmTastePosterError}</p>}
        {filmTasteMessage && <p className={`profile-taste-message${filmTasteMessage.includes('saved') ? ' success' : ' error'}`} role="status">{filmTasteMessage}</p>}
        <button className="profile-connect-save profile-taste-save" type="submit" disabled={filmTasteSaving || filmTasteIsIncomplete}>{filmTasteSaving ? 'Saving collection…' : 'Save Cinematic DNA'} <ExternalLink size={15}/></button>
      </form>
    ) : (
      <section className="profile-taste-showcase">
        <div className="profile-taste-heading"><div><span className="eyebrow">CINEMATIC DNA</span><h2>Films that shaped {profile.name}’s eye</h2><p>A personal selection from world cinema, and what each film means to the filmmaker.</p></div></div>
        {visibleFilmTaste.length ? <div className="profile-taste-grid">{visibleFilmTaste.map((item, index) => <article className="profile-taste-card" key={item.id || `${item.title}-${index}`}><img src={item.posterUrl} alt={`${item.title} poster`}/><div><h3>{item.title}</h3><p>{item.note}</p></div></article>)}</div> : <div className="profile-taste-empty"><Film size={24}/><p>{profile.name} hasn’t shared their film inspirations yet.</p></div>}
      </section>
    )
  } else {
    const editableSocialFields = [
      ['instagram', 'Instagram', 'https://www.instagram.com/yourname'],
      ['youtube', 'YouTube', 'https://www.youtube.com/@yourchannel'],
      ['imdb', 'IMDb', 'https://www.imdb.com/name/nm...'],
      ['website', 'Website', 'https://yourwebsite.com']
    ]
    tabContent = isOwnProfile ? (
      <form className="profile-connect-card" onSubmit={saveConnectLinks}>
        <div className="profile-connect-heading">
          <span className="eyebrow">YOUR CREATIVE PRESENCE</span>
          <h2>Connect across platforms</h2>
          <p>Add profile URLs where collaborators can find your work.</p>
        </div>
        <div className="profile-connect-fields">
          {editableSocialFields.map(([key, label, placeholder]) => <label key={key}>{label}<input type="url" inputMode="url" autoComplete="url" value={connectLinks[key] || ''} onChange={event => setConnectLinks(current => ({ ...current, [key]: event.target.value }))} placeholder={placeholder}/></label>)}
        </div>
        {connectMessage && <p className={`profile-connect-message${connectMessage.includes('saved') ? ' success' : ''}`} role="status">{connectMessage}</p>}
        <button className="profile-connect-save" type="submit" disabled={connectSaving}>{connectSaving ? 'Saving links…' : 'Save links'} <ExternalLink size={15}/></button>
      </form>
    ) : (
      <section className="profile-connect-card profile-connect-public">
        <div className="profile-connect-heading">
          <span className="eyebrow">CONNECT</span>
          <h2>Find {profile.name} elsewhere</h2>
          <p>Creative work and professional profiles.</p>
        </div>
        {profileSocialLinks.length ? <div className="profile-social-links">{profileSocialLinks.map(item => <a key={item.key} href={item.href} target="_blank" rel="noopener noreferrer"><span><small>{item.label.toUpperCase()}</small><strong>{new URL(item.href).hostname.replace(/^www\./, '')}</strong></span><ExternalLink size={16}/></a>)}</div> : <p className="profile-connect-empty">No profile links have been added yet.</p>}
      </section>
    )
  }

  return (
    <>
      <div className="profile-hero">
        <img className="cover-image" src={profile.coverImage || profile.coverUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1500&q=80'} alt=""/>
        {isOwnProfile && <div className="profile-menu-wrap" ref={profileMenuRef}>
          <button className="profile-menu-trigger" aria-label="Profile options" aria-haspopup="menu" aria-expanded={profileMenuOpen} title="Profile options" onClick={() => setProfileMenuOpen(open => !open)}><MoreVertical size={20}/></button>
          {profileMenuOpen && <div className="profile-menu-dropdown" role="menu">
            <button role="menuitem" onClick={() => { setProfileMenuOpen(false); setDraft(profile); setEditing(true) }}><UserCircle size={16}/> Edit profile</button>
            <button role="menuitem" onClick={signOut}><LogOut size={16}/> Sign out</button>
          </div>}
        </div>}
        <div className="profile-info profile-info-centered">
          <img className="avatar" src={profileAvatar(profile.image)} onError={usePlaceholderOnAvatarError} alt={`${profile.name} profile picture`}/>
          <div className="profile-intro">
            <h1>{profile.name}</h1>
            <span className="eyebrow warm">{profile.role || 'Filmmaker'}</span>
            <p>{profile.bio || 'Stories about the quiet, strange, and beautiful parts of being human.'}</p>
            <span className="location">
              {profile.location || 'Mumbai, India'}
            </span>
          </div>
        </div>
      </div>

      <div className="profile-tabs" role="tablist" aria-label="Profile sections">
        {tabs.map(([tab, label]) => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={`profile-body ${activeTab === 'work' ? 'profile-work-panel' : activeTab === 'about' ? 'profile-about-panel' : activeTab === 'taste' ? 'profile-taste-panel' : 'profile-connect-panel'}`}>
        {tabContent}
      </div>

      {editing && (
        <div className="profile-editor-backdrop">
          <form className="profile-editor" onSubmit={saveProfile}>
            <div className="editor-header">
              <div>
                <span className="eyebrow warm">YOUR PROFILE</span>
                <h2>Edit profile</h2>
              </div>
              <button type="button" onClick={() => setEditing(false)}>×</button>
            </div>
            <div className="editor-avatar">
              <img src={profileAvatar(draft.image)} onError={usePlaceholderOnAvatarError} alt="Profile preview"/>
              <input id="profile-picture" className="hidden-file-input" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={chooseProfileImage}/>
              <label htmlFor="profile-picture" className="outline-button">Change photo</label>
            </div>
            <div className="editor-cover-field">
              <span className="editor-field-label">Profile background</span>
              <img className="editor-cover-preview" src={draft.coverImage || profile.coverImage || profile.coverUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80'} alt="Profile background preview"/>
              <input id="profile-cover-image" className="hidden-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseProfileCover}/>
              <label htmlFor="profile-cover-image" className="outline-button editor-cover-change"><Camera size={14}/> Change background image</label>
              <small>Wide JPEG, PNG, or WebP images work best. Images are resized before saving.</small>
              {coverImageError && <p className="editor-cover-error" role="alert">{coverImageError}</p>}
            </div>
            <label>Name<input value={draft.name || ''} onChange={editField('name')} /></label>
            <label>Role<input value={draft.role || ''} onChange={editField('role')} /></label>
            <label>Location<input maxLength={120} value={draft.location || ''} onChange={editField('location')} placeholder="City, country" /></label>
            <label>About you<textarea maxLength={3000} value={draft.about || ''} onChange={editField('about')} placeholder="Write about yourself and your journey." /></label>
            <label>Biography<textarea maxLength={1200} value={draft.bio || ''} onChange={editField('bio')} placeholder="Introduce yourself and your filmmaking journey." /></label>
            <label>Creative style<textarea maxLength={1000} value={draft.creativeStyle || ''} onChange={editField('creativeStyle')} placeholder="Describe the visual language, themes, and stories that define your work." /></label>
            {profileMessage && <p className="preference-message" role="alert">{profileMessage}</p>}
            <button className="primary-button" disabled={profileSaving} type="submit">{profileSaving ? 'Saving…' : 'Save changes'}</button>
          </form>
        </div>
      )}
    </>
  )
}


function LearnLegacy() { const topics = ['Cinematography', 'Screenwriting', 'Lighting', 'Sound design', 'Film direction', 'Editing']; return <><div className="page-heading compact"><span className="eyebrow">THE WORKSHOP</span><h1>Learn the craft.<br/><em>Shape the story.</em></h1><p>Practical knowledge from working filmmakers, built for the way you create.</p></div><div className="learning-feature"><div><span className="eyebrow warm">CONTINUE LEARNING · 42% COMPLETE</span><h2>The language<br/>of <em>light</em></h2><p>How contrast, color, and shadow tell a story before a character says a word.</p><div className="progress"><i style={{width: '42%'}} /></div><button className="primary-button">Continue lesson <DirectionalChevron size={15}/></button></div><div className="lesson-still"><span>Lesson 03 / 08</span></div></div><SectionTitle eyebrow="Browse the workshop" title="Build your toolkit"/><div className="topic-grid">{topics.map((topic, i) => <article key={topic}><span>0{i + 1}</span><h3>{topic}</h3><p>{['18 lessons', '12 lessons', '09 lessons', '14 lessons', '21 lessons', '16 lessons'][i]}</p><DirectionalChevron size={18}/></article>)}</div></> }

function Communities() {
  const navigate = useNavigate()
  const { user } = useAuthSession()
  const [search, setSearch] = useState('')
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const loadCommunities = useCallback(async () => {
    setLoading(true)
    setError('')
    try { setCommunities(await apiRequest('/communities')) }
    catch (requestError) { setError(requestError.message || 'Unable to load communities.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { loadCommunities() }, [loadCommunities])

  const joinCommunity = async community => {
    if (!user) {
      navigate('/login', { state: { from: '/communities' } })
      return
    }
    if (community.membershipStatus === 'member' || community.membershipStatus === 'pending') {
      navigate(`/messages?community=${encodeURIComponent(community.slug)}`)
      return
    }
    setBusyId(community.id)
    setError('')
    try {
      await apiRequest(`/communities/${encodeURIComponent(community.id)}/requests`, { method: 'POST', body: JSON.stringify({}) })
      setCommunities(current => current.map(item => item.id === community.id ? { ...item, membershipStatus: 'pending' } : item))
      navigate(`/messages?community=${encodeURIComponent(community.slug)}`)
    } catch (requestError) { setError(requestError.message || 'Unable to request access to this community.') }
    finally { setBusyId('') }
  }
  const createCommunity = async event => {
    event.preventDefault()
    if (!user) {
      navigate('/login', { state: { from: '/communities' } })
      return
    }
    setCreating(true)
    setError('')
    try {
      const community = await apiRequest('/communities', { method: 'POST', body: JSON.stringify(createForm) })
      navigate(`/messages?community=${encodeURIComponent(community.slug)}`)
    } catch (requestError) { setError(requestError.message || 'Unable to create your community.') }
    finally { setCreating(false) }
  }
  const filteredCommunities = communities.filter(community => !['member', 'pending'].includes(community.membershipStatus) && `${community.name} ${community.description}`.toLowerCase().includes(search.trim().toLowerCase()))
  return <div className="communities-page"><div className="page-heading compact"><div className="community-heading-row"><h1>COMMUNITY</h1><button type="button" className="outline-button community-create-toggle" onClick={() => user ? setCreateOpen(open => !open) : navigate('/login', { state: { from: '/communities' } })}><Plus size={15}/>{createOpen ? 'Close' : 'Create a community'}</button></div><p>Find your people, trade notes, and build something together.</p><label className="community-search"><Search size={16}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search communities..." aria-label="Search communities"/></label></div>{error && <p className="community-request-error" role="alert">{error}</p>}{createOpen && <form className="community-create-form" onSubmit={createCommunity}><label>Community name<input value={createForm.name} maxLength={80} onChange={event => setCreateForm(current => ({ ...current, name: event.target.value }))} placeholder="Indie filmmakers in Bengaluru" required minLength={3}/></label><label>What is this community for?<textarea value={createForm.description} maxLength={500} onChange={event => setCreateForm(current => ({ ...current, description: event.target.value }))} placeholder="Describe the conversations, craft, or people this space brings together."/></label><button className="primary-button" disabled={creating || createForm.name.trim().length < 3}>{creating ? 'Creating…' : 'Create community'} <DirectionalChevron size={14}/></button></form>}<div className="community-list">{loading ? <div className="community-search-empty">Loading communities…</div> : filteredCommunities.length ? filteredCommunities.map((community, index) => <article key={community.id}><div className={`community-icon icon-${index}`}><Users size={22}/></div><div><h2>{community.name}</h2><p>{community.description}</p><small>{Number(community.memberCount || 0).toLocaleString('en-IN')} members</small></div><button className="outline-button" disabled={busyId === community.id} onClick={() => joinCommunity(community)}>{busyId === community.id ? 'Requesting…' : 'Request to join'} <Plus size={14}/></button></article>) : <div className="community-search-empty">No communities are available for that search right now.</div>}</div></div>
}

function AuthPage({ mode = 'login' }) {
  const isSignup = mode === 'signup'
  const isForgot = mode === 'forgot'
  const isReset = mode === 'reset'
  const isPasswordFlow = isForgot || isReset
  const googleRef = useRef(null)
  const googleHandlerRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { acceptSession } = useAuthSession()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ name: '', email: '', password: '', passwordConfirm: '' })
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()
  const update = key => event => setForm(current => ({ ...current, [key]: event.target.value }))

  googleHandlerRef.current = handleGoogle

  useEffect(() => {
    if (!googleClientId || isPasswordFlow) return undefined

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id || !googleRef.current) {
        setMessage('Google Identity Services could not be loaded. Check your network and reload the page.')
        return
      }
      const runtime = window.__amaxGoogleRuntime ||= { clientId: '', callback: null }
      runtime.callback = response => googleHandlerRef.current?.(response)
      if (runtime.clientId !== googleClientId) {
        window.google.accounts.id.initialize({ client_id: googleClientId, callback: response => runtime.callback?.(response) })
        runtime.clientId = googleClientId
      }
      window.google.accounts.id.renderButton(googleRef.current, { theme: 'filled_black', size: 'large', width: 340, text: 'continue_with' })
    }

    if (window.google?.accounts?.id) {
      initializeGoogle()
      return undefined
    }

    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (!script) {
      setMessage('Google Identity Services could not be loaded. Check the script configuration and reload the page.')
      return undefined
    }
    const handleLoadError = () => setMessage('Google Identity Services could not be loaded. Check your network and reload the page.')
    script.addEventListener('load', initializeGoogle)
    script.addEventListener('error', handleLoadError)
    return () => {
      const runtime = window.__amaxGoogleRuntime
      if (runtime) runtime.callback = null
      script.removeEventListener('load', initializeGoogle)
      script.removeEventListener('error', handleLoadError)
    }
  }, [googleClientId, isPasswordFlow])

  function continueWithUser(data) {
    acceptSession(data)
    const destination = typeof location.state?.from === 'string' && location.state.from.startsWith('/') ? location.state.from : '/'
    const nextPath = data.user.onboardingStatus === 'pending'
      ? '/onboarding'
      : data.user.cinematicIntroSeen === false ? '/cinematic-intro' : destination
    navigate(nextPath, { replace: true })
  }

  async function handleGoogle(response) {
    setLoading(true)
    setMessage('')
    try {
      const data = await apiRequest('/auth/google', { method: 'POST', body: JSON.stringify({ credential: response.credential }) })
      continueWithUser(data)
    } catch (error) { setMessage(error.message || 'Google sign-in failed.') }
    finally { setLoading(false) }
  }

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setSuccess('')
    try {
      if (isSignup && form.password !== form.passwordConfirm) throw new Error('Passwords do not match.')
      if (isReset) {
        const result = await apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token: params.get('token'), password: form.password }) })
        setSuccess(result.message)
        setTimeout(() => navigate('/login', { replace: true }), 1600)
        return
      }
      if (isForgot) {
        const result = await apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: form.email }) })
        setSuccess(result.message)
        return
      }
      const data = await apiRequest(`/auth/${isSignup ? 'register' : 'login'}`, {
        method: 'POST',
        body: JSON.stringify(isSignup
          ? { name: form.name, email: form.email, password: form.password }
          : { identifier: form.email, password: form.password })
      })
      continueWithUser(data)
    } catch (error) { setMessage(error.message || 'Unable to continue.') }
    finally { setLoading(false) }
  }

  const title = isSignup ? 'Create your account' : isForgot ? 'Reset your password' : isReset ? 'Choose a new password' : 'Sign in to AMAX'
  const subtitle = isSignup ? 'Bring your point of view to the room.' : isForgot ? 'We’ll email you a secure, one-time reset link.' : isReset ? 'Choose a new password for your AMAX account.' : 'Pick up where your story left off.'

  return <div className="auth-page"><a className="auth-logo" href="/"><span className="mv-wordmark"><span className="mv-wordmark-name">AMAX</span><span className="mv-wordmark-subtitle">studios</span></span></a><div className="auth-frame"><div className="auth-art"><span className="eyebrow warm">WELCOME TO AMAX STUDIOS</span><h1>Your next<br/><em>story starts here.</em></h1><p>A creative home for filmmakers, storytellers, and the people who make us look twice.</p><span className="auth-art-note">CREATE · CONNECT · CREATE AGAIN</span></div><div className="auth-form"><span className="eyebrow">{isSignup ? 'JOIN THE UNIVERSE' : isPasswordFlow ? 'ACCOUNT RECOVERY' : 'WELCOME BACK'}</span><h2>{title}</h2><p className="auth-subtitle">{subtitle}</p>{!isPasswordFlow && <><div ref={googleRef} className="google-button" />{!googleClientId && <button className="google-fallback" disabled={loading} onClick={() => setMessage('Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID to client/.env and GOOGLE_CLIENT_ID to server/.env, then restart the app.')}>Continue with Google</button>}<div className="auth-divider"><span>or use email</span></div></>}<form onSubmit={submit}>{isSignup && <label>Full name<input required minLength="2" maxLength="80" autoComplete="name" value={form.name} onChange={update('name')} placeholder="Your name" /></label>}{!isReset && <label>{!isSignup && !isForgot ? 'Email or username' : 'Email address'}<input required type={isSignup || isForgot ? 'email' : 'text'} autoComplete={isSignup || isForgot ? 'email' : 'username'} value={form.email} onChange={update('email')} placeholder={!isSignup && !isForgot ? 'Email address or username' : 'you@example.com'} /></label>}{!isForgot && <label>{isReset ? 'New password' : 'Password'}<input required type="password" autoComplete={isSignup ? 'new-password' : isReset ? 'new-password' : 'current-password'} minLength="8" maxLength="128" value={form.password} onChange={update('password')} placeholder="At least 8 characters" /></label>}{isSignup && <label>Confirm password<input required type="password" autoComplete="new-password" minLength="8" maxLength="128" value={form.passwordConfirm} onChange={update('passwordConfirm')} placeholder="Enter your password again" /></label>}<button className="auth-submit" disabled={loading}>{loading ? 'Please wait…' : isSignup ? 'Create account' : isForgot ? 'Send reset link' : isReset ? 'Save new password' : 'Sign in'} <DirectionalChevron size={16}/></button></form>{message && <p className="auth-message" role="alert">{message}</p>}{success && <p className="auth-success" role="status">{success}</p>}{!isPasswordFlow && !isSignup && <p className="auth-forgot"><Link to="/forgot-password">Forgot password?</Link></p>}<p className="auth-switch">{isSignup ? 'Already have an account?' : isPasswordFlow ? 'Remembered your password?' : 'New to AMAX studios?'} <Link to={isSignup || isPasswordFlow ? '/login' : '/signup'}>{isSignup || isPasswordFlow ? 'Sign in' : 'Create an account'}</Link></p>{!isPasswordFlow && !isSignup && <p className="auth-switch"><Link to="/admin">Administrator sign in</Link></p>}</div></div><Link className="auth-back" to="/"><DirectionalChevron direction="left" size={14}/> Back to AMAX studios</Link></div>
}

function FilmUploadPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthSession()
  const [params] = useSearchParams()
  if (params.get('type') === 'equipment') return <EquipmentUploadPage />
  const [file, setFile] = useState(location.state?.file || null)
  const [preview, setPreview] = useState('')
  const [posterFile, setPosterFile] = useState(null)
  const [posterPreview, setPosterPreview] = useState('')
  const [posterCropZoom, setPosterCropZoom] = useState(1)
  const [posterCropX, setPosterCropX] = useState(50)
  const [posterCropY, setPosterCropY] = useState(50)
  const [posterCropError, setPosterCropError] = useState('')
  const [posterCropLoading, setPosterCropLoading] = useState(false)
  const [published, setPublishedState] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [extraCrew, setExtraCrew] = useState([])
  const [crewLimitNotice, setCrewLimitNotice] = useState('')
  const [form, setForm] = useState({
    title: '',
    genre: '',
    logline: '',
    director: user?.username ? `@${user.username}` : user?.name || '',
    actors: '',
    producer: '',
    dop: ''
  })

  useEffect(() => {
    if (location.state?.file) setFile(location.state.file)
  }, [location.state?.file])

  useEffect(() => {
    if (user?.username) {
      setForm(current => current.director ? current : { ...current, director: `@${user.username}` })
    }
  }, [user?.username])

  useEffect(() => {
    if (!file) {
      setPreview('')
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (!posterFile) {
      setPosterPreview('')
      setPosterCropError('')
      return undefined
    }
    let active = true
    const timeout = setTimeout(() => {
      setPosterCropLoading(true)
      renderFilmPosterCrop(posterFile, { zoom: posterCropZoom, offsetX: posterCropX, offsetY: posterCropY, width: 360, height: 540 })
        .then(({ dataUrl }) => {
          if (active) {
            setPosterPreview(dataUrl)
            setPosterCropError('')
          }
        })
        .catch(error => { if (active) setPosterCropError(error.message || 'Unable to preview this poster crop.') })
        .finally(() => { if (active) setPosterCropLoading(false) })
    }, 90)
    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [posterFile, posterCropZoom, posterCropX, posterCropY])

  useEffect(() => {
    const longlineField = document.querySelector('.film-details textarea')
    if (longlineField) longlineField.placeholder = 'One line description of Film'
  }, [])

  const update = field => event => setForm({ ...form, [field]: event.target.value })
  const actorUsernames = parseCrewUsernames(form.actors)
  const crewMemberCount = 1 + actorUsernames.length + Number(Boolean(form.producer.trim())) + Number(Boolean(form.dop.trim())) + extraCrew.filter(member => member.name.trim()).length
  const updateCrewMember = field => event => {
    const value = event.target.value
    const currentFieldCount = form[field].trim() ? 1 : 0
    if (value.trim() && crewMemberCount - currentFieldCount >= MAX_FILM_CREW_MEMBERS) {
      setCrewLimitNotice(`You can add up to ${MAX_FILM_CREW_MEMBERS} crew members.`)
      return
    }
    setForm(current => ({ ...current, [field]: value }))
    setCrewLimitNotice('')
  }
  const updateActors = event => {
    const value = event.target.value
    const names = parseCrewUsernames(value)
    const currentActorCount = actorUsernames.length
    if (crewMemberCount - currentActorCount + names.length > MAX_FILM_CREW_MEMBERS) {
      setCrewLimitNotice(`You can add up to ${MAX_FILM_CREW_MEMBERS} crew members.`)
      return
    }
    setForm(current => ({ ...current, actors: value }))
    setCrewLimitNotice('')
  }
  const addCrewRole = () => {
    if (crewMemberCount >= MAX_FILM_CREW_MEMBERS || extraCrew.length >= MAX_FILM_CREW_OPTIONS) return
    setExtraCrew(current => [...current, { role: '', name: '' }])
    setCrewLimitNotice('')
  }
  const updateCrewRole = (index, field) => event => {
    const value = event.target.value
    const currentNameCount = extraCrew[index]?.name.trim() ? 1 : 0
    if (field === 'name' && value.trim() && crewMemberCount - currentNameCount >= MAX_FILM_CREW_MEMBERS) {
      setCrewLimitNotice(`You can add up to ${MAX_FILM_CREW_MEMBERS} crew members.`)
      return
    }
    setExtraCrew(current => current.map((member, memberIndex) => memberIndex === index ? { ...member, [field]: value } : member))
    setCrewLimitNotice('')
  }
  const canPublishFilm = Boolean(file && form.title.trim() && form.genre.trim() && form.logline.trim() && user)

  const publishFilm = async () => {
    if (!file) {
      setPublishError('Please choose an MP4 video for your film.')
      return
    }
    if (!form.title.trim()) {
      setPublishError('Please enter a film title.')
      return
    }
    if (!form.genre.trim()) {
      setPublishError('Please enter a film genre (e.g. Drama, Documentary, Sci-Fi).')
      return
    }
    if (!form.logline.trim()) {
      setPublishError('Please enter a short logline or description for your film.')
      return
    }
    if (!user) {
      navigate('/login', { state: { from: '/upload?type=film' } })
      return
    }

    setPublishing(true)
    setPublishError('')
    try {
      const directorName = form.director.trim().replace(/^@/, '') || user?.name || user?.username || 'AMAX Filmmaker'
      const crewEntries = [
        { name: directorName, role: 'Director' }
      ]
      if (form.producer.trim()) {
        crewEntries.push({ name: form.producer.trim().replace(/^@/, ''), role: 'Producer' })
      }
      if (form.dop.trim()) {
        crewEntries.push({ name: form.dop.trim().replace(/^@/, ''), role: 'Director of Photography' })
      }
      if (actorUsernames.length) {
        actorUsernames.forEach(actor => {
          crewEntries.push({ name: actor.replace(/^@/, ''), role: 'Cast' })
        })
      }
      extraCrew.forEach(member => {
        if (member.name.trim() && member.role.trim()) {
          crewEntries.push({ name: member.name.trim().replace(/^@/, ''), role: member.role.trim() })
        }
      })

      const usernameCandidates = crewEntries
        .map(entry => entry.name.toLowerCase().trim())
        .filter(name => /^[a-z0-9][a-z0-9_-]{1,29}$/.test(name))

      let profilesByUsername = new Map()
      if (usernameCandidates.length) {
        try {
          const crewProfiles = await apiRequest(`/profiles/users?usernames=${encodeURIComponent([...new Set(usernameCandidates)].join(','))}`)
          if (Array.isArray(crewProfiles)) {
            profilesByUsername = new Map(crewProfiles.map(profile => [profile.username.toLowerCase(), profile]))
          }
        } catch {}
      }

      const videoKey = `film-${crypto.randomUUID()}`
      const imageKey = `film-poster-${crypto.randomUUID()}`
      try {
        await storeFilmVideo(videoKey, file)
      } catch (videoStoreErr) {
        console.warn('Could not cache video locally in IndexedDB:', videoStoreErr)
      }

      let posterData = ''
      let posterUrl = ''
      if (posterFile) {
        const croppedPoster = await renderFilmPosterCrop(posterFile, { zoom: posterCropZoom, offsetX: posterCropX, offsetY: posterCropY })
        posterUrl = croppedPoster.dataUrl
        posterData = croppedPoster.dataUrl
        await storeMediaAsset(imageKey, croppedPoster.blob)
      }
      if (!posterData) {
        posterData = films[0]?.image || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80'
        posterUrl = posterData
      }

      const cast = crewEntries.map(member => {
        const cleanUsername = member.name.toLowerCase().trim()
        const profile = profilesByUsername.get(cleanUsername)
        if (profile) {
          return { name: profile.name, role: member.role, username: profile.username, image: profile.image }
        }
        return {
          name: member.name,
          role: member.role,
          username: cleanUsername,
          image: `https://i.pravatar.cc/160?u=${encodeURIComponent(cleanUsername)}`
        }
      })

      const publishedFilm = {
        title: form.title.trim(),
        creator: directorName,
        director: directorName,
        genre: `${form.genre.trim()} · Film`,
        description: form.logline.trim(),
        cast,
        image: posterData,
        imageKey: posterFile ? imageKey : undefined,
        videoKey,
        accent: '',
        rating: ''
      }
      publishedFilm.localId = `local-film-${crypto.randomUUID()}`
      const existing = readPublishedItems('a-max-published-films')
      localStorage.setItem('a-max-published-films', JSON.stringify([publishedFilm, ...existing]))
      notifyPublishedContent()
      sessionStorage.removeItem('a-max-film-sync-notice')

      try {
        let mediaUrl = ''
        let videoUploadFailed = false
        try {
          const uploadedVideo = await apiRequest('/uploads/films', {
            method: 'POST',
            headers: { 'Content-Type': 'video/mp4' },
            body: file
          })
          mediaUrl = uploadedVideo.mediaUrl
        } catch (error) {
          console.error('Film video could not be uploaded to the server:', error)
          videoUploadFailed = true
        }

        const savedFilm = await apiRequest('/content', {
          method: 'POST',
          body: JSON.stringify({
            title: publishedFilm.title,
            description: publishedFilm.description,
            type: 'film',
            category: 'short-film',
            genre: publishedFilm.genre,
            posterUrl: posterUrl || posterData,
            mediaUrl
          })
        })
        publishedFilm.contentId = savedFilm._id
        publishedFilm.video = mediaUrl ? resolveApiMediaUrl(mediaUrl) : ''
        const current = readPublishedItems('a-max-published-films')
        localStorage.setItem('a-max-published-films', JSON.stringify(current.map(film =>
          film.localId === publishedFilm.localId ? { ...film, contentId: savedFilm._id, video: publishedFilm.video } : film
        )))
        if (videoUploadFailed) {
          const notice = 'Film published on this device, but its video could not sync. Playback will only work in the browser where the film was uploaded.'
          sessionStorage.setItem('a-max-film-sync-notice', notice)
        }
      } catch (error) {
        console.error('Film was saved locally but could not sync to the server:', error)
        sessionStorage.setItem('a-max-film-sync-notice', 'Film published on this device. Server sync failed, so it may not appear on other devices yet.')
      }

      setPublishedState(true)
      notifyPublishedContent()
      navigate('/')
    } catch (error) {
      setPublishError(error.message || 'Unable to publish this film. Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="film-upload-page">
      <div className="upload-toolbar">
        <button className="upload-back" onClick={() => navigate('/')}><DirectionalChevron direction="left" size={17}/> Back</button>
        <button className="publish-button" type="button" disabled={publishing || !canPublishFilm} onClick={publishFilm}>
          {publishing ? 'Publishing…' : published ? 'Published' : 'Publish film'} <DirectionalChevron size={16}/>
        </button>
      </div>
      <div className="film-upload-layout">
      <div className="film-upload-preview-column">
      {file ? (
        <div className="film-preview">
          <video controls src={preview} />
          <div className="preview-caption">
            <Film size={15}/>
            <span>Film preview</span>
            <small>{file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB</small>
            <input
              id="change-film-file"
              className="hidden-file-input"
              type="file"
              accept="video/mp4,.mp4"
              onChange={event => {
                const selected = event.target.files?.[0]
                if (selected) setFile(selected)
              }}
            />
            <label htmlFor="change-film-file" className="text-button preview-change-video" role="button" tabIndex={0} aria-label="Change film video" onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                document.getElementById('change-film-file')?.click()
              }
            }}>
              Change video <DirectionalChevron size={14}/>
            </label>
          </div>
        </div>
      ) : (
        <div className="poster-upload" style={{ marginBottom: '24px' }}>
          <div className="poster-copy" style={{ width: '100%' }}>
            <input
              id="upload-film-file"
              className="hidden-file-input"
              type="file"
              accept="video/mp4,.mp4"
              onChange={event => {
                const selected = event.target.files?.[0]
                if (selected) setFile(selected)
              }}
            />
            <label className="poster-picker" htmlFor="upload-film-file" style={{ padding: '36px 20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Film size={32} style={{ color: 'var(--warm)' }} />
              <strong style={{ fontSize: '15px' }}>Upload film video</strong>
              <small>Click to choose an MP4 video from your device</small>
            </label>
          </div>
        </div>
      )}
      </div>
      <div className="film-upload-details-column">
      <div className="poster-upload">
        <div className="poster-copy">
          <input
            id="poster-file"
            className="hidden-file-input"
            type="file"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            onChange={event => {
              const selected = event.target.files?.[0]
              if (selected) {
                setPosterFile(selected)
                setPosterCropZoom(1)
                setPosterCropX(50)
                setPosterCropY(50)
                setPosterCropError('')
              }
              event.target.value = ''
            }}
          />
          <label className="poster-picker" htmlFor="poster-file">
            <Upload size={17}/>{posterFile ? 'Change poster' : 'Upload poster (optional)'}
            <small>JPG / PNG</small>
          </label>
        </div>
        {posterFile && <div className="poster-crop-editor">
          <div className="poster-crop-preview" aria-label="Portrait poster crop preview">
            {posterPreview ? <img src={posterPreview} alt="Cropped portrait poster preview"/> : <span>Preparing preview…</span>}
            {posterCropLoading && posterPreview && <span className="poster-crop-updating">Updating…</span>}
          </div>
          <div className="poster-crop-controls">
            <div className="poster-crop-heading"><strong>Adjust poster</strong><small>Portrait 2:3 frame</small></div>
            <label><span>Zoom <output>{posterCropZoom.toFixed(1)}×</output></span><input type="range" min="1" max="3" step="0.05" value={posterCropZoom} onChange={event => setPosterCropZoom(Number(event.target.value))}/></label>
            <label><span>Horizontal <output>{posterCropX}%</output></span><input type="range" min="0" max="100" value={posterCropX} onChange={event => setPosterCropX(Number(event.target.value))}/></label>
            <label><span>Vertical <output>{posterCropY}%</output></span><input type="range" min="0" max="100" value={posterCropY} onChange={event => setPosterCropY(Number(event.target.value))}/></label>
            {posterCropError && <p className="poster-crop-error" role="alert">{posterCropError}</p>}
          </div>
        </div>}
      </div>
      <form className="film-details" onSubmit={event => { event.preventDefault(); publishFilm() }}>
        <label>Title
          <input required value={form.title} onChange={update('title')} placeholder="Film title" />
        </label>
        <label>Genre
          <input required value={form.genre} onChange={update('genre')} placeholder="Drama, documentary, experimental..." />
        </label>
        <label>Logline
          <textarea required value={form.logline} onChange={update('logline')} placeholder="One line description of Film" />
        </label>
        <div className="crew-heading">
          <span>Crew credits</span>
          <small>Link team members by @username or enter their names</small>
          <small className="crew-member-count">{crewMemberCount} / {MAX_FILM_CREW_MEMBERS}</small>
        </div>
        {crewLimitNotice && <p className="crew-limit-notice" role="status">{crewLimitNotice}</p>}
        <div className="crew-grid">
          <label>Director
            <input value={form.director} onChange={update('director')} placeholder={user?.username ? `@${user.username}` : '@director'} />
          </label>
          <label>Actor(s)
            <input value={form.actors} onChange={updateActors} placeholder="@username, @anotherusername" />
          </label>
          <label>Producer
            <input value={form.producer} onChange={updateCrewMember('producer')} placeholder="@username" />
          </label>
          <label>DOP / Cinematographer
            <input value={form.dop} onChange={updateCrewMember('dop')} placeholder="@username" />
          </label>
          {extraCrew.map((member, index) => (
            <div className="custom-crew" key={index}>
              <label>Profession
                <input value={member.role} onChange={updateCrewRole(index, 'role')} placeholder="Profession" />
              </label>
              <label>AMAX username or name
                <input value={member.name} onChange={updateCrewRole(index, 'name')} placeholder="@username" />
              </label>
            </div>
          ))}
          {crewMemberCount < MAX_FILM_CREW_MEMBERS && extraCrew.length < MAX_FILM_CREW_OPTIONS && <button className="add-crew-button" type="button" onClick={addCrewRole} aria-label="Add crew profession">
            <Plus size={20}/><span>Add crew</span>
          </button>}
        </div>
        {publishError && <p className="film-publish-error" role="alert">{publishError}</p>}
        <button className="publish-button form-publish" type="submit" disabled={publishing || !canPublishFilm}>
          {publishing ? 'Publishing…' : published ? 'Published' : 'Publish film'} <DirectionalChevron size={16}/>
        </button>
      </form>
      </div>
      </div>
    </div>
  )
}

async function detectScriptPageCount(file) {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (extension === 'pdf') {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const source = new TextDecoder('latin1').decode(bytes)
    const pageTreeCounts = [...source.matchAll(/\b\d+\s+\d+\s+obj([\s\S]*?)endobj/g)]
      .map(([, object]) => /\/Type\s*\/Pages\b/.test(object) ? Number(object.match(/\/Count\s+(\d+)\b/)?.[1]) : 0)
      .filter(count => Number.isSafeInteger(count) && count > 0)
    const pageCount = pageTreeCounts.length
      ? Math.max(...pageTreeCounts)
      : (source.match(/\/Type\s*\/Page\b/g) || []).length
    if (pageCount > 0 && pageCount <= 10000) return { count: pageCount, estimated: false }
    throw new Error('Could not read the page total from this PDF. Please save or export it as a standard PDF and try again.')
  }

  if (extension === 'docx') {
    const zipModule = await import('jszip')
    const JSZip = zipModule.default || zipModule
    const archive = await JSZip.loadAsync(await file.arrayBuffer())
    const properties = await archive.file('docProps/app.xml')?.async('string')
    const metadataCount = Number(properties?.match(/<(?:\w+:)?Pages>(\d+)<\/(?:\w+:)?Pages>/i)?.[1])
    if (Number.isSafeInteger(metadataCount) && metadataCount > 0 && metadataCount <= 10000) return { count: metadataCount, estimated: false }

    const documentXml = await archive.file('word/document.xml')?.async('string')
    if (!documentXml) throw new Error('Could not read the uploaded Word document.')
    const renderedBreaks = (documentXml.match(/<w:lastRenderedPageBreak\b/g) || []).length
    const explicitBreaks = (documentXml.match(/<w:br\b[^>]*w:type=["']page["']/g) || []).length
    if (renderedBreaks || explicitBreaks) return { count: Math.min(10000, Math.max(renderedBreaks, explicitBreaks) + 1), estimated: false }

    const words = documentXml.replace(/<[^>]*>/g, ' ').replace(/&(?:amp|lt|gt|quot|apos);/g, ' ').trim().split(/\s+/).filter(Boolean).length
    return { count: Math.max(1, Math.min(10000, Math.ceil(words / 250))), estimated: true }
  }

  if (extension === 'txt') {
    const text = await file.text()
    const lines = text.split(/\r?\n/)
    const renderedLines = lines.reduce((total, line) => total + Math.max(1, Math.ceil(line.length / 90)), 0)
    return { count: Math.max(1, Math.min(10000, Math.ceil(renderedLines / 55))), estimated: true }
  }

  if (extension === 'doc') {
    // Legacy .doc files do not expose a portable page tree, so use a conservative size estimate.
    return { count: Math.max(1, Math.min(10000, Math.ceil(file.size / 3000))), estimated: true }
  }

  throw new Error('Upload a PDF, DOC, DOCX, or plain-text script or story.')
}

function ScriptUploadPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthSession()
  const [file, setFile] = useState(location.state?.file || null)
  const documentInputRef = useRef(null)
  const coverInputRef = useRef(null)
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState('')
  const [published, setPublished] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [coverCropZoom, setCoverCropZoom] = useState(1)
  const [coverCropX, setCoverCropX] = useState(50)
  const [coverCropY, setCoverCropY] = useState(50)
  const [coverCropError, setCoverCropError] = useState('')
  const [coverCropLoading, setCoverCropLoading] = useState(false)
  const [detectedPageCount, setDetectedPageCount] = useState(null)
  const [pageCountLoading, setPageCountLoading] = useState(false)
  const [pageCountError, setPageCountError] = useState('')
  const [form, setForm] = useState({ writer: user?.name || '', title: '', genre: '', logline: '' })
  const displayTitle = file?.name.replace(/\.[^/.]+$/, '').split(' -- ')[0] || ''
  const fileExtension = file?.name.split('.').pop()?.toLowerCase() || ''
  const fileSize = file ? (file.size / (1024 * 1024)).toFixed(1) : '0.0'
  const update = field => event => setForm({ ...form, [field]: event.target.value })

  useEffect(() => {
    if (user?.name) setForm(current => current.writer ? current : { ...current, writer: user.name })
  }, [user?.name])

  useEffect(() => {
    if (!file) {
      setDocumentPreviewUrl('')
      return undefined
    }
    const previewUrl = URL.createObjectURL(file)
    setDocumentPreviewUrl(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [file])

  useEffect(() => {
    if (!file) {
      setDetectedPageCount(null)
      setPageCountError('')
      setPageCountLoading(false)
      return undefined
    }
    let active = true
    setDetectedPageCount(null)
    setPageCountError('')
    setPageCountLoading(true)
    detectScriptPageCount(file)
      .then(result => { if (active) setDetectedPageCount({ file, ...result }) })
      .catch(error => { if (active) setPageCountError(error.message || 'Unable to count pages in this document.') })
      .finally(() => { if (active) setPageCountLoading(false) })
    return () => { active = false }
  }, [file])

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview('')
      setCoverCropError('')
      return undefined
    }
    let active = true
    const timeout = setTimeout(() => {
      setCoverCropLoading(true)
      renderFilmPosterCrop(coverFile, { zoom: coverCropZoom, offsetX: coverCropX, offsetY: coverCropY, width: 360, height: 360 })
        .then(({ dataUrl }) => {
          if (active) {
            setCoverPreview(dataUrl)
            setCoverCropError('')
          }
        })
        .catch(error => { if (active) setCoverCropError(error.message || 'Unable to preview this cover crop.') })
        .finally(() => { if (active) setCoverCropLoading(false) })
    }, 90)
    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [coverFile, coverCropZoom, coverCropX, coverCropY])

  const chooseCover = event => {
    const image = event.target.files?.[0]
    if (!image) return
    setCoverFile(image)
    setCoverPreview('')
    setCoverCropZoom(1)
    setCoverCropX(50)
    setCoverCropY(50)
    setCoverCropError('')
    setCoverCropLoading(false)
    event.target.value = ''
  }

  const chooseDocument = event => {
    const selected = event.target.files?.[0]
    if (selected) setFile(selected)
    event.target.value = ''
  }

  const pageCount = detectedPageCount?.file === file ? detectedPageCount.count : null
  const canPublish = Boolean(file && pageCount && form.writer.trim() && form.title.trim() && form.genre.trim() && form.logline.trim())
  const publishScript = async event => {
    event?.preventDefault()
    if (!canPublish || publishing) return
    setPublishing(true)
    setPublishError('')
    try {
      const extension = file.name.split('.').pop()?.toLowerCase()
      const mimeByExtension = {
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        txt: 'text/plain'
      }
      const contentType = mimeByExtension[extension]
      if (!contentType) throw new Error('Upload a PDF, DOC, DOCX, or plain-text script or story.')
      if (file.size > 25 * 1024 * 1024) throw new Error('Script document exceeds the 25 MB upload limit.')
      const uploadedDocument = await apiRequest('/uploads/scripts', {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body: file
      })
      const croppedCover = coverFile ? await renderFilmPosterCrop(coverFile, { zoom: coverCropZoom, offsetX: coverCropX, offsetY: coverCropY, width: 1200, height: 1200 }) : null
      const posterUrl = croppedCover?.dataUrl || ''
      const contentTypeName = /story|idea/i.test(form.genre) ? 'story' : 'script'
      const savedContent = await apiRequest('/content', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.logline.trim(),
          type: contentTypeName,
          category: form.genre.trim(),
          genre: `${form.genre.trim()} · ${contentTypeName === 'story' ? 'Story' : 'Script'}`,
          pageCount,
          posterUrl,
          mediaUrl: uploadedDocument.documentUrl
        })
      })
      const publishedScript = {
        ...mapApiScript(savedContent),
        image: posterUrl || scripts[0].image,
        documentUrl: resolveApiMediaUrl(uploadedDocument.documentUrl),
        accent: 'Just published'
      }
      const existing = readPublishedItems('a-max-published-scripts')
      localStorage.setItem('a-max-published-scripts', JSON.stringify([publishedScript, ...existing.filter(item => item.contentId !== publishedScript.contentId)]))
      notifyPublishedContent()
      setPublished(true)
      navigate('/')
    } catch (error) {
      setPublishError(error.message || 'Unable to publish this script. Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  if (!file) return <div className="upload-empty"><span className="eyebrow">NEW SCRIPT / STORY</span><h1>Choose a document<br/><em>to begin.</em></h1><button className="primary-button" onClick={() => navigate('/')}>Back to home</button></div>

  return (
    <div className="script-upload-page">
      <div className="upload-toolbar">
        <button className="upload-back" onClick={() => navigate('/')}><DirectionalChevron direction="left" size={17}/> Back</button>
        <button className="publish-button" disabled={!canPublish || publishing} onClick={publishScript}>
          {publishing ? 'Publishing…' : published ? 'Published' : 'Publish script'} <DirectionalChevron size={16}/>
        </button>
      </div>
      <div className="script-upload-layout">
        <div className="script-upload-preview-column">
          <div className="script-document-preview">
            {fileExtension === 'pdf' && documentPreviewUrl
              ? <iframe className="script-document-preview-frame" src={`${documentPreviewUrl}#toolbar=0&navpanes=0&view=FitH`} title={`${displayTitle || 'Uploaded script'} preview`} />
              : <div className="script-document-placeholder"><FileText size={48}/><strong>{fileExtension.toUpperCase()} document ready</strong><span>Preview is available here for PDF documents.</span></div>}
            <div className="script-preview-caption">
              <FileText size={15}/>
              <span>Script preview</span>
              <small title={file.name}>{file.name} · {fileSize} MB</small>
              <small className="script-page-count-status" aria-live="polite">{pageCountLoading ? 'Counting pages…' : pageCount ? `${pageCount} ${pageCount === 1 ? 'page' : 'pages'}${detectedPageCount?.estimated ? ' · estimated' : ' · auto-counted'}` : pageCountError}</small>
              <input ref={documentInputRef} className="hidden-file-input" type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,.pdf,.doc,.docx,.txt" onChange={chooseDocument}/>
              <button className="text-button script-preview-change-document" type="button" onClick={() => documentInputRef.current?.click()}>Change document <DirectionalChevron size={14}/></button>
            </div>
          </div>
        </div>
        <div className="script-upload-details-column">
          <input ref={coverInputRef} id="script-cover" className="hidden-file-input" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={chooseCover} />
          {!coverFile && <div className="script-cover-panel">
            <div className="script-cover-upload">
              <FileText size={38}/>
              <label htmlFor="script-cover"><Upload size={14}/> Upload cover</label>
            </div>
          </div>}
          {coverFile && <div className="poster-crop-editor script-cover-crop-editor">
            <div className="poster-crop-preview script-cover-crop-preview" aria-label="Square cover crop preview">
              {coverPreview ? <img src={coverPreview} alt="Adjusted square cover preview" /> : <span>Preparing preview…</span>}
              {coverCropLoading && coverPreview && <span className="poster-crop-updating">Updating…</span>}
            </div>
            <div className="poster-crop-controls">
              <div className="poster-crop-heading"><strong>Adjust cover</strong><button className="script-cover-change-button" type="button" onClick={() => coverInputRef.current?.click()}><Upload size={12}/> Change cover</button></div>
              <small className="script-cover-crop-ratio">Square 1:1 frame</small>
              <label><span>Zoom <output>{coverCropZoom.toFixed(1)}×</output></span><input type="range" min="1" max="3" step="0.05" value={coverCropZoom} onChange={event => setCoverCropZoom(Number(event.target.value))}/></label>
              <label><span>Horizontal <output>{coverCropX}%</output></span><input type="range" min="0" max="100" value={coverCropX} onChange={event => setCoverCropX(Number(event.target.value))}/></label>
              <label><span>Vertical <output>{coverCropY}%</output></span><input type="range" min="0" max="100" value={coverCropY} onChange={event => setCoverCropY(Number(event.target.value))}/></label>
              {coverCropError && <p className="poster-crop-error" role="alert">{coverCropError}</p>}
            </div>
          </div>}
          <form className="script-details" onSubmit={publishScript}>
            <label>Writer<input required readOnly value={user?.name || form.writer} placeholder="Your account name" /></label>
            <label>Title<input required value={form.title} onChange={update('title')} placeholder="Script or story title" /></label>
            <label>Genre<input required value={form.genre} onChange={update('genre')} placeholder="Drama, comedy, thriller..." /></label>
            <label>Logline<textarea required value={form.logline} onChange={update('logline')} placeholder="One line description of the story" /></label>
            {publishError && <p className="film-publish-error" role="alert">{publishError}</p>}
            <button className="publish-button script-form-publish" disabled={!canPublish || publishing} type="submit">
              {publishing ? 'Publishing…' : published ? 'Published' : 'Publish script'} <DirectionalChevron size={16}/>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
function EquipmentUploadPage() {
  const navigate = useNavigate()
  const { user } = useAuthSession()
  const [imagePreview, setImagePreview] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [pricingTypeOpen, setPricingTypeOpen] = useState(false)
  const pricingTypeRef = useRef(null)
  const pricingTypeTriggerRef = useRef(null)
  const [form, setForm] = useState({ name: '', category: '', condition: '', price: '', pricingType: 'sale', location: '', description: '' })
  const update = field => event => setForm({ ...form, [field]: event.target.value })
  useEffect(() => {
    if (!pricingTypeOpen) return undefined
    const dismissOnOutsideClick = event => {
      if (!pricingTypeRef.current?.contains(event.target)) setPricingTypeOpen(false)
    }
    const dismissOnEscape = event => {
      if (event.key !== 'Escape') return
      setPricingTypeOpen(false)
      pricingTypeTriggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', dismissOnOutsideClick)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOnOutsideClick)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [pricingTypeOpen])
  const chooseImage = event => {
    const image = event.target.files?.[0]
    if (!image) { event.target.value = ''; return }
    setImageFile(image)
    const reader = new FileReader()
    reader.onload = result => setImagePreview(result.target.result)
    reader.readAsDataURL(image)
    event.target.value = ''
  }
  const canPublish = Boolean(imagePreview && form.name.trim() && form.category.trim() && form.condition.trim() && (form.pricingType === 'exchange' || form.price.trim()) && form.location.trim() && form.description.trim())
  const publishEquipment = async event => {
    event.preventDefault()
    if (!canPublish || publishing) return
    setPublishing(true)
    setPublishError('')
    try {
      const imageDataUrl = await getFilmPosterDataUrl(imageFile)
      const created = await apiRequest('/equipment', {
        method: 'POST',
        body: JSON.stringify({
          title: form.name.trim(),
          category: form.category.trim(),
          condition: form.condition.trim(),
          location: form.location.trim(),
          description: form.description.trim(),
          imageDataUrl,
          listingType: form.pricingType,
          salePrice: form.pricingType === 'sale' && form.price.trim() ? Number(form.price) : null,
          rentalPrice: form.pricingType === 'rent' && form.price.trim() ? Number(form.price) : null
        })
      })
      try {
        const stored = JSON.parse(localStorage.getItem('a-max-published-equipment') || '[]')
        localStorage.setItem('a-max-published-equipment', JSON.stringify([created, ...stored.filter(item => item.id !== created.id)]))
      } catch (storageError) {
        console.warn('Unable to cache equipment listing in localStorage:', storageError)
      }
      notifyPublishedContent()
      window.dispatchEvent(new Event('amax:equipment-listing-updated'))
      navigate('/')
    } catch (error) {
      setPublishError(error.message || 'Unable to publish this equipment listing. Please try again.')
    } finally {
      setPublishing(false)
    }
  }
  return (
    <div className="equipment-upload-page">
      <div className="upload-toolbar">
        <button className="upload-back" type="button" onClick={() => navigate('/')}><DirectionalChevron direction="left" size={17}/> Back</button>
        <button className="publish-button" type="button" disabled={!canPublish || publishing} onClick={publishEquipment}>{publishing ? 'Publishing…' : 'Publish listing'} <DirectionalChevron size={16}/></button>
      </div>
      <div className="equipment-upload-layout">
        <div className="equipment-upload-preview-column">
          <div className="equipment-image-preview-card">
            <div className={`equipment-image-preview ${imagePreview ? 'has-image' : ''}`}>
              {imagePreview
                ? <img src={imagePreview} alt="Equipment listing preview" />
                : <div className="equipment-image-empty"><Camera size={38}/><strong>Equipment photo</strong><span>Show your gear clearly</span><label className="equipment-image-select" htmlFor="equipment-image"><Upload size={14}/> Upload photo</label></div>}
              <input id="equipment-image" className="hidden-file-input" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={chooseImage}/>
            </div>
            <div className="equipment-preview-caption">
              <Camera size={15}/>
              <span>Equipment preview</span>
              {imageFile && <small title={imageFile.name}>{imageFile.name} · {(imageFile.size / (1024 * 1024)).toFixed(1)} MB</small>}
              {imagePreview && <label className="text-button equipment-change-photo" htmlFor="equipment-image"><Upload size={13}/> Change photo <DirectionalChevron size={13}/></label>}
            </div>
          </div>
        </div>
        <form className="equipment-details" onSubmit={publishEquipment}>
          <div className="equipment-upload-intro"><h1>New Equipment Listing</h1></div>
          <div className="equipment-form-grid">
            <label className="equipment-name-field">Equipment name<input required value={form.name} onChange={update('name')} placeholder="ARRI Alexa Mini" /></label>
            <label className="equipment-category-field">Category<input required value={form.category} onChange={update('category')} placeholder="Camera, lens, lighting..." /></label>
            <label>Condition<input required value={form.condition} onChange={update('condition')} placeholder="Excellent, like new, good..." /></label>
            <label>Location<input required value={form.location} onChange={update('location')} placeholder="City, country" /></label>
            <div className="equipment-pricing-label"><span>Pricing</span>
              <div className={`equipment-pricing-control ${form.pricingType === 'exchange' ? 'exchange-mode' : ''}`}>
                <div className="equipment-pricing-amount">
                  {form.pricingType === 'exchange'
                    ? <span className="equipment-no-price">No price for exchange</span>
                    : <><span className="equipment-currency">₹</span><input aria-label="Price in rupees" type="number" min="0" step="0.01" required value={form.price} onChange={update('price')} placeholder="Enter amount" />{form.pricingType === 'rent' && <span className="equipment-price-period">/ day</span>}</>}
                </div>
                <span className="equipment-pricing-divider" aria-hidden="true" />
                <div className="equipment-pricing-type" ref={pricingTypeRef} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPricingTypeOpen(false) }}>
                  <button ref={pricingTypeTriggerRef} className="equipment-pricing-type-trigger" type="button" aria-label="Listing type" aria-haspopup="menu" aria-expanded={pricingTypeOpen} aria-controls="equipment-pricing-options" onClick={() => setPricingTypeOpen(open => !open)}>
                    {form.pricingType === 'rent' ? 'For rent' : form.pricingType === 'exchange' ? 'Exchange' : 'For sale'}<ChevronDown size={15}/>
                  </button>
                  {pricingTypeOpen && <div className="equipment-pricing-options" id="equipment-pricing-options" role="menu" aria-label="Choose listing type">
                    {[['sale', 'For sale'], ['rent', 'For rent'], ['exchange', 'Exchange']].map(([value, label]) => <button key={value} className={form.pricingType === value ? 'selected' : ''} type="button" role="menuitemradio" aria-checked={form.pricingType === value} onClick={() => { setForm(current => ({ ...current, pricingType: value, price: value === 'exchange' ? '' : current.price })); setPricingTypeOpen(false) }}><span>{label}</span><i aria-hidden="true">{form.pricingType === value ? '✓' : ''}</i></button>)}
                  </div>}
                </div>
              </div>
            </div>
          </div>
          <label className="equipment-description">Description<textarea required value={form.description} onChange={update('description')} placeholder="Tell filmmakers what makes this equipment useful, and what is included." /></label>
          {publishError && <p className="film-publish-error" role="alert">{publishError}</p>}
          <button className="publish-button equipment-form-publish" disabled={!canPublish || publishing} type="submit">{publishing ? 'Publishing…' : 'Publish listing'} <DirectionalChevron size={16}/></button>
        </form>
      </div>
    </div>
  )
}

function NotificationsPage() {
  const { user, socket } = useAuthSession()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approvingCommunityRequestId, setApprovingCommunityRequestId] = useState('')

  useEffect(() => {
    let active = true
    const refresh = async () => {
      try {
        const result = await apiRequest('/notifications')
        if (!Array.isArray(result.notifications)) throw new Error('Notifications response is invalid.')
        if (!active) return
        setNotifications(result.notifications)
        setUnreadCount(result.unreadCount)
        setError('')
      } catch (requestError) {
        if (active) setError(requestError.message || 'Unable to load notifications.')
      } finally {
        if (active) setLoading(false)
      }
    }
    refresh()
    socket?.on('notification:new', refresh)
    return () => {
      active = false
      socket?.off('notification:new', refresh)
    }
  }, [socket, user])

  const markAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PATCH' })
      setNotifications(current => current.map(item => ({ ...item, readAt: item.readAt || new Date().toISOString() })))
      setUnreadCount(0)
      window.dispatchEvent(new Event('amax:notifications-read'))
      setError('')
    } catch (requestError) {
      setError(requestError.message || 'Unable to mark notifications as read.')
    }
  }

  const openNotification = async item => {
    try {
      if (!item.readAt) {
        const result = await apiRequest(`/notifications/${encodeURIComponent(item._id)}/read`, { method: 'PATCH' })
        setUnreadCount(result.unreadCount)
        setNotifications(current => current.map(notification => notification._id === item._id
          ? { ...notification, readAt: new Date().toISOString() }
          : notification))
        window.dispatchEvent(new Event('amax:notifications-read'))
      }
      if (item.type === 'community_join_request') {
        const slug = item.community?.slug
        navigate(slug ? `/messages?community=${encodeURIComponent(slug)}` : '/communities')
      } else if (item.type === 'equipment_request' || item.type === 'equipment_request_approved') {
        const listingId = item.equipmentListing?._id
        const recipient = item.actor?.username
        const requestId = item.equipmentRequest?._id
        navigate(listingId && recipient
          ? `/messages?recipient=${encodeURIComponent(recipient)}&listing=${encodeURIComponent(listingId)}${requestId ? `&request=${encodeURIComponent(requestId)}` : ''}`
          : '/notifications')
      } else {
        navigate(item.content?._id ? `/?film=${encodeURIComponent(item.content._id)}` : '/')
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to open this notification.')
    }
  }

  const approveNotificationRequest = async item => {
    const requestId = item.equipmentRequest?._id
    if (!requestId) return
    setError('')
    try {
      await apiRequest(`/equipment/requests/${encodeURIComponent(requestId)}/approve`, { method: 'PATCH' })
      const readAt = new Date().toISOString()
      setNotifications(current => current.map(notification => notification._id === item._id
        ? { ...notification, readAt, equipmentRequest: { ...notification.equipmentRequest, status: 'approved' }, equipmentListing: { ...notification.equipmentListing, active: false } }
        : notification))
      if (!item.readAt) {
        const result = await apiRequest(`/notifications/${encodeURIComponent(item._id)}/read`, { method: 'PATCH' })
        setUnreadCount(result.unreadCount)
        window.dispatchEvent(new Event('amax:notifications-read'))
      }
      try {
        const stored = JSON.parse(localStorage.getItem('a-max-published-equipment') || '[]')
        const listingId = item.equipmentListing?._id
        if (listingId) {
          localStorage.setItem('a-max-published-equipment', JSON.stringify(stored.filter(listing => listing.id !== String(listingId))))
        }
      } catch {}
      window.dispatchEvent(new Event('amax:equipment-listing-updated'))
    } catch (requestError) {
      setError(requestError.message || 'Unable to approve this equipment request.')
    }
  }

  const approveCommunityRequest = async item => {
    setApprovingCommunityRequestId(item._id)
    setError('')
    try {
      await approveCommunityJoinRequest(item)
      const result = await apiRequest('/notifications')
      setNotifications(result.notifications)
      setUnreadCount(result.unreadCount)
      window.dispatchEvent(new Event('amax:notifications-read'))
    } catch (requestError) {
      setError(requestError.message || 'Unable to approve this community request.')
    } finally {
      setApprovingCommunityRequestId('')
    }
  }

  return <div className="notifications-page">
    <div className="notifications-page-heading"><span className="eyebrow warm">YOUR STUDIO</span><h1>Notifications</h1><p>Film activity and community access requests connected to your work.</p>{unreadCount > 0 && <button className="outline-button" onClick={markAllRead}>Mark all as read · {unreadCount}</button>}</div>
    {error && <p className="notification-error" role="alert">{error}</p>}
    <div className="notification-history">
      {loading ? <p className="notification-empty">Loading notifications…</p>
        : notifications.length ? notifications.map(notification => {
          const copy = notificationCopy(notification)
          return <article className={`history-item ${notification.readAt ? 'read' : 'unread'}`} key={notification._id}>
            <button className="notification-history-open" onClick={() => openNotification(notification)}>
              <img className="notification-actor-avatar" src={notification.actor?.avatarUrl || `https://i.pravatar.cc/80?u=${encodeURIComponent(notification.actor?.username || 'amax')}`} alt=""/>
              <span className={`notification-dot notification-${notification.type}`}><Bell size={15}/></span>
              <span className="notification-history-copy"><strong>{copy.title}</strong><span>{copy.detail}</span></span>
              <time className="history-time">{formatRelativeTime(notification.createdAt)}</time>
              {!notification.readAt && <b className="notification-unread-mark"/>}
            </button>
            {notification.type === 'equipment_request' && notification.equipmentRequest?.status === 'pending' && notification.equipmentListing?.active
              && <button className="equipment-notification-approve" onClick={() => approveNotificationRequest(notification)}>Accept order</button>}
            {notification.type === 'community_join_request' && notification.communityMembershipRequest?.status === 'pending'
              && <button type="button" className="community-notification-approve" disabled={approvingCommunityRequestId === notification._id} onClick={() => approveCommunityRequest(notification)}>
                {approvingCommunityRequestId === notification._id ? 'Approving…' : 'Approve request'}
              </button>}
          </article>
        }) : !error && <p className="notification-empty">No activity yet. Likes and comments on your films will appear here.</p>}
    </div>
  </div>
}

function BookmarksPage() {
  const { bookmarks, toggleBookmark, loadMoreSaved, hasMoreSaved, loadingMoreSaved, savedLoading, savedError, savedTotals } = useBookmarks()
  const navigate = useNavigate()
  const savedFilms = bookmarks.filter(item => item.type === 'film')
  const savedScripts = bookmarks.filter(item => item.type === 'script')
  const savedStories = bookmarks.filter(item => item.type === 'story')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('films')
  const tabs = [
    { id: 'films', label: 'Films', items: savedFilms, total: savedTotals.film },
    { id: 'scripts', label: 'Scripts', items: savedScripts, total: savedTotals.script },
    { id: 'stories', label: 'Stories', items: savedStories, total: savedTotals.story }
  ]
  const activeItems = tabs.find(tab => tab.id === activeTab)?.items || []
  const renderRow = item => <article className="bookmark-row" key={item.contentId}>
    <button className="bookmark-row-open" onClick={() => navigate(item.type === 'film'
      ? `/?film=${encodeURIComponent(item.contentId)}`
      : `/?script=${encodeURIComponent(item.contentId)}`)}>
      <img src={item.image || `https://i.pravatar.cc/160?u=${encodeURIComponent(item.title)}`} alt=""/>
      <span><strong>{item.title}</strong><small>By {item.creator}</small><small>{item.genre || item.format || item.type}</small></span>
    </button>
    <button className="bookmark-remove-button" aria-label={`Remove ${item.title} from saved items`} onClick={async () => {
      setError('')
      try { await toggleBookmark(item) } catch (requestError) { setError(requestError.message || 'Unable to remove this saved item.') }
    }}><Bookmark size={16} fill="currentColor"/></button>
  </article>
  return <div className="bookmarks-page"><div className="bookmarks-heading"><span className="eyebrow warm">YOUR LIBRARY</span><h1>Bookmarks</h1><p>Films, scripts and stories you want to return to.</p></div>
    <div className="bookmark-tabs" role="tablist" aria-label="Saved content type">{tabs.map(tab => <button key={tab.id} id={`bookmark-tab-${tab.id}`} role="tab" aria-selected={activeTab === tab.id} aria-controls="bookmark-panel" className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>{tab.label}<span>{tab.total}</span></button>)}</div>
    {error && <p className="film-comment-error" role="alert">{error}</p>}
    {savedError && <p className="film-comment-error" role="alert">{savedError}</p>}
    <section className="bookmark-section" id="bookmark-panel" role="tabpanel" aria-labelledby={`bookmark-tab-${activeTab}`}>
      <div className="bookmark-section-heading"><span className="eyebrow">Saved {activeTab}</span><small>{tabs.find(tab => tab.id === activeTab)?.total || 0} saved</small></div>
      <div className="bookmark-stack">
        {savedLoading ? <p className="bookmark-empty" role="status">Loading your saved library…</p>
          : activeItems.length ? activeItems.map(renderRow)
            : !savedError && <p className="bookmark-empty">No saved {activeTab} yet.</p>}
      </div>
      {hasMoreSaved && <button className="bookmark-load-more" disabled={loadingMoreSaved} onClick={() => loadMoreSaved().catch(() => {})}>{loadingMoreSaved ? 'Loading…' : 'Load more saved items'} <ChevronDown size={14}/></button>}
    </section>
  </div>
}

function Placeholder({ title, eyebrow }) { return <div className="placeholder"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>This part of your creative universe is taking shape.</p><Link className="primary-button" to="/">Return home <DirectionalChevron size={15}/></Link></div> }

function FilmmakerOnly({ children }) {
  const { user } = useAuthSession()
  const isFilmmaker = Boolean(user && user.preferences?.primaryIdentity === 'filmmaker')
  if (!isFilmmaker) {
    return <Navigate to="/" replace />
  }
  return children
}

function CinematicIntroExperience() {
  const homeRef = useRef(null)
  const updateReveal = useCallback(progress => {
    const reveal = Math.max(0, Math.min(1, (progress - 0.86) / 0.14))
    homeRef.current?.style.setProperty('--home-reveal-y', `${(1 - reveal) * 100}svh`)
  }, [])

  return <>
    <div className="cinematic-intro-home-underlay" ref={homeRef} aria-hidden="true">
      <Shell homePreview><Home preview/></Shell>
    </div>
    <CinematicIntro onProgress={updateReveal}/>
  </>
}

function AppRoutes() {
  return <Routes>
    <Route path="/admin/*" element={<AdminPanel/>}/>
    <Route path="/login" element={<AuthPage/>}/>
    <Route path="/signup" element={<AuthPage mode="signup"/>}/>
    <Route path="/forgot-password" element={<AuthPage mode="forgot"/>}/>
    <Route path="/reset-password" element={<AuthPage mode="reset"/>}/>
    <Route path="/onboarding" element={<RequireAuth><Onboarding/></RequireAuth>}/>
    <Route path="/cinematic-intro" element={<RequireAuth><CinematicIntroExperience/></RequireAuth>}/>
    <Route path="*" element={<Shell><Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/explore" element={<Explore/>}/>
      <Route path="/profile" element={<RequireAuth><FilmmakerOnly><ProfileView/></FilmmakerOnly></RequireAuth>}/>
      <Route path="/profile/:username" element={<RequireAuth><FilmmakerOnly><ProfileView/></FilmmakerOnly></RequireAuth>}/>
      <Route path="/learn" element={<Learn/>}/>
      <Route path="/learn/:topic" element={<LearnTopicPage/>}/>
      <Route path="/communities" element={<Communities/>}/>
      <Route path="/messages" element={<RequireAuth><MessagesPage/></RequireAuth>}/>
      <Route path="/marketplace" element={<MarketplacePage/>}/>
      <Route path="/marketplace/:id" element={<EquipmentDetailPage/>}/>
      <Route path="/upload" element={<RequireAuth><FilmUploadPage/></RequireAuth>}/>
      <Route path="/upload-script" element={<RequireAuth><ScriptUploadPage/></RequireAuth>}/>
      <Route path="/bookmarks" element={<RequireAuth><BookmarksPage/></RequireAuth>}/>
      <Route path="/notifications" element={<RequireAuth><NotificationsPage/></RequireAuth>}/>
      <Route path="/settings/preferences" element={<RequireAuth><PreferenceSettings/></RequireAuth>}/>
      <Route path="*" element={<Home/>}/>
    </Routes></Shell>}/>
  </Routes>
}

function App() {
  return <AuthSessionProvider><AdminSessionProvider><BookmarksProvider><GlassPointerTracker/><AppRoutes/></BookmarksProvider></AdminSessionProvider></AuthSessionProvider>
}

export default App
