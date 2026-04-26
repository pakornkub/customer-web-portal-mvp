import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const seedPath = path.join(
  repoRoot,
  'docs-for-nextjs',
  'database',
  'MASTER-DATA-SEED.json'
);
const outputPath = path.join(
  repoRoot,
  'docs-for-nextjs',
  'database',
  'seed.sqlserver.sql'
);

const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
const systemPresetIds = {
  STANDARD: '11111111-1111-1111-1111-111111111111',
  STRICT: '22222222-2222-2222-2222-222222222222'
};

function raw(sql) {
  return { type: 'raw', sql };
}

function sqlString(value) {
  if (value === null || value === undefined) return 'NULL';
  return `N'${String(value).replaceAll("'", "''")}'`;
}

function sqlDateTime(value) {
  if (!value) return 'NULL';
  return sqlString(value.replace('T', ' ').replace('Z', ''));
}

function renderValue(value) {
  if (value?.type === 'raw') return value.sql;
  return sqlString(value);
}

function deterministicUuid(namespace, value) {
  const hash = crypto
    .createHash('sha1')
    .update(`${namespace}:${value}`)
    .digest('hex')
    .slice(0, 32);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(
    12,
    16
  )}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

function appendHeading(lines, title) {
  lines.push('', `-- ${title}`);
}

function appendLines(lines, ...entries) {
  lines.push(...entries);
}

function pushMerge(lines, config) {
  const { tableName, columns, keyColumns, updateColumns, rows } = config;
  if (rows.length === 0) return;

  appendLines(lines, `MERGE dbo.${tableName} AS target`, 'USING (VALUES');

  rows.forEach((row, index) => {
    const values = columns.map((column) => renderValue(row[column]));
    const suffix = index === rows.length - 1 ? '' : ',';
    lines.push(`  (${values.join(', ')})${suffix}`);
  });

  appendLines(
    lines,
    `) AS source (${columns.join(', ')})`,
    `ON ${keyColumns
      .map((column) => `target.${column} = source.${column}`)
      .join(' AND ')}`
  );

  if (updateColumns.length > 0) {
    appendLines(
      lines,
      'WHEN MATCHED THEN UPDATE SET',
      updateColumns
        .map(
          (column, index) =>
            `  target.${column} = source.${column}${
              index === updateColumns.length - 1 ? '' : ','
            }`
        )
        .join('\n')
    );
  }

  const sourceColumns = columns.map((column) => `source.${column}`).join(', ');
  appendLines(
    lines,
    'WHEN NOT MATCHED BY TARGET THEN',
    `  INSERT (${columns.join(', ')})`,
    `  VALUES (${sourceColumns});`,
    ''
  );
}

const lines = [
  'SET NOCOUNT ON;',
  'SET XACT_ABORT ON;',
  'GO',
  '',
  '/*',
  '  SQL Server seed reference generated from docs-for-nextjs/database/MASTER-DATA-SEED.json.',
  '  Regenerate with: node ./scripts/export_sqlserver_seed.mjs',
  '  Covers master data, PO/SI templates, and workflow permission defaults/presets.',
  '*/',
  '',
  'BEGIN TRANSACTION;'
];

appendHeading(lines, 'Customer companies');
pushMerge(lines, {
  tableName: 'CustomerCompany',
  columns: ['CompanyCode', 'CompanyName', 'CreatedAt', 'UpdatedAt'],
  keyColumns: ['CompanyCode'],
  updateColumns: ['CompanyName', 'UpdatedAt'],
  rows: seed.companies.map((company) => ({
    CompanyCode: company.id,
    CompanyName: company.name,
    CreatedAt: raw('SYSUTCDATETIME()'),
    UpdatedAt: raw('SYSUTCDATETIME()')
  }))
});

appendHeading(lines, 'Group sale types');
pushMerge(lines, {
  tableName: 'GroupSaleType',
  columns: ['GroupSaleTypeCode', 'GroupSaleTypeName'],
  keyColumns: ['GroupSaleTypeCode'],
  updateColumns: ['GroupSaleTypeName'],
  rows: seed.masterData.groupSaleTypes.map((item) => ({
    GroupSaleTypeCode: item.id,
    GroupSaleTypeName: item.name
  }))
});

appendHeading(lines, 'Destinations');
pushMerge(lines, {
  tableName: 'Destination',
  columns: ['DestinationCode', 'DestinationName', 'CreatedAt', 'UpdatedAt'],
  keyColumns: ['DestinationCode'],
  updateColumns: ['DestinationName', 'UpdatedAt'],
  rows: seed.masterData.destinations.map((item) => ({
    DestinationCode: item.id,
    DestinationName: item.name,
    CreatedAt: raw('SYSUTCDATETIME()'),
    UpdatedAt: raw('SYSUTCDATETIME()')
  }))
});

appendHeading(lines, 'Shipping terms');
pushMerge(lines, {
  tableName: 'ShippingTerm',
  columns: ['TermCode', 'TermName', 'CreatedAt', 'UpdatedAt'],
  keyColumns: ['TermCode'],
  updateColumns: ['TermName', 'UpdatedAt'],
  rows: seed.masterData.terms.map((item) => ({
    TermCode: item.id,
    TermName: item.name,
    CreatedAt: raw('SYSUTCDATETIME()'),
    UpdatedAt: raw('SYSUTCDATETIME()')
  }))
});

appendHeading(lines, 'Product grades');
pushMerge(lines, {
  tableName: 'ProductGrade',
  columns: ['GradeCode', 'GradeName', 'CreatedAt', 'UpdatedAt'],
  keyColumns: ['GradeCode'],
  updateColumns: ['GradeName', 'UpdatedAt'],
  rows: seed.masterData.grades.map((item) => ({
    GradeCode: item.id,
    GradeName: item.name,
    CreatedAt: raw('SYSUTCDATETIME()'),
    UpdatedAt: raw('SYSUTCDATETIME()')
  }))
});

appendHeading(lines, 'Ship-to records');
pushMerge(lines, {
  tableName: 'ShipTo',
  columns: [
    'ShipToCode',
    'ShipToName',
    'GroupSaleTypeCode',
    'CreatedAt',
    'UpdatedAt'
  ],
  keyColumns: ['ShipToCode'],
  updateColumns: ['ShipToName', 'GroupSaleTypeCode', 'UpdatedAt'],
  rows: seed.masterData.shipTos.map((item) => ({
    ShipToCode: item.id,
    ShipToName: item.name,
    GroupSaleTypeCode: item.groupSaleType,
    CreatedAt: raw('SYSUTCDATETIME()'),
    UpdatedAt: raw('SYSUTCDATETIME()')
  }))
});

appendHeading(lines, 'Ship-to destination mappings');
pushMerge(lines, {
  tableName: 'ShipToDestinationMap',
  columns: ['ShipToCode', 'DestinationCode'],
  keyColumns: ['ShipToCode', 'DestinationCode'],
  updateColumns: [],
  rows: seed.masterData.shipTos.flatMap((item) =>
    item.destinationIds.map((destinationId) => ({
      ShipToCode: item.id,
      DestinationCode: destinationId
    }))
  )
});

appendHeading(lines, 'PO templates');
pushMerge(lines, {
  tableName: 'PoTemplate',
  columns: [
    'PoTemplateId',
    'ShipToCode',
    'ToBlock',
    'ConsigneeNotify',
    'Agent',
    'EndUser',
    'TermsOfPayment',
    'PackingInstructions',
    'ConfirmBy',
    'CreatedAt',
    'UpdatedAt'
  ],
  keyColumns: ['ShipToCode'],
  updateColumns: [
    'ToBlock',
    'ConsigneeNotify',
    'Agent',
    'EndUser',
    'TermsOfPayment',
    'PackingInstructions',
    'ConfirmBy',
    'UpdatedAt'
  ],
  rows: seed.masterData.poTemplates.map((item) => ({
    PoTemplateId: raw(
      `CONVERT(uniqueidentifier, '${deterministicUuid('PoTemplate', item.id)}')`
    ),
    ShipToCode: item.shipToId,
    ToBlock: item.toBlock,
    ConsigneeNotify: item.consigneeNotify,
    Agent: item.agent,
    EndUser: item.endUser,
    TermsOfPayment: item.termsOfPayment,
    PackingInstructions: item.packingInstructions,
    ConfirmBy: item.confirmBy,
    CreatedAt: sqlDateTime(item.createdAt),
    UpdatedAt: sqlDateTime(item.updatedAt)
  }))
});

appendHeading(lines, 'SI templates');
pushMerge(lines, {
  tableName: 'SiTemplate',
  columns: [
    'SiTemplateId',
    'ShipToCode',
    'Attn',
    'FromBlock',
    'PoNumberHeader',
    'No2Header',
    'No2',
    'MaterialCodeHeader',
    'MaterialCode',
    'NoteUnderMaterial',
    'UserText',
    'Country',
    'Shipper',
    'FeederVessel',
    'MotherVessel',
    'VesselCompany',
    'Forwarder',
    'PortOfLoading',
    'Consignee',
    'BlType',
    'FreeTime',
    'CourierAddress',
    'EoriNo',
    'BookingNo',
    'NotifyParty',
    'AlsoNotify1',
    'AlsoNotify2',
    'DeliverTo',
    'Requirements',
    'Note',
    'Note2',
    'Note3',
    'Description',
    'UnderDescription',
    'ShippingMark',
    'BelowSignature',
    'CreatedAt',
    'UpdatedAt'
  ],
  keyColumns: ['ShipToCode'],
  updateColumns: [
    'Attn',
    'FromBlock',
    'PoNumberHeader',
    'No2Header',
    'No2',
    'MaterialCodeHeader',
    'MaterialCode',
    'NoteUnderMaterial',
    'UserText',
    'Country',
    'Shipper',
    'FeederVessel',
    'MotherVessel',
    'VesselCompany',
    'Forwarder',
    'PortOfLoading',
    'Consignee',
    'BlType',
    'FreeTime',
    'CourierAddress',
    'EoriNo',
    'BookingNo',
    'NotifyParty',
    'AlsoNotify1',
    'AlsoNotify2',
    'DeliverTo',
    'Requirements',
    'Note',
    'Note2',
    'Note3',
    'Description',
    'UnderDescription',
    'ShippingMark',
    'BelowSignature',
    'UpdatedAt'
  ],
  rows: seed.masterData.siTemplates.map((item) => ({
    SiTemplateId: raw(
      `CONVERT(uniqueidentifier, '${deterministicUuid('SiTemplate', item.id)}')`
    ),
    ShipToCode: item.shipToId,
    Attn: item.attn,
    FromBlock: item.from,
    PoNumberHeader: item.poNumberHeader,
    No2Header: item.no2Header,
    No2: item.no2,
    MaterialCodeHeader: item.materialCodeHeader,
    MaterialCode: item.materialCode,
    NoteUnderMaterial: item.noteUnderMaterial,
    UserText: item.user,
    Country: item.country,
    Shipper: item.shipper,
    FeederVessel: item.feederVessel,
    MotherVessel: item.motherVessel,
    VesselCompany: item.vesselCompany,
    Forwarder: item.forwarder,
    PortOfLoading: item.portOfLoading,
    Consignee: item.consignee,
    BlType: item.blType,
    FreeTime: item.freeTime,
    CourierAddress: item.courierAddress,
    EoriNo: item.eoriNo,
    BookingNo: item.bookingNo,
    NotifyParty: item.notifyParty,
    AlsoNotify1: item.alsoNotify1,
    AlsoNotify2: item.alsoNotify2,
    DeliverTo: item.deliverTo,
    Requirements: item.requirements,
    Note: item.note,
    Note2: item.note2,
    Note3: item.note3,
    Description: item.description,
    UnderDescription: item.underDescription,
    ShippingMark: item.shippingMark,
    BelowSignature: item.belowSignature,
    CreatedAt: sqlDateTime(item.createdAt),
    UpdatedAt: sqlDateTime(item.updatedAt)
  }))
});

appendHeading(
  lines,
  'Default active workflow permissions from STANDARD preset'
);
pushMerge(lines, {
  tableName: 'LineActionPermission',
  columns: [
    'LineActionCode',
    'FromOrderLineStatusCode',
    'ToOrderLineStatusCode',
    'AllowedUserGroupCode'
  ],
  keyColumns: [
    'LineActionCode',
    'FromOrderLineStatusCode',
    'AllowedUserGroupCode'
  ],
  updateColumns: ['ToOrderLineStatusCode'],
  rows: seed.linePermissionPresets.standard.flatMap((rule) =>
    rule.allowedUserGroups.map((group) => ({
      LineActionCode: rule.action,
      FromOrderLineStatusCode: rule.fromStatus,
      ToOrderLineStatusCode: rule.toStatus,
      AllowedUserGroupCode: group
    }))
  )
});

appendHeading(lines, 'Workflow permission preset headers');
pushMerge(lines, {
  tableName: 'LinePermissionPreset',
  columns: [
    'LinePermissionPresetId',
    'PresetName',
    'IsSystemPreset',
    'CreatedAt',
    'UpdatedAt'
  ],
  keyColumns: ['PresetName'],
  updateColumns: ['IsSystemPreset', 'UpdatedAt'],
  rows: [
    {
      LinePermissionPresetId: raw(
        `CONVERT(uniqueidentifier, '${systemPresetIds.STANDARD}')`
      ),
      PresetName: 'STANDARD',
      IsSystemPreset: raw('1'),
      CreatedAt: raw('SYSUTCDATETIME()'),
      UpdatedAt: raw('SYSUTCDATETIME()')
    },
    {
      LinePermissionPresetId: raw(
        `CONVERT(uniqueidentifier, '${systemPresetIds.STRICT}')`
      ),
      PresetName: 'STRICT',
      IsSystemPreset: raw('1'),
      CreatedAt: raw('SYSUTCDATETIME()'),
      UpdatedAt: raw('SYSUTCDATETIME()')
    }
  ]
});

appendHeading(lines, 'Workflow permission preset rules');
appendLines(
  lines,
  'DELETE target',
  'FROM dbo.LinePermissionPresetRule AS target',
  'INNER JOIN dbo.LinePermissionPreset AS preset',
  '  ON preset.LinePermissionPresetId = target.LinePermissionPresetId',
  "WHERE preset.PresetName IN (N'STANDARD', N'STRICT');",
  '',
  'INSERT INTO dbo.LinePermissionPresetRule (',
  '  LinePermissionPresetId,',
  '  LineActionCode,',
  '  FromOrderLineStatusCode,',
  '  ToOrderLineStatusCode,',
  '  AllowedUserGroupCode',
  ')',
  'VALUES'
);

const presetRuleRows = Object.entries(seed.linePermissionPresets).flatMap(
  ([presetName, rules]) => {
    const presetId = systemPresetIds[presetName.toUpperCase()];
    return rules.flatMap((rule) =>
      rule.allowedUserGroups.map(
        (group) =>
          `  (CONVERT(uniqueidentifier, '${presetId}'), ${sqlString(
            rule.action
          )}, ${sqlString(rule.fromStatus)}, ${sqlString(
            rule.toStatus
          )}, ${sqlString(group)})`
      )
    );
  }
);

appendLines(
  lines,
  presetRuleRows
    .map(
      (row, index) => `${row}${index === presetRuleRows.length - 1 ? ';' : ','}`
    )
    .join('\n')
);
appendLines(lines, '', 'COMMIT TRANSACTION;', 'GO');

fs.writeFileSync(outputPath, `${lines.join('\n')}\n`);
console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
