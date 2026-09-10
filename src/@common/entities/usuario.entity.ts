import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm'

import { RoleEnum } from '../enums/role.enum'

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 100 })
  nome!: string

  @Column({ type: 'varchar', length: 150, unique: true })
  email!: string

  @Column({ type: 'varchar', length: 255 })
  senha!: string

  @Column({ type: 'enum', enum: RoleEnum, default: RoleEnum.ATENDENTE })
  role!: RoleEnum

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm!: Date
}
