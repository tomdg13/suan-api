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
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  addItem(@Request() req, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(req.user.userId, dto);
  }

  @Get()
  getCart(@Request() req) {
    return this.cartService.getCartGroupedByStore(req.user.userId);
  }

  @Patch(':id')
  updateQty(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body('qty') qty: number,
  ) {
    return this.cartService.updateQty(req.user.userId, id, qty);
  }

  @Delete(':id')
  removeItem(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.cartService.removeItem(req.user.userId, id);
  }
}
