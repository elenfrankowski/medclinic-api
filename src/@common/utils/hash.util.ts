import * as bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

export async function gerarHash(valor: string): Promise<string> {
  return bcrypt.hash(valor, SALT_ROUNDS)
}

export async function compararHash(
  valor: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(valor, hash)
}
