import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SignOptions } from 'jsonwebtoken'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { UsuarioTypeormRepository } from './repositories/usuario-typeorm.repository'
import { JwtStrategy } from './strategies/jwt.strategy'
import { Usuario } from '../@common/entities/usuario.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'segredo-provisorio-trocar-em-producao',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ??
          '1h') as SignOptions['expiresIn']
      }
    })
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: 'USUARIO_REPOSITORY', useClass: UsuarioTypeormRepository },
    JwtStrategy
  ],
  exports: [JwtStrategy, PassportModule, JwtModule, 'USUARIO_REPOSITORY']
})
export class AuthModule {}
