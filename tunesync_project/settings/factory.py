import os
def factory():
    if 'DJANGO_DEV' in os.environ:
        from .dev  import DevSettings  as settings
    else:
        from .prod import ProdSettings as settings
    return settings()
