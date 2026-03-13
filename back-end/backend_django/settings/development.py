"""
Django Settings — Desenvolvimento
Herda de base.py e sobrescreve para uso local.

Uso:
    DJANGO_SETTINGS_MODULE=backend_django.settings.development
"""

from .base import *  # noqa: F401, F403

DEBUG = True

SECRET_KEY = "django-insecure-dev-only-nao-usar-em-producao"  # noqa: S105

ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

# ---------------------------------------------------------------------------
# Banco de dados — SQLite para desenvolvimento local
# ---------------------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
    }
}

# ---------------------------------------------------------------------------
# CORS — libera o servidor de desenvolvimento do Vite
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# ---------------------------------------------------------------------------
# DRF — habilita BrowsableAPI em desenvolvimento
# ---------------------------------------------------------------------------
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = [  # noqa: F405
    "rest_framework.renderers.JSONRenderer",
    "rest_framework.renderers.BrowsableAPIRenderer",
]

# Remove exigência de autenticação em dev para facilitar testes manuais
REST_FRAMEWORK["DEFAULT_PERMISSION_CLASSES"] = [  # noqa: F405
    "rest_framework.permissions.AllowAny",
]
