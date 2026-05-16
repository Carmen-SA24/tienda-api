import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

// Controlador principal de la aplicación
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Endpoint raíz: devuelve un mensaje de bienvenida
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
