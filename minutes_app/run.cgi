#!/home/ciemem/.pyenv/versions/3.11.5/bin/python
# -*- coding: utf-8 -*-

from wsgiref.handlers import CGIHandler
from app import MinutesApp as application # app.pyからMinutesAppをインポート

CGIHandler().run(application)