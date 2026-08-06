import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDatabaseConfig } from './config/database.config';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StoresModule } from './modules/stores/stores.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { BannersModule } from './modules/banners/banners.module';
import { PaymentQrModule } from './modules/payment-qr/payment-qr.module';
import { UserAddressesModule } from './modules/user-addresses/user-addresses.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: buildDatabaseConfig,
    }),
    AuthModule,
    UsersModule,
    StoresModule,
    CatalogModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    ReviewsModule,
    DashboardModule,
    BannersModule,
    PaymentQrModule,
    UserAddressesModule,
  ],
})
export class AppModule {}
