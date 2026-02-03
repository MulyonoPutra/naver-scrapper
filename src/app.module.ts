import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NaverModule } from './naver/naver.module';

@Module({
  imports: [NaverModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
