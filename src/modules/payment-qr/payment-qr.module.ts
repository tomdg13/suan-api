import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentQr } from './entities/payment-qr.entity';
import { PaymentQrService } from './payment-qr.service';
import { PaymentQrController } from './payment-qr.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentQr])],
  controllers: [PaymentQrController],
  providers: [PaymentQrService],
  exports: [TypeOrmModule],
})
export class PaymentQrModule {}
