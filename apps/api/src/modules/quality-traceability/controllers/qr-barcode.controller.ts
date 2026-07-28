import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { QrBarcodeEngineService } from '../services/qr-barcode-engine.service';
import { GenerateQrBarcodeDto } from '../dto/qr-barcode.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Quality & Traceability — QR Code & GS1 Barcode Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quality/qr-barcode')
export class QrBarcodeController {
  constructor(private readonly qrService: QrBarcodeEngineService) {}

  @Post('generate')
  @RequirePermission('QUALITY', 'QR_BARCODE', 'create')
  @ApiOperation({ summary: 'Generate secure cryptographic QR / GS1-128 Barcode Hash' })
  async generateQrBarcode(@Body() dto: GenerateQrBarcodeDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.qrService.generateQrBarcode(dto, tenantId);
    return {
      success: true,
      message: 'Secure QR/Barcode generated.',
      data: result,
    };
  }

  @Get('scan/:qrHash')
  @RequirePermission('QUALITY', 'QR_BARCODE', 'view')
  @ApiOperation({ summary: 'Scan & Resolve cryptographic QR / Barcode Hash payload' })
  @ApiParam({ name: 'qrHash', description: 'QR / Barcode Hash' })
  async scanQrCode(@Param('qrHash') qrHash: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.qrService.scanQrCode(qrHash, tenantId);
    return {
      success: true,
      message: 'QR Code payload resolved.',
      data: result,
    };
  }
}
