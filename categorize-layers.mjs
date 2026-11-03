import fs from 'fs';

function categorizeLayers(filePath) {
  console.log(`\n==================================================`);
  console.log(`PHÂN LOẠI LAYER CHO: ${filePath}`);
  console.log(`==================================================`);
  const content = fs.readFileSync(filePath, 'utf8');
  const body = content.split('</defs>')[1].replace('</svg>', '').trim();

  let depth = 0;
  let currentTag = '';
  let inTag = false;
  let topLevelElements = [];
  let currentStartIndex = 0;

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '<') {
      inTag = true;
      currentTag = '<';
    } else if (ch === '>') {
      inTag = false;
      currentTag += '>';
      const isClosing = currentTag.startsWith('</');
      const isSelfClosing = currentTag.endsWith('/>');
      const tagName = currentTag.match(/<\/?([a-zA-Z0-9:]+)/)?.[1];

      if (depth === 0 && !isClosing) currentStartIndex = i - currentTag.length + 1;
      if (isSelfClosing) {
        if (depth === 0) topLevelElements.push({ tag: tagName, start: currentStartIndex, end: i + 1 });
      } else if (isClosing) {
        depth--;
        if (depth === 0) topLevelElements.push({ tag: tagName, start: currentStartIndex, end: i + 1 });
      } else {
        depth++;
      }
    } else if (inTag) currentTag += ch;
  }

  topLevelElements.forEach((el, idx) => {
    const text = body.substring(el.start, el.end);
    let type = 'UNKNOWN';
    const tr = text.match(/transform=\"([^\"]+)\"/)?.[1] || '';
    const fill = text.match(/fill=\"([^\"]+)\"/)?.[1] || '';
    const imgW = text.match(/<image[^>]*width=\"([^\"]+)\"/)?.[1];
    const imgH = text.match(/<image[^>]*height=\"([^\"]+)\"/)?.[1];

    if (el.tag === 'rect') type = 'BACKGROUND_WHITE';
    else if (imgW === '784' && imgH === '1312') type = 'BACKGROUND_MAIN';
    else if (imgW === '622' && imgH === '610') type = 'NUMBER_FRAME_BOX';
    else if (imgW === '230' && imgH === '220') type = 'MASCOT_IMAGE';
    else if (imgW === '556') type = 'BRANCH_BOX';
    else if (text.includes('109.90625') || text.includes('134.71875') || (dLen(text) > 100 && dLen(text) < 200 && (fill === '#d90012' || fill === '#f92618' || fill === '#e10000' || fill === '#d80000' || fill === 'undefined'))) {
      type = 'NUMBER_ONE_DIGIT';
    } else if (text.includes('translate(') && (tr.includes('768') || tr.includes('800') || tr.includes('832') || tr.includes('865') || tr.includes('772') || tr.includes('804') || tr.includes('836') || tr.includes('868') || tr.includes('775') || tr.includes('807') || tr.includes('839') || tr.includes('871') || tr.includes('625') || tr.includes('652'))) {
      type = 'MESSAGE_TEXT';
    } else if (text.includes('translate(') && (tr.includes('914') || tr.includes('913') || tr.includes('917'))) {
      type = 'BRANCH_TEXT';
    } else if (text.includes('translate(') && (tr.includes('108') || tr.includes('112') || tr.includes('101') || tr.includes('96') || tr.includes('92') || tr.includes('93'))) {
      type = 'TOP_APOLOGY_TEXT';
    } else if (imgW) {
      type = `DECORATION_IMAGE_${imgW}x${imgH}`;
    }

    console.log(`Layer ${idx + 1}: [${type}] (len=${el.end - el.start}) tr=${tr} fill=${fill} img=${imgW}x${imgH}`);
  });
}

function dLen(text) {
  const d = text.match(/d=\"([^\"]+)\"/)?.[1];
  return d ? d.length : 0;
}

categorizeLayers('assets/templates/summer.svg');
categorizeLayers('assets/templates/winter.svg');
categorizeLayers('assets/templates/autumn.svg');
