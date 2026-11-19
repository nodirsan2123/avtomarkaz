import { Menu, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { NavTab } from '../types/car';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCreate: () => void;
  savedCount: number;
  myListingsCount: number;
  isAdmin: boolean;
}

export function Header({
  activeTab,
  onSelectTab,
  onOpenCreate,
  savedCount,
  myListingsCount,
  isAdmin,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string }[] = [
    { id: 'all', label: 'Barchasi' },
    { id: 'new', label: 'Yangi' },
    {
      id: 'saved',
      label: savedCount > 0 ? `Saqlanganlar (${savedCount})` : 'Saqlanganlar',
    },
    {
      id: 'mine',
      label: myListingsCount > 0 ? `E'lonlarim (${myListingsCount})` : "Mening e'lonlarim",
    },
    ...(isAdmin ? [{ id: 'admin' as NavTab, label: 'Admin' }] : []),
  ];

  const handleNav = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element brand wordmark */}
        <button
          type="button"
          onClick={() => handleNav('all')}
          className="font-display text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded"
        >
          AvtoMarkaz
        </button>

        {/* Zone 2: 4–5 concise single-line nav links */}
        <nav
          aria-label="Asosiy navigatsiya"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                  isActive
                    ? 'text-zinc-950 dark:text-white border-blue-700 dark:border-blue-500'
                    : 'text-zinc-600 dark:text-zinc-400 border-transparent hover:text-zinc-950 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
          >
            <Plus className="w-4 h-4" />
            <span>E&apos;lon joylash</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Menyu"
            className="md:hidden p-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-zinc-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 mt-1 border-t border-zinc-200 dark:border-zinc-800">
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
