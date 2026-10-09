import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

describe('MailService (Environment-Aware Verification & Reset Link Generation)', () => {
  let mailService: MailService;
  let mockConfigService: any;

  const createServiceWithConfig = async (configValues: Record<string, any>) => {
    mockConfigService = {
      get: jest.fn((key: string) => configValues[key]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    return module.get<MailService>(MailService);
  };

  describe('Production Environment (NODE_ENV=production)', () => {
    it('1. should resolve to production marketplace URL when no URL is explicitly configured', async () => {
      const service = await createServiceWithConfig({
        nodeEnv: 'production',
        'mail.verificationUrl': '',
        'mail.passwordResetUrl': '',
      });

      expect(service.getVerificationBaseUrl()).toBe(
        'https://casa-real-estate-mocha.vercel.app/auth/verify-email',
      );
      expect(service.getPasswordResetBaseUrl()).toBe(
        'https://casa-real-estate-mocha.vercel.app/auth/reset-password',
      );
    });

    it('2. should reject localhost/127.0.0.1 overrides in production and enforce live marketplace URL', async () => {
      const service = await createServiceWithConfig({
        nodeEnv: 'production',
        'mail.verificationUrl': 'http://localhost:3000/auth/verify-email',
        'mail.passwordResetUrl': 'http://127.0.0.1:3000/auth/reset-password',
      });

      expect(service.getVerificationBaseUrl()).toBe(
        'https://casa-real-estate-mocha.vercel.app/auth/verify-email',
      );
      expect(service.getPasswordResetBaseUrl()).toBe(
        'https://casa-real-estate-mocha.vercel.app/auth/reset-password',
      );
    });

    it('3. should preserve valid custom production domain if explicitly configured without localhost', async () => {
      const service = await createServiceWithConfig({
        nodeEnv: 'production',
        'mail.verificationUrl': 'https://custom-marketplace.casarealestate.com/auth/verify-email',
        'mail.passwordResetUrl': 'https://custom-marketplace.casarealestate.com/auth/reset-password',
      });

      expect(service.getVerificationBaseUrl()).toBe(
        'https://custom-marketplace.casarealestate.com/auth/verify-email',
      );
      expect(service.getPasswordResetBaseUrl()).toBe(
        'https://custom-marketplace.casarealestate.com/auth/reset-password',
      );
    });

    it('4. should generate fully URL-encoded production verification links for mobile compatibility', async () => {
      const service = await createServiceWithConfig({
        nodeEnv: 'production',
      });

      const token = 'tok_sec_1234567890abcdef==';
      const email = 'alex.morgan+investor@casarealestate.com';

      const link = service.generateVerificationLink(email, token);

      expect(link).toContain('https://casa-real-estate-mocha.vercel.app/auth/verify-email');
      expect(link).not.toContain('localhost');
      expect(link).toContain('token=tok_sec_1234567890abcdef%3D%3D');
      expect(link).toContain('email=alex.morgan%2Binvestor%40casarealestate.com');
    });

    it('5. should generate fully URL-encoded production password reset links', async () => {
      const service = await createServiceWithConfig({
        nodeEnv: 'production',
      });

      const token = 'rst_sec_9876543210zyxwvu';
      const email = 'jane.doe+buyer@casarealestate.com';

      const link = service.generatePasswordResetLink(email, token);

      expect(link).toContain('https://casa-real-estate-mocha.vercel.app/auth/reset-password');
      expect(link).not.toContain('localhost');
      expect(link).toContain('token=rst_sec_9876543210zyxwvu');
      expect(link).toContain('email=jane.doe%2Bbuyer%40casarealestate.com');
    });
  });

  describe('Local Development Environment (NODE_ENV=development)', () => {
    it('6. should use localhost:3000 by default in development', async () => {
      const service = await createServiceWithConfig({
        nodeEnv: 'development',
        'mail.verificationUrl': 'http://localhost:3000/auth/verify-email',
        'mail.passwordResetUrl': 'http://localhost:3000/auth/reset-password',
      });

      expect(service.getVerificationBaseUrl()).toBe('http://localhost:3000/auth/verify-email');
      expect(service.getPasswordResetBaseUrl()).toBe('http://localhost:3000/auth/reset-password');

      const link = service.generateVerificationLink('dev@example.com', 'dev_token_123');
      expect(link).toBe('http://localhost:3000/auth/verify-email?token=dev_token_123&email=dev%40example.com');
    });
  });
});
