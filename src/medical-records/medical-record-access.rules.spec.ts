import { describe, expect, it } from 'vitest'

import {
  CARE_LINK_STATUSES,
  canReadMedicalRecord,
  canWriteMedicalRecord,
  isCareLinkRequiredToRead
} from './medical-record-access.rules'
import { AppointmentStatusEnum } from '../@common/enums/appointment-status.enum'
import { RoleEnum } from '../@common/enums/role.enum'

describe('CARE_LINK_STATUSES', () => {
  it('considera vínculo apenas consulta em andamento ou concluída', () => {
    expect(CARE_LINK_STATUSES).toEqual([
      AppointmentStatusEnum.IN_PROGRESS,
      AppointmentStatusEnum.DONE
    ])
  })

  it.each([AppointmentStatusEnum.SCHEDULED, AppointmentStatusEnum.CANCELLED])(
    'não considera vínculo a consulta %s',
    (status) => {
      expect(CARE_LINK_STATUSES).not.toContain(status)
    }
  )
})

describe('canWriteMedicalRecord', () => {
  it('permite ao médico', () => {
    expect(canWriteMedicalRecord([RoleEnum.DOCTOR])).toBe(true)
  })

  it.each([[[RoleEnum.ADMIN]], [[RoleEnum.SECRETARY]], [[]]])(
    'nega ao perfil %j',
    (roles) => {
      expect(canWriteMedicalRecord(roles)).toBe(false)
    }
  )

  it('permite a quem acumula admin e doctor', () => {
    expect(canWriteMedicalRecord([RoleEnum.ADMIN, RoleEnum.DOCTOR])).toBe(true)
  })
})

describe('canReadMedicalRecord', () => {
  it.each([[[RoleEnum.DOCTOR]], [[RoleEnum.ADMIN]]])(
    'permite ao perfil %j',
    (roles) => {
      expect(canReadMedicalRecord(roles)).toBe(true)
    }
  )

  it('nega à secretária', () => {
    expect(canReadMedicalRecord([RoleEnum.SECRETARY])).toBe(false)
  })

  it('nega a quem não tem perfil', () => {
    expect(canReadMedicalRecord([])).toBe(false)
  })
})

describe('isCareLinkRequiredToRead', () => {
  it('exige vínculo do médico', () => {
    expect(isCareLinkRequiredToRead([RoleEnum.DOCTOR])).toBe(true)
  })

  it('dispensa o vínculo do admin', () => {
    expect(isCareLinkRequiredToRead([RoleEnum.ADMIN])).toBe(false)
  })

  it('dispensa o vínculo de quem acumula admin e doctor', () => {
    expect(isCareLinkRequiredToRead([RoleEnum.ADMIN, RoleEnum.DOCTOR])).toBe(
      false
    )
  })
})
