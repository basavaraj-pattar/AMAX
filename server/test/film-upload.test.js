import test from 'node:test'
import assert from 'node:assert/strict'
import { Writable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { filmUploadSizeGuard } from '../src/routes/film-upload.routes.js'

test('film upload size guard accepts uploads within the limit', async () => {
  let writtenBytes = 0
  const sink = new Writable({
    write(chunk, _encoding, callback) {
      writtenBytes += chunk.length
      callback()
    }
  })

  await pipeline(Readable.from([Buffer.from('1234')]), filmUploadSizeGuard(4), sink)
  assert.equal(writtenBytes, 4)
})

test('film upload size guard rejects uploads exceeding the limit', async () => {
  const sink = new Writable({ write(_chunk, _encoding, callback) { callback() } })

  await assert.rejects(
    pipeline(Readable.from([Buffer.from('12345')]), filmUploadSizeGuard(4), sink),
    error => error.status === 413
  )
})
