import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductStockLog } from './entities/product-stock-log.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { LogisticsProvider } from '../logistics-provider/entities/logistics-provider.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductVariant,
      ProductImage,
      ProductStockLog,
      LogisticsProvider,
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [TypeOrmModule, ProductsService],
})
export class ProductsModule {}
