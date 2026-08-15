import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type LogisticsType = 'logistic' | 'customer_courier' | 'store_pickup';

@Entity('logistics_provider')
export class LogisticsProvider {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['logistic', 'customer_courier', 'store_pickup'],
    default: 'logistic',
  })
  type: LogisticsType;

  @Column({ nullable: true })
  logo_url: string;

  @Column({ type: 'tinyint', default: 1 })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
