import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { FeeConfig, FeeType } from './entities/fee-config.entity';
import { OrderFee } from './entities/order-fee.entity';
import { CreateFeeConfigDto } from './dto/create-fee-config.dto';
import { UpdateFeeConfigDto } from './dto/update-fee-config.dto';

export interface FeeLine {
  feeConfigId: number | null;
  name: string;
  type: FeeType;
  value: number;
  amount: number;
}

@Injectable()
export class FeesService {
  constructor(
    @InjectRepository(FeeConfig)
    private readonly feeConfigRepo: Repository<FeeConfig>,
  ) {}

  findActive() {
    return this.feeConfigRepo.find({
      where: { isActive: 1 },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  findAll() {
    return this.feeConfigRepo.find({ order: { sortOrder: 'ASC', id: 'ASC' } });
  }

  async findOne(id: number) {
    const fee = await this.feeConfigRepo.findOne({ where: { id } });
    if (!fee) throw new NotFoundException(`fee_configs ${id} not found`);
    return fee;
  }

  create(dto: CreateFeeConfigDto) {
    const fee = this.feeConfigRepo.create({
      name: dto.name,
      type: dto.type,
      value: dto.value,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? 1,
    });
    return this.feeConfigRepo.save(fee);
  }

  async update(id: number, dto: UpdateFeeConfigDto) {
    await this.findOne(id);
    await this.feeConfigRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const fee = await this.findOne(id);
    await this.feeConfigRepo.delete(id);
    return fee;
  }

  computeFeeLines(configs: FeeConfig[], subtotal: number): FeeLine[] {
    return configs.map((cfg) => {
      const value = Number(cfg.value);
      const amount = cfg.type === FeeType.PERCENT ? Math.round((subtotal * value) / 100) : Math.round(value);
      return {
        feeConfigId: cfg.id,
        name: cfg.name,
        type: cfg.type,
        value,
        amount,
      };
    });
  }

  async preview(subtotal: number) {
    const configs = await this.findActive();
    const fees = this.computeFeeLines(configs, subtotal);
    const feesTotal = fees.reduce((sum, f) => sum + f.amount, 0);
    return { subtotal, fees, feesTotal, total: subtotal + feesTotal };
  }

  async persistLines(manager: EntityManager, orderId: number, lines: FeeLine[]): Promise<void> {
    if (!lines.length) return;
    const rows = lines.map((line) =>
      manager.create(OrderFee, {
        orderId,
        feeConfigId: line.feeConfigId,
        name: line.name,
        type: line.type,
        value: line.value,
        amount: line.amount,
      }),
    );
    await manager.save(rows);
  }
}
