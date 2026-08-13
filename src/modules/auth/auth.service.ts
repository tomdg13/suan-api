import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByPhoneWithPassword(dto.phone);
    if (!user) throw new UnauthorizedException('Invalid phone or password');

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) throw new UnauthorizedException('Invalid phone or password');

    const payload = { sub: user.id, phone: user.phone, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  /**
   * Looks up the user fresh from the DB (not just the JWT payload) so
   * that if an admin changes someone's role/active status after they
   * logged in, a restored session reflects the current truth rather
   * than stale claims baked into an old token.
   */
  async getProfile(userId: number) {
    const user = await this.usersService.findOne(userId);
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };
  }
}
