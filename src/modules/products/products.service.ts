import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductStockLog } from './entities/product-stock-log.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,
    @InjectRepository(ProductStockLog)
    private readonly stockLogRepo: Repository<ProductStockLog>,
  ) {}

  async create(storeId: number, dto: CreateProductDto) {
    const product = this.productRepo.create({
      storeId,
      categoryId: dto.categoryId,
      unitId: dto.unitId,
      nameLao: dto.nameLao,
      nameEn: dto.nameEn,
      description: dto.description,
      basePrice: dto.basePrice,
      stockQty: dto.stockQty ?? 0,
    });
    const saved = await this.productRepo.save(product);
    if (dto.variants?.length) {
      const variants = dto.variants.map((v) =>
        this.variantRepo.create({
          productId: saved.id,
          variantLabel: v.variantLabel,
          price: v.price,
          stockQty: v.stockQty ?? 0,
          isDefault: v.isDefault ? 1 : 0,
        }),
      );
      await this.variantRepo.save(variants);
    }
    if (dto.imageUrls?.length) {
      const images = dto.imageUrls.map((url, idx) =>
        this.imageRepo.create({ productId: saved.id, imageUrl: url, sortOrder: idx }),
      );
      await this.imageRepo.save(images);
    }
    return this.findOne(saved.id);
  }

  async findAll(query: QueryProductsDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 100, 500);
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.store', 'store');
    if (!query.includeHidden) {
      qb.where('product.isActive = 1');
    }
    if (query.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId: query.categoryId });
    }
    if (query.storeId) {
      qb.andWhere('product.storeId = :storeId', { storeId: query.storeId });
    }
    if (query.search) {
      qb.andWhere('(product.nameLao LIKE :search OR product.nameEn LIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    qb.skip((page - 1) * limit).take(limit);
    qb.orderBy('RAND()');
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['variants', 'images', 'store', 'category', 'unit'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findFlashSales() {
    return this.productRepo.find({
      where: { isFlashSale: 1, isActive: 1 },
      relations: ['variants', 'images'],
    });
  }

  /**
   * Edits a product's fields — name, description, price, category,
   * unit, stock, and/or visibility (isActive: 1 visible / 0 hidden).
   * Only the owning store's owner (or an admin) may edit it.
   *
   * If stockQty is part of the update AND differs from the current
   * value, a product_stock_logs row is recorded (delta, resulting
   * stock, who changed it) — this powers the stock history screen.
   */
  async update(
    productId: number,
    requesterId: number,
    requesterRole: string,
    dto: UpdateProductDto,
  ) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['store'],
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.store.ownerId !== requesterId && requesterRole !== 'admin') {
      throw new ForbiddenException('You do not own this product');
    }

    const previousStock = Number(product.stockQty);
    const stockChanging = dto.stockQty !== undefined && Number(dto.stockQty) !== previousStock;

    Object.assign(product, dto);
    await this.productRepo.save(product);

    if (stockChanging) {
      const delta = Number(dto.stockQty) - previousStock;
      const log = this.stockLogRepo.create({
        productId,
        delta,
        resultingStock: Number(dto.stockQty),
        changedBy: requesterId,
      });
      await this.stockLogRepo.save(log);
    }

    return this.findOne(productId);
  }

  /**
   * Stock movement history for a product — newest first. Ownership
   * checked the same way as update().
   */
  async getStockHistory(productId: number, requesterId: number, requesterRole: string) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['store'],
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.store.ownerId !== requesterId && requesterRole !== 'admin') {
      throw new ForbiddenException('You do not own this product');
    }

    return this.stockLogRepo.find({
      where: { productId },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  /**
   * Appends uploaded images to a product. Only the owning store's
   * owner (or an admin) may add images. Preserves existing images and
   * appends new ones after them (sortOrder continues from the current max).
   */
  async addImages(
    productId: number,
    requesterId: number,
    requesterRole: string,
    filenames: string[],
  ) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['store', 'images'],
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.store.ownerId !== requesterId && requesterRole !== 'admin') {
      throw new ForbiddenException('You do not own this product');
    }
    const startOrder = product.images?.length ?? 0;
    const images = filenames.map((filename, idx) =>
      this.imageRepo.create({
        productId,
        imageUrl: `/uploads/products/${filename}`,
        sortOrder: startOrder + idx,
      }),
    );
    await this.imageRepo.save(images);
    return this.findOne(productId);
  }

  async removeImage(imageId: number, requesterId: number, requesterRole: string) {
    const image = await this.imageRepo.findOne({
      where: { id: imageId },
      relations: ['product', 'product.store'],
    });
    if (!image) throw new NotFoundException('Image not found');
    if (image.product.store.ownerId !== requesterId && requesterRole !== 'admin') {
      throw new ForbiddenException('You do not own this product');
    }
    const productId = image.productId;
    await this.imageRepo.remove(image);
    return this.findOne(productId);
  }

  /**
   * Deletes a product permanently. Blocked if any past order still
   * references it (FK constraint) — hiding via isActive is the right
   * move for products with order history; hard delete is only safe
   * for products that were never actually ordered.
   */
  async remove(productId: number, requesterId: number, requesterRole: string) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['store'],
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.store.ownerId !== requesterId && requesterRole !== 'admin') {
      throw new ForbiddenException('You do not own this product');
    }
    try {
      await this.productRepo.remove(product);
      return { deleted: true };
    } catch (e) {
      throw new BadRequestException(
        'This product has past orders and cannot be deleted. Hide it instead using the visibility toggle.',
      );
    }
  }
}
