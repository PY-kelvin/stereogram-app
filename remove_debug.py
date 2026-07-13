import io
import re

with io.open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove debug mode
debug_pattern = r'<!-- Debug Drag Mode -->.*?</script>'
html = re.sub(debug_pattern, '', html, flags=re.DOTALL)

# Update cache version
html = html.replace('styles.css?v=414', 'styles.css?v=415')
html = html.replace('js/app.js?v=414', 'js/app.js?v=415')

with io.open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
