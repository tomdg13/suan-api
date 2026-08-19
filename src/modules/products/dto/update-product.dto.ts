import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsInt()
  unitId?: number;

  @IsOptional()
  @IsInt()
  providerId?: number;

  @IsOptional()
  @IsString()
  nameLao?: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  basePrice?: number;

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

  // 1 = visible to buyers, 0 = hidden
  @IsOptional()
  @IsInt()
  isActive?: number;
}
