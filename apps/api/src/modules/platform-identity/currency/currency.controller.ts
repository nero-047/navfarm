import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
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
  @ApiQuery({ name: 'fromCurrencyId', required: false, description: 'Source Currency UUID' })
  @ApiQuery({ name: 'toCurrencyId', required: false, description: 'Target Currency UUID' })
  async listExchangeRates(
    @Query('fromCurrencyId') fromCurrencyId?: string,
    @Query('toCurrencyId') toCurrencyId?: string
  ) {
    return this.currencyService.listExchangeRates(fromCurrencyId, toCurrencyId);
  }

  @Get('rate/:id')
  @ApiOperation({ summary: 'Fetch a single exchange rate entry by ID' })
  @ApiParam({ name: 'id', description: 'Exchange Rate UUID' })
  async getExchangeRateById(@Param('id') id: string) {
    return this.currencyService.getExchangeRateById(id);
  }

  @Post('rate')
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register conversion exchange rate' })
  async updateExchangeRate(@Body() body: UpdateExchangeRateDto) {
    return this.currencyService.updateExchangeRate(
      body.fromCurrencyId,
      body.toCurrencyId,
      body.rate,
      body.source,
    );
  }

  @Put('rate/:id')
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing exchange rate by ID' })
  @ApiParam({ name: 'id', description: 'Exchange Rate UUID' })
  async updateExchangeRateById(
    @Param('id') id: string,
    @Body() body: { rate: number; source?: string }
  ) {
    return this.currencyService.updateExchangeRateById(id, body.rate, body.source);
  }

  @Delete('rate/:id')
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an exchange rate entry by ID' })
  @ApiParam({ name: 'id', description: 'Exchange Rate UUID' })
  async deleteExchangeRateById(@Param('id') id: string) {
    return this.currencyService.deleteExchangeRateById(id);
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
