import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards
} from '@nestjs/common'

import { CreateMedicalRecordDto } from './dtos/create-medical-record.dto'
import { MedicalRecordsService } from './medical-records.service'
import { PaginationQueryDto } from '../@common/pagination/pagination-query.dto'
import { ParseIdPipe } from '../@common/pipes/parse-id.pipe'
import {
  CurrentUser,
  type CurrentUserPayload
} from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients/:patientId/medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  create(
    @Param('patientId', ParseIdPipe) patientId: number,
    @Body() dto: CreateMedicalRecordDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.medicalRecordsService.create(patientId, dto, currentUser)
  }

  @Get()
  list(
    @Param('patientId', ParseIdPipe) patientId: number,
    @Query() query: PaginationQueryDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.medicalRecordsService.list(patientId, query, currentUser)
  }
}
