#!/home/ciemem/www/NIT_SG/.pyenv/shims/python
# -*- coding: utf-8 -*-

import sys
import os

user_home = os.path.expanduser('~')
library_path = os.path.join(user_home, 'www/NIT_SG/.pyenv/versions/3.12.6/lib/python3.12/site-packages') # バージョンを要確認
sys.path.insert(0, library_path)

from wsgiref.handlers import CGIHandler
from app import app 

CGIHandler().run(app)