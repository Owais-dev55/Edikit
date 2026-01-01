import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { hash } from 'argon2';
import { PlanType } from '@generated/prisma/enums';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.user.findMany();
  }

  async findOne(id: string) {
    return await this.prisma.user.findUniqueOrThrow({
      where: {
        id,
      },
    });
  }

  async findUserByEmail(email: string) {
    return await this.prisma.user.findUniqueOrThrow({
      where: {
        email,
      },
    });
  }

  async findUserByGoogleId(googleId: string) {
    return await this.prisma.user.findUnique({
      where: {
        googleId,
      },
    });
  }

  async findUserByAppleId(appleId: string) {
    return await this.prisma.user.findUnique({
      where: {
        appleId,
      },
    });
  }

  async update(
    id: string,
    data: { password?: string; [key: string]: unknown },
  ) {
    const updateData = { ...data };
    if (updateData.password) {
      updateData.password = await hash(updateData.password);
    }
    return await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    const result = await this.prisma.user.delete({
      where: { id },
    });
    return result && true;
  }
  
  async updateSubscription(
    userId: string,
    data: {
      planType: PlanType;
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
      stripePriceId?: string | null;
      stripeCurrentPeriodEnd?: Date | null;
    },
  ) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        planType: data.planType,
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        stripePriceId: data.stripePriceId,
        stripeCurrentPeriodEnd: data.stripeCurrentPeriodEnd,
      },
    });
  }

  // Add this helper method to find user by Stripe customer ID
  async findByStripeCustomerId(stripeCustomerId: string) {
    return await this.prisma.user.findUnique({
      where: { stripeCustomerId },
    });
  }
}
