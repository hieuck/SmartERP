import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService, SearchResult } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@TenantId() tenantId: string, @Query('q') query: string): Promise<SearchResult[]> {
    return this.searchService.search(tenantId, query);
  }

  @Get('by-type')
  async searchByType(
    @TenantId() tenantId: string,
    @Query('type') type: string,
    @Query('q') query: string,
  ): Promise<SearchResult[]> {
    return this.searchService.searchByType(tenantId, type, query);
  }
}
