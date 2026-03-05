# Front-end — 3S Engenharia

Interface web construída com **React 18**, **Vite 5** e **Tailwind CSS 3**, responsável por apresentar o fluxo de criação de propostas fotovoltaicas e consumir a API Django.

---

## Índice

- [Front-end — 3S Engenharia](#front-end--3s-engenharia)
  - [Índice](#índice)
  - [Por que Node + Vite?](#por-que-node--vite)
    - [O papel de cada ferramenta](#o-papel-de-cada-ferramenta)
    - [O que vai para produção?](#o-que-vai-para-produção)
    - [Vite vs Create React App](#vite-vs-create-react-app)
  - [Tecnologias](#tecnologias)
  - [Pré-requisitos](#pré-requisitos)
  - [Configuração do ambiente](#configuração-do-ambiente)
  - [Estrutura de pastas](#estrutura-de-pastas)
  - [Fluxo de páginas](#fluxo-de-páginas)
  - [Componentes](#componentes)
    - [Layout](#layout)
    - [UI (atômicos)](#ui-atômicos)
  - [Serviços e API](#serviços-e-api)
  - [Estado global](#estado-global)
  - [Variáveis de ambiente](#variáveis-de-ambiente)
  - [Build e Deploy](#build-e-deploy)
    - [Gerar o build de produção](#gerar-o-build-de-produção)
    - [Opções de hospedagem](#opções-de-hospedagem)
    - [Exemplo: Django + WhiteNoise (servidor único)](#exemplo-django--whitenoise-servidor-único)
    - [Scripts disponíveis](#scripts-disponíveis)

---

## Por que Node + Vite?

### O papel de cada ferramenta

| Ferramenta | Quando é usada | O que faz |
| ----------- | --------------- | ----------- |
| **Node.js** | Apenas na máquina do desenvolvedor e no CI/CD | Executa o Vite e o npm |
| **Vite** | Desenvolvimento e build | Servidor de dev com HMR; gera os arquivos finais com `npm run build` |
| **React** | Em tempo de execução no navegador | Renderiza a interface |

### O que vai para produção?

Ao executar `npm run build`, o Vite compila o projeto React em arquivos estáticos:

```text
front-end/dist/
├── index.html
├── assets/
│   ├── index-[hash].js    ← todo o JavaScript compilado e minificado
│   └── index-[hash].css   ← todo o CSS (incluindo Tailwind purgado)
```

Esses arquivos são **HTML + CSS + JS puros**. Qualquer servidor web consegue servir isso:

- Nginx ou Apache (VPS)
- Vercel / Netlify (gratuito para projetos pequenos)
- AWS S3 + CloudFront (CDN global)
- Django + WhiteNoise (servir front e back no mesmo servidor)

**Node.js não precisa estar instalado no servidor de produção.**

### Vite vs Create React App

| | Vite 5 | Create React App |
| - | -------- | ----------------- |
| Tempo de start (dev) | ~300ms | ~10s |
| HMR (atualização instantânea) | Sim, por módulo | Rebuild completo |
| Build final | Rollup (otimizado) | Webpack |
| Configuração | `vite.config.js` simples | Ejection necessário para customizar |
| Manutenção | Ativo | Depreciado |

---

## Tecnologias

| Pacote | Versão | Função |
| -------- | -------- | -------- |
| react | 18.2 | Biblioteca de UI |
| react-dom | 18.2 | Renderização no navegador |
| react-router-dom | 6.22 | Roteamento client-side (SPA) |
| axios | 1.6 | Cliente HTTP para consumir a API Django |
| tailwindcss | 3.4 | CSS utilitário |
| vite | 5.1 | Bundler e servidor de desenvolvimento |
| @vitejs/plugin-react | 4.2 | Suporte a JSX e Fast Refresh no Vite |
| postcss + autoprefixer | — | Pipeline de CSS requerida pelo Tailwind |

---

## Pré-requisitos

- Node.js 18+ (LTS recomendado)
- npm 9+

Verifique sua versão:

```bash
node --version   # deve ser >= 18
npm --version
```

---

## Configuração do ambiente

```bash
# 1. Entre na pasta do front-end
cd front-end

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
copy .env.example .env       # Windows
# cp .env.example .env       # Linux/macOS

# 4. Inicie o servidor de desenvolvimento
npm run dev
# Acesse: http://localhost:5173
```

---

## Estrutura de pastas

```text
front-end/
├── index.html                  # ponto de entrada HTML
├── package.json
├── vite.config.js              # configuração do Vite
├── tailwind.config.js          # design tokens (cores, fontes — a definir)
├── postcss.config.js
├── .env.example                # template de variáveis de ambiente
└── src/
    ├── main.jsx                # bootstrap: monta o React no DOM
    ├── App.jsx                 # roteamento principal (BrowserRouter + Routes)
    ├── index.css               # diretivas Tailwind
    │
    ├── pages/                  # uma pasta por página/rota
    │   ├── FormularioProposta/ # RF1 — entrada de dados do cliente
    │   ├── Dimensionamento/    # RF2 — resultado do dimensionamento
    │   ├── Financeiro/         # RF3 — resultado financeiro (payback/ROI)
    │   └── Documentos/         # RF4/RF5 — geração e download do PDF
    │
    ├── components/
    │   ├── layout/             # estrutura visual global
    │   │   ├── MainLayout.jsx  # wrapper com Header + Outlet + Footer
    │   │   ├── Header.jsx      # cabeçalho (logo, navegação)
    │   │   └── Footer.jsx      # rodapé
    │   └── ui/                 # componentes atômicos reutilizáveis
    │       ├── Button.jsx
    │       ├── Input.jsx
    │       └── Card.jsx
    │
    ├── services/               # comunicação com a API Django
    │   ├── api.js              # instância Axios configurada (base URL, interceptors)
    │   ├── clientesService.js
    │   ├── dimensionamentoService.js
    │   ├── financeiroService.js
    │   └── documentosService.js
    │
    ├── context/
    │   └── PropostaContext.jsx # estado global compartilhado entre as páginas do fluxo
    │
    ├── hooks/
    │   └── useFetch.js         # hook genérico para chamadas assíncronas (loading/error/data)
    │
    └── utils/
        └── formatters.js       # funções puras: formatar moeda, números, datas
```

---

## Fluxo de páginas

O sistema segue um fluxo linear de criação de proposta:

```text
FormularioProposta  →  Dimensionamento  →  Financeiro  →  Documentos (PDF)
     (RF1)                 (RF2)              (RF3)          (RF4/RF5)
```

O estado acumulado entre as etapas é gerenciado pelo `PropostaContext`.

---

## Componentes

### Layout

| Componente | Responsabilidade |
| ----------- | ----------------- |
| `MainLayout` | Envolve todas as rotas com Header + Footer; usa `<Outlet />` do React Router |
| `Header` | Cabeçalho global — logo, navegação, indicador de etapa (TODO) |
| `Footer` | Rodapé com informações da empresa (TODO) |

### UI (atômicos)

| Componente | Responsabilidade |
| ----------- | ----------------- |
| `Button` | Botão reutilizável com variantes, estado disabled/loading (TODO) |
| `Input` | Campo de formulário com label e mensagem de erro (TODO) |
| `Card` | Container visual para seções de formulário e resultados (TODO) |

> Estes componentes são apenas **templates** — a implementação sera realizada apos definção durante reunião.

---

## Serviços e API

Toda comunicação com o back-end Django passa por `src/services/api.js`:

```text
VITE_API_BASE_URL (variável de ambiente)
        │
        ▼
   src/services/api.js  ←  instância Axios configurada
        │
        ├── clientesService.js       → /api/clientes/
        ├── dimensionamentoService.js → /api/dimensionamento/
        ├── financeiroService.js      → /api/financeiro/
        └── documentosService.js     → /api/documentos/
```

Os serviços são **stubs com TODO** — as funções serão definidas após reunião de equipe com o back-end.

---

## Estado global

`PropostaContext` (em `src/context/PropostaContext.jsx`) compartilha os dados do fluxo de proposta entre as páginas sem necessidade de prop drilling.

Consumo em qualquer componente:

```jsx
// TODO: implementar após definição dos campos em reunião de equipe
import { usePropostaContext } from "../context/PropostaContext";

function MinhaPage() {
  const { proposta, setProposta } = usePropostaContext();
  // ...
}
```

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --------- | ------------- | ----------- |
| `VITE_API_BASE_URL` | Sim | URL base da API Django (ex: `http://localhost:8000/api`) |

> Variáveis expostas ao browser **devem** ter o prefixo `VITE_`.
> Nunca versionar o arquivo `.env` — use `.env.example` como referência.

---

## Build e Deploy

### Gerar o build de produção

```bash
cd front-end
npm run build
# Resultado: front-end/dist/
```

O diretório `dist/` contém arquivos HTML, CSS e JS estáticos, prontos para deploy.

### Opções de hospedagem

| Opção | Custo | Quando usar |
| ------- | ------- | ------------- |
| **Django + WhiteNoise** | Incluso no back-end | Deploy unificado, sem CORS, servidor único |
| **Vercel / Netlify** | Gratuito (planos básicos) | Front separado do back, CI/CD automático via Git |
| **Nginx (VPS)** | Custo da VPS | Quando há necessidade de controle total da infraestrutura |
| **AWS S3 + CloudFront** | Baixo custo | Alta escala, CDN global, projetos com muitos acessos simultâneos |

### Exemplo: Django + WhiteNoise (servidor único)

**1. Instale o WhiteNoise no back-end:**

```bash
pip install whitenoise
```

Adicione ao `requirements.txt`:

```text
whitenoise==6.9.0
```

**2. Configure o `settings/production.py`:**

```python
# Adicionar WhiteNoise ao MIDDLEWARE (logo após SecurityMiddleware)
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # ← adicionar aqui
    ...
]

# Diretório onde Django vai coletar os estáticos
STATIC_ROOT = BASE_DIR / "staticfiles"
STATIC_URL = "/static/"

# Compressão e cache automático dos arquivos estáticos
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Diretório do build do front-end
WHITENOISE_ROOT = BASE_DIR / ".." / "front-end" / "dist"
```

**3. Fluxo de deploy:**

```bash
# 1. Gerar o build do front-end
cd front-end
npm run build          # gera front-end/dist/

# 2. Coletar estáticos do Django
cd ../back-end
python manage.py collectstatic --noinput

# 3. Iniciar o servidor de produção
gunicorn backend_django.wsgi:application --bind 0.0.0.0:8000
```

### Scripts disponíveis

| Comando | Descrição |
| --------- | ----------- |
| `npm run dev` | Inicia o servidor de desenvolvimento (porta 5173, HMR ativo) |
| `npm run build` | Gera o bundle de produção em `dist/` |
| `npm run preview` | Serve o `dist/` localmente para testar o build antes do deploy |
| `npm run lint` | Executa o ESLint nos arquivos `src/` |
