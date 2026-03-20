import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { User } from '@/common/security/permission.service';
import { SearchResponse, SearchService, SearchResult } from './search.service';
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

  @Get('global')
  async globalSearch(
    @CurrentUser() user: User,
    @Query('q') query: string,
    @Query('from') from?: string,
    @Query('size') size?: string,
  ): Promise<SearchResponse> {
    return this.searchService.globalSearch(
      user,
      query,
      from ? Number.parseInt(from, 10) : undefined,
      size ? Number.parseInt(size, 10) : undefined,
    );
  }

  @Get('products')
  async searchProducts(@CurrentUser() user: User, @Query('q') query: string): Promise<SearchResponse> {
    return this.searchService.searchProducts(user.tenantId, query);
  }

  @Get('customers')
  async searchCustomers(
    @CurrentUser() user: User,
    @Query('q') query: string,
  ): Promise<SearchResponse> {
    return this.searchService.searchCustomers(user.tenantId, query);
  }

  @Get('suppliers')
  async searchSuppliers(
    @CurrentUser() user: User,
    @Query('q') query: string,
  ): Promise<SearchResponse> {
    return this.searchService.searchSuppliers(user.tenantId, query);
  }

  @Get('orders')
  async searchOrders(@CurrentUser() user: User, @Query('q') query: string): Promise<SearchResponse> {
    return this.searchService.searchOrders(user.tenantId, query);
  }
}
