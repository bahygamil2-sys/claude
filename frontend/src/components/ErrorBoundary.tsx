import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Static bilingual fallback (no i18n/store dependency): the one screen that
// must render even if the crash originated in a provider this tree relies on.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <div>
          <p className="text-lg font-semibold text-neutral-900">Something went wrong · حدث خطأ ما</p>
          <p className="mt-1 text-sm text-neutral-500">
            Please reload the page. · من فضلك أعد تحميل الصفحة.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Reload · إعادة تحميل
        </button>
      </div>
    );
  }
}
