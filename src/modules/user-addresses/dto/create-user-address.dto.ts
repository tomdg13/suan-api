import { IsInt, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class CreateUserAddressDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsString()
  recipientName: string;

  @IsString()
  phone: string;

  @IsString()
  addressLine: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  isDefault?: number;
}
