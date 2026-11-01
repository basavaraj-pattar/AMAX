import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const defaultStorageDir = fileURLToPath(new URL('../../storage/', import.meta.url))
const configuredStorageDir = process.env.STORAGE_DIR?.trim()

export const storageRoot = resolve(configuredStorageDir || defaultStorageDir)
export const filmVideoDirectory = join(storageRoot, 'films')
export const scriptDocumentDirectory = join(storageRoot, 'scripts')
export const messageAttachmentDirectory = join(storageRoot, 'message-attachments')
