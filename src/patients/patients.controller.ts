import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common'

import { CreatePatientDto } from './dtos/create-patient.dto'
import { ListPatientsQueryDto } from './dtos/list-patients-query.dto'
import { UpdatePatientDto } from './dtos/update-patient.dto'
import { PatientsService } from './patients.service'
import { RoleEnum } from '../@common/enums/role.enum'
import { ParseIdPipe } from '../@common/pipes/parse-id.pipe'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(RoleEnum.ADMIN, RoleEnum.SECRETARY)
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto)
  }

  @Get()
  list(@Query() query: ListPatientsQueryDto) {
    return this.patientsService.list(query)
  }

  @Get(':id')
  getById(@Param('id', ParseIdPipe) id: number) {
    return this.patientsService.getById(id)
  }

  @Patch(':id')
  @Roles(RoleEnum.ADMIN, RoleEnum.SECRETARY)
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, dto)
  }

  @Delete(':id')
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIdPipe) id: number): Promise<void> {
    return this.patientsService.remove(id)
  }
}
