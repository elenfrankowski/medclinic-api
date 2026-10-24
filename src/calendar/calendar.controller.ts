import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'

import { CalendarService } from './calendar.service'
import { CalendarQueryDto } from './dtos/calendar-query.dto'
import { ParseIdPipe } from '../@common/pipes/parse-id.pipe'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('doctors/:doctorId/calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  get(
    @Param('doctorId', ParseIdPipe) doctorId: number,
    @Query() query: CalendarQueryDto
  ) {
    return this.calendarService.get(doctorId, query)
  }
}
