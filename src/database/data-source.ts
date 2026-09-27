import 'dotenv/config'
import { DataSource } from 'typeorm'

import { Usuario } from '../@common/entities/usuario.entity'

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5435),
  username: process.env.DB_USER ?? 'admin',
  password: process.env.DB_PASSWORD ?? 'admin123',
  database: process.env.DB_NAME ?? 'medclinic-db',
  synchronize: false,
  logging: true,
  entities: [Usuario],
  migrations: ['src/database/migrations/*.ts']
})
