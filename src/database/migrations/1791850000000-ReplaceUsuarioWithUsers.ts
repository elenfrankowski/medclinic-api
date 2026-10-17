import { MigrationInterface, QueryRunner } from 'typeorm'

export class ReplaceUsuarioWithUsers1791850000000 implements MigrationInterface {
  name = 'ReplaceUsuarioWithUsers1791850000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "usuario"`)
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."usuario_role_enum"`)
    await queryRunner.query(
      `CREATE TYPE "public"."users_roles_enum" AS ENUM('admin', 'secretary', 'doctor')`
    )
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "name" character varying(100) NOT NULL,
        "email" character varying(150) NOT NULL,
        "password" character varying(255) NOT NULL,
        "roles" "public"."users_roles_enum"[] NOT NULL DEFAULT '{secretary}',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`)
    await queryRunner.query(`DROP TYPE "public"."users_roles_enum"`)
  }
}
