import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RenderService } from './render.service';
import { CreateRenderJobDto } from './dto/create-render-job.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('Render')
@Controller('render')
@UseGuards(JwtAuthGuard)
export class RenderController {
  constructor(
    private readonly renderService: RenderService,
    private readonly configService: ConfigService,
  ) {}

  @Post('upload-asset')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Upload user images to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, description: 'Images uploaded successfully' })
  async uploadAsset(
    @CurrentUser('userId') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadResults = await Promise.all(
      files.map((file) =>
        this.renderService.uploadAsset(file, userId, 'image'),
      ),
    );

    return {
      urls: uploadResults,
    };
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all templates' })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
  })
  async getTemplates() {
    const templates = await this.renderService.getAllTemplates();
    return templates;
  }

  @Get('templates/:templateId')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Template retrieved successfully',
  })
  async getTemplate(@Param('templateId', ParseIntPipe) templateId: number) {
    const template = await this.renderService.getTemplate(templateId);
    return template;
  }

  @Post('create-job/:templateId')
  @ApiOperation({ summary: 'Create render job' })
  @ApiCookieAuth()
  @ApiResponse({
    status: 201,
    description: 'Render job created successfully',
  })
  async createJob(
    @Param('templateId', ParseIntPipe) templateId: number,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateRenderJobDto,
  ) {
    // Build webhook URL
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const baseUrl =
      nodeEnv === 'production'
        ? this.configService.get<string>('RENDER_EXTERNAL_URL') || frontendUrl
        : `http://localhost:${this.configService.get<string>('PORT', '3000')}`;

    const webhookUrl = `${baseUrl}/render/webhook`;

    const job = await this.renderService.createRenderJob(
      userId,
      templateId,
      dto,
      webhookUrl,
    );

    return job;
  }

  @Get('job/:id')
  @ApiOperation({ summary: 'Get render job status' })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved successfully',
  })
  async getJobStatus(
    @Param('id') jobId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const job = await this.renderService.getJobStatus(jobId, userId);
    return job;
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Nexrender Cloud webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Body()
    body: {
      id?: string;
      state?: string;
      output?: { url?: string };
      error?: string;
    },
  ) {
    // Webhook from Nexrender Cloud
    const { id, state, output, error } = body;

    if (!id) {
      throw new BadRequestException('Missing job ID in webhook');
    }

    const outputUrl = output?.url || '';

    await this.renderService.handleRenderComplete(
      id,
      outputUrl,
      state || '',
      error,
    );

    return { success: true };
  }

  @Get('job/:id/video')
  @ApiOperation({ summary: 'Get optimized video URL' })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Video URL retrieved successfully',
  })
  async getVideoUrl(
    @Param('id') jobId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const url = await this.renderService.getOptimizedVideoUrl(jobId, userId);
    return { url };
  }
}
