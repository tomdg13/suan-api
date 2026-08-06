import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Store } from '../../stores/entities/store.entity';
import { UserAddress } from '../../users/entities/user-address.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  BCEL_ONE = 'bcel_one',
  ONEPAY = 'onepay',
  VISA_MASTERCARD = 'visa_mastercard',
  QR_PAY = 'qr_pay',
  COD = 'cod',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'order_code', length: 30, unique: true })
  orderCode: string;

  @Column({ name: 'user_id', type: 'int', unsigned: true })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'store_id', type: 'int', unsigned: true })
  storeId: number;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'address_id', type: 'int', unsigned: true })
  addressId: number;

  @ManyToOne(() => UserAddress)
  @JoinColumn({ name: 'address_id' })
  address: UserAddress;

  @Column({ name: 'promotion_id', type: 'int', unsigned: true, nullable: true })
  promotionId: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0.0 })
  subtotal: number;

  @Column({ name: 'delivery_fee', type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  deliveryFee: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  discountAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 14, scale: 2, default: 0.0 })
  totalAmount: number;

  @Column({ name: 'delivery_method', type: 'enum', enum: ['delivery', 'pickup'], default: 'delivery' })
  deliveryMethod: string;

  @Column({ name: 'courier_name', type: 'varchar', length: 100, nullable: true })
  courierName: string | null;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ name: 'payment_status', type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod;

  @Column({ name: 'order_date', type: 'datetime' })
  orderDate: Date;

  @Column({ name: 'delivered_at', type: 'datetime', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
