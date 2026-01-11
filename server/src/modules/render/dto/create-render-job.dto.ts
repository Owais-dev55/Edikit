import {
  IsString,
  IsOptional,
  IsObject,
  ValidateNested,
  IsHexColor,
} from 'class-validator';
import { Type } from 'class-transformer';

class ColorCustomization {
  @IsOptional()
  @IsString()
  @IsHexColor()
  primary?: string;

  @IsOptional()
  @IsString()
  @IsHexColor()
  secondary?: string;

  @IsOptional()
  @IsString()
  @IsHexColor()
  accent?: string;

  @IsOptional()
  @IsString()
  @IsHexColor()
  background?: string;

  @IsOptional()
  @IsString()
  @IsHexColor()
  text?: string;
}

export class CreateRenderJobDto {
  // Text fields - support both frontend naming and backend naming
  @IsOptional()
  @IsString()
  text1?: string;

  @IsOptional()
  @IsString()
  text2?: string;

  @IsOptional()
  @IsString()
  text3?: string;

  @IsOptional()
  @IsString()
  text4?: string;

  // Frontend-friendly field names (will map to text1, text2, text3)
  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  subheadline?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Image fields - support multiple image uploads
  @IsOptional()
  @IsString()
  image1?: string; // Cloudinary URL after upload

  @IsOptional()
  @IsString()
  image2?: string;

  @IsOptional()
  @IsString()
  image3?: string;

  @IsOptional()
  @IsString()
  image4?: string;

  @IsOptional()
  @IsString()
  image5?: string;

  // Logo field (maps to image1)
  @IsOptional()
  @IsString()
  logo?: string;

  // Icon fields
  @IsOptional()
  @IsString()
  icon1?: string;

  @IsOptional()
  @IsString()
  icon2?: string;

  @IsOptional()
  @IsString()
  icon3?: string;

  @IsOptional()
  @IsString()
  icon4?: string;

  @IsOptional()
  @IsString()
  icon5?: string;

  // Video fields
  @IsOptional()
  @IsString()
  video1?: string;

  @IsOptional()
  @IsString()
  video2?: string;

  // Product image (for e-commerce templates, mapped to productImage or image)
  @IsOptional()
  @IsString()
  image?: string;

  // Background
  @IsOptional()
  @IsString()
  background?: string;

  // Color customizations
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ColorCustomization)
  colors?: ColorCustomization;
}
