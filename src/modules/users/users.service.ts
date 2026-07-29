import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { phone: dto.phone } });
    if (existing) {
      throw new ConflictException('Phone number already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      passwordHash,
      role: dto.role,
    });
    const saved = await this.userRepo.save(user);

    if (saved.role === UserRole.SELLER) {
      await this.autoCreateStoreForSeller(saved);
    }

    delete (saved as any).passwordHash;
    return saved;
  }

  findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (dto.phone && dto.phone !== user.phone) {
      const existing = await this.userRepo.findOne({ where: { phone: dto.phone } });
      if (existing) {
        throw new ConflictException('Phone number already in use by another account');
      }
    }

    const wasSeller = user.role === UserRole.SELLER;
    Object.assign(user, dto);
    const saved = await this.userRepo.save(user);

    // If an admin just promoted this account to seller (and it wasn't
    // already one), give them a starter store automatically too.
    if (!wasSeller && saved.role === UserRole.SELLER) {
      await this.autoCreateStoreForSeller(saved);
    }

    return saved;
  }

  findByPhoneWithPassword(phone: string) {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.phone = :phone', { phone })
      .getOne();
  }

  /**
   * Auto-creates a starter store for a newly-seller account, so they
   * land straight in the Seller Panel with something to edit instead
   * of an empty "create a store" form. Skips if they somehow already
   * have one (e.g. re-saving an already-seller account).
   */
  private async autoCreateStoreForSeller(user: User): Promise<void> {
    const existing = await this.storeRepo.findOne({ where: { ownerId: user.id } });
    if (existing) return;

    const baseName = `${user.fullName}'s Store`;
    const slug =
      baseName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9ก-๙\s-]/g, '')
        .replace(/\s+/g, '-') + '-' + Date.now();

    const store = this.storeRepo.create({
      ownerId: user.id,
      storeName: baseName,
      slug,
      phone: user.phone,
    });
    await this.storeRepo.save(store);
  }
}
