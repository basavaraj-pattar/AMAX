export function directConversationKey(firstUserId, secondUserId) {
  return [String(firstUserId), String(secondUserId)].sort().join(':')
}

export function validateMessageInput(bodyValue, clientMessageId, maximumLength = 2000, hasAttachments = false) {
  const body = typeof bodyValue === 'string' ? bodyValue.trim() : ''
  if (!body && !hasAttachments) throw Object.assign(new Error('Write a message or attach a file.'), { status: 400 })
  if (body.length > maximumLength) throw Object.assign(new Error(`Messages must be ${maximumLength} characters or fewer.`), { status: 400 })
  if (typeof clientMessageId !== 'string' || !/^[a-zA-Z0-9_-]{8,64}$/.test(clientMessageId)) {
    throw Object.assign(new Error('A valid message request ID is required.'), { status: 400 })
  }
  return { body, clientMessageId }
}
