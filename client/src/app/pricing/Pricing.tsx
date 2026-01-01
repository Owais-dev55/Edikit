"use client";
import { Check } from "lucide-react";
import { handlePayment } from "@/lib/payment";
import { plans } from "@/utils/constant";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const Pricing = () => {
  const user = useSelector((state: RootState) => state.user.user);
  return (
    <div className="min-h-screen bg-background">
      <main>
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold text-balance text-foreground">
                Choose the perfect plan for you
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground text-pretty">
                Start free and scale as you grow. All plans include our core
                features with no hidden fees.
              </p>
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`p-8 rounded-lg border bg-card relative ${
                    plan.popular
                      ? "border-primary shadow-lg shadow-primary/10 scale-105"
                      : "border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      Most Popular
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Plan Header */}
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-foreground">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground">
                        /{plan.period}
                      </span>
                    </div>

                    {/* CTA Button */}
                    {(() => {
                      const isCurrentPlan:boolean | null | undefined =
                        user && user.planType === plan.planType;

                      return (
                        <button
                          disabled={isCurrentPlan ?? undefined}
                          onClick={() => {
                            if (isCurrentPlan) return;
                            handlePayment(plan.id, user?.userId || user?.id);
                          }}
                          className={`w-full px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer focus:bg-primary/50 disabled:opacity-60 disabled:cursor-not-allowed ${
                            plan.popular
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "bg-secondary text-secondary-foreground hover:bg-primary/80"
                          }`}
                        >
                          {isCurrentPlan ? "Current Plan" : plan.cta}
                        </button>
                      );
                    })()}
                    {/* Features List */}
                    <div className="pt-6 border-t border-border">
                      <ul className="space-y-3">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <span className="text-sm text-foreground">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Pricing;
