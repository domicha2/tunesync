from setuptools import setup, find_packages

ver = "0.8.11"
setup(
    name="tunesync",
    version=ver,
    description="TuneSync: play it again",
    long_description=("Music sharing service to play music" "in sync with others"),
    author="Michael, Jason, Roshan",
    license="",
    url="",
    packages=find_packages(),
    install_requires=[
        "Django",
        "django-bootstrap3",
        "django-classbasedsettings",
        "django-simple-captcha",
        "djangorestframework",
        "django-channels",
    ],
    classifiers=["Programming Language :: Python :: 3 :: Only"],
)
