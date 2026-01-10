"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { creditsApi, type CreditTransaction } from "@/lib/credits";
import { Coins, Clock, TrendingDown, TrendingUp, RefreshCw, Gift, CreditCard } from "lucide-react";
import Link from "next/link";

export default function Credits() {
  const credits = useSelector((state: RootState) => state.credits.credits);
  const limit = useSelector((state: RootState) => state.credits.limit);
  const planType = useSelector((state: RootState) => state.credits.planType);
  const canRender = useSelector((state: RootState) => state.credits.canRender);
  
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await creditsApi.getHistory();
        setHistory(data);
      } catch (error) {
        console.error("Failed to fetch credit history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, []);

  const percentage = limit && credits !== undefined ? (credits / limit) * 100 : 0;
  const isLow = percentage < 20;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      case "RENDER":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case "REFUND":
        return <RefreshCw className="w-4 h-4 text-green-500" />;
      case "BONUS":
        return <Gift className="w-4 h-4 text-purple-500" />;
      case "SUBSCRIPTION":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      default:
        return <Coins className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Credits</h1>
        <p className="text-muted-foreground">
          Manage your rendering credits and view transaction history
        </p>
      </div>

      {/* Credits Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Current Credits Card */}
        <div className="col-span-1 md:col-span-2 bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Available Credits</h2>
            </div>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                planType === "PRO"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                  : planType === "BASIC"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {planType} Plan
            </span>
          </div>

          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-bold ${isLow ? "text-red-500" : ""}`}>
                {credits ?? 0}
              </span>
              <span className="text-2xl text-muted-foreground">/ {limit ?? 0}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {canRender
                ? "You have credits available for rendering"
                : "No credits available - please upgrade or purchase more"}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all ${
                isLow
                  ? "bg-red-500"
                  : percentage < 50
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          {isLow && planType === "FREE" && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Running low on credits! Upgrade your plan to get more credits.
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions Card */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href="/pricing"
              className="block w-full px-4 py-2 text-center text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Upgrade Plan
            </Link>
            <Link
              href="/templates"
              className="block w-full px-4 py-2 text-center text-sm font-medium rounded-lg border border-border hover:bg-accent transition-colors"
            >
              Browse Templates
            </Link>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Transaction History</h2>
        </div>

        {isLoadingHistory ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-border">
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="w-48 h-4 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
                  <div className="w-32 h-3 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
                </div>
                <div className="w-16 h-4 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <Coins className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No transaction history yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start rendering videos to see your credit usage here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Description
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-border last:border-0">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.type)}
                        <span className="text-sm font-medium">{transaction.type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-sm text-muted-foreground">
                        {transaction.description}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span
                        className={`text-sm font-semibold ${
                          transaction.amount > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plan Information */}
      <div className="mt-8 bg-muted/50 border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">About Credits</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Credits are used when you render videos from templates</li>
          <li>• Each video render costs 1 credit</li>
          <li>• Credits reset monthly based on your subscription plan</li>
          <li>• Upgrade your plan to get more credits per month</li>
          <li>• Failed renders will automatically refund your credits</li>
        </ul>
      </div>
    </div>
  );
}
