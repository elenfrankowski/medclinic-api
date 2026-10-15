import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'

import { CreateUserDto } from './dtos/create-user.dto'
import { UsersService } from './users.service'
import { RoleEnum } from '../@common/enums/role.enum'
import {
  CurrentUser,
  type CurrentUserPayload
} from '../auth/decorators/current-user.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.usersService.getProfile(currentUser.userId)
  }

  @Post()
  @Roles(RoleEnum.ADMIN)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto)
  }
}
