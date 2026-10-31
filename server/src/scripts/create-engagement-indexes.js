import 'dotenv/config'
import mongoose from 'mongoose'
import Comment from '../models/Comment.js'
import Notification from '../models/Notification.js'

if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required to create engagement indexes.')

try {
  await mongoose.connect(process.env.MONGO_URI)
  await Promise.all([Comment.createIndexes(), Notification.createIndexes()])
  console.log('Film engagement indexes are ready.')
} finally {
  await mongoose.disconnect()
}
