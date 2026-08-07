import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { OrderStatus } from './entities/order.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { paymentProofMulterOptions } from '../../config/payment-proof-multer.config';
import { extractRrnFromImage } from './ocr.util';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  checkout(@Request() req, @Body() dto: CheckoutDto) {
    return this.ordersService.checkout(req.user.userId, dto);
  }

  @Get('my')
  findMyOrders(@Request() req) {
    return this.ordersService.findByUser(req.user.userId);
  }

  @Get('store/:storeId')
  findByStore(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.ordersService.findByStore(storeId);
  }

  // Admin: orders awaiting payment confirmation (proof uploaded, not yet
  // confirmed). Must come BEFORE the ':id' route below, otherwise Nest
  // would try to parse "admin" as a numeric id and 400.
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('admin/pending-payments')
  findPendingPaymentConfirmations() {
    return this.ordersService.findPendingPaymentConfirmations();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateStatus(id, status);
  }

  // Admin: confirm the money actually arrived — marks paid + moves the
  // order to CONFIRMED so the seller can start packing.
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id/confirm-payment')
  confirmPayment(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.confirmPayment(id);
  }

  // Buyer uploads their bank payment-confirmation screenshot + the RRN
  // they read off it (pre-filled client-side via OCR, editable). Only
  // the buyer who owns the order can attach proof to it.
  @Post(':id/payment-proof')
  @UseInterceptors(FileInterceptor('file', paymentProofMulterOptions))
  submitPaymentProof(
    @Param('id', ParseIntPipe) id: number,
    @Body('rrn') rrn: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.ordersService.submitPaymentProof(id, req.user.userId, rrn, file?.filename);
  }

  // Server-side OCR (tesseract.js) for extracting the RRN from a payment
  // screenshot. Used as the Web fallback since on-device ML Kit OCR
  // (mobile) has no browser/web implementation. This endpoint doesn't
  // persist anything — memory storage only, scan-and-discard.
  @Post('ocr-scan')
  @UseInterceptors(FileInterceptor('file'))
  async ocrScan(@UploadedFile() file: Express.Multer.File) {
    if (!file?.buffer) {
      return { text: '', rrn: null };
    }
    return extractRrnFromImage(file.buffer);
  }
}
