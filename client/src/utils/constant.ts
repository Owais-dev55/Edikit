export const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out Edikit",
    features: [
      "3 video renders per month",
      "720p resolution",
      ".mp4 format",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Basic",
    price: "$5.99",
    period: "per month",
    description: "For professionals and content creators",
    features: [
      "50 video renders per month",
      "1080p HD resolution",
      ".mp4 and .mov formats",
      "with transparent background",
    ],
    cta: "Select Plan",
    popular: true,
  },
  {
    name: "Pro",
    price: "$39.99",
    period: "per month",
    description: "For teams and agencies",
    features: [
      "500 video renders per month",
      "4K resolution",
      ".mp4 and .mov formats",
      "with transparent background",
    ],
    cta: "Select Plan",
    popular: false,
  },
]

export const faqs = [
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, MasterCard, American Express) and PayPal for your convenience.",
  },
  {
    question: "Do you offer refunds?",
    answer: "Yes, we offer a 14-day money-back guarantee. If you're not satisfied, contact us for a full refund.",
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer: "You can change your plan at any time. Changes will be prorated on your next billing cycle.",
  },
]