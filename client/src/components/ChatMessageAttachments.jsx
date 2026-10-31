import { useEffect, useState } from 'react'
import { FileText, Image as ImageIcon, LoaderCircle, Video } from 'lucide-react'
import { apiDownload } from '../services/api'

function fileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ChatMessageAttachments({ attachments = [] }) {
  const key = attachments.map(attachment => attachment.id).join('|')
  const [files, setFiles] = useState({})

  useEffect(() => {
    let active = true
    const urls = []
    setFiles({})
    Promise.all(attachments.map(async attachment => {
      try {
        const blob = await apiDownload(`/messages/attachments/${encodeURIComponent(attachment.id)}`)
        const url = URL.createObjectURL(blob)
        if (!active) {
          URL.revokeObjectURL(url)
          return [attachment.id, '']
        }
        urls.push(url)
        return [attachment.id, url]
      } catch {
        return [attachment.id, '']
      }
    })).then(entries => { if (active) setFiles(Object.fromEntries(entries)) })
    return () => {
      active = false
      urls.forEach(url => URL.revokeObjectURL(url))
    }
  // The id list keeps object URLs stable while message contents update.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (!attachments.length) return null
  return <div className="chat-message-attachments">
    {attachments.map(attachment => {
      const url = files[attachment.id]
      if (url === undefined) return <span className="chat-message-file-loading" key={attachment.id}><LoaderCircle size={13} className="message-spinner"/> Loading {attachment.name}…</span>
      if (!url) return <span className="chat-message-file-unavailable" key={attachment.id}>{attachment.name} is unavailable</span>
      if (attachment.kind === 'image') return <a className="chat-message-image" href={url} target="_blank" rel="noreferrer" key={attachment.id} aria-label={`Open image ${attachment.name}`}><img src={url} alt={attachment.name} loading="lazy"/></a>
      if (attachment.kind === 'video') return <video className="chat-message-video" src={url} controls preload="metadata" key={attachment.id} aria-label={attachment.name}/>
      return <a className="chat-message-document" href={url} download={attachment.name} key={attachment.id}><FileText size={16}/><span><strong>{attachment.name}</strong><small>{fileSize(attachment.size)}</small></span></a>
    })}
  </div>
}
