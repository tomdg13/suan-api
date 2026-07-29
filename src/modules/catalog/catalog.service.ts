import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Unit } from './entities/unit.entity';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Unit) private readonly unitRepo: Repository<Unit>,
  ) {}

  findAllCategories() {
    return this.categoryRepo.find({ where: { isActive: 1 }, order: { sortOrder: 'ASC' } });
  }

  findAllUnits() {
    return this.unitRepo.find();
  }
}
