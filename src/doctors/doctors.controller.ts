import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards
} from '@nestjs/common'

import { DoctorsService } from './doctors.service'
import { CreateDoctorDto } from './dtos/create-doctor.dto'
import { ListDoctorsQueryDto } from './dtos/list-doctors-query.dto'
import { RoleEnum } from '../@common/enums/role.enum'
import { ParseIdPipe } from '../@common/pipes/parse-id.pipe'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @Roles(RoleEnum.ADMIN)
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(dto)
  }

  @Get()
  list(@Query() query: ListDoctorsQueryDto) {
    return this.doctorsService.list(query)
  }

  @Get(':id')
  getById(@Param('id', ParseIdPipe) id: number) {
    return this.doctorsService.getById(id)
  }
}
