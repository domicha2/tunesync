from django.conf.urls import include, url
from django.contrib import admin
from django.views.generic import TemplateView
from tunesync import views

urlpatterns = [url(r"^$", views.IndexPage.as_view(), name="index")]

