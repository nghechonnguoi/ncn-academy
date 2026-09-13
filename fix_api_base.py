with open('quiz-site/dashboard-result.js', 'r', encoding='utf-8') as f:
    content = f.read()

old = "const API_BASE = 'https://nghechonnguoi.com/api';"
new = "const API_BASE = 'https://www.nghechonnguoi.com/api';"
content = content.replace(old, new)

with open('quiz-site/dashboard-result.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done! www present:', 'www.nghechonnguoi.com' in content)
print('No old URL:', old not in content)
