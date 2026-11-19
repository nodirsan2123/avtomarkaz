import { NavTab } from '../types/car';
import { ThemeToggle } from './ThemeToggle';

interface FooterProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenCreate: () => void;
  totalCount: number;
  isAdmin: boolean;
}

export function Footer({ onSelectTab, onOpenCreate, totalCount, isAdmin }: FooterProps) {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="font-display text-lg font-bold text-zinc-950 dark:text-zinc-50">
            AvtoMarkaz
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            O&apos;zbekiston avtomobil e&apos;lonlari platformasi · Katalogda{' '}
            <span className="font-mono-num">{totalCount}</span> ta avtomobil
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <button
            type="button"
            onClick={() => onSelectTab('all')}
            className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            Barcha e&apos;lonlar
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('new')}
            className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            Yangi avtomobillar
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('saved')}
            className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            Saqlanganlar
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => onSelectTab('admin')}
              className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            >
              Admin
            </button>
          )}
          <button
            type="button"
            onClick={onOpenCreate}
            className="text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors cursor-pointer"
          >
            E&apos;lon joylash
          </button>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
