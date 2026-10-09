"use client";

import { AlertCircle, WifiOff, MapPin, Search } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 py-16 ${className}`}
      role="status"
    >
      {icon && (
        <div className="mb-4 text-[#d99b32] opacity-70 animate-pulse-soft">
          {icon}
        </div>
      )}
      <h3 className="font-display text-xl text-[#211A1B] mb-2">{title}</h3>
      {description && (
        <p className="text-[#7a6465] text-sm max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function NoPlanEmptyState({ onStart }: { onStart?: () => void }) {
  return (
    <EmptyState
      icon={<MapPin size={48} />}
      title="No plans yet."
      description="Your next Pujo adventure starts here. Build a personalized itinerary based on where you are and how much time you have."
      action={
        onStart ? (
          <button onClick={onStart} className="btn btn-primary">
            Plan My Pujo
          </button>
        ) : (
          <a href="/plan" className="btn btn-primary">
            Plan My Pujo
          </a>
        )
      }
    />
  );
}

export function NoResultsEmptyState({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={<Search size={40} />}
      title="Nothing found."
      description={
        query
          ? `No pandals found for "${query}". Try a different search or browse all locations.`
          : "No pandals match your filters. Try adjusting your preferences."
      }
      action={
        <a href="/discover" className="btn btn-secondary">
          Browse All Pandals
        </a>
      }
    />
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={<AlertCircle size={40} />}
      title="Something went wrong."
      description={
        message ||
        "An unexpected error occurred. Your data is safe — please try again."
      }
      action={
        onRetry ? (
          <button onClick={onRetry} className="btn btn-secondary">
            Try Again
          </button>
        ) : undefined
      }
    />
  );
}

export function OfflineState() {
  return (
    <EmptyState
      icon={<WifiOff size={40} />}
      title="You appear to be offline."
      description="Cholo Bondhu works best with a connection, but your saved plans are still available."
      action={
        <a href="/saved" className="btn btn-secondary">
          View Saved Plans
        </a>
      }
    />
  );
}
