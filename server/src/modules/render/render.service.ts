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
import { CreditsService } from '../credits/credits.service';

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
    private readonly creditsService: CreditsService,
  ) {
    this.nexrenderApiUrl = 'https://api.nexrender.com/api/v2';
    this.nexrenderApiKey =
      this.configService.get<string>('NEXRENDER_CLOUD_API_KEY') || '';
    this.animationsPath = path.join(process.cwd(), 'animations');

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
    templateFilePath: string,
  ): Promise<NexrenderTemplate> {
    try {
      this.logger.log(`Registering template with Nexrender: ${displayName}`);

      // Determine file type from extension
      const fileExtension = path.extname(templateFilePath).toLowerCase();
      const templateType = fileExtension === '.zip' ? 'zip' : 'aep';

      this.logger.log(
        `Registering template as type: ${templateType} (file: ${path.basename(templateFilePath)})`,
      );

      const response = await firstValueFrom(
        this.httpService.post<NexrenderTemplate>(
          `${this.nexrenderApiUrl}/templates`,
          {
            type: templateType,
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

    // Try .zip first (recommended for bundled projects), then .aep
    let templateFilePath = path.join(
      this.animationsPath,
      `Animation_${templateId}.zip`,
    );

    if (!existsSync(templateFilePath)) {
      // Try with space
      templateFilePath = path.join(
        this.animationsPath,
        `Animation ${templateId}.zip`,
      );
    }

    if (!existsSync(templateFilePath)) {
      // Fallback to .aep
      templateFilePath = path.join(
        this.animationsPath,
        `Animation ${templateId}.aep`,
      );
    }

    if (!existsSync(templateFilePath)) {
      // Try Animation_X format
      templateFilePath = path.join(
        this.animationsPath,
        `Animation_${templateId}.aep`,
      );
    }

    // Check if template file exists
    if (!existsSync(templateFilePath)) {
      throw new NotFoundException(
        `Template file not found: Animation ${templateId}.aep or Animation_${templateId}.zip`,
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
      templateFilePath,
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
   * Get template record from database (raw)
   */
  async getTemplateRecord(templateId: number) {
    return await this.prisma.nexrenderTemplate.findUnique({
      where: { templateId },
    });
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
    // First check for hardcoded predefined mappings (highest priority)
    const predefined = this.getPredefinedLayerMapping(templateId);
    if (predefined) {
      this.logger.log(
        `Using predefined layer mapping for template ${templateId}:`,
        JSON.stringify(predefined),
      );
      return predefined;
    }

    // Try to get from database
    const template = await this.prisma.nexrenderTemplate.findUnique({
      where: { templateId },
    });

    // Check if layerMapping exists in database
    const layerMapping = (template as any)?.layerMapping;
    if (layerMapping) {
      this.logger.log(
        `Using database layer mapping for template ${templateId}:`,
        JSON.stringify(layerMapping),
      );
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
    this.logger.warn(
      `No layer mapping found for template ${templateId}, using defaults`,
    );
    return {};
  }

  /**
   * Get predefined layer mapping for a specific template
   * These are manually configured based on actual AE layer names
   */
  private getPredefinedLayerMapping(
    templateId: number,
  ): Record<string, string> | null {
    const predefinedMappings: Record<number, Record<string, string>> = {
      // Animation 1 - Image & Text Template
      // Frontend: text1, text2, image1, image2, background
      // NOTE: Swapped due to client naming layers incorrectly
      1: {
        text1: 'txt_2', // swapped: frontend text1 -> AE txt_2
        text2: 'txt_1', // swapped: frontend text2 -> AE txt_1
        image1: 'img_2.png', // swapped: frontend image1 -> AE img_2.png
        image2: 'img_1.png', // swapped: frontend image2 -> AE img_1.png
        background: 'background.png',
      },

      // Animation 2 - Icon & Text Template
      // Frontend: text1, icon1, icon2, background
      2: {
        text1: 'txt_1',
        icon1: 'icon_1.png',
        icon2: 'icon_2.png',
        background: 'background.png',
      },

      // Animation 3 - Icon & Text Template
      // Frontend: icon1, text1, text2, background
      3: {
        text1: 'txt_1',
        text2: 'txt_2',
        icon1: 'icon_1.png',
        background: 'background.png',
      },

      // Animation 4 - Multiple Icons & Text
      // Frontend: text1, icon1, icon2, icon3, background
      4: {
        text1: 'txt_1',
        icon1: 'icon_1.png',
        icon2: 'icon_2.png',
        icon3: 'icon_3.png',
        background: 'background.png',
      },

      // Animation 5 - Two Icons & Text
      // Frontend: text1, icon1, icon2, background
      // Note: Template has txt_2 but frontend only asks for text1
      5: {
        text1: 'txt_1',
        icon1: 'icon_1.png',
        icon2: 'icon_2.png',
        background: 'background.png',
      },

      // Animation 6 - Video & Text Template
      // Frontend: text1, video1, text2, background
      6: {
        text1: 'txt_1',
        text2: 'txt_2',
        video1: 'video_1.mp4',
        background: 'background.png',
      },

      // Animation 7 - Simple Text Template
      // Frontend: text1, text2, text3, background
      7: {
        text1: 'txt_1',
        text2: 'txt_2',
        text3: 'txt_3',
        background: 'background.png',
      },

      // Animation 8 - Product Showcase
      // Frontend: image (product), text1, text2, text3, background
      8: {
        text1: 'txt_1',
        text2: 'txt_2',
        text3: 'txt_3',
        image: 'img_1.png',
        productImage: 'img_1.png',
        background: 'background.png',
      },

      // Animation 9 - Triple Text Template
      // Frontend: text1, text2, text3, background
      9: {
        text1: 'txt_1',
        text2: 'txt_2',
        text3: 'txt_3',
        background: 'background.png',
      },

      // Animation 10 - Four Icons & Text
      // Frontend: icon1, icon2, icon3, icon4, text1, background
      10: {
        text1: 'txt_1',
        icon1: 'icon_1.png',
        icon2: 'icon_2.png',
        icon3: 'icon_3.png',
        icon4: 'icon_4.png',
        background: 'background.png',
      },

      // Animation 11 - Social Media Style
      // Frontend: icon1 (profile), text1 (username), video1, text2, background
      11: {
        text1: 'txt_1',
        text2: 'txt_2',
        icon1: 'icon_1.png',
        video1: 'video_1.mp4',
        background: 'background.png',
      },
    };

    return predefinedMappings[templateId] || null;
  }

  /**
   * Auto-generate layer mapping from Nexrender layers
   * First checks for predefined mappings, then falls back to pattern matching
   */
  private autoGenerateLayerMapping(
    layers: Array<{ layerName: string; composition: string }>,
    templateId: number,
  ): Record<string, string> {
    // Check for predefined mapping first
    const predefined = this.getPredefinedLayerMapping(templateId);
    if (predefined) {
      this.logger.log(
        `Using predefined layer mapping for template ${templateId}:`,
        predefined,
      );
      return predefined;
    }

    // Fall back to auto-generation for unknown templates
    const mapping: Record<string, string> = {};

    this.logger.log(
      `Auto-generating layer mapping for template ${templateId} from ${layers.length} layers`,
    );
    this.logger.log(
      'Available layers:',
      layers.map((l) => `${l.layerName} (${l.composition})`),
    );

    // Priority-ordered patterns - more specific patterns first
    // Patterns are designed to match common After Effects layer naming conventions
    const patterns: Record<string, RegExp[]> = {
      // Text layers - match numbered text layers (txt_1, text_1, Text 1, etc.)
      text1: [
        /^txt[_\s-]?1$/i, // txt_1, txt-1, txt 1
        /^text[_\s-]?1$/i, // text_1, text-1, text 1
        /^headline$/i,
        /^title$/i,
        /^main[_\s-]?text$/i,
        /prova\s*scena\s*6/i, // Legacy pattern
      ],
      text2: [
        /^txt[_\s-]?2$/i,
        /^text[_\s-]?2$/i,
        /^subtitle$/i,
        /^subheadline$/i,
        /prova\s*scena\s*5/i,
      ],
      text3: [/^txt[_\s-]?3$/i, /^text[_\s-]?3$/i, /^description$/i, /^body$/i],
      text4: [/^txt[_\s-]?4$/i, /^text[_\s-]?4$/i],

      // Image layers - match img_1.png, image_1.png, product.png, etc.
      // Note: Exclude icon and box patterns from image matching
      image1: [
        /^img[_\s-]?1\.png$/i, // img_1.png
        /^image[_\s-]?1\.png$/i,
        /^img[_\s-]?1$/i, // img_1 (without extension)
        /^image[_\s-]?1$/i,
        /^logo\.png$/i,
        /^product[_\s-]?1?\.png$/i,
        /images\s*and\s*videos/i,
      ],
      image2: [
        /^img[_\s-]?2\.png$/i,
        /^image[_\s-]?2\.png$/i,
        /^img[_\s-]?2$/i,
        /^image[_\s-]?2$/i,
        /^product[_\s-]?2\.png$/i,
      ],
      image3: [
        /^img[_\s-]?3\.png$/i,
        /^image[_\s-]?3\.png$/i,
        /^img[_\s-]?3$/i,
        /^image[_\s-]?3$/i,
      ],
      image4: [
        /^img[_\s-]?4\.png$/i,
        /^image[_\s-]?4\.png$/i,
        /^img[_\s-]?4$/i,
        /^image[_\s-]?4$/i,
      ],

      // Icon layers - explicitly match icon patterns
      icon1: [
        /^icon[_\s-]?1\.png$/i, // icon_1.png
        /^icon[_\s-]?1$/i, // icon_1
        /^social[_\s-]?icon[_\s-]?1/i,
      ],
      icon2: [
        /^icon[_\s-]?2\.png$/i,
        /^icon[_\s-]?2$/i,
        /^social[_\s-]?icon[_\s-]?2/i,
      ],
      icon3: [/^icon[_\s-]?3\.png$/i, /^icon[_\s-]?3$/i],
      icon4: [/^icon[_\s-]?4\.png$/i, /^icon[_\s-]?4$/i],

      // Video layers
      video1: [
        /^video[_\s-]?1\.(mp4|mov|avi)$/i, // video_1.mp4
        /^video[_\s-]?1$/i, // video_1
        /^vid[_\s-]?1/i,
        /^main[_\s-]?video/i,
      ],
      video2: [
        /^video[_\s-]?2\.(mp4|mov|avi)$/i,
        /^video[_\s-]?2$/i,
        /^vid[_\s-]?2/i,
      ],

      // Background layer
      background: [
        /^background\.png$/i, // background.png
        /^background$/i, // background
        /^bg\.png$/i, // bg.png
        /^bg$/i, // bg
        /^backdrop/i,
      ],

      // Product image (special case for e-commerce templates)
      productImage: [/^product[_\s-]?image/i, /^product\.png$/i, /^product$/i],

      // Generic image field (used by template 8 with "image" field)
      image: [/^image\.png$/i, /^main[_\s-]?image$/i],
    };

    // Match layers to patterns with priority ordering
    for (const [fieldName, regexPatterns] of Object.entries(patterns)) {
      if (mapping[fieldName]) continue; // Skip if already mapped
      for (const pattern of regexPatterns) {
        for (const layer of layers) {
          if (pattern.test(layer.layerName)) {
            mapping[fieldName] = layer.layerName;
            this.logger.log(
              `✓ Matched ${fieldName} → "${layer.layerName}" (composition: ${layer.composition})`,
            );
            break;
          }
        }
        if (mapping[fieldName]) break;
      }
    }

    // Fallback: Find unmapped text layers (layers without file extensions that look like text)
    const mappedTextLayers = [
      mapping.text1,
      mapping.text2,
      mapping.text3,
      mapping.text4,
    ].filter(Boolean);
    const textSlots = ['text1', 'text2', 'text3', 'text4'];

    const potentialTextLayers = layers.filter(
      (l) =>
        // No file extension
        !l.layerName.match(/\.(png|jpg|jpeg|mp4|mov|mp3|wav|gif|webp)$/i) &&
        // Not already mapped
        !mappedTextLayers.includes(l.layerName) &&
        // Not a known non-text layer type
        !l.layerName
          .toLowerCase()
          .match(
            /^(background|bg|backdrop|adjustment|camera|shape|null|comp|precomp|sfx|audio|music|mod_item|box)/i,
          ) &&
        // Looks like a text layer (contains txt, text, or is a simple name)
        (l.layerName.toLowerCase().includes('txt') ||
          l.layerName.toLowerCase().includes('text') ||
          /^[a-z_\s-]+$/i.test(l.layerName)),
    );

    // Sort potential text layers by their number suffix if present
    potentialTextLayers.sort((a, b) => {
      const numA = a.layerName.match(/(\d+)/)?.[1];
      const numB = b.layerName.match(/(\d+)/)?.[1];
      if (numA && numB) return parseInt(numA) - parseInt(numB);
      return 0;
    });

    // Assign unmapped text layers to empty text slots
    for (const layer of potentialTextLayers) {
      const emptySlot = textSlots.find((slot) => !mapping[slot]);
      if (emptySlot) {
        mapping[emptySlot] = layer.layerName;
        this.logger.log(
          `✓ Auto-assigned ${emptySlot} → "${layer.layerName}" (fallback)`,
        );
      }
    }

    // Log any unmapped layers that might need manual mapping
    const allMappedLayers = Object.values(mapping);
    const unmappedLayers = layers.filter(
      (l) =>
        !allMappedLayers.includes(l.layerName) &&
        // Skip known system layers
        !l.layerName
          .toLowerCase()
          .match(
            /^(adjustment|camera|camera_ctrl|shape|null|sfx|audio|music|mod_item|box)/i,
          ),
    );

    if (unmappedLayers.length > 0) {
      this.logger.warn(
        `⚠ Unmapped layers for template ${templateId}:`,
        unmappedLayers.map((l) => `${l.layerName} (${l.composition})`),
      );
    }

    this.logger.log(
      `Final auto-generated layer mapping for template ${templateId}:`,
      mapping,
    );

    return mapping;
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

    this.logger.log(
      `Building assets for template ${templateId}`,
      `Layer mapping: ${JSON.stringify(layerMapping)}`,
    );
    this.logger.log(
      `DTO fields received:`,
      `text1=${dto.text1}, text2=${dto.text2}, text3=${dto.text3}, ` +
        `image1=${dto.image1}, image2=${dto.image2}, background=${dto.background}, ` +
        `icon1=${dto.icon1}, icon2=${dto.icon2}, video1=${dto.video1}`,
    );

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

    // Video replacements - use mapped layer names
    if (dto.video1) {
      const layerName = layerMapping.video1 || 'Video 1';
      assets.push({
        type: 'video',
        src: dto.video1,
        layerName,
      });
    }
    if (dto.video2) {
      const layerName = layerMapping.video2 || 'Video 2';
      assets.push({
        type: 'video',
        src: dto.video2,
        layerName,
      });
    }

    // Product image (single generic image field for e-commerce templates)
    if (dto.image) {
      const layerName =
        layerMapping.productImage || layerMapping.image || 'Product Image';
      assets.push({
        type: 'image',
        src: dto.image,
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
    // Log incoming DTO for debugging
    this.logger.log(
      `Creating render job for template ${templateId}`,
      `DTO received: ${JSON.stringify(dto, null, 2)}`,
    );

    // Ensure template is uploaded
    const hasCredits = await this.creditsService.hasEnoughCredits(userId, 1);

    if (!hasCredits) {
      throw new BadRequestException(
        'Insufficient credits. Please upgrade your plan.',
      );
    }

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

    // Log assets being sent for debugging
    this.logger.log(
      `Submitting render job with ${assets.length} assets:`,
      JSON.stringify(assets, null, 2),
    );

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
        creditsUsed: 1,
      },
    });

    // Deduct credit
    try {
      await this.creditsService.deductCredits(userId, 1, job.id);
      this.logger.log(
        `Deducted 1 credit from user ${userId} for job ${job.id}`,
      );
    } catch (error) {
      await this.prisma.renderJob.delete({ where: { id: job.id } });
      throw error;
    }

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
            timeout: 60000,
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

        // ✅ REFUND CREDITS ON UPLOAD FAILURE
        try {
          await this.creditsService.refundCredits(
            job.userId,
            job.creditsUsed,
            job.id,
          );
          this.logger.log(
            `Refunded ${job.creditsUsed} credit(s) for failed upload on job ${job.id}`,
          );
        } catch (refundError) {
          this.logger.error('Failed to refund credits:', refundError);
        }

        // Store error
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
      // ✅ REFUND CREDITS ON RENDER FAILURE
      this.logger.error(`Render job failed: ${nexrenderJobId}`, { error });

      await this.prisma.renderJob.update({
        where: { id: job.id },
        data: {
          status: RenderStatus.FAILED,
          error: error || 'Render failed',
        },
      });

      // Refund credits
      try {
        await this.creditsService.refundCredits(
          job.userId,
          job.creditsUsed,
          job.id,
        );
        this.logger.log(
          `Refunded ${job.creditsUsed} credit(s) for failed render on job ${job.id}`,
        );
      } catch (refundError) {
        this.logger.error('Failed to refund credits:', refundError);
      }
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
   * Manually update layer mapping for a template
   */
  async updateLayerMapping(
    templateId: number,
    layerMapping: Record<string, string>,
  ): Promise<{
    templateId: number;
    layerMapping: Record<string, string>;
  }> {
    await this.prisma.nexrenderTemplate.update({
      where: { templateId },
      data: {
        layerMapping: layerMapping as any,
      },
    });

    this.logger.log(
      `Layer mapping updated for template ${templateId}:`,
      layerMapping,
    );

    return {
      templateId,
      layerMapping,
    };
  }

  /**
   * Regenerate layer mapping for a template using auto-detection
   */
  async regenerateLayerMapping(templateId: number): Promise<{
    templateId: number;
    layerMapping: Record<string, string>;
    layers: Array<{ layerName: string; composition: string }>;
  }> {
    const template = await this.prisma.nexrenderTemplate.findUnique({
      where: { templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    const layers =
      (template.layers as Array<{
        layerName: string;
        composition: string;
      }>) || [];

    if (layers.length === 0) {
      throw new BadRequestException(
        `Template ${templateId} has no layers to generate mapping from`,
      );
    }

    // Regenerate mapping using the updated auto-detection logic
    const newMapping = this.autoGenerateLayerMapping(layers, templateId);

    // Update in database
    await this.prisma.nexrenderTemplate.update({
      where: { templateId },
      data: {
        layerMapping: newMapping as any,
      },
    });

    this.logger.log(
      `✓ Layer mapping regenerated for template ${templateId}:`,
      newMapping,
    );

    return {
      templateId,
      layerMapping: newMapping,
      layers,
    };
  }

  /**
   * Regenerate layer mappings for all templates
   */
  async regenerateAllLayerMappings(): Promise<
    Array<{
      templateId: number;
      success: boolean;
      layerMapping?: Record<string, string>;
      error?: string;
    }>
  > {
    const templates = await this.prisma.nexrenderTemplate.findMany({
      orderBy: { templateId: 'asc' },
    });

    const results: Array<{
      templateId: number;
      success: boolean;
      layerMapping?: Record<string, string>;
      error?: string;
    }> = [];

    for (const template of templates) {
      try {
        const result = await this.regenerateLayerMapping(template.templateId);
        results.push({
          templateId: template.templateId,
          success: true,
          layerMapping: result.layerMapping,
        });
      } catch (error) {
        results.push({
          templateId: template.templateId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    this.logger.log(
      `Layer mapping regeneration completed for ${results.length} templates`,
    );

    return results;
  }

  /**
   * Delete a template from Nexrender Cloud
   */
  async deleteTemplateFromNexrender(nexrenderId: string): Promise<boolean> {
    try {
      this.logger.log(`Deleting template from Nexrender: ${nexrenderId}`);

      await firstValueFrom(
        this.httpService.delete(
          `${this.nexrenderApiUrl}/templates/${nexrenderId}`,
          {
            headers: {
              Authorization: `Bearer ${this.nexrenderApiKey}`,
            },
          },
        ),
      );

      this.logger.log(`✅ Template ${nexrenderId} deleted from Nexrender`);
      return true;
    } catch (error: unknown) {
      const errorResponse = (error as any)?.response;
      this.logger.error('Failed to delete template from Nexrender', {
        nexrenderId,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: errorResponse?.status,
        data: errorResponse?.data,
      });

      // If template not found (404), consider it already deleted
      if (errorResponse?.status === 404) {
        this.logger.warn(
          `Template ${nexrenderId} not found in Nexrender (may already be deleted)`,
        );
        return true;
      }

      throw new BadRequestException(
        `Failed to delete template: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Delete a template by templateId (from both Nexrender and database)
   */
  async deleteTemplate(templateId: number): Promise<{
    success: boolean;
    deletedFromNexrender: boolean;
    deletedFromDatabase: boolean;
    error?: string;
  }> {
    try {
      // Get template from database
      const template = await this.prisma.nexrenderTemplate.findUnique({
        where: { templateId },
      });

      let deletedFromNexrender = false;
      let deletedFromDatabase = false;

      // Delete from Nexrender if nexrenderId exists
      if (template?.nexrenderId) {
        try {
          await this.deleteTemplateFromNexrender(template.nexrenderId);
          deletedFromNexrender = true;
        } catch (error) {
          this.logger.warn(
            `Failed to delete template ${templateId} from Nexrender, continuing with database deletion`,
          );
        }
      }

      // Delete from database
      if (template) {
        await this.prisma.nexrenderTemplate.delete({
          where: { templateId },
        });
        deletedFromDatabase = true;
        this.logger.log(`✅ Template ${templateId} deleted from database`);
      } else {
        this.logger.warn(`Template ${templateId} not found in database`);
      }

      return {
        success: true,
        deletedFromNexrender,
        deletedFromDatabase,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to delete template ${templateId}:`,
        errorMessage,
      );
      return {
        success: false,
        deletedFromNexrender: false,
        deletedFromDatabase: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Delete all templates from Nexrender Cloud and database
   */
  async deleteAllTemplates(): Promise<
    Array<{
      templateId: number;
      success: boolean;
      deletedFromNexrender: boolean;
      deletedFromDatabase: boolean;
      error?: string;
    }>
  > {
    const results: Array<{
      templateId: number;
      success: boolean;
      deletedFromNexrender: boolean;
      deletedFromDatabase: boolean;
      error?: string;
    }> = [];

    // Get all templates from database
    const templates = await this.prisma.nexrenderTemplate.findMany({
      select: {
        templateId: true,
        nexrenderId: true,
      },
    });

    this.logger.log(`Found ${templates.length} templates to delete`);

    for (const template of templates) {
      try {
        this.logger.log(`Deleting template ${template.templateId}...`);

        const result = await this.deleteTemplate(template.templateId);
        results.push({
          templateId: template.templateId,
          ...result,
        });

        // Small delay between deletions to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Failed to delete template ${template.templateId}: ${errorMessage}`,
        );
        results.push({
          templateId: template.templateId,
          success: false,
          deletedFromNexrender: false,
          deletedFromDatabase: false,
          error: errorMessage,
        });
      }
    }

    return results;
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

    // Find all .aep and .zip files in animations folder
    const files = await fs.readdir(this.animationsPath);
    const templateFiles = files.filter(
      (f) => f.endsWith('.aep') || f.endsWith('.zip'),
    );

    this.logger.log(
      `Found ${templateFiles.length} template files (.aep/.zip) to upload`,
    );

    for (const file of templateFiles) {
      // Extract template ID from filename
      // Matches: "Animation 1.aep", "Animation_1.zip", "Animation1.aep", etc.
      const match = file.match(/Animation[_\s]*(\d+)\.(aep|zip)/i);
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
