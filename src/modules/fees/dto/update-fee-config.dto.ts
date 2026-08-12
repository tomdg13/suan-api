import { IsString, IsEnum, IsNumber, IsOptional, IsInt, Min, MaxLength } from 'class-validator';
import { FeeType } from '../entities/fee-config.entity';

export class UpdateFeeConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsEnum(FeeType)
  type?: FeeType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsInt()
  isActive?: number;
}
