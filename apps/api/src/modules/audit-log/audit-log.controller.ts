import { Controller, Get, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

@ApiTags('Compliance Audit Logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiBearerAuth()
  @RequirePermission('AUDIT', 'LOGS', 'view')
  @ApiOperation({ summary: 'Retrieve operational mutation audit logs history' })
  async findLogs(
    @Query() query: QueryAuditLogDto,
    @Request() req,
  ) {
    const user = req.user;

    // Enforce Tenant Isolation boundaries: Only SYSTEM_ADMIN can view logs across all tenants.
    if (user.userType !== 'SYSTEM_ADMIN') {
      if (query.tenantId && query.tenantId !== user.tenantId) {
        throw new ForbiddenException('Access denied. You can only view audit logs for your own tenant.');
      }
      query.tenantId = user.tenantId;
    }

    return this.auditLogService.findLogs({
      tenantId: query.tenantId,
      companyId: query.companyId,
      userId: query.userId,
      action: query.action,
      entityName: query.entityName,
      startDate: query.startDate,
      endDate: query.endDate,
      limit: query.limit ? Number(query.limit) : undefined,
      offset: query.offset ? Number(query.offset) : undefined,
    });
  }
}
