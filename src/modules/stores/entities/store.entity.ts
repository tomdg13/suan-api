import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum StoreStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
}

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'owner_id', type: 'int', unsigned: true })
  ownerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'store_name', length: 150 })
  storeName: string;

  @Column({ length: 180, unique: true })
  slug: string;

  @Column({ name: 'logo_url', length: 255, nullable: true })
  logoUrl: string;

  @Column({ name: 'cover_url', length: 255, nullable: true })
  coverUrl: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 100, nullable: true })
  province: string;

  @Column({ length: 100, nullable: true })
  district: string;

  @Column({ length: 30, nullable: true })
  phone: string;

  @Column({ length: 30, nullable: true })
  whatsapp: string;

  @Column({ name: 'is_verified', type: 'tinyint', default: 0 })
  isVerified: number;

  @Column({ name: 'is_featured', type: 'tinyint', default: 0 })
  isFeatured: number;

  @Column({ name: 'rating_avg', type: 'decimal', precision: 2, scale: 1, default: 0.0 })
  ratingAvg: number;

  @Column({ name: 'rating_count', type: 'int', unsigned: true, default: 0 })
  ratingCount: number;

  @Column({ name: 'follower_count', type: 'int', unsigned: true, default: 0 })
  followerCount: number;

  @Column({ type: 'enum', enum: StoreStatus, default: StoreStatus.ACTIVE })
  status: StoreStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
