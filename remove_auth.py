import os
import re

def fix_html(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove the auth-container div
    # It starts with <div id="auth-container" class="auth-wrapper"> and ends before <div class="app-container">
    content = re.sub(r'<!-- Giao diện màn hình khóa Đăng nhập.*?<div class="app-container">', '<div class="app-container">', content, flags=re.DOTALL)
    
    # Remove hidden class from profile-container
    content = content.replace('<div id="profile-container" class="card hidden">', '<div id="profile-container" class="card">')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed HTML:", filepath)

fix_html('quiz-site/index.html')
fix_html('quiz-site/khao-sat/index.html')
