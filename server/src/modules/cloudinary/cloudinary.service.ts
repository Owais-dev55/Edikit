import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface UploadOptions {
  folder?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  public_id?: string;
  overwrite?: boolean;
  invalidate?: boolean;
}

export interface UploadResult {
  url: string;
  public_id: string;
  secure_url: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  duration?: number; // For videos
}

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload file buffer to Cloudinary
   */
  async uploadFile(
    buffer: Buffer,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: options.resource_type || 'auto',
          folder: options.folder || 'edikit',
          public_id: options.public_id,
          overwrite: options.overwrite || false,
          invalidate: options.invalidate || true,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.url,
              public_id: result.public_id,
              secure_url: result.secure_url,
              format: result.format || '',
              width: result.width,
              height: result.height,
              bytes: result.bytes || 0,
              duration: result.duration, // For videos
            });
          } else {
            reject(new Error('Upload failed: No result returned'));
          }
        },
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Upload file from URL (useful for Nexrender outputs)
   */
  async uploadFromUrl(
    url: string,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    const result = await cloudinary.uploader.upload(url, {
      resource_type: options.resource_type || 'video',
      folder: options.folder || 'edikit/renders',
      public_id: options.public_id,
      overwrite: options.overwrite || false,
      invalidate: options.invalidate || true,
    });

    return {
      url: result.url,
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format || '',
      width: result.width,
      height: result.height,
      bytes: result.bytes || 0,
      duration: result.duration,
    };
  }

  /**
   * Upload user asset (image/video) for customization
   */
  async uploadAsset(
    file: Express.Multer.File,
    userId: string,
    assetType: 'image' | 'video' = 'image',
  ): Promise<UploadResult> {
    const folder = `edikit/uploads/${userId}`;
    const resourceType = assetType === 'video' ? 'video' : 'image';

    return this.uploadFile(file.buffer, {
      folder,
      resource_type: resourceType,
      overwrite: true,
    });
  }

  /**
   * Upload rendered video
   */
  async uploadRenderedVideo(
    buffer: Buffer,
    userId: string,
    jobId: string,
  ): Promise<UploadResult> {
    const folder = `edikit/renders/${userId}`;
    const publicId = `${folder}/${jobId}`;

    return this.uploadFile(buffer, {
      folder,
      public_id: publicId,
      resource_type: 'video',
      overwrite: true,
    });
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' = 'image',
  ): Promise<void> {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  }

  /**
   * Get optimized video URL with transformations
   */
  getOptimizedVideoUrl(
    publicId: string,
    options?: {
      width?: number;
      height?: number;
      quality?: 'auto' | number;
      format?: 'mp4' | 'webm';
    },
  ): string {
    const transformations: string[] = [];

    if (options?.width) transformations.push(`w_${options.width}`);
    if (options?.height) transformations.push(`h_${options.height}`);
    if (options?.quality) {
      transformations.push(`q_${options.quality}`);
    } else {
      transformations.push('q_auto'); // Auto quality optimization
    }
    if (options?.format) {
      transformations.push(`f_${options.format}`);
    }

    return cloudinary.url(publicId, {
      resource_type: 'video',
      transformation: transformations,
      secure: true,
    });
  }

  /**
   * Get optimized image URL
   */
  getOptimizedImageUrl(
    publicId: string,
    options?: {
      width?: number;
      height?: number;
      quality?: 'auto' | number;
    },
  ): string {
    const transformations: string[] = [];

    if (options?.width) transformations.push(`w_${options.width}`);
    if (options?.height) transformations.push(`h_${options.height}`);
    if (options?.quality) {
      transformations.push(`q_${options.quality}`);
    } else {
      transformations.push('q_auto');
    }

    return cloudinary.url(publicId, {
      resource_type: 'image',
      transformation: transformations,
      secure: true,
    });
  }
}
