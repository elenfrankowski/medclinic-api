import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm'

import { RoleEnum } from '../enums/role.enum'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'varchar', length: 100 })
  name!: string

  @Column({ type: 'varchar', length: 150, unique: true })
  email!: string

  @Column({ type: 'varchar', length: 255 })
  password!: string

  @Column({
    type: 'enum',
    enum: RoleEnum,
    enumName: 'users_roles_enum',
    array: true,
    default: [RoleEnum.SECRETARY]
  })
  roles!: RoleEnum[]

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date
}
