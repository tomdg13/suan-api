import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppContent } from './app-content.entity';
import { AppContentService } from './app-content.service';
import { AppContentController } from './app-content.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AppContent])],
  controllers: [AppContentController],
  providers: [AppContentService],
  exports: [AppContentService],
})
export class AppContentModule {}
