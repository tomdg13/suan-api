import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LogisticsProvider } from '../logistics-provider/entities/logistics-provider.entity';
import { Product } from '../products/entities/product.entity';

export type ShippingTierMetric = 'weight' | 'size';

@Entity('shipping_weight_tiers')
export class ShippingWeightTier {
  @PrimaryGeneratedColumn()
  id: number;

  // Which specific product this tier applies to. Tiers are per-product
  // (not shared across a provider) - two products under the same
  // courier can have completely different weight/size price breaks.
  @Column({ name: 'product_id', type: 'int', unsigned: true, nullable: true })
  productId: number | null;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product | null;

  // Denormalized from product.providerId at creation time - kept so
  // existing provider-scoped queries/filters keep working without a
  // join, and to preserve which courier this tier was set up under.
  @Column({ name: 'provider_id', type: 'int', nullable: true })
  providerId: number | null;

  @ManyToOne(() => LogisticsProvider, { nullable: true })
  @JoinColumn({ name: 'provider_id' })
  provider: LogisticsProvider | null;

  // Which measurement this tier's min/max thresholds apply to. A single
  // tier is EITHER weight-based OR size-based, never both at once.
  @Column({ type: 'enum', enum: ['weight', 'size'], default: 'weight' })
  metric: ShippingTierMetric;

  @Column('decimal', { name: 'min_weight', precision: 10, scale: 2, nullable: true })
  minWeight: number;

  @Column('decimal', {
    name: 'max_weight',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  maxWeight: number | null;

  @Column('int')
  price: number;

  @Column('int', { name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column('tinyint', { name: 'is_active', default: 1 })
  isActive: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
