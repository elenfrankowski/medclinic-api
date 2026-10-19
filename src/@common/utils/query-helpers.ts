import { QueryFailedError } from 'typeorm'

const UNIQUE_VIOLATION_CODE = '23505'

export function isUniqueViolation(error: unknown): error is QueryFailedError {
  if (!(error instanceof QueryFailedError)) {
    return false
  }
  const driverError = error.driverError as { code?: string } | undefined
  return driverError?.code === UNIQUE_VIOLATION_CODE
}

export function getViolatedConstraint(error: unknown): string | undefined {
  if (!isUniqueViolation(error)) {
    return undefined
  }
  const driverError = error.driverError as { constraint?: string } | undefined
  return driverError?.constraint
}

export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, '\\$&')
}
