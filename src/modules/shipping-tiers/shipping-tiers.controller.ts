import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { ShippingTiersService } from './shipping-tiers.service';
import { CreateShippingTierDto } from './dto/create-shipping-tier.dto';
import { UpdateShippingTierDto } from './dto/update-shipping-tier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
@Controller('shipping-tiers')
export class ShippingTiersController {
  constructor(private readonly service: ShippingTiersService) {}
  // Public - buyer screens use this to know the active tiers (for
  // client-side fee estimates in the cart, before checkout)
  @Get('active')
  findActive() {
    return this.service.findActiveTiers();
  }
  // Public - a product's own tiers (buyer product page, seller's
  // product form preview).
  @Get('by-product/:productId')
  findByProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.service.findByProduct(productId);
  }
  // Public - checkout/cart calls this with a product + its weight (kg)
  // and size (cm) to get a live fee estimate.
  @Get('calculate')
  calculate(
    @Query('productId') productId: string,
    @Query('weight') weight: string,
    @Query('size') size: string,
  ) {
    const parsedProduct = Number(productId);
    const parsedWeight = Number(weight);
    const parsedSize = Number(size);
    if (!Number.isFinite(parsedProduct) || parsedProduct <= 0) {
      return { price: 0 };
    }
    return this.service.calculateFeeForProduct(
      parsedProduct,
      Number.isFinite(parsedWeight) ? parsedWeight : 0,
      Number.isFinite(parsedSize) ? parsedSize : 0,
    );
  }
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.service.findAll();
  }
  // Sellers manage tiers for their own products only - ownership is
  // checked in the service against product.store.ownerId (same pattern
  // as ProductsController). Admins can manage any product's tiers.
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateShippingTierDto, @Request() req) {
    return this.service.create(dto, req.user.userId, req.user.role);
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateShippingTierDto, @Request() req) {
    return this.service.update(id, dto, req.user.userId, req.user.role);
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.service.remove(id, req.user.userId, req.user.role);
  }
}
