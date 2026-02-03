import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { NaverService } from './naver.service';

@Controller('naver')
export class NaverController {
  constructor(private readonly naverService: NaverService) {}

  @Get()
  async getProduct(@Query('productUrl') productUrl: string) {
    if (!productUrl) {
      throw new BadRequestException('productUrl is required');
    }

    return this.naverService.scrapeProduct(productUrl);
  }
}