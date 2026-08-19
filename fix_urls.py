import os
import glob
import re

for filepath in glob.glob('frontend/src/**/*.js*', recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    pattern = r"import\.meta\.env\.VITE_API_URL\s*\|\|\s*([\"'])http://localhost:5000\1(?!\)\.replace)"
    
    if re.search(pattern, content):
        new_content = re.sub(pattern, r'(import.meta.env.VITE_API_URL || \1http://localhost:5000\1).replace(/\/$/, "")', content)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('Updated:', filepath)
