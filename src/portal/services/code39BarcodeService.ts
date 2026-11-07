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

  // Standard Code 39 barcode specifications:
  // - Wide to Narrow ratio between 2.2:1 and 3:1 (typically 2.5:1)
  // - Inter-character gap = 1 narrow bar width
  // - Generous quiet zone (margins) on left and right for mobile & laser scanners
  // Calculate raw units: each char has 3 wide + 6 narrow elements = 3 * 2.5 + 6 = 13.5 narrow units + 1 gap unit = 14.5 units
  const numChars = fullString.length;
  // Total units = (numChars * 13.5) + ((numChars - 1) * 1)
  const totalUnits = (numChars * 13.5) + ((numChars - 1) * 1.0);

  // Available width accounting for at least 6mm quiet zone on each side
  const quietZoneMm = 6.0;
  const usableWidth = Math.max(20, maxWidth - (quietZoneMm * 2));

  // Determine narrow bar width (X dimension in mm)
  // Typical target narrow width is 0.32mm to 0.42mm for great optical recognition
  let narrowWidth = usableWidth / totalUnits;
  if (narrowWidth > 0.40) narrowWidth = 0.40; // cap so bars aren't excessively thick
  const wideWidth = narrowWidth * 2.5;
  const charSpacing = narrowWidth * 1.0;

  // Actual total width of barcode symbol
  let actualBarcodeWidth = 0;
  for (let c = 0; c < fullString.length; c++) {
    const char = fullString[c];
    const pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS['-'];
    for (let p = 0; p < 9; p++) {
      actualBarcodeWidth += pattern[p] === 'w' ? wideWidth : narrowWidth;
    }
    if (c < fullString.length - 1) {
      actualBarcodeWidth += charSpacing;
    }
  }

  // Exact center position ensuring wide quiet zone on both sides
  let currentX = targetX + Math.max(quietZoneMm, (maxWidth - actualBarcodeWidth) / 2);

  // Draw pure black bars
  doc.setFillColor(0, 0, 0);

  for (let c = 0; c < fullString.length; c++) {
    const char = fullString[c];
    const pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS['-'];

    for (let p = 0; p < 9; p++) {
      const isBar = p % 2 === 0;
      const isWide = pattern[p] === 'w';
      const w = isWide ? wideWidth : narrowWidth;

      if (isBar) {
        doc.rect(currentX, targetY, w, height, 'F');
      }

      currentX += w;
    }

    if (c < fullString.length - 1) {
      currentX += charSpacing; // Inter-character gap
    }
  }
}
