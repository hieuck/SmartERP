import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAddressDto {
  @ApiProperty({
    example: {
      fullName: 'John Doe',
      phone: '0123456789',
      address: '123 Main St',
      city: 'Ho Chi Minh',
      district: 'District 1',
      ward: 'Ward 1',
      postalCode: '700000',
    },
  })
  @IsObject()
  address: any;
}
