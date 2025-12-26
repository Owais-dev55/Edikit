import { Injectable } from "@nestjs/common";
import Stripe from "stripe";

@Injectable()
export class StripeService {
    private stripe: Stripe;

    constructor() {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { 
            apiVersion: "2025-12-15.clover" 
        });
    }

    async payment(amount: number, productName: string, currency: string = 'usd') {
        const session = await this.stripe.checkout.sessions.create({
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
            success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url:`${process.env.FRONTEND_URL}/payment/cancel`,
        });
        
        return { url: session.url, sessionId: session.id };
    }

    async verifySession(sessionId: string) {
        try {
            const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
                expand: ['line_items', 'customer', 'subscription']
            });

            // Check if payment was successful
            if (session.payment_status !== 'paid') {
                throw new Error('Payment not completed');
            }

            // Extract relevant information
            const lineItems = session.line_items?.data[0];
            const subscription = session.subscription as Stripe.Subscription;

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