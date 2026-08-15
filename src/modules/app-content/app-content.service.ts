import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppContent } from './app-content.entity';

@Injectable()
export class AppContentService {
  constructor(
    @InjectRepository(AppContent)
    private readonly repo: Repository<AppContent>,
  ) {}

  async findAll(): Promise<AppContent[]> {
    return this.repo.find();
  }

  async findByKey(key: string): Promise<AppContent | null> {
    return this.repo.findOne({ where: { key } });
  }

  async upsert(key: string, value: string): Promise<AppContent> {
    let row = await this.repo.findOne({ where: { key } });
    if (!row) {
      row = this.repo.create({ key, value });
    } else {
      row.value = value;
    }
    return this.repo.save(row);
  }
}
