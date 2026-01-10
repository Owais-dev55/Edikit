import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RenderController } from './render.controller';
import { RenderService } from './render.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [HttpModule, CloudinaryModule, PrismaModule , CreditsModule],
  controllers: [RenderController],
  providers: [RenderService],
  exports: [RenderService],
})
export class RenderModule {}
