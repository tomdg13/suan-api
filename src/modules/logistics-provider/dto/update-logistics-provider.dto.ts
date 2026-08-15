import { PartialType } from '@nestjs/mapped-types';
import { CreateLogisticsProviderDto } from './create-logistics-provider.dto';

export class UpdateLogisticsProviderDto extends PartialType(CreateLogisticsProviderDto) {}
