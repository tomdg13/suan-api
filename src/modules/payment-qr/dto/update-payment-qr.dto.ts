import { IsOptional, IsString, IsInt } from 'class-validator';

export class UpdatePaymentQrDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  isActive?: number;
}
