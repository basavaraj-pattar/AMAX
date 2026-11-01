import test from 'node:test'
import assert from 'node:assert/strict'
import { getRuntimeConfig } from '../src/config/runtime.js'

test('development runtime keeps local defaults and allows missing persistence', () => {
  assert.deepEqual(getRuntimeConfig({ NODE_ENV: 'development' }), {
    port: 5000,
    production: false,
    mongoUri: '',
    clientOrigins: ['http://localhost:5174'],
    clientAppUrl: 'http://localhost:5174',
    storageDir: ''
  })
})

test('production runtime requires MongoDB and a strong session secret', () => {
  assert.throws(() => getRuntimeConfig({ NODE_ENV: 'production' }), /MONGO_URI is required/)
  assert.throws(() => getRuntimeConfig({
    NODE_ENV: 'production',
    MONGO_URI: 'not-a-mongodb-url',
    JWT_SECRET: 'a'.repeat(32),
    CLIENT_URL: 'https://amax.example',
    STORAGE_DIR: '/var/data'
  }), /MONGO_URI must be a MongoDB connection string/)
  assert.throws(() => getRuntimeConfig({
    NODE_ENV: 'production',
    MONGO_URI: 'mongodb+srv://example',
    JWT_SECRET: 'too-short',
    CLIENT_URL: 'https://amax.example',
    STORAGE_DIR: '/var/data'
  }), /JWT_SECRET must be at least 32 characters/)
  const productionConfig = getRuntimeConfig({
    NODE_ENV: 'production',
    MONGO_URI: 'mongodb+srv://example',
    JWT_SECRET: 'a'.repeat(32),
    CLIENT_URL: 'https://amax.example'
  })
  assert.equal(productionConfig.storageDir, '/var/data')
  assert.throws(() => getRuntimeConfig({
    NODE_ENV: 'production',
    MONGO_URI: 'mongodb+srv://example',
    JWT_SECRET: 'a'.repeat(32),
    CLIENT_URL: 'https://amax.example',
    STORAGE_DIR: 'relative-storage'
  }), /STORAGE_DIR must be an absolute path/)
})

test('client origins are normalized, deduplicated, and reject paths', () => {
  const config = getRuntimeConfig({
    NODE_ENV: 'production',
    MONGO_URI: 'mongodb+srv://example',
    JWT_SECRET: 'a'.repeat(32),
    STORAGE_DIR: '/var/data',
    CLIENT_URL: 'https://amax.example/, https://studio.amax.example'
  })
  assert.deepEqual(config.clientOrigins, ['https://amax.example', 'https://studio.amax.example'])
  assert.equal(config.clientAppUrl, 'https://amax.example')
  assert.equal(config.storageDir, '/var/data')
  assert.throws(() => getRuntimeConfig({
    NODE_ENV: 'production',
    MONGO_URI: 'mongodb+srv://example',
    JWT_SECRET: 'a'.repeat(32),
    STORAGE_DIR: '/var/data',
    CLIENT_URL: 'https://amax.example/path'
  }), /must contain only HTTP\(S\) origins/)
})

test('invalid ports are rejected before the server starts', () => {
  assert.throws(() => getRuntimeConfig({ PORT: 'not-a-port' }), /PORT must be an integer/)
  assert.throws(() => getRuntimeConfig({ PORT: '65536' }), /PORT must be an integer/)
})
