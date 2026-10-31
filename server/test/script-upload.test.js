import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable, Writable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { maxScriptUploadBytes, scriptUploadSizeGuard } from '../src/routes/script-upload.routes.js'

test('script document upload guard accepts a document within its configured limit', async () => {
  let writtenBytes = 0
  const sink = new Writable({
    write(chunk, _encoding, callback) {
      writtenBytes += chunk.length
      callback()
    }
  })

  await pipeline(Readable.from([Buffer.from('script')]), scriptUploadSizeGuard(6), sink)
  assert.equal(writtenBytes, 6)
})

test('script document upload guard rejects a document larger than 25 MB', async () => {
  const sink = new Writable({ write(_chunk, _encoding, callback) { callback() } })

  await assert.rejects(
    pipeline(
      Readable.from([Buffer.alloc(maxScriptUploadBytes + 1)]),
      scriptUploadSizeGuard(),
      sink
    ),
    error => error.status === 413
  )
})
