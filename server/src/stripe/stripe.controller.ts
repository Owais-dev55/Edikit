import {
  Controller,
  Post,
  Body,
  Get,
  BadRequestException,
  Query,
  Headers,
  Req,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import type { RawBodyRequest } from '@nestjs/common';
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-checkout-session')
  async createCheckoutSession(
    @Body()
    body: {
      amount: number;
      productName: string;
      currency?: string;
      userId: string;
    },
  ) {
    if (!body.userId) {
      throw new BadRequestException('User ID is required');
    }

    return this.stripeService.payment(
      body.amount,
      body.productName,
      body.currency || 'usd',
      body.userId,
    );
  }
  @Get('verify-session')
  async verifySession(@Query('session_id') sessionId: string) {
    if (!sessionId) {
      throw new BadRequestException('Session ID is required');
    }

    try {
      return await this.stripeService.verifySession(sessionId);
    } catch (error) {
      throw new BadRequestException('Invalid or expired session');
    }
  }

  @Post('cancel-subscription')
  async cancelSubscription(@Body() body: { userId: string }) {
    if (!body.userId) {
      throw new BadRequestException('User ID is required');
    }

    try {
      return await this.stripeService.cancelSubscription(body.userId);
    } catch (error) {
      throw new BadRequestException('Unable to cancel subscription');
    }
  }
  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!request.rawBody) {
      throw new BadRequestException('Missing request body');
    }

    try {
      await this.stripeService.handleWebhook(signature, request.rawBody);
      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error.message);
      throw new BadRequestException(`Webhook Error: ${error.message}`);
    }
  }
}
