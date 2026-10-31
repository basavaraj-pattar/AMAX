import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, rename, rm, stat } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { Router } from 'express'
import { protect } from '../middleware/auth.js'

export const maxScriptUploadBytes = 25 * 1024 * 1024
export const scriptDocumentDirectory = join(dirname(fileURLToPath(import.meta.url)), '../../storage/scripts')

const supportedDocuments = new Map([
  ['application/pdf', '.pdf'],
  ['application/msword', '.doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
  ['text/plain', '.txt']
])

export function scriptUploadSizeGuard(maxBytes = maxScriptUploadBytes) {
  let receivedBytes = 0
  return new Transform({
    transform(chunk, _encoding, callback) {
      receivedBytes += chunk.length
      if (receivedBytes > maxBytes) {
        callback(Object.assign(new Error('Script document exceeds the 25 MB upload limit.'), { status: 413 }))
        return
      }
      callback(null, chunk)
    }
  })
}

const router = Router()

router.post('/', protect, async (req, res, next) => {
  const contentType = req.headers['content-type']?.split(';', 1)[0].trim().toLowerCase()
  const extension = supportedDocuments.get(contentType)
  if (!extension) return res.status(415).json({ message: 'Upload a PDF, DOC, DOCX, or plain-text document.' })

  const contentLength = Number(req.headers['content-length'])
  if (Number.isFinite(contentLength) && contentLength > maxScriptUploadBytes) {
    return res.status(413).json({ message: 'Script document exceeds the 25 MB upload limit.' })
  }

  const filename = `${randomUUID()}${extension}`
  const finalPath = join(scriptDocumentDirectory, filename)
  const temporaryPath = `${finalPath}.uploading`
  try {
    await mkdir(scriptDocumentDirectory, { recursive: true })
    await pipeline(req, scriptUploadSizeGuard(), createWriteStream(temporaryPath, { flags: 'wx' }))
    const uploadedFile = await stat(temporaryPath)
    if (!uploadedFile.size) {
      await rm(temporaryPath, { force: true })
      return res.status(400).json({ message: 'The uploaded script document is empty.' })
    }
    await rename(temporaryPath, finalPath)
    res.status(201).json({ documentUrl: `/api/scripts/files/${filename}`, fileType: extname(filename).slice(1) })
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(cleanupError => {
      console.error('Unable to remove incomplete script upload:', cleanupError)
    })
    next(error)
  }
})

export default router
