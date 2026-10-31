import { useMemo, useState } from 'react'
import mvLogo from '../assets/mv-logo.png'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Clapperboard, Film, Sparkles } from 'lucide-react'
import DirectionalChevron from '../components/DirectionalChevron'
import { useAuthSession } from '../context/AuthSession'
import { apiRequest } from '../services/api'

export const preferenceChoices = {
  primaryIdentity: [
    { value: 'cinephile', title: 'Cinephile', detail: 'Discover independent cinema, follow filmmakers, and join conversations about film.' },
    { value: 'filmmaker', title: 'Filmmaker', detail: 'Showcase your work, find collaborators, and grow your craft.' }
  ],
  genres: ['Drama', 'Comedy', 'Thriller', 'Psychological Thriller', 'Mystery', 'Crime', 'Horror', 'Science Fiction', 'Fantasy', 'Romance', 'Action', 'Adventure', 'Animation', 'Documentary', 'Experimental Cinema', 'Short Films', 'Independent Cinema', 'World Cinema'],
  filmmakingRoles: ['Director', 'Assistant Director', 'Writer / Screenwriter', 'Storyboard Artist', 'Producer', 'Executive Producer', 'Cinematographer / DOP', 'Camera Operator', 'Video Editor', 'Sound Designer', 'Music Composer', 'Colorist', 'VFX Artist', '2D Animator', '3D Animator', 'Production Designer', 'Art Director', 'Actor / Performer', 'Makeup Artist', 'Production Assistant', 'Film Student', 'Other'],
  interests: ['Short films and independent cinema', 'Film festivals and awards', 'Screenwriting and story development', 'Acting and casting', 'Directing and cinematography', 'Editing, color grading, and post-production', '2D and 3D animation', 'Visual effects and motion graphics', 'Behind-the-scenes content', 'Film equipment marketplace', 'Collaboration and networking', 'Film news and industry updates', 'Learning resources and tutorials'],
  languages: ['Kannada', 'Hindi', 'English', 'Telugu', 'Tamil', 'Malayalam', 'Japanese', 'Korean', 'Marathi', 'Bengali', 'Other']
}

const defaults = {
  primaryIdentity: 'cinephile',
  genres: ['Drama', 'Thriller', 'Science Fiction'],
  filmmakingRoles: [],
  interests: ['Short films and independent cinema', 'Film news and industry updates'],
  languages: ['English']
}

const steps = [
  { key: 'primaryIdentity', title: 'What do we call you?', prompt: '', eyebrow: 'YOUR FILMVERSE' },
  { key: 'genres', title: 'What kind of films do you love?', prompt: 'Choose as many genres as you like.', eyebrow: 'YOUR WATCHLIST, IN SPIRIT' },
  { key: 'filmmakingRoles', title: 'What do you do in filmmaking?', prompt: 'Pick every role that fits. Cinephiles can skip this one.', eyebrow: 'YOUR CRAFT' },
  { key: 'interests', title: 'What would you like to explore?', prompt: 'Choose the parts of AMAX you want to see more often.', eyebrow: 'YOUR CURIOSITY' },
  { key: 'languages', title: 'Which languages do you prefer?', prompt: 'We use this to personalize discovery, never to limit what you can access.', eyebrow: 'YOUR LANGUAGES' }
]

function initialPreferences(user) {
  return Object.fromEntries(Object.keys(preferenceChoices).map(key => [
    key,
    user?.preferences?.[key] ?? (key === 'primaryIdentity' ? defaults[key] : [])
  ]))
}

function onboardingPreferences(user) {
  return Object.fromEntries(Object.keys(preferenceChoices).map(key => [
    key,
    user?.preferences?.sources?.[key] === 'selected'
      ? user.preferences[key]
      : key === 'primaryIdentity' ? '' : []
  ]))
}

function ToggleOptions({ name, options, selected, onChange, search = false }) {
  const [query, setQuery] = useState('')
  const filtered = search ? options.filter(option => option.toLowerCase().includes(query.trim().toLowerCase())) : options
  const toggle = option => onChange(selected.includes(option)
    ? selected.filter(item => item !== option)
    : [...selected, option])
  return <>
    {search && <label className="preference-search">Search languages<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Type a language" /></label>}
    <div className="preference-chip-list" aria-label={name}>
      {filtered.map(option => <button type="button" key={option} className={`preference-chip ${selected.includes(option) ? 'selected' : ''}`} aria-pressed={selected.includes(option)} onClick={() => toggle(option)}>{selected.includes(option) && <Check size={14}/>}<span>{option}</span></button>)}
      {filtered.length === 0 && <p className="preference-empty">No languages found.</p>}
    </div>
  </>
}

function IdentityOptions({ selected, onChange }) {
  return <div className="identity-choice-grid">
    {preferenceChoices.primaryIdentity.map((option, index) => {
      const Icon = index === 0 ? Film : Clapperboard
      return <button type="button" key={option.value} className={`identity-choice ${selected === option.value ? 'selected' : ''}`} aria-pressed={selected === option.value} onClick={() => onChange(option.value)}>
        <Icon size={23}/><span className="eyebrow">{index === 0 ? 'FOR THE LOVE OF FILM' : 'FOR THE LOVE OF MAKING'}</span><strong>{option.title}</strong><small>{option.detail}</small>
      </button>
    })}
  </div>
}

function PreferencePicker({ preferences, onChange, showIdentity = true, searchLanguages = true }) {
  return <div className="preference-settings-form">
    {showIdentity && <section className="preference-setting-section"><span className="eyebrow">YOUR IDENTITY</span><h2>How do you use AMAX?</h2><IdentityOptions selected={preferences.primaryIdentity} onChange={value => onChange('primaryIdentity', value)}/></section>}
    <section className="preference-setting-section"><span className="eyebrow">YOUR TASTE</span><h2>Favorite film genres</h2><ToggleOptions name="Favorite film genres" options={preferenceChoices.genres} selected={preferences.genres} onChange={value => onChange('genres', value)}/></section>
    <section className="preference-setting-section"><span className="eyebrow">YOUR CRAFT</span><h2>Filmmaking roles</h2><ToggleOptions name="Filmmaking roles" options={preferenceChoices.filmmakingRoles} selected={preferences.filmmakingRoles} onChange={value => onChange('filmmakingRoles', value)}/></section>
    <section className="preference-setting-section"><span className="eyebrow">YOUR CURIOSITY</span><h2>Additional interests</h2><ToggleOptions name="Additional interests" options={preferenceChoices.interests} selected={preferences.interests} onChange={value => onChange('interests', value)}/></section>
    <section className="preference-setting-section"><span className="eyebrow">YOUR LANGUAGES</span><h2>Preferred languages</h2><p>These help personalize recommendations and never restrict access.</p><ToggleOptions name="Preferred languages" options={preferenceChoices.languages} selected={preferences.languages} onChange={value => onChange('languages', value)} search={searchLanguages}/></section>
  </div>
}

export function Onboarding() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthSession()
  const [stepIndex, setStepIndex] = useState(0)
  const [preferences, setPreferences] = useState(() => onboardingPreferences(user))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const step = steps[stepIndex]
  const currentValue = preferences[step.key]
  const hasCurrentSelection = step.key === 'primaryIdentity'
    ? Boolean(currentValue)
    : Array.isArray(currentValue) && currentValue.length > 0

  const saveStep = async (payload, nextIndex) => {
    setSaving(true)
    setMessage('')
    try {
      const updatedUser = await apiRequest('/auth/me/preferences', { method: 'PUT', body: JSON.stringify(payload) })
      setUser(updatedUser)
      setPreferences(onboardingPreferences(updatedUser))
      try {
        localStorage.setItem('a-max-profile', JSON.stringify({
          name: updatedUser.name,
          role: updatedUser.preferences?.primaryIdentity === 'filmmaker' ? 'Filmmaker' : 'Cinephile',
          image: updatedUser.avatarUrl || '/profile-avatar-placeholder.svg'
        }))
        window.dispatchEvent(new CustomEvent('a-max-profile-updated'))
      } catch {}
      if (nextIndex === null) navigate(updatedUser.cinematicIntroSeen ? '/' : '/cinematic-intro', { replace: true })
      else setStepIndex(nextIndex)
    } catch (error) {
      setMessage(error.message || 'Unable to save your preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const update = (key, value) => setPreferences(current => ({ ...current, [key]: value }))
  const continueFlow = () => {
    const isLast = stepIndex === steps.length - 1
    saveStep({ values: { [step.key]: preferences[step.key] }, complete: isLast }, isLast ? null : stepIndex + 1)
  }
  const skipStep = () => {
    const nextIndex = stepIndex + 1
    const isLast = nextIndex === steps.length
    saveStep({ skippedStep: step.key, complete: isLast }, isLast ? null : nextIndex)
  }
  const skipAll = () => saveStep({ skipAll: true }, null)
  const back = () => { setMessage(''); setStepIndex(index => Math.max(0, index - 1)) }

  return <main className="preference-page">
    <header className="preference-topbar"><Link className="auth-logo preference-brand" to="/" aria-label="AMAX studios home"><img className="preference-brand-logo" src={mvLogo} alt="" aria-hidden="true"/><span className="mv-wordmark"><span className="mv-wordmark-name">AMAX</span><span className="mv-wordmark-subtitle">studios</span></span></Link><button className="text-button" disabled={saving} onClick={skipAll}>Skip all <DirectionalChevron size={15}/></button></header>
    <section className="onboarding-panel" aria-labelledby="onboarding-title">
      <div className="onboarding-intro"><span className="eyebrow warm"><Sparkles size={13}/> WELCOME TO AMAX STUDIOS</span><h1 id="onboarding-title">A Digital<br/>FilmVerse</h1><p className="onboarding-tagline"><strong>shaped around you</strong></p></div>
      <div className="onboarding-form">
        <div className="onboarding-progress"><span>STEP {String(stepIndex + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span><div aria-label={`Step ${stepIndex + 1} of ${steps.length}`}>{steps.map((item, index) => <i key={item.key} className={index <= stepIndex ? 'active' : ''}/>)}</div></div>
        <span className="eyebrow">{step.eyebrow}</span><h2>{step.title}</h2>{step.prompt && <p className="onboarding-prompt">{step.prompt}</p>}
        {step.key === 'primaryIdentity'
          ? <IdentityOptions selected={preferences.primaryIdentity} onChange={value => update(step.key, value)}/>
          : <ToggleOptions name={step.title} options={preferenceChoices[step.key]} selected={preferences[step.key]} onChange={value => update(step.key, value)}/>}
        {message && <p className="preference-message" role="alert">{message}</p>}
        <div className="onboarding-actions">
          <button className="upload-back" disabled={saving || stepIndex === 0} onClick={back}><DirectionalChevron direction="left" size={15}/> Back</button>
          <button className="text-button" disabled={saving} onClick={skipStep}>Skip this question</button>
          <button className="publish-button" disabled={saving || !hasCurrentSelection} onClick={continueFlow}>{saving ? 'Saving…' : stepIndex === steps.length - 1 ? 'Finish' : 'Continue'} <DirectionalChevron size={15}/></button>
        </div>
      </div>
    </section>
    <p className="onboarding-footnote">Your preferences stay private and can be updated anytime in <Link to="/settings/preferences">settings</Link>.</p>
  </main>
}

export function PreferenceSettings() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthSession()
  const [preferences, setPreferences] = useState(() => initialPreferences(user))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const allSet = useMemo(() => Object.keys(preferenceChoices).every(key => {
    const value = preferences[key]
    return key === 'primaryIdentity' ? Boolean(value) : Array.isArray(value)
  }), [preferences])
  const update = (key, value) => setPreferences(current => ({ ...current, [key]: value }))

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const updatedUser = await apiRequest('/auth/me/preferences', { method: 'PUT', body: JSON.stringify({ values: preferences }) })
      setUser(updatedUser)
      setPreferences(initialPreferences(updatedUser))
      try {
        localStorage.setItem('a-max-profile', JSON.stringify({
          name: updatedUser.name,
          role: updatedUser.preferences?.primaryIdentity === 'filmmaker' ? 'Filmmaker' : 'Cinephile',
          image: updatedUser.avatarUrl || '/profile-avatar-placeholder.svg'
        }))
        window.dispatchEvent(new CustomEvent('a-max-profile-updated'))
      } catch {}
      setMessage(updatedUser.preferences?.primaryIdentity === 'filmmaker'
        ? 'Your preferences have been saved. Filmmaker mode is active — you now have full access to your profile!'
        : 'Your preferences have been saved. Cinephile mode is active.')
      navigate('/', { replace: true })
    } catch (error) {
      setMessage(error.message || 'Unable to save preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="preferences-page">
    <div className="preferences-heading"><span className="eyebrow warm">YOUR VISION</span><h1>Preferences</h1><p>Shape your FilmVerse. These choices guide discovery.</p></div>
    {user?.onboardingSkipped && <div className="preference-reminder"><span>Your original setup was skipped. You can update these preferences any time.</span></div>}
    <form onSubmit={save}>
      <PreferencePicker preferences={preferences} onChange={update}/>
      <div className="preference-settings-actions">
        {message && (
          <div className="preference-message" role="status" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span>{message}</span>
            {user?.preferences?.primaryIdentity === 'filmmaker' && (
              <Link to="/profile" className="primary-button" style={{ padding: '6px 14px', fontSize: '11px' }}>
                Open my profile <DirectionalChevron size={13}/>
              </Link>
            )}
          </div>
        )}
        <Link className="outline-button" to="/onboarding?restart=1">Restart onboarding</Link>
        <button className="publish-button" type="submit" disabled={saving || !allSet}>{saving ? 'Saving…' : 'Save preferences'} <DirectionalChevron size={15}/></button>
      </div>
    </form>
  </div>
}
