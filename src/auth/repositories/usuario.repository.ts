import { Usuario } from '../../@common/entities/usuario.entity'
import { RoleEnum } from '../../@common/enums/role.enum'

export interface UsuarioRepository {
  criar(
    nome: string,
    email: string,
    senhaHash: string,
    role: RoleEnum
  ): Promise<Usuario>
  buscarPorEmail(email: string): Promise<Usuario | null>
  buscarPorId(id: string): Promise<Usuario | null>
}
