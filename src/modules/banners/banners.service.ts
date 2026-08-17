import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from './entities/banner.entity';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner) private readonly bannerRepo: Repository<Banner>,
  ) {}

  // Public storefront view — only active banners, in display order.
  findActive() {
    return this.bannerRepo.find({
      where: { isActive: 1 },
      order: { sortOrder: 'ASC' },
    });
  }

  // Admin management view — everything, including hidden banners.
  findAll() {
    return this.bannerRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async create(dto: CreateBannerDto, filename?: string) {
    if (!filename) {
      throw new BadRequestException('A banner image is required');
    }
    const banner = this.bannerRepo.create({
      ...dto,
      imageUrl: `/uploads/banners/${filename}`,
    });
    return this.bannerRepo.save(banner);
  }

  async update(id: number, dto: UpdateBannerDto, filename?: string) {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');

    Object.assign(banner, dto);
    if (filename) {
      banner.imageUrl = `/uploads/banners/${filename}`;
    }
    return this.bannerRepo.save(banner);
  }

  async reorder(items: { id: number; sortOrder: number }[]) {
    await Promise.all(
      items.map((item) =>
        this.bannerRepo.update(item.id, { sortOrder: item.sortOrder }),
      ),
    );
    return this.findAll();
  }

  async remove(id: number) {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    await this.bannerRepo.remove(banner);
    return { deleted: true };
  }
}
