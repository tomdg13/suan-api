import { IsInt, IsNumber, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class VariantDto {
  @IsString()
  variantLabel: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  stockQty?: number;

  @IsOptional()
  isDefault?: boolean;
}

export class CreateProductDto {
  @IsInt()
  categoryId: number;

  @IsInt()
  unitId: number;

  @IsOptional()
  @IsInt()
  providerId?: number;

  @IsString()
  nameLao: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  basePrice: number;

  @IsOptional()
  @IsNumber()
  stockQty?: number;

  // weight in kg, used to calculate shipping fee tiers
  @IsOptional()
  @IsNumber()
  weight?: number;

  // size in cm, used to calculate size-based shipping fee tiers
  @IsOptional()
  @IsNumber()
  sizeCm?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants?: VariantDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}
