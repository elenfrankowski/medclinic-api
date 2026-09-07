import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common'
import { Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    const isHttpException = exception instanceof HttpException
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR
    const mensagem = isHttpException
      ? exception.getResponse()
      : 'Erro interno do servidor. Tente novamente mais tarde.'

    if (!isHttpException) {
      this.logger.error(
        'Erro não tratado',
        exception instanceof Error ? exception.stack : exception
      )
    }

    response.status(status).json({
      statusCode: status,
      message: mensagem,
      timestamp: new Date().toISOString()
    })
  }
}
