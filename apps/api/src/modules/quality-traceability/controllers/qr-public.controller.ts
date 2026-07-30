import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { QrBarcodeEngineService } from '../services/qr-barcode-engine.service';

@ApiTags('Quality & Traceability — Public Consumer QR Scan')
@Controller('quality/qr/public')
export class QrPublicController {
  constructor(private readonly qrService: QrBarcodeEngineService) {}

  @Get(':qrHash')
  @ApiOperation({ summary: 'Public consumer scan endpoint returning sanitized digital lineage' })
  @ApiParam({ name: 'qrHash', description: 'Public QR Code Hash' })
  async getPublicTraceability(@Param('qrHash') qrHash: string) {
    const data = await this.qrService.getPublicTraceability(qrHash);
    return {
      success: true,
      message: 'Verified public farm-to-fork digital lineage.',
      data,
    };
  }
}
