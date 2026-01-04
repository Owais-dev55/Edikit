import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { KeepAliveService } from './common/services/keep-alive.service';
import { StripeModule } from './stripe/stripe.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { RenderModule } from './modules/render/render.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    UserModule,
    ScheduleModule.forRoot(),
    HttpModule,
    StripeModule,
    CloudinaryModule,
    RenderModule,
  ],
  controllers: [AppController],
  providers: [AppService, KeepAliveService],
})
export class AppModule {}
