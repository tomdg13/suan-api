import { IsString, IsEnum, IsNumber, IsOptional, IsInt, Min, MaxLength } from 'class-validator';
import { FeeType } from '../entities/fee-config.entity';

export class CreateFeeConfigDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsEnum(FeeType)
  type: FeeType;

  @IsNumber()
  @Min(0)
  value: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsInt()
  isActive?: number;
}
