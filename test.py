from PIL import Image, ImageDraw, ImageFont

options = {
    "fill": "#0000ff",
    "outline": "#00ff00",
    "width": 2,
}

with Image.open(
    r"C:\Users\beerpiss\Documents\HVOC\Matchboxes\2022-08-14\Resources\Image\Database1\Obstacle\VCNV.jpg"
) as im:
    draw = ImageDraw.Draw(im)
    font = ImageFont.truetype(r"C:\Windows\Fonts\Arial.ttf", 70)
    vh = im.height
    vw = im.width
    draw.rectangle((0.0, 0.0, 0.5 * vw, 0.5 * vh), **options)  # cnv1
    draw.text((0.075 * vw, 0.075 * vh), "1", font=font)

    draw.rectangle((0.5 * vw, 0, vw, 0.5 * vw), **options)  # cnv2
    draw.text((0.85 * vw, 0.075 * vh), "2", font=font)

    draw.rectangle((0.0, 0.5 * vh, 0.5 * vw, im.height), **options)  # cnv3
    draw.text((0.075 * vw, 0.76 * vh), "3", font=font)

    draw.rectangle((0.5 * vw, 0.5 * vh, vw, vh), **options)  # cnv4
    draw.text((0.85 * vw, 0.76 * vh), "4", font=font)

    draw.rectangle((0.25 * vw, 0.25 * vh, 0.75 * vw, 0.75 * vh), **options)  # ott
    im.save("balls.png", "PNG")
