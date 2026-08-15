import {
  Controller, Get, Post, Patch, Delete, Body,
  Param, ParseIntPipe, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { categoryMulterOptions } from '../../config/category-multer.config';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('categories')
  findAllCategories() { return this.catalogService.findAllCategories(); }

  @Get('units')
  findAllUnits() { return this.catalogService.findAllUnits(); }

  @Get('categories/all-icon')
  getAllIcon() { return this.catalogService.getAllIconUrl(); }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin')
  @Get('admin/categories')
  findAllCategoriesAdmin() { return this.catalogService.findAllCategoriesAdmin(); }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin')
  @Post('categories')
  @UseInterceptors(FileInterceptor('file', categoryMulterOptions))
  createCategory(@Body() dto: CreateCategoryDto, @UploadedFile() file: Express.Multer.File) {
    return this.catalogService.createCategory(dto, file?.filename);
  }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin')
  @Patch('categories/:id')
  @UseInterceptors(FileInterceptor('file', categoryMulterOptions))
  updateCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto, @UploadedFile() file: Express.Multer.File) {
    return this.catalogService.updateCategory(id, dto, file?.filename);
  }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin')
  @Delete('categories/:id')
  removeCategory(@Param('id', ParseIntPipe) id: number) {
    return this.catalogService.removeCategory(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin')
  @Patch('categories/all-icon')
  @UseInterceptors(FileInterceptor('file', categoryMulterOptions))
  updateAllIcon(@UploadedFile() file: Express.Multer.File) {
    return this.catalogService.updateAllIcon(file.filename);
  }
}
