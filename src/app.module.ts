import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TiendaModule } from './tienda/tienda.module';
import * as mysql from 'mysql2/promise';

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
      useFactory: async (config: ConfigService): Promise<TypeOrmModuleOptions> => {
        // Crear la BD si no existe ANTES de conectar
        const host = config.get<string>('DB_HOST', 'localhost');
        const port = parseInt(config.get<string>('DB_PORT') || '3306', 10);
        const username = config.get<string>('DB_USER');
        const password = config.get<string>('DB_PASSWORD');
        const database = config.get<string>('DB_NAME');

        try {
          const connection = await mysql.createConnection({
            host,
            port,
            user: username,
            password,
          });
          await connection.execute(
            `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
          );
          await connection.end();
          console.log(`✅ Base de datos "${database}" creada/verificada`);
        } catch (error: unknown) {
          const err = error instanceof Error ? error : new Error(String(error));
          console.error('⚠️ Error al crear BD:', err.message);
        }

        return {
          type: 'mysql',
          host,
          port,
          username,
          password,
          database,
          autoLoadEntities: true,
          synchronize: (config.get<string>('DB_SYNC') === 'true'),
          logging: false,
        };
      },
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
