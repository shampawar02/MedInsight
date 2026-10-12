from PIL import Image
import subprocess
import json

im = Image.open('backend/uploads/report-1789576774312-344659634.png')
if im.mode == 'RGBA':
    bg = Image.new('RGB', im.size, (255, 255, 255))
    bg.paste(im, mask=im.split()[3])
    im = bg
else:
    im = im.convert('RGB')

w, h = im.size
im_2x = im.resize((w * 2, h * 2), Image.Resampling.LANCZOS)
im_2x.save('test_preprocessed.png')

cmd = ['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'test_win_ocr.ps1', '-ImagePath', 'test_preprocessed.png']
res = subprocess.run(cmd, capture_output=True, text=True)
words = json.loads(res.stdout, strict=False)
print('Words with 2x preprocessed image:', len(words))

# Cluster words into horizontal lines
words_sorted = sorted(words, key=lambda w: w['y'])
lines = []
current_line = []
current_y = None

for w in words_sorted:
    if not current_line:
        current_line.append(w)
        current_y = w['y']
    else:
        # If within 16 pixels vertically, it's on the same line
        if abs(w['y'] - current_y) <= 16:
            current_line.append(w)
        else:
            # Sort current line from left to right (by x)
            current_line.sort(key=lambda item: item['x'])
            lines.append(" ".join(item['t'] for item in current_line))
            current_line = [w]
            current_y = w['y']

if current_line:
    current_line.sort(key=lambda item: item['x'])
    lines.append(" ".join(item['t'] for item in current_line))

print("\n=== RECONSTRUCTED LINES ===")
for line in lines:
    print(line)
