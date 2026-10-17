export type ErrorCode =
  | 'DADOS_INVALIDOS'
  | 'NAO_AUTENTICADO'
  | 'CREDENCIAIS_INVALIDAS'
  | 'ACESSO_NEGADO'
  | 'RECURSO_NAO_ENCONTRADO'
  | 'EMAIL_JA_CADASTRADO'
  | 'CPF_JA_CADASTRADO'
  | 'CRM_JA_CADASTRADO'
  | 'HORARIO_INDISPONIVEL'
  | 'PACIENTE_INDISPONIVEL'
  | 'HORARIO_FORA_DA_ESCALA'
  | 'TRANSICAO_INVALIDA'

export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = 'DomainError'
  }
}
