import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum FeeType {
  FLAT = 'flat',
  PERCENT = 'percent',
}

// A single admin-configurable fee that gets applied on top of the
// subtotal at checkout — e.g. delivery fee (flat 20,000 LAK), insurance
// (percent, 15% of subtotal), service fee, etc. Any number of these can
// be active at once; they all stack.
@Entity('fee_configs')
export class FeeConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'enum', enum: FeeType, default: FeeType.FLAT })
  type: FeeType;

  // FLAT: LAK amount, e.g. 20000
  // PERCENT: percentage of subtotal, e.g. 15 means 15%
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  value: number;

  @Column({ name: 'sort_order', type: 'int', unsigned: true, default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
