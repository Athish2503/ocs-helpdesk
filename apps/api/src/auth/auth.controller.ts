import { Controller, Post, Get, Body, UsePipes, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RegisterSchema, LoginSchema, VerifyOTPSchema } from '@ocs/shared';
import type { RegisterInput, LoginInput, VerifyOTPInput } from '@ocs/shared';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(@Body() body: RegisterInput) {
    return this.authService.register(body);
  }

  @Post('verify-otp')
  @UsePipes(new ZodValidationPipe(VerifyOTPSchema))
  async verifyOtp(@Body() body: VerifyOTPInput) {
    return this.authService.verifyOtp(body);
  }

  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() body: LoginInput) {
    return this.authService.login(body);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: any) {
    return {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    };
  }
}
