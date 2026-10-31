import test from 'node:test'
import assert from 'node:assert/strict'
import { publicFilmmakerProfile } from '../src/routes/profile.routes.js'

test('public filmmaker profiles expose profile details without private account data', () => {
  const profile = publicFilmmakerProfile({
    _id: 'user-123',
    name: 'Ava Director',
    username: 'avadirector',
    email: 'private@example.com',
    passwordHash: 'secret',
    roles: ['enthusiast'],
    preferences: { filmmakingRoles: ['Director', 'Writer'] },
    avatarUrl: 'https://example.com/avatar.jpg',
    bio: 'Independent filmmaker',
    location: 'Mumbai',
    followers: ['one', 'two']
  })

  assert.deepEqual(profile, {
    id: 'user-123',
    name: 'Ava Director',
    username: 'avadirector',
    role: 'Director · Writer',
    image: 'https://example.com/avatar.jpg',
    bio: 'Independent filmmaker',
    location: 'Mumbai',
    followers: 2
  })
  assert.equal('email' in profile, false)
  assert.equal('passwordHash' in profile, false)
})
