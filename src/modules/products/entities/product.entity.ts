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
import { Store } from '../../stores/entities/store.entity';
import { Category } from '../../catalog/entities/category.entity';
import { Unit } from '../../catalog/entities/unit.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';
import { LogisticsProvider } from '../../logistics-provider/entities/logistics-provider.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'store_id', type: 'int', unsigned: true })
  storeId: number;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'category_id', type: 'int', unsigned: true })
  categoryId: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'unit_id', type: 'int', unsigned: true })
  unitId: number;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  // Which logistics provider this product ships with. Only providers
  // with allow_weight_tiers=1 let the seller pick weight/size tiers;
  // for other provider types the courier/company sets its own fee.
  @Column({ name: 'provider_id', type: 'int', nullable: true })
  providerId: number | null;

  @ManyToOne(() => LogisticsProvider, { nullable: true })
  @JoinColumn({ name: 'provider_id' })
  provider: LogisticsProvider | null;

  @Column({ name: 'name_lao', length: 150 })
  nameLao: string;

  @Column({ name: 'name_en', length: 150, nullable: true })
  nameEn: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'base_price', type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  basePrice: number;

  @Column({ name: 'stock_qty', type: 'decimal', precision: 12, scale: 2, default: 0 })
  stockQty: number;

  @Column({ name: 'sold_count', type: 'int', unsigned: true, default: 0 })
  soldCount: number;

  @Column({ name: 'rating_avg', type: 'decimal', precision: 2, scale: 1, default: 0.0 })
  ratingAvg: number;

  @Column({ name: 'rating_count', type: 'int', unsigned: true, default: 0 })
  ratingCount: number;

  @Column({ name: 'is_flash_sale', type: 'tinyint', default: 0 })
  isFlashSale: number;

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive: number;

  // weight in kg, used to calculate shipping fee tiers
  @Column({ name: 'weight', type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  weight: number;

  // size in cm (longest side / combined dimension), used to calculate
  // size-based shipping fee tiers alongside weight-based ones.
  @Column({ name: 'size_cm', type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  sizeCm: number;

  @OneToMany(() => ProductVariant, (v) => v.product)
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, (i) => i.product)
  images: ProductImage[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
