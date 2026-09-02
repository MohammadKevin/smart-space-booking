import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('@nestjs/jwt', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    sign: jest.fn(() => 'mock-jwt-token'),
  })),
}));

describe('AuthService (QA/QC Unit Tests)', () => {
  let authService: AuthService;
  let prismaService: any;
  let jwtService: any;

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      member: {
        create: jest.fn(),
      },
      spaceOwner: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      staff: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaService)),
    };

    jwtService = {
      sign: jest.fn(() => 'mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'unknown@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const hashedPassword = await bcrypt.hash('correctpass', 10);
      prismaService.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        password: hashedPassword,
        role: 'member',
      });

      await expect(
        authService.login({
          email: 'user@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return token and sanitized user on successful login', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      prismaService.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        password: hashedPassword,
        role: 'member',
        member: { id: 10, namaMember: 'Kevin' },
      });

      const result = await authService.login({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('access_token', 'mock-jwt-token');
      expect(result.user).toHaveProperty('email', 'user@example.com');
      expect((result.user as any).password).toBeUndefined();
    });
  });

  describe('registerMember', () => {
    it('should throw ConflictException if email already exists', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'exist@example.com',
      });

      await expect(
        authService.registerMember({
          email: 'exist@example.com',
          password: 'password123',
          namaMember: 'Kevin',
          instansi: 'SMK 1',
          alamat: 'Surabaya',
          telp: '08123456789',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create new member user with email and return token', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue({
        id: 2,
        email: 'newmember@example.com',
        role: 'member',
      });
      prismaService.member.create.mockResolvedValue({
        id: 20,
        namaMember: 'New Member',
        telp: '08123456789',
      });

      const result = await authService.registerMember({
        email: 'newmember@example.com',
        password: 'password123',
        namaMember: 'New Member',
        instansi: 'SMK 1',
        alamat: 'Surabaya',
        telp: '08123456789',
      });

      expect(result).toHaveProperty('access_token', 'mock-jwt-token');
      expect(result.user).toHaveProperty('email', 'newmember@example.com');
    });
  });
});
