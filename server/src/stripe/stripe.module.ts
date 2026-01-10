import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { UserModule } from 'src/modules/user/user.module';
import { CreditsModule } from 'src/modules/credits/credits.module';

@Module({
  imports: [UserModule , CreditsModule],
  controllers: [StripeController],
  providers: [StripeService],
})
export class StripeModule {}
