import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  ParseIntPipe,
  BadRequestException,
  Logger,
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
  private readonly logger = new Logger(RenderController.name);
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
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    // ✅ IMPROVED WEBHOOK URL LOGIC
    let webhookUrl: string;

    if (nodeEnv === 'production') {
      // Production: Use your deployed backend URL
      const backendUrl =
        this.configService.get<string>('BACKEND_URL') ||
        this.configService.get<string>('RENDER_EXTERNAL_URL');
      webhookUrl = `${backendUrl}/render/webhook`;
    } else {
      // Development: Use ngrok or your local tunnel
      const localUrl = `http://localhost:${this.configService.get<string>('PORT', '8000')}`;
      webhookUrl = `${localUrl}/render/webhook`;
    }

    this.logger.log(`Using webhook URL: ${webhookUrl}`);

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
      jobId?: string;
      state?: string;
      status?: string;
      output?: { url?: string };
      outputUrl?: string;
      error?: string;
    },
  ) {
    this.logger.log('=== NEXRENDER WEBHOOK RECEIVED ===');
    this.logger.log('Full webhook body:', JSON.stringify(body, null, 2));

    // Handle multiple possible formats from Nexrender
    const jobId = body.id || body.jobId;
    const state = body.state || body.status || '';
    const outputUrl = body.output?.url || body.outputUrl || '';
    const error = body.error;

    this.logger.log('Extracted values:', {
      jobId,
      state,
      outputUrl,
      error,
    });

    if (!jobId) {
      this.logger.error('Missing job ID in webhook');
      throw new BadRequestException('Missing job ID in webhook');
    }

    const result = await this.renderService.handleRenderComplete(
      jobId,
      outputUrl,
      state,
      error,
    );

    this.logger.log('Webhook processed successfully:', result);
    this.logger.log('========================');

    return { success: true, jobId, result };
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

  @Get('templates/:templateId/layers')
  @ApiOperation({
    summary: 'Get template layer names (for debugging layer mapping)',
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Template layers retrieved successfully',
  })
  async getTemplateLayers(
    @Param('templateId', ParseIntPipe) templateId: number,
  ) {
    const template = await this.renderService.getTemplate(templateId);

    // Get layer mapping from database
    const dbRecord = await this.renderService.getTemplateRecord(templateId);
    const layerMapping =
      (dbRecord as { layerMapping?: Record<string, string> })?.layerMapping ||
      {};

    // Log to console for easy debugging
    this.logger.log(`=== Template ${templateId} Layer Information ===`);
    this.logger.log('Compositions:', template.compositions);
    this.logger.log('Layers:', template.layers);
    this.logger.log('Current Layer Mapping:', layerMapping);
    this.logger.log('===============================================');

    return {
      templateId,
      compositions: template.compositions,
      layers: template.layers,
      layerMapping,
      message:
        'Layer mapping is auto-generated and stored in database. Check server logs for details.',
    };
  }

  @Put('templates/:templateId/layer-mapping')
  @ApiOperation({
    summary: 'Manually update layer mapping for a template',
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Layer mapping updated successfully',
  })
  async updateLayerMapping(
    @Param('templateId', ParseIntPipe) templateId: number,
    @Body()
    body: {
      layerMapping: Record<string, string>;
    },
  ) {
    const result = await this.renderService.updateLayerMapping(
      templateId,
      body.layerMapping,
    );
    return {
      message: 'Layer mapping updated successfully',
      ...result,
    };
  }

  @Post('templates/upload/:templateId')
  @ApiOperation({
    summary: 'Upload a single template to Nexrender Cloud',
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Template uploaded successfully',
  })
  async uploadTemplate(@Param('templateId', ParseIntPipe) templateId: number) {
    try {
      const nexrenderId =
        await this.renderService.ensureTemplateUploaded(templateId);
      return {
        message: 'Template uploaded successfully',
        templateId,
        nexrenderId,
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to upload template',
      );
    }
  }

  @Post('templates/upload-all')
  @ApiOperation({
    summary: 'Upload all templates to Nexrender Cloud (admin only)',
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'All templates uploaded successfully',
  })
  async uploadAllTemplates() {
    const results = await this.renderService.uploadAllTemplates();
    return {
      message: 'Template upload process completed',
      results,
    };
  }

  @Delete('templates/:templateId')
  @ApiOperation({
    summary: 'Delete a template from Nexrender and database',
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Template deleted successfully',
  })
  async deleteTemplate(@Param('templateId', ParseIntPipe) templateId: number) {
    const result = await this.renderService.deleteTemplate(templateId);
    return {
      message: result.success
        ? 'Template deleted successfully'
        : 'Template deletion failed',
      ...result,
    };
  }

  @Delete('templates')
  @ApiOperation({
    summary: 'Delete ALL templates from Nexrender and database (admin only)',
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'All templates deletion process completed',
  })
  async deleteAllTemplates() {
    this.logger.warn(
      '⚠️ DELETE ALL TEMPLATES REQUESTED - This will remove all templates!',
    );
    const results = await this.renderService.deleteAllTemplates();
    return {
      message: 'Template deletion process completed',
      results,
      summary: {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    };
  }
}
