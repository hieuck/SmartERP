import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { SearchService, SearchResult } from './search.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

import { User } from '@/common/security/permission.service';
@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@CurrentUser() user: User, @Query('q') query: string): Promise<SearchResult[]> {
    return this.searchService.search(user, query);
  }

  @Get('by-type')
  async searchByType(
    @CurrentUser() user: User,
    @Query('type') type: string,
    @Query('q') query: string,
  ): Promise<SearchResult[]> {
    return this.searchService.searchByType(user.tenantId, type, query);
  }
}
