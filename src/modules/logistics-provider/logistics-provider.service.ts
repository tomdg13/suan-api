import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogisticsProvider } from './entities/logistics-provider.entity';
import { CreateLogisticsProviderDto } from './dto/create-logistics-provider.dto';
import { UpdateLogisticsProviderDto } from './dto/update-logistics-provider.dto';

@Injectable()
export class LogisticsProviderService {
  constructor(
    @InjectRepository(LogisticsProvider)
    private repo: Repository<LogisticsProvider>,
  ) {}

  findActive() {
    return this.repo.find({
      where: { is_active: true },
      order: { sort_order: 'ASC', id: 'ASC' },
    });
  }

  findAll() {
    return this.repo.find({ order: { sort_order: 'ASC', id: 'ASC' } });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Logistics provider not found');
    return item;
  }

  create(dto: CreateLogisticsProviderDto, filename?: string) {
    const entity = this.repo.create({
      ...dto,
      logo_url: filename ? `/uploads/logistics-providers/${filename}` : dto.logo_url,
    } as Partial<LogisticsProvider>);
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateLogisticsProviderDto, filename?: string) {
    await this.findOne(id);
    const patch: Partial<LogisticsProvider> = { ...dto } as Partial<LogisticsProvider>;
    if (filename) patch.logo_url = `/uploads/logistics-providers/${filename}`;
    await this.repo.update(id, patch);
    return this.findOne(id);
  }

  async reorder(items: { id: number; sortOrder: number }[]) {
    await Promise.all(
      items.map((item) =>
        this.repo.update(item.id, { sort_order: item.sortOrder }),
      ),
    );
    return this.findAll();
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { success: true };
  }

  async toggleActive(id: number) {
    const item = await this.findOne(id);
    await this.repo.update(id, { is_active: !item.is_active });
    return this.findOne(id);
  }
}
