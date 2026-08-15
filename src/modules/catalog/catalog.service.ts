import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs';
import { join } from 'path';
import { Category } from './entities/category.entity';
import { Unit } from './entities/unit.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const ALL_ICON_KEY = 'category_all_icon_url';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Unit) private readonly unitRepo: Repository<Unit>,
    @InjectRepository(SystemSetting) private readonly settingRepo: Repository<SystemSetting>,
  ) {}

  findAllCategories() {
    return this.categoryRepo.find({ where: { isActive: 1 }, order: { sortOrder: 'ASC' } });
  }

  findAllUnits() {
    return this.unitRepo.find();
  }

  findAllCategoriesAdmin() {
    return this.categoryRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async createCategory(dto: CreateCategoryDto, filename?: string) {
    const cat = this.categoryRepo.create({
      nameLao: dto.nameLao,
      nameEn: dto.nameEn ?? null,
      sortOrder: dto.sortOrder ?? 0,
      parentId: dto.parentId ?? null,
      iconUrl: filename ? `/uploads/categories/${filename}` : null,
      isActive: 1,
    });
    return this.categoryRepo.save(cat);
  }

  async updateCategory(id: number, dto: UpdateCategoryDto, filename?: string) {
    const cat = await this.categoryRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    if (dto.nameLao !== undefined) cat.nameLao = dto.nameLao;
    if (dto.nameEn !== undefined) cat.nameEn = dto.nameEn;
    if (dto.sortOrder !== undefined) cat.sortOrder = dto.sortOrder;
    if (dto.parentId !== undefined) cat.parentId = dto.parentId;
    if (dto.isActive !== undefined) cat.isActive = dto.isActive;
    if (filename) {
      if (cat.iconUrl) this._deleteFile(cat.iconUrl);
      cat.iconUrl = `/uploads/categories/${filename}`;
    }
    return this.categoryRepo.save(cat);
  }

  async removeCategory(id: number) {
    const cat = await this.categoryRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    if (cat.iconUrl) this._deleteFile(cat.iconUrl);
    await this.categoryRepo.remove(cat);
    return { success: true };
  }

  async getAllIconUrl(): Promise<{ iconUrl: string | null }> {
    const setting = await this.settingRepo.findOne({ where: { settingKey: ALL_ICON_KEY } });
    return { iconUrl: setting?.settingValue ?? null };
  }

  async updateAllIcon(filename: string): Promise<{ iconUrl: string }> {
    const old = await this.settingRepo.findOne({ where: { settingKey: ALL_ICON_KEY } });
    if (old?.settingValue) this._deleteFile(old.settingValue);
    await this.settingRepo.save({ settingKey: ALL_ICON_KEY, settingValue: `/uploads/categories/${filename}` });
    return { iconUrl: `/uploads/categories/${filename}` };
  }

  private _deleteFile(urlPath: string) {
    const filePath = join(process.cwd(), urlPath);
    unlink(filePath, () => {});
  }
}
