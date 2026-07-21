import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { SetupWizardService } from './setup-wizard.service';
import { Step1ProfileDto } from './dto/step1-profile.dto';
import { Step2AddressDto } from './dto/step2-address.dto';
import { Step3ContactDto } from './dto/step3-contact.dto';
import { Step7FiscalDto } from './dto/step7-fiscal.dto';
import { Step8ModulesDto } from './dto/step8-modules.dto';
import { CreateNobDto, UpdateNobDto, CreateLobDto, UpdateLobDto } from './dto/nob-lob.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SystemAdminGuard } from '../../common/guards/system-admin.guard';

@ApiTags('Onboarding Setup Wizard')
@Controller('setup/wizard')
export class SetupWizardController {
  constructor(private readonly wizardService: SetupWizardService) {}

  @Post('step-1')
  @ApiOperation({ summary: 'Step 1: Save Company legal Profile info' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Step completed.' })
  async saveStep1(@Body() dto: Step1ProfileDto) {
    return this.wizardService.saveStep1Profile(dto);
  }

  @Post('step-2')
  @ApiOperation({ summary: 'Step 2: Save Company registered Address' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Step completed.' })
  async saveStep2(@Body() dto: Step2AddressDto) {
    return this.wizardService.saveStep2Address(dto);
  }

  @Post('step-3')
  @ApiOperation({ summary: 'Step 3: Save Company key Contacts' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Step completed.' })
  async saveStep3(@Body() dto: Step3ContactDto) {
    return this.wizardService.saveStep3Contact(dto);
  }

  @Post('step-4/:companyId/:langId')
  @ApiOperation({ summary: 'Step 4: Save default Language selection' })
  @ApiParam({ name: 'companyId', description: 'Company UUID' })
  @ApiParam({ name: 'langId', description: 'Language Master UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Step completed.' })
  async saveStep4(@Param('companyId') companyId: string, @Param('langId') langId: string) {
    return this.wizardService.saveStep4Language(companyId, langId);
  }

  @Post('step-5/:companyId/:currencyId')
  @ApiOperation({ summary: 'Step 5: Save default Base Accounting Currency selection' })
  @ApiParam({ name: 'companyId', description: 'Company UUID' })
  @ApiParam({ name: 'currencyId', description: 'Currency Master UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Step completed.' })
  async saveStep5(@Param('companyId') companyId: string, @Param('currencyId') currencyId: string) {
    return this.wizardService.saveStep5Currency(companyId, currencyId);
  }

  @Post('step-6/:companyId/:timezoneId/:countryId')
  @ApiOperation({ summary: 'Step 6: Save default Timezone and Region references' })
  @ApiParam({ name: 'companyId', description: 'Company UUID' })
  @ApiParam({ name: 'timezoneId', description: 'Timezone identifier (e.g., Asia/Kolkata)' })
  @ApiParam({ name: 'countryId', description: 'Country Master UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Step completed.' })
  async saveStep6(
    @Param('companyId') companyId: string,
    @Param('timezoneId') timezoneId: string,
    @Param('countryId') countryId: string,
  ) {
    return this.wizardService.saveStep6Timezone(companyId, timezoneId, countryId);
  }

  @Post('step-7')
  @ApiOperation({ summary: 'Step 7: Save Fiscal calendars & Inventory costing standard models' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Step completed.' })
  async saveStep7(@Body() dto: Step7FiscalDto) {
    return this.wizardService.saveStep7Fiscal(dto);
  }

  @Post('step-8/:companyId')
  @ApiOperation({ summary: 'Step 8: Save list of enabled module codes' })
  @ApiParam({ name: 'companyId', description: 'Company UUID' })
  async saveStep8(@Param('companyId') companyId: string, @Body() dto: Step8ModulesDto) {
    return this.wizardService.saveStep8Modules(companyId, dto.modules);
  }

  @Get('status/:companyId')
  @ApiOperation({ summary: 'Fetch checklist status logs of Steps 1 to 15' })
  @ApiParam({ name: 'companyId', description: 'Company UUID' })
  async getStatus(@Param('companyId') companyId: string) {
    return this.wizardService.getWizardStatus(companyId);
  }

  @Post('complete/:companyId')
  @ApiOperation({ summary: 'Validate steps 1-9 and complete setup wizard, unlocking dashboard' })
  @ApiParam({ name: 'companyId', description: 'Company UUID' })
  async completeWizard(@Param('companyId') companyId: string) {
    return this.wizardService.completeWizard(companyId);
  }

  @Get('company-details/:companyId')
  @ApiOperation({ summary: 'Retrieve all configuration details of all 8 steps for a company' })
  @ApiParam({ name: 'companyId', description: 'Company UUID' })
  async getCompanySetupDetails(@Param('companyId') companyId: string) {
    return this.wizardService.getCompanySetupDetails(companyId);
  }

  @Get('nobs')
  @ApiOperation({ summary: 'Retrieve active Nature of Business (NOB) master sectors' })
  async listNobs() {
    return this.wizardService.listNobs();
  }

  @Get('lobs/:nobId')
  @ApiOperation({ summary: 'Retrieve active Line of Business (LOB) sub-sectors filtered by parent NOB' })
  @ApiParam({ name: 'nobId', description: 'Parent NOB Master UUID' })
  async listLobs(@Param('nobId') nobId: string) {
    return this.wizardService.listLobs(nobId);
  }

  @Post('nobs')
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Admin: Create a new Nature of Business (NOB)' })
  async createNob(@Body() body: CreateNobDto) {
    return this.wizardService.createNob(body);
  }

  @Put('nobs/:id')
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Admin: Update Nature of Business configurations' })
  @ApiParam({ name: 'id', description: 'NOB UUID' })
  async updateNob(@Param('id') id: string, @Body() body: UpdateNobDto) {
    return this.wizardService.updateNob(id, body);
  }

  @Delete('nobs/:id')
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Admin: Delete a Nature of Business sector' })
  @ApiParam({ name: 'id', description: 'NOB UUID' })
  async deleteNob(@Param('id') id: string) {
    return this.wizardService.deleteNob(id);
  }

  @Post('lobs')
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Admin: Create a new Line of Business (LOB)' })
  async createLob(@Body() body: CreateLobDto) {
    return this.wizardService.createLob(body);
  }

  @Put('lobs/:id')
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Admin: Update Line of Business configurations' })
  @ApiParam({ name: 'id', description: 'LOB UUID' })
  async updateLob(@Param('id') id: string, @Body() body: UpdateLobDto) {
    return this.wizardService.updateLob(id, body);
  }

  @Delete('lobs/:id')
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Admin: Delete a Line of Business sub-sector' })
  @ApiParam({ name: 'id', description: 'LOB UUID' })
  async deleteLob(@Param('id') id: string) {
    return this.wizardService.deleteLob(id);
  }
}
