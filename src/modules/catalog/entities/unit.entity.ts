import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('units')
export class Unit {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 20, unique: true })
  code: string;

  @Column({ name: 'name_lao', length: 50 })
  nameLao: string;

  @Column({ name: 'name_en', length: 50 })
  nameEn: string;
}
