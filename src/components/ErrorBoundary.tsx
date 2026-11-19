import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let parsedMessage = error.message || "Kutilmagan xatolik yuz berdi.";
    try {
      const json = JSON.parse(error.message);
      if (json && typeof json.error === 'string') {
        parsedMessage = json.error;
      }
    } catch {
      // Plain error message
    }
    return { hasError: true, message: parsedMessage };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8">
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50 mb-2">
              Xatolik yuz berdi
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
              Ma&apos;lumotlarni yuklash yoki saqlash jarayonida muammo yuzaga keldi.
              Sahifani qayta yuklab ko&apos;ring.
            </p>
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-xs text-zinc-600 dark:text-zinc-400 font-mono mb-6 break-words">
              {this.state.message}
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Sahifani yangilash
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
