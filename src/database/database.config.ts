import type { DataSourceOptions } from 'typeorm'

import { requireEnv } from '../@common/config/env'
import { Appointment } from '../@common/entities/appointment.entity'
import { Doctor } from '../@common/entities/doctor.entity'
import { MedicalRecord } from '../@common/entities/medical-record.entity'
import { Patient } from '../@common/entities/patient.entity'
import { User } from '../@common/entities/user.entity'
import { WorkShift } from '../@common/entities/work-shift.entity'

export function buildDataSourceOptions(): DataSourceOptions {
  const extension = __filename.endsWith('.ts') ? 'ts' : 'js'
  const migrationsDir = `${__dirname.replace(/\\/g, '/')}/migrations`
  const sslEnabled = process.env.DB_SSL === 'true'

  return {
    type: 'postgres',
    host: requireEnv('DB_HOST'),
    port: Number(requireEnv('DB_PORT')),
    username: requireEnv('DB_USER'),
    password: requireEnv('DB_PASSWORD'),
    database: requireEnv('DB_NAME'),
    ssl: sslEnabled
      ? {
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
        }
      : false,
    synchronize: false,
    logging: process.env.DB_LOGGING === 'true',
    entities: [User, Patient, Doctor, WorkShift, Appointment, MedicalRecord],
    migrations: [`${migrationsDir}/*.${extension}`]
  }
}
