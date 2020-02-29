import os, hashlib, datetime
from cbsettings import DjangoDefaults
from os.path import dirname
import subprocess


class BaseSettings(DjangoDefaults):
    """
    Django settings for tunesync project.
    """

    # Build paths inside the project like this: os.path.join(BASE_DIR, ...)

    BASE_DIR = dirname(dirname(dirname(os.path.abspath(__file__))))

    PROJECT_NAME = "tunesync_project"

    CSRF_USE_SESSIONS = True

    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True

    @property
    def SCHEME(self):
        return "https" if self.SESSION_COOKIE_SECURE else "http"

    # Quick-start development settings - unsuitable for production
    # See https://docs.djangoproject.com/en/3.0/howto/deployment/checklist/

    # SECURITY WARNING: keep the secret key used in production secret!
    SECRET_KEY = "nscrh59iy8n7srtw54ajib8ur1ebpkeqkgjberk9"

    # SECURITY WARNING: don't run with debug turned on in production!
    DEBUG = True

    LOGIN_REDIRECT_URL = "/profile/home/"  # I don't know what this is going to be

    # Accounts configuration

    ACCOUNT_ACTIVATION_DAYS = 7

    CAPTCHA_LENGTH = 6

    # this is TERRIBLE naming
    # this does *not* disable CAPTCHA, it just activates reCAPTCHA v2
    NOCAPTCHA = True

    @property
    def EMAIL_HOST_USER(self):
        return self.DEFAULT_FROM_EMAIL

    @property
    def STATIC_ROOT(self):
        return os.path.join(self.BASE_DIR, "..", "static")

    # example nginx config for reverse proxy:
    # location / {
    #     proxy_set_header Host $http_host;
    #     proxy_set_header X-Forwarded-Proto $scheme;
    #     proxy_set_header X-Real-IP $remote_addr;
    # }
    IS_BEHIND_REVERSE_PROXY = False

    @property
    def USE_X_FORWARDED_HOST(self):
        return self.IS_BEHIND_REVERSE_PROXY

    @property
    def USE_X_FORWARDED_PORT(self):
        return self.IS_BEHIND_REVERSE_PROXY

    @property
    def SECURE_PROXY_SSL_HEADER(self):
        return (
            ("HTTP_X_FORWARDED_PROTO", "https")
            if self.IS_BEHIND_REVERSE_PROXY
            else None
        )

    GET_CLIENT_IP = "get_client_ip.from_remote_addr"

    # Application definition

    PREREQ_APPS = [
        "django.contrib.admin",
        "django.contrib.auth",
        "django.contrib.contenttypes",
        "django.contrib.sessions",
        "django.contrib.messages",
        "django.contrib.staticfiles",
        "bootstrap3",
        # "captcha",
    ]

    PROJECT_APPS = ["tunesync_project", "tunesync"]

    MIDDLEWARE = (
        "django.contrib.sessions.middleware.SessionMiddleware",
        "django.middleware.common.CommonMiddleware",
        "django.middleware.csrf.CsrfViewMiddleware",
        "django.contrib.auth.middleware.AuthenticationMiddleware",
        "django.contrib.messages.middleware.MessageMiddleware",
        "django.middleware.clickjacking.XFrameOptionsMiddleware",
        "django.middleware.security.SecurityMiddleware",
    )

    ROOT_URLCONF = PROJECT_NAME + ".urls"

    TEMPLATES = [
        {
            "BACKEND": "django.template.backends.django.DjangoTemplates",
            "DIRS": [os.path.join(BASE_DIR, "templates/")],
            "APP_DIRS": True,
            "OPTIONS": {
                "context_processors": [
                    "django.template.context_processors.debug",
                    "django.template.context_processors.request",
                    "django.contrib.auth.context_processors.auth",
                    "django.contrib.messages.context_processors.messages",
                ]
            },
        }
    ]

    WSGI_APPLICATION = PROJECT_NAME + ".wsgi.application"

    # Database
    # https://docs.djangoproject.com/en/3.0/ref/settings/#databases

    @property
    def DATABASES(self):
        return {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": os.path.join(self.BASE_DIR, "tmp/db.sqlite3"),
            }
        }

    # Internationalization
    # https://docs.djangoproject.com/en/1.8/topics/i18n/

    LANGUAGE_CODE = "en-us"

    TIME_ZONE = "UTC"

    USE_I18N = True

    USE_L10N = True

    USE_TZ = True

    # Static files (CSS, JavaScript, Images)
    # https://docs.djangoproject.com/en/3.0/howto/static-files/

    STATIC_URL = "/static/"

    @property
    def bootstrap_staticfiles(self):
        return ["/usr/share/javascript/bootstrap/"]

    @property
    def STATICFILES_DIRS(self):
        return [os.path.join(self.BASE_DIR, "static")] + self.bootstrap_staticfiles

    @property
    def INSTALLED_APPS(self):
        return self.PREREQ_APPS + self.PROJECT_APPS

