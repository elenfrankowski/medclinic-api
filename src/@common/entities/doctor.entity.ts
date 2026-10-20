import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm'

import { User } from './user.entity'

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'varchar', length: 30, unique: true })
  crm!: string

  @OneToOne(() => User, { nullable: false, eager: true })
  @JoinColumn({ name: 'user_id' })
  user!: User

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date
}
