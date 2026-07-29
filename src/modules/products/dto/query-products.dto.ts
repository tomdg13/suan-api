import { IsOptional, IsInt, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  storeId?: number;

  @IsOptional()
  @IsString()
  search?: string;

  // Set true for the seller's own management view, so hidden
  // (isActive=0) products still show up and can be un-hidden.
  // Public/buyer browsing should never set this.
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeHidden?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 20;
}
