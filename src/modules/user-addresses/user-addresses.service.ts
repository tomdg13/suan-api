import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAddress } from '../users/entities/user-address.entity';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { UpdateUserAddressDto } from './dto/update-user-address.dto';

@Injectable()
export class UserAddressesService {
  constructor(
    @InjectRepository(UserAddress) private readonly addressRepo: Repository<UserAddress>,
  ) {}

  findMine(userId: number) {
    return this.addressRepo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOwned(id: number, userId: number) {
    const address = await this.addressRepo.findOne({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId) {
      throw new ForbiddenException('This address does not belong to you');
    }
    return address;
  }

  async create(userId: number, dto: CreateUserAddressDto) {
    const existingCount = await this.addressRepo.count({ where: { userId } });
    const shouldBeDefault = dto.isDefault === 1 || existingCount === 0;

    if (shouldBeDefault) {
      await this.addressRepo.update({ userId, isDefault: 1 }, { isDefault: 0 });
    }

    const address = this.addressRepo.create({
      ...dto,
      userId,
      isDefault: shouldBeDefault ? 1 : 0,
    });
    return this.addressRepo.save(address);
  }

  async update(id: number, userId: number, dto: UpdateUserAddressDto) {
    await this.findOwned(id, userId);

    if (dto.isDefault === 1) {
      await this.addressRepo
        .createQueryBuilder()
        .update(UserAddress)
        .set({ isDefault: 0 })
        .where('userId = :userId AND id != :id', { userId, id })
        .execute();
    }

    await this.addressRepo.update(id, dto);
    return this.findOwned(id, userId);
  }

  async remove(id: number, userId: number) {
    const address = await this.findOwned(id, userId);
    await this.addressRepo.remove(address);
    return { deleted: true };
  }
}
