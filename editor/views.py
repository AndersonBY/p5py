from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import CodeShareModel
from django.contrib.auth.models import User


demo_code = '''import random

waves = []


class Wave:
    def __init__(self, color, h):
        self.waveColor = color
        self.waveHeight = h
        self.offset = random.randint(100, 200)
        self.t = 0

    def display(self):
        xoff = 0
        fill(self.waveColor)

        beginShape()
        for x in range(0, canvasWidth + 16, 15):
            noise_value = noise(xoff + self.offset, self.t + self.offset)
            yoff = noise_value * 200
            y = self.waveHeight - yoff
            vertex(x, y)
            xoff += 0.08
        vertex(canvasWidth + 100, canvasHeight)
        vertex(0, canvasHeight)
        endShape(p.CLOSE)

    def update(self):
        self.t += 0.005


def setup():
    createCanvas(800, 400)

    noiseDetail(1.7, 1.3)
    noStroke()

    for i in range(5):
        a = 255 - 50 * i
        c = color("#5dbe8a")
        c.setAlpha(a)
        h = canvasHeight - 40 * i
        w = Wave(c, h)
        waves.append(w)


def draw():
    background(230)

    for w in waves:
        w.display()
        w.update()
'''


def editor(request):
    if request.method == "GET":
        if "id" in request.GET:
            project_id = request.GET["id"]
            project = CodeShareModel.objects.get(project_id=project_id)

            code = project.code.replace("\\", "\\\\")
            code = code.replace("\r\n", "\\n")
            code = code.replace("\n", "\\n")
            code = code.replace("'", "'")
            code = code.replace('"', '"')

            language = project.language
        else:
            code = demo_code.replace('\n', '\\n')
            language = "python"
    return render(
        request, "editor/editor.html", {"code": code, "language": language}
    )


@csrf_exempt
def upload_code(request):
    code = request.POST["code"]
    language = request.POST["language"]
    if request.user.is_authenticated:
        owner = request.user
    else:
        owner = None
    project = CodeShareModel.objects.create(
        code=code, language=language, owner=owner, views=1, likes=1
    )

    project_id = project.project_id
    return JsonResponse({"project_id": project_id})
