import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateUsuarioTable1757400000000 implements MigrationInterface {
  name = 'CreateUsuarioTable1757400000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
    await queryRunner.query(
      `CREATE TYPE "public"."usuario_role_enum" AS ENUM('administrador', 'atendente')`
    )
    await queryRunner.query(`
      CREATE TABLE "usuario" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nome" character varying(100) NOT NULL,
        "email" character varying(150) NOT NULL,
        "senha" character varying(255) NOT NULL,
        "role" "public"."usuario_role_enum" NOT NULL DEFAULT 'atendente',
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_usuario_email" UNIQUE ("email"),
        CONSTRAINT "PK_usuario_id" PRIMARY KEY ("id")
      )
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "usuario"`)
    await queryRunner.query(`DROP TYPE "public"."usuario_role_enum"`)
  }
}
