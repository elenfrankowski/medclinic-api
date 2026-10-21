import { vi } from 'vitest'

import type {
  AppointmentRepository,
  AppointmentTransaction
} from './repositories/appointment.repository'
import type { Appointment } from '../@common/entities/appointment.entity'
import { AppointmentStatusEnum } from '../@common/enums/appointment-status.enum'

export function buildAppointment(
  overrides: Partial<Appointment> = {}
): Appointment {
  return {
    id: 41,
    doctorId: 3,
    patientId: 10,
    startsAt: new Date('2026-10-27T11:00:00.000Z'),
    endsAt: new Date('2026-10-27T11:30:00.000Z'),
    status: AppointmentStatusEnum.SCHEDULED,
    createdAt: new Date('2026-10-20T14:00:00.000Z'),
    ...overrides
  }
}

export function buildAppointmentRepositoryFake() {
  const transaction = {
    doctorHasActiveAppointment:
      vi.fn<AppointmentTransaction['doctorHasActiveAppointment']>(),
    patientHasActiveAppointment:
      vi.fn<AppointmentTransaction['patientHasActiveAppointment']>(),
    insert: vi.fn<AppointmentTransaction['insert']>()
  }
  const repository: AppointmentRepository = {
    runExclusively: (_doctorId, _patientId, work) => work(transaction)
  }
  return { repository, transaction }
}
