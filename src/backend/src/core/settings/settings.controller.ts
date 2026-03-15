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
import { BulkSettingsDto } from './dto/bulk-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

import { User } from '@/common/security/permission.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @Roles('admin')
  create(@CurrentUser() user: User, @Body() createSettingDto: CreateSettingDto) {
    return this.settingsService.create(user, createSettingDto);
  }

  @Post('bulk')
  @Roles('admin')
  bulkUpsert(@CurrentUser() user: User, @Body() bulkSettingsDto: BulkSettingsDto) {
    return this.settingsService.bulkUpsert(user, bulkSettingsDto.settings);
  }

  @Get()
  @Roles('admin', 'manager')
  findAll(@CurrentUser() user: User, @Query('category') category?: string) {
    return this.settingsService.findAll(user, category);
  }

  @Get('public')
  getPublicSettings(@CurrentUser() user: User) {
    return this.settingsService.getPublicSettings(user);
  }

  @Get(':key')
  @Roles('admin', 'manager')
  findOne(@CurrentUser() user: User, @Param('key') key: string) {
    return this.settingsService.findOne(user, key);
  }

  @Patch(':key')
  @Roles('admin')
  update(
    @CurrentUser() user: User,
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ) {
    return this.settingsService.update(user, key, updateSettingDto);
  }

  @Delete(':key')
  @Roles('admin')
  remove(@CurrentUser() user: User, @Param('key') key: string) {
    return this.settingsService.remove(user, key);
  }
}
