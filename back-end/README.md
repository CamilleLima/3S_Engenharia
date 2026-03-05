# Back-end — 3S Engenharia

API REST construída com **Django 5.2** e **Django REST Framework**, responsável por toda a lógica de negócio do sistema de propostas fotovoltaicas.

---

## Índice

- [Back-end — 3S Engenharia](#back-end--3s-engenharia)
  - [Índice](#índice)
  - [Tecnologias](#tecnologias)
  - [Pré-requisitos](#pré-requisitos)
  - [Configuração do ambiente](#configuração-do-ambiente)
  - [Estrutura de pastas](#estrutura-de-pastas)
  - [Apps e Responsabilidades](#apps-e-responsabilidades)
    - [`apps.clientes` — RF1](#appsclientes--rf1)
    - [`apps.dimensionamento` — RF2](#appsdimensionamento--rf2)
    - [`apps.financeiro` — RF3](#appsfinanceiro--rf3)
    - [`apps.documentos` — RF4 / RF5](#appsdocumentos--rf4--rf5)
  - [Rotas da API](#rotas-da-api)
  - [Banco de dados](#banco-de-dados)
    - [Desenvolvimento (SQLite)](#desenvolvimento-sqlite)
    - [Produção (PostgreSQL)](#produção-postgresql)
  - [Qualidade de código](#qualidade-de-código)
  - [Testes](#testes)
  - [Variáveis de ambiente](#variáveis-de-ambiente)

---

## Tecnologias

| Pacote | Versão | Função |
| -------- | -------- | -------- |
| Django | 5.2 | Framework web |
| djangorestframework | 3.16 | API REST |
| django-cors-headers | 4.7 | CORS para o front-end React |
| python-dotenv | 1.1 | Leitura de `.env` |
| psycopg2-binary | 2.9 | Driver PostgreSQL (produção) |
| ruff | 0.9 | Linting + formatação (substitui black, flake8, isort) |
| pytest-django | 4.10 | Testes com Django |
| pytest-cov | 6.1 | Cobertura de testes |

---

## Pré-requisitos

- Python 3.10+
- pip
- Git

---

## Configuração do ambiente

```bash
# 1. Entre na pasta do back-end
cd back-end

# 2. Crie e ative o ambiente virtual
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/macOS

# 3. Instale as dependências
pip install -r requirements.txt

# 4. Configure as variáveis de ambiente
copy .env.example .env        # Windows
# cp .env.example .env        # Linux/macOS
# Edite o .env com os valores corretos

# 5. Aplique as migrações
python manage.py migrate

# 6. Crie um superusuário (opcional)
python manage.py createsuperuser

# 7. Inicie o servidor de desenvolvimento
python manage.py runserver
```

A API estará disponível em `http://localhost:8000`.  
O painel de administração em `http://localhost:8000/admin`.

---

## Estrutura de pastas

```text
back-end/
├── manage.py                      # CLI do Django
├── requirements.txt               # dependências
├── pyproject.toml                 # configuração do Ruff
├── setup.cfg                      # configuração do pytest e coverage
├── .env.example                   # template de variáveis de ambiente
│
├── backend_django/                # core do projeto Django
│   ├── settings/
│   │   ├── base.py                # configurações compartilhadas
│   │   ├── development.py         # SQLite, DEBUG=True, BrowsableAPI
│   │   └── production.py          # PostgreSQL, HTTPS, HSTS
│   ├── urls.py                    # roteamento principal
│   ├── wsgi.py
│   └── asgi.py
│
└── apps/                          # apps Django por domínio
    ├── clientes/                  # RF1
    ├── dimensionamento/           # RF2
    ├── financeiro/                # RF3
    └── documentos/                # RF4 / RF5
```

---

## Apps e Responsabilidades

### `apps.clientes` — RF1

Gerencia o cadastro de **vendedores** e **clientes** com todos os dados necessários para gerar uma proposta.

| Arquivo | Responsabilidade |
| --------- | ----------------- |
| `models.py` | Modelos `Vendedor` e `Cliente` |
| `serializers.py` | Validação e serialização dos dados |
| `views.py` | Endpoints CRUD |
| `urls.py` | Rotas `/api/clientes/` |
| `admin.py` | Interface administrativa |
| `tests/test_models.py` | Testes de modelo |

---

### `apps.dimensionamento` — RF2

Motor de cálculo técnico fotovoltaico. Determina a potência necessária, quantidade de painéis e kit solar adequado com base no consumo e irradiância local.

| Arquivo | Responsabilidade |
| --------- | ----------------- |
| `models.py` | Modelos `KitSolar` e `Dimensionamento` |
| `services.py` | **Lógica de cálculo isolada das views** |
| `views.py` | Endpoint `/calcular/` que invoca o service |
| `tests/test_services.py` | Testes unitários do motor de cálculo |

**Fórmula base:**

```text
Potência (kWp) = Consumo (kWh/mês) / (HSP × 30 × Performance Ratio)
```

---

### `apps.financeiro` — RF3

Calcula o Retorno de Investimento (Payback) com base no dimensionamento gerado.

| Arquivo | Responsabilidade |
| --------- | ----------------- |
| `models.py` | Modelo `CalculoFinanceiro` |
| `services.py` | **Lógica de cálculo de payback isolada** |
| `views.py` | Endpoint `/calcular/` |
| `tests/test_services.py` | Testes unitários do cálculo financeiro |

**Fórmulas:**

```text
Geração mensal (kWh) = Potência × HSP × 30 × PR
Economia mensal (R$) = Geração mensal × Tarifa (R$/kWh)
Payback (meses)      = Investimento total / Economia mensal
```

---

### `apps.documentos` — RF4 / RF5

Gera o relatório editável (RF4) e o PDF final da proposta (RF5).

| Arquivo | Responsabilidade |
| --------- | ----------------- |
| `models.py` | Modelo `Proposta` com status (rascunho → finalizada → enviada) |
| `generators/relatorio.py` | Consolida dados em estrutura para revisão |
| `generators/pdf.py` | Gera o arquivo PDF para download |
| `tests/test_geradores.py` | Testes dos geradores |

---

## Rotas da API

| Método | Rota | App | Descrição |
| -------- | ------ | ----- | ----------- |
| GET/POST | `/api/clientes/` | clientes | Listar / criar clientes |
| GET/PUT/DELETE | `/api/clientes/{id}/` | clientes | Detalhe do cliente |
| GET/POST | `/api/clientes/vendedores/` | clientes | Listar / criar vendedores |
| POST | `/api/dimensionamento/calcular/` | dimensionamento | Calcular sistema fotovoltaico |
| GET | `/api/dimensionamento/kits/` | dimensionamento | Listar kits solares disponíveis |
| POST | `/api/financeiro/calcular/` | financeiro | Calcular payback/ROI |
| GET/POST | `/api/documentos/propostas/` | documentos | Listar / criar propostas |
| GET | `/api/documentos/propostas/{id}/pdf/` | documentos | Exportar PDF |
| — | `/admin/` | — | Painel administrativo Django |

---

## Banco de dados

### Desenvolvimento (SQLite)

Configurado automaticamente. O arquivo `db.sqlite3` é criado na raiz do `back-end/` após o primeiro `migrate`. Está no `.gitignore`.

### Produção (PostgreSQL)

Configure as variáveis de ambiente no `.env`:

```env
DJANGO_SETTINGS_MODULE=backend_django.settings.production
DB_NAME=3s_engenharia
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_HOST=localhost
DB_PORT=5432
```

---

## Qualidade de código

O projeto usa **Ruff**, que unifica linting (equivalente a flake8 + isort + pyupgrade) e formatação (equivalente a black) em uma única ferramenta.

A configuração está em [pyproject.toml](pyproject.toml).

```bash
# Verificar problemas de lint
ruff check .

# Corrigir automaticamente o que for possível
ruff check . --fix

# Formatar o código
ruff format .

# Verificar formatação sem alterar
ruff format . --check
```

**Regras habilitadas:**

| Prefixo | Origem | O que verifica |
| --------- | -------- | ---------------- |
| `E / W` | pycodestyle | PEP8 |
| `F` | pyflakes | imports não usados, variáveis indefinidas |
| `I` | isort | ordem de imports |
| `B` | flake8-bugbear | boas práticas e bugs comuns |
| `C4` | flake8-comprehensions | list/dict comprehensions desnecessários |
| `UP` | pyupgrade | sintaxe Python moderna |
| `DJ` | flake8-django | boas práticas específicas de Django |

---

## Testes

O projeto usa **pytest** com **pytest-django**. A configuração está em [setup.cfg](setup.cfg).

```bash
# Rodar todos os testes
pytest

# Rodar testes de uma app específica
pytest apps/clientes/tests/

# Ver relatório de cobertura no terminal
pytest --cov=apps --cov-report=term-missing

# Gerar relatório HTML de cobertura
pytest --cov=apps --cov-report=html
# Abrir htmlcov/index.html no navegador
```

**Convenção de nomenclatura:**

```text
apps/<nome_da_app>/tests/
├── __init__.py
├── test_models.py      # testes de modelo e banco
├── test_services.py    # testes de lógica de negócio
└── test_views.py       # testes de endpoints (a criar por etapa)
```

> A cobertura mínima configurada é **70%**. O CI deve falhar abaixo disso.

---

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores. O `.env` **nunca deve ser versionado**.

| Variável | Padrão | Descrição |
| ---------- | -------- | ----------- |
| `DJANGO_SETTINGS_MODULE` | `backend_django.settings.development` | Módulo de settings ativo |
| `DJANGO_SECRET_KEY` | — | Chave secreta Django (obrigatória em produção) |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` | Hosts permitidos (separados por vírgula) |
| `DB_NAME` | — | Nome do banco PostgreSQL (produção) |
| `DB_USER` | — | Usuário do banco |
| `DB_PASSWORD` | — | Senha do banco |
| `DB_HOST` | `localhost` | Host do banco |
| `DB_PORT` | `5432` | Porta do banco |
| `CORS_ALLOWED_ORIGINS` | — | Origens CORS permitidas em produção |
