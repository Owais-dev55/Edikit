import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { UserService } from 'src/modules/user/user.service';
import { PlanType } from '@generated/prisma/enums';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly userService: UserService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-12-15.clover',
    });
  }

  async payment(
    amount: number,
    productName: string,
    currency: string = 'usd',
    userId: string,
  ) {
    const user = await this.userService.findOne(userId);
    let customerId = user?.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.fullName,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: productName,
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId,
        planName: productName,
      },
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
    });

    return { url: session.url, sessionId: session.id };
  }

  async verifySession(sessionId: string) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'customer', 'subscription'],
      });

      if (session.payment_status !== 'paid') {
        throw new Error('Payment not completed');
      }

      const lineItems = session.line_items?.data[0];
      const subscription = session.subscription as any;
      const userId = session.metadata?.userId;

      let planType: PlanType = PlanType.FREE;
      const planName = session.metadata?.planName || '';

      if (planName.includes('Basic')) {
        planType = PlanType.BASIC;
      } else if (planName.includes('Pro')) {
        planType = PlanType.PRO;
      }

      if (userId) {
        const updated = await this.userService.updateSubscription(userId, {
          planType,
          stripeCustomerId:
            typeof session.customer === 'string'
              ? session.customer
              : session.customer?.id,
          stripeSubscriptionId: subscription?.id,
          stripePriceId: subscription?.items?.data?.[0]?.price?.id,
          stripeCurrentPeriodEnd: subscription?.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : undefined,
        });
      }

      return {
        success: true,
        sessionId: session.id,
        customerId: session.customer,
        subscriptionId: subscription?.id,
        planName: lineItems?.description || 'Unknown Plan',
        amount: `$${(session.amount_total! / 100).toFixed(2)}`,
        currency: session.currency?.toUpperCase(),
        status: session.status,
        paymentStatus: session.payment_status,
      };
    } catch (error) {
      console.error('Error verifying session:', error);
      throw error;
    }
  }
}
