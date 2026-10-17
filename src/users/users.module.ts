import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'

import { UserTypeormRepository } from './repositories/user-typeorm.repository'
import { USER_REPOSITORY } from './repositories/user.repository'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { User } from '../@common/entities/user.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' })
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: USER_REPOSITORY, useClass: UserTypeormRepository }
  ],
  exports: [USER_REPOSITORY]
})
export class UsersModule {}
