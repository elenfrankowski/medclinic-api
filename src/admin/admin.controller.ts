import { Controller, Get, UseGuards } from '@nestjs/common'

import { RoleEnum } from '../@common/enums/role.enum'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  @Get('ping')
  @Roles(RoleEnum.ADMINISTRADOR)
  ping() {
    return { mensagem: 'Pong! Você tem acesso de administrador.' }
  }
}
