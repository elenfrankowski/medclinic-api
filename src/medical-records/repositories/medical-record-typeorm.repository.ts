import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import type {
  ListMedicalRecordsFilter,
  MedicalRecordPage,
  MedicalRecordRepository,
  NewMedicalRecordData
} from './medical-record.repository'
import { MedicalRecord } from '../../@common/entities/medical-record.entity'

@Injectable()
export class MedicalRecordTypeormRepository implements MedicalRecordRepository {
  constructor(
    @InjectRepository(MedicalRecord)
    private readonly repository: Repository<MedicalRecord>
  ) {}

  create(data: NewMedicalRecordData): Promise<MedicalRecord> {
    return this.repository.save(this.repository.create(data))
  }

  async listByPatient({
    patientId,
    page,
    pageSize
  }: ListMedicalRecordsFilter): Promise<MedicalRecordPage> {
    const [items, total] = await this.repository.findAndCount({
      where: { patientId },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
    return { items, total }
  }
}
