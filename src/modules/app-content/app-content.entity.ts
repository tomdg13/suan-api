import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('app_content')
export class AppContent {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
