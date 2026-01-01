import { showErrorToast } from "@/components/Toast/showToast";
import { baseUrl } from "@/utils/constant";
import axios from "axios";
import { refreshUser } from "./auth";
import type { AppDispatch } from "@/redux/store";

const pricingPlans: Record<
  string,
  {
    amount: number;
    productName: string;
    interval: "month";
    currency: string;
  }
> = {
  prod_TffitWtEKT88s6: {
    amount: 0,
    productName: "Free Plan",
    interval: "month",
    currency: "usd",
  },
  prod_Tffkh0QPN6G92B: {
    amount: 5.99,
    productName: "Basic Plan",
    interval: "month",
    currency: "usd",
  },
  prod_TffnEJPkjRMHpY: {
    amount: 39.99,
    productName: "Pro Plan",
    interval: "month",
    currency: "usd",
  },
};

export const handlePayment = (planId: string, userId?: string) => {
  const plan = pricingPlans[planId];

  if (planId === "prod_TffitWtEKT88s6") {
    console.log("Selected Free Plan. No payment required.");
    return;
  }

  if (!plan) {
    console.log(`Invalid plan ID: ${planId}`);
    return;
  }

  if (!userId) {
    console.log("User not logged in");
    showErrorToast("Please log in to proceed with the payment.");
    return;
  }

  axios
    .post(`${baseUrl}/stripe/create-checkout-session`, {
      amount: plan.amount,
      productName: plan.productName,
      currency: plan.currency,
      interval: plan.interval,
      userId: userId,
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

  export const cancelSubscription = async (
    userId: string,
    dispatch?: AppDispatch,
  ) => {
    if (!userId) {
      showErrorToast("User not logged in");
      return;
    }

    try {
      await axios.post(`${baseUrl}/stripe/cancel-subscription`, { userId });
      if (dispatch) {
        await refreshUser(dispatch);
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      showErrorToast("Could not cancel subscription. Please try again.");
      throw error;
    }
  };
