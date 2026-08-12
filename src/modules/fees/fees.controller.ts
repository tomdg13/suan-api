import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { FeesService } from './fees.service';
import { CreateFeeConfigDto } from './dto/create-fee-config.dto';
import { UpdateFeeConfigDto } from './dto/update-fee-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';

@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  // Public - buyer screens use this to know what's currently active
  @Get('active')
  findActive() {
    return this.feesService.findActive();
  }

  // Public - buyer screens call this with a cart/product subtotal to get
  // the exact fee breakdown + total before checkout
  @Get('preview')
  preview(@Query('subtotal') subtotal: string) {
    const parsed = Number(subtotal);
    return this.feesService.preview(Number.isFinite(parsed) ? parsed : 0);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.feesService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.feesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() dto: CreateFeeConfigDto) {
    return this.feesService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFeeConfigDto) {
    return this.feesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.feesService.remove(id);
  }
}
