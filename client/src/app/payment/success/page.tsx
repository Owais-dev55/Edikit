'use client'
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import Loader from "@/components/Overlay/Loader";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Component that uses useSearchParams
function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const plan = searchParams.get('plan');
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    // Handle free plan
    if (plan === 'free') {
      setSessionData({
        planName: 'Free Plan',
        amount: '$0.00',
        success: true
      });
      setLoading(false);
      return;
    }

    // Handle paid plans
    if (sessionId) {
      verifySession(sessionId);
    } else {
      setLoading(false);
    }
  }, [sessionId, plan]);

  const verifySession = async (sessionId: string) => {
  
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/stripe/verify-session?session_id=${sessionId}`;
    
    const response = await fetch(url);
      
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
   
    setSessionData(data);
  } catch (error) {
    console.error('Error verifying session:', error);
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-card px-4">
      <div className="w-full max-w-md">
        {/* Success Card */}
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl" />
          <div className="relative bg-card border border-border rounded-2xl p-8 shadow-lg">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative w-20 h-20 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center space-y-3 mb-8">
              <h1 className="text-3xl font-bold text-foreground">Payment Successful!</h1>
              <p className="text-muted-foreground text-base">
                Thank you for your purchase. Your order has been confirmed
              </p>

              {/* Display plan details */}
              {sessionData && (
                <div className="bg-muted/50 rounded-lg p-4 mt-4 space-y-2">
                  <p className="text-sm text-muted-foreground">Your Plan</p>
                  <p className="text-lg font-semibold text-foreground">{sessionData.planName}</p>
                  <p className="text-2xl font-bold text-foreground">{sessionData.amount}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href="/" className="w-full block">
                <button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer">
                  Back to Home
                </button>
              </Link>
              <Link href="/templates" className="w-full block">
                <button className="w-full bg-transparent border border-border text-foreground hover:bg-muted py-2 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer">
                  Browse Templates
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense
export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex justify-center items-center">
        <Loader />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}