from setuptools import setup, find_packages
ver = '0.8.11'
setup(
    name             = 'hydra',
    version          = ver,
    description      = "Hydra: fossil multiplexer",
    long_description = ("Hydra is a single sign-on gateway "
                        "to multiple fossil repositories"),
    author           = "Eduard Christian Dumitrescu",
    license          = "LGPLv3",
    url              = "https://hydra.ecd.space/eduard/hydra/",
    packages         = find_packages(),
    install_requires = ['django-bootstrap3', 'django-classbasedsettings',
                        'django-simple-captcha'],
    classifiers      = ["Programming Language :: Python :: 3 :: Only"])
