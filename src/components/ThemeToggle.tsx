import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? "Yorug' rejimga o'tish" : "Qorong'i rejimga o'tish";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
        compact ? 'w-10 h-10' : 'gap-2 px-3 min-h-[38px] text-xs font-medium'
      }`}
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          {!compact && <span>Yorug&apos; rejim</span>}
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-zinc-500" />
          {!compact && <span>Qorong&apos;i rejim</span>}
        </>
      )}
    </button>
  );
}
