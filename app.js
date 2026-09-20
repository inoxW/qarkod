const payload = document.querySelector('#payload');
const preview = document.querySelector('#preview-stage');
const download = document.querySelector('#download-button');
const status = document.querySelector('#status');
let svgMarkup = '';

function bitsFor(text) {
  const bytes = new TextEncoder().encode(text);
  const data = [81, 75, 49, bytes.length >> 8, bytes.length & 255, ...bytes];
  let checksum = 0;
  for (const byte of data) checksum = (checksum * 31 + byte) & 0xffff;
  data.push(checksum >> 8, checksum & 255);
  return data.flatMap((byte) => Array.from({ length: 8 }, (_, shift) => (byte >> (7 - shift)) & 1));
}

function makeMatrix(text) {
  const bits = bitsFor(text);
  let side = Math.max(21, 1 + Math.floor(Math.sqrt(bits.length * 1.35)));
  side += (side - 1) % 2;
  if (bits.length > (side - 8) ** 2) side += 2;

  const matrix = Array.from({ length: side }, () => Array(side).fill(0));
  const reserved = new Set();
  const finders = [[0, 0], [0, side - 7], [side - 7, 0]];

  for (const [top, left] of finders) {
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        matrix[top + y][left + x] = Number(
          x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4)
        );
      }
    }
    for (let y = top - 1; y <= top + 7; y += 1) {
      for (let x = left - 1; x <= left + 7; x += 1) {
        if (x >= 0 && y >= 0 && x < side && y < side) reserved.add(`${y},${x}`);
      }
    }
  }

  let index = 0;
  for (let y = side - 1; y >= 0; y -= 1) {
    const columns = (side - 1 - y) % 2 === 0
      ? [...Array(side).keys()].reverse()
      : [...Array(side).keys()];
    for (const x of columns) {
      if (!reserved.has(`${y},${x}`)) {
        matrix[y][x] = (bits[index] || 0) ^ Number((x + y) % 3 === 0);
        index += 1;
      }
    }
  }
  return matrix;
}

function render(text) {
  const matrix = makeMatrix(text);
  const zone = 4;
  const scale = 10;
  const size = matrix.length + zone * 2;
  const cells = matrix.flatMap((row, y) => row.map((value, x) => (
    value ? `<rect x="${(x + zone) * scale}" y="${(y + zone) * scale}" width="${scale}" height="${scale}"/>` : ''
  ))).join('');

  svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size * scale} ${size * scale}" role="img" aria-label="Qarkod"><rect width="100%" height="100%" fill="white"/><g fill="black">${cells}</g></svg>`;
  preview.innerHTML = svgMarkup;
  document.querySelector('#matrix-size').textContent = `${matrix.length} × ${matrix.length}`;
}

function setStatus(message, kind = '') {
  status.textContent = message;
  status.className = `status ${kind}`;
}

function clearPreview() {
  preview.innerHTML = `<div class="empty-state">Ваш Qarkod<br>з'явиться тут</div>`;
  download.disabled = true;
  document.querySelector('#paid-note').textContent = 'Оплата ще не внесена';
}

payload.addEventListener('input', () => {
  document.querySelector('#character-count').textContent = `${payload.value.length} / 160`;
  if (payload.value.trim()) render(payload.value);
  else clearPreview();
});

document.querySelector('#clear-button').addEventListener('click', () => {
  payload.value = '';
  payload.dispatchEvent(new Event('input'));
  payload.focus();
});

download.addEventListener('click', () => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([svgMarkup], { type: 'image/svg+xml' }));
  link.download = 'qarkod.svg';
  link.click();
  URL.revokeObjectURL(link.href);
});

window.qarkod = { render, setStatus, download, payload };
