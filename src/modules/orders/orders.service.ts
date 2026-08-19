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
import { FeesService } from '../fees/fees.service';
import { ShippingTiersService } from '../shipping-tiers/shipping-tiers.service';
import { LogisticsProviderService } from '../logistics-provider/logistics-provider.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepo: Repository<OrderItem>,
    private readonly cartService: CartService,
    private readonly feesService: FeesService,
    private readonly shippingTiersService: ShippingTiersService,
    private readonly logisticsProviderService: LogisticsProviderService,
    private readonly dataSource: DataSource,
  ) {}

  private generateOrderCode(storeId: number): string {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${datePart}-${storeId}-${randomPart}`;
  }

  // Checkout splits the user's cart into ONE ORDER PER STORE
  // (matches multi-vendor marketplace pattern - each seller manages
  // their own order/delivery/payout independently).
  async checkout(userId: number, dto: CheckoutDto) {
    const grouped = await this.cartService.getCartGroupedByStore(userId);
    if (!grouped.length) {
      throw new BadRequestException('Cart is empty');
    }

    const createdOrders: Order[] = [];

    // Fetch the active fee configs ONCE for this whole checkout - every
    // store's order gets fees computed against the same config list, just
    // applied to that store's own subtotal.
    const activeFeeConfigs = await this.feesService.findActive();

    // Resolve which delivery option the buyer picked (image 1's radio list) -
    // its type decides how the fee is calculated for every store's order below.
    const provider = dto.providerId
      ? await this.logisticsProviderService.findOne(dto.providerId)
      : null;

    await this.dataSource.transaction(async (manager) => {
      for (const group of grouped) {
        const storeId = group.store.id;

        let subtotal = 0;
        const orderItems: Partial<OrderItem>[] = [];

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

        // Weight-based shipping fee (ຄ່າຂົນສົງ) - sums each cart item's
        // product weight (kg) × qty for this store's group, then finds
        // the matching tier from the admin-configured shipping_weight_tiers
        // table (see shipping-tiers module). Folded into deliveryFee
        // alongside the existing configurable fees below.
        let shippingFee = 0;
        let configuredFeesTotal = 0;
        let feeLines: any[] = [];

        // Fee calculation branches on the selected provider's type
        // (logistics_provider.type): store_pickup is free, customer_courier
        // uses the flat fee_configs fee, logistic uses weight-based tiers.
        const providerType = provider?.type ?? (dto.deliveryMethod === 'pickup' ? 'store_pickup' : null);
        // Derive deliveryMethod from the resolved provider type rather than
        // trusting a separate client-sent field, so the two can't disagree
        // (e.g. providerId=store_pickup but deliveryMethod left as 'delivery').
        const resolvedDeliveryMethod = providerType === 'store_pickup' ? 'pickup' : 'delivery';

        if (providerType === 'store_pickup') {
          // No delivery fee - buyer collects from the store.
        } else if (providerType === 'customer_courier') {
          feeLines = this.feesService.computeFeeLines(activeFeeConfigs, subtotal);
          configuredFeesTotal = feeLines.reduce((sum, f) => sum + f.amount, 0);
        } else if (providerType === 'logistic' && provider) {
          // Tiers are configured per-product now, so sum each cart item's
          // fee individually rather than computing one fee for the group.
          let logisticFee = 0;
          for (const item of group.items) {
            if (!item.product?.id) continue;
            const weightKg = Number(item.product.weight ?? 0) * Number(item.qty);
            const sizeCm = Number(item.product.sizeCm ?? 0);
            const result = await this.shippingTiersService.calculateFeeForProduct(
              item.product.id,
              weightKg,
              sizeCm,
            );
            logisticFee += result.price;
          }
          shippingFee = logisticFee;
        } else {
          // No provider selected - fall back to per-product tiers too
          // (there is no more group/global calculateFee() method).
          let fallbackFee = 0;
          for (const item of group.items) {
            if (!item.product?.id) continue;
            const weightKg = Number(item.product.weight ?? 0) * Number(item.qty);
            const sizeCm = Number(item.product.sizeCm ?? 0);
            const result = await this.shippingTiersService.calculateFeeForProduct(
              item.product.id,
              weightKg,
              sizeCm,
            );
            fallbackFee += result.price;
          }
          shippingFee = fallbackFee;
          feeLines = this.feesService.computeFeeLines(activeFeeConfigs, subtotal);
          configuredFeesTotal = feeLines.reduce((sum, f) => sum + f.amount, 0);
        }

        const deliveryFee = configuredFeesTotal + shippingFee;
        const discountAmount = 0;
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
          deliveryMethod: resolvedDeliveryMethod,
          courierName: resolvedDeliveryMethod === 'pickup' ? null : (dto.courierName ?? null),
          providerId: provider?.id ?? null,
          providerType: provider?.type ?? null,
          orderDate: new Date(),
          items: orderItems as OrderItem[],
        });

        const saved = await manager.save(order);
        createdOrders.push(saved);

        // Persist the configured-fee breakdown snapshot for this order.
        // (Shipping fee is captured in deliveryFee above, not as a
        // separate order_fees row, since feeConfigId there has no
        // matching fee_configs entry for weight-tier shipping.)
        await this.feesService.persistLines(manager, saved.id, feeLines);

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
      relations: ['items', 'items.product', 'items.product.images', 'store'],
      order: { orderDate: 'DESC' },
    });
  }

  findByStore(storeId: number) {
    return this.orderRepo.find({
      where: { storeId },
      relations: ['items', 'items.product', 'items.product.images', 'user'],
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

  findPendingPaymentConfirmations() {
    return this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.store', 'store')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.paymentStatus = :unpaid', { unpaid: PaymentStatus.UNPAID })
      .andWhere('order.paymentProofUrl IS NOT NULL')
      .orderBy('order.orderDate', 'ASC')
      .getMany();
  }

  async confirmPayment(id: number) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('This order is already marked as paid');
    }

    await this.orderRepo.update(id, {
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.CONFIRMED,
    });
    return this.findOne(id);
  }
}
