import React from 'react'
import { Lock, AlertTriangle, FileText, Image as ImageIcon, Download } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

export default function MessageBubble({ msg, isMine, senderName }) {
  const time = msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : ''

  const encIcon = msg.encrypted
    ? <Lock className="w-2.5 h-2.5 text-emerald-400" />
    : msg.decryptError
      ? <AlertTriangle className="w-2.5 h-2.5 text-yellow-400" />
      : null

  function renderContent() {
    if (msg.decryptError) {
      return <span className="text-yellow-400/80 text-sm italic">🔒 Could not decrypt</span>
    }

    if (msg.messageType === 'image' && msg.file?.url) {
      return (
        <div className="max-w-xs">
          <img src={msg.file.url} alt={msg.file.fileName} className="rounded-lg max-w-full" loading="lazy" />
          {msg.text && <p className="text-sm mt-1 text-white/90">{msg.text}</p>}
        </div>
      )
    }

    if (msg.messageType === 'document' && msg.file?.url) {
      return (
        <a href={msg.file.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <FileText className="w-5 h-5 text-accent" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{msg.file.fileName || 'File'}</p>
            <p className="text-xs text-surface-200/40">{msg.file.format?.toUpperCase()}</p>
          </div>
          <Download className="w-4 h-4 text-surface-200/40 flex-shrink-0" />
        </a>
      )
    }

    return <p className="text-sm text-white/90 whitespace-pre-wrap break-words">{msg.text}</p>
  }

  return (
    <div className={clsx('flex mb-2 animate-fade-in', isMine ? 'justify-end' : 'justify-start')}>
      <div className={clsx('max-w-[75%]', isMine ? 'items-end' : 'items-start', 'flex flex-col gap-0.5')}>
        {!isMine && (
          <span className="text-xs text-surface-200/40 px-1">{senderName}</span>
        )}
        <div className={clsx(
          'px-3 py-2 rounded-2xl relative',
          isMine
            ? 'bg-accent text-white rounded-br-sm'
            : 'bg-surface-800 text-white rounded-bl-sm',
          msg.decryptError && 'border border-yellow-400/30'
        )}>
          {renderContent()}
        </div>
        <div className={clsx('flex items-center gap-1 px-1', isMine ? 'justify-end' : 'justify-start')}>
          {encIcon}
          <span className="text-[10px] text-surface-200/30">{time}</span>
          {isMine && (
            <span className="text-[10px] text-surface-200/30">
              {msg.seen ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
