# Configuração CI/CD - 3S Engenharia

## GitHub Actions - Backend Tests

### Pipeline Automático

O workflow `backend-tests.yml` executa automaticamente em:

- **Push** para branches `main` e `dev`
- **Pull Requests** para `main` e `dev`
- Apenas quando há mudanças em `back-end/**`

### Etapas do Pipeline

1. **Ruff Linter** - Verifica qualidade do código
2. **Ruff Formatter** - Valida formatação do código
3. **Migrations Check** - Verifica se há migrations pendentes
4. **Tests** - Executa todos os testes automatizados

### Executar Localmente

```bash
# Entrar no diretório
cd back-end

# Linting
ruff check apps/ backend_django/

# Formatting check
ruff format --check apps/ backend_django/

# Auto-fix formatting
ruff format apps/ backend_django/

# Migrations check
python manage.py makemigrations --check --dry-run

# Testes
pytest apps/ -v
```


### Requisitos de Qualidade

- ✅ Ruff linting sem erros
- ✅ Formatação consistente
- ✅ Migrations sincronizadas
- ✅ Todos os testes passando

### Troubleshooting

**Erro de migrations pendentes:**

```bash
python manage.py makemigrations
python manage.py migrate
```

**Erro de formatação:**

```bash
ruff format apps/ backend_django/
```

**Erro de linting:**

```bash
ruff check apps/ backend_django/ --fix
```
