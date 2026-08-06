import { IsInt, IsOptional, IsEnum, IsString } from 'class-validator';
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

  @IsOptional()
  @IsEnum(['delivery', 'pickup'])
  deliveryMethod?: 'delivery' | 'pickup';

  // Name of the logistics company handling delivery, e.g. "Anousith Logistic".
  // Only meaningful when deliveryMethod is 'delivery'.
  @IsOptional()
  @IsString()
  courierName?: string;
}
