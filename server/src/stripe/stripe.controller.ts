import {
  Controller,
  Post,
  Body,
  Get,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { StripeService } from './stripe.service';

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
      interval?: 'day' | 'week' | 'month' | 'year';
    },
  ) {
    return this.stripeService.payment(
      body.amount,
      body.productName,
      body.currency || 'usd',
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
}
