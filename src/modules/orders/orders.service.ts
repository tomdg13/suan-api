import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartService } from '../cart/cart.service';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { CheckoutDto } from './dto/checkout.dto';

const DEFAULT_DELIVERY_FEE = 20000; // LAK, flat fee per store shipment — adjust per your logistics rules

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepo: Repository<OrderItem>,
    private readonly cartService: CartService,
    private readonly dataSource: DataSource,
  ) {}

  private generateOrderCode(storeId: number): string {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${datePart}-${storeId}-${randomPart}`;
  }

  /**
   * Checkout splits the user's cart into ONE ORDER PER STORE
   * (matches multi-vendor marketplace pattern — each seller manages
   * their own order/delivery/payout independently).
   */
  async checkout(userId: number, dto: CheckoutDto) {
    const grouped = await this.cartService.getCartGroupedByStore(userId);
    if (!grouped.length) {
      throw new BadRequestException('Cart is empty');
    }

    const createdOrders: Order[] = [];

    await this.dataSource.transaction(async (manager) => {
      for (const group of grouped) {
        const storeId = group.store.id;

        let subtotal = 0;
        const orderItems: Partial<OrderItem>[] = [];

        // ---- Stock check FIRST, before creating anything ----
        // Uses pessimistic_write (SELECT ... FOR UPDATE) so the row is
        // locked for the rest of this transaction. If two buyers check
        // out the same last unit at the same moment, the second one
        // blocks here until the first transaction commits/rolls back,
        // then sees the updated (now-insufficient) stock and fails
        // cleanly instead of both succeeding and going negative.
        for (const cartItem of group.items) {
          if (cartItem.variantId) {
            const variant = await manager.findOne(ProductVariant, {
              where: { id: cartItem.variantId },
              lock: { mode: 'pessimistic_write' },
            });
            if (!variant || Number(variant.stockQty) < Number(cartItem.qty)) {
              throw new BadRequestException(
                `Not enough stock for "${cartItem.product.nameLao}"${cartItem.variant ? ' (' + cartItem.variant.variantLabel + ')' : ''}. ` +
                `Available: ${variant ? Number(variant.stockQty) : 0}, requested: ${cartItem.qty}.`,
              );
            }
          } else {
            const product = await manager.findOne(Product, {
              where: { id: cartItem.productId },
              lock: { mode: 'pessimistic_write' },
            });
            if (!product || Number(product.stockQty) < Number(cartItem.qty)) {
              throw new BadRequestException(
                `Not enough stock for "${cartItem.product.nameLao}". ` +
                `Available: ${product ? Number(product.stockQty) : 0}, requested: ${cartItem.qty}.`,
              );
            }
          }
        }

        for (const cartItem of group.items) {
          const unitPrice = cartItem.variant
            ? Number(cartItem.variant.price)
            : Number(cartItem.product.basePrice);
          const lineSubtotal = unitPrice * Number(cartItem.qty);
          subtotal += lineSubtotal;

          orderItems.push({
            productId: cartItem.productId,
            variantId: cartItem.variantId ?? null,
            itemName: cartItem.product.nameLao,
            variantLabel: cartItem.variant?.variantLabel ?? null,
            qty: cartItem.qty,
            unitPrice,
            subtotal: lineSubtotal,
          });
        }

        const deliveryFee = DEFAULT_DELIVERY_FEE;
        const discountAmount = 0; // TODO: apply promotion logic here if dto.promotionId is set
        const totalAmount = subtotal + deliveryFee - discountAmount;

        const order = manager.create(Order, {
          orderCode: this.generateOrderCode(storeId),
          userId,
          storeId,
          addressId: dto.addressId,
          promotionId: dto.promotionId ?? null,
          subtotal,
          deliveryFee,
          discountAmount,
          totalAmount,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.UNPAID,
          paymentMethod: dto.paymentMethod ?? null,
          deliveryMethod: dto.deliveryMethod ?? 'delivery',
          courierName: dto.deliveryMethod === 'pickup' ? null : (dto.courierName ?? null),
          orderDate: new Date(),
          items: orderItems as OrderItem[],
        });

        const saved = await manager.save(order);
        createdOrders.push(saved);

        // Deduct stock for each variant/product. Safe now — we already
        // confirmed sufficient stock (with a row lock) above, within
        // this same transaction.
        for (const item of group.items) {
          if (item.variantId) {
            await manager.decrement(
              'product_variants',
              { id: item.variantId },
              'stockQty',
              Number(item.qty),
            );
          } else {
            await manager.decrement(
              'products',
              { id: item.productId },
              'stockQty',
              Number(item.qty),
            );
          }
        }

        // Clear this store's items out of the cart — done via the SAME
        // transactional `manager` (not the separately-injected
        // cartService/cartRepo) so this delete runs on the same DB
        // connection as the stock decrement above. Mixing connections
        // inside one logical transaction was causing cross-connection
        // lock waits (MySQL "Lock wait timeout exceeded").
        await manager
          .createQueryBuilder()
          .delete()
          .from(CartItem)
          .where('user_id = :userId', { userId })
          .andWhere('product_id IN (SELECT id FROM products WHERE store_id = :storeId)', { storeId })
          .execute();
      }
    });

    return createdOrders;
  }

  findByUser(userId: number) {
    return this.orderRepo.find({
      where: { userId },
      relations: ['items', 'store'],
      order: { orderDate: 'DESC' },
    });
  }

  findByStore(storeId: number) {
    return this.orderRepo.find({
      where: { storeId },
      relations: ['items', 'user'],
      order: { orderDate: 'DESC' },
    });
  }

  async findOne(id: number) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'store', 'user', 'address'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: number, status: OrderStatus) {
    await this.orderRepo.update(id, { status });
    return this.findOne(id);
  }

  // Buyer attaches their payment-confirmation screenshot + the RRN
  // (Retrieval Reference Number) they read off it. Ownership-checked
  // so a buyer can only submit proof for their own order.
  async submitPaymentProof(orderId: number, userId: number, rrn: string, filename?: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) {
      throw new ForbiddenException('This order does not belong to you');
    }
    if (!filename) {
      throw new BadRequestException('A payment screenshot is required');
    }

    await this.orderRepo.update(orderId, {
      paymentProofUrl: `/uploads/payment-proofs/${filename}`,
      rrn: rrn || null,
    });
    return this.findOne(orderId);
  }
}
