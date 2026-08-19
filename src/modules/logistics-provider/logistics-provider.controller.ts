import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { logisticsProviderMulterOptions } from '../../config/logistics-provider-multer.config';
import { LogisticsProviderService } from './logistics-provider.service';
import { CreateLogisticsProviderDto } from './dto/create-logistics-provider.dto';
import { UpdateLogisticsProviderDto } from './dto/update-logistics-provider.dto';

@Controller('logistics-provider')
export class LogisticsProviderController {
  constructor(private readonly service: LogisticsProviderService) {}

  @Get()
  findAll(@Query('active') active?: string) {
    if (active === '1') return this.service.findActive();
    return this.service.findAll();
  }

  @Patch('reorder')
  reorder(@Body() body: { items: { id: number; sortOrder: number }[] }) {
    return this.service.reorder(body.items);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', logisticsProviderMulterOptions))
  create(@Body() dto: CreateLogisticsProviderDto, @UploadedFile() file: Express.Multer.File) {
    return this.service.create(dto, file?.filename);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('file', logisticsProviderMulterOptions))
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLogisticsProviderDto, @UploadedFile() file: Express.Multer.File) {
    return this.service.update(id, dto, file?.filename);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.service.toggleActive(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
