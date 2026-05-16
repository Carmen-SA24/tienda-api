import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TiendaModule } from './tienda/tienda.module';

// Módulo principal de la aplicación
// Configura la conexión a MySQL, carga variables de entorno e importa los módulos funcionales
@Module({
  imports: [
    // Carga variables de entorno desde el archivo .env
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    // Configura la conexión a MySQL usando variables de entorno
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT') || '3306', 10),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: (config.get<string>('DB_SYNC') === 'true'),
        logging: false,
      }),
    }),
    // Módulos funcionales de la aplicación
    AuthModule,   // Autenticación (registro, login, JWT)
    UserModule,   // Gestión de usuarios
    TiendaModule, // Tienda online (productos y carrito)
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
