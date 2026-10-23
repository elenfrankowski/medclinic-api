import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common'

import { AppointmentsService } from './appointments.service'
import { CreateAppointmentDto } from './dtos/create-appointment.dto'
import { UpdateAppointmentStatusDto } from './dtos/update-appointment-status.dto'
import { RoleEnum } from '../@common/enums/role.enum'
import { ParseIdPipe } from '../@common/pipes/parse-id.pipe'
import {
  CurrentUser,
  type CurrentUserPayload
} from '../auth/decorators/current-user.decorator'
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

  @Get(':id')
  getById(
    @Param('id', ParseIdPipe) id: number,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.appointmentsService.getById(id, currentUser)
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateAppointmentStatusDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.appointmentsService.updateStatus(id, dto.status, currentUser)
  }
}
