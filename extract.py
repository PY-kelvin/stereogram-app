import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()
    
nodes = re.findall(r'<div class="stage-node (.*?)".*?style="left: (.*?)%; top: (.*?)%;"', html)
paths = re.findall(r'<path id="(.*?)" d="(.*?)"', html)

print("NODES:")
for n in nodes:
    print(n)

print("\nPATHS:")
for p in paths:
    print(p)
