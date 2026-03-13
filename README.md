# 3S Engenharia — Sistema de Propostas Fotovoltaicas

Sistema web para automação da engenharia de vendas da 3S Engenharia, cobrindo dimensionamento técnico de sistemas fotovoltaicos e geração de propostas comerciais em PDF.

---

## Tecnologias

| Camada | Stack |
| -------- | ------- |
| Back-end | Python 3.10+, Django 5.2, Django REST Framework |
| Qualidade (Python) | Ruff 0.9 (lint + format), pytest, pytest-django |
| Banco de dados | SQLite (dev) → PostgreSQL (produção) |
| Front-end | React 18, Vite 5, Tailwind CSS 3 |
| Roteamento | React Router DOM 6 |
| HTTP client | Axios 1.6 |

---

## Estrutura do Projeto

```text
3S_Engenharia/
├── back-end/          # API Django REST — ver back-end/README.md
├── front-end/         # Aplicação React + Tailwind
├── .gitignore
├── README.md          # este arquivo
└── requisitos.md      # documento de requisitos do cliente
```

---

## Back-end — Início rápido

> Documentação detalhada em [back-end/README.md](back-end/README.md)

```bash
cd back-end

# 1. Criar e ativar ambiente virtual
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/macOS

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Configurar variáveis de ambiente
copy .env.example .env        # Windows
# cp .env.example .env        # Linux/macOS

# 4. Aplicar migrações e iniciar servidor
python manage.py migrate
python manage.py runserver
```

### Testes e Qualidade de Código

```bash
# Executar todos os testes
pytest apps/ -v

# Verificar qualidade do código (linting)
ruff check apps/ backend_django/

# Formatar código automaticamente
ruff format apps/ backend_django/

# Verificar migrations pendentes
python manage.py makemigrations --check --dry-run
```

**CI/CD:** Testes automáticos via GitHub Actions

---

## Front-end — Início rápido

> Documentação detalhada em [front-end/README.md](front-end/README.md)

```bash
cd front-end

# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
copy .env.example .env        # Windows
# cp .env.example .env        # Linux/macOS

# 3. Iniciar servidor de desenvolvimento
npm run dev
# Acesse: http://localhost:5173
```

---

## Arquitetura do Projeto

```text
3S_Engenharia/
├── back-end/
│   ├── manage.py
│   ├── requirements.txt
│   ├── pyproject.toml         # Ruff (lint + format)
│   ├── setup.cfg              # pytest
│   ├── .env.example
│   ├── backend_django/
│   │   ├── settings/
│   │   │   ├── base.py        # configurações compartilhadas
│   │   │   ├── development.py # SQLite + DEBUG
│   │   │   └── production.py  # PostgreSQL + HTTPS
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   └── apps/
│       ├── clientes/          # RF1 — clientes e vendedores
│       ├── dimensionamento/   # RF2 — motor de cálculo fotovoltaico
│       ├── financeiro/        # RF3 — payback / ROI
│       └── documentos/        # RF4/RF5 — relatório e PDF
│
├── front-end/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js         # Vite — bundler de desenvolvimento e build
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example
│   └── src/
│       ├── main.jsx           # bootstrap da aplicação
│       ├── App.jsx            # roteamento principal
│       ├── index.css          # Tailwind base
│       ├── components/
│       │   ├── layout/        # MainLayout, Header, Footer
│       │   └── ui/            # Button, Input, Card
│       ├── pages/             # FormularioProposta, Dimensionamento, Financeiro, Documentos
│       ├── services/          # api.js + *Service.js (Axios)
│       ├── hooks/             # useFetch e demais hooks customizados
│       ├── context/           # PropostaContext (estado global do fluxo)
│       └── utils/             # formatters.js e funções auxiliares
│
├── .gitignore
├── README.md
└── requisitos.md
```

---

## Requisitos Funcionais

| ID | Funcionalidade | Status |
| ---- | --------------- | -------- |
| RF1 | Formulário de entrada de dados (cliente + vendedor) | [] A implementar |
| RF2 | Dimensionamento do sistema fotovoltaico | [] A implementar |
| RF3 | Cálculo de Retorno de Investimento (Payback) | [] A implementar |
| RF4 | Geração de relatório editável | [] A implementar |
| RF5 | Geração de orçamento em PDF | [] A implementar |

---

## Deploy

O projeto é composto por duas partes independentes em produção:

| Parte | O que é gerado | Como hospedar |
| ------- | --------------- | --------------- |
| **Front-end** | Arquivos estáticos (`dist/`) gerados por `npm run build` | Nginx, Apache, Vercel, Netlify, S3 + CloudFront, ou Django + WhiteNoise |
| **Back-end** | Servidor WSGI/ASGI com Django | Gunicorn + Nginx, Railway, Render, ou qualquer VPS |

> O Node.js **não é necessário em produção**. Ele é usado apenas na etapa de build do front-end.
> Após `npm run build`, o resultado é HTML + CSS + JS puro — servível por qualquer servidor estático.
> Mais detalhes em [front-end/README.md](front-end/README.md).

---

## Desenvolvedores

- Camille Vitória Chaves de Lima
- Daniel Gomes Chaves
- Maria Luiza Oliveira de Souza
- Paulo Ricardo Steiner Fernandes Horlando
- William Nascimento
