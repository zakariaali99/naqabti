import { Component, ReactNode } from "react";
import { Button } from "@heroui/react";
import { FiRefreshCw, FiHome } from "react-icons/fi";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="text-6xl font-bold text-danger">!</div>
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-default-600">
              A runtime error prevented this page from loading. Please try
              refreshing or return to the dashboard.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left text-xs bg-default-100 p-4 rounded-lg overflow-auto max-h-48">
                {this.state.error.stack || this.state.error.message}
              </pre>
            )}
            <div className="flex justify-center gap-3">
              <Button
                color="primary"
                startContent={<FiRefreshCw />}
                onPress={this.handleReload}
              >
                Refresh Page
              </Button>
              <Button
                variant="flat"
                startContent={<FiHome />}
                onPress={this.handleGoHome}
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
