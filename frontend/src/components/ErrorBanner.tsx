"use client";

import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  variant?: "danger" | "warning";
}

/**
 * User-friendly error banner for displaying service interruptions.
 * Supports specialized variants for circuit breaker events.
 */
export default function ErrorBanner({ 
  message, 
  onRetry, 
  variant = "danger" 
}: ErrorBannerProps) {
  const isWarning = variant === "warning";

  return (
    <div 
      className={`alert-banner ${isWarning ? "alert-warning" : "alert-danger"}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-md)",
        padding: "var(--space-2xl)",
        gridColumn: "1 / -1",
        backgroundColor: isWarning ? "rgba(241, 196, 15, 0.05)" : "rgba(229, 9, 20, 0.05)",
        borderColor: isWarning ? "rgba(241, 196, 15, 0.1)" : "rgba(229, 9, 20, 0.1)",
        color: isWarning ? "#f1c40f" : "var(--accent-primary)",
      }}
      role="alert"
    >
      <FiAlertCircle size={40} />
      <div style={{ textAlign: "center" }}>
        <h3 style={{ marginBottom: "var(--space-xs)", color: "var(--text-primary)" }}>
          {isWarning ? "Service is busy" : "Connection Issue"}
        </h3>
        <p className="text-muted" style={{ maxWidth: "400px", fontSize: "0.95rem" }}>
          {message}
        </p>
      </div>
      
      {onRetry && (
        <button 
          type="button"
          onClick={onRetry}
          className={`btn ${isWarning ? "btn-secondary" : "btn-primary"}`}
          style={{ marginTop: "var(--space-md)" }}
        >
          <FiRefreshCw /> Try Again
        </button>
      )}
    </div>
  );
}
