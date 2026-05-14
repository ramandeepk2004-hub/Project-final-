import React from 'react';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'Unexpected app error',
    };
  }

  componentDidCatch(error: Error) {
    // Keep a lightweight log for Android WebView troubleshooting.
    // eslint-disable-next-line no-console
    console.error('AppErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-bg px-6 text-center">
          <div className="max-w-md rounded-2xl border border-red-500/25 bg-red-500/10 p-5 text-red-200">
            <p className="mb-2 text-lg font-semibold">Something went wrong</p>
            <p className="text-sm opacity-90 break-words">{this.state.message}</p>
            <button
              className="mt-4 rounded-lg border border-red-400/40 px-4 py-2 text-sm"
              onClick={() => window.location.reload()}
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

