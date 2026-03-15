"""
Django Settings — Produção
Herda de base.py e configura para ambiente de produção.
Todas as variáveis sensíveis devem vir de variáveis de ambiente (.env).

Uso:
    DJANGO_SETTINGS_MODULE=backend_django.settings.production
"""

import os

from .base import *  # noqa: F401, F403

DEBUG = False

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",")

# ---------------------------------------------------------------------------
# Banco de dados — PostgreSQL
# ---------------------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME"),
        "USER": os.environ.get("DB_USER"),
        "PASSWORD": os.environ.get("DB_PASSWORD"),
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "5432"),
    }
}

# ---------------------------------------------------------------------------
# CORS — apenas domínios autorizados em produção
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    origin
    for origin in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin
]

# ---------------------------------------------------------------------------
# Segurança HTTP
# ---------------------------------------------------------------------------
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
