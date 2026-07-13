import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Map 1
# path-line-1 goes to 1B: 63.5, 67
html = re.sub(r'(<path id="path-line-1" d="M 25 75 C 35 40, 50 90,) 63 68', r'\1 63.5 67', html)
# path-line-1b starts at 1B: 63.5, 67
html = re.sub(r'(<path id="path-line-1b" d=")M 63 68 (C 70 30, 85 80, 95.5 54)', r'\1M 63.5 67 \2', html)

# Map 2
# path-line-2-entry goes to 2A: 34.5, 45
html = re.sub(r'(<path id="path-line-2-entry" d="M 9 67 C 15 30, 25 80,) 34 46', r'\1 34.5 45', html)
# path-line-2 starts at 2A: 34.5, 45 and goes to 2B: 58.5, 33
html = re.sub(r'(<path id="path-line-2" d=")M 34 46 (C 40 10, 50 60,) 58 34', r'\1M 34.5 45 \2 58.5 33', html)
# path-line-2b starts at 2B: 58.5, 33
html = re.sub(r'(<path id="path-line-2b" d=")M 58 34 (C 65 10, 80 70, 92.5 41)', r'\1M 58.5 33 \2', html)

# Map 3
# path-line-3 goes to 3B: 88.5, 67.5
html = re.sub(r'(<path id="path-line-3" d="M 34 58 C 50 30, 70 90,) 88 68', r'\1 88.5 67.5', html)

# Update cache version
html = html.replace('styles.css?v=412', 'styles.css?v=413')
html = html.replace('js/app.js?v=412', 'js/app.js?v=413')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
