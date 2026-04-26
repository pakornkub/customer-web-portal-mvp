import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const storePath = path.join(repoRoot, 'store.ts');
const outputPath = path.join(
  repoRoot,
  'docs-for-nextjs',
  'database',
  'MASTER-DATA-SEED.json'
);

const documentTypeMap = {
  SHIPPING_DOC: 'Shipping Document',
  BL: 'BL',
  INVOICE: 'Invoice',
  COA: 'COA',
  PO_PDF: 'PO_PDF',
  SHIPPING_INSTRUCTION_PDF: 'SHIPPING_INSTRUCTION_PDF'
};

const source = fs.readFileSync(storePath, 'utf8');

function createScanState() {
  return {
    depth: 0,
    inSingle: false,
    inDouble: false,
    inTemplate: false,
    inLineComment: false,
    inBlockComment: false,
    escaped: false
  };
}

function isInsideQuotedSegment(state) {
  return state.inSingle || state.inDouble || state.inTemplate;
}

function createScanResult(handled, indexDelta = 0) {
  return { handled, indexDelta };
}

function handleCommentState(state, char, nextChar) {
  if (state.inLineComment) {
    if (char === '\n') state.inLineComment = false;
    return createScanResult(true);
  }

  if (state.inBlockComment) {
    if (char === '*' && nextChar === '/') {
      state.inBlockComment = false;
      return createScanResult(true, 1);
    }
    return createScanResult(true);
  }

  return createScanResult(false);
}

function handleQuotedState(state, char) {
  if (!isInsideQuotedSegment(state)) return createScanResult(false);

  if (state.escaped) {
    state.escaped = false;
    return createScanResult(true);
  }

  if (char === '\\') {
    state.escaped = true;
    return createScanResult(true);
  }

  if (state.inSingle && char === "'") state.inSingle = false;
  if (state.inDouble && char === '"') state.inDouble = false;
  if (state.inTemplate && char === '`') state.inTemplate = false;
  return createScanResult(true);
}

function tryEnterCommentState(state, char, nextChar) {
  if (char === '/' && nextChar === '/') {
    state.inLineComment = true;
    return createScanResult(true, 1);
  }

  if (char === '/' && nextChar === '*') {
    state.inBlockComment = true;
    return createScanResult(true, 1);
  }

  return createScanResult(false);
}

function tryEnterQuotedState(state, char) {
  if (char === "'") {
    state.inSingle = true;
    return true;
  }

  if (char === '"') {
    state.inDouble = true;
    return true;
  }

  if (char === '`') {
    state.inTemplate = true;
    return true;
  }

  return false;
}

function consumeScannerState(state, char, nextChar) {
  const commentStateResult = handleCommentState(state, char, nextChar);
  if (commentStateResult.handled) return commentStateResult;

  const quotedStateResult = handleQuotedState(state, char);
  if (quotedStateResult.handled) return quotedStateResult;

  const enteredComment = tryEnterCommentState(state, char, nextChar);
  if (enteredComment.handled) return enteredComment;

  if (tryEnterQuotedState(state, char)) return createScanResult(true);

  return createScanResult(false);
}

function updateDepthAndCheckMatch(state, char, openChar, closeChar) {
  if (char === openChar) {
    state.depth += 1;
    return false;
  }

  if (char !== closeChar) return false;

  state.depth -= 1;
  return state.depth === 0;
}

function findMatchingIndex(text, startIndex, openChar, closeChar) {
  const state = createScanState();

  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    const scanResult = consumeScannerState(state, char, nextChar);
    if (scanResult.handled) {
      index += scanResult.indexDelta;
      continue;
    }

    if (updateDepthAndCheckMatch(state, char, openChar, closeChar))
      return index;
  }

  throw new Error(
    `Could not find matching ${closeChar} for index ${startIndex}`
  );
}

function findArrayLiteralAfter(marker, anchorToken) {
  const markerStart = source.indexOf(marker);
  if (markerStart === -1) throw new Error(`Missing marker: ${marker}`);
  const anchorStart = source.indexOf(anchorToken, markerStart);
  if (anchorStart === -1)
    throw new Error(`Missing token ${anchorToken} for ${marker}`);
  const arrayStart = source.indexOf('[', anchorStart + anchorToken.length);
  if (arrayStart === -1) throw new Error(`Missing array literal for ${marker}`);
  return arrayStart;
}

function extractConstArray(name) {
  const marker = `const ${name}`;
  const arrayStart = findArrayLiteralAfter(marker, '=');
  const arrayEnd = findMatchingIndex(source, arrayStart, '[', ']');
  return source.slice(arrayStart, arrayEnd + 1);
}

function extractMasterArray(propertyName) {
  const masterStart = source.indexOf('const INITIAL_MASTER');
  if (masterStart === -1) throw new Error('Missing INITIAL_MASTER');
  const objectStart = source.indexOf('{', masterStart);
  const objectEnd = findMatchingIndex(source, objectStart, '{', '}');
  const masterBlock = source.slice(objectStart, objectEnd + 1);
  const marker = `${propertyName}:`;
  const propertyStart = masterBlock.indexOf(marker);
  if (propertyStart === -1)
    throw new Error(`Missing INITIAL_MASTER.${propertyName}`);
  const arrayStart = masterBlock.indexOf('[', propertyStart);
  const absoluteArrayStart = objectStart + arrayStart;
  const arrayEnd = findMatchingIndex(source, absoluteArrayStart, '[', ']');
  return source.slice(absoluteArrayStart, arrayEnd + 1);
}

function extractMatrix(functionName) {
  const marker = `export const ${functionName}`;
  const arrayStart = findArrayLiteralAfter(marker, '=>');
  const arrayEnd = findMatchingIndex(source, arrayStart, '[', ']');
  return source.slice(arrayStart, arrayEnd + 1);
}

function normalizeExpression(expression) {
  return expression
    .replaceAll(/\/\*[\s\S]*?\*\//g, '')
    .replaceAll(/(^|\s)\/\/.*$/gm, '')
    .replaceAll(/\bUBE_JAPAN_COMPANY_ID\b/g, "'AG-UBE-JP'")
    .replaceAll(/\bGroupSaleType\.([A-Z_]+)\b/g, "'$1'")
    .replaceAll(/\bUserGroup\.([A-Z_]+)\b/g, "'$1'")
    .replaceAll(/\bLineAction\.([A-Z_]+)\b/g, "'$1'")
    .replaceAll(/\bOrderLineStatus\.([A-Z_]+)\b/g, "'$1'")
    .replaceAll(
      /\bDocumentType\.([A-Z_]+)\b/g,
      (_, value) => `"${documentTypeMap[value] ?? value}"`
    )
    .trim();
}

function evaluateExpression(expression) {
  const normalized = normalizeExpression(expression);
  return vm.runInNewContext(`(${normalized})`, {});
}

const payload = {
  metadata: {
    generatedAt: new Date().toISOString(),
    sourceFile: 'store.ts',
    description:
      'Machine-readable export of current MVP master/reference seed data and workflow permission presets.'
  },
  companies: evaluateExpression(extractConstArray('INITIAL_COMPANIES')),
  masterData: {
    groupSaleTypes: evaluateExpression(extractMasterArray('groupSaleTypes')),
    destinations: evaluateExpression(extractMasterArray('destinations')),
    terms: evaluateExpression(extractMasterArray('terms')),
    grades: evaluateExpression(extractMasterArray('grades')),
    shipTos: evaluateExpression(extractConstArray('INITIAL_SHIP_TO_MAPPINGS')),
    poTemplates: evaluateExpression(extractMasterArray('poTemplates')),
    siTemplates: evaluateExpression(extractMasterArray('siTemplates'))
  },
  linePermissionPresets: {
    standard: evaluateExpression(
      extractMatrix('createStandardLinePermissionMatrix')
    ),
    strict: evaluateExpression(
      extractMatrix('createStrictLinePermissionMatrix')
    )
  }
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
