'use client';

import { useTheme } from './Providers';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg border border-border bg-card/50 hover:bg-muted text-foreground transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
      aria-label="Toggle theme mode"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 180 : 0, scale: [0.8, 1.1, 1] }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-amber-400 fill-amber-400/20" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-600 fill-indigo-600/10" />
        )}
      </motion.div>
    </button>
  );
}
