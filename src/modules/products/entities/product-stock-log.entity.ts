import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_stock_logs')
export class ProductStockLog {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'product_id', type: 'int', unsigned: true })
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  // Positive = stock added, negative = stock removed/sold.
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  delta: number;

  // The product's stockQty AFTER this change was applied — makes each
  // row self-contained for display without needing to replay history.
  @Column({ name: 'resulting_stock', type: 'decimal', precision: 12, scale: 2 })
  resultingStock: number;

  @Column({ name: 'changed_by', type: 'int', unsigned: true, nullable: true })
  changedBy: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
