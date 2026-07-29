import { IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateBannerDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  // 1 = visible on the storefront, 0 = hidden
  @IsOptional()
  @IsInt()
  isActive?: number;
}
