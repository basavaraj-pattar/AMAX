import { useState } from 'react'
import { apiRequest } from '../services/api'
import { Flag, X } from 'lucide-react'

const CATEGORIES = [
  { id: 'nudity_sexual', label: 'Nudity or sexually explicit content' },
  { id: 'vulgar_abusive', label: 'Vulgar, abusive, or profanity-laden content' },
  { id: 'harassment_bullying', label: 'Harassment, cyberbullying, or personal attacks' },
  { id: 'hate_speech_threats', label: 'Hate speech, discrimination, or threats' },
  { id: 'illegal_content', label: 'Illegal activities or dangerous content' },
  { id: 'copyright_infringement', label: 'Copyright or intellectual property infringement' },
  { id: 'fraud_scam_impersonation', label: 'Fraud, scam, or impersonation' },
  { id: 'spam', label: 'Spam, unsolicited ads, or repetitive content' },
  { id: 'other', label: 'Other violation' }
]

export default function ReportModal({ contentType, contentId, title = 'Report Content', onClose }) {
  const [category, setCategory] = useState(CATEGORIES[0].id)
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await apiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify({
          contentType,
          contentId,
          category,
          explanation: explanation.trim()
        })
      })
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1800)
    } catch (err) {
      setError(err.message || 'Unable to submit report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="report-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#18181b', border: '1px solid #27272a', borderRadius: '12px',
        maxWidth: 480, width: '100%', padding: '1.5rem', color: '#f4f4f5',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flag size={18} color="#ef4444" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{title}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ color: '#22c55e', fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>
              ✓ Report Submitted Successfully
            </div>
            <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: 0 }}>
              Thank you for keeping A-MAX safe. Our moderation team has received your report.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: '#a1a1aa', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.4 }}>
              Select a reason for reporting this item. Reports are strictly confidential and reviewed by platform administrators.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: '#d4d4d8' }}>
                Reason for report:
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{
                  width: '100%', background: '#09090b', border: '1px solid #3f3f46',
                  color: '#fafafa', borderRadius: 6, padding: '0.55rem 0.75rem', fontSize: '0.85rem'
                }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: '#d4d4d8' }}>
                Additional Details (Optional):
              </label>
              <textarea
                value={explanation}
                onChange={e => setExplanation(e.target.value)}
                placeholder="Describe why this content violates community guidelines..."
                maxLength={2000}
                rows={3}
                style={{
                  width: '100%', background: '#09090b', border: '1px solid #3f3f46',
                  color: '#fafafa', borderRadius: 6, padding: '0.55rem 0.75rem', fontSize: '0.85rem',
                  resize: 'vertical', boxSizing: 'border-box'
                }}
              />
            </div>

            {error && (
              <div style={{ color: '#f87171', fontSize: '0.825rem', marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 0.75rem', borderRadius: 6 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  background: '#27272a', border: 'none', color: '#e4e4e7',
                  padding: '0.5rem 1rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: '#dc2626', border: 'none', color: '#fff',
                  padding: '0.5rem 1.15rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem',
                  fontWeight: 600, opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
