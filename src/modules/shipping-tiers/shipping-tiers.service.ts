import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingWeightTier } from './shipping-tier.entity';
import { CreateShippingTierDto } from './dto/create-shipping-tier.dto';
import { UpdateShippingTierDto } from './dto/update-shipping-tier.dto';
import { LogisticsProvider } from '../logistics-provider/entities/logistics-provider.entity';
import { Product } from '../products/entities/product.entity';

const MAX_TIERS_PER_PRODUCT = 10;

@Injectable()
export class ShippingTiersService {
  constructor(
    @InjectRepository(ShippingWeightTier)
    private readonly tierRepo: Repository<ShippingWeightTier>,
    @InjectRepository(LogisticsProvider)
    private readonly providerRepo: Repository<LogisticsProvider>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(): Promise<ShippingWeightTier[]> {
    return this.tierRepo.find({
      relations: ['provider', 'product'],
      order: { productId: 'ASC', sortOrder: 'ASC', minWeight: 'ASC' },
    });
  }

  // Public - buyer/cart screens use this for a live fee estimate.
  async findActiveTiers(): Promise<ShippingWeightTier[]> {
    return this.tierRepo.find({
      where: { isActive: 1 as any },
      relations: ['provider', 'product'],
      order: { productId: 'ASC', minWeight: 'ASC' },
    });
  }

  // Public - a product's own tiers (buyer product page, seller's
  // product form preview).
  async findByProduct(productId: number): Promise<ShippingWeightTier[]> {
    return this.tierRepo.find({
      where: { productId, isActive: 1 as any },
      order: { minWeight: 'ASC' },
    });
  }

  // Verifies the requester owns the store that owns this product (or is
  // admin), and that the product's chosen provider actually allows
  // seller-managed weight tiers. Returns the loaded product for reuse.
  private async assertCanManageTiers(
    productId: number,
    requesterId: number,
    requesterRole: string,
  ): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['store'],
    });
    if (!product) throw new NotFoundException('ບໍ່ພົບສິນຄ້າ');
    if (product.store.ownerId !== requesterId && requesterRole !== 'admin') {
      throw new ForbiddenException('You do not own this product');
    }
    if (!product.providerId) {
      throw new BadRequestException('ກະລຸນາເລືອກຜູ້ໃຫ້ບໍລິການຂົນສົ່ງກ່ອນຕັ້ງຄ່າຂັ້ນ');
    }
    const provider = await this.providerRepo.findOne({ where: { id: product.providerId } });
    if (!provider || !provider.allow_weight_tiers) {
      throw new BadRequestException(
        'ຜູ້ໃຫ້ບໍລິການນີ້ບໍ່ໄດ້ເປີດໃຫ້ຕັ້ງຄ່າສົ່ງຕາມນ້ຳໜັກ/ຂະໜາດ',
      );
    }
    return product;
  }

  async create(
    dto: CreateShippingTierDto,
    requesterId: number,
    requesterRole: string,
  ): Promise<ShippingWeightTier> {
    const product = await this.assertCanManageTiers(dto.productId, requesterId, requesterRole);

    const count = await this.tierRepo.count({ where: { productId: dto.productId } });
    if (count >= MAX_TIERS_PER_PRODUCT) {
      throw new BadRequestException(
        `ອະນຸຍາດສູງສຸດ ${MAX_TIERS_PER_PRODUCT} ຂັ້ນ ຕໍ່ສິນຄ້າ (maximum ${MAX_TIERS_PER_PRODUCT} tiers per product)`,
      );
    }
    if (dto.maxWeight != null && dto.maxWeight <= dto.minWeight) {
      throw new BadRequestException('max value must be greater than min value');
    }
    const tier = this.tierRepo.create({
      ...dto,
      providerId: product.providerId,
    } as Partial<ShippingWeightTier>);
    return this.tierRepo.save(tier);
  }

  async update(
    id: number,
    dto: UpdateShippingTierDto,
    requesterId: number,
    requesterRole: string,
  ): Promise<ShippingWeightTier> {
    const tier = await this.tierRepo.findOne({ where: { id } });
    if (!tier) throw new NotFoundException('Tier not found');
    if (!tier.productId) throw new BadRequestException('Legacy tier has no product link');

    await this.assertCanManageTiers(tier.productId, requesterId, requesterRole);

    Object.assign(tier, dto);
    if (tier.maxWeight != null && Number(tier.maxWeight) <= Number(tier.minWeight)) {
      throw new BadRequestException('max value must be greater than min value');
    }
    return this.tierRepo.save(tier);
  }

  async remove(id: number, requesterId: number, requesterRole: string): Promise<void> {
    const tier = await this.tierRepo.findOne({ where: { id } });
    if (!tier) throw new NotFoundException('Tier not found');
    if (tier.productId) {
      await this.assertCanManageTiers(tier.productId, requesterId, requesterRole);
    }
    await this.tierRepo.delete(id);
  }

  // Matches a single metric's tiers (already filtered to one product) against
  // a value. Returns null if nothing in this metric applies.
  private matchMetric(
    tiers: ShippingWeightTier[],
    metric: 'weight' | 'size',
    value: number,
  ): { price: number; tier: ShippingWeightTier } | null {
    const filtered = tiers.filter((t) => t.metric === metric);
    if (filtered.length === 0) return null;
    for (const tier of filtered) {
      const withinMin = value >= Number(tier.minWeight);
      const withinMax = tier.maxWeight == null || value <= Number(tier.maxWeight);
      if (withinMin && withinMax) return { price: tier.price, tier };
    }
    const last = filtered[filtered.length - 1];
    return { price: last.price, tier: last };
  }

  // Given a specific product and its weight (kg) + size (cm), returns
  // the fee to charge. If BOTH weight and size tiers exist and both
  // match, the higher fee is charged (safer default).
  async calculateFeeForProduct(
    productId: number,
    weightKg: number,
    sizeCm: number,
  ): Promise<{ price: number }> {
    const tiers = await this.findByProduct(productId);
    if (tiers.length === 0) return { price: 0 };

    const byWeight = this.matchMetric(tiers, 'weight', weightKg);
    const bySize = this.matchMetric(tiers, 'size', sizeCm);

    const candidates = [byWeight?.price, bySize?.price].filter(
      (p): p is number => p != null,
    );
    if (candidates.length === 0) return { price: 0 };
    return { price: Math.max(...candidates) };
  }
}
