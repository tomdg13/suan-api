import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @IsString()
  nameLao: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;
}
