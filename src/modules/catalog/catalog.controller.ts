import { Controller, Get } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('categories')
  findAllCategories() {
    return this.catalogService.findAllCategories();
  }

  @Get('units')
  findAllUnits() {
    return this.catalogService.findAllUnits();
  }
}
