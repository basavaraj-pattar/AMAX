import 'dotenv/config'
import mongoose from 'mongoose'
import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'

if (!process.env.MONGO_URI) {
  throw new Error('Set MONGO_URI in server/.env before creating messaging indexes.')
}

try {
  await mongoose.connect(process.env.MONGO_URI)
  await Conversation.createIndexes()
  await Message.createIndexes()
  console.log('Messaging indexes are ready.')
} catch (error) {
  console.error('Could not create messaging indexes:', error)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
