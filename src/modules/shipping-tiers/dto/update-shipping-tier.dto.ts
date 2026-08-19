import { PartialType } from '@nestjs/mapped-types';
import { CreateShippingTierDto } from './create-shipping-tier.dto';

export class UpdateShippingTierDto extends PartialType(CreateShippingTierDto) {}
