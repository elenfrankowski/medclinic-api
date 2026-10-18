import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'

import { PatientsController } from './patients.controller'
import { PatientsService } from './patients.service'
import { PatientTypeormRepository } from './repositories/patient-typeorm.repository'
import { PATIENT_REPOSITORY } from './repositories/patient.repository'
import { Patient } from '../@common/entities/patient.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient]),
    PassportModule.register({ defaultStrategy: 'jwt' })
  ],
  controllers: [PatientsController],
  providers: [
    PatientsService,
    { provide: PATIENT_REPOSITORY, useClass: PatientTypeormRepository }
  ],
  exports: [PATIENT_REPOSITORY]
})
export class PatientsModule {}
