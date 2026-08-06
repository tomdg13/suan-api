import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('payment_qr')
export class PaymentQr {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'image_url', length: 500 })
  imageUrl: string;

  @Column({ length: 255, nullable: true })
  title: string;

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive: number;

  @Column({ name: 'created_by', type: 'int', unsigned: true, nullable: true })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
