import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getStatusPage(): string {
    return this.appService.renderStatusPage();
  }

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
