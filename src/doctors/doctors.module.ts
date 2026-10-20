import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'

import { DoctorsController } from './doctors.controller'
import { DoctorsService } from './doctors.service'
import { DoctorTypeormRepository } from './repositories/doctor-typeorm.repository'
import { DOCTOR_REPOSITORY } from './repositories/doctor.repository'
import { Doctor } from '../@common/entities/doctor.entity'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule
  ],
  controllers: [DoctorsController],
  providers: [
    DoctorsService,
    { provide: DOCTOR_REPOSITORY, useClass: DoctorTypeormRepository }
  ],
  exports: [DOCTOR_REPOSITORY]
})
export class DoctorsModule {}
