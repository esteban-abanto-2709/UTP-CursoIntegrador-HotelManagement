import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('devuelve nombre y versión de la API', () => {
      expect(appController.getInfo()).toEqual({
        name: 'Mirador Hotel Suite API',
        version: '0.0.1',
      });
    });
  });

  describe('health', () => {
    it('reporta status ok', () => {
      expect(appController.getHealth().status).toBe('ok');
    });
  });
});
