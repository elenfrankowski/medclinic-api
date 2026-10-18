import { Injectable, PipeTransform } from '@nestjs/common'

import { DomainError } from '../errors/domain-error'

const MAX_INTEGER = 2147483647

@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const id = Number(value)
    if (!/^\d+$/.test(value) || id < 1 || id > MAX_INTEGER) {
      throw new DomainError(
        'DADOS_INVALIDOS',
        'O identificador informado é inválido.'
      )
    }
    return id
  }
}
