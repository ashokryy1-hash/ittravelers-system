import { useState } from 'react'
import { X, Send, Edit2, Check } from 'lucide-react'

interface Props {
  to: string
  subject: string
  body: string
  onSend: (subject: string, body: string, to: string) => Promise<void>
  onClose: () => void
  sending?: boolean
}

export default function EmailPreviewPanel({ to: initTo, subject: initSubject, body: initBody, onSend, onClose, sending }: Props) {
  const [editing, setEditing] = useState(false)
  const [to, setTo] = useState(initTo)
  const [subject, setSubject] = useState(initSubject)
  const [body, setBody] = useState(initBody)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Email Preview</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Meta */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 space-y-2 text-sm">
          <div className="flex gap-2 items-center">
            <span className="text-gray-500 w-14 shrink-0">To:</span>
            {editing ? (
              <input
                className="flex-1 border border-gray-300 rounded px-2 py-0.5 text-sm"
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="recipient@hotel.com"
              />
            ) : (
              <span className="text-gray-800 font-medium">{to || '(no email)'}</span>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-gray-500 w-14 shrink-0">Subject:</span>
            {editing ? (
              <input
                className="flex-1 border border-gray-300 rounded px-2 py-0.5 text-sm"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            ) : (
              <span className="text-gray-800">{subject}</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {editing ? (
            <textarea
              className="w-full h-64 border border-gray-300 rounded p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-terracotta-400"
              value={body}
              onChange={e => setBody(e.target.value)}
            />
          ) : (
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{body}</pre>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200">
          <button
            onClick={() => setEditing(e => !e)}
            className="flex items-center gap-2 text-sm text-gray-600 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50"
          >
            {editing ? <Check size={15} /> : <Edit2 size={15} />}
            {editing ? 'Done editing' : 'Edit'}
          </button>

          <button
            onClick={() => onSend(subject, body, to)}
            disabled={sending}
            className="flex items-center gap-2 text-sm bg-terracotta-600 text-white rounded-lg px-5 py-2 hover:bg-terracotta-700 disabled:opacity-50"
          >
            <Send size={15} />
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
