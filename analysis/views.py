"""

Copyright 2015, Institute for Systems Biology

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

"""

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.shortcuts import render

debug = settings.DEBUG
from models import Analysis

debug = settings.DEBUG

@login_required
def sample_analyses(request):
    types = Analysis.get_types()
    return render(request, 'analysis/sample_analyses.html', {'types' : types})
