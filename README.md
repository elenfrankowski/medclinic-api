# MedClinic API

API REST para gerenciamento de uma clínica médica de pequeno porte: pacientes, médicos, escala de trabalho, agenda, agendamento de consultas e prontuário. Desenvolvida em Node.js, TypeScript e NestJS, com PostgreSQL.

- **API publicada:** https://medclinic-api-elen-frankowski.onrender.com
- **Saúde da API:** https://medclinic-api-elen-frankowski.onrender.com/api/v1/health
- **Board do projeto (Trello):** https://trello.com/b/2DwkXQtW/medclinic-api-etapa-2
- **Repositório:** https://github.com/elenfrankowski/medclinic-api

> A API roda no plano gratuito do Render, que **suspende o serviço após 15 minutos sem requisições**. A primeira chamada depois de uma pausa pode levar cerca de 1 minuto para responder, e as seguintes respondem normalmente.

## Sumário

- [Sobre o projeto e escopo desta etapa](#sobre-o-projeto-e-escopo-desta-etapa)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Pré-requisitos e execução local](#pré-requisitos-e-execução-local)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Comandos](#comandos)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Padrão de nomes](#padrão-de-nomes)
- [Decisões de modelagem](#decisões-de-modelagem)
- [Testes e cobertura](#testes-e-cobertura)
- [Integração contínua e publicação](#integração-contínua-e-publicação)
- [Endpoints e perfis](#endpoints-e-perfis)
- [Catálogo de erros](#catálogo-de-erros)

## Sobre o projeto e escopo desta etapa

A **Etapa 1** entregou a base de acesso: cadastro de usuário, autenticação por JWT e autorização por perfil. Esta **Etapa 2 (Agendamento, escala e prontuário)** continua o mesmo repositório e acrescenta as regras de negócio da clínica:

- cadastro de pacientes, com CPF único e remoção lógica;
- cadastro de médicos, criando o usuário de acesso e o registro profissional numa única transação;
- escala de trabalho por turno (dia da semana, horário e duração da consulta);
- agenda do médico num período, para o front-end montar os horários livres;
- criação de consultas validada contra a escala e contra conflitos, com bloqueio sob concorrência;
- ciclo de vida da consulta (agendada, em andamento, concluída, cancelada) com autoridade por perfil;
- prontuário com acesso por vínculo entre médico e paciente;
- listagens paginadas com filtros;
- erros num envelope padronizado, com um catálogo fixo de códigos;
- testes unitários da camada de regra de negócio, integração contínua e publicação automática na nuvem.

Os perfis são `admin` (configura o sistema e enxerga tudo), `secretary` (opera pacientes e agendamentos) e `doctor` (conduz o atendimento e escreve o prontuário). Um usuário pode ter mais de um perfil.

## Tecnologias utilizadas

- **Node.js 22** e **TypeScript** (modo estrito)
- **NestJS**: framework HTTP com injeção de dependência pelo construtor
- **TypeORM** e **PostgreSQL**: entidades, transações, bloqueio pessimista e migrations
- **Passport (JWT)**, **@nestjs/jwt** e **bcrypt**: autenticação e hash de senha
- **class-validator** e **class-transformer**: validação dos dados de entrada
- **Vitest** (com cobertura `v8`): testes unitários
- **ESLint** (typescript-eslint em modo estrito) e **Prettier**
- **Docker** (imagem multi-stage) e **Docker Compose**
- **GitHub Actions**: validação de pull request e publicação
- **Render** (API) e **Neon** (PostgreSQL gerenciado com SSL)

## Pré-requisitos e execução local

Pré-requisitos: **Node.js 22**, **npm** e **Docker** com Docker Compose.

```bash
git clone https://github.com/elenfrankowski/medclinic-api.git
cd medclinic-api
npm install
cp .env.example .env        # no Windows: copy .env.example .env
```

Preencha o `.env` (veja a seção de variáveis). Exemplo para desenvolvimento local, com valores de exemplo que você deve trocar:

```dotenv
PORT=3000
DB_HOST=localhost
DB_PORT=5435
DB_USER=medclinic
DB_PASSWORD=troque-esta-senha
DB_NAME=medclinic
DB_SSL=false
JWT_SECRET=gere-um-segredo-longo-e-aleatorio
JWT_EXPIRES_IN=1h
ADMIN_EMAIL=admin@exemplo.com
ADMIN_PASSWORD=troque-esta-senha-tambem
```

Suba o banco e a API:

```bash
docker compose up -d        # PostgreSQL local, com usuário, senha e nome vindos do .env
npm run start:dev           # API em http://localhost:3000/api/v1
```

As migrations rodam sozinhas na inicialização (`migrationsRun`), e a primeira delas cria o administrador a partir de `ADMIN_EMAIL` e `ADMIN_PASSWORD`. Para gerar um segredo de JWT:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Para executar a **imagem de produção** localmente, contra o banco do compose:

```bash
docker compose --profile app up -d --build    # API em http://localhost:3000/api/v1
docker compose --profile app down             # para tudo, mantendo os dados
```

## Variáveis de ambiente

O arquivo `.env.example` lista todas as chaves, sem valores reais. O `.env` nunca é versionado.

| Variável                     | Papel                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `PORT`                       | Porta em que a API escuta (no endereço `0.0.0.0`). Em hospedagem, a plataforma a define. Padrão 3000          |
| `DB_HOST`                    | Endereço do servidor PostgreSQL                                                                               |
| `DB_PORT`                    | Porta do PostgreSQL. Local: 5435 (porta publicada pelo compose). Nuvem: 5432                                  |
| `DB_USER`                    | Usuário do banco. O compose também o usa para criar o banco local                                             |
| `DB_PASSWORD`                | Senha do banco. O compose também a usa                                                                        |
| `DB_NAME`                    | Nome do banco                                                                                                 |
| `DB_SSL`                     | `true` liga o SSL na conexão com o banco (obrigatório em banco gerenciado). Padrão `false`                    |
| `DB_SSL_REJECT_UNAUTHORIZED` | `false` desliga só a verificação do certificado, para provedores cuja cadeia o Node não valida. Padrão `true` |
| `DB_LOGGING`                 | `true` imprime as consultas SQL no log. Padrão `false`                                                        |
| `JWT_SECRET`                 | Segredo que assina os tokens JWT                                                                              |
| `JWT_EXPIRES_IN`             | Prazo de validade do token, por exemplo `1h`                                                                  |
| `ADMIN_EMAIL`                | E-mail do primeiro administrador, criado pela migration de seed                                               |
| `ADMIN_PASSWORD`             | Senha do primeiro administrador (guardada em hash, só no primeiro boot)                                       |

A aplicação não tem valor fixo para nenhuma variável de ambiente: se uma obrigatória faltar, ela não inicia.

## Comandos

| Comando                           | O que faz                                                        |
| --------------------------------- | ---------------------------------------------------------------- |
| `npm run start:dev`               | Executa a API em modo de desenvolvimento, com recarga automática |
| `npm run build`                   | Compila o projeto para `dist/`                                   |
| `npm run start:prod`              | Executa a versão compilada (`node dist/main`)                    |
| `npm test`                        | Roda a suíte de testes                                           |
| `npm run test:cov`                | Roda os testes com cobertura e falha abaixo de 80%               |
| `npm run lint`                    | Executa o ESLint                                                 |
| `npm run migration:run`           | Aplica manualmente as migrations pendentes                       |
| `npm run migration:revert`        | Reverte a última migration                                       |
| `docker build -t medclinic-api .` | Constrói a imagem de produção                                    |

## Arquitetura

A aplicação é organizada em camadas, ligadas por injeção de dependência pelo construtor:

```
Requisição HTTP
  → Guards (JWT e perfil)
  → ValidationPipe (DTO)
  → Controller            só extrai dados da requisição e devolve a resposta
  → Service               regra de negócio
  → Repository            acesso ao banco (TypeORM)
  → PostgreSQL
```

| Camada                  | Implementação                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bootstrap               | `main.ts`: prefixo `/api/v1`, `ValidationPipe` global, filtro de exceções global, escuta em `0.0.0.0:PORT`                                       |
| Controllers             | `*.controller.ts`: rotas e parâmetros. Não contêm regra de negócio nem importam `typeorm`                                                        |
| Guards, pipes e filtros | `JwtAuthGuard` e `RolesGuard` (autenticação e perfil), `ParseIdPipe`, `ValidationPipe` e `AllExceptionsFilter`                                   |
| Services                | `*.service.ts`: orquestram a regra de negócio                                                                                                    |
| Regras puras            | `*.rules.ts`: funções sem dependências (períodos, escala, transições, vínculo). São a parte mais testada                                         |
| Repositories            | Interface (`*.repository.ts`) e implementação (`*-typeorm.repository.ts`), ligadas por um token de injeção. Os services dependem só da interface |
| Entities                | `src/@common/entities`: classes decoradas do TypeORM                                                                                             |
| DTOs                    | Contratos de entrada e saída. A entidade nunca é a resposta da API                                                                               |
| Database                | `src/database`: configuração do DataSource e migrations                                                                                          |

**Tratamento de erros.** A regra de negócio lança `DomainError(code, message)` e não conhece status HTTP. O `AllExceptionsFilter`, único ponto de tradução, converte cada código no status do catálogo e responde o envelope `{ statusCode, error, message }`. Erros do framework (validação, token, rota inexistente) são mapeados para os mesmos códigos, e qualquer erro inesperado vira `500 ERRO_INTERNO`, sem stack trace na resposta.

## Estrutura de pastas

```
src/
├── @common/
│   ├── config/          leitura obrigatória das variáveis de ambiente
│   ├── entities/        entidades TypeORM de todas as tabelas
│   ├── enums/           perfis e status de consulta
│   ├── errors/          DomainError e o catálogo de códigos
│   ├── filters/         filtro global de exceções (envelope de erro)
│   ├── pagination/      DTO de paginação e envelope { data, meta }
│   ├── pipes/           ParseIdPipe
│   ├── rules/           regra compartilhada de sobreposição de períodos
│   ├── utils/           hash de senha e helpers de banco
│   └── validation/      transformações de DTO
├── auth/                login, estratégia JWT, guards e decorators
├── users/               usuário autenticado e criação de usuários
├── patients/            pacientes
├── doctors/             médicos
├── work-schedule/       escala de trabalho
├── appointments/        agendamentos, status e listagem
├── calendar/            agenda do médico num período
├── medical-records/     prontuário
├── health/              verificação de saúde
├── database/            configuração, DataSource e migrations
├── app.module.ts
└── main.ts
```

Cada funcionalidade segue o mesmo desenho: `dtos/`, `repositories/`, controller, service, module, e os arquivos `*.rules.ts`, `*.spec.ts` e `*.fixture.ts` quando existem.

## Padrão de nomes

| Elemento                       | Padrão                                                                                                                                                              | Exemplo                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Pastas e arquivos              | `kebab-case`, com sufixo que indica o papel                                                                                                                         | `appointments.service.ts`, `work-shift.entity.ts`           |
| Sufixos de arquivo             | `.controller`, `.service`, `.module`, `.entity`, `.dto`, `.rules`, `.repository`, `.guard`, `.decorator`, `.pipe`, `.filter`, `.util`, `.enum`, `.spec`, `.fixture` | `appointment-access.rules.ts`                               |
| Implementação de repositório   | `<nome>-typeorm.repository.ts` ao lado da interface `<nome>.repository.ts`                                                                                          | `appointment-typeorm.repository.ts`                         |
| Classes e interfaces           | `PascalCase`, com o papel no nome e sem prefixo `I`                                                                                                                 | `AppointmentsService`, `AppointmentRepository`              |
| Funções e variáveis            | `camelCase`                                                                                                                                                         | `findMatchingShift`                                         |
| Constantes e tokens de injeção | `UPPER_SNAKE_CASE`                                                                                                                                                  | `APPOINTMENT_REPOSITORY`, `CARE_LINK_STATUSES`              |
| Enums                          | membro em `UPPER_SNAKE_CASE`, valor em minúsculas                                                                                                                   | `AppointmentStatusEnum.IN_PROGRESS = 'in_progress'`         |
| Tabelas e colunas              | plural e `snake_case`                                                                                                                                               | `work_shifts`, `starts_at`                                  |
| Constraints e índices          | prefixo do tipo                                                                                                                                                     | `PK_`, `FK_`, `CHK_`, `IDX_`                                |
| Migrations                     | `<timestamp>-NomeEmPascalCase.ts`                                                                                                                                   | `1791850000006-CreateMedicalRecords.ts`                     |
| Rotas                          | substantivos em inglês, no plural, em `kebab-case`, sob `/api/v1`                                                                                                   | `/doctors/{id}/work-schedule`                               |
| Campos JSON                    | `camelCase`                                                                                                                                                         | `slotDurationMinutes`                                       |
| Branches                       | `tipo/assunto`                                                                                                                                                      | `feat/calendar`, `test/coverage`, `ci/deploy`               |
| Commits                        | semânticos, no imperativo                                                                                                                                           | `feat: lista consultas com filtros combinaveis e paginacao` |

## Decisões de modelagem

- **Perfis como coluna `roles` em `users`.** Um usuário pode ter mais de um perfil, e a resposta devolve sempre um array de strings.
- **`doctors` separado de `users`, em relação 1 para 1.** O médico tem CRM único e é também um usuário de acesso. A criação dos dois acontece na mesma transação, e a falha de um desfaz o outro (sem estado parcial).
- **Pacientes com remoção lógica** (`deleted_at`): o histórico de consultas e prontuários continua íntegro, e o paciente removido some das listagens e das buscas. O CPF é validado só pelo formato (11 dígitos), e a unicidade é garantida pelo banco.
- **Escala em `work_shifts`, uma linha por turno.** O horário é hora de relógio local da clínica (`time`, sem fuso), o dia da semana vai de 0 (domingo) a 6, e `CHECK`s no banco garantem horário válido e duração positiva. A escala é substituída por inteiro a cada `PUT`, dentro de uma transação.
- **Consulta guarda o próprio fim (`ends_at`).** Ele é calculado no agendamento a partir da duração do turno, então mudar a escala depois nunca altera consultas já marcadas. Instantes são `timestamptz`, e um `CHECK` garante `ends_at > starts_at`.
- **Fuso da clínica.** O `startsAt` precisa ter fuso explícito. A conversão para `America/Sao_Paulo` usa `Intl` (a imagem Docker tem ICU completo). Na agenda e nos filtros por data, cada dia vai de 00:00 a 24:00 em `-03:00`, deslocamento fixo porque o Brasil não adota horário de verão desde 2019.
- **Conflito de horário é interseção, não igualdade de início.** Duas consultas conflitam quando `a.início < b.fim` e `b.início < a.fim`, e períodos encostados convivem. Por isso um índice único em `(médico, início)` não resolveria.
- **Concorrência.** Criar uma consulta abre uma transação que trava com `SELECT ... FOR UPDATE` a linha do médico e depois a do paciente, sempre nessa ordem, o que evita espera circular. Dentro da transação, tudo passa pelo `EntityManager`, e a verificação de conflito acontece depois do bloqueio. Duas requisições simultâneas para o mesmo horário resultam em um `201` e um `409 HORARIO_INDISPONIVEL`.
- **Mudança de status com `UPDATE` condicional.** O status só muda se ainda for o que foi lido. Se outra requisição o alterou nesse intervalo, nada é gravado e a resposta é `422 TRANSICAO_INVALIDA`.
- **Ordem das validações na mudança de status:** corpo (400), consulta existente (404), transição prevista (422) e autoridade do perfil (403). Assim, uma transição impossível responde 422 mesmo para quem não teria permissão.
- **O médico da consulta é o usuário do token**, mapeado para o registro de médico. Vale para a mudança de status, para a consulta por id e para o filtro forçado da listagem.
- **Prontuário por vínculo (RN14).** Há vínculo quando existe consulta `in_progress` ou `done` entre o médico e o paciente, consultada no banco. O autor do registro vem sempre do token, e o `doctorId` do corpo é descartado. O admin só lê, a secretária nunca acessa, e o prontuário é imutável (sem edição nem remoção).
- **Listagem de consultas com escopo.** Quem tem `doctor` e não tem `admin` só enxerga as próprias consultas, e o `doctorId` da query é substituído pelo do próprio médico. A ordenação é fixa, sem parâmetro do cliente.
- **Escala: quem altera.** O contrato diz "admin" no detalhamento da rota (4.9.5) e "admin, doctor" na tabela-resumo (4.9.9). Foi adotado o detalhamento: somente `admin` altera a escala.

## Testes e cobertura

Os testes unitários usam dublês sobre a porta de repositório e não dependem de banco, rede nem variável de ambiente. A suíte tem mais de 240 testes e cobre os casos mínimos: sobreposição de períodos (os cinco cenários), criação de agendamento (sucesso, fora do turno, desalinhado da grade, não cabe no fim do turno, conflito do médico e do paciente), validação da escala, transições de status, prontuário com e sem vínculo, e login com credencial inválida e comparação de senha por hash.

**Recorte da cobertura.** A cobertura é medida sobre `src/**/*.service.ts` e `src/**/*.rules.ts`, a camada onde está a regra de negócio: agendamento, escala, transição de status, vínculo do prontuário, filtros e períodos. Controllers, entidades, módulos, DTOs, migrations e repositórios TypeORM ficam de fora, porque não contêm regra, e incluí-los inflaria o número sem testar nada. O limiar é de **80% em lines, branches, functions e statements**, e o `npm run test:cov` falha abaixo disso. O filtro global de exceções tem um teste próprio, fora do recorte.

```bash
npm run test:cov
```

## Integração contínua e publicação

- **Validação de pull request** (`.github/workflows/pr-workflow.yml`, job `validate`): em todo PR para a `main`, executa `npm ci`, `npm run build` e `npm run test:cov`, e reprova abaixo de 80% de cobertura.
- **Proteção da `main`:** exige pull request e o check `validate` verde antes do merge.
- **Publicação** (`.github/workflows/deploy.yml`): a cada push na `main`, constrói a imagem pelo `Dockerfile` multi-stage, publica no GitHub Container Registry e aciona o Deploy Hook do Render (segredo `RENDER_DEPLOY_HOOK_URL`).
- **Hospedagem:** a API roda no Render, a partir da imagem, conectada a um PostgreSQL gerenciado no Neon com SSL. As variáveis de ambiente ficam só no painel do Render, e nenhum segredo está no repositório nem nos workflows.
- **Fluxo de trabalho:** uma branch por funcionalidade a partir da `main`, commits semânticos pequenos e pull request para a `main`. O andamento está no [board do Trello](https://trello.com/b/2DwkXQtW/medclinic-api-etapa-2).

## Endpoints e perfis

Todas as rotas ficam sob `/api/v1`. Requisição e resposta em JSON, com campos em `camelCase`. Exceto onde indicado como público, é preciso enviar `Authorization: Bearer <accessToken>`.

| Método | Rota                               | Perfis                                     |
| ------ | ---------------------------------- | ------------------------------------------ |
| GET    | `/health`                          | público                                    |
| POST   | `/auth/login`                      | público                                    |
| GET    | `/users/me`                        | autenticado                                |
| POST   | `/users`                           | admin                                      |
| POST   | `/patients`                        | admin, secretary                           |
| GET    | `/patients`                        | autenticado                                |
| GET    | `/patients/{id}`                   | autenticado                                |
| PATCH  | `/patients/{id}`                   | admin, secretary                           |
| DELETE | `/patients/{id}`                   | admin                                      |
| POST   | `/doctors`                         | admin                                      |
| GET    | `/doctors`                         | autenticado                                |
| GET    | `/doctors/{id}`                    | autenticado                                |
| PUT    | `/doctors/{id}/work-schedule`      | admin                                      |
| GET    | `/doctors/{id}/work-schedule`      | autenticado                                |
| GET    | `/doctors/{id}/calendar?from=&to=` | autenticado                                |
| POST   | `/appointments`                    | admin, secretary                           |
| GET    | `/appointments`                    | autenticado (o `doctor` vê só as próprias) |
| GET    | `/appointments/{id}`               | autenticado (o `doctor` só a própria)      |
| PATCH  | `/appointments/{id}/status`        | conforme a transição                       |
| POST   | `/patients/{id}/medical-records`   | doctor com vínculo                         |
| GET    | `/patients/{id}/medical-records`   | doctor com vínculo, admin                  |

**Transições de status.** O médico da consulta pode realizar todas as transições abaixo, além dos perfis indicados:

| De            | Para          | Perfis           |
| ------------- | ------------- | ---------------- |
| `scheduled`   | `in_progress` | admin            |
| `scheduled`   | `cancelled`   | admin, secretary |
| `in_progress` | `done`        | admin            |
| `in_progress` | `cancelled`   | admin            |

**Listagens.** Aceitam `page` (padrão 1) e `pageSize` (padrão 20, máximo 100) e respondem `{ "data": [...], "meta": { "total", "page", "pageSize", "totalPages" } }`. Pacientes e médicos aceitam `name` (busca parcial). Consultas aceitam `doctorId`, `patientId`, `status`, `from` e `to` (`YYYY-MM-DD`), combináveis entre si.

**Exemplo:**

```bash
curl -X POST https://medclinic-api-elen-frankowski.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "SEU_EMAIL", "password": "SUA_SENHA"}'
```

A resposta traz `{ "accessToken": "..." }`. As credenciais do administrador de avaliação foram informadas na entrega do trabalho, e não constam neste repositório.

## Catálogo de erros

Toda resposta de erro, de 400 a 500, tem o corpo `{ "statusCode": 409, "error": "HORARIO_INDISPONIVEL", "message": "..." }`.

| Código                   | Status | Quando                                                   |
| ------------------------ | ------ | -------------------------------------------------------- |
| `DADOS_INVALIDOS`        | 400    | corpo, parâmetro ou query fora do formato esperado       |
| `NAO_AUTENTICADO`        | 401    | token ausente, inválido ou expirado                      |
| `CREDENCIAIS_INVALIDAS`  | 401    | e-mail ou senha incorretos no login                      |
| `ACESSO_NEGADO`          | 403    | autenticado, mas sem permissão para o recurso            |
| `RECURSO_NAO_ENCONTRADO` | 404    | o recurso referenciado não existe                        |
| `EMAIL_JA_CADASTRADO`    | 409    | e-mail já em uso                                         |
| `CPF_JA_CADASTRADO`      | 409    | CPF já em uso                                            |
| `CRM_JA_CADASTRADO`      | 409    | CRM já em uso                                            |
| `HORARIO_INDISPONIVEL`   | 409    | o médico já tem agendamento ativo sobrepondo o período   |
| `PACIENTE_INDISPONIVEL`  | 409    | o paciente já tem agendamento ativo sobrepondo o período |
| `HORARIO_FORA_DA_ESCALA` | 422    | o horário não existe na escala do médico                 |
| `TRANSICAO_INVALIDA`     | 422    | a mudança de status pedida não é permitida               |
| `ERRO_INTERNO`           | 500    | falha inesperada (sem detalhes na resposta)              |
