import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger
} from '@nestjs/common'
import type { Response } from 'express'

import { DomainError, type ErrorCode } from '../errors/domain-error'

interface ErrorEnvelope {
  statusCode: number
  error: ErrorCode | 'ERRO_INTERNO'
  message: string
}

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  DADOS_INVALIDOS: 400,
  NAO_AUTENTICADO: 401,
  CREDENCIAIS_INVALIDAS: 401,
  ACESSO_NEGADO: 403,
  RECURSO_NAO_ENCONTRADO: 404,
  EMAIL_JA_CADASTRADO: 409,
  CPF_JA_CADASTRADO: 409,
  CRM_JA_CADASTRADO: 409,
  HORARIO_INDISPONIVEL: 409,
  PACIENTE_INDISPONIVEL: 409,
  HORARIO_FORA_DA_ESCALA: 422,
  TRANSICAO_INVALIDA: 422
}

const CODE_BY_HTTP_STATUS: Partial<Record<number, ErrorCode>> = {
  400: 'DADOS_INVALIDOS',
  401: 'NAO_AUTENTICADO',
  403: 'ACESSO_NEGADO',
  404: 'RECURSO_NAO_ENCONTRADO'
}

function extractMessage(exception: HttpException): string {
  const body = exception.getResponse()
  if (typeof body === 'string') {
    return body
  }
  const message = (body as { message?: string | string[] }).message
  if (Array.isArray(message)) {
    return message.join('; ')
  }
  return message ?? exception.message
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()
    const envelope = this.toEnvelope(exception)
    response.status(envelope.statusCode).json(envelope)
  }

  private toEnvelope(exception: unknown): ErrorEnvelope {
    if (exception instanceof DomainError) {
      return {
        statusCode: STATUS_BY_CODE[exception.code],
        error: exception.code,
        message: exception.message
      }
    }

    if (exception instanceof HttpException) {
      const error = CODE_BY_HTTP_STATUS[exception.getStatus()]
      if (error) {
        return {
          statusCode: STATUS_BY_CODE[error],
          error,
          message: extractMessage(exception)
        }
      }
    }

    this.logger.error(
      'Erro não tratado',
      exception instanceof Error ? exception.stack : String(exception)
    )
    return {
      statusCode: 500,
      error: 'ERRO_INTERNO',
      message: 'Erro interno do servidor.'
    }
  }
}
