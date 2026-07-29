import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'image_url', length: 255 })
  imageUrl: string;

  @Column({ length: 150, nullable: true })
  title: string;

  @Column({ length: 255, nullable: true })
  subtitle: string;

  // Optional: where tapping the banner should take the person —
  // e.g. a category id or store id. Left as a plain string so the
  // frontend can decide how to interpret it (kept simple for now).
  @Column({ name: 'link_url', length: 255, nullable: true })
  linkUrl: string;

  @Column({ name: 'sort_order', type: 'int', unsigned: true, default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
