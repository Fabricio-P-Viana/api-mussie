# 🧁 MUSSIE – Backend API

<div align="center">

![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![API](https://img.shields.io/badge/API-Disable)](https://github.com/Fabricio-P-viana/api-mussie)

</div>

## 📖 Sobre o Projeto

**MUSSIE** é uma projeto robusto desenvolvida para revolucionar a gestão de confeitarias. O sistema centraliza e automatiza processos essenciais como controle de estoque, fichas técnicas de receitas, gerenciamento de pedidos e geração de relatórios, proporcionando maior eficiência e organização para o negócio.

## Links

- [Front-end](https://github.com/Fabricio-P-Viana/front-mussie)
- [Back-end](https://github.com/Fabricio-P-Viana/api-mussie)

### 🎯 Objetivos

- **Centralização**: Unificar todas as operações da confeitaria em um só lugar
- **Automação**: Reduzir tarefas manuais através de processos automatizados
- **Controle**: Monitoramento preciso de estoque e validade de ingredientes
- **Relatórios**: Insights valiosos através de relatórios detalhados
- **Escalabilidade**: Arquitetura preparada para crescimento do negócio

## 🚀 Funcionalidades Principais

### 👥 Gestão de Usuários
- ✅ Cadastro e autenticação de confeiteiros
- ✅ Recuperação de senha via e-mail

### 🥄 Controle de Ingredientes
- ✅ Cadastro completo de ingredientes
- ✅ Controle de estoque em tempo real
- ✅ Alertas de estoque baixo
- ✅ Monitoramento de validade
- ✅ Histórico de movimentações

### 📋 Fichas Técnicas
- ✅ Criação de receitas detalhadas
- ✅ Controle de rendimento

### 📦 Gestão de Pedidos
- ✅ Criação e acompanhamento de pedidos
- ✅ Controle de status e prazos
- ✅ Integração com estoque

### 📊 Relatórios Inteligentes
- ✅ Relatórios de vendas e produção
- ✅ Envio automático por e-mail
- ✅ Dashboards personalizáveis

### 🔔 Sistema de Notificações
- ✅ Alertas de estoque crítico
- ✅ Lembretes de validade
- ✅ Relatórios programados

## 🛠️ Stack Tecnológica

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **NextJS** | ^15.0.0 | Framework Frontend Node.js robusto e escalável |
| **NestJS** | ^10.0.0 | Framework Backend Node.js robusto e escalável |
| **PostgreSQL** | ^15.0 | Banco de dados relacional confiável |
| **TypeORM** | ^0.3.0 | ORM moderno para TypeScript |
| **Redis** | ^7.0 | Cache e gerenciamento de filas |
| **JWT** | ^9.0.0 | Autenticação segura com tokens |
| **Docker** | ^24.0 | Containerização para desenvolvimento e produção |
| **Node.js** | ^18.0.0 | Runtime JavaScript |

## 📂 Arquitetura do Projeto

```
src/
├── 🔐 auth/                 # Autenticação e autorização
│   ├── dto/                 # Data Transfer Objects
│   └── decorators/          # Decorators customizados
├── 👥 users/                # Gestão de usuários
│   ├── entities/            # Entidades do banco
│   └── dto/                 # Data Transfer Objects
├── 🥄 ingredients/          # Ingredientes e estoque
│   ├── entities/            # Entidades do banco
│   └── dto/                 # Data Transfer Objects
├── 📋 recipes/              # Fichas técnicas
│   ├── entities/            # Entidades do banco
│   └── dto/                 # Data Transfer Objects
├── 📦 orders/               # Pedidos e produção
│   ├── entities/            # Entidades do banco
│   └── dto/                 # Data Transfer Objects
├── 📊 reports/              # Relatórios e analytics
│   ├── entities/            # Entidades do banco
│   └── dto/                 # Data Transfer Objects
├── 🔔 notifications/        # Sistema de notificações
│   ├── entities/            # Entidades do banco
│   └── dto/                 # Data Transfer Objects
├── 📂 uploads/             # Sistema uploads
├── ⏰ queue/               # Tarefas programadas
└── 🔧 common/               # Utilitários compartilhados
    └── pipes/               # Pipes de validação
```

## 🔧 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **Docker** e **Docker Compose**
- **PostgreSQL** (se não usar Docker)
- **Redis** (se não usar Docker)

## 🚀 Instalação e Configuração

### 1️⃣ Clone o Repositório

```bash
git clone https://github.com/Fabricio-P-viana/api-mussie.git
cd api-mussie
```

### 2️⃣ Instale as Dependências

```bash
npm install
# ou
yarn install
```

### 3️⃣ Configure as Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

#### Variáveis Principais

```env
# 🗄️ Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=mussie_user
DATABASE_PASSWORD=mussie_password
DATABASE_NAME=mussie_db

# 🔐 JWT
JWT_SECRET=seu_jwt_secret_super_seguro
JWT_REFRESH_SECRET=seu_refresh_secret_super_seguro
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# 📧 Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app

# 🔴 Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# 🌐 Application
PORT=3000
NODE_ENV=development
```

### 4️⃣ Execute com Docker (Recomendado)

```bash
# Desenvolvimento
docker-compose up --build

# Produção
docker-compose -f docker-compose.prod.yml up --build -d
```

### 5️⃣ Execute Localmente (Alternativo)

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## 📡 Documentação da API

### Base URL
```
http://localhost:3000/api/
```

### 🔐 Autenticação

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/auth/register` | POST | Registro de novo usuário |
| `/auth/login` | POST | Login do usuário |
| `/auth/refresh-token` | POST | Renovar token de acesso usando refresh token |
| `/auth/forgot-password` | POST | Solicitar recuperação de senha via e-mail |
| `/auth/reset-password` | POST | Redefinir senha com token |
| `/auth/upload-profile-image` | POST | Upload de imagem de perfil (autenticado) |
| `/auth/update-profile` | PUT | Atualizar perfil do usuário (autenticado) |
| `/auth/users/:userId/portfolio` | GET | Obter portfólio público de um usuário |


### 👥 Usuários

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/users` | GET | Listar usuários |
| `/users/:id` | GET | Buscar usuário por ID |
| `/users/:id` | PUT | Atualizar usuário |
| `/users/:id` | DELETE | Remover usuário |

### 🥄 Ingredientes

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/ingredients` | GET | Listar ingredientes com paginação |
| `/ingredients` | POST | Criar novo ingrediente |
| `/ingredients/stock-history` | GET | Histórico de movimentação de estoque |
| `/ingredients/:id` | GET | Buscar ingrediente por ID |
| `/ingredients/:id` | PUT | Atualizar ingrediente |
| `/ingredients/:id` | DELETE | Remover ingrediente |
| `/ingredients/:id/adjust-waste` | PUT | Ajustar fator de perda variável |
| `/ingredients/stock-entry` | POST | Registrar entrada de estoque |
| `/ingredients/register-waste` | POST | Registrar perda/desperdício |

### 📋 Receitas

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/recipes` | GET | Listar receitas com paginação |
| `/recipes` | POST | Criar receita com imagem opcional |
| `/recipes/:id` | GET | Buscar receita por ID |
| `/recipes/:id` | PUT | Atualizar receita existente |
| `/recipes/:id` | DELETE | Remover receita |
| `/recipes/:id/execute` | POST | Executar receita e atualizar estoque |

### 📦 Pedidos

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/orders` | GET | Listar pedidos com paginação |
| `/orders` | POST | Criar novo pedido |
| `/orders/:id` | GET | Buscar pedido por ID |
| `/orders/:id` | PUT | Atualizar pedido |
| `/orders/:id` | DELETE | Remover pedido |
| `/orders/:id/production/save-progress` | PATCH | Salvar progresso de produção |
| `/orders/:id/production/complete` | PATCH | Marcar produção como concluída |
| `/orders/:id/assign-responsible` | PATCH | Atribuir responsável ao pedido |
| `/orders/:id/check-production` | GET | Verificar viabilidade de produção e gerar lista de compras |


### 📊 Relatórios

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/reports/revenue` | GET | Relatório de receita por período |
| `/reports/popular-recipes` | GET | Receitas mais populares por período |

> 📚 **Documentação Completa**: Acesse `/api` para ver a documentação interativa do Swagger

## 📊 Diagramas e Documentação

### 📈 Diagrama de Casos de Uso
![Diagrama de Casos de Uso](documentation/diagram-use-case.png)

### 🔄 Diagramas de Sequência

<details>
<summary>Ver todos os diagramas</summary>

| Funcionalidade | Diagrama |
|----------------|----------|
| **Ingrediente** | ![Ingrediente](documentation/sequence-diagrams/ingredient.png) |
| **Login** | ![Login](documentation/sequence-diagrams/login.png) |
| **Notificação** | ![Notificação](documentation/sequence-diagrams/notification.png) |
| **Pedido** | ![Pedido](documentation/sequence-diagrams/order.png) |
| **Produção** | ![Produção](documentation/sequence-diagrams/production-order.png) |
| **Receita** | ![Receita](documentation/sequence-diagrams/recipe.png) |
| **Recuperação** | ![Recuperação](documentation/sequence-diagrams/recovery-password.png) |
| **Registro** | ![Registro](documentation/sequence-diagrams/register.png) |
| **Relatórios** | ![Relatórios](documentation/sequence-diagrams/reports.png) |
| **Lista de Compras** | ![Lista](documentation/sequence-diagrams/shopping-list.png) |

</details>

### 🎨 Protótipos de Interface

<details>
<summary>Ver todas as telas</summary>

| Funcionalidade | Interface |
|----------------|-----------|
| **Landing Page** | ![Landing Page](documentation/views/landingpage-home.png) |
| **Home** | ![Home](documentation/views/Home.png) |
| **Dashboard Relatórios** | ![Dashboard](documentation/views/dashboard-relatorios.png) |
| **Perfil** | ![Perfil](documentation/views/perfil.png) |
| **Lista de Ingredientes** | ![Lista Ingredientes](documentation/views/Ingrediente-lista.png) |
| **Criar Ingrediente** | ![Criar Ingrediente](documentation/views/Ingrediente-criar.png) |
| **Editar Ingrediente** | ![Editar Ingrediente](documentation/views/Ingrediente-editar.png) |
| **Histórico de Ingredientes** | ![Histórico](documentation/views/ingrediente-lista-historico-entradas-e-saidas.png) |
| **Lista de Receitas** | ![Lista Receitas](documentation/views/Receita-lista.png) |
| **Criar Receita** | ![Criar Receita](documentation/views/receitas-criar.png) |
| **Editar Receita** | ![Editar Receita](documentation/views/receita-editar.png) |
| **Lista de Pedidos** | ![Lista Pedidos](documentation/views/Pedidos-lista.png) |
| **Criar Pedido** | ![Criar Pedido](documentation/views/pedido-criar.png) |
| **Histórico de Pedidos** | ![Histórico Pedidos](documentation/views/pedido-lista-historico.png) |
| **Página de Produção** | ![Produção](documentation/views/pedido-pagina-de-produção.png) |
| **Lista de Compras** | ![Lista Compras](documentation/views/lista-de-compras.png) |

</details>


## 🗺️ Roadmap

### 🎯 Versão 2.0 (Em Desenvolvimento)

- [ ] **Dashboard Analytics** - Interface web para visualização de dados
- [ ] **API Mobile** - Endpoints otimizados para aplicativo móvel
- [ ] **Integração Fiscal** - Emissão de notas fiscais
- [ ] **Multi-tenancy** - Suporte a múltiplas confeitarias
- [ ] **IA Predictiva** - Previsão de demanda e sugestões

### 🔮 Futuras Versões

- [ ] **Marketplace** - Venda online integrada
- [ ] **Delivery** - Gestão de entregas
- [ ] **CRM** - Gestão de relacionamento com clientes
- [ ] **Franquias** - Gestão de múltiplas unidades

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Veja como você pode ajudar:

### 🔧 Como Contribuir

1. **Fork** o projeto
2. **Clone** seu fork: `git clone https://github.com/Fabricio-P-Viana/api-mussie.git`
3. **Crie** uma branch: `git checkout -b feature/nova-funcionalidade`
4. **Commit** suas mudanças: `git commit -m 'feat: adiciona nova funcionalidade'`
5. **Push** para a branch: `git push origin feature/nova-funcionalidade`
6. **Abra** um Pull Request

### 📋 Padrões de Commit

Utilizamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Tarefas de build/config


## 📄 Licença

Este projeto está licenciado sob a **Licença MIT** - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Equipe

<table>
  <tr align="center">
    <td align="center">
      <a href="https://github.com/Fabricio-p-viana">
        <img src="https://github.com/Fabricio-p-viana.png" width="50px;" alt=""/>
        <br />
        <sub><b>Fabricio Viana</b></sub>
      </a>
      <br />
      <sub>Dev. fullstack</sub>
    </td>
    <td align="center">
      <a href="https://github.com/HyggorFirmino">
        <img src="https://github.com/HyggorFirmino.png" width="50px;" alt=""/>
        <br />
        <sub><b>Hyggor Firmino</b></sub>
      </a>
      <br />
      <sub>Dev. Frontend</sub>
    </td>
    <td align="center">
      <a href="https://github.com/henrikySena">
        <img src="https://github.com/henrikySena.png" width="50px;" alt=""/>
        <br />
        <sub><b>Henriky Sena</b></sub>
      </a>
      <br />
      <sub>Dev. Frontend</sub>
    </td>
    <td align="center">
      <a href="#">
        <img src="#" width="50px;" alt=""/>
        <br />
        <sub><b>Karina Nunes</b></sub>
      </a>
      <br />
      <sub>Engenheira de Software / QA</sub>
    </td>
    <td align="center">
      <a href="#">
        <img src="#" width="50px;" alt=""/>
        <br />
        <sub><b>João Eduardo</b></sub>
      </a>
      <br />
      <sub>Engenheiro de Software / QA</sub>
    </td>
  </tr>
</table>

## ⭐ Agradecimentos

- Comunidade NestJS pela excelente documentação
- Confeitarias parceiras que testaram o sistema
- Todos os contribuidores que tornaram este projeto possível

---

<div align="center">

**MUSSIE** – Transformando a gestão de confeitarias 🍰

[![GitHub stars](https://img.shields.io/github/stars/Fabricio-P-viana/api-mussie?style=social)](https://github.com/Fabricio-P-viana/api-mussie/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Fabricio-P-viana/api-mussie?style=social)](https://github.com/Fabricio-P-viana/api-mussie/network/members)

**[⬆ Voltar ao topo](#-mussie--backend-api)**

</div>
