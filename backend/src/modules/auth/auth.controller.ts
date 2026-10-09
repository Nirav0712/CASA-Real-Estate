import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LinkCredentialsDto } from './dto/link-credentials.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedUser } from './interfaces/jwt-payload.interface';
import { RateLimit } from '../../common/guards/rate-limit.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Helper to attach HttpOnly refresh token cookie
   */
  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    const isProduction = this.configService.get<string>('nodeEnv') === 'production';
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/api/v1/auth',
      maxAge: maxAgeMs,
    });
  }

  /**
   * Helper to clear refresh token cookie
   */
  private clearRefreshTokenCookie(res: Response) {
    const isProduction = this.configService.get<string>('nodeEnv') === 'production';
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/api/v1/auth',
    });
  }

  /**
   * Helper to attach HttpOnly access token cookie
   */
  private setAccessTokenCookie(res: Response, accessToken: string) {
    const isProduction = this.configService.get<string>('nodeEnv') === 'production';
    const maxAgeMs = 15 * 60 * 1000; // 15 mins

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: maxAgeMs,
    });
  }

  /**
   * Helper to clear access token cookie
   */
  private clearAccessTokenCookie(res: Response) {
    const isProduction = this.configService.get<string>('nodeEnv') === 'production';
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });
  }

  // =========================================================================
  // STEP 2B: SECURE EMAIL / PASSWORD AUTHENTICATION APIS
  // =========================================================================

  @Public()
  @RateLimit({ limit: 15, windowMs: 60000, keyPrefix: 'auth_register' })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account with email and password' })
  @ApiResponse({ status: 201, description: 'Account registered; verification email sent' })
  @ApiResponse({ status: 400, description: 'Invalid input or validation failure' })
  @ApiResponse({ status: 409, description: 'Account with email already exists' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @RateLimit({ limit: 20, windowMs: 60000, keyPrefix: 'auth_login' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with registered email and password' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or unverified email' })
  @ApiResponse({ status: 403, description: 'Account suspended or deactivated' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.login(dto, { ipAddress, userAgent });

    // Set secure HttpOnly cookies for refresh and access tokens
    this.setRefreshTokenCookie(res, result.tokens.refreshToken);
    this.setAccessTokenCookie(res, result.tokens.accessToken);

    return {
      success: true,
      message: result.message,
      user: result.user,
      tokens: {
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn,
        tokenType: result.tokens.tokenType,
      },
    };
  }

  @Public()
  @RateLimit({ limit: 30, windowMs: 60000, keyPrefix: 'auth_verify_email' })
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address using single-use activation token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Public()
  @RateLimit({ limit: 10, windowMs: 60000, keyPrefix: 'auth_resend_verification' })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification link' })
  @ApiResponse({ status: 200, description: 'Verification link dispatched if account is pending' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @Public()
  @RateLimit({ limit: 10, windowMs: 60000, keyPrefix: 'auth_forgot_password' })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset token via email' })
  @ApiResponse({ status: 200, description: 'Password reset instructions dispatched' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @RateLimit({ limit: 10, windowMs: 60000, keyPrefix: 'auth_reset_password' })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token received via email' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid, expired token or password mismatch' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.resetPassword(dto);
    // Clear cookies upon password reset to ensure old sessions cannot be replayed
    this.clearRefreshTokenCookie(res);
    this.clearAccessTokenCookie(res);
    return result;
  }

  // =========================================================================
  // MOBILE OTP & SESSION ENDPOINTS (PRESERVED)
  // =========================================================================

  @Public()
  @RateLimit({ limit: 60, windowMs: 60000, keyPrefix: 'auth_otp_req' })
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request 6-digit OTP challenge for mobile authentication' })
  @ApiResponse({ status: 200, description: 'OTP challenge generated and dispatched' })
  @ApiResponse({ status: 400, description: 'Invalid mobile number or cooldown active' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async requestOtp(@Body() dto: RequestOtpDto, @Req() req: Request) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];
    return this.authService.requestOtp(dto, { ipAddress, userAgent });
  }

  @Public()
  @RateLimit({ limit: 60, windowMs: 60000, keyPrefix: 'auth_otp_ver' })
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP challenge and obtain authentication credentials' })
  @ApiResponse({ status: 200, description: 'User verified and authenticated successfully' })
  @ApiResponse({ status: 400, description: 'Incorrect or expired OTP' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.verifyOtp(dto, { ipAddress, userAgent });

    // Set secure HttpOnly cookies for refresh and access tokens
    this.setRefreshTokenCookie(res, result.tokens.refreshToken);
    this.setAccessTokenCookie(res, result.tokens.accessToken);

    return {
      success: true,
      message: result.message,
      user: result.user,
      tokens: {
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn,
        tokenType: result.tokens.tokenType,
      },
    };
  }

  @Public()
  @RateLimit({ limit: 30, windowMs: 60000, keyPrefix: 'auth_refresh' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate and refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'New access token issued' })
  @ApiResponse({ status: 401, description: 'Invalid or revoked refresh token' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req.cookies && req.cookies.refresh_token) || dto.refreshToken;
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.refreshTokens(refreshToken, { ipAddress, userAgent });

    // Rotate refresh and access token cookies
    this.setRefreshTokenCookie(res, result.tokens.refreshToken);
    this.setAccessTokenCookie(res, result.tokens.accessToken);

    return {
      success: true,
      message: result.message,
      user: result.user,
      tokens: {
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn,
        tokenType: result.tokens.tokenType,
      },
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current session and revoke refresh token' })
  async logout(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req.cookies && req.cookies.refresh_token) || dto.refreshToken;
    await this.authService.logout(refreshToken);
    this.clearRefreshTokenCookie(res);
    this.clearAccessTokenCookie(res);
    return { success: true, message: 'Logged out successfully.' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all active sessions across all devices for current user' })
  async logoutAll(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(userId);
    this.clearRefreshTokenCookie(res);
    this.clearAccessTokenCookie(res);
    return { success: true, message: 'All active sessions have been revoked.' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve authenticated user identity and verified status' })
  @ApiResponse({ status: 200, description: 'Authenticated profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('link-credentials')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Link email and password to existing authenticated account for migration',
  })
  @ApiResponse({ status: 200, description: 'Credentials linked and verification email dispatched' })
  @ApiResponse({ status: 400, description: 'Validation failed or passwords do not match' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async linkCredentials(
    @CurrentUser('id') userId: string,
    @Body() dto: LinkCredentialsDto,
  ) {
    return this.authService.linkCredentials(userId, dto);
  }
}
