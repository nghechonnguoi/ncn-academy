import pdfplumber
import warnings
import sys
import os

warnings.filterwarnings('ignore')
sys.stdout.reconfigure(encoding='utf-8')

pdf_path = 'D:/NCN-Academy/KhanhMinh_report.pdf'
output_path = 'D:/NCN-Academy/KhanhMinh_text.txt'

with pdfplumber.open(pdf_path) as pdf:
    total = len(pdf.pages)
    print(f'Total pages: {total}')
    
    all_text = []
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        if text:
            all_text.append(f'=== TRANG {i+1} ===')
            all_text.append(text)
            all_text.append('')

    full_text = '\n'.join(all_text)

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(full_text)

print(f'Done! Saved to {output_path}')
print(f'Total chars: {len(full_text)}')
