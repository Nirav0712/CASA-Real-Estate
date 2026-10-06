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
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedUser } from './interfaces/jwt-payload.interface';

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
      sameSite: 'lax',
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
      sameSite: 'lax',
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
      sameSite: 'lax',
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
      sameSite: 'lax',
      path: '/',
    });
  }

  @Public()
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request 6-digit OTP challenge for mobile authentication' })
  @ApiResponse({ status: 200, description: 'OTP challenge generated and dispatched' })
  @ApiResponse({ status: 400, description: 'Invalid mobile number or cooldown active' })
  async requestOtp(@Body() dto: RequestOtpDto, @Req() req: Request) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];
    return this.authService.requestOtp(dto, { ipAddress, userAgent });
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP challenge and obtain authentication credentials' })
  @ApiResponse({ status: 200, description: 'User verified and authenticated successfully' })
  @ApiResponse({ status: 400, description: 'Incorrect or expired OTP' })
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
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate and refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'New access token issued' })
  @ApiResponse({ status: 401, description: 'Invalid or revoked refresh token' })
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
}
