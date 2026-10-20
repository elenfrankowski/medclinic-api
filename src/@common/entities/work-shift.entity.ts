import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('work_shifts')
export class WorkShift {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ name: 'doctor_id', type: 'integer' })
  doctorId!: number

  @Column({ name: 'week_day', type: 'smallint' })
  weekDay!: number

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string

  @Column({ name: 'slot_duration_minutes', type: 'integer' })
  slotDurationMinutes!: number
}
