import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepo: Repository<CartItem>,
  ) {}

  async addItem(userId: number, dto: AddToCartDto) {
    const existing = await this.cartRepo.findOne({
      where: { userId, productId: dto.productId, variantId: dto.variantId ?? null },
    });
    if (existing) {
      existing.qty = Number(existing.qty) + Number(dto.qty);
      return this.cartRepo.save(existing);
    }
    const item = this.cartRepo.create({ userId, ...dto });
    return this.cartRepo.save(item);
  }

  // Returns cart items grouped by store (needed for multi-vendor checkout)
  async getCartGroupedByStore(userId: number) {
    const items = await this.cartRepo.find({
      where: { userId },
      relations: ['product', 'product.store', 'product.images', 'variant'],
    });

    const grouped: Record<number, { store: any; items: CartItem[] }> = {};
    for (const item of items) {
      const storeId = item.product.storeId;
      if (!grouped[storeId]) {
        grouped[storeId] = { store: item.product.store, items: [] };
      }
      grouped[storeId].items.push(item);
    }
    return Object.values(grouped);
  }

  async updateQty(userId: number, itemId: number, qty: number) {
    await this.cartRepo.update({ id: itemId, userId }, { qty });
    return this.cartRepo.findOne({ where: { id: itemId } });
  }

  async removeItem(userId: number, itemId: number) {
    await this.cartRepo.delete({ id: itemId, userId });
    return { deleted: true };
  }

  async clearForStore(userId: number, storeId: number) {
    await this.cartRepo
      .createQueryBuilder()
      .delete()
      .where('user_id = :userId', { userId })
      .andWhere(
        `product_id IN (SELECT id FROM products WHERE store_id = :storeId)`,
        { storeId },
      )
      .execute();
  }
}
