import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common'

import { ReplaceWorkScheduleDto } from './dtos/replace-work-schedule.dto'
import { WorkScheduleService } from './work-schedule.service'
import { RoleEnum } from '../@common/enums/role.enum'
import { ParseIdPipe } from '../@common/pipes/parse-id.pipe'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('doctors/:doctorId/work-schedule')
export class WorkScheduleController {
  constructor(private readonly workScheduleService: WorkScheduleService) {}

  @Put()
  @Roles(RoleEnum.ADMIN)
  replace(
    @Param('doctorId', ParseIdPipe) doctorId: number,
    @Body() dto: ReplaceWorkScheduleDto
  ) {
    return this.workScheduleService.replace(doctorId, dto)
  }

  @Get()
  get(@Param('doctorId', ParseIdPipe) doctorId: number) {
    return this.workScheduleService.get(doctorId)
  }
}
