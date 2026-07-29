import { IsInt, IsOptional, IsEnum } from 'class-validator';
import { PaymentMethod } from '../entities/order.entity';

export class CheckoutDto {
  @IsInt()
  addressId: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsInt()
  promotionId?: number;
}
