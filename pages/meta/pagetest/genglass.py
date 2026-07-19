from PIL import Image

import math
import random
from tqdm import tqdm

TEXTURE_WIDTH = 1024
TEXTURE_HEIGHT = 768
STREAK_ANGLE = 30
STREAK_COUNT = 32
# STREAK_GAP = 240
STREAK_PADDING = 0.2
STREAK_WIDTH = 192
# Using the same random number that Tom7 used for HTTPV
# (https://www.youtube.com/watch?v=M1si1y5lvkk)
# (Even if you ignore it as a reference, watch the video, it's great)
RANDOM_SEED = 4430_4920_4147_7861

random.seed(RANDOM_SEED)

# streaks = []
# while len(streaks) < STREAK_COUNT:
#     z = random.randint(0, TEXTURE_SIZE - 1)
#     if len(streaks) > 0:
#         distance = min(abs(other - z) % TEXTURE_SIZE for other in streaks)
#         if distance < STREAK_GAP:
#             continue
#     streaks.append(z)

streaks = [
    random.random() + STREAK_PADDING
    for _ in range(STREAK_COUNT)
]
norm = 1 / sum(streaks)
cumsum = 0
for i in range(STREAK_COUNT):
    cumsum += streaks[i]
    streaks[i] = cumsum * norm * (TEXTURE_WIDTH + TEXTURE_HEIGHT) #- TEXTURE_HEIGHT

streaks2 = streaks[1:] + [TEXTURE_WIDTH + TEXTURE_HEIGHT]

brightnesses = [
    random.random()
    for _ in range(STREAK_COUNT)
]
falloffs = [
    0.5 + 0.25 * random.random()
    for _ in range(STREAK_COUNT)
]

# print(streaks)

# def saturate(x: float) -> float:
#     return max(0, min(1, x))

# def single_streak_luma(z: float, streak: float) -> float:
#     distance = z - streak
#     if distance < 0:
#         return 0
#     return 1 - saturate(2 * distance / STREAK_WIDTH)

def floormod(a: float, b: float) -> float:
    return (a % b + b) % b

streak_slope = math.tan(math.radians(STREAK_ANGLE))

img = Image.new('LA', (TEXTURE_WIDTH, TEXTURE_HEIGHT))
for y in tqdm(range(TEXTURE_HEIGHT)):
    for x in range(TEXTURE_WIDTH):
        z = floormod(x - streak_slope * y, TEXTURE_WIDTH + TEXTURE_HEIGHT)

        shine = 0
        for left, right, value, falloff in zip(streaks, streaks2, brightnesses, falloffs):
            if z >= left:
                dark_value = value * falloff
                factor = (z - left) / (right - left)
                factor = (1 - factor) ** 2  # Easing function
                shine = dark_value + factor * (value - dark_value)

        # shine = max(single_streak_luma(z, streak) for streak in streaks)
        luma = 0.75 + 0.25 * shine
        alpha = 0.5 + 0.5 * shine
        img.putpixel((x, y), (int(luma * 255), int(alpha * 255)))

img.save('static/glass.png', 'PNG')
