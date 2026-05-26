import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockUsersService = {
      findOneByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw BadRequestException if email already exists', async () => {
      usersService.findOneByEmail.mockResolvedValue({ id: '1' } as any);
      await expect(
        service.register({ email: 'test@example.com', password: 'password123', role: 'CUSTOMER' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully register a user and return OTP details', async () => {
      usersService.findOneByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ id: 'user-id', email: 'test@example.com' } as any);

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        role: 'CUSTOMER',
      });

      expect(result.userId).toBe('user-id');
      expect(result.otp).toBeDefined();
      expect(usersService.create).toHaveBeenCalled();
    });
  });

  describe('verifyOtp', () => {
    it('should throw BadRequestException if no OTP is stored for email', async () => {
      await expect(service.verifyOtp({ email: 'test@example.com', code: '123456' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should verify OTP and update user verified status', async () => {
      usersService.findOneByEmail.mockResolvedValue({ id: 'user-id', email: 'test@example.com' } as any);
      usersService.update.mockResolvedValue({} as any);

      // Register first to populate in-memory OTP store
      usersService.findOneByEmail.mockResolvedValueOnce(null);
      usersService.create.mockResolvedValueOnce({ id: 'user-id', email: 'test@example.com' } as any);
      const reg = await service.register({
        email: 'test@example.com',
        password: 'password123',
        role: 'CUSTOMER',
      });

      usersService.findOneByEmail.mockResolvedValue({ id: 'user-id', email: 'test@example.com' } as any);
      const result = await service.verifyOtp({ email: 'test@example.com', code: reg.otp });

      expect(result.message).toContain('verified successfully');
      expect(usersService.update).toHaveBeenCalledWith(
        'user-id',
        expect.objectContaining({ verifiedAt: expect.any(Date) }),
      );
    });
  });
});
