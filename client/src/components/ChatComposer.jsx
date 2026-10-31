import { useRef, useState } from 'react'
import { FileText, Image as ImageIcon, LoaderCircle, Paperclip, Send, Video, X } from 'lucide-react'
import { apiRequest, apiUpload } from '../services/api'

const MAX_FILES = 5
const MAX_FILE_BYTES = 50 * 1024 * 1024
const acceptedFiles = 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mov,.pdf,.txt,.rtf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.odt,.ods,.odp'

function fileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(file) {
  if (file.type.startsWith('image/')) return <ImageIcon size={14}/>
  if (file.type.startsWith('video/')) return <Video size={14}/>
  return <FileText size={14}/>
}

export default function ChatComposer({ draft, setDraft, sending, placeholder, ariaLabel, className = '', onSend, onDraftChange }) {
  const inputRef = useRef(null)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [fileError, setFileError] = useState('')

  const chooseFiles = event => {
    const chosen = [...(event.target.files || [])]
    event.target.value = ''
    if (!chosen.length) return
    setFileError('')
    const available = Math.max(0, MAX_FILES - files.length)
    const accepted = chosen.slice(0, available).filter(file => file.size <= MAX_FILE_BYTES)
    if (chosen.length > available) setFileError(`Attach up to ${MAX_FILES} files per message.`)
    else if (chosen.some(file => file.size > MAX_FILE_BYTES)) setFileError('Each chat attachment must be 50 MB or smaller.')
    setFiles(current => [...current, ...accepted.map(file => ({ key: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`, file }))])
  }

  const send = async event => {
    event.preventDefault()
    if (sending || uploading || (!draft.trim() && !files.length)) return
    setUploading(true)
    setFileError('')
    try {
      const uploaded = []
      for (const item of files) {
        const attachment = item.attachment || (await apiUpload('/messages/attachments', item.file)).attachment
        uploaded.push(attachment)
        if (!item.attachment) setFiles(current => current.map(file => file.key === item.key ? { ...file, attachment } : file))
      }
      const sent = await onSend({ body: draft.trim(), attachmentIds: uploaded.map(item => item.id) })
      if (sent) setFiles([])
    } catch (error) {
      setFileError(error.message || 'Unable to upload this attachment.')
    } finally {
      setUploading(false)
    }
  }

  const busy = sending || uploading
  const removeFile = item => {
    setFiles(current => current.filter(file => file.key !== item.key))
    if (item.attachment) {
      apiRequest(`/messages/attachments/${encodeURIComponent(item.attachment.id)}`, { method: 'DELETE' }).catch(() => {})
    }
  }
  return <>
    {files.length > 0 && <div className="chat-attachment-drafts" aria-label="Files to send">
      {files.map(item => <span className="chat-attachment-draft" key={item.key}>
        {fileIcon(item.file)}<span title={item.file.name}>{item.file.name}</span><small>{fileSize(item.file.size)}</small>
        <button type="button" aria-label={`Remove ${item.file.name}`} disabled={busy} onClick={() => removeFile(item)}><X size={13}/></button>
      </span>)}
    </div>}
    <form className={`chat-composer ${className}`} onSubmit={send}>
      <input ref={inputRef} className="chat-attachment-input" type="file" accept={acceptedFiles} multiple onChange={chooseFiles} aria-label="Choose photos, videos, or documents"/>
      <button type="button" className="chat-attach-button" aria-label="Attach photos, videos, or documents" title="Attach photos, videos, or documents" disabled={busy || files.length >= MAX_FILES} onClick={() => inputRef.current?.click()}><Paperclip size={17}/></button>
      <input value={draft} maxLength={2000} onChange={event => { setDraft(event.target.value); setFileError(''); onDraftChange?.() }} placeholder={placeholder} aria-label={ariaLabel}/>
      <button className="primary-button" disabled={busy || (!draft.trim() && !files.length)} aria-label="Send message" title={busy ? 'Sending…' : 'Send message'}>{busy ? <LoaderCircle size={15} className="message-spinner"/> : <Send size={15}/>}</button>
    </form>
    {fileError && <p className="chat-attachment-error" role="alert">{fileError}</p>}
  </>
}
