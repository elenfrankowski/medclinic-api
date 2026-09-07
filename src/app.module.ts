import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Usuario } from './@common/entities/usuario.entity'
import { AuthModule } from './auth/auth.module'

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5435),
      username: process.env.DB_USER ?? 'admin',
      password: process.env.DB_PASSWORD ?? 'admin123',
      database: process.env.DB_NAME ?? 'medclinic-db',
      synchronize: true,
      logging: true,
      entities: [Usuario]
    }),
    AuthModule
  ]
})
export class AppModule {}
