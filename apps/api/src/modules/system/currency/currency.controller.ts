import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CurrencyService } from './currency.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SystemAdminGuard } from '../../../common/guards/system-admin.guard';
import { UpdateExchangeRateDto, CreateCurrencyDto, UpdateCurrencyDto } from './dto/currency.dto';

@ApiTags('Currency Exchange Engine')
@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get()
  @ApiOperation({ summary: 'Fetch all active currencies' })
  async listCurrencies() {
    return this.currencyService.listCurrencies();
  }

  @Get('rates')
  @ApiOperation({ summary: 'Fetch active currency exchange conversion rates' })
  async listExchangeRates() {
    return this.currencyService.listExchangeRates();
  }

  @Post('rate')
  @ApiOperation({ summary: 'Register/Update conversion exchange rate' })
  async updateExchangeRate(@Body() body: UpdateExchangeRateDto) {
    return this.currencyService.updateExchangeRate(
      body.fromCurrencyId,
      body.toCurrencyId,
      body.rate,
      body.source,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Admin: Create a new supported currency' })
  async createCurrency(@Body() body: CreateCurrencyDto) {
    return this.currencyService.createCurrency(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Admin: Update currency details' })
  @ApiParam({ name: 'id', description: 'Currency UUID' })
  async updateCurrency(@Param('id') id: string, @Body() body: UpdateCurrencyDto) {
    return this.currencyService.updateCurrency(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Admin: Delete a currency' })
  @ApiParam({ name: 'id', description: 'Currency UUID' })
  async deleteCurrency(@Param('id') id: string) {
    return this.currencyService.deleteCurrency(id);
  }
}
