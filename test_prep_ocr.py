from PIL import Image
import subprocess
import json
import os
import re

# 1. Preprocess Image
img_path = 'backend/uploads/report-1789576774312-344659634.png'
im = Image.open(img_path)
if im.mode == 'RGBA':
    bg = Image.new('RGB', im.size, (255, 255, 255))
    bg.paste(im, mask=im.split()[3])
    im = bg
else:
    im = im.convert('RGB')

w, h = im.size
if w < 1600 or h < 1600:
    im = im.resize((w * 2, h * 2), Image.Resampling.LANCZOS)

prep_path = 'temp_prep_ocr.png'
im.save(prep_path)

# 2. Run Windows OCR with word coordinates
cmd = ['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'test_win_ocr.ps1', '-ImagePath', prep_path]
res = subprocess.run(cmd, capture_output=True, text=True)
words = json.loads(res.stdout, strict=False)

# 3. Cluster words into horizontal lines
words_sorted = sorted(words, key=lambda w: w['y'])
lines = []
current_line = []
current_y = None

for w in words_sorted:
    if not current_line:
        current_line.append(w)
        current_y = w['y']
    else:
        if abs(w['y'] - current_y) <= 16:
            current_line.append(w)
        else:
            current_line.sort(key=lambda item: item['x'])
            lines.append(" ".join(item['t'] for item in current_line))
            current_line = [w]
            current_y = w['y']

if current_line:
    current_line.sort(key=lambda item: item['x'])
    lines.append(" ".join(item['t'] for item in current_line))

reconstructed_text = "\n".join(lines)
print("Reconstructed Text Preview:\n" + reconstructed_text[:600])

if os.path.exists(prep_path):
    os.remove(prep_path)
