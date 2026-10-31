import test from 'node:test'
import assert from 'node:assert/strict'
import { mergePreferences, preferenceDefaults, preferenceKeys } from '../src/services/preferences.js'

function blankPreferences() {
  return {
    primaryIdentity: 'cinephile',
    genres: [],
    filmmakingRoles: [],
    interests: [],
    languages: [],
    sources: Object.fromEntries(preferenceKeys.map(key => [key, 'default']))
  }
}

test('skip all applies defaults and marks their source', () => {
  const preferences = mergePreferences(blankPreferences(), {}, { skipAll: true })

  for (const key of preferenceKeys) {
    assert.deepEqual(preferences[key], preferenceDefaults[key])
    assert.equal(preferences.sources[key], 'default')
  }
})

test('explicit selections survive later default application', () => {
  const selected = mergePreferences(blankPreferences(), {
    primaryIdentity: 'filmmaker',
    genres: ['Comedy', 'Thriller']
  })
  const skipped = mergePreferences(selected, {}, { skipAll: true })

  assert.equal(skipped.primaryIdentity, 'filmmaker')
  assert.deepEqual(skipped.genres, ['Comedy', 'Thriller'])
  assert.equal(skipped.sources.primaryIdentity, 'selected')
  assert.equal(skipped.sources.genres, 'selected')
  assert.deepEqual(skipped.languages, ['English'])
})

test('skipping one question applies only that preference default', () => {
  const preferences = mergePreferences(blankPreferences(), {}, { skippedStep: 'languages' })

  assert.deepEqual(preferences.languages, ['English'])
  assert.deepEqual(preferences.genres, [])
})

test('invalid values and unknown skipped steps are rejected', () => {
  assert.throws(() => mergePreferences(blankPreferences(), { primaryIdentity: 'admin' }), { status: 400 })
  assert.throws(() => mergePreferences(blankPreferences(), { languages: ['Klingon'] }), { status: 400 })
  assert.throws(() => mergePreferences(blankPreferences(), {}, { skippedStep: 'secret' }), { status: 400 })
})

test('duplicate preference choices are stored once', () => {
  const preferences = mergePreferences(blankPreferences(), { genres: ['Drama', 'Drama'] })

  assert.deepEqual(preferences.genres, ['Drama'])
})
