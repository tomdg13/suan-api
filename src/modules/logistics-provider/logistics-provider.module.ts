import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogisticsProvider } from './entities/logistics-provider.entity';
import { LogisticsProviderService } from './logistics-provider.service';
import { LogisticsProviderController } from './logistics-provider.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LogisticsProvider])],
  controllers: [LogisticsProviderController],
  providers: [LogisticsProviderService],
  exports: [LogisticsProviderService, TypeOrmModule],
})
export class LogisticsProviderModule {}
