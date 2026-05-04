import React from 'react';
import { AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { Button } from './ui/button';

export class EditorErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('💥 Editor crashed:', error, errorInfo);
    // Here you could send error info to a tracking service
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/ai-tools'; // Adjust based on your routing
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-blue-50/50 rounded-2xl border border-blue-100 m-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-200">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 max-w-md mb-8">
            The editor encountered an unexpected error. Don't worry, your most recent changes are safely auto-saved.
          </p>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 w-full max-w-lg mb-8 text-left overflow-hidden shadow-sm">
            <p className="text-sm font-mono text-red-600 break-words line-clamp-3">
              {this.state.error && this.state.error.toString()}
            </p>
          </div>

          <div className="flex gap-4">
            <Button onClick={this.handleReload} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Reload Editor
            </Button>
            <Button onClick={this.handleGoHome} variant="outline" className="flex items-center gap-2 bg-white">
              <FileText className="w-4 h-4" />
              Return to Documents
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
