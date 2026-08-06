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
  Request,
} from '@nestjs/common';
import { UserAddressesService } from './user-addresses.service';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { UpdateUserAddressDto } from './dto/update-user-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('user-addresses')
export class UserAddressesController {
  constructor(private readonly addressesService: UserAddressesService) {}

  @Get('my')
  findMine(@Request() req) {
    return this.addressesService.findMine(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.addressesService.findOwned(id, req.user.userId);
  }

  @Post()
  create(@Body() dto: CreateUserAddressDto, @Request() req) {
    return this.addressesService.create(req.user.userId, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserAddressDto,
    @Request() req,
  ) {
    return this.addressesService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.addressesService.remove(id, req.user.userId);
  }
}
