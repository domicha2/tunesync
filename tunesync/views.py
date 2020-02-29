from django.views.generic import TemplateView
from tunesync.models import Event


class IndexPage(TemplateView):
    template_name = "index.html"

