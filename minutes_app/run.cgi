#!/home/ciemem/.pyenv/versions/3.12.6/bin/python
# -*- coding: utf-8 -*-

import os
import sys

python_lib_path = '/home/ciemem/.pyenv/versions/3.12.6/lib'
os.environ['LD_LIBRARY_PATH'] = python_lib_path + ':' + os.environ.get('LD_LIBRARY_PATH', '')

APP_DIR = '/home/ciemem/www/NIT_SG/minutes_app'
VENV_PACKAGES_PATH = os.path.join(APP_DIR, 'venv/lib/python3.12/site-packages')

sys.path.insert(0, VENV_PACKAGES_PATH)
sys.path.insert(0, APP_DIR)

from app import app

from wsgiref.handlers import CGIHandler

CGIHandler().run(app)
