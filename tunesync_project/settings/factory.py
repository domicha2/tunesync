import os
def factory():
    if 'JASON_DEV' in os.environ:
        from .jason_dev  import DevSettings  as settings
        return settings()
    if 'DJANGO_DEV' in os.environ:
        from .dev  import DevSettings  as settings
    else:
        from .prod import ProdSettings as settings
    return settings()
