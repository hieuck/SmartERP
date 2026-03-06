import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @Roles('admin')
  create(@TenantId() tenantId: string, @Body() createSettingDto: CreateSettingDto) {
    return this.settingsService.create(tenantId, createSettingDto);
  }

  @Get()
  @Roles('admin', 'manager')
  findAll(@TenantId() tenantId: string, @Query('category') category?: string) {
    return this.settingsService.findAll(tenantId, category);
  }

  @Get('public')
  getPublicSettings(@TenantId() tenantId: string) {
    return this.settingsService.getPublicSettings(tenantId);
  }

  @Get(':key')
  @Roles('admin', 'manager')
  findOne(@TenantId() tenantId: string, @Param('key') key: string) {
    return this.settingsService.findOne(tenantId, key);
  }

  @Patch(':key')
  @Roles('admin')
  update(
    @TenantId() tenantId: string,
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ) {
    return this.settingsService.update(tenantId, key, updateSettingDto);
  }

  @Delete(':key')
  @Roles('admin')
  remove(@TenantId() tenantId: string, @Param('key') key: string) {
    return this.settingsService.remove(tenantId, key);
  }
}
