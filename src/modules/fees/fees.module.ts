import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeConfig } from './entities/fee-config.entity';
import { OrderFee } from './entities/order-fee.entity';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FeeConfig, OrderFee])],
  controllers: [FeesController],
  providers: [FeesService],
  exports: [FeesService, TypeOrmModule],
})
export class FeesModule {}
