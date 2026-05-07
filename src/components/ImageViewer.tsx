import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ImageViewer({ src, alt, onClose }) {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ transitionDuration: '320ms' }}
        >
          <motion.button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--active-bg)] z-10 backdrop-blur-md"
            whileTap={{ scale: 0.9 }}
          >
            <X size={20} />
          </motion.button>
          <motion.img
            src={src}
            alt={alt || 'Preview'}
            className="max-w-full max-h-full object-contain rounded-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.36, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'none';
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
