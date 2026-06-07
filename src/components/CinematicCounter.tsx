import { motion, AnimatePresence } from 'framer-motion';

interface CinematicCounterProps {
  value: string | number;
  className?: string;
}

export default function CinematicCounter({ value, className = "" }: CinematicCounterProps) {
  return (
    <div className={`inline-flex overflow-hidden relative h-[1.2em] vertical-align-middle ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value} // 核心：数据一变，旧数据丝滑向上淡出，新数据从下方推入
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
          className="font-mono"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
