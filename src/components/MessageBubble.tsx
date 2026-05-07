import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { User, Sparkles, Copy, Check, Image as ImageIcon, FileText, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { messageIn } from '../lib/motion';
import { api } from '../api/client';
import ImageViewer from './ImageViewer';

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, '');

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <pre className={className}>
      <motion.button className="copy-btn" onClick={handleCopy} whileTap={{ scale: 0.9 }}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </motion.button>
      {children}
    </pre>
  );
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const [previewSrc, setPreviewSrc] = useState('');

  // Support both old (fileId/fileType/fileName) and new (attachments[]) formats
  const attachments = message.attachments || [];
  const legacyAttachment = message.fileId
    ? [{ id: message.fileId, mimeType: message.fileType, originalName: message.fileName, size: 0, previewUrl: api.getFilePreviewUrl(message.fileId), downloadUrl: api.getFileDownloadUrl(message.fileId), canPreview: true }]
    : [];

  const allAttachments = attachments.length > 0 ? attachments : legacyAttachment;

  return (
    <>
      <motion.div
        className={`flex gap-2 sm:gap-3 ${isUser ? 'justify-end' : ''}`}
        variants={messageIn}
        initial="hidden"
        animate="visible"
      >
        {!isUser && (
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles size={13} className="text-blue-400" />
          </div>
        )}
        <div className={`max-w-[92%] sm:max-w-[80%] ${isUser ? 'order-first' : ''}`}>
          {/* Attachments shown inline within the message */}
          {allAttachments.length > 0 && (
            <div className="flex flex-col gap-1.5 mb-2">
              {allAttachments.map((att) => {
                const isImage = (att.mimeType || '').startsWith('image/');
                const previewUrl = att.previewUrl || api.getFilePreviewUrl(att.id);
                return (
                  <div key={att.id}>
                    {isImage && (
                      <motion.img
                        src={previewUrl}
                        alt={att.originalName || 'Attachment'}
                        className="img-thumb cursor-pointer max-h-48"
                        onClick={() => setPreviewSrc(previewUrl)}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
                      />
                    )}
                    {!isImage && (
                      <motion.a
                        href={att.downloadUrl || previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 glass-light rounded-xl px-3 py-2 text-sm text-apple-blue2 hover:text-[var(--text)] transition-colors no-underline"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
                      >
                        <FileText size={14} className="shrink-0" />
                        <span className="flex-1 truncate">{att.originalName || 'File'}</span>
                        {att.size > 0 && <span className="text-apple-muted text-xs">{formatSize(att.size)}</span>}
                        <Download size={14} />
                      </motion.a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div
            className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-sm leading-relaxed ${
              isUser
                ? 'bg-blue-600/30 border border-blue-500/20 text-[var(--text-primary)]'
                : 'glass-light text-apple-text'
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            ) : (
              <div className="prose text-sm break-words" style={{ color: 'inherit' }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      if (inline) {
                        return <code className="bg-[var(--active-bg)] px-1 py-0.5 rounded text-sm break-all" style={{ color: 'var(--text)' }} {...props}>{children}</code>;
                      }
                      return <CodeBlock className={className}>{children}</CodeBlock>;
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
        {isUser && (
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--active-bg)] flex items-center justify-center shrink-0 mt-0.5">
            <User size={13} className="text-apple-muted" />
          </div>
        )}
      </motion.div>
      <ImageViewer src={previewSrc} alt="Preview" onClose={() => setPreviewSrc('')} />
    </>
  );
}
