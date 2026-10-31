import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft, Check, FastForward, LoaderCircle, Maximize, Minimize,
  Pause, PictureInPicture2, Play, Rewind, RotateCcw, Settings2, Theater,
  Volume2, VolumeX
} from 'lucide-react'
import './CinematicVideoPlayer.css'

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2]

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) return '0:00'
  const total = Math.floor(value)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`
}

export default function CinematicVideoPlayer({
  src,
  title = 'Untitled film',
  creator = '',
  poster = '',
  sources = [],
  captions = [],
  autoPlay = true,
  onBack = () => {}
}) {
  const playerRef = useRef(null)
  const videoRef = useRef(null)
  const controlsTimerRef = useRef(null)
  const pendingSourceRef = useRef(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isTheatre, setIsTheatre] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [error, setError] = useState('')
  const [ended, setEnded] = useState(false)
  const [captionTracks, setCaptionTracks] = useState([])
  const [captionIndex, setCaptionIndex] = useState(-1)
  const [supportsPiP, setSupportsPiP] = useState(false)
  const [ratio, setRatio] = useState(16 / 9)
  const [previewTime, setPreviewTime] = useState(null)
  const [activeSource, setActiveSource] = useState(src)

  useEffect(() => {
    setActiveSource(src)
    setCurrentTime(0)
    setDuration(0)
    setError('')
    setEnded(false)
  }, [src])

  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true)
    window.clearTimeout(controlsTimerRef.current)
    if (isPlaying && !settingsOpen && !ended) {
      controlsTimerRef.current = window.setTimeout(() => setControlsVisible(false), 2800)
    }
  }, [ended, isPlaying, settingsOpen])

  useEffect(() => {
    window.clearTimeout(controlsTimerRef.current)
    if (isPlaying && !settingsOpen && !ended) {
      controlsTimerRef.current = window.setTimeout(() => setControlsVisible(false), 2800)
    } else {
      setControlsVisible(true)
    }
    return () => window.clearTimeout(controlsTimerRef.current)
  }, [ended, isPlaying, settingsOpen])

  useEffect(() => {
    setSupportsPiP(Boolean(document.pictureInPictureEnabled && videoRef.current?.requestPictureInPicture))
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement === playerRef.current)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined
    const syncTracks = () => {
      const tracks = Array.from(video.textTracks || [])
      setCaptionTracks(tracks)
      const showingIndex = tracks.findIndex(track => track.mode === 'showing')
      setCaptionIndex(showingIndex)
    }
    const list = video.textTracks
    list?.addEventListener?.('addtrack', syncTracks)
    list?.addEventListener?.('removetrack', syncTracks)
    video.addEventListener('loadedmetadata', syncTracks)
    syncTracks()
    return () => {
      list?.removeEventListener?.('addtrack', syncTracks)
      list?.removeEventListener?.('removetrack', syncTracks)
      video.removeEventListener('loadedmetadata', syncTracks)
    }
  }, [activeSource])

  useEffect(() => () => window.clearTimeout(controlsTimerRef.current), [])

  const attemptPlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (ended) {
      video.currentTime = 0
      setEnded(false)
    }
    const result = video.play()
    result?.then(() => setError('')).catch(() => {
      setIsPlaying(false)
      setError('Playback was blocked. Press play to start the film.')
      setControlsVisible(true)
    })
  }, [ended])

  const togglePlayback = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) attemptPlay()
    else video.pause()
    resetControlsTimer()
  }, [attemptPlay, resetControlsTimer])

  const seekBy = useCallback(seconds => {
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration)) return
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds))
    setCurrentTime(video.currentTime)
    setEnded(false)
    resetControlsTimer()
  }, [resetControlsTimer])

  const changeVolume = useCallback(nextVolume => {
    const video = videoRef.current
    const boundedVolume = Math.max(0, Math.min(1, nextVolume))
    setVolume(boundedVolume)
    setIsMuted(boundedVolume === 0)
    if (video) {
      video.volume = boundedVolume
      video.muted = boundedVolume === 0
    }
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const nextMuted = !video.muted
    video.muted = nextMuted
    setIsMuted(nextMuted)
    if (!nextMuted && video.volume === 0) changeVolume(0.6)
    resetControlsTimer()
  }, [changeVolume, resetControlsTimer])

  const toggleFullscreen = useCallback(async () => {
    const player = playerRef.current
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await player?.requestFullscreen?.()
    } catch {
      setError('Fullscreen is unavailable in this browser.')
    }
    resetControlsTimer()
  }, [resetControlsTimer])

  const togglePictureInPicture = useCallback(async () => {
    const video = videoRef.current
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture()
      else if (video?.requestPictureInPicture) await video.requestPictureInPicture()
    } catch {
      setError('Picture-in-picture is unavailable for this video.')
    }
    resetControlsTimer()
  }, [resetControlsTimer])

  const setRate = rate => {
    const video = videoRef.current
    if (video) video.playbackRate = rate
    setPlaybackRate(rate)
    setSettingsOpen(false)
    resetControlsTimer()
  }

  const chooseCaption = index => {
    const tracks = videoRef.current?.textTracks
    if (!tracks) return
    Array.from(tracks).forEach((track, trackIndex) => { track.mode = trackIndex === index ? 'showing' : 'disabled' })
    setCaptionIndex(index)
    setSettingsOpen(false)
    resetControlsTimer()
  }

  const changeSource = source => {
    const video = videoRef.current
    const resumeAt = video?.currentTime || 0
    const wasPlaying = video ? !video.paused : false
    pendingSourceRef.current = { src: source.src, time: resumeAt, wasPlaying }
    setActiveSource(source.src)
    setSettingsOpen(false)
  }

  useEffect(() => {
    const handleKeydown = event => {
      const target = event.target
      if (!playerRef.current) return
      const key = event.key.toLowerCase()
      if (key === 'escape') {
        if (document.fullscreenElement) {
          event.preventDefault(); event.stopPropagation(); document.exitFullscreen().catch(() => {})
        } else {
          event.preventDefault(); event.stopPropagation(); onBack()
        }
        return
      }
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName))) return
      if (event.code === 'Space' || key === ' ') {
        event.preventDefault()
        event.stopPropagation()
        togglePlayback()
      } else if (key === 'arrowleft') {
        event.preventDefault(); event.stopPropagation(); seekBy(-10)
      } else if (key === 'arrowright') {
        event.preventDefault(); event.stopPropagation(); seekBy(10)
      } else if (key === 'arrowup') {
        event.preventDefault(); event.stopPropagation(); changeVolume(volume + 0.05); resetControlsTimer()
      } else if (key === 'arrowdown') {
        event.preventDefault(); event.stopPropagation(); changeVolume(volume - 0.05); resetControlsTimer()
      } else if (key === 'm') {
        event.preventDefault(); event.stopPropagation(); toggleMute()
      } else if (key === 'f') {
        event.preventDefault(); event.stopPropagation(); toggleFullscreen()
      }
    }
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [changeVolume, onBack, resetControlsTimer, seekBy, toggleFullscreen, toggleMute, togglePlayback, volume])

  const handleSeekHover = event => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const progress = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width))
    setPreviewTime({ value: progress * duration, position: progress * 100 })
  }

  const progressPercent = duration ? Math.min(100, currentTime / duration * 100) : 0

  return <div
    ref={playerRef}
    className={`cinema-player${controlsVisible ? ' cinema-player-controls-visible' : ' cinema-player-controls-hidden'}${isTheatre ? ' cinema-player-theatre' : ''}${isBuffering ? ' cinema-player-buffering' : ''}`}
    style={{ '--cinema-video-ratio': ratio }}
    onPointerMove={resetControlsTimer}
    onPointerDown={resetControlsTimer}
    onTouchStart={resetControlsTimer}
    onContextMenu={event => event.preventDefault()}
    aria-label={`Video player: ${title}`}
  >
    <div className="cinema-player-backdrop" style={poster ? { backgroundImage: `url("${poster.replaceAll('"', '')}")` } : undefined}/>
    <div className="cinema-player-stage">
      <video
        ref={videoRef}
        className="cinema-player-video"
        src={activeSource}
        poster={poster || undefined}
        autoPlay={autoPlay}
        playsInline
        preload="metadata"
        controls={false}
        controlsList="nodownload noplaybackrate noremoteplayback"
        disableRemotePlayback
        onLoadedMetadata={event => {
          const video = event.currentTarget
          setDuration(Number.isFinite(video.duration) ? video.duration : 0)
          if (video.videoWidth && video.videoHeight) setRatio(video.videoWidth / video.videoHeight)
          setSupportsPiP(Boolean(document.pictureInPictureEnabled && video.requestPictureInPicture))
          setError('')
          const pendingSource = pendingSourceRef.current
          if (pendingSource?.src === activeSource) {
            video.currentTime = Math.min(pendingSource.time, Number.isFinite(video.duration) ? video.duration : pendingSource.time)
            if (pendingSource.wasPlaying) video.play().catch(() => {})
            pendingSourceRef.current = null
          }
        }}
        onCanPlay={() => setIsBuffering(false)}
        onLoadStart={() => setIsBuffering(true)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => { setIsPlaying(true); setIsBuffering(false); setEnded(false); setError('') }}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)}
        onDurationChange={event => { if (Number.isFinite(event.currentTarget.duration)) setDuration(event.currentTarget.duration) }}
        onEnded={() => { setIsPlaying(false); setEnded(true); setControlsVisible(true) }}
        onError={() => { setIsBuffering(false); setError('This film could not be played. Check the connection and try again.'); setControlsVisible(true) }}
      >{captions.map((caption, index) => <track
        key={`${caption.src}-${index}`}
        kind={caption.kind || 'subtitles'}
        src={caption.src}
        srcLang={caption.srcLang || caption.srclang || 'en'}
        label={caption.label || `Track ${index + 1}`}
        default={Boolean(caption.default)}
      />)}</video>
    </div>

    <header className="cinema-player-topbar">
      <button type="button" className="cinema-player-back" onClick={onBack} aria-label="Back to film details"><ArrowLeft size={20}/></button>
      <div className="cinema-player-heading"><strong title={title}>{title}</strong>{creator && <span>{creator}</span>}</div>
    </header>

    {isBuffering && !error && <div className="cinema-player-loader" role="status" aria-label="Buffering"><LoaderCircle size={38}/></div>}
    {error && <div className="cinema-player-status" role="alert"><span>{error}</span><button type="button" onClick={() => { setError(''); const video = videoRef.current; video?.load(); if (autoPlay) video?.play().catch(() => {}) }}>Try again</button></div>}

    {ended && !error && <div className="cinema-player-endcard">
      <span className="cinema-player-eyebrow">END OF FILM</span>
      <h2>{title}</h2>
      <p>{creator ? `A film by ${creator}` : 'Thank you for watching.'}</p>
      <div><button type="button" className="cinema-player-end-primary" onClick={() => { setEnded(false); setCurrentTime(0); if (videoRef.current) videoRef.current.currentTime = 0; attemptPlay() }}><RotateCcw size={16}/> Replay</button><button type="button" className="cinema-player-end-secondary" onClick={onBack}>Back to film</button></div>
    </div>}

    <div className="cinema-player-controls">
      <div className="cinema-player-shade"/>
      <div className="cinema-player-timeline">
        <div className="cinema-player-seek-wrap" onMouseMove={handleSeekHover} onMouseLeave={() => setPreviewTime(null)}>
          {previewTime && duration > 0 && <span className="cinema-player-time-preview" style={{ left: `${previewTime.position}%` }}>{formatTime(previewTime.value)}</span>}
          <div className="cinema-player-seek-track"><span style={{ width: `${progressPercent}%` }}/><i style={{ left: `${progressPercent}%` }}/></div>
          <input
            className="cinema-player-seek"
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={duration ? Math.min(currentTime, duration) : 0}
            aria-label="Seek through film"
            style={{ '--seek-percent': `${progressPercent}%` }}
            onChange={event => {
              const time = Number(event.target.value)
              if (videoRef.current) videoRef.current.currentTime = time
              setCurrentTime(time)
              setEnded(false)
            }}
          />
        </div>
      </div>
      <div className="cinema-player-toolbar">
        <div className="cinema-player-toolbar-left">
          <button type="button" className="cinema-player-icon cinema-player-play" onClick={togglePlayback} aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor"/>}</button>
          <button type="button" className="cinema-player-icon cinema-player-skip" onClick={() => seekBy(-10)} aria-label="Rewind 10 seconds"><Rewind size={18}/><small>10</small></button>
          <button type="button" className="cinema-player-icon cinema-player-skip" onClick={() => seekBy(10)} aria-label="Forward 10 seconds"><FastForward size={18}/><small>10</small></button>
          <button type="button" className="cinema-player-icon cinema-player-volume-icon" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>{isMuted || volume === 0 ? <VolumeX size={19}/> : <Volume2 size={19}/>}</button>
          <input className="cinema-player-volume" type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} aria-label="Volume" onChange={event => changeVolume(Number(event.target.value))}/>
          <span className="cinema-player-time">{formatTime(currentTime)} <i>/</i> {formatTime(duration)}</span>
        </div>
        <div className="cinema-player-toolbar-right">
          {supportsPiP && <button type="button" className="cinema-player-icon" onClick={togglePictureInPicture} aria-label="Picture in picture"><PictureInPicture2 size={18}/></button>}
          <button type="button" className={`cinema-player-icon${isTheatre ? ' is-active' : ''}`} onClick={() => setIsTheatre(value => !value)} aria-label={isTheatre ? 'Exit theatre mode' : 'Theatre mode'} aria-pressed={isTheatre}><Theater size={18}/></button>
          <button type="button" className="cinema-player-icon" onClick={() => setSettingsOpen(value => !value)} aria-label="Player settings" aria-expanded={settingsOpen}><Settings2 size={18}/></button>
          <button type="button" className="cinema-player-icon" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>{isFullscreen ? <Minimize size={19}/> : <Maximize size={19}/>}</button>
        </div>
      </div>
      {settingsOpen && <div className="cinema-player-settings" role="menu" aria-label="Playback settings">
        <div className="cinema-player-settings-title"><Settings2 size={15}/> Settings</div>
        <span className="cinema-player-setting-label">Playback speed</span>
        <div className="cinema-player-speed-list">{PLAYBACK_RATES.map(rate => <button key={rate} type="button" role="menuitemradio" aria-checked={playbackRate === rate} onClick={() => setRate(rate)}>{rate === 1 ? 'Normal' : `${rate}×`}{playbackRate === rate && <Check size={14}/>}</button>)}</div>
        {captionTracks.length > 0 && <>
          <span className="cinema-player-setting-label">Subtitles</span>
          <div className="cinema-player-speed-list"><button type="button" role="menuitemradio" aria-checked={captionIndex < 0} onClick={() => chooseCaption(-1)}>Off{captionIndex < 0 && <Check size={14}/>}</button>{captionTracks.map((track, index) => <button key={`${track.language}-${track.label}-${index}`} type="button" role="menuitemradio" aria-checked={captionIndex === index} onClick={() => chooseCaption(index)}>{track.label || track.language || `Track ${index + 1}`}{captionIndex === index && <Check size={14}/>}</button>)}</div>
        </>}
        {sources.length > 1 && <>
          <span className="cinema-player-setting-label">Video quality</span>
          <div className="cinema-player-speed-list">{sources.map(source => <button key={source.src} type="button" role="menuitemradio" aria-checked={activeSource === source.src} onClick={() => changeSource(source)}>{source.label}{activeSource === source.src && <Check size={14}/>}</button>)}</div>
        </>}
      </div>}
    </div>
  </div>
}
