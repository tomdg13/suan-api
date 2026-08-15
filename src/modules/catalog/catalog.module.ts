import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Unit } from './entities/unit.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Unit, SystemSetting])],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [TypeOrmModule],
})
export class CatalogModule {}
