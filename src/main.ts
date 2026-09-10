import 'dotenv/config'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { HttpExceptionFilter } from './@common/filters/http-exception.filter'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  )
  app.useGlobalFilters(new HttpExceptionFilter())

  const porta = process.env.PORT ?? 3000
  await app.listen(porta)
  console.log(`MedClinic API rodando em http://localhost:${String(porta)}`)
}

void bootstrap()
