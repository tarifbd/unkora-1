import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OtpService } from './otp.service';

@ApiTags('otp')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send OTP to phone number' })
  sendOtp(@Body() dto: { phone: string }) {
    if (!dto.phone) {
      return { success: false, message: 'Phone number is required' };
    }
    return this.otpService.sendOtp(dto.phone);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify OTP code' })
  verifyOtp(@Body() dto: { phone: string; code: string }) {
    if (!dto.phone || !dto.code) {
      return { valid: false, message: 'Phone and code are required' };
    }
    return this.otpService.verifyOtp(dto.phone, dto.code);
  }
}
