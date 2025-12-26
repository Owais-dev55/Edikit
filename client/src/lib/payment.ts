import { baseUrl } from "@/utils/constant";
import axios from "axios";

const pricingPlans: Record<string, { 
  amount: number; 
  productName: string; 
  interval: 'month';
  currency: string;
}> = {
  'prod_TffitWtEKT88s6': { 
    amount: 0, 
    productName: 'Free Plan', 
    interval: 'month',
    currency: 'usd'
  },
  'prod_Tffkh0QPN6G92B': { 
    amount: 5.99, 
    productName: 'Basic Plan', 
    interval: 'month',
    currency: 'usd'
  },
  'prod_TffnEJPkjRMHpY': { 
    amount: 39.99, 
    productName: 'Pro Plan', 
    interval: 'month',
    currency: 'usd'
  },
};

export const handlePayment = (planId: string) => {
  const plan = pricingPlans[planId];
  
  if (!plan) {
    console.error(`Invalid plan ID: ${planId}`);
    return;
  }

  axios.post(`${baseUrl}/stripe/create-checkout-session`, {
    amount: plan.amount,
    productName: plan.productName,
    currency: plan.currency,
    interval: plan.interval
  })
  .then((response) => {
    if (response.data.url) {
      window.location.href = response.data.url;
    }
  })
  .catch((error) => {
    console.error("Error creating checkout session:", error);
  });
};