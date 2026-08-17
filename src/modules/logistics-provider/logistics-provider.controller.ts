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
} from '@nestjs/common';
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
  create(@Body() dto: CreateLogisticsProviderDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLogisticsProviderDto) {
    return this.service.update(id, dto);
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
