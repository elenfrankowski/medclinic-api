import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreatePatients1791850000002 implements MigrationInterface {
  name = 'CreatePatients1791850000002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "patients" (
        "id" SERIAL NOT NULL,
        "name" character varying(150) NOT NULL,
        "cpf" character varying(11) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "UQ_patients_cpf" UNIQUE ("cpf"),
        CONSTRAINT "PK_patients_id" PRIMARY KEY ("id")
      )
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "patients"`)
  }
}
