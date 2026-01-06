import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateRenderJobDto } from './dto/create-render-job.dto';
import { RenderStatus } from '@generated/prisma/enums';
import { firstValueFrom } from 'rxjs';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';

interface NexrenderTemplate {
  id: string;
  displayName: string;
  status: string;
  compositions?: string[];
  layers?: string[];
  uploadInfo?: {
    url: string;
    method: string;
    expiresIn: number;
  };
}

interface NexrenderJobResponse {
  id: string;
  state: string;
  progress?: number;
  output?: {
    url: string;
  };
  renderDuration?: number;
  error?: string;
}

@Injectable()
export class RenderService {
  private readonly logger = new Logger(RenderService.name);
  private readonly nexrenderApiUrl: string;
  private readonly nexrenderApiKey: string;
  private readonly animationsPath: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    this.nexrenderApiUrl = 'https://api.nexrender.com/api/v2';
    this.nexrenderApiKey =
      this.configService.get<string>('NEXRENDER_CLOUD_API_KEY') || '';
    this.animationsPath = path.join(process.cwd(), 'assets', 'animations');

    if (!this.nexrenderApiKey) {
      this.logger.warn('NEXRENDER_CLOUD_API_KEY is not set');
    }
  }

  /**
   * Get Nexrender template ID from database
   */
  async getTemplateId(templateId: number): Promise<string | null> {
    const template = await this.prisma.nexrenderTemplate.findUnique({
      where: { templateId },
    });
    return template?.nexrenderId || null;
  }

  /**
   * Check if template already uploaded in Nexrender Cloud
   */
  async checkTemplateExists(
    displayName: string,
  ): Promise<NexrenderTemplate | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<NexrenderTemplate[]>(
          `${this.nexrenderApiUrl}/templates`,
          {
            headers: {
              Authorization: `Bearer ${this.nexrenderApiKey}`,
            },
          },
        ),
      );

      const template = response.data.find(
        (t) => t.displayName === displayName && t.status === 'uploaded',
      );
      return template || null;
    } catch (error) {
      this.logger.error('Failed to check template existence', error);
      return null;
    }
  }

  /**
   * Register template in Nexrender Cloud
   */
   async registerTemplate(
  templateId: number,
  displayName: string,
): Promise<NexrenderTemplate> {
  try {
    this.logger.log(`Calling Nexrender API to register: ${displayName}`);
    
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.nexrenderApiUrl}/templates`,
        {
          type: 'aep',
          displayName,
        },
        {
          headers: {
            Authorization: `Bearer ${this.nexrenderApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    // Handle nested response structure
    const responseData = response.data;
    const templateData = responseData.template || responseData;
    const uploadInfo = responseData.uploadInfo;

    if (!templateData.id) {
      this.logger.error('No template ID in response:', responseData);
      throw new BadRequestException('Invalid template response from Nexrender');
    }

    this.logger.log(`Template registered successfully:`, {
      id: templateData.id,
      displayName: templateData.displayName,
      status: templateData.status,
    });

    // Merge template data with uploadInfo
    return {
      ...templateData,
      uploadInfo,
    } as NexrenderTemplate;
  } catch (error: unknown) {
    this.logger.error('Failed to register template', {
      error: error instanceof Error ? error.message : 'Unknown error',
      response: (error as any)?.response?.data,
      status: (error as any)?.response?.status,
    });
    throw new BadRequestException(
      `Failed to register template: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
}

  /**
   * Upload .aep file to presigned URL
   */
  async uploadTemplateFile(filePath: string, uploadUrl: string): Promise<void> {
    try {
      const fileBuffer = await fs.readFile(filePath);

      await firstValueFrom(
        this.httpService.put(uploadUrl, fileBuffer, {
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }),
      );

      this.logger.log(`Template file uploaded successfully: ${filePath}`);
    } catch (error: unknown) {
      this.logger.error('Failed to upload template file', error);
      throw new BadRequestException(
        `Failed to upload template file: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Check template status until uploaded
   */
  async checkTemplateStatus(nexrenderId: string): Promise<NexrenderTemplate> {
    const maxAttempts = 30; // 30 attempts with 2 second intervals = 60 seconds max
    const delay = 2000; // 2 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<NexrenderTemplate>(
            `${this.nexrenderApiUrl}/templates/${nexrenderId}`,
            {
              headers: {
                Authorization: `Bearer ${this.nexrenderApiKey}`,
              },
            },
          ),
        );

        const template = response.data;

        if (template.status === 'uploaded') {
          return template;
        }

        if (template.status === 'error') {
          throw new BadRequestException('Template upload failed');
        }

        // Wait before next attempt
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error: unknown) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const errorStatus = (error as { response?: { status?: number } })
          ?.response?.status;
        this.logger.warn(
          `Template status check attempt ${attempt + 1} failed: ${errorMessage}${
            errorStatus ? ` (Status: ${errorStatus})` : ''
          }`,
        );
        // Continue to next attempt
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new BadRequestException('Template upload timeout');
  }

  /**
   * Ensure template is uploaded to Nexrender Cloud
   */
  async ensureTemplateUploaded(templateId: number): Promise<string> {
    // Check if template ID exists in database
    let nexrenderId = await this.getTemplateId(templateId);
    if (nexrenderId) {
      // Verify it's still uploaded
      try {
        const template = await this.checkTemplateStatus(nexrenderId);
        if (template.status === 'uploaded') {
          return nexrenderId;
        }
      } catch (error) {
        this.logger.warn('Template status check failed, re-uploading');
      }
    }

    const displayName = `Animation ${templateId}`;
    const templateFilePath = path.join(
      this.animationsPath,
      `Animation ${templateId}.aep`,
    );

    // Check if template file exists
    if (!existsSync(templateFilePath)) {
      throw new NotFoundException(
        `Template file not found: Animation ${templateId}.aep`,
      );
    }

    // Check if template already exists in Nexrender Cloud
    const existingTemplate = await this.checkTemplateExists(displayName);
    if (existingTemplate) {
      nexrenderId = existingTemplate.id;
      // Store in database
      await this.prisma.nexrenderTemplate.upsert({
        where: { templateId },
        update: {
          nexrenderId: existingTemplate.id,
          status: existingTemplate.status,
          compositions: existingTemplate.compositions || [],
          layers: existingTemplate.layers || [],
        },
        create: {
          templateId,
          nexrenderId: existingTemplate.id,
          displayName,
          status: existingTemplate.status,
          compositions: existingTemplate.compositions || [],
          layers: existingTemplate.layers || [],
        },
      });
      return nexrenderId;
    }

    // Register template
    const registeredTemplate = await this.registerTemplate(
      templateId,
      displayName,
    );

    if (!registeredTemplate.uploadInfo) {
      throw new BadRequestException('No upload info received from Nexrender');
    }

    // Upload file
    await this.uploadTemplateFile(
      templateFilePath,
      registeredTemplate.uploadInfo.url,
    );

    // Wait for template to be processed
    const uploadedTemplate = await this.checkTemplateStatus(
      registeredTemplate.id,
    );

    // Store in database
    await this.prisma.nexrenderTemplate.upsert({
      where: { templateId },
      update: {
        nexrenderId: uploadedTemplate.id,
        status: uploadedTemplate.status,
        compositions: uploadedTemplate.compositions || [],
        layers: uploadedTemplate.layers || [],
      },
      create: {
        templateId,
        nexrenderId: uploadedTemplate.id,
        displayName,
        status: uploadedTemplate.status,
        compositions: uploadedTemplate.compositions || [],
        layers: uploadedTemplate.layers || [],
      },
    });

    return uploadedTemplate.id;
  }

  /**
   * Get template compositions and layers
   */
  async getTemplateCompositions(templateId: number): Promise<{
    compositions: string[];
    layers: string[];
  }> {
    const nexrenderId = await this.getTemplateId(templateId);
    if (!nexrenderId) {
      throw new NotFoundException('Template not found in database');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<NexrenderTemplate>(
          `${this.nexrenderApiUrl}/templates/${nexrenderId}`,
          {
            headers: {
              Authorization: `Bearer ${this.nexrenderApiKey}`,
            },
          },
        ),
      );

      return {
        compositions: response.data.compositions || [],
        layers: response.data.layers || [],
      };
    } catch (error: unknown) {
      this.logger.error('Failed to get template compositions', error);
      throw new BadRequestException(
        `Failed to get template compositions: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Get all templates from database
   */
  async getAllTemplates() {
    const templates = await this.prisma.nexrenderTemplate.findMany({
      orderBy: { templateId: 'asc' },
      select: {
        id: true,
        templateId: true,
        displayName: true,
        status: true,
        compositions: true,
        layers: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return templates;
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: number) {
    const template = await this.prisma.nexrenderTemplate.findUnique({
      where: { templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    // Get compositions and layers from Nexrender if available
    let compositions: string[] = [];
    let layers: string[] = [];

    if (template.nexrenderId) {
      try {
        const compData = await this.getTemplateCompositions(templateId);
        compositions = compData.compositions;
        layers = compData.layers;
      } catch (error) {
        this.logger.warn(
          `Failed to fetch compositions for template ${templateId}`,
        );
        // Use stored data if available
        compositions = (template.compositions as string[]) || [];
        layers = (template.layers as string[]) || [];
      }
    }

    return {
      id: template.id,
      templateId: template.templateId,
      displayName: template.displayName,
      status: template.status,
      nexrenderId: template.nexrenderId,
      compositions,
      layers,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  /**
   * Upload user asset to Cloudinary
   */
  async uploadAsset(
    file: Express.Multer.File,
    userId: string,
    assetType: 'image' | 'video' = 'image',
  ): Promise<string> {
    const result = await this.cloudinaryService.uploadAsset(
      file,
      userId,
      assetType,
    );
    return result.secure_url;
  }

  /**
   * Submit render job to Nexrender Cloud
   */
  async submitNexrenderJob(
    nexrenderTemplateId: string,
    composition: string,
    assets: Array<{
      type: string;
      layerName?: string;
      property?: string;
      value?: string | number[];
      src?: string;
    }>,
    webhookUrl: string,
  ): Promise<NexrenderJobResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<NexrenderJobResponse>(
          `${this.nexrenderApiUrl}/jobs`,
          {
            template: {
              id: nexrenderTemplateId,
              composition,
            },
            assets,
            webhook: {
              url: webhookUrl,
              method: 'POST',
            },
            preview: false,
          },
          {
            headers: {
              Authorization: `Bearer ${this.nexrenderApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch (error: unknown) {
      this.logger.error('Failed to submit Nexrender job', error);
      throw new BadRequestException(
        `Failed to submit render job: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Build assets array for Nexrender job
   */
  private buildNexrenderAssets(dto: CreateRenderJobDto): Array<{
    type: string;
    layerName?: string;
    property?: string;
    value?: string | number[];
    src?: string;
  }> {
    const assets: Array<{
      type: string;
      layerName?: string;
      property?: string;
      value?: string | number[];
      src?: string;
    }> = [];

    // Map frontend-friendly field names to backend field names
    const text1 = dto.text1 || dto.headline;
    const text2 = dto.text2 || dto.subheadline;
    const text3 = dto.text3 || dto.description;
    const image1 = dto.image1 || dto.logo;

    // Text replacements
    if (text1) {
      assets.push({
        type: 'data',
        layerName: 'Text 1',
        property: 'Source Text',
        value: text1,
      });
    }
    if (text2) {
      assets.push({
        type: 'data',
        layerName: 'Text 2',
        property: 'Source Text',
        value: text2,
      });
    }
    if (text3) {
      assets.push({
        type: 'data',
        layerName: 'Text 3',
        property: 'Source Text',
        value: text3,
      });
    }

    // Image replacements
    if (image1) {
      assets.push({
        type: 'image',
        src: image1,
        layerName: 'Image 1',
      });
    }
    if (dto.image2) {
      assets.push({
        type: 'image',
        src: dto.image2,
        layerName: 'Image 2',
      });
    }
    if (dto.image3) {
      assets.push({
        type: 'image',
        src: dto.image3,
        layerName: 'Image 3',
      });
    }
    if (dto.image4) {
      assets.push({
        type: 'image',
        src: dto.image4,
        layerName: 'Image 4',
      });
    }

    // Icon replacements
    if (dto.icon1) {
      assets.push({
        type: 'image',
        src: dto.icon1,
        layerName: 'Icon 1',
      });
    }
    if (dto.icon2) {
      assets.push({
        type: 'image',
        src: dto.icon2,
        layerName: 'Icon 2',
      });
    }
    if (dto.icon3) {
      assets.push({
        type: 'image',
        src: dto.icon3,
        layerName: 'Icon 3',
      });
    }
    if (dto.icon4) {
      assets.push({
        type: 'image',
        src: dto.icon4,
        layerName: 'Icon 4',
      });
    }

    // Background
    if (dto.background) {
      assets.push({
        type: 'image',
        src: dto.background,
        layerName: 'Background',
      });
    }

    // Color replacements
    if (dto.colors) {
      // Primary color
      if (dto.colors.primary) {
        assets.push({
          type: 'data',
          layerName: 'Primary Color',
          property: 'Color',
          value: this.hexToRgb(dto.colors.primary),
        });
      }

      // Secondary color
      if (dto.colors.secondary) {
        assets.push({
          type: 'data',
          layerName: 'Secondary Color',
          property: 'Color',
          value: this.hexToRgb(dto.colors.secondary),
        });
      }

      // Accent color
      if (dto.colors.accent) {
        assets.push({
          type: 'data',
          layerName: 'Accent Color',
          property: 'Color',
          value: this.hexToRgb(dto.colors.accent),
        });
      }

      // Background color
      if (dto.colors.background) {
        assets.push({
          type: 'data',
          layerName: 'Background Color',
          property: 'Color',
          value: this.hexToRgb(dto.colors.background),
        });
      }

      // Text color
      if (dto.colors.text) {
        assets.push({
          type: 'data',
          layerName: 'Text Color',
          property: 'Color',
          value: this.hexToRgb(dto.colors.text),
        });
      }
    }

    return assets;
  }

  /**
   * Convert hex color to RGB array for After Effects
   * After Effects expects colors as [R, G, B] where values are 0-1
   */
  private hexToRgb(hex: string): number[] {
    // Remove # if present
    const cleanHex = hex.replace('#', '');

    // Parse hex to RGB
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    return [r, g, b];
  }

  /**
   * Create render job
   */
  async createRenderJob(
    userId: string,
    templateId: number,
    dto: CreateRenderJobDto,
    webhookUrl: string,
  ) {
    // Ensure template is uploaded
    const nexrenderTemplateId = await this.ensureTemplateUploaded(templateId);

    // Get composition name (default to "Animation {templateId}")
    const composition = `Animation ${templateId}`;

    // Build assets array
    const assets = this.buildNexrenderAssets(dto);

    // Submit job to Nexrender
    const nexrenderJob = await this.submitNexrenderJob(
      nexrenderTemplateId,
      composition,
      assets,
      webhookUrl,
    );

    // Create job in database
    const job = await this.prisma.renderJob.create({
      data: {
        userId,
        templateId,
        nexrenderJobId: nexrenderJob.id,
        status: RenderStatus.PENDING,
        customizations: dto as any,
      },
    });

    return job;
  }

  /**
   * Get job status
   */
  // In your render.service.ts - update getJobStatus
async getJobStatus(jobId: string, userId: string) {
  const job = await this.prisma.renderJob.findFirst({
    where: { id: jobId, userId },
  });

  if (!job) {
    throw new NotFoundException('Job not found');
  }

  // Check Nexrender for latest status
  if (job.nexrenderJobId) {
    try {
      this.logger.log(`Checking Nexrender status for job: ${job.nexrenderJobId}`);
      
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.nexrenderApiUrl}/jobs/${job.nexrenderJobId}`,
          {
            headers: {
              Authorization: `Bearer ${this.nexrenderApiKey}`,
            },
          },
        ),
      );

      // ✅ LOG THE FULL RESPONSE TO SEE THE STRUCTURE
      this.logger.log('Full Nexrender response:', JSON.stringify(response.data, null, 2));

      const jobData = response.data;
      
      // ✅ Try different possible field names
      const state = jobData.state || jobData.status || jobData.renderStatus;
      const progress = jobData.progress || jobData.renderProgress || 0;
      const outputUrl = jobData.output?.url || jobData.outputUrl || jobData.result?.url;
      
      this.logger.log(`Job details:`, {
        state,
        progress,
        outputUrl,
      });

      // Map states to your DB status
      let status = job.status;
      
      if (state === 'finished' || state === 'completed' || state === 'done') {
        status = 'COMPLETED';
      } else if (state === 'error' || state === 'failed') {
        status = 'FAILED';
      } else if (state === 'processing' || state === 'rendering') {
        status = 'PROCESSING';
      } else if (state === 'queued' || state === 'pending') {
        status = 'PENDING';
      } else if (progress === 100 && !state) {
        // ✅ If progress is 100 but no state, assume completed
        status = 'COMPLETED';
      }

      // ✅ If completed and we have output URL, download and upload to Cloudinary
      if (status === 'COMPLETED' && outputUrl && !job.outputUrl) {
        this.logger.log('Job completed! Downloading and uploading to Cloudinary...');
        
        try {
          const videoResponse = await firstValueFrom(
            this.httpService.get(outputUrl, {
              responseType: 'arraybuffer',
              maxBodyLength: Infinity,
              maxContentLength: Infinity,
            }),
          );

          const videoBuffer = Buffer.from(videoResponse.data);

          const uploadResult = await this.cloudinaryService.uploadRenderedVideo(
            videoBuffer,
            job.userId,
            job.nexrenderJobId,
          );

          await this.prisma.renderJob.update({
            where: { id: job.id },
            data: {
              status: 'COMPLETED',
              outputUrl: uploadResult.secure_url,
              nexrenderOutputUrl: outputUrl,
            },
          });

          return {
            ...job,
            status: 'COMPLETED',
            outputUrl: uploadResult.secure_url,
            nexrenderOutputUrl: outputUrl,
            progress: 100,
          };
        } catch (uploadError) {
          this.logger.error('Failed to upload to Cloudinary:', uploadError);
          
          await this.prisma.renderJob.update({
            where: { id: job.id },
            data: {
              status: 'COMPLETED',
              nexrenderOutputUrl: outputUrl,
              outputUrl: outputUrl, // Use Nexrender URL as fallback
            },
          });

          return {
            ...job,
            status: 'COMPLETED',
            outputUrl: outputUrl,
            nexrenderOutputUrl: outputUrl,
            progress: 100,
          };
        }
      }

      // ✅ If progress is 100 but still no output, wait a bit more
      if (progress === 100 && !outputUrl) {
        this.logger.log('Progress is 100% but no output URL yet, waiting for Nexrender to finalize...');
        status = 'PROCESSING';
      }

      // Update job if status changed
      if (status !== job.status) {
        await this.prisma.renderJob.update({
          where: { id: job.id },
          data: {
            status,
            nexrenderOutputUrl: outputUrl || job.nexrenderOutputUrl,
          },
        });
      }

      return {
        ...job,
        status,
        outputUrl: job.outputUrl || outputUrl,
        nexrenderOutputUrl: outputUrl,
        nexrenderState: state,
        progress,
      };
    } catch (error) {
      this.logger.error('Failed to get Nexrender job status:', error);
      // Return database status if API call fails
    }
  }

  return job;
}
//testing
  /**
   * Handle render completion webhook
   */
  async handleRenderComplete(
    nexrenderJobId: string,
    outputUrl: string,
    state: string,
    error?: string,
  ) {
    const job = await this.prisma.renderJob.findUnique({
      where: { nexrenderJobId },
    });

    if (!job) {
      this.logger.warn(`Job not found for Nexrender job ID: ${nexrenderJobId}`);
      return null;
    }

    if (state === 'finished' && outputUrl) {
      try {
        // Download video from Nexrender
        const videoResponse = await firstValueFrom(
          this.httpService.get(outputUrl, {
            responseType: 'arraybuffer',
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
          }),
        );

        const videoBuffer = Buffer.from(videoResponse.data);

        // Upload to Cloudinary
        const uploadResult = await this.cloudinaryService.uploadRenderedVideo(
          videoBuffer,
          job.userId,
          nexrenderJobId,
        );

        // Update job
        await this.prisma.renderJob.update({
          where: { id: job.id },
          data: {
            status: 'COMPLETED',
            outputUrl: uploadResult.secure_url,
            nexrenderOutputUrl: outputUrl,
          },
        });

        return {
          jobId: job.id,
          outputUrl: uploadResult.secure_url,
        };
      } catch (error: unknown) {
        this.logger.error('Failed to process render completion', error);
        await this.prisma.renderJob.update({
          where: { id: job.id },
          data: {
            status: RenderStatus.FAILED,
            error: `Failed to upload video: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
            nexrenderOutputUrl: outputUrl,
          },
        });
        throw error;
      }
    } else if (state === 'error') {
      await this.prisma.renderJob.update({
        where: { id: job.id },
        data: {
          status: RenderStatus.FAILED,
          error: error || 'Render failed',
        },
      });
    }

    return null;
  }

  /**
   * Get optimized video URL
   */
  async getOptimizedVideoUrl(jobId: string, userId: string): Promise<string> {
    const job = await this.getJobStatus(jobId, userId);

    if (!job.outputUrl) {
      throw new NotFoundException('Video not ready');
    }

    // Extract public_id from Cloudinary URL if needed
    // For now, just return the URL as-is
    // Can be enhanced with optimization transformations
    return job.outputUrl;
  }
}
