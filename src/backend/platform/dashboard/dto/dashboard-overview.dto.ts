import { ApiProperty } from '@nestjs/swagger';

export class RevenueStatsDto {
  @ApiProperty({ example: 1500000 })
  today: number;

  @ApiProperty({ example: 8500000 })
  thisWeek: number;

  @ApiProperty({ example: 35000000 })
  thisMonth: number;

  @ApiProperty({ example: 12.5 })
  growth: number;
}

export class OrderStatsDto {
  @ApiProperty({ example: 150 })
  total: number;

  @ApiProperty({ example: 25 })
  pending: number;

  @ApiProperty({ example: 100 })
  completed: number;

  @ApiProperty({ example: 5 })
  cancelled: number;
}

export class InventoryStatsDto {
  @ApiProperty({ example: 500 })
  totalProducts: number;

  @ApiProperty({ example: 15 })
  lowStock: number;

  @ApiProperty({ example: 3 })
  outOfStock: number;

  @ApiProperty({ example: 125000000 })
  totalValue: number;
}

export class CustomerStatsDto {
  @ApiProperty({ example: 350 })
  total: number;

  @ApiProperty({ example: 280 })
  active: number;

  @ApiProperty({ example: 25 })
  new: number;
}

export class PaymentStatsDto {
  @ApiProperty({ example: 12 })
  pending: number;

  @ApiProperty({ example: 138 })
  completed: number;

  @ApiProperty({ example: 45000000 })
  totalAmount: number;
}

export class DashboardOverviewDto {
  @ApiProperty({ type: RevenueStatsDto })
  revenue: RevenueStatsDto;

  @ApiProperty({ type: OrderStatsDto })
  orders: OrderStatsDto;

  @ApiProperty({ type: InventoryStatsDto })
  inventory: InventoryStatsDto;

  @ApiProperty({ type: CustomerStatsDto })
  customers: CustomerStatsDto;

  @ApiProperty({ type: PaymentStatsDto })
  payments: PaymentStatsDto;
}
