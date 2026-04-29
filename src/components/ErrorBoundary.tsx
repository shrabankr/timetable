import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RoutinePro Error Boundary caught:', error, errorInfo);
  }

  handleReset = () => {
    // Clear corrupted localStorage and reload
    const keys = Object.keys(localStorage).filter(k => k.startsWith('timetable_'));
    keys.forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-8">
          <div className="max-w-lg w-full bg-white rounded-3xl border border-zinc-200 shadow-xl p-10 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={28} className="text-rose-500" />
            </div>
            <h1 className="text-2xl font-black text-zinc-900 mb-3">Something went wrong</h1>
            <p className="text-sm text-zinc-500 mb-2">
              RoutinePro encountered an unexpected error. This is usually caused by corrupted saved data.
            </p>
            <code className="block text-xs text-rose-600 bg-rose-50 p-3 rounded-xl mb-8 max-h-24 overflow-auto text-left">
              {this.state.error?.message || 'Unknown error'}
            </code>
            <div className="flex gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 h-12 bg-zinc-100 text-zinc-700 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Retry
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 h-12 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Reset & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
