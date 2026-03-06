import { PartialType } from '@nestjs/swagger';
import { CreateMoldDto } from './create-mold.dto';

export class UpdateMoldDto extends PartialType(CreateMoldDto) {}
