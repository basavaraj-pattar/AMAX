export const preferenceOptions = {
  primaryIdentity: ['cinephile', 'filmmaker'],
  genres: ['Drama', 'Comedy', 'Thriller', 'Psychological Thriller', 'Mystery', 'Crime', 'Horror', 'Science Fiction', 'Fantasy', 'Romance', 'Action', 'Adventure', 'Animation', 'Documentary', 'Experimental Cinema', 'Short Films', 'Independent Cinema', 'World Cinema'],
  filmmakingRoles: ['Director', 'Assistant Director', 'Writer / Screenwriter', 'Storyboard Artist', 'Producer', 'Executive Producer', 'Cinematographer / DOP', 'Camera Operator', 'Video Editor', 'Sound Designer', 'Music Composer', 'Colorist', 'VFX Artist', '2D Animator', '3D Animator', 'Production Designer', 'Art Director', 'Actor / Performer', 'Makeup Artist', 'Production Assistant', 'Film Student', 'Other'],
  interests: ['Short films and independent cinema', 'Film festivals and awards', 'Screenwriting and story development', 'Acting and casting', 'Directing and cinematography', 'Editing, color grading, and post-production', '2D and 3D animation', 'Visual effects and motion graphics', 'Behind-the-scenes content', 'Film equipment marketplace', 'Collaboration and networking', 'Film news and industry updates', 'Learning resources and tutorials'],
  languages: ['Kannada', 'Hindi', 'English', 'Telugu', 'Tamil', 'Malayalam', 'Japanese', 'Korean', 'Marathi', 'Bengali', 'Other']
}

export const preferenceDefaults = {
  primaryIdentity: 'cinephile',
  genres: ['Drama', 'Thriller', 'Science Fiction'],
  filmmakingRoles: [],
  interests: ['Short films and independent cinema', 'Film news and industry updates'],
  languages: ['English']
}

export const preferenceKeys = Object.keys(preferenceOptions)

function validationError(message) {
  const error = new Error(message)
  error.status = 400
  return error
}

export function mergePreferences(current = {}, values = {}, { skippedStep, skipAll = false } = {}) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    throw validationError('Preferences must be an object.')
  }
  const currentObject = typeof current.toObject === 'function' ? current.toObject() : current
  const preferences = {
    primaryIdentity: currentObject.primaryIdentity || preferenceDefaults.primaryIdentity,
    genres: [...(currentObject.genres || [])],
    filmmakingRoles: [...(currentObject.filmmakingRoles || [])],
    interests: [...(currentObject.interests || [])],
    languages: [...(currentObject.languages || [])],
    sources: { ...currentObject.sources }
  }
  const supplied = new Set()

  for (const key of preferenceKeys) {
    if (!Object.hasOwn(values, key)) continue
    const value = values[key]
    if (key === 'primaryIdentity') {
      if (!preferenceOptions[key].includes(value)) throw validationError('Choose a valid primary identity.')
      preferences[key] = value
    } else {
      if (!Array.isArray(value) || value.length > preferenceOptions[key].length || value.some(item => !preferenceOptions[key].includes(item))) {
        throw validationError(`Choose valid options for ${key}.`)
      }
      preferences[key] = [...new Set(value)]
    }
    preferences.sources[key] = 'selected'
    supplied.add(key)
  }

  if (skippedStep && !preferenceKeys.includes(skippedStep)) throw validationError('Unknown preference step.')
  if (skippedStep && !supplied.has(skippedStep) && preferences.sources[skippedStep] !== 'selected') {
    preferences[skippedStep] = preferenceDefaults[skippedStep]
    preferences.sources[skippedStep] = 'default'
  }
  if (skipAll) {
    for (const key of preferenceKeys) {
      if (preferences.sources[key] !== 'selected') {
        preferences[key] = preferenceDefaults[key]
        preferences.sources[key] = 'default'
      }
    }
  }
  return preferences
}
