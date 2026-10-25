import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Logger,
  NotFoundException,
  UnauthorizedException,
  type ArgumentsHost
} from '@nestjs/common'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AllExceptionsFilter } from './all-exceptions.filter'
import { DomainError, type ErrorCode } from '../errors/domain-error'

function buildHost() {
  const json = vi.fn<(body: unknown) => void>()
  const status = vi.fn<(statusCode: number) => { json: typeof json }>(() => ({
    json
  }))
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) })
  } as unknown as ArgumentsHost
  return { host, status, json }
}

const STATUS_BY_CODE: [ErrorCode, number][] = [
  ['DADOS_INVALIDOS', 400],
  ['NAO_AUTENTICADO', 401],
  ['CREDENCIAIS_INVALIDAS', 401],
  ['ACESSO_NEGADO', 403],
  ['RECURSO_NAO_ENCONTRADO', 404],
  ['EMAIL_JA_CADASTRADO', 409],
  ['CPF_JA_CADASTRADO', 409],
  ['CRM_JA_CADASTRADO', 409],
  ['HORARIO_INDISPONIVEL', 409],
  ['PACIENTE_INDISPONIVEL', 409],
  ['HORARIO_FORA_DA_ESCALA', 422],
  ['TRANSICAO_INVALIDA', 422]
]

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter()

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each(STATUS_BY_CODE)(
    'traduz o erro de domínio %s para o status %i',
    (code, statusCode) => {
      const { host, status, json } = buildHost()

      filter.catch(new DomainError(code, 'Mensagem de teste.'), host)

      expect(status).toHaveBeenCalledWith(statusCode)
      expect(json).toHaveBeenCalledWith({
        statusCode,
        error: code,
        message: 'Mensagem de teste.'
      })
    }
  )

  it('junta as mensagens de validação em um único texto com o código DADOS_INVALIDOS', () => {
    const { host, status, json } = buildHost()

    filter.catch(
      new BadRequestException([
        'name não pode ser vazio',
        'cpf deve ter 11 dígitos'
      ]),
      host
    )

    expect(status).toHaveBeenCalledWith(400)
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'DADOS_INVALIDOS',
      message: 'name não pode ser vazio; cpf deve ter 11 dígitos'
    })
  })

  it('usa a mensagem em texto quando a resposta da exceção é uma string', () => {
    const { host, json } = buildHost()

    filter.catch(new HttpException('Corpo malformado.', 400), host)

    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'DADOS_INVALIDOS',
      message: 'Corpo malformado.'
    })
  })

  it('devolve uma mensagem de texto mesmo quando a exceção não traz message', () => {
    const { host, json } = buildHost()

    filter.catch(new BadRequestException({ error: 'Bad Request' }), host)

    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'DADOS_INVALIDOS',
      message: expect.any(String) as string
    })
  })

  it.each<[string, HttpException, ErrorCode, number]>([
    [
      '401',
      new UnauthorizedException('Token inválido.'),
      'NAO_AUTENTICADO',
      401
    ],
    ['403', new ForbiddenException('Sem permissão.'), 'ACESSO_NEGADO', 403],
    [
      '404',
      new NotFoundException('Rota inexistente.'),
      'RECURSO_NAO_ENCONTRADO',
      404
    ]
  ])(
    'traduz a exceção HTTP %s do framework para o catálogo',
    (_label, exception, error, statusCode) => {
      const { host, status, json } = buildHost()

      filter.catch(exception, host)

      expect(status).toHaveBeenCalledWith(statusCode)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode, error })
      )
    }
  )

  it('responde 500 ERRO_INTERNO para exceção HTTP fora do catálogo', () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
    const { host, status, json } = buildHost()

    filter.catch(new HttpException('Corpo grande demais.', 413), host)

    expect(status).toHaveBeenCalledWith(500)
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      error: 'ERRO_INTERNO',
      message: 'Erro interno do servidor.'
    })
  })

  it('responde 500 sem expor a stack trace e registra o erro no log', () => {
    const loggerError = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined)
    const { host, status, json } = buildHost()
    const failure = new Error('falha interna com detalhes sensíveis')

    filter.catch(failure, host)

    expect(status).toHaveBeenCalledWith(500)
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      error: 'ERRO_INTERNO',
      message: 'Erro interno do servidor.'
    })
    expect(JSON.stringify(json.mock.calls)).not.toContain('detalhes sensíveis')
    expect(loggerError).toHaveBeenCalledWith('Erro não tratado', failure.stack)
  })

  it('responde 500 também quando o valor lançado não é um Error', () => {
    const loggerError = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined)
    const { host, status } = buildHost()

    filter.catch('falha solta', host)

    expect(status).toHaveBeenCalledWith(500)
    expect(loggerError).toHaveBeenCalledWith('Erro não tratado', 'falha solta')
  })
})
