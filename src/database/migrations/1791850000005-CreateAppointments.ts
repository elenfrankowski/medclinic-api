import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateAppointments1791850000005 implements MigrationInterface {
  name = 'CreateAppointments1791850000005'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."appointments_status_enum" AS ENUM('scheduled', 'in_progress', 'done', 'cancelled')`
    )
    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id" SERIAL NOT NULL,
        "doctor_id" integer NOT NULL,
        "patient_id" integer NOT NULL,
        "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" "public"."appointments_status_enum" NOT NULL DEFAULT 'scheduled',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appointments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_appointments_doctor_id" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_appointments_patient_id" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_appointments_period" CHECK ("ends_at" > "starts_at")
      )
    `)
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_doctor_period" ON "appointments" ("doctor_id", "starts_at")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_patient_period" ON "appointments" ("patient_id", "starts_at")`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "appointments"`)
    await queryRunner.query(`DROP TYPE "public"."appointments_status_enum"`)
  }
}
