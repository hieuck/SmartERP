import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { User } from '@/common/security/permission.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { SyncService } from './sync.service';
import { PullDto, PushDto, ResolveConflictDto } from './dto';

@ApiTags('sync')
@Controller('sync')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('pull')
  @ApiOperation({
    summary: 'Pull changes from server',
    description: 'Download all changes since last sync timestamp',
  })
  async pull(@Body() dto: PullDto, @CurrentUser() user: User) {
    return this.syncService.pull(user.tenantId, dto);
  }

  @Post('push')
  @ApiOperation({
    summary: 'Push local changes to server',
    description: 'Upload local changes and detect conflicts',
  })
  async push(@Body() dto: PushDto, @CurrentUser() user: User) {
    return this.syncService.push(user.tenantId, dto);
  }

  @Post('resolve')
  @ApiOperation({
    summary: 'Resolve sync conflict',
    description: 'Apply conflict resolution strategy',
  })
  async resolve(@Body() dto: ResolveConflictDto, @CurrentUser() user: User) {
    return this.syncService.resolveConflict(user.tenantId, dto);
  }
}
