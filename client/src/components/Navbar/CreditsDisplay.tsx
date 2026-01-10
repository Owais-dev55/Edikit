"use client";

import { Coins } from "lucide-react";
import Link from "next/link";
import { useCredits } from "@/hooks/useCredits";

export default function CreditsDisplay() {
  const { credits, limit, planType, isLoading } = useCredits();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/50">
        <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
        <div className="w-12 h-4 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
      </div>
    );
  }

  if (credits === undefined) {
    return null;
  }

  const percentage = limit ? (credits / limit) * 100 : 0;
  const isLow = percentage < 20;
  const isMedium = percentage >= 20 && percentage < 50;

  return (
    <Link
      href="/credits"
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/80 transition-colors border border-border group"
      title={`${credits} of ${limit} credits remaining`}
    >
      <Coins
        size={16}
        className={`${
          isLow
            ? "text-red-500"
            : isMedium
            ? "text-yellow-500"
            : "text-green-500"
        }`}
      />
      <span className="text-sm font-medium">
        <span className={isLow ? "text-red-500" : ""}>{credits}</span>
        <span className="text-muted-foreground">/{limit}</span>
      </span>
      {planType && (
        <span className="hidden sm:inline-block text-xs text-muted-foreground">
          {planType}
        </span>
      )}
    </Link>
  );
}
