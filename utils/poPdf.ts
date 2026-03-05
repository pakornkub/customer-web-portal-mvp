type PoPdfInput = {
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
  const fontScale = 0.9;
  const unitPrice = Number(input.price || 1435.2);
  const amount = Number.isFinite(unitPrice * input.qty)
    ? unitPrice * input.qty
    : 57867.26;

  const content: string[] = [];
  const drawText = (x: number, y: number, text: string, size = 11) => {
    const scaledSize = Number((size * fontScale).toFixed(2));
    content.push('BT');
    content.push(`/F1 ${scaledSize} Tf`);
    content.push(`${x} ${y} Td`);
    content.push(`(${escapePdf(text)}) Tj`);
    content.push('ET');
  };

  const drawTextRight = (x: number, y: number, text: string, size = 11) => {
    const scaledSize = size * fontScale;
    const estimatedWidth = text.length * scaledSize * 0.48;
    drawText(x - estimatedWidth, y, text, size);
  };

  const drawTextCenter = (
    x: number,
    y: number,
    text: string,
    width: number,
    size = 11
  ) => {
    const scaledSize = size * fontScale;
    const estimatedWidth = text.length * scaledSize * 0.48;
    drawText(x + (width - estimatedWidth) / 2, y, text, size);
  };

  const clampTextToWidth = (text: string, size: number, maxWidth: number) => {
    const scaledSize = size * fontScale;
    const charWidth = scaledSize * 0.48;
    if (charWidth <= 0) return text;
    const maxChars = Math.floor(maxWidth / charWidth);
    if (maxChars <= 0) return '';
    if (text.length <= maxChars) return text;
    if (maxChars <= 3) return '.'.repeat(maxChars);
    return `${text.slice(0, maxChars - 3)}...`;
  };

  const drawTextClamped = (
    x: number,
    y: number,
    text: string,
    maxWidth: number,
    size = 11
  ) => {
    drawText(x, y, clampTextToWidth(text, size, maxWidth), size);
  };

  const drawTextFitToWidth = (
    x: number,
    y: number,
    text: string,
    maxWidth: number,
    preferredSize = 10.5,
    minSize = 8.5
  ) => {
    let nextSize = preferredSize;
    while (nextSize > minSize) {
      const scaledSize = nextSize * fontScale;
      const estimatedWidth = text.length * scaledSize * 0.48;
      if (estimatedWidth <= maxWidth) break;
      nextSize -= 0.25;
    }

    const finalSize = Number(Math.max(minSize, nextSize).toFixed(2));
    drawTextClamped(x, y, text, maxWidth, finalSize);
  };

  const drawLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width = 0.75
  ) => {
    content.push(`${width} w`);
    content.push(`${x1} ${y1} m ${x2} ${y2} l S`);
  };

  const drawRect = (
    x: number,
    y: number,
    width: number,
    height: number,
    lineWidth = 0.75
  ) => {
    drawLine(x, y, x + width, y, lineWidth);
    drawLine(x + width, y, x + width, y - height, lineWidth);
    drawLine(x + width, y - height, x, y - height, lineWidth);
    drawLine(x, y - height, x, y, lineWidth);
  };

  const drawUnderlinedLabel = (
    x: number,
    y: number,
    text: string,
    size = 11
  ) => {
    const scaledSize = size * fontScale;
    const estimatedWidth = text.length * scaledSize * 0.5;
    drawText(x, y, text, size);
    drawLine(x, y - 2, x + estimatedWidth, y - 2, 0.65);
  };

  drawText(42, 812, 'UBE Elastomer Co.Ltd.', 11);
  drawText(42, 797, 'Seavans North Bldg., 1-2-1, Shibaura, Minato-ku,', 11);
  drawText(42, 782, 'Tokyo 105-6791, Japan', 11);
  drawText(488, 808, 'UBE', 30);

  drawText(42, 700, 'PURCHASE ORDER', 14);
  drawRect(410, 716, 145, 24, 0.9);
  drawTextCenter(410, 700, 'CONFIDENTIAL', 145, 14);

  drawText(292, 676, 'Purchase Order No. :', 10.5);
  drawText(405, 676, input.poNo || input.orderNo, 13);
  drawText(292, 658, 'Date of Order :', 10.5);
  drawText(388, 658, toPdfDate(input.orderDate), 10.5);

  drawLine(40, 648, 555, 648, 1.05);
  drawLine(290, 690, 290, 435, 1.05);

  drawText(42, 632, 'TO:', 10.5);
  drawText(42, 615, 'THAI SYNTHETIC RUBBERS CO., LTD.', 11);
  drawText(42, 600, '18 th Floor, Sathorn Square Office Tower,', 10.5);
  drawText(42, 586, '98 North Sathorn Road,', 10.5);
  drawText(42, 572, 'Silom, Bangrak, Bangkok 10500,', 10.5);
  drawText(42, 558, 'THAILAND', 10.5);
  drawTextFitToWidth(42, 546, 'ATTN.: T.FUJIOKA / SEVP', 242, 10.5, 8.5);

  drawText(292, 632, 'CONSIGNEE', 10.5);
  drawText(300, 615, 'Toyo Tyre Malaysia Sdn Bhd', 11);
  drawText(300, 600, 'PT23101, Jalan Tembaga Kuning', 10.5);
  drawText(300, 586, 'Kawasan Perindustrian Kamunting Raya', 10.5);
  drawText(300, 572, 'PO Box 1, 34600, Kamunting, Perak. Malaysia', 10.5);
  drawTextFitToWidth(
    300,
    559,
    'Contact Person : Ms Lim / Ms Yap',
    248,
    10.5,
    8.5
  );
  drawTextFitToWidth(
    300,
    546,
    'Tel : 605-8206600 Fax : 605-8206659',
    248,
    10.5,
    8.5
  );

  drawLine(40, 545, 555, 545, 1.05);
  drawLine(40, 507, 555, 507, 1.05);

  drawUnderlinedLabel(42, 532, 'DELIVERY DATE : (ETD)', 10.5);
  drawText(75, 516, toPdfDate(input.actualETD || input.requestETD), 12);

  drawUnderlinedLabel(292, 532, 'TERMS OF PAYMENT :', 10.5);
  drawText(300, 516, 'BY  T.T.R 30 DAYS AFTER B/L DATE', 10.5);

  drawLine(40, 470, 555, 470, 1.05);
  drawUnderlinedLabel(42, 494, 'TERMS OF DELIVERY :', 10.5);
  drawTextClamped(
    42,
    478,
    (input.termId || 'CIF PENANG').toUpperCase(),
    240,
    10.5
  );
  drawUnderlinedLabel(292, 494, 'PACKING INSTRUCTIONS :', 10.5);
  drawText(300, 478, 'GPS', 10.5);

  drawLine(40, 435, 555, 435, 1.05);
  drawUnderlinedLabel(42, 458, 'DESTINATION :', 10.5);
  drawTextClamped(
    42,
    442,
    (input.destinationId || 'PENANG,MALAYSIA').toUpperCase(),
    245,
    10.5
  );
  drawText(300, 442, 'PO No.:', 11);
  drawTextClamped(390, 442, input.poNo, 160, 11);

  const tableTop = 405;
  const tableBottom = 330;
  const col1 = 40;
  const col2 = 100;
  const col3 = 240;
  const col4 = 290;
  const col5 = 400;
  const col6 = 555;

  drawRect(col1, tableTop, col6 - col1, tableTop - tableBottom, 1.1);
  drawLine(col2, tableTop, col2, tableBottom, 0.85);
  drawLine(col3, tableTop, col3, tableBottom, 0.85);
  drawLine(col4, tableTop, col4, tableBottom, 1.05);
  drawLine(col5, tableTop, col5, tableBottom, 1.05);
  drawLine(col1, 385, col6, 385, 0.85);
  drawLine(col1, 365, col6, 365, 0.85);
  drawLine(col1, 347, col6, 347, 0.85);

  drawTextCenter(col1, 391, 'PRODUCT', col2 - col1, 11);
  drawTextCenter(col2, 391, 'DESCRIPTION', col3 - col2, 11);
  drawTextCenter(col3, 391, 'QUANTITY', col4 - col3, 11);
  drawTextCenter(col4, 391, 'UNIT PRICE', col5 - col4, 11);
  drawTextCenter(col5, 391, 'AMOUNT', col6 - col5, 11);

  drawText(45, 351, input.gradeId?.substring(0, 2) || 'BR', 12);
  drawTextClamped(102, 351, input.gradeId || 'UBEPOL BR150B', 134, 11);
  drawTextRight(col4 - 6, 351, `$${formatNumber(input.qty)} MT`, 11);
  drawTextRight(
    col5 - 6,
    351,
    `$${formatNumber(unitPrice)} ${(input.currency || 'US$').toUpperCase()}`,
    11
  );
  drawTextRight(
    col6 - 8,
    351,
    `$${formatNumber(amount)} ${(input.currency || 'US$').toUpperCase()}`,
    11
  );

  drawRect(col4, 330, col6 - col4, 28, 1.1);
  drawLine(col5, 330, col5, 302, 1.05);
  drawTextCenter(col4, 311, 'TOTAL', col5 - col4, 12);
  drawTextRight(col6 - 8, 311, formatNumber(amount), 12);

  drawUnderlinedLabel(42, 286, 'PRICE BREAK DOWN', 12);
  const pbTop = 270;
  const pbBottom = 214;
  const pbLeft = 42;
  const pbMid1 = 170;
  const pbMid2 = 290;
  const pbRight = 375;

  drawRect(pbLeft, pbTop, pbRight - pbLeft, pbTop - pbBottom, 1.05);
  drawLine(pbMid1, pbTop, pbMid1, pbBottom, 0.85);
  drawLine(pbMid2, pbTop, pbMid2, pbBottom, 0.85);
  drawLine(pbLeft, 252, pbRight, 252, 0.85);
  drawLine(pbLeft, 234, pbRight, 234, 0.85);

  drawText(44, 257, 'CONTRACT PRICE', 10.5);
  drawText(174, 257, 'CIF base US$ / MT', 10.5);
  drawTextRight(pbRight - 4, 257, formatNumber(unitPrice + 59.8), 10.5);
  drawText(44, 239, 'DISCOUNT', 10.5);
  drawText(174, 239, '4% on CIF VALUE', 10.5);
  drawTextRight(pbRight - 4, 239, '59.80', 10.5);
  drawText(44, 221, '(A) CONTRACT -DISCOUNT', 10.5);
  drawTextRight(pbRight - 4, 221, formatNumber(unitPrice), 10.5);

  drawText(42, 200, 'PLEASE SIGN AND RETURN CONFIRMATION', 11);
  drawText(42, 160, 'Issued by :', 11);
  drawLine(42, 112, 186, 112, 0.85);
  drawText(42, 98, 'UBE Elastomer Co. Ltd.', 11);
  drawLine(300, 112, 445, 112, 0.85);
  drawText(300, 98, 'T.FUJIOKA', 11);
  drawText(300, 82, 'Senior Executive Vice President', 11);
  drawText(300, 66, 'Thai Synthetic Rubbers Co., Ltd.', 11);

  return buildPdfDataUrl(content);
};

export const createShippingInstructionPdfDataUrl = (input: PoPdfInput) => {
  const fontScale = 0.9;
  const content: string[] = [];

  const drawText = (x: number, y: number, text: string, size = 11) => {
    const scaledSize = Number((size * fontScale).toFixed(2));
    content.push('BT');
    content.push(`/F1 ${scaledSize} Tf`);
    content.push(`${x} ${y} Td`);
    content.push(`(${escapePdf(text)}) Tj`);
    content.push('ET');
  };

  const drawLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width = 0.75
  ) => {
    content.push(`${width} w`);
    content.push(`${x1} ${y1} m ${x2} ${y2} l S`);
  };

  const drawRect = (
    x: number,
    y: number,
    width: number,
    height: number,
    lineWidth = 0.75
  ) => {
    drawLine(x, y, x + width, y, lineWidth);
    drawLine(x + width, y, x + width, y - height, lineWidth);
    drawLine(x + width, y - height, x, y - height, lineWidth);
    drawLine(x, y - height, x, y, lineWidth);
  };

  const drawTextClamped = (
    x: number,
    y: number,
    text: string,
    maxWidth: number,
    size = 11
  ) => {
    const scaledSize = size * fontScale;
    const charWidth = scaledSize * 0.48;
    if (charWidth <= 0) {
      drawText(x, y, text, size);
      return;
    }

    const maxChars = Math.max(0, Math.floor(maxWidth / charWidth));
    if (maxChars <= 0) return;
    if (text.length <= maxChars) {
      drawText(x, y, text, size);
      return;
    }
    if (maxChars <= 3) {
      drawText(x, y, '.'.repeat(maxChars), size);
      return;
    }

    drawText(x, y, `${text.slice(0, maxChars - 3)}...`, size);
  };

  const gradeName = (input.gradeId || '-').toUpperCase();
  const destination = (input.destinationId || '-').toUpperCase();
  const poNo = input.poNo || input.orderNo;
  const etd = toPdfDate(input.actualETD || input.requestETD);

  drawText(42, 812, 'UBE Elastomer Co.Ltd.', 10.5);
  drawText(42, 798, 'Seavans North Bldg., 1-2-1, Shibaura, Minato-ku,', 10.5);
  drawText(42, 784, 'Tokyo 105-6791, Japan', 10.5);
  drawText(474, 806, 'UBE', 29);

  drawText(204, 745, 'SHIPPING INSTRUCTION', 16);
  drawText(498, 745, toPdfDate(input.orderDate), 9.5);

  drawText(42, 714, 'ATTN:', 10);
  drawText(84, 714, 'T.FUJIOKA / SEVP', 10);
  drawText(42, 700, 'THAI SYNTHETIC RUBBERS CO., LTD.', 10);

  drawText(260, 714, 'From:', 10);
  drawText(306, 714, 'M.KAWAMORI / H.UEDA', 10);
  drawText(306, 700, 'UBE Elastomer Co. Ltd.', 10);
  drawText(306, 686, 'TEL:81-3-5419-6167', 10);
  drawText(306, 672, 'FAX:81-3-5419-6250', 10);

  drawText(44, 639, 'CONTRACT NO.:', 10);
  drawTextClamped(130, 639, `${poNo}-5`, 152, 10);
  drawText(44, 624, 'USER:', 10);
  drawTextClamped(130, 624, 'TOYO TYRE MALAYSIA', 152, 10);
  drawText(44, 609, 'COUNTRY:', 10);
  drawTextClamped(130, 609, 'Malaysia', 152, 10);
  drawText(44, 594, 'SHIPPER:', 10);
  drawTextClamped(130, 594, 'TSL WITH FULL ADDRESS', 152, 10);

  drawText(44, 557, 'FEEDER VESSEL :', 10);
  drawTextClamped(128, 557, 'INTERASIA MOTIVATION V.W026', 112, 9.5);
  drawText(44, 542, 'MOTHER VESSEL : -', 10);
  drawText(44, 527, 'VESSEL COMPANY :', 10);
  drawTextClamped(128, 527, 'INTER ASIA', 112, 10);
  drawText(44, 512, 'FORWARDER :', 10);
  drawTextClamped(128, 512, 'LEO', 112, 10);
  drawText(44, 497, 'ETD:', 10);
  drawText(84, 497, etd, 10);
  drawText(44, 482, 'ETA:', 10);
  drawText(84, 482, etd, 10);

  drawText(299, 557, 'SHIPPING MARK', 10.5);
  drawTextClamped(299, 537, 'TOYO TYRE MALAYSIA PLANT', 296, 10);
  drawTextClamped(
    299,
    522,
    `MAR${toPdfDate(input.orderDate).replace(/-/g, '')}`,
    296,
    10
  );
  drawTextClamped(299, 507, `ORDER No.: ${poNo}-5`, 296, 10);
  drawTextClamped(299, 492, gradeName, 296, 10);
  drawTextClamped(299, 477, `V.NO. ${poNo}`, 296, 10);
  drawTextClamped(299, 462, 'MADE IN THAILAND', 296, 10);

  drawTextClamped(42, 448, `PORT of LOADING : LAEM CHABANG, THAILAND`, 510, 10);
  drawTextClamped(42, 434, `PORT OF DESTINATION : ${destination}`, 510, 10);
  drawText(42, 420, 'CONSIGNEE and notify', 10);
  drawTextClamped(42, 406, 'Toyo Tyre Malaysia Sdn Bhd', 510, 10);
  drawTextClamped(42, 392, 'PT23101, Jalan Tembaga Kuning', 510, 10);
  drawTextClamped(42, 378, 'Kawasan Perindustrian Kamunting Raya', 510, 10);
  drawTextClamped(
    42,
    364,
    'PO Box 1, 34600, Kamunting, Perak, Malaysia',
    510,
    10
  );
  drawTextClamped(42, 350, 'Contact Person : Ms Lim / Ms Yap', 510, 10);
  drawTextClamped(42, 336, 'Tel : 605-8206600 Fax : 605-8206659', 510, 10);

  drawText(42, 316, 'B/L', 10);
  drawText(150, 316, 'SURRENDERED B/L', 10);
  drawText(42, 302, 'FREE TIME', 10);
  drawText(150, 302, 'D/M:14DAYS    D/T 14DAYS', 10);
  drawText(42, 288, 'REQUIREMENTS:', 10);
  drawTextClamped(260, 302, '* Please apply 14 days Free Time', 292, 10);

  drawText(42, 268, '*CERTIFICATE OF ANALYSIS', 9.5);
  drawText(42, 254, '*PACKING LIST', 9.5);
  drawTextClamped(
    42,
    240,
    '*Please describe MAR information on all delivery documents. (BL,PL,COA)',
    510,
    8.8
  );

  drawLine(40, 214, 555, 214, 0.85);
  drawText(42, 200, 'GRADE', 10);
  drawText(170, 200, 'QUANTITY(MT)', 10);
  drawText(300, 200, 'DESCRIPTION', 10);
  drawLine(40, 195, 555, 195, 0.85);
  drawTextClamped(42, 180, gradeName, 120, 10);
  drawText(190, 180, `${formatNumber(input.qty)} MT`, 10);
  drawTextClamped(300, 180, gradeName, 250, 10);

  drawText(42, 152, '', 12);
  drawLine(42, 146, 170, 146, 0.8);
  drawText(42, 132, 'UBE Elastomer Co. Ltd.', 10);

  return buildPdfDataUrl(content);
};
