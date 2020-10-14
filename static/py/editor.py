# -*- coding: utf-8 -*-
# @Author: ander
# @Date:   2019-12-07 01:01:35
# @Last Modified by:   ander
# @Last Modified time: 2019-12-07 01:08:33
from browser import document as doc, window
import sys
import time
import traceback
import javascript

from browser import document as doc, window, alert

if hasattr(window, 'localStorage'):
    from browser.local_storage import storage
else:
    storage = None

if 'set_debug' in doc:
    __BRYTHON__.debug = int(doc['set_debug'].checked)


class cOutput:

    def write(self, data):
        doc["console"].value += str(data)

    def flush(self):
        pass


if "console" in doc:
    sys.stdout = cOutput()
    sys.stderr = cOutput()


def to_str(xx):
    return str(xx)


output = ''
doc["console"].value = 'console>\n'


# run a script, in global namespace if in_globals is True
def run(*args):
    global output
    doc["p5Canvas"].innerHTML = ""
    doc["console"].value = ''
    src = window.editor.getValue()
    if storage is not None:
        storage["py_src"] = src
        src = src.replace('\n', '\n    ')
        src = src.replace('WEBGL', 'p.WEBGL')
        src = src.replace('frameCount', 'p.frameCount')
        src = src.replace('focused', 'p.focused')
        src = src.replace('displayWidth', 'p.displayWidth')
        src = src.replace('displayHeight', 'p.displayHeight')
        src = src.replace('windowWidth', 'p.windowWidth')
        src = src.replace('windowHeight', 'p.windowHeight')
        src = src.replace('canvasWidth', 'p.width')
        src = src.replace('canvasHeight', 'p.height')
        src = src.replace('keyIsPressed', 'p.keyIsPressed')
        src = src.replace('keyCode', 'p.keyCode')
        src = src.replace('mouseX', 'p.mouseX')
        src = src.replace('mouseY', 'p.mouseY')
        src = src.replace('mouseButton', 'p.mouseButton')
        src = src.replace('mouseIsPressed', 'p.mouseIsPressed')
        src = src.replace('touches', 'p.touches')
        src = src.replace('pixels', 'p.pixels')

        if src.find('setup()') == -1:
            src = src.replace('\n', '\n    ')
            src = "\n    def setup():\n        " + src + "\n    def draw():\n        pass\n"

        src = "from browser import document, window\ndef sketch(p):\n    " + src + "\n    alpha = p.alpha\n    blue = p.blue\n    brightness = p.brightness\n    color = p.color\n    green = p.green\n    hue = p.hue\n    lerpColor = p.lerpColor\n    lightness = p.lightness\n    red = p.red\n    saturation = p.saturation\n    background = p.background\n    clear = p.clear\n    colorMode = p.colorMode\n    fill = p.fill\n    noFill = p.noFill\n    noStroke = p.noStroke\n    stroke = p.stroke\n    arc = p.arc\n    ellipse = p.ellipse\n    line = p.line\n    point = p.point\n    quad = p.quad\n    rect = p.rect\n    triangle = p.triangle\n    ellipseMode = p.ellipseMode\n    noSmooth = p.noSmooth\n    rectMode = p.rectMode\n    smooth = p.smooth\n    strokeCap = p.strokeCap\n    strokeJoin = p.strokeJoin\n    strokeWeight = p.strokeWeight\n    bezier = p.bezier\n    bezierDetail = p.bezierDetail\n    bezierPoint = p.bezierPoint\n    bezierTangent = p.bezierTangent\n    curve = p.curve\n    curveDetail = p.curveDetail\n    curveTightness = p.curveTightness\n    curvePoint = p.curvePoint\n    curveTangent = p.curveTangent\n    beginContour = p.beginContour\n    beginShape = p.beginShape\n    bezierVertex = p.bezierVertex\n    curveVertex = p.curveVertex\n    endContour = p.endContour\n    endShape = p.endShape\n    quadraticVertex = p.quadraticVertex\n    vertex = p.vertex\n    loadModel = p.loadModel\n    model = p.model\n    plane = p.plane\n    box = p.box\n    sphere = p.sphere\n    cylinder = p.cylinder\n    cone = p.cone\n    ellipsoid = p.ellipsoid\n    torus = p.torus\n    remove = p.remove\n    noLoop = p.noLoop\n    loop = p.loop\n    push = p.push\n    pop = p.pop\n    redraw = p.redraw\n    fullscreen = p.fullscreen\n    pixelDensity = p.pixelDensity\n    displayDensity = p.displayDensity\n    getURL = p.getURL\n    getURLPath = p.getURLPath\n    getURLParams = p.getURLParams\n    createCanvas = p.createCanvas\n    resizeCanvas = p.resizeCanvas\n    noCanvas = p.noCanvas\n    createGraphics = p.createGraphics\n    blendMode = p.blendMode\n    applyMatrix = p.applyMatrix\n    resetMatrix = p.resetMatrix\n    rotate = p.rotate\n    rotateX = p.rotateX\n    rotateY = p.rotateY\n    rotateZ = p.rotateZ\n    scale = p.scale\n    shearX = p.shearX\n    shearY = p.shearY\n    translate = p.translate\n    createImage = p.createImage\n    saveCanvas = p.saveCanvas\n    saveFrames = p.saveFrames\n    loadImage = p.loadImage\n    image = p.image\n    tint = p.tint\n    noTint = p.noTint\n    imageMode = p.imageMode\n    blend = p.blend\n    copy = p.copy\n    filter = p.filter\n    get = p.get\n    loadPixels = p.loadPixels\n    updatePixels = p.updatePixels\n    cursor = p.cursor\n    frameRate = p.frameRate\n    noCursor = p.noCursor\n    loadJSON = p.loadJSON\n    loadStrings = p.loadStrings\n    loadTable = p.loadTable\n    loadXML = p.loadXML\n    httpGet = p.httpGet\n    httpPost = p.httpPost\n    httpDo = p.httpDo\n    createWriter = p.createWriter\n    saveJSON = p.saveJSON\n    saveStrings = p.saveStrings\n    saveTable = p.saveTable\n    downloadFile = p.downloadFile\n    day = p.day\n    hour = p.hour\n    minute = p.minute\n    millis = p.millis\n    month = p.month\n    second = p.second\n    year = p.year\n    ceil = p.ceil\n    constrain = p.constrain\n    dist = p.dist\n    exp = p.exp\n    floor = p.floor\n    lerp = p.lerp\n    log = p.log\n    mag = p.mag\n    norm = p.norm\n    pow = p.pow\n    round = p.round\n    sq = p.sq\n    sqrt = p.sqrt\n    createVector = p.createVector\n    noise = p.noise\n    noiseDetail = p.noiseDetail\n    noiseSeed = p.noiseSeed\n    acos = p.acos\n    asin = p.asin\n    atan = p.atan\n    atan2 = p.atan2\n    cos = p.cos\n    sin = p.sin\n    tan = p.tan\n    degrees = p.degrees\n    radians = p.radians\n    angleMode = p.angleMode\n    textAlign = p.textAlign\n    textLeading = p.textLeading\n    textSize = p.textSize\n    textStyle = p.textStyle\n    textWidth = p.textWidth\n    textAscent = p.textAscent\n    textDescent = p.textDescent\n    loadFont = p.loadFont\n    text = p.text\n    textFont = p.textFont\n    camera = p.camera\n    orbitControl = p.orbitControl\n    perspective = p.perspective\n    ortho = p.ortho\n    ambientLight = p.ambientLight\n    directionalLight = p.directionalLight\n    pointLight = p.pointLight\n    normalMaterial = p.normalMaterial\n    texture = p.texture\n    ambientMaterial = p.ambientMaterial\n    specularMaterial = p.specularMaterial\n    select = p.select\n    selectAll = p.selectAll\n    removeElements = p.removeElements\n    createDiv = p.createDiv\n    createP = p.createP\n    createSpan = p.createSpan\n    createImg = p.createImg\n    createA = p.createA\n    createSlider = p.createSlider\n    createButton = p.createButton\n    createCheckbox = p.createCheckbox\n    createSelect = p.createSelect\n    createRadio = p.createRadio\n    createInput = p.createInput\n    createFileInput = p.createFileInput\n    createVideo = p.createVideo\n    createAudio = p.createAudio\n    createCapture = p.createCapture\n    createElement = p.createElement\n    if 'preload' in locals():\n        p.preload = preload\n    if 'setup' in locals():\n        p.setup = setup\n    if 'draw' in locals():\n        p.draw = draw\n    if 'windowResized' in locals():\n        p.windowResized = windowResized\n    if 'keyPressed' in locals():\n        p.keyPressed = keyPressed\n    if 'keyReleased' in locals():\n        p.keyReleased = keyReleased\n    if 'keyTyped' in locals():\n        p.keyTyped = keyTyped\n    if 'keyIsDown' in locals():\n        p.keyIsDown = keyIsDown\n    if 'mouseMoved' in locals():\n        p.mouseMoved = mouseMoved\n    if 'mouseDragged' in locals():\n        p.mouseDragged = mouseDragged\n    if 'mousePressed' in locals():\n        p.mousePressed = mousePressed\n    if 'mouseReleased' in locals():\n        p.mouseReleased = mouseReleased\n    if 'mouseClicked' in locals():\n        p.mouseClicked = mouseClicked\n    if 'doubleClicked' in locals():\n        p.doubleClicked = doubleClicked\n    if 'mouseWheel' in locals():\n        p.mouseWheel = mouseWheel\n    if 'touchStarted' in locals():\n        p.touchStarted = touchStarted\n    if 'touchMoved' in locals():\n        p.touchMoved = touchMoved\n    if 'touchEnded' in locals():\n        p.touchEnded = touchEnded\n\nmyp5 = window.p5.new(sketch, 'p5Canvas')"

    t0 = time.perf_counter()
    try:
        ns = {'__name__': '__main__'}
        exec(src, ns)
        state = 1
    except Exception as exc:
        traceback.print_exc(file=sys.stderr)
        state = 0
    output = doc["console"].value

    print('<completed in %6.2f ms>' % ((time.perf_counter() - t0) * 1000.0))
    return state


doc['run'].bind('click', run)
