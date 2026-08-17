import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { bannerMulterOptions } from '../../config/banner-multer.config';

@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  // Public — storefront home screen banner carousel.
  @Get()
  findActive() {
    return this.bannersService.findActive();
  }

  // Admin — full list including hidden banners.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('all')
  findAll() {
    return this.bannersService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @UseInterceptors(FileInterceptor('file', bannerMulterOptions))
  create(@Body() dto: CreateBannerDto, @UploadedFile() file: Express.Multer.File) {
    return this.bannersService.create(dto, file?.filename);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('reorder')
  reorder(@Body() body: { items: { id: number; sortOrder: number }[] }) {
    return this.bannersService.reorder(body.items);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', bannerMulterOptions))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBannerDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.bannersService.update(id, dto, file?.filename);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bannersService.remove(id);
  }
}
