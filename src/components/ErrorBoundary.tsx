import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackLabel?: string;
}

interface State {
  hasError: boolean;
  error: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: '' };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, error: err.message || String(err) };
  }

  componentDidCatch(err: Error) {
    console.error('[ErrorBoundary]', err);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel p-6 text-center space-y-3">
          <AlertTriangle size={28} className="mx-auto text-red-400" />
          <h3 className="text-sm font-medium text-[var(--text)]">
            {this.props.fallbackLabel || 'Component crashed'}
          </h3>
          <p className="text-xs text-apple-muted break-all max-h-32 overflow-y-auto">
            {this.state.error}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: '' })}
            className="btn-secondary btn-sm"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
