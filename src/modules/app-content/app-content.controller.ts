import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AppContentService } from './app-content.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';

@Controller('app-content')
export class AppContentController {
  constructor(private readonly service: AppContentService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.service.findByKey(key);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':key')
  update(@Param('key') key: string, @Body('value') value: string) {
    return this.service.upsert(key, value);
  }
}
