import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('store_applications')
export class StoreApplication {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'user_id', type: 'int', unsigned: true })
  userId: number;

  @Column({ name: 'store_name', length: 150 })
  storeName: string;

  @Column({ name: 'owner_name', length: 150 })
  ownerName: string;

  @Column({ length: 30 })
  phone: string;

  @Column({ length: 255, nullable: true })
  address: string;

  @Column({ name: 'product_types', length: 255, nullable: true })
  productTypes: string;

  @Column({ name: 'id_card_image', length: 255, nullable: true })
  idCardImage: string;

  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.PENDING })
  status: ApplicationStatus;

  @Column({ name: 'reviewed_by', type: 'int', unsigned: true, nullable: true })
  reviewedBy: number;

  @Column({ name: 'review_notes', type: 'text', nullable: true })
  reviewNotes: string;

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;

  @Column({ name: 'reviewed_at', type: 'datetime', nullable: true })
  reviewedAt: Date;
}
