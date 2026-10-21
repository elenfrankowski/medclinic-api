import { Body, Controller, Post, UseGuards } from '@nestjs/common'

import { AppointmentsService } from './appointments.service'
import { CreateAppointmentDto } from './dtos/create-appointment.dto'
import { RoleEnum } from '../@common/enums/role.enum'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(RoleEnum.ADMIN, RoleEnum.SECRETARY)
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto)
  }
}
