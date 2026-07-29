import { IsOptional, IsString } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  storeName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
