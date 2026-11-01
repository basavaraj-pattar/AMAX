import test from 'node:test'
import assert from 'node:assert/strict'
import { directConversationKey, validateMessageInput } from '../src/services/messaging.js'

test('direct conversations have the same key regardless of participant order', () => {
  assert.equal(directConversationKey('user-a', 'user-b'), directConversationKey('user-b', 'user-a'))
})

test('message text is trimmed and its idempotency key is retained', () => {
  assert.deepEqual(validateMessageInput('  Hello AMAX  ', 'message-123'), {
    body: 'Hello AMAX',
    clientMessageId: 'message-123'
  })
})

test('empty and oversized messages are rejected', () => {
  assert.throws(() => validateMessageInput('   ', 'message-123'), { status: 400, message: 'Write a message or attach a file.' })
  assert.throws(() => validateMessageInput('12345', 'message-123', 4), { status: 400 })
})

test('messages may contain attachments without text', () => {
  assert.deepEqual(validateMessageInput('', 'message-123', 2000, true), {
    body: '',
    clientMessageId: 'message-123'
  })
})

test('invalid idempotency keys are rejected', () => {
  assert.throws(() => validateMessageInput('hello', 'short'), { status: 400 })
  assert.throws(() => validateMessageInput('hello', 'invalid key'), { status: 400 })
})
