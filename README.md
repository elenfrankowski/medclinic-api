# MedClinic API

API REST para gerenciamento de uma clínica médica de pequeno porte, desenvolvida em Node.js, TypeScript e NestJS.

> **Escopo desta etapa:** esta entrega compreende exclusivamente a **base de autenticação e autorização** do sistema (cadastro de usuários, login com JWT e controle de acesso por perfis). As funcionalidades de domínio da clínica (especialidades, médicos, pacientes e consultas) serão implementadas em uma etapa futura, sobre esta mesma base de código.

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Arquitetura](#arquitetura)
- [Requisitos para execução](#requisitos-para-execução)
- [Configuração do ambiente](#configuração-do-ambiente)
- [Instalação e execução](#instalação-e-execução)
- [Perfis de acesso](#perfis-de-acesso)
- [Documentação dos endpoints](#documentação-dos-endpoints)
- [Estrutura de pastas](#estrutura-de-pastas)

## Sobre o projeto

O sistema permitirá, futuramente, o gerenciamento completo de uma clínica médica. Nesta primeira etapa, foi construída a base de acesso: cadastro de usuários com senha criptografada, autenticação via JWT e autorização baseada em perfis (RBAC), preparando a estrutura para receber os módulos de domínio (especialidades, médicos, pacientes e consultas) sem necessidade de reestruturação da arquitetura.

## Tecnologias utilizadas

- **Node.js** e **TypeScript**
- **NestJS** — framework HTTP, com injeção de dependência nativa
- **TypeORM** — ORM para PostgreSQL
- **PostgreSQL** — banco de dados relacional (via Docker)
- **Passport + passport-jwt** — estratégia de autenticação
- **@nestjs/jwt** — emissão e verificação de tokens JWT
- **bcrypt** — hash de senhas
- **class-validator / class-transformer** — validação e transformação de DTOs

## Arquitetura

O projeto segue uma arquitetura organizada em camadas, equivalente ao modelo MVC solicitado, adaptada aos recursos nativos do NestJS:

| Camada solicitada        | Implementação no projeto                                                                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Server / Main**        | `src/main.ts` — inicializa a aplicação Nest, carrega variáveis de ambiente e registra pipes/filtros globais                                          |
| **Routes + Controllers** | Classes `*.controller.ts`, com rotas definidas via decorators (`@Controller`, `@Get`, `@Post`) em vez de arquivos de rota separados                  |
| **Middlewares**          | `Guards` do NestJS (`JwtAuthGuard` para autenticação, `RolesGuard` para autorização/RBAC) e o `ValidationPipe` global para validação de entrada      |
| **Services**             | Classes `*.service.ts`, responsáveis pelas regras de negócio                                                                                         |
| **Repositories**         | Interface + implementação (`usuario.repository.ts` / `usuario-typeorm.repository.ts`), injetadas via token customizado, isolando o acesso ao TypeORM |
| **Entities**             | `src/@common/entities/usuario.entity.ts`, com decorators do TypeORM                                                                                  |
| **Database**             | `src/database/`, contendo a configuração de conexão (via `TypeOrmModule.forRoot` em `app.module.ts`) e o script `schema.sql`                         |
| **Utils**                | `src/@common/utils/hash.util.ts` — geração e comparação de hash de senha                                                                             |

Tratamento de erros centralizado é feito por um `ExceptionFilter` global (`HttpExceptionFilter`), aplicado no `main.ts`, que padroniza todas as respostas de erro da API em JSON.

## Requisitos para execução

- Node.js 18+
- Docker e Docker Compose

## Configuração do ambiente

### Banco de dados (Docker)

```bash
docker compose up -d
```

O banco é criado automaticamente pelo TypeORM (`synchronize: true`) na primeira execução. O script `src/database/schema.sql` documenta a estrutura da tabela criada.

### Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```dotenv
PORT=3000
DB_HOST=localhost
DB_PORT=5435
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=medclinic-db
JWT_SECRET=uma-chave-bem-longa-e-aleatoria-so-sua
JWT_EXPIRES_IN=1h
```

## Instalação e execução

```bash
git clone https://github.com/elenfrankowski/medclinic-api.git
cd medclinic-api
npm install
docker compose up -d
npm run start:dev
```

A API sobe em `http://localhost:3000`.

Outros scripts disponíveis:

- `npm run build` — compila o projeto para produção
- `npm run start:prod` — executa a versão compilada

## Perfis de acesso

| Perfil          | Descrição                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| `administrador` | Acesso completo às funcionalidades da API                                                                 |
| `atendente`     | Acesso operacional, com permissões restritas (perfil padrão ao registrar, caso `role` não seja informado) |

## Documentação dos endpoints

### `POST /auth/register`

Cadastra um novo usuário. Rota pública.

**Body:**

```json
{
  "nome": "Dra. Ana",
  "email": "ana@medclinic.com",
  "senha": "123456",
  "role": "administrador"
}
```

`role` é opcional — se omitido, o padrão é `atendente`.

**Resposta (201):**

```json
{
  "id": "dd29510a-d426-4636-b79e-d4e78c0fe1b7",
  "nome": "Dra. Ana",
  "email": "ana@medclinic.com",
  "role": "administrador",
  "criadoEm": "2026-09-09T07:20:32.859Z"
}
```

**Erros possíveis:** `400` (campos inválidos/ausentes), `409` (e-mail já cadastrado).

### `POST /auth/login`

Autentica um usuário e retorna um token JWT. Rota pública.

**Body:**

```json
{
  "email": "ana@medclinic.com",
  "senha": "123456"
}
```

**Resposta (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Erros possíveis:** `401` (credenciais inválidas — mensagem genérica, sem indicar qual campo está incorreto).

### `GET /users/me`

Retorna os dados do usuário autenticado. Requer token JWT válido.

**Header:** `Authorization: Bearer <token>`

**Resposta (200):**

```json
{
  "id": "dd29510a-d426-4636-b79e-d4e78c0fe1b7",
  "nome": "Dra. Ana",
  "email": "ana@medclinic.com",
  "role": "administrador",
  "criadoEm": "2026-09-09T07:20:32.859Z"
}
```

**Erros possíveis:** `401` (token ausente, inválido ou expirado).

### `GET /admin/ping`

Endpoint protegido, acessível apenas pelo perfil `administrador`. Demonstra o funcionamento do RBAC.

**Header:** `Authorization: Bearer <token>`

**Resposta (200) — usuário administrador:**

```json
{
  "mensagem": "Pong! Você tem acesso de administrador."
}
```

**Resposta (403) — usuário atendente:**

```json
{
  "statusCode": 403,
  "message": {
    "message": "Você não tem permissão para acessar este recurso.",
    "error": "Forbidden",
    "statusCode": 403
  },
  "timestamp": "2026-09-09T04:41:58.558Z"
}
```

## Estrutura de pastas

```
src/
├── @common/
│   ├── entities/          # Entidades TypeORM (Usuario)
│   ├── enums/             # RoleEnum
│   ├── filters/           # HttpExceptionFilter (tratamento central de erros)
│   └── utils/             # hash.util.ts (bcrypt)
├── auth/
│   ├── decorators/        # @Roles, @CurrentUser
│   ├── dtos/               # RegistrarDto, LoginDto, UsuarioRespostaDto
│   ├── guards/             # JwtAuthGuard, RolesGuard
│   ├── repositories/       # Interface + implementação TypeORM
│   ├── strategies/         # JwtStrategy
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/
│   ├── users.controller.ts # GET /users/me
│   └── users.module.ts
├── admin/
│   ├── admin.controller.ts # GET /admin/ping
│   └── admin.module.ts
├── database/
│   └── schema.sql          # Script de criação da tabela usuario
├── app.module.ts
└── main.ts
```
