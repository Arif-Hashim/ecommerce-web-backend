// Builds a simple 500x500 SVG placeholder (no internet needed)
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const wrap = (text, max = 16) => {
  const lines = [];
  let cur = '';
  String(text || 'Product').split(/\s+/).forEach((w) => {
    if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  });
  if (cur) lines.push(cur);
  return lines.slice(0, 4);
};

module.exports = (text, bg = 'e5e5e5') => {
  const color = /^[0-9a-f]{6}$/i.test(bg) ? bg : 'e5e5e5';
  const lines = wrap(text);
  const startY = 250 - ((lines.length - 1) * 38) / 2;
  const tspans = lines.map((l, i) => `<text x="250" y="${startY + i * 38}" text-anchor="middle" dominant-baseline="middle">${esc(l)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"><rect width="500" height="500" fill="#${color}"/><g font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#1a1a1a">${tspans}</g></svg>`;
};
