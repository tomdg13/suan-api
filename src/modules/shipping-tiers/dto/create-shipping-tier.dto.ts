import { IsIn, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
export class CreateShippingTierDto {
  @IsInt()
  productId: number;
  @IsIn(['weight', 'size'])
  metric: 'weight' | 'size';
  // Threshold value in the chosen metric's unit (kg for weight, cm for size).
  @IsNumber()
  @Min(0)
  minWeight: number;
  // Leave undefined/null on the LAST tier for "and above" (open-ended)
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxWeight?: number | null;
  @IsNumber()
  @Min(0)
  price: number;
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
