type PoPdfInput = {
  // === Order / Line data ===
  orderNo: string;
  orderDate?: string;
  poNo: string;
  shipToId: string;
  destinationId: string;
  termId: string;
  gradeId: string;
  qty: number;
  price?: number;
  currency?: string;
  requestETD?: string;
  actualETD?: string;

  // === PO Template fields ===
  /** Multi-line TO: block. Each \n = new line rendered in PDF. */
  poToBlock?: string;
  /** Multi-line CONSIGNEE & NOTIFY block. */
  poConsigneeNotify?: string;
  poTermsOfPayment?: string;
  poPackingInstructions?: string;
  /** Multi-line signature: "Name\nTitle\nCompany" */
  poConfirmBy?: string;
  /** Resolved destination display name (e.g. "Gdynia, Poland"). Used for DESTINATION section and Terms of Delivery city. */
  destinationName?: string;
  /** Product code extracted from gradeId (e.g. "VCR" from "VCR412"). Shown in PRODUCT column. */
  poGradeCode?: string;
  /** Full grade description from master data (e.g. "UBEPOL VCR412"). Shown in DESCRIPTION column. */
  poGradeDescription?: string;

  // === SI Template fields ===
  siAttn?: string;
  siFrom?: string;
  siUser?: string;
  siCountry?: string;
  siShipper?: string;
  siFeederVessel?: string;
  siMotherVessel?: string;
  siVesselCompany?: string;
  siForwarder?: string;
  siPortOfLoading?: string;
  /** Multi-line SI CONSIGNEE block. */
  siConsignee?: string;
  siBlType?: string;
  siFreeTime?: string;
  siRequirements?: string;
  siNote?: string;
  siNote2?: string;
  siNote3?: string;
  siDescription?: string;
  siUnderDescription?: string;
  /** Multi-line shipping mark lines. */
  siShippingMark?: string;
  siBelowSignature?: string;
};

const toPdfDate = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const escapePdf = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const formatNumber = (value: number, fraction = 2) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction
  });

const buildPdfDataUrl = (content: string[]) => {
  const streamText = content.join('\n');
  const stream = `<< /Length ${streamText.length} >>\nstream\n${streamText}\nendstream`;

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj',
    `4 0 obj\n${stream}\nendobj`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj'
  ];

  let body = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj) => {
    offsets.push(body.length);
    body += `${obj}\n`;
  });

  const xrefStart = body.length;
  body += `xref\n0 ${objects.length + 1}\n`;
  body += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    body += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return `data:application/pdf;base64,${btoa(body)}`;
};

export const createOfficialPoPdfDataUrl = (input: PoPdfInput) => {
  // ── PDF page setup ─────────────────────────────────────────────────
  // A4: 595 × 842 pt   margins: L=40 R=555 (width=515)
  // Helvetica char width ≈ 0.52 × fontSize (measured average for mixed text)
  const CW = 0.52; // char-width coefficient for Helvetica (more accurate than 0.48)
  const L = 40;
  const R = 555; // page margins

  const unitPrice = Number(input.price ?? 0);
  const amount = unitPrice * input.qty;

  const content: string[] = [];

  /** Draw text at (x, baseline-y) at the given font-size. */
  const T = (x: number, y: number, text: string, size: number) => {
    content.push('BT');
    content.push(`/F1 ${size.toFixed(1)} Tf`);
    content.push(`${x} ${y} Td`);
    content.push(`(${escapePdf(text)}) Tj`);
    content.push('ET');
  };

  /** Estimate text pixel-width. */
  const tw = (text: string, size: number) => text.length * size * CW;

  /** Right-align: draw so right edge is at x. */
  const TR = (x: number, y: number, text: string, size: number) =>
    T(x - tw(text, size), y, text, size);

  /** Center text inside a box starting at x with given width. */
  const TC = (x: number, y: number, text: string, boxW: number, size: number) =>
    T(x + Math.max(0, (boxW - tw(text, size)) / 2), y, text, size);

  /** Clamp text to fit maxWidth by truncating with '…'. */
  const clamp = (text: string, size: number, maxW: number): string => {
    if (tw(text, size) <= maxW) return text;
    let t = text;
    while (t.length > 1 && tw(t + '...', size) > maxW) t = t.slice(0, -1);
    return t + '...';
  };

  /** Draw clamped text. */
  const TC2 = (
    x: number,
    y: number,
    text: string,
    maxW: number,
    size: number
  ) => T(x, y, clamp(text, size, maxW), size);

  /** Auto-shrink font down to minSize to fit maxW, then clamp. */
  const TFit = (
    x: number,
    y: number,
    text: string,
    maxW: number,
    pref: number,
    min: number
  ) => {
    let s = pref;
    while (s > min && tw(text, s) > maxW) s -= 0.25;
    TC2(x, y, text, maxW, Math.max(min, s));
  };

  const line = (x1: number, y1: number, x2: number, y2: number, w = 0.75) => {
    content.push(`${w} w`);
    content.push(`${x1} ${y1} m ${x2} ${y2} l S`);
  };

  const rect = (x: number, y: number, w: number, h: number, lw = 0.75) => {
    line(x, y, x + w, y, lw);
    line(x + w, y, x + w, y - h, lw);
    line(x + w, y - h, x, y - h, lw);
    line(x, y - h, x, y, lw);
  };

  /** Draw bold-style label with underline. */
  const UL = (x: number, y: number, text: string, size: number) => {
    T(x, y, text, size);
    line(x, y - 2, x + tw(text, size) * 1.02, y - 2, 0.5);
  };

  // ── LETTERHEAD ──────────────────────────────────────────────────────
  // y=842 top; leave 25pt top margin → start at y=817
  T(L, 817, 'UBE Elastomer Co. Ltd.', 9);
  T(L, 806, 'Seavans North Bldg., 1-2-1, Shibaura, Minato-ku,', 9);
  T(L, 795, 'Tokyo 105-6791, Japan', 9);
  T(480, 813, 'UBE', 26);

  // ── TITLE + CONFIDENTIAL box ────────────────────────────────────────
  // "PURCHASE ORDER" at y=770, CONFIDENTIAL box right side
  T(L, 771, 'PURCHASE ORDER', 14);
  rect(400, 781, 155, 20, 1);
  TC(400, 765, 'CONFIDENTIAL', 155, 13);

  // ── PO NUMBER + DATE (right column) ─────────────────────────────────
  // y=742: PO No (20pt gap below CONFIDENTIAL box bottom at y=761 → more breathing room)
  T(295, 742, 'Purchase Order No. :', 9.5);
  T(410, 742, input.poNo || input.orderNo, 11);
  T(295, 728, 'Date of Order :', 9.5);
  T(395, 728, toPdfDate(input.orderDate), 9.5);

  // ── HORIZONTAL DIVIDER ───────────────────────────────────────────────
  line(L, 716, R, 716, 1.1);

  // ── VERTICAL DIVIDER left|right in address block ─────────────────────
  // Address block: y=716 down to y=620
  line(293, 716, 293, 620, 1);

  // ── TO: block ────────────────────────────────────────────────────────
  // Label at y=706, content starts at y=693, step=13, max 6 lines → lowest=693-5×13=628 > 620 ✓
  T(L, 706, 'TO:', 9.5);
  const toLines = (
    input.poToBlock ||
    'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP'
  ).split('\n');
  toLines
    .slice(0, 6)
    .forEach((ln, i) => TFit(L, 693 - i * 13, ln, 245, 9.5, 7.5));

  // ── CONSIGNEE & NOTIFY block ─────────────────────────────────────────
  T(298, 706, 'CONSIGNEE & NOTIFY :', 9.5);
  const consLines = (
    input.poConsigneeNotify ||
    'Consignee Company Name\nAddress Line 1\nAddress Line 2\nCity, Country\nContact Person: ...\nTel / Fax: ...'
  ).split('\n');
  consLines
    .slice(0, 6)
    .forEach((ln, i) => TFit(298, 693 - i * 13, ln, 252, 9.5, 7.5));

  // ── DIVIDER under address block ──────────────────────────────────────
  line(L, 620, R, 620, 1.1);

  // ── DELIVERY DATE + TERMS OF PAYMENT ────────────────────────────────
  // Row band: y=620 → y=592  (height 28)
  UL(L, 610, 'DELIVERY DATE (ETD) :', 9.5);
  T(L, 598, toPdfDate(input.actualETD || input.requestETD), 10.5);
  UL(298, 610, 'TERMS OF PAYMENT :', 9.5);
  TC2(
    298,
    598,
    input.poTermsOfPayment || 'BY T.T.R 30 DAYS AFTER B/L DATE',
    252,
    9.5
  );

  line(L, 590, R, 590, 1.1);

  // ── TERMS OF DELIVERY + PACKING INSTRUCTIONS ────────────────────────
  // Row band: y=590 → y=562
  UL(L, 580, 'TERMS OF DELIVERY :', 9.5);
  const destDisplayName = input.destinationName || input.destinationId || '';
  const destCity = destDisplayName.split(',')[0].trim();
  const termOfDelivery = [input.termId || 'CIF', destCity]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();
  TC2(L, 568, termOfDelivery, 245, 9.5);

  UL(298, 580, 'PACKING INSTRUCTIONS :', 9.5);
  TC2(
    298,
    568,
    input.poPackingInstructions || 'STANDARD EXPORT PACKING',
    252,
    9.5
  );

  line(L, 560, R, 560, 1.1);

  // ── DESTINATION + CUSTOMER PO No. ───────────────────────────────────
  // Row band: y=560 → y=532
  UL(L, 550, 'DESTINATION :', 9.5);
  TC2(
    L,
    538,
    (input.destinationName || input.destinationId || '').toUpperCase(),
    245,
    9.5
  );
  T(298, 538, 'CUSTOMER PO No. :', 9.5);
  TC2(390, 538, input.poNo, 165, 9.5);

  line(L, 530, R, 530, 1.3);

  // ── PRODUCT TABLE ─────────────────────────────────────────────────────
  // Table: y=516 top → y=446 bottom  (70pt tall); 14pt gap below section separator at y=530
  // Columns: PRODUCT(40-105) DESCRIPTION(105-270) QUANTITY(270-340) UNIT PRICE(340-450) AMOUNT(450-555)
  const tT = 516;
  const tB = 446;
  const c1 = L;
  const c2 = 105;
  const c3 = 270;
  const c4 = 340;
  const c5 = 450;
  const c6 = R;

  rect(c1, tT, c6 - c1, tT - tB, 1.1);
  line(c2, tT, c2, tB, 0.85);
  line(c3, tT, c3, tB, 0.85);
  line(c4, tT, c4, tB, 1);
  line(c5, tT, c5, tB, 1);

  // Header row y-baseline=503
  const hY = 503;
  TC(c1, hY, 'PRODUCT', c2 - c1, 9.5);
  TC(c2, hY, 'DESCRIPTION', c3 - c2, 9.5);
  TC(c3, hY, 'QUANTITY', c4 - c3, 9.5);
  TC(c4, hY, 'UNIT PRICE', c5 - c4, 9.5);
  TC(c5, hY, 'AMOUNT', c6 - c5, 9.5);

  // Sub-header (unit) row — divider at y=493, baseline=483
  line(c1, 493, c6, 493, 0.7);
  const unitLabel = (input.currency || 'EUR').toUpperCase();
  TC(c3, 483, 'MT', c4 - c3, 9);
  TC(c4, 483, unitLabel, c5 - c4, 9);
  TC(c5, 483, unitLabel, c6 - c5, 9);

  // Data row — divider at y=473, baseline=461
  line(c1, 473, c6, 473, 0.7);
  const gradeCode =
    input.poGradeCode || (input.gradeId || '').match(/^[A-Za-z]+/)?.[0] || 'BR';
  const gradeDesc = input.poGradeDescription || input.gradeId || '';
  T(c1 + 4, 461, gradeCode, 10);
  TC2(c2 + 4, 461, gradeDesc, c3 - c2 - 8, 9.5);
  TR(c4 - 4, 461, formatNumber(input.qty), 9.5);
  TR(c5 - 4, 461, formatNumber(unitPrice), 9.5);
  TR(c6 - 4, 461, formatNumber(amount), 9.5);

  // TOTAL row: rect below table, y=460 height=22
  rect(c4, tB, c6 - c4, 22, 1.1);
  line(c5, tB, c5, tB - 22, 1);
  TC(c4, tB - 14, 'TOTAL', c5 - c4, 10);
  TR(c6 - 4, tB - 14, formatNumber(amount), 10);

  // ── PRICE BREAK DOWN ─────────────────────────────────────────────────
  // Placed at y=425 → y=365
  UL(L, 422, 'PRICE BREAK DOWN', 10.5);

  const pbT = 412;
  const pbB = 364;
  const pb1 = L;
  const pb2 = 172;
  const pb3 = 296;
  const pb4 = 385;
  rect(pb1, pbT, pb4 - pb1, pbT - pbB, 1);
  line(pb2, pbT, pb2, pbB, 0.7);
  line(pb3, pbT, pb3, pbB, 0.7);
  line(pb1, pbT - 16, pb4, pbT - 16, 0.7);
  line(pb1, pbT - 32, pb4, pbT - 32, 0.7);

  const discountRate = 0.04;
  const discountAmt = unitPrice * discountRate;
  const contractNet = unitPrice - discountAmt;

  T(pb1 + 3, pbT - 11, 'CONTRACT PRICE', 9);
  TC2(
    pb2 + 3,
    pbT - 11,
    `${(input.termId || 'CIF').toUpperCase()} base ${unitLabel} / MT`,
    pb3 - pb2 - 6,
    9
  );
  TR(pb4 - 3, pbT - 11, formatNumber(unitPrice), 9);

  T(pb1 + 3, pbT - 27, 'DISCOUNT', 9);
  TC2(
    pb2 + 3,
    pbT - 27,
    `${(discountRate * 100).toFixed(0)}% on ${(input.termId || 'CIF').toUpperCase()} VALUE`,
    pb3 - pb2 - 6,
    9
  );
  TR(pb4 - 3, pbT - 27, formatNumber(discountAmt), 9);

  T(pb1 + 3, pbT - 43, 'CONTRACT - DISCOUNT', 9);
  TR(pb4 - 3, pbT - 43, formatNumber(contractNet), 9);

  // ── SIGNATURE SECTION ────────────────────────────────────────────────
  // y=334 → y=248
  T(L, 334, 'PLEASE SIGN AND RETURN CONFIRMATION', 10);

  T(L, 301, 'Issued by :', 9.5);
  line(L, 274, 180, 274, 0.75);
  T(L, 262, 'UBE Elastomer Co. Ltd.', 9);

  line(298, 274, 453, 274, 0.75);
  T(298, 301, 'Confirmed by :', 9.5);
  const confirmLines = (
    input.poConfirmBy ||
    'T. Fujioka\nSenior Executive Vice President\nThai Synthetic Rubbers Co., Ltd.'
  ).split('\n');
  confirmLines.slice(0, 3).forEach((ln, i) => T(298, 262 - i * 14, ln, 9.5));

  return buildPdfDataUrl(content);
};

export const createShippingInstructionPdfDataUrl = (input: PoPdfInput) => {
  // ── PDF page setup ─────────────────────────────────────────────────
  // A4: 595 × 842 pt   margins: L=40 R=555 (width=515)
  const CW = 0.52;
  const L = 40;
  const R = 555;

  const content: string[] = [];

  const T = (x: number, y: number, text: string, size: number) => {
    content.push('BT');
    content.push(`/F1 ${size.toFixed(1)} Tf`);
    content.push(`${x} ${y} Td`);
    content.push(`(${escapePdf(text)}) Tj`);
    content.push('ET');
  };

  const tw = (text: string, size: number) => text.length * size * CW;

  const clamp = (text: string, size: number, maxW: number): string => {
    if (tw(text, size) <= maxW) return text;
    let t = text;
    while (t.length > 1 && tw(t + '...', size) > maxW) t = t.slice(0, -1);
    return t + '...';
  };

  const TC2 = (
    x: number,
    y: number,
    text: string,
    maxW: number,
    size: number
  ) => T(x, y, clamp(text, size, maxW), size);

  const line = (x1: number, y1: number, x2: number, y2: number, w = 0.75) => {
    content.push(`${w} w`);
    content.push(`${x1} ${y1} m ${x2} ${y2} l S`);
  };

  // ── Derived values ──────────────────────────────────────────────────
  const gradeName = (
    input.poGradeDescription ||
    input.gradeId ||
    '-'
  ).toUpperCase();
  const destination = (
    input.destinationName ||
    input.destinationId ||
    '-'
  ).toUpperCase();
  const poNo = input.poNo || input.orderNo;
  const etd = toPdfDate(input.actualETD || input.requestETD);

  // ── LETTERHEAD  y=842 top ────────────────────────────────────────────
  T(L, 817, 'UBE Elastomer Co. Ltd.', 9);
  T(L, 806, 'Seavans North Bldg., 1-2-1, Shibaura, Minato-ku,', 9);
  T(L, 795, 'Tokyo 105-6791, Japan', 9);
  T(480, 813, 'UBE', 26);

  // ── TITLE ───────────────────────────────────────────────────────────
  // y=771 bold title; date flush right
  T(178, 771, 'SHIPPING INSTRUCTION', 15);
  T(480, 771, toPdfDate(input.orderDate), 9);

  line(L, 762, R, 762, 1);

  // ── ATTN / FROM block  y=762→716 ────────────────────────────────────
  // Left column (L to 265), right column (270 to R)
  // Row 1: ATTN / From labels  y=750
  T(L, 750, 'ATTN :', 9.5);
  TC2(78, 750, input.siAttn || 'T.FUJIOKA / SEVP', 183, 9.5);
  T(270, 750, 'From :', 9.5);
  TC2(312, 750, input.siFrom || 'M.KAWAMORI / H.UEDA', 241, 9.5);

  // Row 2: company  y=737
  TC2(L, 737, 'THAI SYNTHETIC RUBBERS CO., LTD.', 225, 9.5);
  TC2(270, 737, 'UBE Elastomer Co. Ltd.', 283, 9.5);

  // Row 3-4: Tel / Fax (right column only)
  T(270, 724, 'TEL : 81-3-5419-6167', 9);
  T(270, 712, 'FAX : 81-3-5419-6250', 9);

  line(L, 702, R, 702, 1);

  // ── CONTRACT / USER / COUNTRY / SHIPPER  y=702→652 ─────────────────
  // Each row height = 16pt, 4 rows → 64pt, bottom at y=638
  const LV = 112; // label-value split x for left column
  T(L, 690, 'CONTRACT NO. :', 9.5);
  TC2(LV, 690, `${poNo}-5`, 153, 9.5);

  T(L, 676, 'USER :', 9.5);
  TC2(LV, 676, input.siUser || '-', 153, 9.5);

  T(L, 662, 'COUNTRY :', 9.5);
  TC2(LV, 662, input.siCountry || '-', 153, 9.5);

  T(L, 648, 'SHIPPER :', 9.5);
  TC2(LV, 648, input.siShipper || 'TSL WITH FULL ADDRESS', 153, 9.5);

  line(L, 638, R, 638, 1);

  // ── SHIPPING MARK (right column)  y=638→472 ─────────────────────────
  // Allocate right col (270→R = 283pt wide) for shipping mark: 9 lines max step=14
  T(270, 627, 'SHIPPING MARK :', 9.5);
  const markFallback = [
    `${input.siUser || 'TOYO TYRE MALAYSIA'} PLANT`,
    `MAR${toPdfDate(input.orderDate).replace(/-/g, '')}`,
    `ORDER No.: ${poNo}-5`,
    gradeName,
    `V.NO. ${poNo}`,
    'MADE IN THAILAND'
  ].join('\n');
  const markLines = (input.siShippingMark || markFallback).split('\n');
  // markYStart=614, step=13, max 9 lines → bottom = 614-8×13 = 510  (above 472 divider ✓)
  markLines.slice(0, 9).forEach((ml, i) => TC2(270, 614 - i * 13, ml, 283, 9));

  // ── VESSEL / FORWARDER / ETD / ETA (left column)  y=638→472 ─────────
  // 8 rows step=14 → used rows: 638-7×14=540 last row at y=540, bottom at ~530
  T(L, 627, 'FEEDER VESSEL :', 9.5);
  TC2(LV, 627, input.siFeederVessel || '-', 153, 9.5);

  T(L, 613, 'MOTHER VESSEL :', 9.5);
  TC2(LV, 613, input.siMotherVessel || '-', 153, 9.5);

  T(L, 599, 'VESSEL COMPANY :', 9.5);
  TC2(LV, 599, input.siVesselCompany || '-', 153, 9.5);

  T(L, 585, 'FORWARDER :', 9.5);
  TC2(LV, 585, input.siForwarder || '-', 153, 9.5);

  T(L, 571, 'ETD :', 9.5);
  T(LV, 571, etd, 9.5);

  T(L, 557, 'ETA :', 9.5);
  T(LV, 557, etd, 9.5);

  line(L, 472, R, 472, 1);

  // ── PORT / DESTINATION  y=472→444 ───────────────────────────────────
  TC2(
    L,
    461,
    `PORT OF LOADING : ${input.siPortOfLoading || 'LAEM CHABANG, THAILAND'}`,
    R - L,
    9.5
  );
  TC2(L, 447, `PORT OF DESTINATION : ${destination}`, R - L, 9.5);

  line(L, 437, R, 437, 1);

  // ── CONSIGNEE & NOTIFY  y=437→310 ───────────────────────────────────
  // Label at y=426, then up to 7 consignee lines step=13 → bottom = 426-7×13 = 335  (above 323 ✓)
  T(L, 426, 'CONSIGNEE & NOTIFY :', 9.5);
  const siConsLines = (
    input.siConsignee ||
    'Toyo Tyre Malaysia Sdn Bhd\nPT23101, Jalan Tembaga Kuning\nKawasan Perindustrian Kamunting Raya\nPO Box 1, 34600, Kamunting, Perak, Malaysia\nContact Person : Ms Lim / Ms Yap\nTel : 605-8206600 Fax : 605-8206659'
  ).split('\n');
  siConsLines
    .slice(0, 7)
    .forEach((ln, i) => TC2(L, 413 - i * 13, ln, R - L, 9.5));

  line(L, 323, R, 323, 1);

  // ── B/L / FREE TIME / REQUIREMENTS  y=323→270 ───────────────────────
  T(L, 312, 'B/L :', 9.5);
  TC2(LV, 312, input.siBlType || 'SURRENDERED B/L', R - LV, 9.5);

  T(L, 298, 'FREE TIME :', 9.5);
  TC2(
    LV,
    298,
    input.siFreeTime || 'D/M : 14 DAYS   D/T : 14 DAYS',
    R - LV,
    9.5
  );

  T(L, 284, 'REQUIREMENTS :', 9.5);
  TC2(
    LV,
    284,
    input.siRequirements || '* Please apply 14 days Free Time',
    R - LV,
    9.5
  );

  line(L, 270, R, 270, 0.85);

  // ── NOTES  y=270→228 ─────────────────────────────────────────────────
  TC2(L, 260, input.siNote || '* CERTIFICATE OF ANALYSIS', R - L, 9.5);
  TC2(L, 247, input.siNote2 || '* PACKING LIST', R - L, 9.5);
  TC2(
    L,
    234,
    input.siNote3 ||
      '* Please describe MAR information on all delivery documents. (BL, PL, COA)',
    R - L,
    9
  );

  line(L, 222, R, 222, 1);

  // ── GRADE TABLE  y=222→160 ───────────────────────────────────────────
  // Header row at y=211, separator at y=204, data row at y=192
  T(L + 4, 211, 'GRADE', 9.5);
  T(178, 211, 'QUANTITY (MT)', 9.5);
  T(320, 211, 'DESCRIPTION', 9.5);
  line(L, 204, R, 204, 0.85);

  TC2(L + 4, 192, gradeName, 128, 9.5);
  T(178, 192, `${formatNumber(input.qty)} MT`, 9.5);
  TC2(320, 192, input.siDescription || gradeName, R - 320, 9.5);

  // Under-description (optional note below data row)
  if (input.siUnderDescription) {
    TC2(L + 4, 178, input.siUnderDescription, R - L, 9);
  }

  line(L, 168, R, 168, 1);

  // ── SIGNATURE  y=168→110 ─────────────────────────────────────────────
  line(L, 140, 170, 140, 0.75);
  T(L, 128, input.siBelowSignature || 'UBE Elastomer Co. Ltd.', 9.5);

  return buildPdfDataUrl(content);
};
