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
  layers?: Array<{
    layerName: string;
    composition: string;
  }>;
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
      this.logger.log(`Registering template with Nexrender: ${displayName}`);

      const response = await firstValueFrom(
        this.httpService.post<NexrenderTemplate>(
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

      // Log full response for debugging
      this.logger.log(
        `Nexrender API response for template ${templateId}:`,
        JSON.stringify(response.data, null, 2),
      );

      // According to Nexrender API docs, response is direct template object
      const template = response.data;

      // Handle different possible response structures
      if (!template) {
        this.logger.error('Empty response from Nexrender');
        throw new BadRequestException('Empty response from Nexrender');
      }

      // Check if response has nested structure
      const templateIdValue =
        template.id ||
        (template as any).template?.id ||
        (template as any).data?.id;
      const uploadInfoValue =
        template.uploadInfo ||
        (template as any).template?.uploadInfo ||
        (template as any).data?.uploadInfo;

      if (!templateIdValue) {
        this.logger.error('No template ID in response:', {
          fullResponse: template,
          responseKeys: Object.keys(template),
        });
        throw new BadRequestException(
          'Invalid template response from Nexrender - no ID found',
        );
      }

      if (!uploadInfoValue) {
        this.logger.error('No uploadInfo in response:', {
          fullResponse: template,
          responseKeys: Object.keys(template),
        });
        throw new BadRequestException(
          'No upload information received from Nexrender',
        );
      }

      // Normalize template object
      const normalizedTemplate: NexrenderTemplate = {
        id: templateIdValue,
        displayName: template.displayName || displayName,
        status: template.status || 'awaiting_upload',
        compositions: template.compositions || [],
        layers: template.layers || [],
        uploadInfo: uploadInfoValue,
      };

      this.logger.log(`Template registered successfully:`, {
        id: normalizedTemplate.id,
        displayName: normalizedTemplate.displayName,
        status: normalizedTemplate.status,
        hasUploadUrl: !!normalizedTemplate.uploadInfo?.url,
      });

      return normalizedTemplate;
    } catch (error: unknown) {
      const errorResponse = (error as any)?.response;
      this.logger.error('Failed to register template', {
        templateId,
        displayName,
        error: error instanceof Error ? error.message : 'Unknown error',
        response: errorResponse?.data,
        status: errorResponse?.status,
        statusText: errorResponse?.statusText,
      });

      // Provide more specific error message
      if (errorResponse?.status === 401) {
        throw new BadRequestException(
          'Authentication failed - check your Nexrender API key',
        );
      } else if (errorResponse?.status === 429) {
        throw new BadRequestException(
          'Rate limit exceeded - please wait and try again',
        );
      } else if (errorResponse?.data) {
        throw new BadRequestException(
          `Failed to register template: ${JSON.stringify(errorResponse.data)}`,
        );
      }

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

    // Auto-generate layer mapping from layers
    const layers = uploadedTemplate.layers || [];
    const layerMapping =
      Array.isArray(layers) && layers.length > 0
        ? this.autoGenerateLayerMapping(layers, templateId)
        : {};

    // Store in database with auto-generated mapping
    await this.prisma.nexrenderTemplate.upsert({
      where: { templateId },
      update: {
        nexrenderId: uploadedTemplate.id,
        status: uploadedTemplate.status,
        compositions: uploadedTemplate.compositions || [],
        layers: uploadedTemplate.layers || [],
        layerMapping: layerMapping as any, // JSON field - type is correct
      },
      create: {
        templateId,
        nexrenderId: uploadedTemplate.id,
        displayName,
        status: uploadedTemplate.status,
        compositions: uploadedTemplate.compositions || [],
        layers: uploadedTemplate.layers || [],
        layerMapping: layerMapping as any, // JSON field - type is correct
      },
    });

    this.logger.log(
      `Template ${templateId} uploaded and layer mapping generated:`,
      layerMapping,
    );

    return uploadedTemplate.id;
  }

  /**
   * Get template compositions and layers
   */
  async getTemplateCompositions(templateId: number): Promise<{
    compositions: string[];
    layers: Array<{ layerName: string; composition: string }>;
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
        layers: (response.data.layers || []) as Array<{
          layerName: string;
          composition: string;
        }>,
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
    let layers: Array<{ layerName: string; composition: string }> = [];

    if (template.nexrenderId) {
      try {
        const compData = await this.getTemplateCompositions(templateId);
        compositions = compData.compositions;
        layers = compData.layers;
      } catch {
        this.logger.warn(
          `Failed to fetch compositions for template ${templateId}`,
        );
        // Use stored data if available
        compositions = (template.compositions as string[]) || [];
        layers =
          (template.layers as Array<{
            layerName: string;
            composition: string;
          }>) || [];
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
   * Get layer mapping for a template from database
   * Falls back to auto-generating from Nexrender layers if not stored
   */
  private async getLayerMapping(
    templateId: number,
  ): Promise<Record<string, string>> {
    // Try to get from database first
    const template = await this.prisma.nexrenderTemplate.findUnique({
      where: { templateId },
    });

    // Check if layerMapping exists (will work after Prisma regenerate)
    const layerMapping = (template as any)?.layerMapping;
    if (layerMapping) {
      return layerMapping as Record<string, string>;
    }

    // Auto-generate mapping from layers if available
    if (template?.layers) {
      const layers = template.layers as Array<{
        layerName: string;
        composition: string;
      }>;
      return this.autoGenerateLayerMapping(layers, templateId);
    }

    // Fallback to empty mapping (will use defaults)
    return {};
  }

  /**
   * Auto-generate layer mapping from Nexrender layers
   * Attempts to match frontend field names to layer names
   */
  private autoGenerateLayerMapping(
    layers: Array<{ layerName: string; composition: string }>,
    templateId: number,
  ): Record<string, string> {
    const mapping: Record<string, string> = {};

    // Common patterns to match
    const patterns = {
      text1: [
        /text\s*1/i,
        /headline/i,
        /title/i,
        /prova\s*scena\s*6/i,
        /main\s*text/i,
      ],
      text2: [
        /text\s*2/i,
        /subheadline/i,
        /subtitle/i,
        /prova\s*scena\s*5/i,
        /description/i,
      ],
      text3: [/text\s*3/i, /description/i, /body/i],
      image1: [
        /image\s*1/i,
        /logo/i,
        /main\s*image/i,
        /images\s*and\s*videos/i,
      ],
      image2: [/image\s*2/i, /img\.png/i, /secondary/i],
      image3: [/image\s*3/i, /box\s*5/i, /icon/i],
      icon1: [/icon\s*1/i, /social\s*icon/i],
      icon2: [/icon\s*2/i],
      icon3: [/icon\s*3/i],
      icon4: [/icon\s*4/i],
      background: [/bg\.png/i, /background/i, /backdrop/i],
    };

    // Match layers to patterns
    for (const [fieldName, regexPatterns] of Object.entries(patterns)) {
      for (const layer of layers) {
        for (const pattern of regexPatterns) {
          if (pattern.test(layer.layerName)) {
            mapping[fieldName] = layer.layerName;
            break;
          }
        }
        if (mapping[fieldName]) break;
      }
    }

    this.logger.log(
      `Auto-generated layer mapping for template ${templateId}:`,
      mapping,
    );

    return mapping;
  }

  /**
   * Helper method to log actual layer names from Nexrender
   * Call this after template upload to see what layer names Nexrender detected
   */
  async logTemplateLayers(templateId: number): Promise<void> {
    try {
      const template = await this.getTemplate(templateId);
      this.logger.log(`=== Template ${templateId} Layer Names ===`);
      this.logger.log('Compositions:', template.compositions);
      this.logger.log('Layers:', template.layers);
      this.logger.log('==========================================');
      this.logger.log(
        '⚠️ Update getLayerMapping() with these actual layer names!',
      );
    } catch (error) {
      this.logger.error('Failed to log template layers:', error);
    }
  }

  /**
   * Build assets array for Nexrender job
   * Only includes assets if frontend provides them (uses .aep defaults otherwise)
   */
  private async buildNexrenderAssets(
    dto: CreateRenderJobDto,
    templateId: number,
  ): Promise<
    Array<{
      type: string;
      layerName?: string;
      property?: string;
      value?: string | number[];
      src?: string;
    }>
  > {
    const assets: Array<{
      type: string;
      layerName?: string;
      property?: string;
      value?: string | number[];
      src?: string;
    }> = [];

    // Get layer mapping for this template (from database)
    const layerMapping = await this.getLayerMapping(templateId);

    // Map frontend-friendly field names to backend field names
    const text1 = dto.text1 || dto.headline;
    const text2 = dto.text2 || dto.subheadline;
    const text3 = dto.text3 || dto.description;
    const image1 = dto.image1 || dto.logo;

    // Text replacements - use mapped layer names
    if (text1) {
      const layerName = layerMapping.text1 || 'Text 1'; // Fallback to default
      assets.push({
        type: 'data',
        layerName,
        property: 'Source Text',
        value: text1,
      });
    }
    if (text2) {
      const layerName = layerMapping.text2 || 'Text 2';
      assets.push({
        type: 'data',
        layerName,
        property: 'Source Text',
        value: text2,
      });
    }
    if (text3) {
      const layerName = layerMapping.text3 || 'Text 3';
      assets.push({
        type: 'data',
        layerName,
        property: 'Source Text',
        value: text3,
      });
    }

    // Image replacements - use mapped layer names
    if (image1) {
      const layerName = layerMapping.image1 || 'Image 1';
      assets.push({
        type: 'image',
        src: image1,
        layerName,
      });
    }
    if (dto.image2) {
      const layerName = layerMapping.image2 || 'Image 2';
      assets.push({
        type: 'image',
        src: dto.image2,
        layerName,
      });
    }
    if (dto.image3) {
      const layerName = layerMapping.image3 || 'Image 3';
      assets.push({
        type: 'image',
        src: dto.image3,
        layerName,
      });
    }
    if (dto.image4) {
      const layerName = layerMapping.image4 || 'Image 4';
      assets.push({
        type: 'image',
        src: dto.image4,
        layerName,
      });
    }

    // Icon replacements - use mapped layer names
    if (dto.icon1) {
      const layerName = layerMapping.icon1 || 'Icon 1';
      assets.push({
        type: 'image',
        src: dto.icon1,
        layerName,
      });
    }
    if (dto.icon2) {
      const layerName = layerMapping.icon2 || 'Icon 2';
      assets.push({
        type: 'image',
        src: dto.icon2,
        layerName,
      });
    }
    if (dto.icon3) {
      const layerName = layerMapping.icon3 || 'Icon 3';
      assets.push({
        type: 'image',
        src: dto.icon3,
        layerName,
      });
    }
    if (dto.icon4) {
      const layerName = layerMapping.icon4 || 'Icon 4';
      assets.push({
        type: 'image',
        src: dto.icon4,
        layerName,
      });
    }

    // Background - use mapped layer name
    if (dto.background) {
      const layerName = layerMapping.background || 'Background';
      assets.push({
        type: 'image',
        src: dto.background,
        layerName,
      });
    }

    // Color replacements - use mapped layer names
    if (dto.colors) {
      // Primary color
      if (dto.colors.primary) {
        const layerName = layerMapping.colorPrimary || 'Primary Color';
        assets.push({
          type: 'data',
          layerName,
          property: 'Color',
          value: this.hexToRgb(dto.colors.primary),
        });
      }

      // Secondary color
      if (dto.colors.secondary) {
        const layerName = layerMapping.colorSecondary || 'Secondary Color';
        assets.push({
          type: 'data',
          layerName,
          property: 'Color',
          value: this.hexToRgb(dto.colors.secondary),
        });
      }

      // Accent color
      if (dto.colors.accent) {
        const layerName = layerMapping.colorAccent || 'Accent Color';
        assets.push({
          type: 'data',
          layerName,
          property: 'Color',
          value: this.hexToRgb(dto.colors.accent),
        });
      }

      // Background color
      if (dto.colors.background) {
        const layerName = layerMapping.colorBackground || 'Background Color';
        assets.push({
          type: 'data',
          layerName,
          property: 'Color',
          value: this.hexToRgb(dto.colors.background),
        });
      }

      // Text color
      if (dto.colors.text) {
        const layerName = layerMapping.colorText || 'Text Color';
        assets.push({
          type: 'data',
          layerName,
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

    // Get template info to fetch actual composition name
    const template = await this.getTemplate(templateId);
    const compositions = template.compositions || [];

    if (compositions.length === 0) {
      throw new BadRequestException(
        `Template ${templateId} has no compositions. Please ensure the template is properly uploaded.`,
      );
    }

    // Use first composition (or you can allow user to select)
    // For MVP, we'll use the first composition
    const composition = compositions[0];
    this.logger.log(
      `Using composition "${composition}" for template ${templateId}`,
    );

    // Build assets array (only includes assets if frontend provides them)
    const assets = await this.buildNexrenderAssets(dto, templateId);

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

    if (job.nexrenderJobId) {
      try {
        this.logger.log(
          `Checking Nexrender status for job: ${job.nexrenderJobId}`,
        );

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

        const jobData = response.data;

        // Extract fields from response
        const state = jobData.state || jobData.status || jobData.renderStatus;
        const progress = jobData.progress || jobData.renderProgress || 0;
        const outputUrl =
          jobData.output?.url || jobData.outputUrl || jobData.result?.url;

        this.logger.log(`Nexrender job details:`, {
          state,
          progress,
          hasOutputUrl: !!outputUrl,
        });

        // Map Nexrender states to our RenderStatus enum
        const stateMap: Record<string, RenderStatus> = {
          pending: RenderStatus.PENDING,
          queued: RenderStatus.PENDING,
          processing: RenderStatus.PROCESSING,
          rendering: RenderStatus.PROCESSING,
          finished: RenderStatus.COMPLETED,
          completed: RenderStatus.COMPLETED,
          done: RenderStatus.COMPLETED,
          error: RenderStatus.FAILED,
          failed: RenderStatus.FAILED,
        };

        // Determine status: prioritize state, then progress, then output URL
        let status = job.status;
        const normalizedState = (state || '').toLowerCase();

        if (stateMap[normalizedState]) {
          status = stateMap[normalizedState];
        } else if (progress !== undefined) {
          // Fallback to progress-based status
          if (progress === 100 && outputUrl) {
            status = RenderStatus.COMPLETED;
          } else if (progress > 0 && progress < 100) {
            status = RenderStatus.PROCESSING;
          } else if (progress === 0) {
            status = RenderStatus.PENDING;
          }
        }

        // ✅ If completed and we have output URL, download and upload to Cloudinary
        if (status === 'COMPLETED' && outputUrl && !job.outputUrl) {
          this.logger.log('Job completed! Downloading video from Nexrender...');

          try {
            const videoResponse = await firstValueFrom(
              this.httpService.get(outputUrl, {
                responseType: 'arraybuffer',
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: 60000, // 60 second timeout for large files
              }),
            );

            const videoBuffer = Buffer.from(videoResponse.data);
            this.logger.log(
              `Downloaded video: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB`,
            );

            this.logger.log('Uploading to Cloudinary...');
            const uploadResult =
              await this.cloudinaryService.uploadRenderedVideo(
                videoBuffer,
                job.userId,
                job.nexrenderJobId,
              );

            this.logger.log(
              `Uploaded to Cloudinary: ${uploadResult.secure_url}`,
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
              id: job.id,
              userId: job.userId,
              templateId: job.templateId,
              status: 'COMPLETED',
              outputUrl: uploadResult.secure_url,
              nexrenderOutputUrl: outputUrl,
              progress: 100,
              createdAt: job.createdAt,
              updatedAt: job.updatedAt,
            };
          } catch (uploadError) {
            this.logger.error('Failed to download/upload video:', uploadError);

            // Still mark as completed with Nexrender URL
            await this.prisma.renderJob.update({
              where: { id: job.id },
              data: {
                status: 'COMPLETED',
                outputUrl: outputUrl, // Use Nexrender URL directly
                nexrenderOutputUrl: outputUrl,
              },
            });

            return {
              id: job.id,
              userId: job.userId,
              templateId: job.templateId,
              status: 'COMPLETED',
              outputUrl: outputUrl,
              nexrenderOutputUrl: outputUrl,
              progress: 100,
              createdAt: job.createdAt,
              updatedAt: job.updatedAt,
            };
          }
        }

        // Update job in database
        if (status !== job.status || (outputUrl && !job.nexrenderOutputUrl)) {
          await this.prisma.renderJob.update({
            where: { id: job.id },
            data: {
              status,
              nexrenderOutputUrl: outputUrl || job.nexrenderOutputUrl,
            },
          });
        }

        return {
          id: job.id,
          userId: job.userId,
          templateId: job.templateId,
          status,
          outputUrl: job.outputUrl || outputUrl,
          nexrenderOutputUrl: outputUrl,
          nexrenderState: state,
          progress,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        };
      } catch (error) {
        this.logger.error('Failed to get Nexrender job status:', error);
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

    const normalizedState = (state || '').toLowerCase();
    const isCompleted =
      normalizedState === 'finished' ||
      normalizedState === 'completed' ||
      normalizedState === 'done';

    if (isCompleted && outputUrl) {
      try {
        this.logger.log(
          `Processing completed render job ${job.id}, downloading from: ${outputUrl}`,
        );

        // Download video from Nexrender
        const videoResponse = await firstValueFrom(
          this.httpService.get(outputUrl, {
            responseType: 'arraybuffer',
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 60000, // 60 second timeout for large files
          }),
        );

        const videoBuffer = Buffer.from(videoResponse.data);
        this.logger.log(
          `Downloaded video: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB`,
        );

        // Upload to Cloudinary
        const uploadResult = await this.cloudinaryService.uploadRenderedVideo(
          videoBuffer,
          job.userId,
          nexrenderJobId,
        );

        this.logger.log(`Uploaded to Cloudinary: ${uploadResult.secure_url}`);

        // Update job
        await this.prisma.renderJob.update({
          where: { id: job.id },
          data: {
            status: RenderStatus.COMPLETED,
            outputUrl: uploadResult.secure_url,
            nexrenderOutputUrl: outputUrl,
          },
        });

        return {
          jobId: job.id,
          outputUrl: uploadResult.secure_url,
        };
      } catch (error: unknown) {
        this.logger.error('Failed to process render completion', {
          error: error instanceof Error ? error.message : 'Unknown error',
          jobId: job.id,
          nexrenderJobId,
        });

        // Store error but keep Nexrender URL as fallback
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
    } else if (normalizedState === 'error' || normalizedState === 'failed') {
      this.logger.error(`Render job failed: ${nexrenderJobId}`, { error });
      await this.prisma.renderJob.update({
        where: { id: job.id },
        data: {
          status: RenderStatus.FAILED,
          error: error || 'Render failed',
        },
      });
    } else {
      this.logger.log(
        `Render job ${nexrenderJobId} state: ${state} (not completed yet)`,
      );
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

  /**
   * Upload all templates to Nexrender Cloud
   * This should be called once to initialize all templates
   */
  async uploadAllTemplates(): Promise<
    Array<{
      templateId: number;
      success: boolean;
      nexrenderId?: string;
      error?: string;
    }>
  > {
    const results: Array<{
      templateId: number;
      success: boolean;
      nexrenderId?: string;
      error?: string;
    }> = [];

    // Find all .aep files in animations folder
    const files = await fs.readdir(this.animationsPath);
    const aepFiles = files.filter((f) => f.endsWith('.aep'));

    this.logger.log(`Found ${aepFiles.length} .aep files to upload`);

    for (const file of aepFiles) {
      // Extract template ID from filename (e.g., "Animation 1.aep" -> 1)
      const match = file.match(/Animation\s+(\d+)\.aep/i);
      if (!match) {
        this.logger.warn(`Skipping file with unexpected name: ${file}`);
        continue;
      }

      const templateId = parseInt(match[1], 10);

      try {
        this.logger.log(`Uploading template ${templateId} (${file})...`);

        // Check if already uploaded
        const existing = await this.getTemplateId(templateId);
        if (existing) {
          this.logger.log(
            `Template ${templateId} already uploaded, skipping...`,
          );
          results.push({
            templateId,
            success: true,
            nexrenderId: existing,
          });
          continue;
        }

        // Upload template
        const nexrenderId = await this.ensureTemplateUploaded(templateId);

        results.push({
          templateId,
          success: true,
          nexrenderId,
        });

        this.logger.log(
          `✅ Template ${templateId} uploaded successfully: ${nexrenderId}`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `❌ Failed to upload template ${templateId}: ${errorMessage}`,
        );
        results.push({
          templateId,
          success: false,
          error: errorMessage,
        });
      }

      // Small delay between uploads to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return results;
  }
}
