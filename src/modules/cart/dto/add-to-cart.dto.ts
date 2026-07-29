import { IsInt, IsNumber, IsOptional } from 'class-validator';

export class AddToCartDto {
  @IsInt()
  productId: number;

  @IsOptional()
  @IsInt()
  variantId?: number;

  @IsNumber()
  qty: number;
}
