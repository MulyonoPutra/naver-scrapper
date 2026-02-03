import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NaverController } from './naver.controller';
import { NaverService } from './naver.service';

@Module({
  imports: [HttpModule],
  controllers: [NaverController],
  providers: [NaverService],
})
export class NaverModule {}
