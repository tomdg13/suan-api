import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingWeightTier } from './shipping-tier.entity';
import { ShippingTiersService } from './shipping-tiers.service';
import { ShippingTiersController } from './shipping-tiers.controller';
import { LogisticsProvider } from '../logistics-provider/entities/logistics-provider.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShippingWeightTier, LogisticsProvider, Product]),
  ],
  controllers: [ShippingTiersController],
  providers: [ShippingTiersService],
  exports: [ShippingTiersService],
})
export class ShippingTiersModule {}
