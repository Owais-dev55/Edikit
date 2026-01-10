import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { UserService } from 'src/modules/user/user.service';
import { PlanType } from '@generated/prisma/enums';
import { CreditsService } from 'src/modules/credits/credits.service';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private readonly userService: UserService,
    private readonly creditsService: CreditsService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-12-15.clover', // Fixed API version
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
        await this.userService.updateSubscription(userId, {
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
        try {
          await this.creditsService.upgradeSubscription(userId, planType);
          console.log(`✅ Credits upgraded for user ${userId} to ${planType}`);
        } catch (error) {
          console.error(`Failed to upgrade credits:`, error);
        }
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

  /**
   * WEBHOOK HANDLER
   *
   * This method processes webhook events from Stripe.
   * Webhooks are HTTP POST requests that Stripe sends to your server
   * when important events happen (subscription cancelled, payment failed, etc.)
   */
  async handleWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    // STEP 1: VERIFY THE SIGNATURE
    // This ensures the webhook actually came from Stripe and wasn't forged
    // Think of it like a digital signature on a letter - proves it's authentic
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody, // The raw request body (Buffer)
        signature, // The signature from the stripe-signature header
        webhookSecret, // Your webhook secret from Stripe dashboard
      );
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    console.log('✅ Webhook verified:', event.type);

    // STEP 2: HANDLE DIFFERENT EVENT TYPES
    // Stripe sends different events for different actions
    // We need to handle each type appropriately

    try {
      switch (event.type) {
        // EVENT 1: Subscription was created (new subscriber)
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;

        // EVENT 2: Subscription was updated (plan change, renewal)
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        // EVENT 3: Subscription was deleted/cancelled
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        // EVENT 4: Invoice payment succeeded (monthly renewal worked)
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;

        // EVENT 5: Invoice payment failed (credit card declined)
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  /**
   * HANDLE SUBSCRIPTION CREATED
   * Called when a new subscription is created
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    console.log('🆕 Subscription created:', subscription.id);

    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id; // FIX: Handle customer object properly

    if (!customerId) {
      console.error('No customer ID found in subscription');
      return;
    }

    const user = await this.userService.findByStripeCustomerId(customerId);

    if (!user) {
      console.error('User not found for customer:', customerId);
      return;
    }

    const planType = this.determinePlanType(subscription);
    const sub = subscription as any;

    await this.userService.updateSubscription(user.id, {
      planType,
      stripeCustomerId: customerId, // FIX: Pass the extracted customerId
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000) // FIX: Check if exists
        : undefined,
    });

    try {
      await this.creditsService.upgradeSubscription(user.id, planType);
      console.log(`✅ Credits upgraded for user ${user.email} to ${planType}`);
    } catch (error) {
      console.error(`Failed to upgrade credits:`, error);
    }

    console.log(`✅ User ${user.email} subscribed to ${planType}`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    console.log('🔄 Subscription updated:', subscription.id);

    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id; // FIX: Handle customer object properly

    if (!customerId) {
      console.error('No customer ID found in subscription');
      return;
    }

    const user = await this.userService.findByStripeCustomerId(customerId);

    if (!user) {
      console.error('User not found for customer:', customerId);
      return;
    }

    const planType = this.determinePlanType(subscription);
    const sub = subscription as any;

    await this.userService.updateSubscription(user.id, {
      planType,
      stripeCustomerId: customerId, // FIX: Pass the extracted customerId
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000) // FIX: Check if exists
        : undefined,
    });

    try {
      await this.creditsService.upgradeSubscription(user.id, planType);
      console.log(`✅ Credits upgraded for user ${user.email} to ${planType}`);
    } catch (error) {
      console.error(`Failed to upgrade credits:`, error);
    }

    console.log(`✅ User ${user.email} subscription updated to ${planType}`);
  }

  /**
   * HANDLE SUBSCRIPTION DELETED
   * Called when subscription is cancelled
   * Downgrade user back to FREE plan
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    console.log('❌ Subscription cancelled:', subscription.id);

    const customerId = subscription.customer as string;
    const user = await this.userService.findByStripeCustomerId(customerId);

    if (!user) {
      console.error('User not found for customer:', customerId);
      return;
    }

    // Downgrade to FREE plan
    await this.userService.updateSubscription(user.id, {
      planType: PlanType.FREE,
      stripeSubscriptionId: undefined,
      stripePriceId: undefined,
      stripeCurrentPeriodEnd: undefined,
    });

    try {
      await this.creditsService.upgradeSubscription(user.id, PlanType.FREE);
      console.log(`✅ Credits downgraded for user ${user.email} to FREE`);
    } catch (error) {
      console.error(`Failed to downgrade credits:`, error);
    }

    console.log(`✅ User ${user.email} downgraded to FREE`);
  }

  /**
   * HANDLE INVOICE PAYMENT SUCCEEDED
   * Called when monthly payment goes through successfully
   */
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    console.log('💰 Payment succeeded for invoice:', invoice.id);

    const customerId = invoice.customer as string;
    const user = await this.userService.findByStripeCustomerId(customerId);

    if (!user) {
      console.error('User not found for customer:', customerId);
      return;
    }

    // You could send a "payment received" email here
    console.log(`✅ Payment successful for user ${user.email}`);
  }

  /**
   * HANDLE INVOICE PAYMENT FAILED
   * Called when monthly payment fails (card declined, etc.)
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    console.log('⚠️ Payment failed for invoice:', invoice.id);

    const customerId = invoice.customer as string;
    const user = await this.userService.findByStripeCustomerId(customerId);

    if (!user) {
      console.error('User not found for customer:', customerId);
      return;
    }

    // You could:
    // 1. Send an email notification
    // 2. Temporarily restrict access
    // 3. Give grace period before downgrading

    console.log(`⚠️ Payment failed for user ${user.email}`);
    // For now, just log it. Stripe will retry automatically.
  }

  /**
   * HELPER: Determine plan type from subscription
   * Looks at the price to figure out if it's BASIC or PRO
   */
  private determinePlanType(subscription: Stripe.Subscription): PlanType {
    const price = subscription.items.data[0].price;
    const amount = price.unit_amount || 0;

    // Convert cents to dollars
    const dollars = amount / 100;

    // Match based on amount
    if (dollars >= 30) {
      return PlanType.PRO; // $39.99 or higher = PRO
    } else if (dollars >= 5) {
      return PlanType.BASIC; // $5.99-$29.99 = BASIC
    } else {
      return PlanType.FREE; // $0 = FREE
    }
  }

  async cancelSubscription(userId: string) {
    const user = await this.userService.findOne(userId);
    if (!user.stripeSubscriptionId) {
      throw new Error('No active subscription to cancel');
    }

    // Cancel the Stripe subscription
    await this.stripe.subscriptions.cancel(user.stripeSubscriptionId);

    // Reset user subscription fields and downgrade to FREE
    await this.userService.updateSubscription(userId, {
      planType: PlanType.FREE,
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
    });

    try {
      await this.creditsService.upgradeSubscription(userId, PlanType.FREE);
      console.log(`✅ Credits downgraded for user ${userId} to FREE`);
    } catch (error) {
      console.error(`Failed to downgrade credits:`, error);
    }

    return { success: true };
  }
}
