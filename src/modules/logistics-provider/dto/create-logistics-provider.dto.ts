import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { LogisticsType } from '../entities/logistics-provider.entity';
export class CreateLogisticsProviderDto {
  @IsString()
  @MaxLength(255)
  name: string;
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
  @IsIn(['logistic', 'customer_courier', 'store_pickup'])
  type: LogisticsType;
  @IsOptional()
  @IsString()
  logo_url?: string;
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
  @IsOptional()
  @IsInt()
  sort_order?: number;
  @IsOptional()
  @IsBoolean()
  allow_weight_tiers?: boolean;
}
