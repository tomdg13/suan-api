import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Used by the app on startup to restore a saved session: given a
   * still-valid JWT, returns the current user's profile. If the token
   * is missing/expired/invalid, JwtAuthGuard rejects with 401 and the
   * app should treat that as "not logged in" and discard the token.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }
}
