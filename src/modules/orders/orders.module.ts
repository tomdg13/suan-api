import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { CartModule } from '../cart/cart.module';
import { FeesModule } from '../fees/fees.module';
import { ShippingTiersModule } from '../shipping-tiers/shipping-tiers.module';
import { LogisticsProviderModule } from '../logistics-provider/logistics-provider.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    CartModule,
    FeesModule,
    ShippingTiersModule,
    LogisticsProviderModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [TypeOrmModule, OrdersService],
})
export class OrdersModule {}
