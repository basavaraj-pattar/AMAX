#!/usr/bin/env node
/**
 * Admin setup script — run once to create the MG Admin account.
 * Usage: node src/scripts/setup-admin.js
 *
 * Reads MONGO_URI, ADMIN_USERNAME, ADMIN_DISPLAY_NAME, and ADMIN_INITIAL_PASSWORD
 * from process.env (loaded via dotenv from server/.env).
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import AdminAccount from '../models/AdminAccount.js'

const MONGO_URI = process.env.MONGO_URI
if (!MONGO_URI) {
  console.error('MONGO_URI is not set in server/.env')
  process.exit(1)
}

const username = process.env.ADMIN_USERNAME || 'MG Admin'
const displayName = process.env.ADMIN_DISPLAY_NAME || 'MG Admin'
const initialPassword = process.env.ADMIN_INITIAL_PASSWORD

if (!initialPassword || initialPassword.length < 8) {
  console.error('ADMIN_INITIAL_PASSWORD must be set in server/.env and be at least 8 characters.')
  process.exit(1)
}

try {
  await mongoose.connect(MONGO_URI)
  console.log('Connected to MongoDB')

  const existing = await AdminAccount.findOne({ username })
  if (existing) {
    console.log(`Admin account "${username}" already exists. Skipping creation.`)
    console.log('To reset the password, use the admin panel settings.')
    await mongoose.disconnect()
    process.exit(0)
  }

  const passwordHash = await bcrypt.hash(initialPassword, 12)
  await AdminAccount.create({ username, displayName, passwordHash, mustChangePassword: true })

  console.log(`✓ Admin account created successfully.`)
  console.log(`  Username: ${username}`)
  console.log(`  Password: [set from ADMIN_INITIAL_PASSWORD env var]`)
  console.log(`  ⚠ The admin must change the password on first login.`)
  await mongoose.disconnect()
  process.exit(0)
} catch (error) {
  console.error('Setup failed:', error.message)
  process.exit(1)
}
