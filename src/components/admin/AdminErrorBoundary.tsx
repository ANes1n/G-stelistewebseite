"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

type Props = { children: ReactNode; title?: string };
type State = { hasError: boolean; message: string };

export class AdminErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || "Unbekannter Fehler",
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="admin-page glass admin-card mx-auto max-w-lg space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 size-6 text-rose-300" />
            <div>
              <h1 className="font-display text-[22px] font-semibold">
                {this.props.title || "Seite konnte nicht geladen werden"}
              </h1>
              <p className="mt-2 text-[16px] text-[var(--text-muted)]">
                {this.state.message}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="size-5" aria-hidden />
            Erneut versuchen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
