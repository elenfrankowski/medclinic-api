import { MigrationInterface, QueryRunner } from 'typeorm'

import { requireEnv } from '../../@common/config/env'
import { hashPassword } from '../../@common/utils/hash.util'

export class SeedAdminUser1791850000001 implements MigrationInterface {
  name = 'SeedAdminUser1791850000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const email = requireEnv('ADMIN_EMAIL')
    const passwordHash = await hashPassword(requireEnv('ADMIN_PASSWORD'))

    await queryRunner.query(
      `INSERT INTO "users" ("name", "email", "password", "roles")
       VALUES ($1, $2, $3, $4::"public"."users_roles_enum"[])
       ON CONFLICT ("email") DO NOTHING`,
      ['Administrador', email, passwordHash, ['admin']]
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "users" WHERE "email" = $1`, [
      requireEnv('ADMIN_EMAIL')
    ])
  }
}
