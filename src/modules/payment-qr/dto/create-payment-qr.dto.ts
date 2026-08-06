import { IsOptional, IsString } from 'class-validator';

export class CreatePaymentQrDto {
  @IsOptional()
  @IsString()
  title?: string;
}
