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
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaymentQrService } from './payment-qr.service';
import { CreatePaymentQrDto } from './dto/create-payment-qr.dto';
import { UpdatePaymentQrDto } from './dto/update-payment-qr.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { paymentQrMulterOptions } from '../../config/payment-qr-multer.config';

@Controller('payment-qr')
export class PaymentQrController {
  constructor(private readonly paymentQrService: PaymentQrService) {}

  @Get()
  findActive() {
    return this.paymentQrService.findActive();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('history')
  findAll() {
    return this.paymentQrService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentQrService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @UseInterceptors(FileInterceptor('file', paymentQrMulterOptions))
  create(@Body() dto: CreatePaymentQrDto, @UploadedFile() file: Express.Multer.File, @Req() req) {
    return this.paymentQrService.create(dto, file?.filename, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', paymentQrMulterOptions))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentQrDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.paymentQrService.update(id, dto, file?.filename);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentQrService.remove(id);
  }
}
