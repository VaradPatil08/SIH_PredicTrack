import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-black font-sans text-white">
          <div className="max-w-md w-full bg-[#111111] border border-[#B22222] border-t-2 border-t-[#B22222] p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#B22222] font-sora font-bold text-xs uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>[ UI_RENDER_EXCEPTION // SAFE_MODE_ACTIVE ]</span>
            </div>
            
            <p className="text-xs text-white/80 font-sans leading-relaxed">
              An unexpected render error occurred in this view. Telemetry state has been secured.
            </p>

            {this.state.error && (
              <div className="p-2.5 bg-black border border-white/10 text-[11px] font-mono text-white/60 break-words">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-2 bg-black border border-white/20 hover:bg-[#FFB300] hover:text-black hover:border-[#FFB300] text-white font-sora font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>RELOAD_VIEW</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
