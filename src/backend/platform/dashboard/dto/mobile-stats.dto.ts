import { ApiProperty } from '@nestjs/swagger';

export class MobileRevenueDto {
  @ApiProperty({ example: 1500000 })
  today: number;

  @ApiProperty({ example: 8500000 })
  week: number;

  @ApiProperty({ example: 35000000 })
  month: number;
}

export class MobileOrdersDto {
  @ApiProperty({ example: 15 })
  today: number;

  @ApiProperty({ example: 85 })
  week: number;

  @ApiProperty({ example: 350 })
  month: number;

  @ApiProperty({ example: 25 })
  pending: number;
}

export class MobileInventoryDto {
  @ApiProperty({ example: 125000000 })
  totalValue: number;

  @ApiProperty({ example: 15 })
  lowStockCount: number;

  @ApiProperty({ example: 3 })
  outOfStockCount: number;
}

export class MobileCustomersDto {
  @ApiProperty({ example: 350 })
  total: number;

  @ApiProperty({ example: 25 })
  new: number;
}

export class MobileDashboardStatsDto {
  @ApiProperty({ type: MobileRevenueDto })
  revenue: MobileRevenueDto;

  @ApiProperty({ type: MobileOrdersDto })
  orders: MobileOrdersDto;

  @ApiProperty({ type: MobileInventoryDto })
  inventory: MobileInventoryDto;

  @ApiProperty({ type: MobileCustomersDto })
  customers: MobileCustomersDto;

  @ApiProperty({ example: 15000000 })
  receivables: number;

  @ApiProperty({ example: 8000000 })
  payables: number;
}
