import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm'

import { AppointmentStatusEnum } from '../enums/appointment-status.enum'

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ name: 'doctor_id', type: 'integer' })
  doctorId!: number

  @Column({ name: 'patient_id', type: 'integer' })
  patientId!: number

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt!: Date

  @Column({ name: 'ends_at', type: 'timestamptz' })
  endsAt!: Date

  @Column({
    type: 'enum',
    enum: AppointmentStatusEnum,
    enumName: 'appointments_status_enum',
    default: AppointmentStatusEnum.SCHEDULED
  })
  status!: AppointmentStatusEnum

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date
}
