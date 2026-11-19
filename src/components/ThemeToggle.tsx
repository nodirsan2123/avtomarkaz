import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Yorug' rejimga o'tish" : "Qorong'i rejimga o'tish"}
      className="inline-flex items-center gap-2 px-3 min-h-[38px] text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Yorug&apos; rejim</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-zinc-500" />
          <span>Qorong&apos;i rejim</span>
        </>
      )}
    </button>
  );
}
