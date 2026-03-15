import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { randomBytes } from 'crypto';
import { SkipCsrf } from './skip-csrf.decorator';

/**
 * CSRF Token Controller
 *
 * Provides CSRF token generation endpoint:
 * - GET /csrf-token - Generate and return CSRF token
 * - Sets token in cookie and returns in response
 * - Frontend should include token in X-CSRF-Token header
 */
@ApiTags('security')
@Controller('csrf-token')
export class CsrfController {
  @Get()
  @SkipCsrf()
  @ApiOperation({ summary: 'Get CSRF token' })
  @ApiResponse({
    status: 200,
    description: 'CSRF token generated',
    schema: {
      example: {
        csrfToken: 'a1b2c3d4e5f6...',
      },
    },
  })
  getCsrfToken(@Res({ passthrough: true }) res: Response) {
    // Generate random CSRF token
    const csrfToken = randomBytes(32).toString('hex');

    // Set token in cookie (httpOnly for security)
    res.cookie('csrf-token', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return token to client (to be included in X-CSRF-Token header)
    return {
      csrfToken,
    };
  }
}
