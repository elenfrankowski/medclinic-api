import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthModule } from './auth/auth.module'
import { buildDataSourceOptions } from './database/database.config'
import { HealthModule } from './health/health.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...buildDataSourceOptions(), migrationsRun: true }),
    AuthModule,
    UsersModule,
    HealthModule
  ]
})
export class AppModule {}
