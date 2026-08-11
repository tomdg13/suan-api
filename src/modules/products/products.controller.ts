import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Request,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { productImageMulterOptions } from '../../config/product-image-multer.config';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('store/:storeId')
  create(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(storeId, dto);
  }

  @Get()
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get('flash-sales')
  findFlashSales() {
    return this.productsService.findFlashSales();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @Request() req,
  ) {
    return this.productsService.update(id, req.user.userId, req.user.role, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.productsService.remove(id, req.user.userId, req.user.role);
  }

  // Stock movement history for this product — newest first.
  @UseGuards(JwtAuthGuard)
  @Get(':id/stock-history')
  getStockHistory(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.productsService.getStockHistory(id, req.user.userId, req.user.role);
  }

  // Up to 6 images per upload call — call again to add more later.
  @UseGuards(JwtAuthGuard)
  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('files', 6, productImageMulterOptions))
  uploadImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    return this.productsService.addImages(
      id,
      req.user.userId,
      req.user.role,
      files.map((f) => f.filename),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('images/:imageId')
  removeImage(@Param('imageId', ParseIntPipe) imageId: number, @Request() req) {
    return this.productsService.removeImage(imageId, req.user.userId, req.user.role);
  }
}
