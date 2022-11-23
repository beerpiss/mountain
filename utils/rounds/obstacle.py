from PIL import Image, ImageDraw, ImageFont

from bot import BOT_DIR

options = {
    "fill": "#0000ff",
    "outline": "#00ff00",
    "width": 2,
}


font = ImageFont.truetype(str(BOT_DIR / "resources" / "arial.ttf"), 70)


def draw_obstacle_overlay(
    im: Image.Image,
    q1: bool = True,
    q2: bool = True,
    q3: bool = True,
    q4: bool = True,
    qtt: bool = True,
):
    """
    Draw an overlay covering sections of the image.

    Parameters
    ----------
    im: The image to draw an overlay on

    Optional parameters
    -------------------
    q1, q2, q3, q4, qtt: Whether to cover the given section (default True)

    Reference
    ---------
    ┌─────────┬────────┐
    │ 1       │      2 │
    │                  │
    ├─────   qtt  ─────┤
    │                  │
    │ 3       │      4 │
    └─────────┴────────┘
    """
    draw = ImageDraw.Draw(im)
    vh = im.height
    vw = im.width

    if q1:
        draw.rectangle((0.0, 0.0, 0.5 * vw, 0.5 * vh), **options)  # cnv1
        draw.text((0.075 * vw, 0.075 * vh), "1", font=font)

    if q2:
        draw.rectangle((0.5 * vw, 0, vw, 0.5 * vw), **options)  # cnv2
        draw.text((0.85 * vw, 0.075 * vh), "2", font=font)

    if q3:
        draw.rectangle((0.0, 0.5 * vh, 0.5 * vw, im.height), **options)  # cnv3
        draw.text((0.075 * vw, 0.76 * vh), "3", font=font)

    if q4:
        draw.rectangle((0.5 * vw, 0.5 * vh, vw, vh), **options)  # cnv4
        draw.text((0.85 * vw, 0.76 * vh), "4", font=font)

    if qtt:
        draw.rectangle((0.25 * vw, 0.25 * vh, 0.75 * vw, 0.75 * vh), **options)
