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

  // ID of the selected logistics_provider row (image 1's radio list:
  // HAL Express / Anousith / store pickup / deliver-to-your-address).
  // Determines how the delivery fee is calculated.
  @IsOptional()
  @IsInt()
  providerId?: number;

  // Kept for backward compatibility / display only - no longer drives pricing.
  @IsOptional()
  @IsString()
  courierName?: string;
}
