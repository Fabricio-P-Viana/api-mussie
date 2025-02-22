# Confeitaria API
API para gerenciamento de estoque de uma confeitaria com autenticação JWT, paginação e upload de imagens.

## Instalação
1. Clone o repositório.
2. Instale as dependências: `npm install`.
3. Configure o banco de dados em `src/database/data-source.ts`.
4. Configure o e-mail em `src/auth/mail.service.ts`.
5. Crie a pasta `uploads` na raiz do projeto.
6. Inicie o servidor: `npm run start:dev`.

## Endpoints
- **Autenticação**:
  - `POST /auth/register` - Cadastra um novo usuário
  - `POST /auth/login` - Faz login e retorna JWT
  - `POST /auth/forgot-password` - Solicita redefinição de senha
  - `POST /auth/reset-password` - Redefine a senha com token
  - `POST /auth/upload-profile-image` - Faz upload da imagem de perfil (protegido)
- **Ingredientes** (protegido por JWT):
  - `GET /ingredients?page=1&limit=10` - Lista com paginação
  - `POST /ingredients`, `PUT /ingredients/:id`, etc.
- **Receitas** (protegido por JWT):
  - `GET /recipes?page=1&limit=10` - Lista com paginação
  - `POST /recipes` - Cria com upload de imagem
  - `POST /recipes/:id/execute`
- **Pedidos** (protegido por JWT):
  - `GET /orders?page=1&limit=10` - Lista com paginação
  - `POST /orders`, `PUT /orders/:id`