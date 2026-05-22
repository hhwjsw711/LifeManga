import { StrictMode, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import "./index.css";
import App from "./App.tsx";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 bg-cream dark:bg-ink">
          <p className="text-lg font-medium text-ink dark:text-cream-light">
            出错了
          </p>
          <p className="text-sm text-ink-muted">请刷新页面重试</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-ember text-cream-light rounded-pill hover:bg-ember-dark transition-colors"
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");
createRoot(rootEl).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ConvexAuthProvider>
  </StrictMode>,
);
