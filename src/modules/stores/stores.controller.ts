import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { storeImageMulterOptions } from '../../config/multer.config';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() dto: CreateStoreDto) {
    return this.storesService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Query('featured') featured?: string) {
    return this.storesService.findAll(featured === 'true');
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyStores(@Request() req) {
    return this.storesService.findByOwner(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.storesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStoreDto,
    @Request() req,
  ) {
    return this.storesService.updateProfile(id, req.user.userId, req.user.role, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('file', storeImageMulterOptions))
  uploadLogo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.storesService.updateImage(
      id,
      req.user.userId,
      req.user.role,
      'logo',
      file.filename,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cover')
  @UseInterceptors(FileInterceptor('file', storeImageMulterOptions))
  uploadCover(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.storesService.updateImage(
      id,
      req.user.userId,
      req.user.role,
      'cover',
      file.filename,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('applications/:id/approve')
  approveApplication(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.storesService.approveApplication(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('applications/:id/reject')
  rejectApplication(
    @Param('id', ParseIntPipe) id: number,
    @Body('notes') notes: string,
    @Request() req,
  ) {
    return this.storesService.rejectApplication(id, req.user.userId, notes);
  }
}
