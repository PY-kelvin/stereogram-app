import io

with io.open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace locks
lock_svg = '<div class="lock-overlay"><svg viewBox="0 0 24 24"><path d="M12 2C9.24 2 7 4.24 7 7V10H6C4.9 10 4 10.9 4 12V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V12C20 10.9 19.1 10 18 10H17V7C17 4.24 14.76 2 12 2ZM12 4C13.66 4 15 5.34 15 7V10H9V7C9 5.34 10.34 4 12 4ZM12 14C13.1 14 14 14.9 14 16C14 17.1 13.1 18 12 18C10.9 18 10 17.1 10 16C10 14.9 10.9 14 12 14Z"/></svg></div>'
content = content.replace('<div class="lock-overlay">🔒</div>', lock_svg)

# Update cache version
content = content.replace('styles.css?v=411', 'styles.css?v=412')
content = content.replace('js/app.js?v=411', 'js/app.js?v=412')

# Remove debug mode
import re
debug_pattern = r'<!-- Debug Drag Mode -->.*?</script>'
replacement = ''
content = re.sub(debug_pattern, replacement, content, flags=re.DOTALL)

with io.open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
