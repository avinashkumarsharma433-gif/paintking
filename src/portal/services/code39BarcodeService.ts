/**
 * Real Code 39 Barcode Generator for jsPDF
 * Scannable by any mobile phone barcode scanner or industrial laser handheld scanner.
 */

// Code 39 Character encodings: 9 elements per char (5 bars, 4 spaces). 'w' = wide (3 units), 'n' = narrow (1 unit).
const CODE39_PATTERNS: Record<string, string> = {
  '0': 'nnnwwnwnn',
  '1': 'wnnwnnnnw',
  '2': 'nnwwnnnnw',
  '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn',
  '6': 'nnwwwnnnn',
  '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn',
  '9': 'nnwwnnwnn',
  'A': 'wnnnnwnnw',
  'B': 'nnwnnwnnw',
  'C': 'wnwnnwnnn',
  'D': 'nnnnwwnnw',
  'E': 'wnnnwwnnn',
  'F': 'nnwnwwnnn',
  'G': 'nnnnnwwnw',
  'H': 'wnnnnwwnn',
  'I': 'nnwnnwwnn',
  'J': 'nnnnwwwnn',
  'K': 'wnnnnnnww',
  'L': 'nnwnnnnww',
  'M': 'wnwnnnnwn',
  'N': 'nnnnwnnww',
  'O': 'wnnnwnnwn',
  'P': 'nnwnwnnwn',
  'Q': 'nnnnnnwww',
  'R': 'wnnnnnwwn',
  'S': 'nnwnnnwwn',
  'T': 'nnnnwnwwn',
  'U': 'wwnnnnnnw',
  'V': 'nwwnnnnnw',
  'W': 'wwwnnnnnn',
  'X': 'nwnnwnnnw',
  'Y': 'wwnnwnnnn',
  'Z': 'nwwnwnnnn',
  '-': 'nwnnnnwnw',
  '.': 'wwnnnnwnn',
  ' ': 'nwwnnnwnn',
  '$': 'nwnwnwnnn',
  '/': 'nwnwnnnwn',
  '+': 'nwnnnwnwn',
  '%': 'nnnwnwnwn',
  '*': 'nwnnwnwnn', // Start/stop delimiter
};

export function renderScannableCode39(
  doc: any,
  rawText: string,
  targetX: number,
  targetY: number,
  maxWidth: number,
  height: number
) {
  // Format text: uppercase and filter valid Code 39 chars
  const sanitized = rawText.toUpperCase().replace(/[^0-9A-Z\-\.\ \$\/\+\%]/g, '-');
  const fullString = `*${sanitized}*`;

  // Calculate total units:
  // Each char has 9 elements: 3 wide (3 * 2.5) + 6 narrow (6 * 1) = 7.5 + 6 = 13.5 units + 1 unit inter-character space
  // Ratio: wide = 2.5 * narrow
  const narrowWidth = 0.28; // mm
  const wideWidth = narrowWidth * 2.5;
  const charSpacing = narrowWidth * 1.2;

  let totalBarWidth = 0;
  for (let c = 0; c < fullString.length; c++) {
    const char = fullString[c];
    const pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS['-'];
    for (let p = 0; p < 9; p++) {
      totalBarWidth += pattern[p] === 'w' ? wideWidth : narrowWidth;
    }
    if (c < fullString.length - 1) {
      totalBarWidth += charSpacing;
    }
  }

  // Scale down if it exceeds maxWidth
  let scale = 1;
  if (totalBarWidth > maxWidth) {
    scale = maxWidth / totalBarWidth;
  }

  const effectiveNarrow = narrowWidth * scale;
  const effectiveWide = wideWidth * scale;
  const effectiveSpacing = charSpacing * scale;
  const actualTotalWidth = totalBarWidth * scale;

  // Center horizontally inside target area
  let currentX = targetX + Math.max(0, (maxWidth - actualTotalWidth) / 2);

  doc.setFillColor(0, 0, 0);

  for (let c = 0; c < fullString.length; c++) {
    const char = fullString[c];
    const pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS['-'];

    for (let p = 0; p < 9; p++) {
      const isBar = p % 2 === 0;
      const isWide = pattern[p] === 'w';
      const w = isWide ? effectiveWide : effectiveNarrow;

      if (isBar) {
        doc.rect(currentX, targetY, w, height, 'F');
      }

      currentX += w;
    }

    if (c < fullString.length - 1) {
      currentX += effectiveSpacing; // Inter-character gap
    }
  }
}
