import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterInput, LoginInput, VerifyOTPInput } from '@ocs/shared';
import { User, Role } from '../../generated/prisma';

@Injectable()
export class AuthService {
  // In-memory store for OTPs for this phase
  private otpStore = new Map<string, { code: string; expiresAt: number }>();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.usersService.findOneByEmail(input.email);
    if (existing) {
      throw new BadRequestException('Email is already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await this.usersService.create({
      email: input.email,
      passwordHash,
      role: input.role as Role,
      isActive: true, // User is active, but needs verification
    });

    // Generate placeholder 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    this.otpStore.set(input.email, { code: otpCode, expiresAt });

    console.log(`[AUTH] Registration OTP for ${input.email}: ${otpCode}`);

    return {
      message: 'User registered successfully. Please verify your email.',
      userId: user.id,
      email: user.email,
      otp: otpCode, // Returning for testing purposes
    };
  }

  async verifyOtp(input: VerifyOTPInput) {
    const record = this.otpStore.get(input.email);
    if (!record) {
      throw new BadRequestException('No verification code pending for this email');
    }

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(input.email);
      throw new BadRequestException('Verification code has expired');
    }

    if (record.code !== input.code) {
      throw new BadRequestException('Invalid verification code');
    }

    // Update user status
    const user = await this.usersService.findOneByEmail(input.email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.usersService.update(user.id, {
      verifiedAt: new Date(),
    });

    this.otpStore.delete(input.email);

    return {
      message: 'Email verified successfully. You can now login.',
    };
  }

  async login(input: LoginInput) {
    const user = await this.usersService.findOneByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.verifiedAt) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'secret-key-placeholder',
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-placeholder',
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-placeholder',
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive || !user.verifiedAt) {
        throw new UnauthorizedException('Invalid token or inactive account');
      }

      const newPayload = { email: user.email, sub: user.id, role: user.role };
      const accessToken = this.jwtService.sign(newPayload, {
        secret: process.env.JWT_SECRET || 'secret-key-placeholder',
        expiresIn: '15m',
      });

      return {
        accessToken,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
