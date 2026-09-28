import React from "react";
import {
  isStaleChunkError,
  reloadOnceForStaleChunk,
} from "../utils/lazyWithRetry";

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (isStaleChunkError(error)) {
      reloadOnceForStaleChunk();
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex h-full min-h-dvh flex-col items-center justify-center bg-white px-6 text-center">
        <p className="text-base font-semibold text-neutral-900">
          Couldn’t load this page
        </p>
        <button
          type="button"
          className="mt-4 text-sm font-semibold text-neutral-700 underline"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </div>
    );
  }
}
