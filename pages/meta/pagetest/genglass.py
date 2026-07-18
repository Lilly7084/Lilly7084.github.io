from PIL import Image

import random

TEXTURE_SIZE = 1024
STREAK_COUNT = 20
STREAK_GAP = 128
STREAK_WIDTH = 192
# Using the same random number that Tom7 used for HTTPV
# (https://www.youtube.com/watch?v=M1si1y5lvkk)
RANDOM_SEED = 4430492041477861

random.seed(RANDOM_SEED)

streaks = []
while len(streaks) < STREAK_COUNT:
    z = random.randint(0, TEXTURE_SIZE - 1)
    if len(streaks) > 0:
        distance = min(abs((other - z) % TEXTURE_SIZE) for other in streaks)
        if distance < STREAK_GAP:
            continue
    streaks.append(z)

print(streaks)

def saturate(x: float) -> float:
    return max(0, min(1, x))

def single_streak_luma(z: float, streak: float) -> float:
    distance = z - streak
    if distance < 0:
        return 0
    return 1 - saturate(2 * distance / STREAK_WIDTH)

img = Image.new('LA', (TEXTURE_SIZE, TEXTURE_SIZE))
for y in range(TEXTURE_SIZE):
    for x in range(TEXTURE_SIZE):
        z = int(x + 0.5 * y) % TEXTURE_SIZE
        luma = max(single_streak_luma(z, streak) for streak in streaks)
        luma = 0.5 + 0.45 * luma
        luma = int(luma * 255)
        img.putpixel((x, y), (255, luma))

img.save('static/glass.png', 'PNG')
