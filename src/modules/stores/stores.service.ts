import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { StoreApplication, ApplicationStatus } from './entities/store-application.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store) private readonly storeRepo: Repository<Store>,
    @InjectRepository(StoreApplication)
    private readonly applicationRepo: Repository<StoreApplication>,
  ) {}

  create(ownerId: number, dto: CreateStoreDto) {
    const slug = dto.storeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9ก-๙\s-]/g, '')
      .replace(/\s+/g, '-') + '-' + Date.now();

    const store = this.storeRepo.create({ ...dto, ownerId, slug });
    return this.storeRepo.save(store);
  }

  findAll(featured?: boolean) {
    const where = featured ? { isFeatured: 1 } : {};
    return this.storeRepo.find({ where, order: { ratingAvg: 'DESC' } });
  }

  async findOne(id: number) {
    const store = await this.storeRepo.findOne({ where: { id } });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  findByOwner(ownerId: number) {
    return this.storeRepo.find({ where: { ownerId } });
  }

  /**
   * Updates a store's text profile fields (name, description, contact
   * info). Only the store's owner (or an admin) may edit it.
   */
  async updateProfile(
    storeId: number,
    requesterId: number,
    requesterRole: string,
    dto: UpdateStoreDto,
  ) {
    const store = await this.findOne(storeId);
    if (store.ownerId !== requesterId && requesterRole !== 'admin') {
      throw new ForbiddenException('You do not own this store');
    }
    Object.assign(store, dto);
    return this.storeRepo.save(store);
  }

  /**
   * Admin approves a pending seller application — this creates the
   * actual Store record for that user.
   */
  async approveApplication(applicationId: number, adminId: number) {
    const app = await this.applicationRepo.findOne({ where: { id: applicationId } });
    if (!app) throw new NotFoundException('Application not found');
    if (app.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('Application has already been reviewed');
    }

    app.status = ApplicationStatus.APPROVED;
    app.reviewedBy = adminId;
    app.reviewedAt = new Date();
    await this.applicationRepo.save(app);

    const slug =
      app.storeName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9ก-๙\s-]/g, '')
        .replace(/\s+/g, '-') + '-' + Date.now();

    const store = this.storeRepo.create({
      ownerId: app.userId,
      storeName: app.storeName,
      slug,
      phone: app.phone,
      description: app.productTypes ? `Products: ${app.productTypes}` : undefined,
    });
    return this.storeRepo.save(store);
  }

  async rejectApplication(applicationId: number, adminId: number, notes?: string) {
    const app = await this.applicationRepo.findOne({ where: { id: applicationId } });
    if (!app) throw new NotFoundException('Application not found');
    if (app.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('Application has already been reviewed');
    }

    app.status = ApplicationStatus.REJECTED;
    app.reviewedBy = adminId;
    app.reviewedAt = new Date();
    app.reviewNotes = notes ?? null;
    return this.applicationRepo.save(app);
  }

  /**
   * Sets a store's logo or cover image after an upload. Only the
   * store's owner (or an admin) may change its images.
   */
  async updateImage(
    storeId: number,
    requesterId: number,
    requesterRole: string,
    type: 'logo' | 'cover',
    filename: string,
  ) {
    const store = await this.findOne(storeId);
    if (store.ownerId !== requesterId && requesterRole !== 'admin') {
      throw new ForbiddenException('You do not own this store');
    }

    const url = `/uploads/stores/${filename}`;
    if (type === 'logo') {
      store.logoUrl = url;
    } else {
      store.coverUrl = url;
    }
    return this.storeRepo.save(store);
  }
}
