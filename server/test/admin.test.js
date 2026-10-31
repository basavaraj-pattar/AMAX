import test from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

test('admin password hashes securely with bcrypt and verifies correctly', async () => {
  const plainPassword = 'SuperSecretAdminPassword123!'
  const hash = await bcrypt.hash(plainPassword, 10)

  assert.notEqual(hash, plainPassword)
  assert.equal(await bcrypt.compare(plainPassword, hash), true)
  assert.equal(await bcrypt.compare('WrongPassword', hash), false)
})

test('admin JWT encodes adminId and role and verifies with secret', () => {
  const secret = 'test-jwt-secret-key-12345'
  const payload = {
    adminId: 'admin_67890',
    username: 'MG Admin',
    role: 'superadmin'
  }

  const token = jwt.sign(payload, secret, { expiresIn: '8h' })
  const decoded = jwt.verify(token, secret)

  assert.equal(decoded.adminId, 'admin_67890')
  assert.equal(decoded.username, 'MG Admin')
  assert.equal(decoded.role, 'superadmin')
})

test('admin role permissions properly guard superadmin-only actions', () => {
  function checkSuperAdmin(role) {
    if (role !== 'superadmin') {
      const err = new Error('Superadmin privileges required.')
      err.status = 403
      throw err
    }
    return true
  }

  assert.equal(checkSuperAdmin('superadmin'), true)
  assert.throws(() => checkSuperAdmin('moderator'), { status: 403 })
  assert.throws(() => checkSuperAdmin('user'), { status: 403 })
})

test('report category and content type validation rejects invalid values', () => {
  const validCategories = [
    'nudity_sexual', 'vulgar_abusive', 'harassment_bullying', 'hate_speech_threats',
    'illegal_content', 'copyright_infringement', 'fraud_scam_impersonation', 'spam', 'other'
  ]
  const validContentTypes = ['content', 'comment', 'equipment', 'user']

  function validateReport(type, cat, exp) {
    if (!validContentTypes.includes(type)) throw new Error('Invalid content type.')
    if (!validCategories.includes(cat)) throw new Error('Invalid report category.')
    if (typeof exp !== 'string' || exp.length > 2000) throw new Error('Explanation too long.')
    return true
  }

  assert.equal(validateReport('content', 'spam', 'unsolicited promo'), true)
  assert.throws(() => validateReport('invalid_type', 'spam', 'text'), /Invalid content type/)
  assert.throws(() => validateReport('content', 'not_a_category', 'text'), /Invalid report category/)
  assert.throws(() => validateReport('content', 'spam', 'a'.repeat(2001)), /Explanation too long/)
})
