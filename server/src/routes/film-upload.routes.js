import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, rename, rm, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { Router } from 'express'
import { protect } from '../middleware/auth.js'

export const maxFilmUploadBytes = 500 * 1024 * 1024
export const filmVideoDirectory = join(dirname(fileURLToPath(import.meta.url)), '../../storage/films')

export function filmUploadSizeGuard(maxBytes = maxFilmUploadBytes) {
  let receivedBytes = 0
  return new Transform({
    transform(chunk, _encoding, callback) {
      receivedBytes += chunk.length
      if (receivedBytes > maxBytes) {
        const error = new Error('Film video exceeds the 500 MB upload limit.')
        error.status = 413
        callback(error)
        return
      }
      callback(null, chunk)
    }
  })
}

const router = Router()

router.post('/', protect, async (req, res, next) => {
  const contentType = req.headers['content-type']?.split(';', 1)[0].trim().toLowerCase()
  if (contentType !== 'video/mp4') {
    return res.status(415).json({ message: 'Upload a video in MP4 format.' })
  }
  const contentLength = Number(req.headers['content-length'])
  if (Number.isFinite(contentLength) && contentLength > maxFilmUploadBytes) {
    return res.status(413).json({ message: 'Film video exceeds the 500 MB upload limit.' })
  }

  const filename = `${randomUUID()}.mp4`
  const finalPath = join(filmVideoDirectory, filename)
  const temporaryPath = `${finalPath}.uploading`
  try {
    await mkdir(filmVideoDirectory, { recursive: true })
    await pipeline(req, filmUploadSizeGuard(), createWriteStream(temporaryPath, { flags: 'wx' }))
    const uploadedFile = await stat(temporaryPath)
    if (!uploadedFile.size) {
      await rm(temporaryPath, { force: true })
      return res.status(400).json({ message: 'The uploaded film video is empty.' })
    }
    await rename(temporaryPath, finalPath)
    res.status(201).json({ mediaUrl: `/api/videos/${filename}` })
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(cleanupError => {
      console.error('Unable to remove incomplete film upload:', cleanupError)
    })
    next(error)
  }
})

export default router
