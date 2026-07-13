import io
import re

# 1. Update styles.css
with io.open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Fix lock-overlay
old_lock_css = """.lock-overlay {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
}"""
new_lock_css = """.lock-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
}"""
if old_lock_css in css:
    css = css.replace(old_lock_css, new_lock_css)

# Fix stage-node transform
old_node_css = """.stage-node {
    position: absolute;
    z-index: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: transform 0.2s, z-index 0s;
}"""
new_node_css = """.stage-node {
    position: absolute;
    transform: translate(-50%, -50%);
    z-index: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: transform 0.2s, z-index 0s;
}"""
if old_node_css in css:
    css = css.replace(old_node_css, new_node_css)

with io.open('styles.css', 'w', encoding='utf-8') as f:
    f.write(css)

# 2. Update index.html to inject drag-and-drop debug mode again
with io.open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

debug_script = """
<!-- Debug Drag Mode -->
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const nodes = document.querySelectorAll('.stage-node');
        let draggedNode = null;
        
        nodes.forEach(node => {
            node.addEventListener('mousedown', (e) => {
                if (e.shiftKey) { // Hold shift to drag
                    draggedNode = node;
                    node.style.zIndex = 1000;
                    e.preventDefault();
                }
            });
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!draggedNode) return;
            const mapContent = draggedNode.closest('.map-content');
            if (!mapContent) return;
            const rect = mapContent.getBoundingClientRect();
            let x = ((e.clientX - rect.left) / rect.width) * 100;
            let y = ((e.clientY - rect.top) / rect.height) * 100;
            
            // Clamp
            x = Math.max(0, Math.min(100, x));
            y = Math.max(0, Math.min(100, y));
            
            draggedNode.style.left = x.toFixed(1) + '%';
            draggedNode.style.top = y.toFixed(1) + '%';
        });
        
        document.addEventListener('mouseup', () => {
            if (draggedNode) {
                console.log(`Node ${draggedNode.id}: left: ${draggedNode.style.left}, top: ${draggedNode.style.top}`);
                draggedNode.style.zIndex = '';
                draggedNode = null;
            }
        });
    });
</script>
</body>"""

html = html.replace('</body>', debug_script)
html = html.replace('styles.css?v=413', 'styles.css?v=414')
html = html.replace('js/app.js?v=413', 'js/app.js?v=414')

with io.open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
