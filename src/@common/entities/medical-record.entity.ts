import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm'

@Entity('medical_records')
export class MedicalRecord {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ name: 'patient_id', type: 'integer' })
  patientId!: number

  @Column({ name: 'doctor_id', type: 'integer' })
  doctorId!: number

  @Column({ type: 'text' })
  text!: string

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date
}
