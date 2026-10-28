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

  describe('Welcome Email Dispatch & Template Compliance', () => {
    it('7. should dispatch welcome email with official subject and exact required body content', async () => {
      const mockTransporter = {
        sendMail: jest.fn().mockResolvedValue({ messageId: 'msg_welcome_123' }),
      };

      const service = await createServiceWithConfig({
        nodeEnv: 'production',
        'mail.host': 'smtp.hostinger.com',
        'mail.user': 'info.mypropertyin@gmail.com',
        'mail.pass': 'secret',
        'mail.from': '"My Property" <info.mypropertyin@gmail.com>',
      });

      // Inject mock transporter
      (service as any).transporter = mockTransporter;

      const res = await service.sendWelcomeEmail('john.doe@example.com', 'John Doe');

      expect(res.success).toBe(true);
      expect(res.messageId).toBe('msg_welcome_123');
      expect(res.isMock).toBe(false);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      const callArg = mockTransporter.sendMail.mock.calls[0][0];

      expect(callArg.to).toBe('john.doe@example.com');
      expect(callArg.from).toBe('"My Property" <info.mypropertyin@gmail.com>');
      expect(callArg.subject).toBe('Welcome to MyProperty!');

      // Verify exact body content
      const expectedText =
`Hello John Doe,

Welcome to MyProperty!

Thank you for joining MyProperty, your platform for discovering and listing properties.

Your account has been successfully created. You can now sign in to your account and explore MyProperty.

We're happy to have you with us!

Best regards,
Team MyProperty
MyProperty`;

      expect(callArg.text).toBe(expectedText);
      expect(callArg.html).toContain('Welcome to MyProperty!');
      expect(callArg.html).toContain('Hello John Doe');
      expect(callArg.html).toContain('Team MyProperty');
    });

    it('8. should resolve sender from mail.from configuration or environment variables', async () => {
      const mockTransporter = {
        sendMail: jest.fn().mockResolvedValue({ messageId: 'msg_welcome_456' }),
      };

      const service = await createServiceWithConfig({
        nodeEnv: 'production',
        'mail.host': 'smtp.gmail.com',
        'mail.user': 'notifications@myproperty.in',
        'mail.pass': 'secret',
        'mail.from': 'Custom Sender <custom@myproperty.in>',
      });

      (service as any).transporter = mockTransporter;

      await service.sendWelcomeEmail('recipient@example.com', 'Recipient');

      const callArg = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArg.from).toBe('Custom Sender <custom@myproperty.in>');
    });

    it('9. should return unconfigured error gracefully without throwing when SMTP credentials are omitted', async () => {
      const service = await createServiceWithConfig({
        nodeEnv: 'development',
      });

      const res = await service.sendWelcomeEmail('user@example.com', 'New User');

      expect(res.success).toBe(false);
      expect(res.isMock).toBe(true);
      expect(res.error).toBe('SMTP delivery service is not configured');
    });

    it('10. should catch transporter rejection and return failure result without throwing', async () => {
      const mockTransporter = {
        sendMail: jest.fn().mockRejectedValue(new Error('SMTP Connection Refused')),
      };

      const service = await createServiceWithConfig({
        nodeEnv: 'production',
        'mail.host': 'smtp.fail.com',
        'mail.user': 'user@fail.com',
        'mail.pass': 'secret',
      });

      (service as any).transporter = mockTransporter;

      const res = await service.sendWelcomeEmail('fail@example.com', 'Fail User');

      expect(res.success).toBe(false);
      expect(res.isMock).toBe(false);
      expect(res.error).toBe('SMTP Connection Refused');
    });
  });
});
