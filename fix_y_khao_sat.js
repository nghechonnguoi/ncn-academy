const fs = require('fs');

const fpath = 'd:/NCN-Academy/quiz-site/khao-sat/script.js';

const oldLoop = `    latinName.split(' ').forEach(word => {
      for (const ch of word) {
        const v = LETTER_MAP[ch];
        if (!v) continue;
        missionRaw += v;
        letterFreq[v] = (letterFreq[v] || 0) + 1;
        if (VOWELS.has(ch)) soulRaw += v;
      }
    });`;

const newLoop = `    latinName.split(' ').forEach(word => {
      for (let i = 0; i < word.length; i++) {
        const ch = word[i];
        const v = LETTER_MAP[ch];
        if (!v) continue;
        missionRaw += v;
        letterFreq[v] = (letterFreq[v] || 0) + 1;
        
        if (VOWELS.has(ch)) {
          soulRaw += v;
        } else if (ch === 'Y') {
          if (isYVowel(word, i)) soulRaw += v;
        }
      }
    });`;

const oldVowels = "    const VOWELS = new Set(['A', 'E', 'I', 'O', 'U', 'Y']);";

const newVowels = `    const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']); // Y duoc tinh rieng

    const isYVowel = (word, index) => {
      const prev = index > 0 ? word[index - 1] : null;
      const next = index < word.length - 1 ? word[index + 1] : null;
      const prevIsVowel = prev !== null && VOWELS.has(prev);
      const nextIsVowel = next !== null && VOWELS.has(next);
      if (prevIsVowel && nextIsVowel) return false;
      return true;
    };`;

if (!fs.existsSync(fpath)) {
    console.log('Not found: ' + fpath);
} else {
    let content = fs.readFileSync(fpath, 'utf8');
    if (content.includes(oldVowels)) {
        content = content.replace(oldVowels, newVowels);
        console.log('Patched VOWELS');
    }
    const normalizedContent = content.replace(/\r\n/g, '\n');
    const normalizedOldLoop = oldLoop.replace(/\r\n/g, '\n');
    if (normalizedContent.includes(normalizedOldLoop)) {
        content = normalizedContent.replace(normalizedOldLoop, newLoop);
        console.log('Patched loop');
    }
    fs.writeFileSync(fpath, content, 'utf8');
}
