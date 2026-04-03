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
  // ── Bridgestone Poznan-specific SI fields ──
  /** PO number header label (e.g. "BS POLAND PO No.:"). */
  siPoNumberHeader?: string;
  /** Booking number. */
  siBookingNo?: string;
  /** Courier / original docs address note. */
  siCourierAddress?: string;
  /** EORI number (EU customs). */
  siEoriNo?: string;
  /** Notify party name/address (Bridgestone layout). */
  siNotifyParty?: string;
  /** Also-notify party 1 (multi-line, split by \n). */
  siAlsoNotify1?: string;
  /** Also-notify party 2 (multi-line, split by \n). */
  siAlsoNotify2?: string;
  // ── Cooper Kunshan-specific SI fields ──
  /** DELIVER TO address (Cooper 3-col middle column). */
  siDeliverTo?: string;
  /** Label for 2nd reference number row (e.g. "Cooper NO.:"). */
  siNo2Header?: string;
  /** 2nd reference number value (e.g. "72026877"). */
  siNo2?: string;
  /** Material code label (e.g. "Material Code"). */
  siMaterialCodeHeader?: string;
  /** Material code value shown inside the SHIPPING MARK box. */
  siMaterialCode?: string;
  /** Note shown below material code (e.g. "*put marking CODE on both sides..."). */
  siNoteUnderMaterial?: string;
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
  // Row band: y=620 → y=590  vertical divider at x=293
  line(293, 620, 293, 590, 1);
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
  // Row band: y=590 → y=560  vertical divider at x=293
  line(293, 590, 293, 560, 1);
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
  // Row band: y=560 → y=530  vertical divider at x=293
  line(293, 560, 293, 530, 1);
  UL(L, 550, 'DESTINATION :', 9.5);
  TC2(
    L,
    538,
    (input.destinationName || input.destinationId || '').toUpperCase(),
    245,
    9.5
  );
  T(298, 538, 'CUSTOMER PO No. : ', 9.5);
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

// ── Bridgestone Poznan SI layout ─────────────────────────────────────────────
const buildBridgestoneSI = (input: PoPdfInput): string[] => {
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
  T(R - 57, 783, toPdfDate(input.orderDate), 9);
  T(178, 771, 'SHIPPING INSTRUCTION', 15);

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

  // ── CONTRACT / USER / COUNTRY / SHIPPER  y=702→638 ─────────────────
  // Left col labels at x=L, values at x=LV=130 (wider for long vessel names)
  // Right col: BS POLAND PO No. (from poNumberHeader)
  const LV = 130;
  const LVR = 372; // right col value x (after BS PO No. label ~89pt from x=270)

  T(L, 690, 'CONTRACT NO. :', 9.5);
  TC2(LV, 690, `${poNo}-5`, 130, 9.5);
  if (input.siPoNumberHeader) {
    T(270, 690, `${input.siPoNumberHeader}`, 9.5);
    TC2(LVR, 690, poNo, R - LVR, 9.5);
  }

  T(L, 676, 'USER :', 9.5);
  TC2(LV, 676, input.siUser || '-', 225, 9.5);

  T(L, 662, 'COUNTRY :', 9.5);
  TC2(LV, 662, input.siCountry || '-', 225, 9.5);

  T(L, 648, 'SHIPPER :', 9.5);
  TC2(LV, 648, input.siShipper || 'TSL WITH FULL ADDRESS', 225, 9.5);

  line(L, 638, R, 638, 1);

  // ── SHIPPING MARK box (right col)  y=638→472 ─────────────────────────
  // Box: x=270 → R, top=634 (4pt gap), bottom=476 (4pt above divider 472)
  const markBoxTop = 634;
  const markBoxBot = 476;
  // draw box manually for precise gap
  line(270, markBoxTop, R, markBoxTop, 0.85);
  line(R, markBoxTop, R, markBoxBot, 0.85);
  line(R, markBoxBot, 270, markBoxBot, 0.85);
  line(270, markBoxBot, 270, markBoxTop, 0.85);

  T(275, markBoxTop - 12, 'SHIPPING MARK :', 9.5);
  const markFallback = [
    `${input.siUser || 'BRIDGESTONE POZNAN SP/ZO.O'} PLANT`,
    `ORDER No.: ${poNo}-5`,
    gradeName,
    `C/NO. 1-15`,
    'MADE IN THAILAND'
  ].join('\n');
  const markLines = (input.siShippingMark || markFallback).split('\n');
  markLines
    .slice(0, 8)
    .forEach((ml, i) => TC2(275, markBoxTop - 26 - i * 13, ml, R - 281, 9));

  // ── VESSEL / FORWARDER / ETD / ETA (left col)  y=638→472 ─────────────
  // Word-wrap helper: renders line 2 at y-13 if text overflows maxW
  const wrapTC = (
    x: number,
    y: number,
    text: string,
    maxW: number,
    size: number
  ) => {
    if (tw(text, size) <= maxW) {
      T(x, y, text, size);
      return;
    }
    const words = text.split(' ');
    let l1 = '';
    for (const w of words) {
      const trial = (l1 ? l1 + ' ' : '') + w;
      if (tw(trial, size) <= maxW) l1 = trial;
      else break;
    }
    T(x, y, l1, size);
    TC2(x, y - 13, text.slice(l1.length).trim(), maxW, size);
  };

  // Each wrapTC row uses 26pt gap to the next row so that a wrap line (y-13)
  // leaves 13pt clearance to the row below — preventing visual collision.
  T(L, 627, 'FEEDER VESSEL :', 9.5);
  wrapTC(LV, 627, input.siFeederVessel || '-', 112, 9.5);

  T(L, 601, 'MOTHER VESSEL :', 9.5);
  wrapTC(LV, 601, input.siMotherVessel || '-', 112, 9.5);

  T(L, 575, 'VESSEL COMPANY :', 9.5);
  wrapTC(LV, 575, input.siVesselCompany || '-', 112, 9.5);

  // FORWARDER 26pt below VESSEL COMPANY to absorb its possible wrap line
  T(L, 549, 'FORWARDER :', 9.5);
  TC2(LV, 549, input.siForwarder || '-', 112, 9.5);

  T(L, 535, 'ETD :', 9.5);
  TC2(LV, 535, etd, 132, 9.5);

  T(L, 521, 'ETA :', 9.5);
  TC2(LV, 521, toPdfDate(input.requestETD), 132, 9.5);

  line(L, 472, R, 472, 1);

  // ── PORT / DESTINATION + FREE TIME  y=472→437 ───────────────────────
  // Left: PORT and DESTINATION stacked; Right: FREE TIME
  TC2(L, 460, `PORT :`, 40, 9.5);
  TC2(LV, 460, input.siPortOfLoading || 'LAEM CHABANG, THAILAND', 130, 9.5);
  TC2(L, 446, `DESTINATION :`, 86, 9.5);
  TC2(LV, 446, destination, 130, 9.5);
  // FREE TIME right side
  TC2(270, 460, `FREE TIME D/M : ${input.siFreeTime || '14 DAYS'}`, 285, 9.5);
  TC2(270, 446, `D/T : ${input.siFreeTime ? '' : '14 DAYS'}`, 285, 9.5);

  line(L, 437, R, 437, 1);

  // ── BOOKING NO.  y=437→420 ───────────────────────────────────────────
  T(L, 425, 'BOOKING NO. :', 9.5);
  TC2(LV, 425, input.siBookingNo || '-', R - LV, 9.5);

  line(L, 415, R, 415, 0.75);

  // ── CONSIGNEE AND NOTIFY  y=415→330 ─────────────────────────────────
  T(L, 403, 'CONSIGNEE AND', 9.5);
  T(L, 391, 'NOTIFY :', 9.5);
  const siConsLines = (
    input.siConsignee ||
    'BRIDGESTONE POZNAN SP/ZO.O.\nUL. BALTYCKA 65\n61-017 POZNAN, POLAND'
  ).split('\n');
  siConsLines
    .slice(0, 5)
    .forEach((ln, i) => TC2(LV, 403 - i * 13, ln, R - LV, 9.5));

  // COURIER ADDRESS (below consignee) — label is long (~17 chars), value starts at x=170 to avoid overlap
  if (input.siCourierAddress) {
    T(L, 340, 'COURIER ADDRESS :', 9.5);
    TC2(170, 340, input.siCourierAddress, R - 170, 9.5);
  }

  // EORI No.
  if (input.siEoriNo) {
    T(L, 326, 'EORI No. :', 9.5);
    TC2(LV, 326, input.siEoriNo, R - LV, 9.5);
  }

  line(L, 316, R, 316, 1);

  // ── NOTIFY PARTY ─────────────────────────────────────────────────────
  T(L, 304, 'NOTIFY PARTY :', 9.5);
  TC2(LV, 304, input.siNotifyParty || 'SAME AS CONSIGNEE', R - LV, 9.5);

  // ── ALSO NOTIFY (optional — e.g. Wilson) ─────────────────────────────
  const hasAlsoNotify = !!(input.siAlsoNotify1 || input.siAlsoNotify2);
  let secY = 294;

  if (hasAlsoNotify) {
    line(L, 294, R, 294, 0.5);
    T(L, 282, 'ALSO NOTIFY :', 9.5);
    let anY = 282;
    if (input.siAlsoNotify1) {
      const an1 = input.siAlsoNotify1.split('\n').filter(Boolean);
      an1.slice(0, 4).forEach((ln, i) => TC2(LV, anY - i * 13, ln, R - LV, 9));
      anY -= (Math.min(an1.length, 4) - 1) * 13;
    }
    if (input.siAlsoNotify2) {
      anY -= 14;
      const an2 = input.siAlsoNotify2.split('\n').filter(Boolean);
      an2.slice(0, 3).forEach((ln, i) => TC2(LV, anY - i * 13, ln, R - LV, 9));
      anY -= (Math.min(an2.length, 3) - 1) * 13;
    }
    secY = anY - 14;
    line(L, secY, R, secY, 0.85);
  } else {
    line(L, 294, R, 294, 0.85);
  }

  // ── REQUIREMENTS (multi-line) ─────────────────────────────────────────
  const maxReqLines = hasAlsoNotify ? 3 : 6;
  const reqStartY = secY - 12;
  T(L, reqStartY, 'REQUIREMENTS :', 9.5);
  const reqLines = (
    input.siRequirements || '* FULL SET OF surrendered B/L.'
  ).split('\n');
  reqLines
    .slice(0, maxReqLines)
    .forEach((ln, i) => TC2(LV, reqStartY - i * 13, ln, R - LV, 9));
  const reqEndY =
    reqStartY - (Math.min(reqLines.length, maxReqLines) - 1) * 13 - 14;
  line(L, reqEndY, R, reqEndY, 0.85);

  // ── NOTES (multi-line) ────────────────────────────────────────────────
  const maxNoteLines = hasAlsoNotify ? 2 : 4;
  const noteLines = [input.siNote, input.siNote2, input.siNote3].filter(
    Boolean
  ) as string[];
  if (noteLines.length === 0)
    noteLines.push('*Please send all original docs by E-mail to UBE Tokyo.');
  const noteStartY = reqEndY - 12;
  noteLines
    .slice(0, maxNoteLines)
    .forEach((ln, i) => TC2(L, noteStartY - i * 13, ln, R - L, 8.5));
  const noteEndY =
    noteStartY - (Math.min(noteLines.length, maxNoteLines) - 1) * 13 - 14;
  line(L, noteEndY, R, noteEndY, 1);

  // ── GRADE TABLE ───────────────────────────────────────────────────────
  const gradeHeaderY = noteEndY - 11;
  T(L + 4, gradeHeaderY, 'GRADE', 9.5);
  T(178, gradeHeaderY, 'QUANTITY (MT)', 9.5);
  T(320, gradeHeaderY, 'DESCRIPTION', 9.5);
  line(L, gradeHeaderY - 7, R, gradeHeaderY - 7, 0.85);

  const gradeDataY = gradeHeaderY - 19;
  TC2(L + 4, gradeDataY, gradeName, 128, 9.5);
  T(178, gradeDataY, `${formatNumber(input.qty)} MT`, 9.5);
  TC2(320, gradeDataY, input.siDescription || gradeName, R - 320, 9.5);

  if (input.siUnderDescription) {
    TC2(L + 4, gradeDataY - 14, input.siUnderDescription, R - L, 9);
  }

  const gradeEndY = gradeDataY - (input.siUnderDescription ? 28 : 14);
  line(L, gradeEndY, R, gradeEndY, 1);

  // ── SIGNATURE ─────────────────────────────────────────────────────────
  const sigLineY = gradeEndY - 18;
  line(L, sigLineY, 170, sigLineY, 0.75);
  T(L, sigLineY - 12, input.siBelowSignature || 'UBE Elastomer Co. Ltd.', 9.5);

  return content;
};

// ── Cooper Kunshan SI layout ──────────────────────────────────────────────────
const buildCooperKunshanSI = (input: PoPdfInput): string[] => {
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

  const rect = (x: number, y: number, w: number, h: number, lw = 0.75) => {
    line(x, y, x + w, y, lw);
    line(x + w, y, x + w, y - h, lw);
    line(x + w, y - h, x, y - h, lw);
    line(x, y - h, x, y, lw);
  };

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

  // ── LETTERHEAD ───────────────────────────────────────────────────────
  T(L, 817, 'UBE Elastomer Co. Ltd.', 9);
  T(L, 806, 'Seavans North Bldg., 1-2-1, Shibaura, Minato-ku,', 9);
  T(L, 795, 'Tokyo 105-6791, Japan', 9);
  T(480, 813, 'UBE', 26);

  // ── TITLE ────────────────────────────────────────────────────────────
  T(R - 57, 783, toPdfDate(input.orderDate), 9);
  T(178, 771, 'SHIPPING INSTRUCTION', 15);
  line(L, 762, R, 762, 1);

  // ── CONTRACT / USER / COUNTRY  y=762→710 ─────────────────────────────
  // Two-column: left col (L…260), right col (270…R)
  const LV = 118;
  T(L, 750, 'CONTRACT NO. :', 9.5);
  TC2(LV, 750, `${poNo}-5`, 148, 9.5);
  T(270, 750, 'USER :', 9.5);
  TC2(322, 750, input.siUser || '-', R - 322, 9.5);

  T(L, 736, 'COUNTRY :', 9.5);
  TC2(LV, 736, input.siCountry || '-', 148, 9.5);
  T(270, 736, 'FROM :', 9.5);
  TC2(322, 736, input.siFrom || 'UBE ELASTOMER CO., LTD.', R - 322, 9.5);

  // Row 3: buyer reference number (optional — shown only when provided)
  if (input.siNo2Header || input.siNo2) {
    T(L, 722, input.siNo2Header || 'REF NO. :', 9.5);
    TC2(LV, 722, input.siNo2 || '-', 148, 9.5);
  }

  line(L, 710, R, 710, 1);

  // ── SHIPPER (left) + SHIPPING MARK bordered box (right)  y=710→560 ───
  T(L, 698, 'SHIPPER :', 9.5);
  const shipperLines = (input.siShipper || 'TSL WITH FULL ADDRESS').split('\n');
  shipperLines
    .slice(0, 8)
    .forEach((sl, i) => TC2(L, 685 - i * 13, sl, 218, 9.5));

  // Bordered box: x=265, top=706, width=290, height=146 → bottom=560
  rect(265, 706, R - 265, 142, 0.85);
  T(270, 694, 'SHIPPING MARK :', 9.5);
  const markFallback = [
    'COOPER STANDARD KUNSHAN',
    toPdfDate(input.orderDate),
    `ORDER No.: ${poNo}-5`,
    gradeName,
    `V.NO. ${poNo}`,
    'MADE IN THAILAND'
  ].join('\n');
  const markLines = (input.siShippingMark || markFallback).split('\n');
  // Max 6 mark lines (last baseline=616), leaving room for material code below
  markLines
    .slice(0, 6)
    .forEach((ml, i) => TC2(270, 681 - i * 13, ml, R - 270, 9));
  // Material code inside mark box — thin interior divider at y=607
  if (input.siMaterialCodeHeader || input.siMaterialCode) {
    line(265, 607, R, 607, 0.5);
    T(270, 596, `${input.siMaterialCodeHeader || 'Material Code'} :`, 8.5);
    TC2(270, 583, input.siMaterialCode || '-', R - 276, 8.5);
  }
  if (input.siNoteUnderMaterial) {
    TC2(270, 570, input.siNoteUnderMaterial, R - 276, 8);
  }

  line(L, 560, R, 560, 1);

  // ── VESSEL  y=560→466 ────────────────────────────────────────────────
  T(L, 548, 'FEEDER VESSEL :', 9.5);
  TC2(LV, 548, input.siFeederVessel || '-', R - LV, 9.5);

  T(L, 534, 'MOTHER VESSEL :', 9.5);
  TC2(LV, 534, input.siMotherVessel || '-', R - LV, 9.5);

  T(L, 520, 'VESSEL COMPANY :', 9.5);
  TC2(LV, 520, input.siVesselCompany || '-', R - LV, 9.5);

  T(L, 506, 'FORWARDER :', 9.5);
  TC2(LV, 506, input.siForwarder || '-', R - LV, 9.5);

  T(L, 492, 'ETD :', 9.5);
  T(LV, 492, etd, 9.5);

  T(L, 478, 'ETA :', 9.5);
  T(LV, 478, etd, 9.5);

  line(L, 466, R, 466, 1);

  // ── PORT / DESTINATION  y=466→424 ────────────────────────────────────
  TC2(
    L,
    454,
    `PORT OF LOADING : ${input.siPortOfLoading || 'LAEM CHABANG, THAILAND'}`,
    R - L,
    9.5
  );
  TC2(L, 440, `PORT OF DESTINATION : ${destination}`, R - L, 9.5);

  line(L, 424, R, 424, 1);

  // ── 3-COLUMN: CONSIGNEE | DELIVER TO | FOR REF. OF UEC  y=424→290 ───
  // Columns: left=L…216  mid=220…381  right=385…R
  const MC = 220;
  const RC = 385;
  line(MC - 4, 424, MC - 4, 290, 0.7);
  line(RC - 4, 424, RC - 4, 290, 0.7);

  T(L, 412, 'CONSIGNEE :', 9.5);
  T(MC, 412, 'DELIVER TO :', 9.5);
  T(RC, 412, 'FOR REF. OF UEC :', 9.5);

  // Left col: siConsignee
  const siConsLines = (
    input.siConsignee ||
    'Cooper Standard (Kunshan) Co. Ltd.\nNo.101 Huanqiu Road\nKunshan Economic & Technological\nDevelopment Zone\nJiangsu Province, China 215300'
  ).split('\n');
  siConsLines
    .slice(0, 8)
    .forEach((ln, i) => TC2(L, 399 - i * 13, ln, MC - 4 - L - 2, 9));

  // Mid col: siDeliverTo (DELIVER TO address)
  const deliverToLines = (input.siDeliverTo || input.siNote2 || '-').split(
    '\n'
  );
  deliverToLines
    .slice(0, 8)
    .forEach((ln, i) => TC2(MC + 2, 399 - i * 13, ln, RC - 4 - MC - 4, 9));

  // Right col: poConsigneeNotify (FOR REF. OF UEC — the buying entity at TSL)
  const refLines = (
    input.poConsigneeNotify ||
    'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square\n98 North Sathorn Road\nBangkok 10500, THAILAND'
  ).split('\n');
  refLines
    .slice(0, 8)
    .forEach((ln, i) => TC2(RC + 2, 399 - i * 13, ln, R - RC - 2, 9));

  line(L, 290, R, 290, 1);

  // ── NOTIFY PARTY  y=290→240 ──────────────────────────────────────────
  T(L, 278, 'NOTIFY PARTY :', 9.5);
  const notifyLines = (input.siNotifyParty || input.siNote || '-').split('\n');
  notifyLines
    .slice(0, 3)
    .forEach((ln, i) => TC2(L, 265 - i * 13, ln, R - L, 9.5));

  line(L, 240, R, 240, 1);

  // ── REQUIREMENTS  y=240→168 ──────────────────────────────────────────
  T(L, 228, 'REQUIREMENTS :', 9.5);
  const reqLines = (
    input.siRequirements ||
    '* Please apply 14 days Free Time\n* CERTIFICATE OF ANALYSIS\n* PACKING LIST'
  ).split('\n');
  if (input.siNote3) reqLines.push(input.siNote3);
  reqLines.slice(0, 4).forEach((ln, i) => TC2(L, 215 - i * 13, ln, R - L, 9.5));

  line(L, 168, R, 168, 1);

  // ── GRADE TABLE  y=168→114 ───────────────────────────────────────────
  T(L + 4, 157, 'GRADE', 9.5);
  T(178, 157, 'QUANTITY (MT)', 9.5);
  T(320, 157, 'DESCRIPTION', 9.5);
  line(L, 150, R, 150, 0.85);

  TC2(L + 4, 138, gradeName, 128, 9.5);
  T(178, 138, `${formatNumber(input.qty)} MT`, 9.5);
  TC2(320, 138, input.siDescription || gradeName, R - 320, 9.5);

  if (input.siUnderDescription) {
    TC2(L + 4, 124, input.siUnderDescription, R - L, 9);
  }

  line(L, 114, R, 114, 1);

  // ── SIGNATURE ────────────────────────────────────────────────────────
  line(L, 86, 170, 86, 0.75);
  T(L, 74, input.siBelowSignature || 'UBE Elastomer Co. Ltd.', 9.5);

  return content;
};

// ── Bridgestone India SI (2-column consignee/notify layout) ──────────────────
const buildBridgestoneIndiaSI = (input: PoPdfInput): string[] => {
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

  // ── LETTERHEAD ───────────────────────────────────────────────────────
  T(L, 817, 'UBE Elastomer Co. Ltd.', 9);
  T(L, 806, 'Seavans North Bldg., 1-2-1, Shibaura, Minato-ku,', 9);
  T(L, 795, 'Tokyo 105-6791, Japan', 9);
  T(480, 813, 'UBE', 26);

  // ── TITLE ────────────────────────────────────────────────────────────
  T(R - 57, 783, toPdfDate(input.orderDate), 9);
  T(178, 771, 'SHIPPING INSTRUCTION', 15);
  line(L, 762, R, 762, 1);

  // ── ATTN / FROM block ────────────────────────────────────────────────
  T(L, 750, 'ATTN :', 9.5);
  TC2(78, 750, input.siAttn || 'T.FUJIOKA / SEVP', 183, 9.5);
  T(270, 750, 'From :', 9.5);
  TC2(312, 750, input.siFrom || 'W.MIYANAMI', 241, 9.5);

  TC2(L, 737, 'THAI SYNTHETIC RUBBERS CO., LTD.', 225, 9.5);
  TC2(270, 737, 'SYNTHETIC RUBBER DIV. UBE Elastomer Co. Ltd.', 283, 9.5);

  T(270, 724, 'TEL : 81-3-5419-6167', 9);
  T(270, 712, 'FAX : 81-3-5419-6250', 9);

  line(L, 702, R, 702, 1);

  // ── CONTRACT / USER / COUNTRY / SHIPPER ──────────────────────────────
  const LV = 130;
  const LVR = 372;

  T(L, 690, 'CONTRACT NO. :', 9.5);
  TC2(LV, 690, `${poNo}-5`, 130, 9.5);
  if (input.siPoNumberHeader) {
    T(270, 690, `${input.siPoNumberHeader}`, 9.5);
    TC2(LVR, 690, poNo, R - LVR, 9.5);
  }

  T(L, 676, 'USER :', 9.5);
  TC2(LV, 676, input.siUser || '-', 225, 9.5);

  T(L, 662, 'COUNTRY :', 9.5);
  TC2(LV, 662, input.siCountry || '-', 225, 9.5);

  T(L, 648, 'SHIPPER :', 9.5);
  TC2(LV, 648, input.siShipper || 'TSL WITH FULL ADDRESS', 225, 9.5);

  line(L, 638, R, 638, 1);

  // ── SHIPPING MARK box (right) ─────────────────────────────────────────
  const markBoxTop = 634;
  const markBoxBot = 476;
  line(270, markBoxTop, R, markBoxTop, 0.85);
  line(R, markBoxTop, R, markBoxBot, 0.85);
  line(R, markBoxBot, 270, markBoxBot, 0.85);
  line(270, markBoxBot, 270, markBoxTop, 0.85);

  T(275, markBoxTop - 12, 'SHIPPING MARK :', 9.5);
  const markFallback = [
    `${input.siUser || 'BRIDGESTONE INDIA'}`,
    `TRADE NAME: ${(input.poGradeDescription || input.gradeId || 'UBEPOL BR150L').toUpperCase()}`,
    `ORDER No.: ${poNo}-5`,
    `LOT.NO:`,
    'MADE IN THAILAND'
  ].join('\n');
  const markLines = (input.siShippingMark || markFallback).split('\n');
  markLines
    .slice(0, 8)
    .forEach((ml, i) => TC2(275, markBoxTop - 26 - i * 13, ml, R - 281, 9));

  // ── VESSEL / FORWARDER / ETD / ETA (left) ────────────────────────────
  const wrapTC = (
    x: number,
    y: number,
    text: string,
    maxW: number,
    size: number
  ) => {
    if (tw(text, size) <= maxW) {
      T(x, y, text, size);
      return;
    }
    const words = text.split(' ');
    let l1 = '';
    for (const w of words) {
      const trial = (l1 ? l1 + ' ' : '') + w;
      if (tw(trial, size) <= maxW) l1 = trial;
      else break;
    }
    T(x, y, l1, size);
    TC2(x, y - 13, text.slice(l1.length).trim(), maxW, size);
  };

  T(L, 627, 'FEEDER VESSEL :', 9.5);
  wrapTC(LV, 627, input.siFeederVessel || '-', 112, 9.5);

  T(L, 601, 'MOTHER VESSEL :', 9.5);
  wrapTC(LV, 601, input.siMotherVessel || '-', 112, 9.5);

  T(L, 575, 'VESSEL COMPANY :', 9.5);
  wrapTC(LV, 575, input.siVesselCompany || '-', 112, 9.5);

  T(L, 549, 'FORWARDER :', 9.5);
  TC2(LV, 549, input.siForwarder || '-', 112, 9.5);

  T(L, 535, 'ETD :', 9.5);
  TC2(LV, 535, etd, 132, 9.5);

  T(L, 521, 'ETA :', 9.5);
  TC2(LV, 521, toPdfDate(input.requestETD), 132, 9.5);

  line(L, 472, R, 472, 1);

  // ── PORT / DESTINATION ────────────────────────────────────────────────
  TC2(L, 460, 'PORT :', 40, 9.5);
  TC2(LV, 460, input.siPortOfLoading || 'LAEM CHABANG, THAILAND', 130, 9.5);
  TC2(L, 446, 'DESTINATION :', 86, 9.5);
  TC2(LV, 446, destination, 130, 9.5);

  line(L, 436, R, 436, 1);

  // ── BOOKING NO. ──────────────────────────────────────────────────────
  T(L, 424, 'BOOKING NO. :', 9.5);
  TC2(LV, 424, input.siBookingNo || '-', R - LV, 9.5);

  line(L, 414, R, 414, 0.75);

  // ── 2-COLUMN: CONSIGNEE (left) | NOTIFY PARTY (right) ────────────────
  // Left col: L → 262, Right col: 268 → R
  const MC = 268;
  line(MC - 4, 414, MC - 4, 308, 0.7);

  T(L, 402, 'CONSIGNEE :', 9.5);
  T(MC, 402, 'NOTIFY PARTY :', 9.5);

  const siConsLines = (
    input.siConsignee ||
    'Bridgestone India Private Limited\nPLOT NO. A-43, PHASE-II, MIDC CHAKAN\nVILLAGE SAWARDARI, TALUKA KHED, DIST. PUNE,\nMAHARASHTRA - 410 501, INDIA'
  ).split('\n');
  siConsLines
    .slice(0, 6)
    .forEach((ln, i) => TC2(L, 389 - i * 13, ln, MC - 4 - L - 2, 9));

  const notifyLines = (
    input.siNotifyParty ||
    input.siConsignee ||
    'SAME AS CONSIGNEE'
  ).split('\n');
  notifyLines
    .slice(0, 6)
    .forEach((ln, i) => TC2(MC + 2, 389 - i * 13, ln, R - MC - 4, 9));

  // EORI / IEC No. row
  if (input.siEoriNo) {
    T(L, 312, 'IEC No. :', 9.5);
    TC2(LV, 312, input.siEoriNo, MC - 4 - LV, 9.5);
  }

  line(L, 308, R, 308, 1);

  // ── FREE TIME ─────────────────────────────────────────────────────────
  if (input.siFreeTime) {
    T(L, 296, 'FREE TIME :', 9.5);
    TC2(LV, 296, input.siFreeTime, R - LV, 9.5);
    line(L, 284, R, 284, 0.85);
  } else {
    line(L, 296, R, 296, 0.85);
  }

  // ── REQUIREMENTS ──────────────────────────────────────────────────────
  const reqTopY = input.siFreeTime ? 272 : 284;
  T(L, reqTopY, 'REQUIREMENTS :', 9.5);
  const reqLinesIndia = (
    input.siRequirements ||
    '*Full set of Surrendered MASTER B/L (NOT FORWARDER BL).'
  ).split('\n');
  reqLinesIndia
    .slice(0, 6)
    .forEach((ln, i) => TC2(LV, reqTopY - i * 13, ln, R - LV, 9));
  const reqBotY = reqTopY - (Math.min(reqLinesIndia.length, 6) - 1) * 13 - 14;
  line(L, reqBotY, R, reqBotY, 0.85);

  // ── NOTES ─────────────────────────────────────────────────────────────
  const noteTopY = reqBotY - 12;
  const noteLines = [input.siNote, input.siNote2, input.siNote3].filter(
    Boolean
  ) as string[];
  if (noteLines.length === 0)
    noteLines.push('*Please send all original docs. to BS INDIA by courier.');
  noteLines
    .slice(0, 3)
    .forEach((ln, i) => TC2(L, noteTopY - i * 13, ln, R - L, 8.5));
  const noteBotY = noteTopY - (Math.min(noteLines.length, 3) - 1) * 13 - 14;
  line(L, noteBotY, R, noteBotY, 1);

  // ── GRADE TABLE ───────────────────────────────────────────────────────
  const ghY = noteBotY - 11;
  T(L + 4, ghY, 'GRADE', 9.5);
  T(178, ghY, 'QUANTITY (MT)', 9.5);
  T(320, ghY, 'DESCRIPTION', 9.5);
  line(L, ghY - 7, R, ghY - 7, 0.85);

  const gdY = ghY - 19;
  TC2(L + 4, gdY, gradeName, 128, 9.5);
  T(178, gdY, `${formatNumber(input.qty)} MT`, 9.5);
  TC2(320, gdY, input.siDescription || gradeName, R - 320, 9.5);

  if (input.siUnderDescription) {
    TC2(L + 4, gdY - 14, input.siUnderDescription, R - L, 9);
  }

  const geY = gdY - (input.siUnderDescription ? 28 : 14);
  line(L, geY, R, geY, 1);

  // ── SIGNATURE ─────────────────────────────────────────────────────────
  const slY = geY - 18;
  line(L, slY, 170, slY, 0.75);
  T(L, slY - 12, input.siBelowSignature || 'UBE Elastomer Co. Ltd.', 9.5);

  return content;
};

// ── PT Bridgestone Indonesia SI (single vessel + courier in mark box) ─────────
const buildBridgestoneIndonesiaSI = (input: PoPdfInput): string[] => {
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

  // ── LETTERHEAD ───────────────────────────────────────────────────────
  T(L, 817, 'UBE Elastomer Co. Ltd.', 9);
  T(L, 806, 'Seavans North Bldg., 1-2-1, Shibaura, Minato-ku,', 9);
  T(L, 795, 'Tokyo 105-6791, Japan', 9);
  T(480, 813, 'UBE', 26);

  // ── TITLE ────────────────────────────────────────────────────────────
  T(R - 57, 783, toPdfDate(input.orderDate), 9);
  T(178, 771, 'SHIPPING INSTRUCTION', 15);
  line(L, 762, R, 762, 1);

  // ── ATTN / FROM block ────────────────────────────────────────────────
  T(L, 750, 'ATTN :', 9.5);
  TC2(78, 750, input.siAttn || 'MR.FUJIOKA', 183, 9.5);
  T(270, 750, 'From :', 9.5);
  TC2(312, 750, input.siFrom || 'Miyanami', 241, 9.5);

  TC2(L, 737, 'THAI SYNTHETIC RUBBERS CO., LTD.', 225, 9.5);
  TC2(270, 737, 'UBE Elastomer Co. Ltd.', 283, 9.5);

  T(270, 724, 'TEL : 81-3-5419-6167', 9);
  T(270, 712, 'FAX : 81-3-5419-6250', 9);

  line(L, 702, R, 702, 1);

  // ── CO NUMBER / USER / COUNTRY / SHIPPER ─────────────────────────────
  const LV = 130;
  const LVR = 372;

  // Indonesia uses "CO NUMBER" label (siNo2Header) on left; right side has PO number header
  T(L, 690, input.siNo2Header || 'CO NUMBER :', 9.5);
  TC2(LV, 690, input.siNo2 || poNo, 130, 9.5);
  if (input.siPoNumberHeader) {
    T(270, 690, `${input.siPoNumberHeader}`, 9.5);
    TC2(LVR, 690, poNo, R - LVR, 9.5);
  }

  T(L, 676, 'USER :', 9.5);
  TC2(LV, 676, input.siUser || '-', 225, 9.5);

  T(L, 662, 'COUNTRY :', 9.5);
  TC2(LV, 662, input.siCountry || '-', 225, 9.5);

  T(L, 648, 'SHIPPER :', 9.5);
  TC2(LV, 648, input.siShipper || 'TSL', 225, 9.5);

  line(L, 638, R, 638, 1);

  // ── SHIPPING MARK + COURIER box (right column) ───────────────────────
  const markBoxTop = 634;
  const markBoxBot = 476;
  line(270, markBoxTop, R, markBoxTop, 0.85);
  line(R, markBoxTop, R, markBoxBot, 0.85);
  line(R, markBoxBot, 270, markBoxBot, 0.85);
  line(270, markBoxBot, 270, markBoxTop, 0.85);

  T(275, markBoxTop - 12, 'SHIPPING MARK :', 9.5);
  const markFallback = [
    `${input.siUser || 'BRIDGESTONE INDONESIA'}`,
    `CO NUMBER : ${poNo}`,
    `FLIGHT TC50/BR150L`,
    'MADE IN THAILAND'
  ].join('\n');
  const markLines = (input.siShippingMark || markFallback).split('\n');
  markLines
    .slice(0, 5)
    .forEach((ml, i) => TC2(275, markBoxTop - 26 - i * 13, ml, R - 281, 9));

  // Courier address inside mark box (below shipping mark lines)
  if (input.siCourierAddress) {
    const courierSplit = [markBoxTop - 26 - 5 * 13 - 6]; // starts below 5 mark lines
    line(270, courierSplit[0] + 4, R, courierSplit[0] + 4, 0.5);
    T(275, courierSplit[0] - 4, '*Courier address', 8);
    const courierLines = input.siCourierAddress.split('\n');
    courierLines
      .slice(0, 4)
      .forEach((cl, i) =>
        TC2(275, courierSplit[0] - 18 - i * 11, cl, R - 281, 8)
      );
  }

  // ── VESSEL (single) / FORWARDER / ETD / ETA (left) ───────────────────
  T(L, 627, 'VESSEL :', 9.5);
  TC2(LV, 627, input.siFeederVessel || '-', 112, 9.5);

  T(L, 601, 'VESSEL COMPANY :', 9.5);
  TC2(LV, 601, input.siVesselCompany || '-', 112, 9.5);

  T(L, 575, 'FORWARDER :', 9.5);
  TC2(LV, 575, input.siForwarder || '-', 112, 9.5);

  T(L, 561, 'ETD :', 9.5);
  TC2(LV, 561, etd, 132, 9.5);

  T(L, 547, 'ETA :', 9.5);
  TC2(LV, 547, toPdfDate(input.requestETD), 132, 9.5);

  line(L, 472, R, 472, 1);

  // ── PORT / DESTINATION ────────────────────────────────────────────────
  TC2(L, 460, 'PORT :', 40, 9.5);
  TC2(LV, 460, input.siPortOfLoading || 'LAEM CHABANG, THAILAND', 130, 9.5);
  TC2(L, 446, 'DESTINATION :', 86, 9.5);
  TC2(LV, 446, destination, 130, 9.5);

  line(L, 436, R, 436, 1);

  // ── BOOKING NO. ──────────────────────────────────────────────────────
  T(L, 424, 'BOOKING NO. :', 9.5);
  TC2(LV, 424, input.siBookingNo || '-', R - LV, 9.5);

  line(L, 414, R, 414, 0.75);

  // ── CONSIGNEE ─────────────────────────────────────────────────────────
  T(L, 402, 'CONSIGNEE :', 9.5);
  const siConsLines = (
    input.siConsignee ||
    'PT. BRIDGESTONE TIRE INDONESIA\nKawasan Industri Surya Cipta Jl. Surya Utama Kav 8-13,\nKutamekar, Ciampel, Kab. Karawang, Jawa Barat, 41363'
  ).split('\n');
  siConsLines
    .slice(0, 5)
    .forEach((ln, i) => TC2(LV, 402 - i * 13, ln, R - LV, 9.5));

  // NPWP / Tax ID (stored in siEoriNo)
  if (input.siEoriNo) {
    T(L, 337, 'NPWP No. :', 9.5);
    TC2(LV, 337, input.siEoriNo, R - LV, 9.5);
  }

  line(L, 327, R, 327, 0.75);

  // ── NOTIFY PARTY ─────────────────────────────────────────────────────
  T(L, 315, 'NOTIFY PARTY :', 9.5);
  TC2(LV, 315, input.siNotifyParty || 'SAME AS CONSIGNEE', R - LV, 9.5);

  line(L, 303, R, 303, 0.85);

  // ── REQUIREMENTS ─────────────────────────────────────────────────────
  T(L, 291, 'REQUIREMENTS :', 9.5);
  const reqLinesID = (
    input.siRequirements || '* Surrendered B/L (MASTER BL)'
  ).split('\n');
  reqLinesID
    .slice(0, 6)
    .forEach((ln, i) => TC2(LV, 291 - i * 13, ln, R - LV, 9));
  const reqBotID = 291 - (Math.min(reqLinesID.length, 6) - 1) * 13 - 14;
  line(L, reqBotID, R, reqBotID, 0.85);

  // ── NOTES ─────────────────────────────────────────────────────────────
  const noteTopID = reqBotID - 12;
  const noteLinesID = [input.siNote, input.siNote2, input.siNote3].filter(
    Boolean
  ) as string[];
  if (noteLinesID.length === 0)
    noteLinesID.push(
      '*Please send all docs. PDF copy by e-mail to UBE Elastomer Co. Ltd.'
    );
  noteLinesID
    .slice(0, 3)
    .forEach((ln, i) => TC2(L, noteTopID - i * 13, ln, R - L, 8.5));
  const noteBotID = noteTopID - (Math.min(noteLinesID.length, 3) - 1) * 13 - 14;
  line(L, noteBotID, R, noteBotID, 1);

  // ── GRADE TABLE ───────────────────────────────────────────────────────
  const ghY = noteBotID - 11;
  T(L + 4, ghY, 'GRADE', 9.5);
  T(178, ghY, 'QUANTITY (MT)', 9.5);
  T(320, ghY, 'DESCRIPTION', 9.5);
  line(L, ghY - 7, R, ghY - 7, 0.85);

  const gdY = ghY - 19;
  TC2(L + 4, gdY, gradeName, 128, 9.5);
  T(178, gdY, `${formatNumber(input.qty)} MT`, 9.5);
  TC2(320, gdY, input.siDescription || gradeName, R - 320, 9.5);

  if (input.siUnderDescription) {
    TC2(L + 4, gdY - 14, input.siUnderDescription, R - L, 9);
  }

  const geY = gdY - (input.siUnderDescription ? 28 : 14);
  line(L, geY, R, geY, 1);

  // ── SIGNATURE ─────────────────────────────────────────────────────────
  const slY = geY - 18;
  line(L, slY, 170, slY, 0.75);
  T(L, slY - 12, input.siBelowSignature || 'UBE Elastomer Co. Ltd.', 9.5);

  return content;
};

// ── Bridgestone Brasil SI (2-col PORT/CONSIGNEE | NOTIFY, courier in mark) ───
const buildBridgestoneBrasilSI = (input: PoPdfInput): string[] => {
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

  // ── LETTERHEAD ───────────────────────────────────────────────────────
  T(L, 817, 'UBE Elastomer Co. Ltd.', 9);
  T(L, 806, 'Seavans North Bldg., 1-2-1, Shibaura, Minato-ku,', 9);
  T(L, 795, 'Tokyo 105-6791, Japan', 9);
  T(480, 813, 'UBE', 26);

  // ── TITLE ────────────────────────────────────────────────────────────
  T(R - 57, 783, toPdfDate(input.orderDate), 9);
  T(178, 771, 'SHIPPING INSTRUCTION', 15);
  line(L, 762, R, 762, 1);

  // ── ATTN / FROM block (Brasil includes FAX on left) ──────────────────
  const LV = 130;
  T(L, 750, 'ATTN :', 9.5);
  TC2(78, 750, input.siAttn || 'MR.T. Fujioka/SEVP', 183, 9.5);
  T(270, 750, 'From :', 9.5);
  TC2(312, 750, input.siFrom || 'KAWAMORI/UEDA', 241, 9.5);

  TC2(L, 737, 'THAI SYNTHETIC RUBBERS CO., LTD.', 225, 9.5);
  TC2(270, 737, 'UBE Elastomer Co. Ltd.', 283, 9.5);

  T(L, 724, 'FAX :66-2-685-3056', 9);
  T(270, 724, 'TEL : 81-3-5419-6167', 9);
  T(270, 712, 'FAX : 81-3-5419-6250', 9);

  line(L, 702, R, 702, 1);

  // ── CONTRACT / USER / COUNTRY / SHIPPER (left) + SHIPPING MARK (right)
  const LVR = 372;

  T(L, 690, 'CONTRACT NO. :', 9.5);
  TC2(LV, 690, `${poNo}`, 130, 9.5);
  if (input.siPoNumberHeader) {
    T(270, 690, `${input.siPoNumberHeader}`, 9.5);
    TC2(LVR, 690, poNo, R - LVR, 9.5);
  }

  T(L, 676, 'USER :', 9.5);
  TC2(LV, 676, input.siUser || '-', 225, 9.5);

  T(L, 662, 'COUNTRY :', 9.5);
  TC2(LV, 662, input.siCountry || '-', 225, 9.5);

  T(L, 648, 'SHIPPER :', 9.5);
  TC2(LV, 648, input.siShipper || 'TSL', 225, 9.5);

  line(L, 638, R, 638, 1);

  // ── SHIPPING MARK + COURIER box (right column) ───────────────────────
  const markBoxTop = 688;
  const markBoxBot = 476;
  line(270, markBoxTop, R, markBoxTop, 0.85);
  line(R, markBoxTop, R, markBoxBot, 0.85);
  line(R, markBoxBot, 270, markBoxBot, 0.85);
  line(270, markBoxBot, 270, markBoxTop, 0.85);

  T(275, markBoxTop - 12, 'SHIPPING MARK :', 9.5);
  const markFallback = [
    `${input.siUser || 'BRIDGESTONE DO BRASIL IND. COM.'}`,
    `SAO PAULO - BRAZIL`,
    `SHIP:SANTOS`,
    `ORDER NO.:${poNo}`,
    `${gradeName.split(' ')[0] || 'EC050'}`,
    'MADE IN THAILAND'
  ].join('\n');
  const markLines = (input.siShippingMark || markFallback).split('\n');
  markLines
    .slice(0, 6)
    .forEach((ml, i) => TC2(275, markBoxTop - 26 - i * 13, ml, R - 281, 8.5));

  // Courier address inside mark box (below standard mark lines)
  if (input.siCourierAddress) {
    const courierStartY = markBoxTop - 26 - 6 * 13 - 8;
    line(270, courierStartY + 4, R, courierStartY + 4, 0.5);
    T(275, courierStartY - 4, 'COURIER ADDRESS :', 8);
    const courierLines = input.siCourierAddress.split('\n');
    courierLines
      .slice(0, 5)
      .forEach((cl, i) =>
        TC2(275, courierStartY - 18 - i * 11, cl, R - 281, 7.5)
      );
  }

  // ── VESSEL / FORWARDER / ETD / ETA (left) ────────────────────────────
  const wrapTC = (
    x: number,
    y: number,
    text: string,
    maxW: number,
    size: number
  ) => {
    if (tw(text, size) <= maxW) {
      T(x, y, text, size);
      return;
    }
    const words = text.split(' ');
    let l1 = '';
    for (const w of words) {
      const trial = (l1 ? l1 + ' ' : '') + w;
      if (tw(trial, size) <= maxW) l1 = trial;
      else break;
    }
    T(x, y, l1, size);
    TC2(x, y - 13, text.slice(l1.length).trim(), maxW, size);
  };

  T(L, 627, 'FEEDER VESSEL :', 9.5);
  wrapTC(LV, 627, input.siFeederVessel || '-', 112, 9.5);

  T(L, 601, 'MOTHER VESSEL :', 9.5);
  wrapTC(LV, 601, input.siMotherVessel || '-', 112, 9.5);

  T(L, 575, 'VESSEL COMPANY :', 9.5);
  wrapTC(LV, 575, input.siVesselCompany || '-', 112, 9.5);

  T(L, 549, 'FORWARDER :', 9.5);
  TC2(LV, 549, input.siForwarder || '-', 112, 9.5);

  T(L, 535, 'ETD :', 9.5);
  TC2(LV, 535, etd, 132, 9.5);

  T(L, 521, 'ETA :', 9.5);
  TC2(LV, 521, toPdfDate(input.requestETD), 132, 9.5);

  line(L, 472, R, 472, 1);

  // ── 2-COLUMN: PORT/CONSIGNEE (left) | NOTIFY PARTY (right) ──────────
  // Left col: L → 270, Right col: 275 → R
  const MC = 275;
  line(MC - 4, 472, MC - 4, 280, 0.7);

  // PORT / DESTINATION on left
  T(L, 460, 'PORT :', 9.5);
  TC2(LV, 460, input.siPortOfLoading || 'SANTOS, BRAZIL', 130, 9.5);
  T(L, 446, 'DESTINATION :', 9.5);
  TC2(LV, 446, destination, 130, 9.5);

  // NOTIFY PARTY on right (starts at same Y as PORT)
  T(MC, 460, 'NOTIFY PARTY :', 9.5);
  const notifyLines = (input.siNotifyParty || 'SAME AS CONSIGNEE').split('\n');
  notifyLines
    .slice(0, 8)
    .forEach((ln, i) => TC2(MC, 447 - i * 12, ln, R - MC - 2, 8.5));

  // CONSIGNEE on left (below PORT/DESTINATION)
  T(L, 428, 'CONSIGNEE :', 9.5);
  const siConsLines = (
    input.siConsignee ||
    'BRIDGESTONE DO BRASIL INDUSTRIA E COMERCIO LTDA.\nAV.QUEIROS DOS SANTOS 1717\nSANTO ANDRE-09015-901-SAO PAULO-BRAZIL'
  ).split('\n');
  siConsLines
    .slice(0, 8)
    .forEach((ln, i) => TC2(L, 415 - i * 12, ln, MC - 4 - L - 2, 8.5));

  line(L, 280, R, 280, 1);

  // ── REQUIREMENTS (Brasil needs many lines) ────────────────────────────
  T(L, 268, 'REQUIREMENTS :', 9.5);
  // Combine blType + requirements for Brasil
  const allReqs: string[] = [];
  if (input.siBlType) allReqs.push(input.siBlType);
  const reqRaw = (input.siRequirements || '').split('\n').filter(Boolean);
  allReqs.push(...reqRaw);
  allReqs.slice(0, 10).forEach((ln, i) => TC2(LV, 268 - i * 11, ln, R - LV, 8));
  const reqEndY = 268 - (Math.min(allReqs.length, 10) - 1) * 11 - 13;
  line(L, reqEndY, R, reqEndY, 0.85);

  // ── NOTES ─────────────────────────────────────────────────────────────
  const noteTopY = reqEndY - 10;
  const noteLines = [input.siNote, input.siNote2, input.siNote3].filter(
    Boolean
  ) as string[];
  if (noteLines.length === 0)
    noteLines.push('*Please send all original docs to BS BRASIL directly.');
  noteLines
    .slice(0, 3)
    .forEach((ln, i) => TC2(L, noteTopY - i * 11, ln, R - L, 8));
  const noteBotY = noteTopY - (Math.min(noteLines.length, 3) - 1) * 11 - 13;
  line(L, noteBotY, R, noteBotY, 1);

  // ── GRADE TABLE ───────────────────────────────────────────────────────
  const ghY = noteBotY - 11;
  T(L + 4, ghY, 'GRADE', 9.5);
  T(178, ghY, 'QUANTITY (MT)', 9.5);
  T(320, ghY, 'DESCRIPTION', 9.5);
  line(L, ghY - 7, R, ghY - 7, 0.85);

  const gdY = ghY - 19;
  TC2(L + 4, gdY, gradeName, 128, 9.5);
  T(178, gdY, `${formatNumber(input.qty)} MT`, 9.5);
  TC2(320, gdY, input.siDescription || gradeName, R - 320, 9.5);

  if (input.siUnderDescription) {
    TC2(L + 4, gdY - 14, input.siUnderDescription, R - L, 9);
  }

  const geY = gdY - (input.siUnderDescription ? 28 : 14);
  line(L, geY, R, geY, 1);

  // ── SIGNATURE ─────────────────────────────────────────────────────────
  const slY = geY - 18;
  line(L, slY, 170, slY, 0.75);
  T(L, slY - 12, input.siBelowSignature || 'UBE Elastomer Co. Ltd.', 9.5);

  return content;
};

// ── Dispatcher ────────────────────────────────────────────────────────────────
export const createShippingInstructionPdfDataUrl = (
  input: PoPdfInput
): string => {
  let content: string[];
  if (input.shipToId === 'SHIP-COOPER-KUNSHAN') {
    content = buildCooperKunshanSI(input);
  } else if (input.shipToId === 'SHIP-BRIDGESTONE-INDIA') {
    content = buildBridgestoneIndiaSI(input);
  } else if (input.shipToId === 'SHIP-PT-BRIDGESTONE') {
    content = buildBridgestoneIndonesiaSI(input);
  } else if (input.shipToId === 'SHIP-BRIDGESTONE-BRASIL') {
    content = buildBridgestoneBrasilSI(input);
  } else {
    content = buildBridgestoneSI(input); // default
  }
  return buildPdfDataUrl(content);
};
