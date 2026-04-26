SET
  NOCOUNT ON;

SET
  XACT_ABORT ON;

GO
/*
SQL Server seed reference generated from docs-for-nextjs/database/MASTER-DATA-SEED.json.
Regenerate with: node ./scripts/export_sqlserver_seed.mjs
Covers master data, PO/SI templates, and workflow permission defaults/presets.
 */
BEGIN TRANSACTION;

-- Customer companies
MERGE dbo.CustomerCompany AS target USING (
  VALUES
    (
      N'C001',
      N'UBE Thailand',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'AG-UBE-JP',
      N'UBE Japan',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'AG-UBE-EU',
      N'UBE Europe',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'AG-UBE-SH',
      N'UBE Shanghai',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'AG-UBE-TW',
      N'UBE Taiwan',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'AG-UBE-US',
      N'UBE America',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'AG-MAR',
      N'Marubeni',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'AG-SHI',
      N'Shiraishi',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'AG-MIT',
      N'Mitsubishi',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    )
) AS source (CompanyCode, CompanyName, CreatedAt, UpdatedAt) ON target.CompanyCode = source.CompanyCode WHEN MATCHED THEN
UPDATE
SET
  target.CompanyName = source.CompanyName,
  target.UpdatedAt = source.UpdatedAt WHEN NOT MATCHED BY TARGET THEN INSERT (CompanyCode, CompanyName, CreatedAt, UpdatedAt)
VALUES
  (
    source.CompanyCode,
    source.CompanyName,
    source.CreatedAt,
    source.UpdatedAt
  );

-- Group sale types
MERGE dbo.GroupSaleType AS target USING (
  VALUES
    (N'OVERSEAS', N'Overseas Sales Group'),
    (N'DOMESTIC', N'Domestic Sales Group')
) AS source (GroupSaleTypeCode, GroupSaleTypeName) ON target.GroupSaleTypeCode = source.GroupSaleTypeCode WHEN MATCHED THEN
UPDATE
SET
  target.GroupSaleTypeName = source.GroupSaleTypeName WHEN NOT MATCHED BY TARGET THEN INSERT (GroupSaleTypeCode, GroupSaleTypeName)
VALUES
  (
    source.GroupSaleTypeCode,
    source.GroupSaleTypeName
  );

-- Destinations
MERGE dbo.Destination AS target USING (
  VALUES
    (
      N'DEST-HAIPHONG',
      N'Haiphong, Vietnam',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-CAT-LAI-HCM',
      N'Cat Lai (Ho Chi Minh), Vietnam',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-VSIP',
      N'VSIP, Vietnam',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-SHANGHAI',
      N'Shanghai, China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-XIAMEN',
      N'Xiamen, China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-QINGDAO',
      N'Qingdao, China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-TIANJIN',
      N'Tianjin, China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-DALIAN',
      N'Dalian, China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-NINGBO',
      N'Ningbo, China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-MAWEI-FUZHOU',
      N'Mawei (Fuzhou), China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-HUANGPU',
      N'Huangpu, China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-NANSHA',
      N'Nansha, China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-TAIPING',
      N'Taiping, China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-SHATIAN',
      N'Shatian, China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-YANTIAN',
      N'Yantian, China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-ZHANGJIAGANG',
      N'Zhangjiagang, China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-CHONGQING',
      N'Chongqing, China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-QINGYUAN',
      N'Qingyuan, China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-BEIJING-AIRPORT',
      N'Beijing Airport, China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-HUMEN',
      N'Humen, China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-HANGZHOU',
      N'Hangzhou, China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-SHENYANG',
      N'Shenyang, China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-HAIKOU',
      N'Haikou, China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-NHAVA-SHEVA',
      N'Nhava Sheva (Mumbai), India',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-CHENNAI',
      N'Chennai, India',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-COCHIN',
      N'Cochin, India',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-KATTUPALLI',
      N'Kattupalli, India',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-TUTICORIN',
      N'Tuticorin, India',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-ICD-SANAND',
      N'ICD Sanand, India',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-MYSORE',
      N'Mysore, India',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-TOKYO',
      N'Tokyo, Japan',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-OSAKA',
      N'Osaka, Japan',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-KOBE',
      N'Kobe, Japan',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-YOKOHAMA',
      N'Yokohama, Japan',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-TAICHUNG',
      N'Taichung, Taiwan',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-KEELUNG',
      N'Keelung, Taiwan',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-BUSAN',
      N'Busan, South Korea',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-JAKARTA',
      N'Jakarta, Indonesia',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-SEMARANG',
      N'Semarang, Indonesia',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-KUALA-LUMPUR',
      N'Kuala Lumpur, Malaysia',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-KAMUNTING',
      N'Kamunting, Malaysia',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-ALOR-SETAR',
      N'Alor Setar, Malaysia',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-PENANG',
      N'Penang, Malaysia',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-SUBIC',
      N'Subic Bay, Philippines',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-MANILA',
      N'Manila, Philippines',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-SIHANOUKVILLE',
      N'Sihanoukville, Cambodia',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-HONG-KONG',
      N'Hong Kong',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-COLOMBO',
      N'Colombo, Sri Lanka',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-CHATTOGRAM',
      N'Chattogram, Bangladesh',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-SINGAPORE',
      N'Singapore',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-HAIFA',
      N'Haifa, Israel',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-HAMBURG',
      N'Hamburg, Germany',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-HANNOVER',
      N'Hannover, Germany',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-FRANKFURT',
      N'Frankfurt, Germany',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-AACHEN',
      N'Aachen, Germany',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-KORBACH',
      N'Korbach, Germany',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-FULDA',
      N'Fulda, Germany',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-OBERNBURG',
      N'Obernburg, Germany',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-WALTERSHAUSEN',
      N'Waltershausen, Germany',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-FURSTENWALDE',
      N'Fürstenwalde, Germany',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-HANAU',
      N'Hanau, Germany',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-SCHKOPAU',
      N'Schkopau, Germany',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-AMIENS',
      N'Amiens, France',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-LE-HAVRE',
      N'Le Havre, France',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-SARREGUEMINES',
      N'Sarreguemines, France',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-ROTTERDAM',
      N'Rotterdam, Netherlands',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-ANTWERP',
      N'Antwerp, Belgium',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-GENOA',
      N'Genoa, Italy',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-GDYNIA',
      N'Gdynia, Poland',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-WARSAW-AIRPORT',
      N'Warsaw Airport, Poland',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-DEBICA',
      N'Dębica, Poland',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-TIMISOARA',
      N'Timișoara, Romania',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-OTROKOVICE',
      N'Otrokovice, Czech Republic',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-PUCHOV',
      N'Púchov, Slovakia',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-KOPER',
      N'Koper, Slovenia',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-KRANJ',
      N'Kranj, Slovenia',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-KRUSEVAC',
      N'Kruševac, Serbia',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-GEBZE',
      N'Gebze, Turkey',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-GEMLIK',
      N'Gemlik, Turkey',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-LOUSADO',
      N'Lousado, Portugal',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-PORT-ELIZABETH',
      N'Port Elizabeth, South Africa',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-DURBAN',
      N'Durban, South Africa',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-CALUMET-CITY',
      N'Calumet City, IL, USA',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-MT-VERNON',
      N'Mt. Vernon, IL, USA',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-WILSON',
      N'Wilson, NC, USA',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-LAWTON',
      N'Lawton, OK, USA',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-DALLAS',
      N'Dallas, TX, USA',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-CRANDALL',
      N'Crandall, TX, USA',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-SAVANNAH',
      N'Savannah, GA, USA',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-WHITE',
      N'White, GA, USA',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-NEW-ORLEANS',
      N'New Orleans, LA, USA',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-WEST-POINT',
      N'West Point, MS, USA',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-RANCHO-CUCAMONGA',
      N'Rancho Cucamonga, CA, USA',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-CHICAGO',
      N'Chicago, IL, USA',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-FINDLAY',
      N'Findlay, OH, USA',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-QUINCY',
      N'Quincy, IL, USA',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-SALEM',
      N'Salem, VA, USA',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-MANZANILLO',
      N'Manzanillo, Mexico',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-SANTOS',
      N'Santos, Brazil',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-PARANAGUA',
      N'Paranaguá, Brazil',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-SAN-ANTONIO-CHILE',
      N'San Antonio, Chile',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-BUENOS-AIRES',
      N'Buenos Aires, Argentina',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-HELSINKI',
      N'Helsinki, Finland',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-ZATEC',
      N'Žatec, Czech Republic',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-BUDAPEST',
      N'Budapest, Hungary',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-VLADIVOSTOK',
      N'Vladivostok, Russia',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-SYDNEY',
      N'Sydney, Australia',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-SOUTHAMPTON',
      N'Southampton, UK',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-JIAOXIN',
      N'Jiaoxin, China',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DEST-BERVEREN',
      N'Beveren, Belgium',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    )
) AS source (
  DestinationCode,
  DestinationName,
  CreatedAt,
  UpdatedAt
) ON target.DestinationCode = source.DestinationCode WHEN MATCHED THEN
UPDATE
SET
  target.DestinationName = source.DestinationName,
  target.UpdatedAt = source.UpdatedAt WHEN NOT MATCHED BY TARGET THEN INSERT (
    DestinationCode,
    DestinationName,
    CreatedAt,
    UpdatedAt
  )
VALUES
  (
    source.DestinationCode,
    source.DestinationName,
    source.CreatedAt,
    source.UpdatedAt
  );

-- Shipping terms
MERGE dbo.ShippingTerm AS target USING (
  VALUES
    (
      N'CFR',
      N'CFR',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'CIF',
      N'CIF',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'CIP',
      N'CIP',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'CPT',
      N'CPT',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DAP',
      N'DAP',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DAT',
      N'DAT',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'DPU',
      N'DPU',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'EXW',
      N'EXW',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'FCA',
      N'FCA',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'FOB',
      N'FOB',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    )
) AS source (TermCode, TermName, CreatedAt, UpdatedAt) ON target.TermCode = source.TermCode WHEN MATCHED THEN
UPDATE
SET
  target.TermName = source.TermName,
  target.UpdatedAt = source.UpdatedAt WHEN NOT MATCHED BY TARGET THEN INSERT (TermCode, TermName, CreatedAt, UpdatedAt)
VALUES
  (
    source.TermCode,
    source.TermName,
    source.CreatedAt,
    source.UpdatedAt
  );

-- Product grades
MERGE dbo.ProductGrade AS target USING (
  VALUES
    (
      N'BR150',
      N'UBEPOL BR150',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'BR150B',
      N'UBEPOL BR150B',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'BR150GN',
      N'UBEPOL BR150GN',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'BR150L',
      N'UBEPOL BR150L',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'BR150LGN',
      N'UBEPOL BR150LGN',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'BR360B',
      N'UBEPOL BR360B',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'VCR412',
      N'UBEPOL VCR412',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'VCR617',
      N'UBEPOL VCR617',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'X-200',
      N'X-200',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    )
) AS source (GradeCode, GradeName, CreatedAt, UpdatedAt) ON target.GradeCode = source.GradeCode WHEN MATCHED THEN
UPDATE
SET
  target.GradeName = source.GradeName,
  target.UpdatedAt = source.UpdatedAt WHEN NOT MATCHED BY TARGET THEN INSERT (GradeCode, GradeName, CreatedAt, UpdatedAt)
VALUES
  (
    source.GradeCode,
    source.GradeName,
    source.CreatedAt,
    source.UpdatedAt
  );

-- Ship-to records
MERGE dbo.ShipTo AS target USING (
  VALUES
    (
      N'SHIP-AV-THOMAS',
      N'A.V. THOMAS & CO.LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-ALERON-VIETNAM',
      N'ALERON VIETNAM FOOTWEAR LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-ALLIANCE-TIRE',
      N'ALLIANCE TIRE GROUP',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-ALPHA-POLYMER',
      N'ALPHA-POLYMER CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-AMTEX',
      N'AMTEX INTERNATIONAL S.A. DE C.V.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-APOLLO-TYRES',
      N'APOLLO TYRES LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BRIDGESTONE-AMERICAS',
      N'BRIDGESTONE AMERICAS TIRE OPERATIONS LLC',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BRIDGESTONE-BANDAG',
      N'BRIDGESTONE BANDAG LLC',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BRIDGESTONE-EUROPE',
      N'BRIDGESTONE EUROPE NV/SA',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BRIDGESTONE-INDIA',
      N'BRIDGESTONE INDIA PRIVATE LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CEAT-LTD',
      N'CEAT LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CHENG-SHIN-CHINA',
      N'CHENG SHIN RUBBER (XIAMEN) IND. CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CHENG-SHIN-VIETNAM',
      N'CHENG SHIN RUBBER VIETNAM CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CHINA-RUBBER',
      N'CHINA RUBBER INDUSTRY ASSOCIATION',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CONFAB',
      N'CONFAB INDUSTRIAL S.A.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CONTINENTAL-GERMANY',
      N'CONTINENTAL REIFEN DEUTSCHLAND GMBH',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CONTINENTAL-INDIA',
      N'CONTINENTAL INDIA LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CONTINENTAL-ROMANIA',
      N'CONTINENTAL ANVELOPE S.R.L.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CONTINENTAL-US',
      N'CONTINENTAL TIRE THE AMERICAS LLC',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-COOPER-TIRE',
      N'COOPER TIRE & RUBBER COMPANY',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-ENGLEBERT',
      N'ENGLEBERT S.R.O.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-EUROMASTER',
      N'EUROMASTER GMBH',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-FALCON-TYRES',
      N'FALCON TYRES LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-FENNER-INDIA',
      N'FENNER (INDIA) LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GOODYEAR-CHINA',
      N'GOODYEAR (CHINA) INVESTMENT CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GOODYEAR-INDIA',
      N'GOODYEAR INDIA LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GOODYEAR-LUXEMBOURG',
      N'GOODYEAR OPERATIONS SA',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GOODYEAR-POLAND',
      N'GOODYEAR DUNLOP TYRES POLSKA SP. Z O.O.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GOODYEAR-SLOVENIA',
      N'GOODYEAR DUNLOP SAVA TIRES D.O.O.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GOODYEAR-TURKEY',
      N'GOODYEAR LASTIKLERI T.A.S.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GUMOPLAST',
      N'GUMOPLAST SP. Z O.O.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-HANKOOK-HUNGARY',
      N'HANKOOK TIRE HUNGARY KFT.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-HANKOOK-INDONESIA',
      N'PT. HANKOOK TIRE INDONESIA',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-HANKOOK-KOREA',
      N'HANKOOK TIRE & TECHNOLOGY CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-HANKOOK-US',
      N'HANKOOK TYRE AMERICA CORP.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-HENKEL-GERMANY',
      N'HENKEL AG & CO. KGAA',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-HUTCHINSON-FRANCE',
      N'HUTCHINSON SA',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-INOUE-RUBBER',
      N'INOUE RUBBER CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-IRC',
      N'INOUE RUBBER (THAILAND) CO., LTD.',
      N'DOMESTIC',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-JK-TYRE',
      N'JK TYRE & INDUSTRIES LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-KENDA-RUBBER',
      N'KENDA RUBBER INDUSTRIAL CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-KUMHO-KOREA',
      N'KUMHO TIRE CO., INC.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-KUMHO-VIETNAM',
      N'KUMHO TIRE VIETNAM CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-LINGLONG-CHINA',
      N'SHANDONG LINGLONG TYRE CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MAXXIS-CHINA',
      N'CHENG SHIN RUBBER IND. CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MAXXIS-INDIA',
      N'MAXXIS INDUSTRIES (INDIA) PVT. LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MICHELIN-BRAZIL',
      N'MICHELIN BRASIL LTDA.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MICHELIN-CHINA',
      N'MICHELIN (CHINA) INVESTMENT CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MICHELIN-FRANCE',
      N'MANUFACTURE FRANCAISE DES PNEUMATIQUES MICHELIN',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MICHELIN-GERMANY',
      N'MICHELIN REIFENWERKE AG & CO. KGAA',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MICHELIN-INDIA',
      N'MICHELIN INDIA TAMIL NADU TYRES PVT. LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MICHELIN-INDONESIA',
      N'PT. MICHELIN INDONESIA',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MICHELIN-KOREA',
      N'MICHELIN KOREA CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MICHELIN-SERBIA',
      N'TIGAR TYRES D.O.O.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MICHELIN-THAILAND',
      N'SIAM MICHELIN CO., LTD.',
      N'DOMESTIC',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MICHELIN-US',
      N'MICHELIN NORTH AMERICA INC.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MRF',
      N'MRF LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-NEXEN-KOREA',
      N'NEXEN TIRE CORPORATION',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-NEXEN-CZECHIA',
      N'NEXEN TIRE EUROPE S.R.O.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-NITTO-JAPAN',
      N'NITTO TIRE CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-NOKIAN-FINLAND',
      N'NOKIAN TYRES PLC',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-OTANI-THAILAND',
      N'OTANI TYRE CO., LTD.',
      N'DOMESTIC',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-PIRELLI-BRAZIL',
      N'PIRELLI PNEUS LTDA.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-PIRELLI-ITALY',
      N'PIRELLI TYRE S.P.A.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-PIRELLI-TURKEY',
      N'PIRELLI LASTIKLERI A.S.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-PT-EPN',
      N'PT. ELANGPERDANA TYRE INDUSTRY',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-PT-GAJAH-TUNGGAL',
      N'PT. GAJAH TUNGGAL TBK',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-PT-IRC-INDONESIA',
      N'PT. IRC INOAC INDONESIA',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-PT-MULTISTRADA',
      N'PT. MULTISTRADA ARAH SARANA TBK',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-PT-SURYARAYA',
      N'PT. SURYARAYA RUBBERINDO INDUSTRIES',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-QIANKUN-CHINA',
      N'QIANKUN TIRE & RUBBER CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SAILUN-CHINA',
      N'SAILUN JINYU GROUP CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SHANDONG-YONGTAI',
      N'SHANDONG YONGTAI GROUP CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SHIRAISHI-CALCIUM',
      N'SHIRAISHI CALCIUM KAISHA LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SRI-TRANG',
      N'SRI TRANG AGRO-INDUSTRY PCL',
      N'DOMESTIC',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SUMITOMO-JAPAN',
      N'SUMITOMO RUBBER INDUSTRIES LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SUMITOMO-SOUTH-AFRICA',
      N'SUMITOMO RUBBER SOUTH AFRICA PTY LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SUMITOMO-THAILAND',
      N'FALKEN TYRE (THAILAND) CO., LTD.',
      N'DOMESTIC',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SUMITOMO-US',
      N'FALKEN TIRE CORPORATION',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TOYO-CHINA',
      N'TOYO TIRE (ZHANGZHOU) CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TOYO-JAPAN',
      N'TOYO TIRE CORPORATION',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TOYO-MALAYSIA',
      N'TOYO TYRE MALAYSIA SDN. BHD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TOYO-US',
      N'TOYO TIRE U.S.A. CORP.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TPR',
      N'THAI PREMIER RUBBER CO., LTD.',
      N'DOMESTIC',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TRIANGLE-CHINA',
      N'TRIANGLE TYRE CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TRINSEO-GERMANY',
      N'TRINSEO DEUTSCHLAND GMBH',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TRINSEO-US',
      N'TRINSEO LLC',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TYRE-MAX',
      N'TYRE MAX (AUST) PTY. LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-UBE-EU',
      N'UBE ELASTOMERS EUROPE SAS',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-UBE-SHANGHAI',
      N'UBE ELASTOMERS SHANGHAI CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-UBE-SINGAPORE',
      N'UBE ELASTOMERS SINGAPORE PTE. LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-UBE-US',
      N'UBE ELASTOMERS AMERICA CORP.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-UNIROYAL-GERMANY',
      N'CONTINENTAL REIFEN DEUTSCHLAND GMBH (UNIROYAL)',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-VBCF',
      N'VAN BERKEL CHEMICAL SYSTEMS BV',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-VIMAX',
      N'VIMAX RUBBER (THAILAND) CO., LTD.',
      N'DOMESTIC',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-YOKOHAMA-JAPAN',
      N'YOKOHAMA RUBBER CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-YOKOHAMA-PHILIPPINES',
      N'YOKOHAMA TIRE PHILIPPINES INC.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-YOKOHAMA-THAILAND',
      N'THAI YOKOHAMA TYRE CO., LTD.',
      N'DOMESTIC',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-YOKOHAMA-US',
      N'YOKOHAMA TIRE CORPORATION',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-ZEON-JAPAN',
      N'ZEON CORPORATION',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-ZEON-TAIWAN',
      N'ZEON CHEMICALS LP (TAIWAN)',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-ZC-RUBBER',
      N'ZHONGCE RUBBER GROUP CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BRIDGESTONE-THAILAND',
      N'BRIDGESTONE TIRE MANUFACTURING (THAILAND) CO., LTD.',
      N'DOMESTIC',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CONTINENTHAL-THAILAND',
      N'CONTINENTAL TYRE (THAILAND) CO., LTD.',
      N'DOMESTIC',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GOODYEAR-THAILAND',
      N'GOODYEAR (THAILAND) PUBLIC COMPANY LIMITED',
      N'DOMESTIC',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MAXXIS-THAILAND',
      N'CHENG SHIN RUBBER (THAILAND) CO., LTD.',
      N'DOMESTIC',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-NITTO-THAILAND',
      N'NITTO DENKO (THAILAND) CO., LTD.',
      N'DOMESTIC',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-YOKOHAMA-INDIA',
      N'YOKOHAMA INDIA PVT. LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SUMITOMO-INDIA',
      N'FALKEN TYRE INDIA PVT. LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-VOGUE-TYRE',
      N'VOGUE TYRE AND RUBBER CO.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-WESTLAKE-CHINA',
      N'WESTLAKE CHEMICAL CORPORATION (CHINA)',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-XINGYUAN-CHINA',
      N'SHANDONG XINGYUAN INTERNATIONAL TYRE CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-ZHONGCE-HANGZHOU',
      N'ZHONGCE RUBBER (HANGZHOU) CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-APOLLO-SOUTH-AFRICA',
      N'APOLLO TYRES SOUTH AFRICA PTY LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BALKRISHNA-INDIA',
      N'BALKRISHNA INDUSTRIES LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BIRLA-CARBON',
      N'BIRLA CARBON INDIA PVT. LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BURT-SOLOMONS',
      N'BURT SOLOMONS HOLDINGS (PTY) LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CHEMOURS',
      N'THE CHEMOURS COMPANY FC LLC',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-EVONIK-GERMANY',
      N'EVONIK INDUSTRIES AG',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-FULDA',
      N'CONTINENTAL REIFEN DEUTSCHLAND GMBH (FULDA)',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CABOT-GERMANY',
      N'CABOT CORP. (GERMANY)',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-HAIMA-CHINA',
      N'HAIMA AUTOMOBILE CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-HNBR-JAPAN',
      N'ZEON CORPORATION (HNBR)',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-JIHUA-CHINA',
      N'JIHUA GROUP CORPORATION LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-KANSAI-PAINT',
      N'KANSAI PAINT CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-LANXESS-GERMANY',
      N'LANXESS DEUTSCHLAND GMBH',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-LATIN-CHEM',
      N'LATINQUIMICA S.A.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-LG-CHEM',
      N'LG CHEM LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MITSUI-CHEMICALS',
      N'MITSUI CHEMICALS INC.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-NANYA-PLASTICS',
      N'NAN YA PLASTICS CORPORATION',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-OMSK-RUSSIA',
      N'OMSK CARBON GROUP',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-PIRELLI-BRAZIL-2',
      N'PIRELLI PNEUS LTDA (GRAVATAÍ)',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-REKORD-CZECH',
      N'CONTINENTAL BARUM S.R.O.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SCHLUMBERGER',
      N'SCHLUMBERGER N.V.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SINOPEC',
      N'CHINA PETROLEUM & CHEMICAL CORPORATION (SINOPEC)',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SWISS-RUBBER',
      N'SWISS RUBBER CO.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TAIYA-RUBBER',
      N'TAIYA RUBBER CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-THAILAND-RUBBER',
      N'THAI RUBBER & ALLIED PRODUCTS PCL',
      N'DOMESTIC',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TIANZHAN-CHINA',
      N'TIANJIN ZHENTIAN RUBBER & PLASTIC CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TITAN-INTL',
      N'TITAN INTERNATIONAL INC.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TPI-POLENE',
      N'TPI POLENE PCL',
      N'DOMESTIC',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TREDWAY',
      N'TREDWAY COMPANY GMBH',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TRONOX',
      N'TRONOX (NETHERLANDS) CO. B.V.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TRUCKMASTER',
      N'TRUCKMASTER (EUROPE) B.V.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TTR',
      N'THAI TIRE & RUBBER CO., LTD.',
      N'DOMESTIC',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TUBA-INDIA',
      N'TUBA EXIM PVT. LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TYPHOON-UK',
      N'TYPHOON INTERNATIONAL LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-VEYANCE-INDIA',
      N'VEYANCE TECHNOLOGIES INDIA PVT. LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-VIPAL-BRAZIL',
      N'VIPAL BORRACHAS S.A.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-VITTORIA-ITALY',
      N'VITTORIA INDUSTRY S.R.L.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-VONG-THONG',
      N'VONG THONG TIRE CO., LTD.',
      N'DOMESTIC',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-VONIN-INDIA',
      N'VONIN POLYMER INDUSTRIES PVT. LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-ALL-WELLS-INTL',
      N'ALL WELLS INTERNATIONAL CO.,LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-ALPHA-POLYMER-DONGHAI',
      N'ALPHA-POLYMER CO., LTD. C/O DONG NAI PORT BONDED WAREHOUSE',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-ALPHA-POLYMER-WHALESHIP',
      N'ALPHA-POLYMER CO.,LTD C/O WHALESHIP LOGISTICS LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-ANNORA-VIETNAM',
      N'ANNORA VIETNAM FOOTWEAR LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-AURORA-VIETNAM',
      N'AURORA VIETNAM INDUSTRIAL FOOTWEAR CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BOEHLE-CHEMICALS',
      N'BOEHLE CHEMICALS',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BRIDGESTONE-TIANJIN',
      N'BRIDGESTONE (TIANJIN) TIRE CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BRIDGESTONE-WUXI',
      N'BRIDGESTONE (WUXI) TIRE CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BRIDGESTONE-CORP',
      N'Bridgestone Corporation',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BRIDGESTONE-MEXICO',
      N'BRIDGESTONE DE MEXICO, S.A. DE C.V.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BRIDGESTONE-BRASIL',
      N'BRIDGESTONE DO BRASIL',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BRIDGESTONE-FIRESTONE-WILSON',
      N'BRIDGESTONE FIRESTONE NT WILSON PLANT',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BRIDGESTONE-POZNAN',
      N'BRIDGESTONE POZNAN SP/ZO.O.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BRIDGESTONE-SA',
      N'BRIDGESTONE SA (PTY) LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BRIDGESTONE-TAIWAN',
      N'BRIDGESTONE TAIWAN CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BRIDGESTONE-TATABANYA',
      N'BRIDGESTONE TATABANYA MANUFACTURING LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BRIDGESTONE-VIETNAM',
      N'BRIDGESTONE VIETNAM',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-BRISA-TURKEY',
      N'BRISA BRIDGESTONE SABANCI LASTIK SANAYI VE TICARET A.S.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CEAT-KELANI',
      N'CEAT KELANI INTERNATIONAL TYRES PVT LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CEAT-CHENNAI',
      N'CEAT LIMITED CHENNAI',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CHENGSHIN-TAIWAN',
      N'CHENGSHIN RUBBER TAIWAN',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CHENG-SHIN-TIRE-SHANGHAI',
      N'CHENG SHIN TIRE & RUBBER (CHINA) CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CHENG-SHIN-CHONGQING',
      N'CHENG SHIN TIRE & RUBBER (CHONGQING) CO.,LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CHENG-SHIN-TIRE-XIAMEN',
      N'CHENG SHIN TIRE (XIAMEN) CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CHINH-DUONG',
      N'CHINH DUONG ONE MEMBER CO.,LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CHUN-XIANG-RUBBER',
      N'CHUN XIANG RUBBER PLASTIC PRODUCT CO., LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CONG-TY-ANTHAI',
      N'CONG TY TNHH CONG NGHE CAO SU ANTHAI VIETNAM',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CREATIVE-SOURCE-VN',
      N'CONG TY TNHH CREATIVE SOURCE VIET NAM',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-VIET-SIEU',
      N'CONG TY TNHH SX TM VIET SIEU',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CONTINENTAL-STOECKEN',
      N'CONTINENTAL AG STOECKEN',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CONTINENTAL-AACHEN',
      N'CONTINENTAL AG WERK AACHEN',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CONTINENTAL-AUTO-ROMANIA',
      N'Continental Automotive Products S.R.L.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CONTINENTAL-FRANCE',
      N'CONTINENTAL FRANCE SAS',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CONTINENTAL-INDIA-PRIVATE',
      N'CONTINENTAL INDIA PRIVATE LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CONTINENTAL-KORBACH',
      N'CONTINENTAL KORBACH',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CONTINENTAL-MABOR',
      N'Continental Mabor Industria de Pneus, S.A.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CONTINENTAL-TIRE-AMERICAS',
      N'CONTINENTAL TIRE THE AMERICAS, LLC',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CONTINENTAL-TIRES-CHINA',
      N'CONTINENTAL TIRES (CHINA) CO.,LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CONTINENTAL-TIRES-SLOVAKIA',
      N'CONTINENTAL TIRES SLOVAKIA, S.R.O.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CONTINENTAL-TYRE-MALAYSIA',
      N'CONTINENTAL TYRE AS MALAYSIA SDN. BHD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-CONTINENTAL-TYRE-SA',
      N'CONTINENTAL TYRE SOUTH AFRICA PTY LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-COOPER-SERBIA',
      N'COOPER TIRE AND RUBBER COMPANY SERBIA',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-COOPER-KUNSHAN',
      N'COOPER(KUNSHAN)TIRE CO.,LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-DONA-PACIFIC-VN',
      N'DONA PACIFIC (VIETNAM) CO.,LTD/FT',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-DONA-VICTOR',
      N'DONA VICTOR FOOTWEAR COMPANY LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-DONGGUAN-CHUNXIANG',
      N'Dongguan Chunxiang Rubber and Plastic Product Co., Ltd.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-DONGGUAN-YUECHUAN',
      N'DONGGUAN CITY YUECHUAN CHEMICAL CO., LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-DONGGUAN-GLUN',
      N'DONGGUAN G-LUN RUBBER & PLASTIC CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-DONGGUAN-HERRY',
      N'DONGGUAN HERRY PLASTIC AND RUBBER TECHNOLOGY CO., LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-DONGGUAN-JIAYUE',
      N'DONGGUAN JIAYUE RUBBER AND PLASTIC MATERIAL TECHNOLOGY CO., LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-DONGGUAN-LAAYOUNE',
      N'DONGGUAN LAAYOUNE CHEMICAL CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-DONGGUAN-QIHANG',
      N'Dongguan Qihang Rubber & Plastic Co.,LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-DONGGUAN-SUN-KIU',
      N'DONGGUAN SUN KIU SHOES CO.,LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-DONGGUAN-YINGFENG',
      N'DONGGUAN YINGFENG RUBBER CO., LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-DONGGUAN-YINGTAI',
      N'DONGGUAN YINGTAI COMMERCE CO.,LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-DOUBLESTAR-DONGFENG',
      N'DOUBLESTAR DONGFENG TYRE CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-DUONG-PHAT',
      N'DUONG PHAT IMPORT AND EXPORT SERVICES TRADING COMPANY LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-EAST-WIND-FOOTWEAR',
      N'EAST WIND FOOTWEAR COMPANY LIMITED (INDIA)',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-ETERNAL-PROWESS',
      N'ETERNAL PROWESS',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-EVER-POWER',
      N'EVER POWER INTERNATIONAL CO.,LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-FAIRWAY-ENTERPRISES',
      N'FAIRWAY ENTERPRISES COMPANY LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-FEET-BIT',
      N'FEET BIT INTERNATIONAL COMPANY LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-FUJIAN-LIFENG',
      N'FUJIAN LIFENG FOOTWEAR INDUSTRIAL DEVELOPMENT CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-FUJIAN-SANFENG',
      N'FUJIAN SAN FENG FOOTWEAR CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-FUJIAN-XIEFENG',
      N'FUJIAN XIEFENG FOOTWEAR CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GEE-HORN',
      N'GEE HORN INTERNATIONAL CO.,LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GEM-TREADS',
      N'GEM TREADS PRIVATE LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GEMCO-RUBBER',
      N'GEMCO RUBBER PRIVATE LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GOODYEAR-DALIAN',
      N'GOODYEAR DALIAN TIRE CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GOODYEAR-BRASIL',
      N'GOODYEAR DO BRASIL PRODUTOS DE BORRACHA LTDA.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GOODYEAR-DUNLOP-SAVA',
      N'GOODYEAR DUNLOP SAVA TIRES',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GOODYEAR-DUNLOP-AMIENS',
      N'GOODYEAR DUNLOP TIRES AMIENS SUD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GOODYEAR-DUNLOP-GERMANY',
      N'GOODYEAR DUNLOP TIRES GERMANY',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GOODYEAR-DUNLOP-GERMANY-GMBH',
      N'GOODYEAR DUNLOP TIRES GERMANY GMBH',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GOODYEAR-DUNLOP-OPS',
      N'GOODYEAR DUNLOP TIRES OPERATIONS s.a.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GOODYEAR-FULDA',
      N'GOODYEAR FULDA TIRES GERMANY',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GOODYEAR-LASTIKLERI',
      N'GOODYEAR LASTIKLERI T.A.S. GYTURKEY',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GOODYEAR-SERBIA',
      N'Goodyear Serbia, d. o. o.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GOODYEAR-TIRE-RUBBER',
      N'GOODYEAR TIRE AND RUBBER COMPANY',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GRAND-GAIN-FOOTWEAR',
      N'GRAND GAIN FOOTWEAR MANUFACTURING CO.,LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GUANGZHOU-ZHANGMOSHI',
      N'GUANGZHOU ZHANGMOSHI INTERNATIONAL TRADING CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-GUORONG-QINGYUAN',
      N'GUORONG (QINGYUAN) RUBBER INDUSTRY CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-HAIAN-RUBBER',
      N'HAIAN RUBBER GROUP CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-HANSUK-INTL',
      N'HANSUK INTERNATIONAL LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-HENGDASHENG-TOYO',
      N'HENGDASHENG TOYO TIRE (ZHANGJIAGANG) CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-HOA-THANH',
      N'HOA THANH COMPANY LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-HUA-SHEN-VN',
      N'HUA SHEN VIETNAM COMPANY LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-HWASEUNG-RACH-GIA',
      N'HWASEUNG RACH GIA COMPANY LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-JINAN-ZHONGTIAN',
      N'Jinan Zhongtian New Materials Co., Ltd.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-JIUCHENG-VN',
      N'JIUCHENG INDUSTRIAL (VN) LIMITED COMPANY',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-KASAN-MALAYSIA',
      N'KASAN CORPORATION (MALAYSIA) SDN BHD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-KENDA-CHINA',
      N'KENDA RUBBER (CHINA) CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-KENDA-INDONESIA',
      N'KENDA RUBBER (INDONESIA)',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-KENDA-TIANJIN',
      N'KENDA RUBBER (TIANJIN) CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-KENDA-VIETNAM',
      N'KENDA RUBBER (VIETNAM) CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-LAAYOUNE-INDUSTRIAL',
      N'LAAYOUNE INDUSTRIAL CO.,LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-LAC-TY-II',
      N'LAC TY II COMPANY LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-LOTUS-FOOTWEAR',
      N'LOTUS FOOTWEAR ENTERPRISES',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MFP-MICHELIN',
      N'M.F.P. Michelin P/C Simastock',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MFP-MICHELIN-THIANT',
      N'M.F.P. Michelin P/C Simastock Thiant',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MAXXIS-RUBBER-INDIA',
      N'MAXXIS RUBBER INDIA PRIVATE LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MICHELIN-HOMBURG',
      N'MICHELIN HOMBURG. (HBG)',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MICHELIN-POLAND',
      N'MICHELIN POLAND (OLS)',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MICHELIN-SHENYANG',
      N'MICHELIN SHENYANG TIRE CO.(SHY)',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-MRF-TYRE',
      N'MRF TYRE',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-NANKANG-RUBBER',
      N'NANKANG RUBBER TIRE',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-NANKANG-KEELUNG',
      N'NANKANG RUBBER TIRE CORP., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-NGU-HAN',
      N'NGU HAN TRANSPORT SERVICE CO., LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-NINH-BINH-VN',
      N'NINH BINH -VIETNAM CHUNG JYE SHOES MANUFA',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-PT-BRIDGESTONE',
      N'P.T. BRIDGESTONE TIRE INDONESIA',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-PHOENIX-COMPOUNDING',
      N'PHOENIX COMPOUNDING TECHNOLOGY',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-PIRELLI-DEUTSCHLAND',
      N'PIRELLI DEUTSCHLAND GMBH',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-PIRELLI-MEXICO',
      N'Pirelli Neumaticos S.A. de C.V.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-PT-ALNU',
      N'PT. ALNU SPORTING GOODS INDONESIA',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-PT-BOOSAN',
      N'PT. BOOSAN SARANG',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-PT-KUM-KANG',
      N'PT. KUM KANG TECH INDONESIA',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-PT-SEONGSAN',
      N'PT. SEONGSAN INTERNATIONAL',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-PT-HWA-SEUNG',
      N'PT.HWA SEUNG INDONESIA',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-QINGDAO-FUHUA',
      N'QINGDAO FREE TRADE ZONE FUHUA INTERNATIONAL TRADING CO.,LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-QINGDAO-GERUIDА',
      N'Qingdao Ge Rui Da Rubber Co., Ltd',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-QINGDAO-HUAWU',
      N'QINGDAO HUAWU RUBBER & PLASTIC CO.,LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-QINGDAO-RONGYUE',
      N'Qingdao Rongyue Import And Export Co., Ltd.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-QINGDAO-YUEYOU',
      N'QINGDAO YUEYOU INTERNATIONAL TRADE CO.,LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-RDC-ITALY',
      N'RDC Srl',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-ROLL-SPORT-VN',
      N'ROLL SPORT VIETNAM FOOTWEAR LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-RUBBER-MIX-CHILE',
      N'RUBBER MIX S.A.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SPA-MICHELIN-ITALIANA',
      N'S.P.A. MICHELIN ITALIANA (CNO)',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SAILUN-VIETNAM',
      N'SAILUN (VIETNAM) CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SAMIL-TONG-SANG',
      N'SAMIL TONG SANG VINA CO.,LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SANTEC-TRADING',
      N'SANTEC TRADING AGENCY',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SHANDONG-DURATTI',
      N'Shandong Duratti Rubber Co., Ltd.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SHANGHAI-MICHELIN',
      N'SHANGHAI MICHELIN TIRE CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SHINIMEX-II',
      N'SHINIMEX II CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SHYANG-TA',
      N'SHYANG TA CO.,LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SINTEX-CHEMICAL',
      N'SINTEX CHEMICAL CORP. C/O ICD TAN CANG-LONG BINH JOINT STOCK BONDED WAREHOUSE',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SUCCESS-PROSPERITY',
      N'SUCCESS PROSPERITY SHOE MATERIAL COMPANY',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SUMITOMO-CHANGSHU',
      N'SUMITOMO RUBBER (CHANGSHU) CO.,LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SUMITOMO-HUNAN',
      N'SUMITOMO RUBBER (HUNAN) CO. LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SUMITOMO-BRASIL',
      N'SUMITOMO RUBBER DO BRASIL LTDA.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-SUZHOU-YOKOHAMA',
      N'SUZHOU YOKOHAMA TIRE CO., LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TAN-HOA-THANH',
      N'TAN HOA THANH COMMERCIAL PRODUCTION CO.,LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TAN-THANH-HOA-LONG-AN',
      N'TAN THANH HOA LONG AN TRADING AND MANUFACTURING CO.,LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-THE-INHERITANCE-CAMBODIA',
      N'THE INHERITANCE (CAMBODIA) CO.,LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-THIEN-VINH',
      N'THIEN VINH INTERNATIONAL CO., LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-THUAN-ICH',
      N'THUAN ICH SHOES MATERIAL COMPANY LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TIRE-COMPANY-DEBICA',
      N'TIRE COMPANY DEBICA S.A.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TITAN-RUBBER-MANILA',
      N'Titan rubber Industrial Mfg Corporation',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TORTUGA-BRASIL',
      N'TORTUGA PRODUTOS DE BORRACHA LTDA',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TOYO-TIRE-NA',
      N'TOYO TIRE NORTH AMERICA MANUFACTURING INC.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-TVS-SRICHAKRA',
      N'TVS SRICHAKRA LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-UBE-ELASTOMER',
      N'UBE Elastomer Co. Ltd.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-UBE-MEXICO',
      N'UBE MEXICO S. de R.L. de C.V.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-USINE-MICHELIN-CHOLET',
      N'USINE MICHELIN DE CHOLET (CHO)',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-VICTORY-SPORTS-DG',
      N'VICTORY SPORTS GOODS CO.,LTD.(DONGGUAN)',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-VIET-NAM-VICTORY-SPORTS',
      N'VIET NAM VICTORY SPORTS TECHNOLOGY COMPANY LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-VIETNAM-DONA-STANDARD',
      N'VIETNAM DONA STANDARD FOOTWEAR CO., LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-VIETNAM-NAM-HA',
      N'VIETNAM NAM HA FOOTWEAR COMPANY LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-VINH-LONG-FOOTWEAR',
      N'VINH LONG FOOTWEAR CO., LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-WEILINA-VN',
      N'WEILINA VIET NAM FOOTWEAR COMPANY LIMITED',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-WELLOFF-SHANGHAI',
      N'WELLOFF INTERNATIONAL TRADING (SHANGHAI) CO.,LTD.',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-XIAMEN-HUAHE',
      N'XIAMEN HUAHE IMPORT AND EXPORT CO.,LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-XIAMEN-KUOCHENG',
      N'XIAMEN KUOCHENG RUBBER CO., LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-YOKOHAMA-TIRE-MFG',
      N'YOKOHAMA TIRE MANUFACTURING',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-YOKOHAMA-TYRE-VIETNAM',
      N'YOKOHAMA TYRE VIETNAM INC. (YTVI)',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-YU-QING',
      N'YU QING ENTERPRISE CO.,LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      N'SHIP-Z-AND-W-RUBBER',
      N'Z AND W RUBBER CO., LTD',
      N'OVERSEAS',
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    )
) AS source (
  ShipToCode,
  ShipToName,
  GroupSaleTypeCode,
  CreatedAt,
  UpdatedAt
) ON target.ShipToCode = source.ShipToCode WHEN MATCHED THEN
UPDATE
SET
  target.ShipToName = source.ShipToName,
  target.GroupSaleTypeCode = source.GroupSaleTypeCode,
  target.UpdatedAt = source.UpdatedAt WHEN NOT MATCHED BY TARGET THEN INSERT (
    ShipToCode,
    ShipToName,
    GroupSaleTypeCode,
    CreatedAt,
    UpdatedAt
  )
VALUES
  (
    source.ShipToCode,
    source.ShipToName,
    source.GroupSaleTypeCode,
    source.CreatedAt,
    source.UpdatedAt
  );

-- Ship-to destination mappings
MERGE dbo.ShipToDestinationMap AS target USING (
  VALUES
    (N'SHIP-AV-THOMAS', N'DEST-COCHIN'),
    (N'SHIP-ALERON-VIETNAM', N'DEST-HAIPHONG'),
    (N'SHIP-ALLIANCE-TIRE', N'DEST-HAIFA'),
    (N'SHIP-ALPHA-POLYMER', N'DEST-SHANGHAI'),
    (N'SHIP-AMTEX', N'DEST-MANZANILLO'),
    (N'SHIP-APOLLO-TYRES', N'DEST-NHAVA-SHEVA'),
    (N'SHIP-APOLLO-TYRES', N'DEST-KATTUPALLI'),
    (N'SHIP-BRIDGESTONE-AMERICAS', N'DEST-WILSON'),
    (
      N'SHIP-BRIDGESTONE-AMERICAS',
      N'DEST-CALUMET-CITY'
    ),
    (N'SHIP-BRIDGESTONE-BANDAG', N'DEST-MT-VERNON'),
    (N'SHIP-BRIDGESTONE-EUROPE', N'DEST-ANTWERP'),
    (N'SHIP-BRIDGESTONE-INDIA', N'DEST-NHAVA-SHEVA'),
    (N'SHIP-CEAT-LTD', N'DEST-NHAVA-SHEVA'),
    (N'SHIP-CHENG-SHIN-CHINA', N'DEST-XIAMEN'),
    (N'SHIP-CHENG-SHIN-VIETNAM', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-CHINA-RUBBER', N'DEST-SHANGHAI'),
    (N'SHIP-CONFAB', N'DEST-SANTOS'),
    (N'SHIP-CONTINENTAL-GERMANY', N'DEST-HANNOVER'),
    (N'SHIP-CONTINENTAL-INDIA', N'DEST-CHENNAI'),
    (N'SHIP-CONTINENTAL-ROMANIA', N'DEST-TIMISOARA'),
    (N'SHIP-CONTINENTAL-US', N'DEST-MT-VERNON'),
    (N'SHIP-CONTINENTAL-US', N'DEST-LAWTON'),
    (N'SHIP-COOPER-TIRE', N'DEST-WHITE'),
    (N'SHIP-COOPER-TIRE', N'DEST-FINDLAY'),
    (N'SHIP-ENGLEBERT', N'DEST-OTROKOVICE'),
    (N'SHIP-EUROMASTER', N'DEST-HANAU'),
    (N'SHIP-FALCON-TYRES', N'DEST-MYSORE'),
    (N'SHIP-FENNER-INDIA', N'DEST-CHENNAI'),
    (N'SHIP-GOODYEAR-CHINA', N'DEST-QINGDAO'),
    (N'SHIP-GOODYEAR-CHINA', N'DEST-DALIAN'),
    (N'SHIP-GOODYEAR-INDIA', N'DEST-NHAVA-SHEVA'),
    (N'SHIP-GOODYEAR-LUXEMBOURG', N'DEST-ANTWERP'),
    (N'SHIP-GOODYEAR-POLAND', N'DEST-GDYNIA'),
    (N'SHIP-GOODYEAR-SLOVENIA', N'DEST-KOPER'),
    (N'SHIP-GOODYEAR-TURKEY', N'DEST-GEMLIK'),
    (N'SHIP-GUMOPLAST', N'DEST-WARSAW-AIRPORT'),
    (N'SHIP-HANKOOK-HUNGARY', N'DEST-BUDAPEST'),
    (N'SHIP-HANKOOK-INDONESIA', N'DEST-JAKARTA'),
    (N'SHIP-HANKOOK-INDONESIA', N'DEST-SEMARANG'),
    (N'SHIP-HANKOOK-KOREA', N'DEST-BUSAN'),
    (N'SHIP-HANKOOK-US', N'DEST-SAVANNAH'),
    (N'SHIP-HENKEL-GERMANY', N'DEST-HAMBURG'),
    (N'SHIP-HUTCHINSON-FRANCE', N'DEST-LE-HAVRE'),
    (N'SHIP-INOUE-RUBBER', N'DEST-KOBE'),
    (N'SHIP-JK-TYRE', N'DEST-NHAVA-SHEVA'),
    (N'SHIP-JK-TYRE', N'DEST-CHENNAI'),
    (N'SHIP-KENDA-RUBBER', N'DEST-KEELUNG'),
    (N'SHIP-KUMHO-KOREA', N'DEST-BUSAN'),
    (N'SHIP-KUMHO-VIETNAM', N'DEST-HAIPHONG'),
    (N'SHIP-LINGLONG-CHINA', N'DEST-QINGDAO'),
    (N'SHIP-MAXXIS-CHINA', N'DEST-XIAMEN'),
    (N'SHIP-MAXXIS-CHINA', N'DEST-TAICHUNG'),
    (N'SHIP-MAXXIS-INDIA', N'DEST-CHENNAI'),
    (N'SHIP-MICHELIN-BRAZIL', N'DEST-SANTOS'),
    (N'SHIP-MICHELIN-CHINA', N'DEST-SHANGHAI'),
    (N'SHIP-MICHELIN-CHINA', N'DEST-SHENYANG'),
    (N'SHIP-MICHELIN-FRANCE', N'DEST-LE-HAVRE'),
    (N'SHIP-MICHELIN-GERMANY', N'DEST-HAMBURG'),
    (N'SHIP-MICHELIN-INDIA', N'DEST-CHENNAI'),
    (N'SHIP-MICHELIN-INDONESIA', N'DEST-JAKARTA'),
    (N'SHIP-MICHELIN-KOREA', N'DEST-BUSAN'),
    (N'SHIP-MICHELIN-SERBIA', N'DEST-KRUSEVAC'),
    (N'SHIP-MICHELIN-US', N'DEST-SAVANNAH'),
    (N'SHIP-MRF', N'DEST-CHENNAI'),
    (N'SHIP-NEXEN-KOREA', N'DEST-BUSAN'),
    (N'SHIP-NEXEN-CZECHIA', N'DEST-ZATEC'),
    (N'SHIP-NITTO-JAPAN', N'DEST-TOKYO'),
    (N'SHIP-NOKIAN-FINLAND', N'DEST-HELSINKI'),
    (N'SHIP-PIRELLI-BRAZIL', N'DEST-SANTOS'),
    (N'SHIP-PIRELLI-ITALY', N'DEST-GENOA'),
    (N'SHIP-PIRELLI-TURKEY', N'DEST-GEBZE'),
    (N'SHIP-PT-EPN', N'DEST-JAKARTA'),
    (N'SHIP-PT-GAJAH-TUNGGAL', N'DEST-JAKARTA'),
    (N'SHIP-PT-GAJAH-TUNGGAL', N'DEST-SEMARANG'),
    (N'SHIP-PT-IRC-INDONESIA', N'DEST-JAKARTA'),
    (N'SHIP-PT-MULTISTRADA', N'DEST-JAKARTA'),
    (N'SHIP-PT-SURYARAYA', N'DEST-JAKARTA'),
    (N'SHIP-QIANKUN-CHINA', N'DEST-QINGDAO'),
    (N'SHIP-SAILUN-CHINA', N'DEST-QINGDAO'),
    (N'SHIP-SHANDONG-YONGTAI', N'DEST-QINGDAO'),
    (N'SHIP-SHIRAISHI-CALCIUM', N'DEST-OSAKA'),
    (N'SHIP-SUMITOMO-JAPAN', N'DEST-KOBE'),
    (N'SHIP-SUMITOMO-SOUTH-AFRICA', N'DEST-DURBAN'),
    (N'SHIP-SUMITOMO-US', N'DEST-RANCHO-CUCAMONGA'),
    (N'SHIP-TOYO-CHINA', N'DEST-XIAMEN'),
    (N'SHIP-TOYO-JAPAN', N'DEST-OSAKA'),
    (N'SHIP-TOYO-JAPAN', N'DEST-KOBE'),
    (N'SHIP-TOYO-MALAYSIA', N'DEST-KAMUNTING'),
    (N'SHIP-TOYO-US', N'DEST-WHITE'),
    (N'SHIP-TOYO-US', N'DEST-DALLAS'),
    (N'SHIP-TRIANGLE-CHINA', N'DEST-QINGDAO'),
    (N'SHIP-TRINSEO-GERMANY', N'DEST-SCHKOPAU'),
    (N'SHIP-TRINSEO-US', N'DEST-CALUMET-CITY'),
    (N'SHIP-TYRE-MAX', N'DEST-SYDNEY'),
    (N'SHIP-UBE-EU', N'DEST-ANTWERP'),
    (N'SHIP-UBE-SHANGHAI', N'DEST-SHANGHAI'),
    (N'SHIP-UBE-SINGAPORE', N'DEST-SINGAPORE'),
    (N'SHIP-UBE-US', N'DEST-NEW-ORLEANS'),
    (N'SHIP-UNIROYAL-GERMANY', N'DEST-AACHEN'),
    (N'SHIP-VBCF', N'DEST-ROTTERDAM'),
    (N'SHIP-YOKOHAMA-JAPAN', N'DEST-TOKYO'),
    (N'SHIP-YOKOHAMA-JAPAN', N'DEST-YOKOHAMA'),
    (N'SHIP-YOKOHAMA-PHILIPPINES', N'DEST-SUBIC'),
    (N'SHIP-YOKOHAMA-US', N'DEST-WEST-POINT'),
    (N'SHIP-YOKOHAMA-US', N'DEST-SALEM'),
    (N'SHIP-ZEON-JAPAN', N'DEST-TOKYO'),
    (N'SHIP-ZEON-JAPAN', N'DEST-OSAKA'),
    (N'SHIP-ZEON-TAIWAN', N'DEST-TAICHUNG'),
    (N'SHIP-ZC-RUBBER', N'DEST-SHANGHAI'),
    (N'SHIP-ZC-RUBBER', N'DEST-HANGZHOU'),
    (N'SHIP-ZC-RUBBER', N'DEST-NINGBO'),
    (N'SHIP-YOKOHAMA-INDIA', N'DEST-NHAVA-SHEVA'),
    (N'SHIP-SUMITOMO-INDIA', N'DEST-NHAVA-SHEVA'),
    (N'SHIP-VOGUE-TYRE', N'DEST-CHICAGO'),
    (N'SHIP-WESTLAKE-CHINA', N'DEST-TIANJIN'),
    (N'SHIP-XINGYUAN-CHINA', N'DEST-QINGDAO'),
    (N'SHIP-ZHONGCE-HANGZHOU', N'DEST-HANGZHOU'),
    (N'SHIP-APOLLO-SOUTH-AFRICA', N'DEST-DURBAN'),
    (N'SHIP-BALKRISHNA-INDIA', N'DEST-NHAVA-SHEVA'),
    (N'SHIP-BIRLA-CARBON', N'DEST-NHAVA-SHEVA'),
    (N'SHIP-BURT-SOLOMONS', N'DEST-PORT-ELIZABETH'),
    (N'SHIP-CHEMOURS', N'DEST-NEW-ORLEANS'),
    (N'SHIP-EVONIK-GERMANY', N'DEST-HAMBURG'),
    (N'SHIP-EVONIK-GERMANY', N'DEST-FRANKFURT'),
    (N'SHIP-FULDA', N'DEST-FULDA'),
    (N'SHIP-CABOT-GERMANY', N'DEST-FRANKFURT'),
    (N'SHIP-HAIMA-CHINA', N'DEST-HAIKOU'),
    (N'SHIP-HNBR-JAPAN', N'DEST-TOKYO'),
    (N'SHIP-JIHUA-CHINA', N'DEST-TIANJIN'),
    (N'SHIP-KANSAI-PAINT', N'DEST-OSAKA'),
    (N'SHIP-LANXESS-GERMANY', N'DEST-FRANKFURT'),
    (N'SHIP-LANXESS-GERMANY', N'DEST-HAMBURG'),
    (N'SHIP-LATIN-CHEM', N'DEST-BUENOS-AIRES'),
    (N'SHIP-LG-CHEM', N'DEST-BUSAN'),
    (N'SHIP-MITSUI-CHEMICALS', N'DEST-OSAKA'),
    (N'SHIP-MITSUI-CHEMICALS', N'DEST-TOKYO'),
    (N'SHIP-NANYA-PLASTICS', N'DEST-TAICHUNG'),
    (N'SHIP-NANYA-PLASTICS', N'DEST-KEELUNG'),
    (N'SHIP-OMSK-RUSSIA', N'DEST-VLADIVOSTOK'),
    (N'SHIP-PIRELLI-BRAZIL-2', N'DEST-PARANAGUA'),
    (N'SHIP-REKORD-CZECH', N'DEST-OTROKOVICE'),
    (N'SHIP-SCHLUMBERGER', N'DEST-ROTTERDAM'),
    (N'SHIP-SINOPEC', N'DEST-SHANGHAI'),
    (N'SHIP-SINOPEC', N'DEST-TIANJIN'),
    (N'SHIP-SWISS-RUBBER', N'DEST-ANTWERP'),
    (N'SHIP-TAIYA-RUBBER', N'DEST-TAICHUNG'),
    (N'SHIP-TIANZHAN-CHINA', N'DEST-TIANJIN'),
    (N'SHIP-TITAN-INTL', N'DEST-QUINCY'),
    (N'SHIP-TREDWAY', N'DEST-FRANKFURT'),
    (N'SHIP-TRONOX', N'DEST-ROTTERDAM'),
    (N'SHIP-TRUCKMASTER', N'DEST-ROTTERDAM'),
    (N'SHIP-TUBA-INDIA', N'DEST-NHAVA-SHEVA'),
    (N'SHIP-TYPHOON-UK', N'DEST-SOUTHAMPTON'),
    (N'SHIP-VEYANCE-INDIA', N'DEST-NHAVA-SHEVA'),
    (N'SHIP-VIPAL-BRAZIL', N'DEST-PARANAGUA'),
    (N'SHIP-VITTORIA-ITALY', N'DEST-GENOA'),
    (N'SHIP-VONIN-INDIA', N'DEST-NHAVA-SHEVA'),
    (N'SHIP-ALL-WELLS-INTL', N'DEST-CAT-LAI-HCM'),
    (
      N'SHIP-ALPHA-POLYMER-DONGHAI',
      N'DEST-CAT-LAI-HCM'
    ),
    (N'SHIP-ALPHA-POLYMER-WHALESHIP', N'DEST-TAICHUNG'),
    (N'SHIP-ANNORA-VIETNAM', N'DEST-HAIPHONG'),
    (N'SHIP-AURORA-VIETNAM', N'DEST-HAIPHONG'),
    (N'SHIP-BOEHLE-CHEMICALS', N'DEST-CALUMET-CITY'),
    (
      N'SHIP-BRIDGESTONE-TIANJIN',
      N'DEST-BEIJING-AIRPORT'
    ),
    (N'SHIP-BRIDGESTONE-WUXI', N'DEST-SHANGHAI'),
    (N'SHIP-BRIDGESTONE-CORP', N'DEST-TOKYO'),
    (N'SHIP-BRIDGESTONE-MEXICO', N'DEST-MANZANILLO'),
    (N'SHIP-BRIDGESTONE-BRASIL', N'DEST-SANTOS'),
    (
      N'SHIP-BRIDGESTONE-FIRESTONE-WILSON',
      N'DEST-WILSON'
    ),
    (N'SHIP-BRIDGESTONE-POZNAN', N'DEST-GDYNIA'),
    (N'SHIP-BRIDGESTONE-SA', N'DEST-PORT-ELIZABETH'),
    (N'SHIP-BRIDGESTONE-TAIWAN', N'DEST-KEELUNG'),
    (N'SHIP-BRIDGESTONE-TATABANYA', N'DEST-HAMBURG'),
    (N'SHIP-BRIDGESTONE-VIETNAM', N'DEST-HAIPHONG'),
    (N'SHIP-BRISA-TURKEY', N'DEST-GEBZE'),
    (N'SHIP-CEAT-KELANI', N'DEST-COLOMBO'),
    (N'SHIP-CEAT-CHENNAI', N'DEST-CHENNAI'),
    (N'SHIP-CHENGSHIN-TAIWAN', N'DEST-TAICHUNG'),
    (
      N'SHIP-CHENG-SHIN-TIRE-SHANGHAI',
      N'DEST-SHANGHAI'
    ),
    (N'SHIP-CHENG-SHIN-CHONGQING', N'DEST-CHONGQING'),
    (N'SHIP-CHENG-SHIN-TIRE-XIAMEN', N'DEST-XIAMEN'),
    (N'SHIP-CHINH-DUONG', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-CHUN-XIANG-RUBBER', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-CONG-TY-ANTHAI', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-CREATIVE-SOURCE-VN', N'DEST-HAIPHONG'),
    (N'SHIP-VIET-SIEU', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-CONTINENTAL-STOECKEN', N'DEST-HANNOVER'),
    (N'SHIP-CONTINENTAL-STOECKEN', N'DEST-KOPER'),
    (N'SHIP-CONTINENTAL-AACHEN', N'DEST-AACHEN'),
    (
      N'SHIP-CONTINENTAL-AUTO-ROMANIA',
      N'DEST-TIMISOARA'
    ),
    (N'SHIP-CONTINENTAL-FRANCE', N'DEST-SARREGUEMINES'),
    (
      N'SHIP-CONTINENTAL-INDIA-PRIVATE',
      N'DEST-NHAVA-SHEVA'
    ),
    (N'SHIP-CONTINENTAL-KORBACH', N'DEST-KORBACH'),
    (N'SHIP-CONTINENTAL-MABOR', N'DEST-LOUSADO'),
    (
      N'SHIP-CONTINENTAL-TIRE-AMERICAS',
      N'DEST-MT-VERNON'
    ),
    (N'SHIP-CONTINENTAL-TIRES-CHINA', N'DEST-SHANGHAI'),
    (N'SHIP-CONTINENTAL-TIRES-SLOVAKIA', N'DEST-KOPER'),
    (
      N'SHIP-CONTINENTAL-TIRES-SLOVAKIA',
      N'DEST-PUCHOV'
    ),
    (
      N'SHIP-CONTINENTAL-TYRE-MALAYSIA',
      N'DEST-ALOR-SETAR'
    ),
    (
      N'SHIP-CONTINENTAL-TYRE-SA',
      N'DEST-PORT-ELIZABETH'
    ),
    (N'SHIP-COOPER-SERBIA', N'DEST-KRUSEVAC'),
    (N'SHIP-COOPER-KUNSHAN', N'DEST-SHANGHAI'),
    (N'SHIP-DONA-PACIFIC-VN', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-DONA-VICTOR', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-DONGGUAN-CHUNXIANG', N'DEST-SHATIAN'),
    (N'SHIP-DONGGUAN-YUECHUAN', N'DEST-SHATIAN'),
    (N'SHIP-DONGGUAN-GLUN', N'DEST-HUANGPU'),
    (N'SHIP-DONGGUAN-GLUN', N'DEST-SHATIAN'),
    (N'SHIP-DONGGUAN-GLUN', N'DEST-TAIPING'),
    (N'SHIP-DONGGUAN-GLUN', N'DEST-YANTIAN'),
    (N'SHIP-DONGGUAN-GLUN', N'DEST-JIAOXIN'),
    (N'SHIP-DONGGUAN-HERRY', N'DEST-SHATIAN'),
    (N'SHIP-DONGGUAN-JIAYUE', N'DEST-TAIPING'),
    (N'SHIP-DONGGUAN-LAAYOUNE', N'DEST-HUANGPU'),
    (N'SHIP-DONGGUAN-LAAYOUNE', N'DEST-TAIPING'),
    (N'SHIP-DONGGUAN-LAAYOUNE', N'DEST-XIAMEN'),
    (N'SHIP-DONGGUAN-QIHANG', N'DEST-SHATIAN'),
    (N'SHIP-DONGGUAN-SUN-KIU', N'DEST-TAIPING'),
    (N'SHIP-DONGGUAN-YINGFENG', N'DEST-TAIPING'),
    (N'SHIP-DONGGUAN-YINGTAI', N'DEST-TAIPING'),
    (N'SHIP-DONGGUAN-YINGTAI', N'DEST-XIAMEN'),
    (N'SHIP-DOUBLESTAR-DONGFENG', N'DEST-QINGDAO'),
    (N'SHIP-DUONG-PHAT', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-EAST-WIND-FOOTWEAR', N'DEST-CHENNAI'),
    (N'SHIP-EAST-WIND-FOOTWEAR', N'DEST-KATTUPALLI'),
    (N'SHIP-ETERNAL-PROWESS', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-EVER-POWER', N'DEST-SIHANOUKVILLE'),
    (N'SHIP-FAIRWAY-ENTERPRISES', N'DEST-CHENNAI'),
    (N'SHIP-FAIRWAY-ENTERPRISES', N'DEST-KATTUPALLI'),
    (N'SHIP-FEET-BIT', N'DEST-HONG-KONG'),
    (N'SHIP-FUJIAN-LIFENG', N'DEST-MAWEI-FUZHOU'),
    (N'SHIP-FUJIAN-LIFENG', N'DEST-XIAMEN'),
    (N'SHIP-FUJIAN-SANFENG', N'DEST-MAWEI-FUZHOU'),
    (N'SHIP-FUJIAN-SANFENG', N'DEST-XIAMEN'),
    (N'SHIP-FUJIAN-XIEFENG', N'DEST-MAWEI-FUZHOU'),
    (N'SHIP-FUJIAN-XIEFENG', N'DEST-XIAMEN'),
    (N'SHIP-GEE-HORN', N'DEST-KEELUNG'),
    (N'SHIP-GEM-TREADS', N'DEST-COCHIN'),
    (N'SHIP-GEMCO-RUBBER', N'DEST-COCHIN'),
    (N'SHIP-GOODYEAR-DALIAN', N'DEST-DALIAN'),
    (N'SHIP-GOODYEAR-DALIAN', N'DEST-QINGDAO'),
    (N'SHIP-GOODYEAR-BRASIL', N'DEST-SANTOS'),
    (N'SHIP-GOODYEAR-DUNLOP-SAVA', N'DEST-KRANJ'),
    (N'SHIP-GOODYEAR-DUNLOP-AMIENS', N'DEST-AMIENS'),
    (
      N'SHIP-GOODYEAR-DUNLOP-GERMANY',
      N'DEST-FRANKFURT'
    ),
    (
      N'SHIP-GOODYEAR-DUNLOP-GERMANY',
      N'DEST-FURSTENWALDE'
    ),
    (N'SHIP-GOODYEAR-DUNLOP-GERMANY', N'DEST-HAMBURG'),
    (
      N'SHIP-GOODYEAR-DUNLOP-GERMANY-GMBH',
      N'DEST-FRANKFURT'
    ),
    (
      N'SHIP-GOODYEAR-DUNLOP-GERMANY-GMBH',
      N'DEST-HAMBURG'
    ),
    (
      N'SHIP-GOODYEAR-DUNLOP-GERMANY-GMBH',
      N'DEST-HANAU'
    ),
    (N'SHIP-GOODYEAR-DUNLOP-OPS', N'DEST-BERVEREN'),
    (N'SHIP-GOODYEAR-FULDA', N'DEST-FRANKFURT'),
    (N'SHIP-GOODYEAR-FULDA', N'DEST-FULDA'),
    (N'SHIP-GOODYEAR-LASTIKLERI', N'DEST-GEMLIK'),
    (N'SHIP-GOODYEAR-SERBIA', N'DEST-KRUSEVAC'),
    (N'SHIP-GOODYEAR-TIRE-RUBBER', N'DEST-DALLAS'),
    (N'SHIP-GOODYEAR-TIRE-RUBBER', N'DEST-LAWTON'),
    (N'SHIP-GRAND-GAIN-FOOTWEAR', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-GUANGZHOU-ZHANGMOSHI', N'DEST-HUANGPU'),
    (N'SHIP-GUORONG-QINGYUAN', N'DEST-HUANGPU'),
    (N'SHIP-GUORONG-QINGYUAN', N'DEST-QINGYUAN'),
    (N'SHIP-HAIAN-RUBBER', N'DEST-XIAMEN'),
    (N'SHIP-HANSUK-INTL', N'DEST-BUSAN'),
    (N'SHIP-HENGDASHENG-TOYO', N'DEST-ZHANGJIAGANG'),
    (N'SHIP-HOA-THANH', N'DEST-HAIPHONG'),
    (N'SHIP-HUA-SHEN-VN', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-HWASEUNG-RACH-GIA', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-JINAN-ZHONGTIAN', N'DEST-QINGDAO'),
    (N'SHIP-JIUCHENG-VN', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-KASAN-MALAYSIA', N'DEST-KUALA-LUMPUR'),
    (N'SHIP-KENDA-CHINA', N'DEST-SHANGHAI'),
    (N'SHIP-KENDA-INDONESIA', N'DEST-JAKARTA'),
    (N'SHIP-KENDA-TIANJIN', N'DEST-TIANJIN'),
    (N'SHIP-KENDA-VIETNAM', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-LAAYOUNE-INDUSTRIAL', N'DEST-TAIPING'),
    (N'SHIP-LAC-TY-II', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-LOTUS-FOOTWEAR', N'DEST-CHENNAI'),
    (N'SHIP-LOTUS-FOOTWEAR', N'DEST-KATTUPALLI'),
    (N'SHIP-MFP-MICHELIN', N'DEST-LE-HAVRE'),
    (N'SHIP-MFP-MICHELIN-THIANT', N'DEST-LE-HAVRE'),
    (N'SHIP-MAXXIS-RUBBER-INDIA', N'DEST-ICD-SANAND'),
    (N'SHIP-MICHELIN-HOMBURG', N'DEST-ROTTERDAM'),
    (N'SHIP-MICHELIN-POLAND', N'DEST-WARSAW-AIRPORT'),
    (N'SHIP-MICHELIN-SHENYANG', N'DEST-DALIAN'),
    (N'SHIP-MRF-TYRE', N'DEST-CHENNAI'),
    (N'SHIP-MRF-TYRE', N'DEST-KATTUPALLI'),
    (N'SHIP-NANKANG-RUBBER', N'DEST-ZHANGJIAGANG'),
    (N'SHIP-NANKANG-KEELUNG', N'DEST-KEELUNG'),
    (N'SHIP-NGU-HAN', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-NINH-BINH-VN', N'DEST-HAIPHONG'),
    (N'SHIP-PT-BRIDGESTONE', N'DEST-JAKARTA'),
    (N'SHIP-PHOENIX-COMPOUNDING', N'DEST-HAMBURG'),
    (
      N'SHIP-PHOENIX-COMPOUNDING',
      N'DEST-WALTERSHAUSEN'
    ),
    (N'SHIP-PIRELLI-DEUTSCHLAND', N'DEST-OBERNBURG'),
    (N'SHIP-PIRELLI-MEXICO', N'DEST-MANZANILLO'),
    (N'SHIP-PT-ALNU', N'DEST-SEMARANG'),
    (N'SHIP-PT-BOOSAN', N'DEST-JAKARTA'),
    (N'SHIP-PT-KUM-KANG', N'DEST-JAKARTA'),
    (N'SHIP-PT-SEONGSAN', N'DEST-JAKARTA'),
    (N'SHIP-PT-HWA-SEUNG', N'DEST-JAKARTA'),
    (N'SHIP-QINGDAO-FUHUA', N'DEST-HUANGPU'),
    (N'SHIP-QINGDAO-FUHUA', N'DEST-HUMEN'),
    (N'SHIP-QINGDAO-FUHUA', N'DEST-NANSHA'),
    (N'SHIP-QINGDAO-FUHUA', N'DEST-QINGDAO'),
    (N'SHIP-QINGDAO-FUHUA', N'DEST-SHANGHAI'),
    (N'SHIP-QINGDAO-FUHUA', N'DEST-TAIPING'),
    (N'SHIP-QINGDAO-FUHUA', N'DEST-XIAMEN'),
    (N'SHIP-QINGDAO-GERUIDА', N'DEST-QINGDAO'),
    (N'SHIP-QINGDAO-HUAWU', N'DEST-QINGDAO'),
    (N'SHIP-QINGDAO-RONGYUE', N'DEST-SHANGHAI'),
    (N'SHIP-QINGDAO-YUEYOU', N'DEST-QINGDAO'),
    (N'SHIP-RDC-ITALY', N'DEST-GENOA'),
    (N'SHIP-ROLL-SPORT-VN', N'DEST-HAIPHONG'),
    (
      N'SHIP-RUBBER-MIX-CHILE',
      N'DEST-SAN-ANTONIO-CHILE'
    ),
    (N'SHIP-SPA-MICHELIN-ITALIANA', N'DEST-GENOA'),
    (N'SHIP-SAILUN-VIETNAM', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-SAMIL-TONG-SANG', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-SANTEC-TRADING', N'DEST-CHATTOGRAM'),
    (N'SHIP-SHANDONG-DURATTI', N'DEST-QINGDAO'),
    (N'SHIP-SHANGHAI-MICHELIN', N'DEST-SHANGHAI'),
    (N'SHIP-SHINIMEX-II', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-SHYANG-TA', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-SINTEX-CHEMICAL', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-SUCCESS-PROSPERITY', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-SUMITOMO-CHANGSHU', N'DEST-SHANGHAI'),
    (N'SHIP-SUMITOMO-HUNAN', N'DEST-SHANGHAI'),
    (N'SHIP-SUMITOMO-BRASIL', N'DEST-PARANAGUA'),
    (N'SHIP-SUZHOU-YOKOHAMA', N'DEST-SHANGHAI'),
    (N'SHIP-TAN-HOA-THANH', N'DEST-CAT-LAI-HCM'),
    (
      N'SHIP-TAN-THANH-HOA-LONG-AN',
      N'DEST-CAT-LAI-HCM'
    ),
    (
      N'SHIP-THE-INHERITANCE-CAMBODIA',
      N'DEST-SIHANOUKVILLE'
    ),
    (N'SHIP-THIEN-VINH', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-THUAN-ICH', N'DEST-HAIPHONG'),
    (N'SHIP-TIRE-COMPANY-DEBICA', N'DEST-DEBICA'),
    (N'SHIP-TITAN-RUBBER-MANILA', N'DEST-MANILA'),
    (N'SHIP-TORTUGA-BRASIL', N'DEST-PARANAGUA'),
    (N'SHIP-TOYO-TIRE-NA', N'DEST-CRANDALL'),
    (N'SHIP-TOYO-TIRE-NA', N'DEST-SAVANNAH'),
    (N'SHIP-TOYO-TIRE-NA', N'DEST-WHITE'),
    (N'SHIP-TVS-SRICHAKRA', N'DEST-TUTICORIN'),
    (N'SHIP-UBE-ELASTOMER', N'DEST-TOKYO'),
    (N'SHIP-UBE-MEXICO', N'DEST-MANZANILLO'),
    (N'SHIP-USINE-MICHELIN-CHOLET', N'DEST-LE-HAVRE'),
    (N'SHIP-VICTORY-SPORTS-DG', N'DEST-SHATIAN'),
    (N'SHIP-VIET-NAM-VICTORY-SPORTS', N'DEST-HAIPHONG'),
    (
      N'SHIP-VIETNAM-DONA-STANDARD',
      N'DEST-CAT-LAI-HCM'
    ),
    (N'SHIP-VIETNAM-NAM-HA', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-VINH-LONG-FOOTWEAR', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-WEILINA-VN', N'DEST-HAIPHONG'),
    (N'SHIP-WELLOFF-SHANGHAI', N'DEST-XIAMEN'),
    (N'SHIP-XIAMEN-HUAHE', N'DEST-JIAOXIN'),
    (N'SHIP-XIAMEN-KUOCHENG', N'DEST-NINGBO'),
    (N'SHIP-XIAMEN-KUOCHENG', N'DEST-SHATIAN'),
    (N'SHIP-XIAMEN-KUOCHENG', N'DEST-XIAMEN'),
    (N'SHIP-YOKOHAMA-TIRE-MFG', N'DEST-NEW-ORLEANS'),
    (N'SHIP-YOKOHAMA-TIRE-MFG', N'DEST-WEST-POINT'),
    (N'SHIP-YOKOHAMA-TYRE-VIETNAM', N'DEST-VSIP'),
    (N'SHIP-YU-QING', N'DEST-CAT-LAI-HCM'),
    (N'SHIP-Z-AND-W-RUBBER', N'DEST-HUANGPU')
) AS source (ShipToCode, DestinationCode) ON target.ShipToCode = source.ShipToCode
AND target.DestinationCode = source.DestinationCode WHEN NOT MATCHED BY TARGET THEN INSERT (ShipToCode, DestinationCode)
VALUES
  (source.ShipToCode, source.DestinationCode);

-- PO templates
MERGE dbo.PoTemplate AS target USING (
  VALUES
    (
      CONVERT(
        uniqueidentifier,
        '9e2783c1-cadf-aad3-4841-c9e8efda4916'
      ),
      N'SHIP-BRIDGESTONE-POZNAN',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND
ATTN.: T. Fujioka / SEVP',
      N'BRIDGESTONE POZNAN SP/ZO.O.
UL.BALTYCKA 65
61-017 POZNAN, POLAND',
      N'',
      N'',
      N'BY T.T.R 60 DAYS AFTER B/L DATE',
      N'STANDARD EXPORT PACKING BY GPS',
      N'T. Fujioka
Senior Executive Vice President
Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        'b28d08bf-89ea-48a3-ef09-89040217a66b'
      ),
      N'SHIP-COOPER-KUNSHAN',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND
ATTN.: T. Fujioka / SEVP',
      N'',
      N'UBE EUROPE GMBH',
      N'Cooper (Kunshan) Tire Co., Ltd.',
      N'BY T.T.R 105 DAYS AFTER B/L DATE',
      N'STANDARD EXPORT PACKING',
      N'Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '4555f3b3-ac79-2ff4-9b00-f96db6e433aa'
      ),
      N'SHIP-BRIDGESTONE-BRASIL',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND
ATTN.: T. Fujioka / SEVP',
      N'BRIDGESTONE DO BRASIL
AV.QUEIROS DOS SANTOS 1717
SANTO ANDRE-09015-901-SAO PAULO-BRAZIL
CNPJ:57497539/0001-15
TEL:(011)4433-1666 FAX(011)4433-1187
Mr.Paulo',
      N'',
      N'',
      N'BY T.T.R 45 DAYS AFTER B/L DATE',
      N'STANDARD EXPORT PACKING BY GPS',
      N'T. Fujioka
Senior Executive Vice President
Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        'ebae679f-0c09-1bdc-0de2-b910e6feb789'
      ),
      N'SHIP-BRIDGESTONE-TATABANYA',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND
ATTN.: T. Fujioka / SEVP',
      N'Bridgestone Tatabanya Manufacturing Ltd.
H-2851 Korneye, Kohid u. 1.
ATTN:Erika Gulyas
TEL +36 30 696 0061 FAX:+36.34.521.200',
      N'',
      N'',
      N'BY T.T.R 60 DAYS AFTER B/L DATE',
      N'STANDARD EXPORT PACKING BY GPS',
      N'T. Fujioka
Senior Executive Vice President
Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '3dc3ad32-371e-0a2c-5de7-b44730db278f'
      ),
      N'SHIP-MICHELIN-SHENYANG',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND',
      N'Michelin Shenyang Tire Co.,Ltd
No.12,Xihesi North Street,Shenyang Economic
and Technological Development Area,Shenyang,
Liaoning,P.R.China .110142
Tel:+8624 8603 5105 Fax:86-24-25176770',
      N'',
      N'Michelin Shenyang Tire Co.,Ltd',
      N'BY T.T.R 135 DAYS AFTER B/L DATE',
      N'STANDARD EXPORT PACKING',
      N'Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '441865e4-aace-32da-06ce-cc8d8d5560b9'
      ),
      N'SHIP-SHANGHAI-MICHELIN',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND',
      N'Shanghai Michelin Tire Co.,Ltd.
NO.2915 JIANCHUAN ROAD, MIN HANG DEVELOPMENT ZONE,
SHANGHAI, 201111 P.R.CHINA
Tel:+86 21 3405 4888 Fax:54723540
Ms.Jun You',
      N'',
      N'Shanghai Michelin Tire Co.,Ltd.',
      N'BY T.T.R 135 DAYS AFTER B/L DATE',
      N'STANDARD EXPORT PACKING',
      N'Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '01a9c1ce-c7f3-fccd-ef13-6c994706f814'
      ),
      N'SHIP-GOODYEAR-DUNLOP-AMIENS',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND
ATTN.: T. Fujioka / SEVP',
      N'GOODYEAR DUNLOP TIRES
60 AV ROGER DUMOULIN
80030 AMIENS
FRANCE',
      N'UBE EUROPE GMBH',
      N'GOODYEAR AMIENS SUD',
      N'BY T.T.R 105 DAYS AFTER B/L DATE',
      N'STANDARD EXPORT PACKING',
      N'Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '787bd6cd-fc8c-4d56-9535-82a4f3e7fe73'
      ),
      N'SHIP-GOODYEAR-BRASIL',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND
ATTN.: T. Fujioka / SEVP',
      N'Goodyear do Brasil Produtos de Borracha Ltda.
Av. Affonso Pansan, 3415 (Anhanguera, KM 128)
13473-620 Vila Bertini - Americana City
Sao Paulo State / Brazil
CNPJ 60.500.246/0016-30',
      N'UBE EUROPE GMBH',
      N'GOODYEAR DO BRASIL PRODUTOS DE BORRACHA LTDA',
      N'BY T.T.R 105 DAYS AFTER B/L DATE',
      N'STANDARD EXPORT PACKING',
      N'Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '5ed43f5d-e149-690a-d7e1-da788d52a7df'
      ),
      N'SHIP-SUMITOMO-BRASIL',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND
ATTN.: T. Fujioka / SEVP',
      N'SUMITOMO RUBBER DO BRASIL LTDA
R.FRANCISCO FERREIRA DA CRUZ 4656
83820293 FAZENDA RIO GRANDE-PR-PAR
BRAZIL
CNPJ:13.816.470/0001-70',
      N'UBE EUROPE GMBH',
      N'',
      N'BY T.T.R 60 DAYS AFTER B/L DATE',
      N'GPS',
      N'T. Fujioka
Senior Executive Vice President
Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '66e585ba-71e5-4b95-f848-46a2d7a75483'
      ),
      N'SHIP-SUMITOMO-SOUTH-AFRICA',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND
ATTN.: T. Fujioka / SEVP',
      N'Sumitomo Rubber South Africa (Pty) Ltd
Attention : Lorna Bandoraho
Lion Match Office Park
The Old Factory Building
892 Umgeni Road
Durban 4001
Kwazulu Natal
South Africa
Tel: +27-31-2421111',
      N'UBE EUROPE GMBH',
      N'',
      N'BY T.T.R 90 DAYS AFTER B/L DATE',
      N'GPS',
      N'T. Fujioka
Senior Executive Vice President
Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '8298d027-fee6-4063-a574-f5520186ecf6'
      ),
      N'SHIP-SUMITOMO-HUNAN',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND
ATTN.: T. Fujioka / SEVP',
      N'Sumitomo Rubber (Hunan) CO.LTD
No.1318 Liangtang East Road, Changlong street,
Changsha county, Changsha city,
Hunan province, China
TEL:0086-731-86407006-1229',
      N'',
      N'',
      N'BY T.T.R 90 DAYS AFTER B/L DATE',
      N'STANDARD EXPORT PACKING',
      N'T. Fujioka
Senior Executive Vice President
Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        'dcd4f2f9-6a9e-73da-792b-29741061f98b'
      ),
      N'SHIP-TOYO-MALAYSIA',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND
ATTN.: T. Fujioka / SEVP',
      N'Toyo Tyre Malaysia Sdn Bhd
PT23101, Jalan Tembaga Kuning
Kawasan Perindustrian Kamunting Raya
PO Box 1, 34600, Kamunting, Perak. Malaysia
Contact Person: Ms Lim / Ms Yap
Tel: 605-8206669 Fax: 605-8206659',
      N'',
      N'',
      N'BY T.T.R 30 DAYS AFTER B/L DATE',
      N'GPS',
      N'T. Fujioka
Senior Executive Vice President
Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        'd3dc058c-e4b7-9bb7-2a05-1c6c5dfed895'
      ),
      N'SHIP-HENGDASHENG-TOYO',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND
ATTN.: T. Fujioka / SEVP',
      N'HENGDASHENG TOYO TIRE(ZHANGJIAGANG) CO., LTD.
58,DONGHAI ROAD, YANGTZE INTERNATIONAL CHEMICAL
INDUSTRIAL PARK, ZHANGJIAGANG, JIANGSU, CHINA
CONTACT PERSON: Lili Yu E-MAIL: yulili@toyotiresz.com
TEL:0512-3500-7124',
      N'',
      N'',
      N'BY T.T.R 60 DAYS AFTER B/L DATE',
      N'STANDARD EXPORT PACKING',
      N'T. Fujioka
Senior Executive Vice President
Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        'cc8ae311-dc53-cf48-2cb8-e5dc74f024a5'
      ),
      N'SHIP-TOYO-TIRE-NA',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND
ATTN.: T. Fujioka / SEVP',
      N'TOYO TIRE NORTH AMERICA MANUFACTURING INC.
3660 Highway 411 NE
White, GA 30184
ATTN: SUSAN WOOD',
      N'',
      N'',
      N'BY T.T.R 60 DAYS AFTER B/L DATE',
      N'STANDARD EXPORT PACKING',
      N'T. Fujioka
Senior Executive Vice President
Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '3662a2c1-5985-f7b7-ac77-5321eef5a0d4'
      ),
      N'SHIP-BRIDGESTONE-INDIA',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND
ATTN.: T. Fujioka / SEVP',
      N'Bridgestone India Private Limited
PLOT NO. A-43, PHASE-II, MIDC CHAKAN
VILLAGE SAWARDARI, TALUKA KHED, DIST. PUNE,
MAHARASHTRA - 410 501, INDIA
TEL: +91.2135.672.000
IEC NO. 0396013341/GSTIN Number 27AABCB2304E1ZD',
      N'',
      N'',
      N'BY T.T.R 60 DAYS AFTER B/L DATE',
      N'One Way Box',
      N'T. Fujioka
Senior Executive Vice President
Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '80f7252f-1a03-3f30-43ee-006cd2ba16e7'
      ),
      N'SHIP-BRIDGESTONE-SA',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND
ATTN.: T. Fujioka / SEVP',
      N'BRIDGESTONE SA (PTY) LTD
189 GRAHAMSTOWN ROAD, DEAL PARTY,
PORT ELIZABETH, 6001, SOUTH AFRICA
ATTN:SHIPPING DEPT
PO BOX 992 PORT ELIZABETH, 6000',
      N'',
      N'',
      N'BY T.T.R 90 DAYS AFTER B/L DATE',
      N'GPS',
      N'T. Fujioka
Senior Executive Vice President
Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '43c87958-3072-16f9-f21d-946d953b51ff'
      ),
      N'SHIP-BRISA-TURKEY',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND
ATTN.: T. Fujioka / SEVP',
      N'BRISA BRIDGESTONE SABANCI LASTIK SANAYI VE TICARET A.S.
Alikahya Fatih Mah.Sanayi Cad.No:98
41310 Izmit / KOCAELI Turkey
Contact Person: BURCU YUZUAK
Phone: +90 (262) 316 57 53',
      N'',
      N'',
      N'BY T.T.R 45 DAYS AFTER B/L DATE',
      N'GPS',
      N'T. Fujioka
Senior Executive Vice President
Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        'fcaedf0e-b080-0a41-877a-133beac286db'
      ),
      N'SHIP-BRIDGESTONE-FIRESTONE-WILSON',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND
ATTN.: T. Fujioka / SEVP',
      N'Bridgestone Firestone NT Wilson Plant
Triangle East Storage 2010 Baldree Road Wilson
NC27893 USA
TEL: 252-246-7630 FAX: 252-246-7315
ATTN: Jeff Pyle',
      N'',
      N'',
      N'BY T.T.R 90 DAYS AFTER B/L DATE',
      N'METAL BOX',
      N'T. Fujioka
Senior Executive Vice President
Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '17f2c5d1-bdc3-0780-48c2-aca441673851'
      ),
      N'SHIP-BRIDGESTONE-WUXI',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND
ATTN.: T. Fujioka / SEVP',
      N'BRIDGESTONE (WUXI) TIRE CO.,LTD.
No.67, XINMEI ROAD, WUXI NATIONAL HIGH-NEW
TECHNICAL INDUSTRIAL DEVELOPMENT ZONE,
WUXI 214028, JIANGSU, CHINA
FAX:86-0510-8532-2199 TEL:86-0510-8532-2288',
      N'',
      N'',
      N'BY T.T.R 60 DAYS AFTER B/L DATE',
      N'GPS',
      N'T. Fujioka
Senior Executive Vice President
Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '98c4d9fc-8a2c-36ed-3b71-8d402ed59967'
      ),
      N'SHIP-PT-BRIDGESTONE',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND
ATTN.: T. Fujioka / SEVP',
      N'PT. BRIDGESTONE TIRE INDONESIA
Kawasan Industri Surya Cipta Jl. Surya Utama Kav 8-13,
Kutamekar, Ciampel, Kab. Karawang, Jawa Barat, 41363
Phone No.: (+62-267) 440 201
NPWP No. 0010 0011 8809 2000',
      N'',
      N'',
      N'BY T.T.R 30 DAYS AFTER B/L DATE',
      N'GPS',
      N'T. Fujioka
Senior Executive Vice President
Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '03f6a269-7ab2-8e5e-9ae6-768bc32cc453'
      ),
      N'SHIP-BRIDGESTONE-TAIWAN',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND
ATTN.: T. Fujioka / SEVP',
      N'BRIDGESTONE TAIWAN CO.,LTD.
No.1-1, Wenhua Rd, Hukou Township
Hsinchu County 30352 Taiwan (R.O.C.)
PHONE:886-35-981621',
      N'',
      N'',
      N'BY T.T.R 10 DAYS AFTER B/L DATE',
      N'GPS',
      N'T. Fujioka
Senior Executive Vice President
Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '5f82ad77-0a70-715a-b6fd-9d479b266cc4'
      ),
      N'SHIP-BRIDGESTONE-MEXICO',
      N'THAI SYNTHETIC RUBBERS CO., LTD.
18th Floor, Sathorn Square Office Tower,
98 North Sathorn Road,
Silom, Bangrak, Bangkok 10500,
THAILAND
ATTN.: T. Fujioka / SEVP',
      N'PLEASE REFER TO THE SI',
      N'',
      N'',
      N'BY T.T.R 90 DAYS AFTER B/L DATE',
      N'STANDARD EXPORT PACKING',
      N'T. Fujioka
Senior Executive Vice President
Thai Synthetic Rubbers Co., Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    )
) AS source (
  PoTemplateId,
  ShipToCode,
  ToBlock,
  ConsigneeNotify,
  Agent,
  EndUser,
  TermsOfPayment,
  PackingInstructions,
  ConfirmBy,
  CreatedAt,
  UpdatedAt
) ON target.ShipToCode = source.ShipToCode WHEN MATCHED THEN
UPDATE
SET
  target.ToBlock = source.ToBlock,
  target.ConsigneeNotify = source.ConsigneeNotify,
  target.Agent = source.Agent,
  target.EndUser = source.EndUser,
  target.TermsOfPayment = source.TermsOfPayment,
  target.PackingInstructions = source.PackingInstructions,
  target.ConfirmBy = source.ConfirmBy,
  target.UpdatedAt = source.UpdatedAt WHEN NOT MATCHED BY TARGET THEN INSERT (
    PoTemplateId,
    ShipToCode,
    ToBlock,
    ConsigneeNotify,
    Agent,
    EndUser,
    TermsOfPayment,
    PackingInstructions,
    ConfirmBy,
    CreatedAt,
    UpdatedAt
  )
VALUES
  (
    source.PoTemplateId,
    source.ShipToCode,
    source.ToBlock,
    source.ConsigneeNotify,
    source.Agent,
    source.EndUser,
    source.TermsOfPayment,
    source.PackingInstructions,
    source.ConfirmBy,
    source.CreatedAt,
    source.UpdatedAt
  );

-- SI templates
MERGE dbo.SiTemplate AS target USING (
  VALUES
    (
      CONVERT(
        uniqueidentifier,
        '8ebda164-57d4-4be5-631d-2975b006fbf1'
      ),
      N'SHIP-BRIDGESTONE-POZNAN',
      N'MR.T. Fujioka /SEVP
THAI SYNTHETIC RUBBERS
CO., LTD.',
      N'D.KAWAMORI/UEDA
UBE Elastomer Co. Ltd.
TEL:81-3-5419-6167
FAX:81-3-5419-6250',
      N'BS POLAND PO No.:',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'BRIDGESTONE POZNAN SP/ZO.O',
      N'GDYNIA POLAND',
      N'TSL',
      N'ITHACA V.111S',
      N'ONE SATISFACTION V.001W',
      N'OCEAN NETWORK EXPRESS PTE LTD. C/O',
      N'DIRECT',
      N'',
      N'BRIDGESTONE POZNAN SP/ZO.O.',
      N'',
      N'',
      N'No need original courier.',
      N'PL782205233400000',
      N'',
      N'SAME AS CONSIGNEE',
      N'',
      N'',
      N'',
      N'* FULL SET OF surrendered B/L.
* Pls mark BSEU code "HB12-B" and "5500070292"on all document
* Certificate of Origin issued by manufacturer
* Certificate of Analysis marked BS material code and PO number
issued by manufacturer
* Declaration of non coniferous wood packing materials" issued by manufacturer
* General Insurance policy is accepted.
( TSL don''t need to send the insurance policy together with shipping documents)',
      N'*Please send all original docs and COMMERCIAL IV (between UBE and TSL) by PDF copies by E-mail to UBE Tokyo.
*NO need original courier to BS and UBE Tokyo.                      ? Changed !!',
      N'',
      N'',
      N'POLYBUTADIENE RUBBER
HB12-B / UBEPOL VCR412',
      N'',
      N'SHIPPING MARK
BRIDGESTONE POZNAN SP/ZO.O
GDYNIA
ORDER:5500070292
HB12-B/UBEPOL VCR412
C/NO.1-15
MADE IN THAILAND',
      N'UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '5be406ef-a641-ebd5-03a7-4080b50bf914'
      ),
      N'SHIP-BRIDGESTONE-BRASIL',
      N'MR.T. Fujioka/SEVP
THAI SYNTHETIC RUBBERS
CO., LTD.
FAX:66-2-685-3056',
      N'KAWAMORI/UEDA
UBE Elastomer Co. Ltd.
TEL:81-3-5419-6167
FAX:81-3-5419-6250',
      N'BS BRASIL PO No.',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'BRIDGESTONE BRASIL',
      N'SANTOS, BRAZIL',
      N'TSL',
      N'ONE GRUS V.023E',
      N'EVER LOTUS V.1571-060W',
      N'YANGMING',
      N'MERCURIAL',
      N'',
      N'BRIDGESTONE DO BRASIL INDUSTRIA E COMERCIO LTDA.
AV.QUEIROS DOS SANTOS 1717
SANTO ANDRE-09015-901-SAO PAULO-BRAZIL
CNPJ:57497539/0001-15   ATTN:Mr.Paulo
TEL:(011)4433-1666 FAX(011)4433-1187
E-mail ?ImportacaoLASRM@la-bridgestone.com
E-mail ? impo-bridgestone@nelsonheusi.com.',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'BRIDGESTONE DO BRASIL IND. E COM. LTDA.
Av. Jornalista Roberto Marinho, 85
Tower Bridge Corporate – 18º. Floor
04576-010 – São Paulo - SP – BRAZIL
ATT: Dept. COMEX – Thatielen Bastos
Phone 55-11-4433-1634
E-mail ?ImportacaoLASRM@la-bridgestone.com
E-mail ? impo-bridgestone@nelsonheusi.com.
CNPJ 57.497.539/0024-01',
      N'',
      N'',
      N'',
      N'* FULL SET OF CLEAN OCEAN B/L 3 ORIGIANAL +4 COPIES(issued at destination)
*PLEASE SHOW THE FOLLOWING WORDS ON DESCRIPTION OF  B/L
(CNPJ: 57.497.539/0001-15 (when is for Santos Port) and
(CNPJ: 57.497.539/0007-00 (when is for Salvador Port).
(NCM CODE (HARMONIZED SYSTEM);4002 <=only 4 number
(INVOICE NO.4900001722(ITEM10))
*"NCM code for empty packages : 7326" on B/L<=only 4 number
* Pls mark BSBR code "EC050A(AA2646)" and " PO NO.4900001722 on all document
* 2 original (Full set)of Certificate of Origin issued by CHAMBER OF COMMERCE
* 3 original of Certificate of Analysis marked BS material code and PO number
issued by manufacturer
* two copies of Declaration of non coniferous wood packing materials issued by manufacturer
?Please write the manufacturing date on the Packing List.
*please try to get 21days free time and pls. show it on BL(if you can)
All documents must signed by hand in blue ink indicating name and title of person signing',
      N'*PLASE SEND ALL ORIGINAL DOCS EXCEPT COMMERCIAL CIF I/V(TSL-UBE) TO BS BRASIL DIRECLTY(PLS REFER ABOVE ADDRESS)
*PLASE SEND US ALL DOCS PDF COPIES BY E-MAIL, NO NEED TO SEND  BY COURIER TO US',
      N'',
      N'',
      N'SYNTHETIC RUBBER UBE 150 L BRIDGESTONE
FIRSTONE COMMON CODE:EC050A(AA2646)',
      N'NCM:4002
"NCM code for empty packages : 7326" on B/L
(CNPJ:57497539/0001-15)
INVOICE NO.',
      N'SHIPPING MARK
BRIDGESTONE DO BRASIL IND. COM.
LTDA
SAO PAULO-BRAZIL
SHIP:SANTOS
ORDER NO.:4900001722
EC050
MADE IN THAILAND
PRODUCER:THAI SYNTHETIC RUBBER
ATTN:Dept. COMEX – Thatielen Bastos
TELL:55-11-4433-1634
COM:BRIDGESTONE DO BRASIL
INDUSTRIA E COMERCIO LTDA.
ADD:Av. Jornalista Roberto Marinho, 85
Tower Bridge Corporate – 18º. FL Cidade Monções
04576-010 – São Paulo - SP – BRAZIL
ZIP CODE;04576-010, CNPJ;57.497.539/0024-01
BRIDGESTONE DO BRASIL IND. E COM. LTDA.
Av. Jornalista Roberto Marinho, 85
Tower Bridge Corporate – 18º. Floor
04576-010 – São Paulo - SP – BRAZIL
ATT: Dept. COMEX – Thatielen Bastos
Phone 55-11-4433-1634
E-mail ?ImportacaoLASRM@la-bridgestone.com
E-mail ? impo-bridgestone@nelsonheusi.com.
CNPJ 57.497.539/0024-01',
      N'UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '953e416e-9052-be93-0f62-fd9478da14b0'
      ),
      N'SHIP-BRIDGESTONE-TATABANYA',
      N'MR.T. Fujioka /SEVP
THAI SYNTHETIC RUBBERS
CO., LTD.',
      N'D.KAWAMORI/UEDA
UBE Elastomer Co. Ltd.
TEL:81-3-5419-6167
FAX:81-3-5419-6250',
      N'BS TATABANYA PO No.:',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'BRIDGESTONE HUNGARY',
      N'HUNGARY',
      N'TSL',
      N'PELICAN V.073S',
      N'ONE HELSINKI V.063W',
      N'OCEAN NETWORK EXPRESS PTE. LTD.',
      N'DIRECT',
      N'',
      N'Bridgestone Tatabanya Manufacturing Ltd.',
      N'',
      N'',
      N'',
      N'HU0002515281',
      N'',
      N'SAME AS CONSIGNEE',
      N'',
      N'',
      N'',
      N'* SEA WAY BILL is required.
* Pls mark BSEU code "HB12" and "5500069106"on all document
* Certificate of Origin issued by CHAMBER OF COMMERCE
* Certificate of Analysis marked BS material code and PO number
issued by manufacturer
* Declaration of non coniferous wood packing materials issued by manufacturer
* General Insurance policy is accepted.
( TSL don''t need to send the insurance policy together with shipping documents)
*MSDS',
      N'**Please e-mail ALL docs and  CIF COMMERCIAL IV (between UBE and TSL) by PDF copies to UBE Tokyo.
*NO need original courier to BS and UBE Tokyo if SEA WAY BILL.',
      N'',
      N'',
      N'POLYBUTADIENE RUBBER
HB12/ UBEPOL VCR412',
      N'',
      N'SHIPPING MARK
BRIDGESTONE TATABANYA
TERMELO Kft
ORDER NO:5500069106
HB12/UBEPOL VCR412
C/NO.1-16
MADE IN THAILAND',
      N'UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '4ffa3fcc-263c-33db-8e23-620c33e32024'
      ),
      N'SHIP-MICHELIN-SHENYANG',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'MICHELIN SHENYANG TIRE CO.',
      N'SHENYANG, CHINA',
      N'FULL CONTACT DETAIL OF TSL
*WITH TRADE RESISTRATION NO.',
      N'',
      N'',
      N'',
      N'',
      N'LAEM CHABANG, THAILAND',
      N'Michelin Shenyang Tire Co.,Ltd
No.12,Xihesi North Street,Shenyang Economic
andTechnologicalDevelopment Area,Shenyang ,
Liaoning,P.R.China .110142
( Tel:+ 8624 8603 5105    Fax: 86-24-25176770/25176762)
USCI:912101066046211235
ATTN:SY2 PUR department /Suning. Wang. E-Mail: suning.wang@michelin.com',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'SAME AS CONSIGNEE',
      N'',
      N'',
      N'',
      N'*NO NEED TO DISPATCH THE ORIGINAL DOCS. EXCEPT FORM E, PDF FILES OF ORIGINAL ARE ENOUGH.
*PLEASE COURIER ORIGINAL FULL SET OF FORME TO MSC SHENYANG
*PDF OF BL AND FORM-E MUST BE SCAN OF THE ORIGINAL WITH COLORED
*Please issue P/L,Surrendered B/L,CoA,I/P(No need I/P cert. for each shipment).
(showing"returnable metal boxes "  on B/L)
*please issue PROFORMA I/V and P/L for  box only
*please issue Full set of FORM-E WITH UBE INVOICE  (H.S.CODE:40022090
(PLEASE INFORM US FORM-E THIRD PARTY INV''S DETAILS)
*Please  issue TSL FOB CUSTOM  I/V for From-E
*PLEASE SHOW "PG CODE: PG02596AD" AND "MFD CODE:MFD1308561A" ON ALL DOCS.',
      N'*Please send ALL ORIGINAL DOCS.PDF COPIES BY E-MAIL to UEC Matsumoto.
*don''t need to include our third party Invoice in your all DOC. PDF.',
      N'MSC SHENYANG
Courier address
*In case original Form-E
need to be dispatched',
      N'Michelin Shenyang Tire Co., LTD
NO.12 XI HE SI BEI Street SHENYANG ECONOMIC & TECHNOLOGICAL?
DEVELOPMENT AREA (SEDA)Shenyang, Liaoning Province, CHINA
ZIP CODE:110142 OR 110141            ATTN:ATTN:Suning. Wang./ + 8624 8603 5105',
      N'POLYBUTADIENE RUBBER
UBEPOL BR150L',
      N'',
      N'SHIPPING MARK
NAME OF SUPPLIER : TSL
UBEPOL BR150L
MICHELIN''S ORDER NUMBER :5910244622
MATERIAL CODE:
PG CODE: PG02596AD
MFD CODE:MFD1308561A
LOT NO.
DATE OF FABRICATION:
QUANTITY:20.16MTS
MADE IN THAILAND
NO.1-UP',
      N'UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '74c36cb4-3821-26de-f8d9-a893012a7fef'
      ),
      N'SHIP-SHANGHAI-MICHELIN',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'SHANGHAI MICHELIN TIRE CO., LTD.',
      N'SHANGHAI, CHINA',
      N'FULL CONTACT DETAIL OF TSL
*WITH TRADE RESISTRATION NO.',
      N'',
      N'',
      N'',
      N'',
      N'LAEM CHABANG, THAILAND',
      N'Shanghai Michelin Tire Co.,Ltd.
NO. 2915 JIAN CHUAN ROAD, MIN HANG DEVELOPMENT
ZONE, SHANGHAI, 201111 P.R.CHINA Ms.Jun You
Tel: +86 21 3405 4888 *3226
Fax:54723540 or 86 21 3372 7711 *226
USCI:91310000607429866C E-MAIL
:jun.you@michelin.com',
      N'',
      N'',
      N'Attn:Bilin-san and Jun-san
tel:0086-21-3405488
SHANGHAI MICHELIN WARRIOR TIRE
NO.2915 JIANCHUAN ROAD, MIN HANG
DEVELOPMENT ZONE,
SHANGHAI
CHINA zip code 201111',
      N'',
      N'',
      N'SAME AS CONSIGNEE',
      N'',
      N'',
      N'SAME AS CONSIGNEE',
      N'*NO NEED TO DISPATCH THE ORIGINAL DOCS.  BY COURIER, PDF FILES OF ORIGINAL ARE ENOUGH.
*PDF OF BL AND FORM-E MUST BE SCANED OF THE ORIGINAL WITH COLORED
*Please issue P/L,Surrendered B/L and arrange I/P(No need cert. for each shipment).
*Please issue the original FORM-E  WITH TSL FOB Custom I/V.
*Please issue of TSL FOB CUSTOM I/V for Form-E
(please mark net weight (xx.xxxTON) on the form-E  ( 7 Column ) .
*Please issue  CoA(and show NIF code  01406 on CoA)
*Please issue  Declaration of No-Wood Packing Material
*Please issue  the proforma I/V AND P/L for boxes.
*Please apply Shipping Line to extend D/M & D/T Free Time each 14days.',
      N'*Please send ALL ORIGINAL DOCS.(including TSL commercial INV) PDF COPIES BY E-MAIL to UEC Matsumoto.
*Please keep the original Form-E 2 for 2 months after ETD.',
      N'',
      N'',
      N'SYNTHETIC RUBBER
UBEPOL BR150L',
      N'',
      N'SHIPPING MARK
NAME OF SUPPLIER : TSL
BR150L
MICHELIN''S ORDER NUMBE.:5400138582
MATERIAL NO. PG02596AD/NIF code 01406 .
LOT:NO.
DATE OF FABRICATION:
QUANTITY:20.16MTS
MADE IN THAILAND
NO.1-UP',
      N'Overseas Sales Group
UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '6dd2cbff-5615-6b02-47cc-92214e12b611'
      ),
      N'SHIP-COOPER-KUNSHAN',
      N'',
      N'',
      N'UEG PO No.',
      N'Cooper NO.:',
      N'72026877',
      N'Material Code',
      N'SMITHIC on grade label',
      N'*put marking CODE on both sides of GPS box',
      N'Cooper (Kunshan) Tire Co,. Ltd',
      N'CHINA',
      N'FULL CONTACT DETAIL OF TSL
WITH TRADE RESISTRATION NO.',
      N'',
      N'',
      N'',
      N'',
      N'LAEM CHABANG, THAILAND',
      N'Cooper (Kunshan) Tire Co., Ltd.
No. 168 Bailing Road, Kunshan Development
Zone, Jiangsu Province
215331 Kunshan, Jiangsu Province
CHINA
Contact: Maggie Pan (Import/Export Dept)
Tel: +86- 0512 5772-7609
maggie_pan@goodyear.com
USCI?91320583772033662N',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'Cooper (Kunshan) Tire Co., Ltd.
No. 168 Bailing Road, Kunshan Development
Zone, Jiangsu Province
215331 Kunshan, Jiangsu Province
CHINA
Contact: Maggie Pan (Import/Export Dept)
Tel: +86- 0512 5772-7609
maggie_pan@goodyear.com
peyton_shan@goodyear.com',
      N'',
      N'',
      N'Cooper (Kunshan) Tire Co., Ltd.
No. 168 Bailing Road, Kunshan Development
Zone, Jiangsu Province
215331 Kunshan, Jiangsu Province
CHINA
Contact: Maggie Pan
Tel: +86- 0512 5772-7609',
      N'*SWB,P/L,I/P,CoA
*I/V AND P/L FOR BOX
*FULL SET OF ORIGINAL FORM-E(WITH TSL INVOICE)
* COOPER PO NO.AND   Material Code: SMITHIC,  SHOULD BE ON ALL DOCS.
*NO NEED TO ISSUE I/P CERTIFICATE FOR THIS SHIPMENT
*PLEASE DISPATCH FULL SET OF ORIGINAL  FORM-E, customs INV TO UEG,
FOR OTHER DOCS, YOU DON''T NEED TO DISPATCH.
*Please send all original docs. copies( COLORED PDF) by email to UEG and UEC, and send UEC INV+BL copies separately.',
      N'',
      N'',
      N'',
      N'SYNTHETIC RUBBER',
      N'',
      N'SHIPPING MARK
Cooper (Kunshan) Tire Co,. Ltd
Cooper PO# No.72026877
Lot No.
Quantity:    kg
Material Code:SMITHIC
Country of Origin: Thailand
Production Date:
Expiry Date:',
      N'Overseas Sales Group
UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        'a8b737b6-bb66-3277-0317-461a8d6f1237'
      ),
      N'SHIP-GOODYEAR-DUNLOP-AMIENS',
      N'',
      N'',
      N'UEG PO No.',
      N'GY PO NO.:',
      N'8210256629',
      N'GOODYEAR CODE',
      N'ESTHERIC on grade label',
      N'*put marking CODE on both sides of Goodpack box',
      N'GOODYEAR DUNLOP TIRES',
      N'FRANCE',
      N'TSL /UBE EUROPE GMBH',
      N'',
      N'',
      N'',
      N'',
      N'LAEM CHABANG, THAILAND',
      N'GOODYEAR OPERATIONS SA.
Amiens plant
AVENUE GORDON SMITH
7750  COLMAR-BERG
LU -  LUXEMBOURG',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'PSA BDP INTERNATIONAL LOJISTIK
ANONIM SIRKETI
MASLAK MAHALLESI, SAAT SOKAK
SPINE TOWER SITESI NO:5, IC KAPI NO:48,
KAT:3
34398 SARIYER ISTANBUL,TURKEY
+90 (212) 346-0601
Contact email: goodyear-ofimp.llptr@bdpint.com
Sar?yer V.D tax number 7331238168',
      N'',
      N'',
      N'GOODYEAR AMIENS SUD
60 AV ROGER DUMOULIN
80030 AMIENS
FRANCE',
      N'*SWB, P/L, CoA,I/P',
      N'*NO NEED TO ISSUE I/P CERTIFICATE FOR THIS SHIPMENT
*NO NEED TO DISPATCH ANY DOCS. TO UEG
*Please send all original docs. copies( COLORED PDF) by email to UEG and UEC, and send UEC INV+BL copies separately.',
      N'',
      N'',
      N'SYNTHETIC RUBBER',
      N'',
      N'SHIPPING MARK
DUNLOP
AMIENS
UBEPOL VCR412
GOODYEAR CODE:ESTHERIC
GY PO NO.  8210256629
C/NO. 1-UP',
      N'Overseas Sales Group
UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '69556fce-f158-64b7-3555-40d8bdad0c83'
      ),
      N'SHIP-GOODYEAR-BRASIL',
      N'',
      N'',
      N'UEG PO No.',
      N'GY PO NO.:',
      N'4500477572',
      N'GOODYEAR CODE:',
      N'SMITHIC on grade label',
      N'*put marking CODE on both sides of Goodpack box',
      N'GOODYEAR DUNLOP TIRES',
      N'BRASIL',
      N'TSL ON BEHALF OF  UBE EUROPE GMBH',
      N'',
      N'',
      N'',
      N'',
      N'LAEM CHABANG, THAILAND',
      N'Goodyear do Brasil Produtos
de Borracha Ltda.
Av. Affonso Pansan, 3415 (Anhanguera, KM 128)
13473-620 Vila Bertini - Americana City
Sao Paulo State / Brazil
CNPJ 60.500.246/0016-30
Attn.: Mrs. Cassia Rodrigues
cassia_rodrigues@goodyear.com
Tel.:+55 19 2109-1708',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'S. Magalhaes S.A. Logistica em
Comercio Exterior
Praca da Republica, 62- 2nd Floor
11013-010 Santos, SP/ Brasil
CNPJ 58.130.089/0001-90
A/C: Giselia Oliveira and Wilson Carlos
E-Mail: importgy@smagalhaes.com.br',
      N'',
      N'',
      N'Goodyear do Brasil Produtos de Borracha Ltda.
Av. Affonso Pansan, 3415 (Anhanguera, KM128)
Vila Bertini – Americana City
São Paulo State/Brazil
Zip Code 13473-620
CNPJ 60.500.246/0016-30
Attn.: Fernanda Duarte
fernanda_duarte@goodyear.com
Tel.:+55 19 2109-1672',
      N'*FULL SET OF ORIGIAL B/L
(PLEASE SHOW FREIGHT VALUE ON BL)
*P/L, I/P, COA
*I/V for Returnable Metal box(INV including packing details)
(Please be shown Container No. and Lot No. on P/L)',
      N'*Please show material NCM NO.4002.20 on BL and P/L.
*Please show Box NCM NO.7309.00(GPS) on BL(In case of returnable Box, )
*Plesae send all docs.Draft to UEG (CC;KIKUCHI)before issue the original doc.
*All documents must signed by hand in blue ink indicating name and title of person signing
*Please dispatch the full set of  ORIGINAL BL to UEG, for other docs  PDF COPIES are enough.
*Please send all original docs. copies(COLORED PDF) by email to UEG and UEC, and send UEC INV+BL copies separately.',
      N'',
      N'',
      N'POLYBUTADIENE RUBBER',
      N'',
      N'GOODYEAR DO BRASIL
PRODUTOS
GY P.O.: NO.4500477572
UBEPOLVCR617
MATERIAL CODE:SMITHIC
C/NO. 1-UP
PRODUCTION DATE:
LOT.NO:',
      N'Overseas Sales Group
UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        'dc51c253-b2d7-9670-6907-342517a00bd3'
      ),
      N'SHIP-SUMITOMO-BRASIL',
      N'T.FUJIOKA / SEVP
THAI SYNTHETIC RUBBERS
CO., LTD.
FAX:66-2-685-3056',
      N'S.OKUNI/H.UEDA
UBE Elastomer Co. Ltd.
TEL:81-3-5419-6167
FAX:81-3-5419-6250',
      N'UEG PO No.',
      N'SUMITOMO PO NO.:',
      N'100752',
      N'',
      N'',
      N'',
      N'SUMITOMO RUBBER BRASIL',
      N'BRASIL',
      N'TSL /UBE EUROPE GMBH',
      N'SINAR BAJO V.110S',
      N'CMA CGM BUZIOS V.0010W',
      N'PACIFIC INTERNATIONAL LINES (PRIVATE ) LIMITED C/O PIL SHIPPING (THAILAND)LTD.',
      N'DLT',
      N'LAEM CHABANG, THAILAND',
      N'SUMITOMO RUBBER DO BRASIL LTDA
R.FRANCISCO FERREIRA DA CRUZ 4656
83820293 FAZENDA RIO GRANDE-PR-PAR
BRAZIL CONTACT:EMANUELA BECHLIN,
EMANUELA BECHLIN, JEISELAINE KOZAN
TEL:+55 41 3060-9250 EXT.1115
TEL:+55 41 3060-9250 EXT.1112
CNPJ:13.816.470/0001-70',
      N'',
      N'21 DAYS FREE TIME',
      N'',
      N'',
      N'',
      N'SUMITOMO RUBBER DO BRASIL LTDA
CNPJ:13.816.470/0001-70 AV.FRANCISCO
FERREIRA DA
CRUZ,4656 BAIRRO:EUCALIPTUS-FAZENDA
RIO GRANDE-PR
BRASIL CEP:83.820-293 AC:VITOR MELLO
E-MAIL:vitor.mello@dunloppneus.com.br
TEL:+55 41 3060-9250/EXT:1168
ID:55*57344*107',
      N'',
      N'',
      N'',
      N'*ALL DOCS MUST BE SIGNED IN BLUE INK PEN
*Handwritten amendments are not acceptable.
* ISSUANCE OF THE ORIGINAL B/L AT DESTINATION(BRAZIL)SHOWING FREIGH COSTS
( For B/L details, please refer to the  "sumitomo document checklist")
*COLOR SCAN OF B/L COPY
*PACKING LIST
( For details, please refer to the  "sumitomo document checklist" )
*INVOICE FOR METAL BOX FOR CUSTOMS PURPOSES ONLY.
( For details, please refer to the  "sumitomo document checklist" )
*CERTIFICATE OF ANALYSIS
( For details, please refer to the attached "sumitomo document checklist" )
*CONTAINER PHOTOS – BEFORE AND AFTER LOADING WITH PHOTO OF SEAL
*REQ: SEND SHIPPING DOCS EXCEPT COMMERCIAL I/V IN PDF BY EMAIL TO UEG AND UEC
*REQ: SEND B/L COPY AND COMMERCIAL IV IN PDF BY E-MAILTO UEC
*NO NEED : CoO BY CHAMBER OF COMMERCE
*CUSTOME TARIFF NO.40022000
*"NCM Number :  4002.20.99  Ubepol VCR 617" AND
*"NCM Number :  7309.00 GPS Metal Box" show on all documents.
*Please send the all docs draft to UEG before issue the original.
*Please mention always on BL "Wooden Package: not applicable"',
      N'?SI???????TSL????SI???????
*PLASE SEND ALL ORIGINAL DOCS EXCEPT COMMERCIAL CIF I/V(TSL-UBE) TO UEG DIRECLTY
*PLASE SEND ALL ORIGINAL DOCS EXCEPT COMMERCIAL CIF I/V(TSL-UBE) TO UEG DIRECLTY
*PLASE SEND ALL DOCS PDF COPIES BY E-MAIL TO UBE MATSUMOTO, NO NEED TO SEND THEM BY COURIER.',
      N'',
      N'',
      N'SYNTHETIC RUBBER',
      N'',
      N'SHIPPING MARK
SUMIOTMO RUBBER BRASIL
PRODUCT NAME :UBEPOL VCR617
SUMITOMO RUBBER BRASIL PO#100752
MATERIAL SPEC:TMS-1233-B-07
MATERIAL NO. 120310220
LOT NO.:
C/NO. 1-16',
      N'UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '305fc061-7ace-4e5c-b5a2-28afa4445c64'
      ),
      N'SHIP-SUMITOMO-SOUTH-AFRICA',
      N'T.FUJIOKA / SEVP
THAI SYNTHETIC RUBBERS
CO., LTD.
FAX:66-2-685-3056',
      N'S. OKUNI/ H.UEDA
DOMESTIC SALES GROUP
UBE ELASTOMER. LTD.
TEL:81-3-5419-6167
FAX:81-3-5419-6250',
      N'UEG PO No.',
      N'SUMITOMO PO NO.:',
      N'7100189111',
      N'',
      N'',
      N'',
      N'SUMITOMO RUBBER SOUTH AFRICA (PTY) LTD.',
      N'SOUTH AFRICA',
      N'TSL /UBE EUROPE GMBH',
      N'ONE WREN V.029E',
      N'NYK FUJI V.135W',
      N'OCEAN NETWORK EXPRESS PTE. LTD. C/O',
      N'FOB / DSV',
      N'LAEM CHABANG, THAILAND',
      N'Sumitomo Rubber South Africa (Pty) Ltd
Attention : Zwelakhe Nhleko
Lion Match Office Park
The Old Factory Building
892 Umgeni Road
Durban 4001
Kwazulu Natal
South Africa
Tel: +27 031 242 1202
Email : Zwelakhe.Nhleko@srigroup.co.za',
      N'',
      N'-',
      N'',
      N'',
      N'',
      N'DSV South Africa (Pty) Ltd.
1st Floor Podium, John Ross House,
22/23 Mncadi Ave, Esplanade
4001 Durban
P O BOX 1008, Durban, 4000
South Africa 4018
Contact: : Suraj Seobaran
Email: Suraj.Seobaran@za.dsv.com
Phone: 27(031)  310 6000 (Switchboard)
Phone: 27 (031) 310 6004 (Direct line)',
      N'',
      N'',
      N'',
      N'*P/L
*Telex released B/L
*Quality Certificate
*Invoice 1 original',
      N'*Please submit complete set of documents in advance for final aproval of Sumitomo
*PLASE SEND ALL DOCS PDF  COLOURED COPIES BY E-MAIL TO UEC OKUNI, NO NEED TO SEND THEM BY COURIER.',
      N'',
      N'',
      N'SYNTHETIC RUBBER',
      N'',
      N'SHIPPING MARK
SUMIOTMO RUBBER SOUTH AFRICA
PRODUCT NAME :UBEPOL VCR617
SUMITOMO RUBBER
SOUTH AFRICA PO
7100189111
MATERIAL CODE:L1239
LOT NO.:
C/NO. 1-16',
      N'UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        'aeac96a9-d4fb-ce1d-db24-797ddb75562a'
      ),
      N'SHIP-SUMITOMO-HUNAN',
      N'T.FUJIOKA/SEVP
THAI SYNTHETIC RUBBERS
CO., LTD.',
      N'S.OKUNI/ H.UEDA
UBE Elastomer Co. Ltd.
TEL:81-3-5419-6167
FAX:81-3-5419-6250',
      N'USH PO No.:',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'Sumitomo Rubber ?Hunan?CO.LTD',
      N'CHINA',
      N'FULL CONTACT DETAIL OF TSL
WITH TRADE RESISTRATION NO.
(no need On Behalf of USH)',
      N'HEUNG-A BANGKOK V.2602N',
      N'-',
      N'HEUNG A',
      N'DIRECT',
      N'LAEM CHABANG, THAILAND',
      N'Sumitomo Rubber ?Hunan?CO.LTD
No.1318 Liangtang East Road ,?Changlong street,?Changsha county,?
Changsha city,?Hunan province,?China
TEL: 0086-731-86407006-1229
FAX: 0086-731-86407030
ATTN: DingJin Wu
dj_wu@srh.dunlop.com.cn
USCI:91430100561703582X',
      N'',
      N'D/M:14DAYS       D/T:14DAYS    * Please apply 14 days Free Time',
      N'COURIER ADDRESS:ATTN:Yang Jie-SAN
UBE (SHANGHAI) LTD.
Room 2403#, Shanghai International Trade Centre,
Yan''an West Road 2201#, changning district,
SHANGHAI,CHINA ZIP:200336
TELL:021-6273-2288',
      N'',
      N'',
      N'THE SAME AS ABOVE AND
UBE (SHANGHAI) LTD.
ROOM 2403#, SHANGHAI INTERNATIONAL TRADE CENTRE,
YAN''AN WEST ROAD 2201#, CHANGNING DISTRICT, SHANGHAI, CHINA 200336
CONTACT PERSON : Yang Jie
TEL : 0021-6273-2288  FAX : 0021-6273-3833
USCI:913101157030082793',
      N'',
      N'',
      N'',
      N'*FULL SET OF SURRENDERED B.L
* No need to issue individual I/P
*ORIGINAL OF CERTIFICATE OF ANALYSIS AND  ORIGINAL TOGETHER WITH THE PRODUCT
*Please issue full set Form-E with UEC I/V.
(please show NET Weight on Form-E)
*Please check (?)"Third Party invoicing" and add below sentence in Section 7 on Form-E.
THIRD-PARTY OPERATOR : UBE ELASTOMER CO. LTD.  ADD : SEAVANS NORTH BUILDING, 1-2-1, SHIBAURA, MINATO-KU, TOKYO JAPAN
*Please add "PO NO. :BRHN-26-07" in section 10 on Form-E.
"Please put special label of "Low-smell UBEPOL VCR617" on GPS packaging"
"SRI Code will be changed to 1239C"
*ORIGINAL OF CERT. OF NO WOOD PACKING MATERIAL
*Original of VANNING REPORT(WHEN There are 2 items in one shipment)
*Original of  CERT of FREE TIME of 14 day
*HS CODE:4002.20
*Please send FORM E to USH direclty by courier.
*Please e-mail ALL docs and  CIF COMMERCIAL IV (between UEC and TSL) by PDF copies to UEC Tokyo.
*Please note B/L and Form E are color copies',
      N'',
      N'',
      N'',
      N'SYNTHETIC RUBBER UBEPOL VCR617',
      N'',
      N'SHIPPING MARK
SYNTHETIC RUBBER
UBEPOL
VCR617
Made in Thailand',
      N'UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '73aee94c-fc9a-0664-0185-e9bc0278d644'
      ),
      N'SHIP-TOYO-MALAYSIA',
      N'T.FUJIOKA/SEVP
THAI SYNTHETIC RUBBERS
CO., LTD.',
      N'M.KAWAMORI / H.UEDA
UBE Elastomer Co. Ltd.
TEL:81-3-5419-6167
FAX:81-3-5419-6250',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'TOYO TYRE MALAISIA',
      N'Malaysia',
      N'TSL WITH FULL ADRESS',
      N'INTERASIA TRIUMPH V.W007',
      N'-',
      N'WANHAI',
      N'LEO',
      N'LAEM CHABANG, THAILAND',
      N'Toyo Tyre Malaysia Sdn Bhd
PT23101, Jalan Tembaga Kuning
Kawasan Perindustrian Kamunting Raya
PO Box 1,34600, Kamunting, Perak. Malaysia
Contact Person : Ms Lim / Ms Yap
Tel : 605-8206669 Fax : 605-8206659',
      N'SURRENDERED B/L',
      N'D/M:14DAYS    D/T:14DAYS * Please apply 14 days Free Time',
      N'',
      N'',
      N'',
      N'SAME AS CONSIGNEE',
      N'',
      N'',
      N'',
      N'*CERTIFICATE OF ANALYSIS
*PACKING LIST
*Please discribe MAR161A(TTM MATERIAL CODE) on all delivery documents. (BL,PL,COA)
*No need to issue individual I/P and COO.
*Please send Arrival Notice to below e-mail address
wong_py@toyotires.com.my
yap_bk@toyotires.com.my
*Please send all  docs and COMMERCIAL IV (between UEC and TSL) by PDF copies by E-mail to UEC Tokyo.',
      N'',
      N'',
      N'',
      N'POLYBUTADIENE RUBBER
UBEPOL VCR617',
      N'',
      N'SHIPPING MARK
TOYO TYRE MALAYSIA PLANT
MAR161A
ORDER NO.:7800009932-4
UBEPOL VCR617(TSL?
C/NO, 1-16
MADE IN THAILAND',
      N'UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '9fbca5ee-e739-d965-6833-d016742effc9'
      ),
      N'SHIP-HENGDASHENG-TOYO',
      N'T.FUJIOKA/SEVP
THAI SYNTHETIC RUBBERS
CO., LTD.
FAX:66-2-685-3056',
      N'S.OKUNI/H.UEDA
UBE Elastomer Co. Ltd.
TEL:81-3-5419-6167
FAX:81-3-5419-6250',
      N'USH PO No.:',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'FULL CONTACT DETAIL OF TSL
WITH TRADE RESISTRATION NO.
(no need On Behalf of USH)',
      N'JOSCO LUCKY V.2511N',
      N'-',
      N'TAICANG CONTAINER LINES CO.,LTD',
      N'LEO',
      N'LAEM CHABANG, THAILAND',
      N'HENGDASHENG TOYO TIRE(ZHANGJIAGANG) CO., LTD.
58,DONGHAI ROAD, YANGTZE INTERNATIONAL CHEMICAL
INDUSTRIAL PARK, ZHANGJIAGANG, JIANGSU, CHINA
CONTACT PERSON: Lili Yu  E-MAIL: yulili@toyotiresz.com
TEL?0512-3500-7124 FAX?0512-35007203
USCI:91320592553812607A',
      N'SURRENDERED B/L',
      N'D/M:14DAYS       D/T:14DAYS    * Please apply 14 days Free Time',
      N'',
      N'',
      N'',
      N'THE SAME AS ABOVE AND
UBE (SHANGHAI) LTD.  ATTN:Yang Jie-san
Room 2403#, Shanghai International Trade Centre,
Yan''an West Road 2201#, changning district,
SHANGHAI,CHINA ZIP:200336
TELL:021-6273-2288
USCI:913101157030082793',
      N'',
      N'',
      N'',
      N'*FULL SET OF SURRENDERED B.L
*No need to issue individual I/P. (Customer accepted General I/P.)
*PLEASE MARK HS CODE 4002.20.90 ON BL
*3 ORIGINAL OF CERTIFICATE OF ANALYSIS and 1 original together with product
*Please issue full set of Form-E with TSL FOB custom I/V.
*Please show NET Weight on Form-E
*NEED "R161"LABEL ON THE PACKING
*Please issue 3 original of No wood packing material OR IPPC PALLET
*Pls send PDF copies of all original docs.to UEC(Okuni) by e-mail and send all original docs to UBE shanghai directly.
except commercial CIF invoice to UBE (Courier address of UBE shanghai, please refer to the above)',
      N'',
      N'',
      N'',
      N'SYNTHETIC RUBBER',
      N'',
      N'SHIPPING MARK
VCR617?TSL?
BR-TOYO-2503
C/NO. 1-16
MADE IN THAILAND
CONSIGNEE:TOYO TIRE
R161
USH COURIER ADDRESS:ATTN:Yang Jie-san
UBE (SHANGHAI) LTD.
Room 2403#, Shanghai International Trade Centre,
Yan''an West Road 2201#, changning district,
SHANGHAI,CHINA ZIP:200336
TELL:021-6273-2288',
      N'UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        'dc6aae6c-575e-4d1c-0e27-0c561ec3c114'
      ),
      N'SHIP-TOYO-TIRE-NA',
      N'T.FUJIOKA/SEVP
THAI SYNTHETIC RUBBERS CO.,LTD.',
      N'S. OKUNI/ D. KAWAMORI
UBE Elastomer Co. Ltd.
TEL:81-3-5419-6167
FAX:81-3-5419-6250',
      N'UAI PO NO',
      N'TOYO PO',
      N'4501239925',
      N'',
      N'',
      N'',
      N'TOYO TIRE NORTH AMERICA',
      N'U. S. A.',
      N'TSL WITH FULL ADRESS
ON BEHALF OF UBE AMERICA',
      N'MSC BRIDGEPORT V.GU606W',
      N'ZIM THAILAND V.14E',
      N'MSC',
      N'DIRECT / FOB',
      N'LAEM CHABANG,THAILAND',
      N'TOYO TIRE NORTH AMERICA MANUFACTURING INC.
3660 Highway 411 NE
White, GA 30184
ATTN:SUSAN WOOD   woods@toyotires.com
TEL: 678-492-2165',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'D.J.Powers Company, Inc.
5000 Business Center Drive, Suite 1000
Savannah, GA 31405
TEL:912-790-1927
ATTN: DANETTE PENTECOST
TOYO.TIRE@DJPOWERS.COM',
      N'SAME AS CONSIGNEE',
      N'UBE America Inc.
Tel: +1  (248) 516-4911
38777 Six Mile Road, Suite 400, Livonia, MI 48152
E-mail: akiko@ube.com
E-mail: k.kikuta@ube.com',
      N'TOYO TIRE NORTH AMERICA MANUFACTURING INC.
3660 Highway 411 NE
White, GA 30184
ATTN:  SUSAN WOOD',
      N'* Full set of Sea Waybill
* 2/2 ORIGINAL CoA
*Please show "TOYO ITEM NO.GAR161A"  & "TOYO 4501202829" on all doc.
*Please send ISF data to UEC and UAI by e-mail at once. When you get it
UAI people;
Akiko Hirayama <akiko@ube.com> & Kaori Kikuta <k.kikuta@ube.com>',
      N'*Please e-mail ALL docs and FOB COMMERCIAL IV (between UEC and TSL)  by PDF copies to UEC Tokyo(Okuni)
*NO need original courier to UAI and us.',
      N'',
      N'',
      N'POLYBUTADIENE RUBBER',
      N'',
      N'SHIPPING MARK
UBEPOL VCR617
TOYO PO:4501239925
NO. 1-28
MADE IN THAILAND
TOYO ITEM NO.GAR161A(VCR617)',
      N'UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        'ae072582-b221-e735-bc29-1f1ca14310cf'
      ),
      N'SHIP-BRIDGESTONE-INDIA',
      N'MR.FUJIOKA/SEVP
THAI SYNTHETIC RUBBERS
CO., LTD.
FAX:66-2-685-3056',
      N'W.MIYANAMI
SYNTHETIC RUBBUR DIV.
UBE ELASTOMER CO.LTD.
TEL:81-3-5419-6167',
      N'BS INDIA PO No.:',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'BRIDGESTONE INDIA PRIVATE LIMITED',
      N'INDIA',
      N'TSL WITH FULL CONTACT DETAILS
AND RESISTRATION NO.',
      N'xx',
      N'xx',
      N'xx',
      N'xx',
      N'',
      N'Bridgestone India Private Limited
PLOT NO. A-43, PHASE-II, MIDC CHAKAN
VILLAGE SAWARDARI, TALUKA KHED, DIST. PUNE,
MAHARASHTRA - 410 501, INDIA
TEL: +91.2135.672.000
ATTN:
(prashant-verma@bridgestone.co.in)
IEC NO. 0396013341
GSTIN Number 27AABCB2304E1ZD',
      N'',
      N'D/M : 14 DAYS, D/T : 14 DAYS',
      N'Bridgestone India Private Limited
PLOT NO. A-43, PHASE-II, MIDC CHAKAN
VILLAGE SAWARDARI, TALUKA KHED, DIST. PUNE,
MAHARASHTRA - 410 501, INDIA
TEL         : +91 2135 672166,+91 2135672000
ATTN:Ms. Neha Latare/Mr. Sagar Gujarathi/Mr.Sandeep Gallani',
      N'',
      N'',
      N'Bridgestone India Private Limited
PLOT NO. A-43, PHASE-II, MIDC CHAKAN
VILLAGE SAWARDARI, TALUKA KHED, DIST. PUNE,
MAHARASHTRA - 410 501, INDIA
Attn: Prashant Verma
(prashant-verma@bridgestone.co.in)
Tel: +91.2135.672.174
PAN Number (Permanent Account Number) of
notify party address.:-  "AABCB2304E "',
      N'',
      N'',
      N'',
      N'*Full set of Surrendered MASTER B/L(NOT FORWARDER BL)
IMPORTANT!! ? *PLS MARK "FREE TIME: 14 DAYS FREE DETENTION AT NHAVA SHEVA.
*HS CODE:
*PAN Number (Permanent Account Number) of notify party address.:-  "AABCB2304E " ON BL
* 2 original of Certificate of Origin Form-AI with TSL FOB customs Invoice.
NEW!!?*Please issue 1 ORIGINAL FORM I (section III) with Manufacturing process outline
Whenever there is change in Manufacturing process, please inform us along with necessary documents.
* 3 original of Certificate of Analysis marked BS material code (TC 50)and PO number
issued by manufacturer
* 2 original of Declaration of non coniferous wood packing materials issued by manufacturer
*please send us the draft of ONLY B/L before issue the original
*Det at Nhava must be 14 days as we cofirmed',
      N'*Please send all original docs. to BS INDIA direclty except CIF COMMERCIAL IV (between UBE and TSL) by courier.
(FOR COURIER ADDRESS, PLEASE REFER AS FOLLOWS(SI/ PAGE 2)
*Please send ALL docs. PDF copies by E-mail to UBE Tokyo(Matsumoto) /NO need original courier to us.',
      N'',
      N'',
      N'TC 50
POLY BUTADIENE
RUBBER  UBEPOL BR150L',
      N'',
      N'SHIPPING MARK
BRIDGESTONE INDIA PRIVATE LIMITED
TRADE NAME:UBEPOL BR150L
TC50/BSID/4500077118
INVOICE NO./4500077118
MANUFACTURE''S NAME
THAI SYNTHETIC RUBBERS CO., LTD.
LOT.NO:
GROSS WT.  ---Please advise
NET WT. 2,100
MADE IN THAILAND',
      N'UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        'de5d6702-f08f-86ab-3844-ec3da2f6f2a3'
      ),
      N'SHIP-BRIDGESTONE-SA',
      N'T. Fujioka/SEVP
THAI SYNTHETIC RUBBERS
CO., LTD.',
      N'D.KAWAMORI/UEDA
UBE Elastomer Co. Ltd.
TEL:81-3-5419-6167
FAX:81-3-5419-6250',
      N'BFAFRICA PO No.:',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'BRIDGESTONE SOUTH AFRICA',
      N'AFRICA',
      N'TSL ON BEHALF OF UBE Elastomer Co. Ltd.',
      N'xx',
      N'xx',
      N'xx',
      N'xx',
      N'',
      N'BRIDGESTONE SA (PTY) LTD
189 GRAHAMSTOWN ROAD
DEAL PARTY, PORT ELIZABETH, 6001, SOUTH AFRICA',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'ATTN:SHIPPING DEPT
BRIDGESTONE SA (PTY) LTD
Email: bsaf.imports@bridgestone.co.za',
      N'',
      N'',
      N'',
      N'*You don''t need to send original doc.by courier. Only PDF copies are OK.
*SURRENDERED BL IS REQUIRED.
* Pls mark BS material code "HB12" and " PO NO. 4501193944" on all document
* 3 COPY OF CERTIFICATE OF ANALYSIS
*PACKING LIST MUST SHOW GROSS,TARE,AND NET WEIGHT
* CoA IS REQUIRED PRIOR, PLEASE SEND US THE PDF AS SSON AS POSSIBLE.
* BRIDGESTONE CODE OF  "HB12"SHOULD BE MARKED ON ALL BAGS, DRUMS,CONTAINERS',
      N'',
      N'',
      N'',
      N'POLYBUTADIENE RUBBER
HB12 / UBEPOL VCR412',
      N'',
      N'SHIPPING MARK
BRIDGESTONE S.A. PTY
PORT ELIZABETH
ORDER NO.4501193944
HB12(UBEPOL VCR412)
C/S NO.1-UP
MADE IN THAILAND',
      N'UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '1fc500b2-3a58-6770-b96e-29492d2fffdc'
      ),
      N'SHIP-BRISA-TURKEY',
      N'MR.T. Fujioka /SEVP
THAI SYNTHETIC RUBBERS
CO., LTD.',
      N'KAWAMORI/UEDA
UBE Elastomer Co. Ltd.
TEL:81-3-5419-6167
FAX:81-3-5419-6250',
      N'BRISA BRIDGESTONE  PO No.:',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'BRISA BRIDGESTONE SABANCI
LASTIK SANAYI VE TICARET A.S.',
      N'TURKEY',
      N'TSL ON BE HALF OF UEC',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'CONSIGNEE;
BRISA BRIDGESTONE SABANCI LASTIK SANAYI VE TICARET A.S.
Alikahya Fatih Mah.Sanayi Cad.No:98
41310 ?zmit / KOCAEL? Turkey
Contact Person : BURCU YUZUAK
Phone : +90 (262) 316 57 53
E-Mail ?b.yuzuak@brisa.com.tr',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'SAME AS CONSIGNEE',
      N'',
      N'',
      N'',
      N'* FULL SET OF SEA WAY BILL
* FULL SET OF CERT. OF ORIGIN BY MANUFACTURE
* 3 ORIGINAL OF CERTIFICATE OF ANALYSIS,
* PLEAE SHOW PRODUCTION DATE AND TEST DATE ON COA
* PLEASE SHOW - Material code AND ID on all Doc.
* Please label BS code no." HB12 " on each box.(4 side)',
      N'',
      N'',
      N'',
      N'POLYBUTADIENE RUBBER
HB12 / UBEPOL VCR412',
      N'',
      N'SHIPPING MARK
BRISA /TURKEY
Materila code:HB12
ID: HB12-B
MADE IN THAILAND
THAI SYNTHETIC RUBBERS CO.,LTD
PRODUCTION DATE:',
      N'UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '3fa69025-1912-7540-bf0f-298e4286ab03'
      ),
      N'SHIP-BRIDGESTONE-FIRESTONE-WILSON',
      N'T. Fujioka/SEVP
THAI SYNTHETIC RUBBERS
CO., LTD.',
      N'D.KAWAMORI/UEDA
UBE Elastomer Co. Ltd.
TEL:81-3-5419-6167
FAX:81-3-5419-6250',
      N'BFS WILSON PO No.:',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'BRIDGESTONE FIRESTONE NT
WILSON PLANT',
      N'WILSON   USA',
      N'TSL',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'Bridgestone Firestone NT  Wilson Plant
Triangle East Storage 2010 Baldree Road Wilson NC27893  USA
TEL: 252-246-7630
ATTN: Jeff Pyle
pylejeff@bfusa.com
Spurlinlee@bfusa.com',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'SAME AS CONSIGNEE',
      N'V Alexander and Co., Inc.
22 Century Blvd # 510
Nashville, TN 37214
E-mail: BRIDGESTONE@VALEXANDER.COM
Phone: 615-885-0020',
      N'',
      N'',
      N'!! New INSTRUCTION,!! YOU don''t need to send us the oirignal docs, only PDF copies by e-mail are ok.
*A non-negotiable " Waybill
* Pls mark BS material code "TC030" and " PO NO4900235021LINE ITEM 00010 " on all document
* CERTIFICATE OF ANALYSIS, CERTIFICATE OF COMPLIANCE AND PACKING LIST MUST BE
ATTACHED ON CONTAINER(MANUFACTURE DATE SHOULD BE ON CoA)
*PACKING LIST MUST SHOW GROSS,TARE,AND NET WEIGHT
*ALL CONTAINERS (INCLUDING INDIVIDUAL BAGS, BOXES) OF MATERIALS MUST BE MARKED
WITH THE  CHEMICAL AND /OR TRADENAME THAT APPEARS ON THE PRODUCT''S MSDS
*WEIGHT IN NO LESS THAN ONE INCH(PREFERABLY 2 INCH)LETTERS
*Certificate of Origin issued by manufacturer
*Declaration of non coniferous wood packing materials',
      N'',
      N'',
      N'',
      N'POLYBUTADIENE RUBBER
TC030 / UBEPOL VCR412',
      N'',
      N'SHIPPING MARK
BRIDGESTONE AMERICAS, INC.
BFS WILSON
ORDER NO. 4900235021
TC030/UBEPOL VCR412
C/NO.1 -14
17,640kg
MADE IN THAILAND',
      N'UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        '53b8c3d1-ade3-89fb-eb3e-6a43c6d49fec'
      ),
      N'SHIP-BRIDGESTONE-WUXI',
      N'MR.T. Fujioka /SEVP
THAI SYNTHETIC RUBBERS
CO., LTD.',
      N'KAWAMORI/UEDA
UBE Elastomer Co. Ltd.
TEL:81-3-5419-6167
FAX:81-3-5419-6250',
      N'BS WUXI PO No.:',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'BRIDGESTONE WUXI TIRE',
      N'FULL CONTACT DETAIL OF TSL',
      N'WITH TRADE RESISTRATION NO.',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'BRIDGESTONE (WUXI) TIRE CO.,LTD.
No.67, XINMEI ROAD,WUXI NATIONAL HIGH-NEW
TECHNICAL INDUSTRIAL DEVELOPMENT
ZONE, WUXI 214028, JIANGSU, CHINA
FAX:86-0510-8532-2199
TEL:86-0510-8532-2288
xiaoqi.ding@bridgestone.com
huiyun.chen@bridgestone.com
USCI:913202147462278772.',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'SAME AS CONSIGNEE',
      N'Please send Arrival Notice by e-mail to
Xiaoqi Ding (xiaoqi.ding@bridgestone.com)
Chen Huiyun(huiyun.chen@bridgestone.com)',
      N'',
      N'',
      N'*FULL SET OF SURRENDERE B/L
* Pls mark BS material code "TC30"ON ALL DOCS.
*3 ORIGINAL OF CERTIFICATE OF ANALYSIS & 1 ORIGINAL CoA TOGETHER WITH PRODUCT
*3 ORIGINAL OF  NO WOOD PACKING OR IPPC CERT.
* PACKING LIST MUST SHOW GROSS,TARE,AND NET WEIGHT
* BRIDGESTONE CODE OF  "TC30"SHOULD BE MARKED ON ALL BAGS, DRUMS,CONTAINERS
*PLEASE ISSUE FULL SET OF FORM-E WITH UBE INVOICE
*TSL FOB CUSTOM I/V for Form-E
*No need to issue individual I/P
*Please send Arrival Notice by e-mail to Xiaoqi Ding (xiaoqi.ding@bridgestone.com)
*CIF COMMERCIAL IV(BETWEEN TSL AND UEC)
*Please label BS code no." TC30 or TC50 " on each box.(4 side)',
      N'*Don''t  need to send all original docs to BS WUXI directly by courier including 1 original COMMERCIAL CIF I/V(I/V between TSL and UEC)
*Please send ALL docs by PDF copies by E-mail to UEC /NO need original courier to UEC also.',
      N'',
      N'',
      N'POLYBUTADIENE RUBBER
TC30 / UBEPOL VCR412',
      N'',
      N'SHIPPING MARK
BRIDGESTONE (WUXI) TIRE CO.,LTD.
ORDER NO.:4500471133
TC30 (UBEPOL VCR412)
C/S NO.1-16
MADE IN THAILAND',
      N'UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        'aecbc3f2-a40a-2311-e0db-e02d41e36e99'
      ),
      N'SHIP-PT-BRIDGESTONE',
      N'MR.FUJIOKA
THAI SYNTHETIC RUBBERS
CO., LTD.
FAX:66-2-685-3056',
      N'Miyanami
UBE Elastomer Co.Ltd.
TEL:81-3-5419-6167
FAX:81-3-5419-6250',
      N'CO NUMBER:',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'BS INDONESIA',
      N'INDONESIA',
      N'TSL',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'PT. BRIDGESTONE TIRE INDONESIA',
      N'',
      N'',
      N'PT Bridgestone Tire Indonesia -  Karawang Plant
Kawasan Industri Surya Cipta Jl. Surya Utama Kav 8 – 13,
Kutamekar, Ciampel, Kab. Karawang, Jawa Barat, 41363
Tel: (+62-267) 440 201
Attn. Mr. Bayu Nasti',
      N'',
      N'',
      N'Kawasan Industri Surya Cipta Jl. Surya Utama Kav 8 – 13,',
      N'Kutamekar, Ciampel, Kab. Karawang, Jawa Barat, 41363
NPWP No.(TAX ID No.) 0010 0011 8809 2000',
      N'',
      N'',
      N'*please extend the free time as long as possible.
* Surrenderd B/L(MASTER BL)
* Pls mark  CO NUMBER: F2602-TSL-2 on all document
* 3 ORIGINAL OF CERTIFICATE OF ANALYSIS,
* PACKING LIST MUST SHOW GROSS,TARE,AND NET WEIGHT
* Insurance Policy: *110%*CONTRACT PRICE
*PLEASE ISSUE THE FORM-D WITH UEC INVOICE
AND   Check ( ?) "Retroactively" is only if GAP the BL date and
Form D date is more than 3 days.
Please kindly send to CONSIGNEE the announcement from shipping line if the BL already surrendered.
*Please label BS code no." TC50 " on each box.(4 side)
*HS code DOC4002.20.1000 ON ALL DOCS.
*Pls send us all docs. PDF copy by e-mail as soon as you get all original docs.before courier
*Pls send all documents copy to UEC by email
No need original courier.
*PLEASE ARRANGE THIS FREE TIME 21 DAYS COMBINED.
*PLEASE SHOW FREE TIME ON BL.',
      N'',
      N'',
      N'',
      N'SYNTHETIC RUBBER
/ UBEPOL BR150L(TC50)
CO NUMBER :F2602-TSL-2',
      N'',
      N'SHIPPING MARK
BRIDGESTONE INDONESIA
CO NUMBER :F2602-TSL-2
TC50/BR150L
C/NO.1-32
MADE IN THAILAND',
      N'Ube Elastomer Co.Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        'cfad8d76-b783-6a2e-8ed3-c9492cc93817'
      ),
      N'SHIP-BRIDGESTONE-TAIWAN',
      N'MR.T. Fujioka /SEVP
THAI SYNTHETIC RUBBERS
CO., LTD.',
      N'KAWAMORI/UEDA
UBE Elastomer Co. Ltd.
TEL:81-3-5419-6167
FAX:81-3-5419-6250',
      N'BS TAIWAN PO NO.',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'BRIDGESTONE TAIWAN CO.,LTD.
NO.1, CHUANG CHING ROAD,
HSIN CHU IND.ZONE, TAIWAN.
PHONE:886-35-981621',
      N'TAIWAN',
      N'TSL',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'BRIDGESTONE TAIWAN CO.,LTD.
No.1-1, Wenhua RD., Hsinchu Industrial Park
Hukou Township, Hsinchu County 30352, Taiwan
PHONE:866-3-598-1621
Mavis Chou (Ms.)
mavis.chou@bridgestone.com',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'SAME AS CONSIGNEE',
      N'',
      N'',
      N'',
      N'*surrendered  B/L
*1 SET OF CoA
*1 SET OF MSDS
*PLEASE PUT THE NAME OF BSFC CODE NO.OF TC 30 or TC50 ON 4 sides of Metal box.
*PLEASE TAKE the picture of packing outward appearance of 200008199 before you export.
*General Insurance policy is accepted.',
      N'*You don''t need to send all original docs. to BS TAIWAN(ABOVE ADDRESS) direclty by courier. << CHANGE!
*Please send ALL docs. PDF copies by E-mail to UBE Tokyo/NO need original coueirer.
1.     Please label BS code no. TC30 or TC50 at front and both
sides of each your steel box.
2.     Please make the figure size of BS code no. as following',
      N'',
      N'',
      N'SYNTHETIC RUBBER
TC30 UBEPOL  VCR412',
      N'',
      N'SHIPPING MARK
BSFC P,O. NO:200008199
VCR412/TC30
CASE NO.:1-12
N/W  :  15,120KG
G/W  :  16,707.6KG
MAKER''S NAMETHAI SYNTHETIC RUBBERS CO, LTD
COUTRY OF ORIGIN:THAILAND',
      N'UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    ),
    (
      CONVERT(
        uniqueidentifier,
        'a3defac6-a92f-7d43-9db3-9213342b7b24'
      ),
      N'SHIP-BRIDGESTONE-MEXICO',
      N'T.FUJIOKA/SEVP
THAI SYNTHETIC RUBBERS CO., LTD.
FAX:66-2-685-3056',
      N'W. MIYANAMI
UBE Elastomer Co. Ltd.
TEL:81-3-5419-6167
FAX:81-3-5419-6250',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'BS MEXICO',
      N'MEXICO',
      N'TSL WITH FULL ADDRESS',
      N'',
      N'',
      N'',
      N'',
      N'',
      N'Bridgestone de México S.A. de C.V.
Juan Vazquez de Mella 481 4°piso - Col Los Morales, Polanco
Tel. (52 55) 5626-6600
RFC: BFM910826TW6
ATTN:Nathalia Zonzini',
      N'',
      N'21 days COMBINED DET AND DEM',
      N'',
      N'',
      N'',
      N'SAME AS CCONSIGNEE',
      N'',
      N'',
      N'',
      N'*Full set SEA WAY BILL REQUIRED
*PLS show the following words on all docs.on all DOCs.
"TC030" "UBE Elastomer Co. Ltd."
*CERTIFICATE OF ANALYSIS including SPECIFICATION AND QUALITY RANGE
*CERTIFICATE OF ORIGIN BY TSL MANUFACTURE AND SHOW HS CODE 4002.20.01
*Box IV of GPS ($50/box)
*21 DAYS FREE TIME ( WE CONFIRMED THIS)
*FULL SET OF I/P WITH COVERING ALL RISK',
      N'*Please send all original docs. to BSMX direclty except CIF COMMERCIAL IV (between UEC and TSL) by courier.
*Please send ALL docs. PDF copies by E-mail to UBE Tokyo/NO need original courier to us.',
      N'',
      N'',
      N'POLYBUTADIEN RUBBER',
      N'',
      N'SHIPPING MARK
Bridgestone Mexico,
SHIP TO :MEXICO
ORDER NO.:4200036311
ITEM CODE: TC030
MADE IN THAILAND
PRODUCER:THAI SYNTHETIC RUBBER',
      N'UBE Elastomer Co. Ltd.',
      N'N''2026-01-01 00:00:00.000''',
      N'N''2026-01-01 00:00:00.000'''
    )
) AS source (
  SiTemplateId,
  ShipToCode,
  Attn,
  FromBlock,
  PoNumberHeader,
  No2Header,
  No2,
  MaterialCodeHeader,
  MaterialCode,
  NoteUnderMaterial,
  UserText,
  Country,
  Shipper,
  FeederVessel,
  MotherVessel,
  VesselCompany,
  Forwarder,
  PortOfLoading,
  Consignee,
  BlType,
  FreeTime,
  CourierAddress,
  EoriNo,
  BookingNo,
  NotifyParty,
  AlsoNotify1,
  AlsoNotify2,
  DeliverTo,
  Requirements,
  Note,
  Note2,
  Note3,
  Description,
  UnderDescription,
  ShippingMark,
  BelowSignature,
  CreatedAt,
  UpdatedAt
) ON target.ShipToCode = source.ShipToCode WHEN MATCHED THEN
UPDATE
SET
  target.Attn = source.Attn,
  target.FromBlock = source.FromBlock,
  target.PoNumberHeader = source.PoNumberHeader,
  target.No2Header = source.No2Header,
  target.No2 = source.No2,
  target.MaterialCodeHeader = source.MaterialCodeHeader,
  target.MaterialCode = source.MaterialCode,
  target.NoteUnderMaterial = source.NoteUnderMaterial,
  target.UserText = source.UserText,
  target.Country = source.Country,
  target.Shipper = source.Shipper,
  target.FeederVessel = source.FeederVessel,
  target.MotherVessel = source.MotherVessel,
  target.VesselCompany = source.VesselCompany,
  target.Forwarder = source.Forwarder,
  target.PortOfLoading = source.PortOfLoading,
  target.Consignee = source.Consignee,
  target.BlType = source.BlType,
  target.FreeTime = source.FreeTime,
  target.CourierAddress = source.CourierAddress,
  target.EoriNo = source.EoriNo,
  target.BookingNo = source.BookingNo,
  target.NotifyParty = source.NotifyParty,
  target.AlsoNotify1 = source.AlsoNotify1,
  target.AlsoNotify2 = source.AlsoNotify2,
  target.DeliverTo = source.DeliverTo,
  target.Requirements = source.Requirements,
  target.Note = source.Note,
  target.Note2 = source.Note2,
  target.Note3 = source.Note3,
  target.Description = source.Description,
  target.UnderDescription = source.UnderDescription,
  target.ShippingMark = source.ShippingMark,
  target.BelowSignature = source.BelowSignature,
  target.UpdatedAt = source.UpdatedAt WHEN NOT MATCHED BY TARGET THEN INSERT (
    SiTemplateId,
    ShipToCode,
    Attn,
    FromBlock,
    PoNumberHeader,
    No2Header,
    No2,
    MaterialCodeHeader,
    MaterialCode,
    NoteUnderMaterial,
    UserText,
    Country,
    Shipper,
    FeederVessel,
    MotherVessel,
    VesselCompany,
    Forwarder,
    PortOfLoading,
    Consignee,
    BlType,
    FreeTime,
    CourierAddress,
    EoriNo,
    BookingNo,
    NotifyParty,
    AlsoNotify1,
    AlsoNotify2,
    DeliverTo,
    Requirements,
    Note,
    Note2,
    Note3,
    Description,
    UnderDescription,
    ShippingMark,
    BelowSignature,
    CreatedAt,
    UpdatedAt
  )
VALUES
  (
    source.SiTemplateId,
    source.ShipToCode,
    source.Attn,
    source.FromBlock,
    source.PoNumberHeader,
    source.No2Header,
    source.No2,
    source.MaterialCodeHeader,
    source.MaterialCode,
    source.NoteUnderMaterial,
    source.UserText,
    source.Country,
    source.Shipper,
    source.FeederVessel,
    source.MotherVessel,
    source.VesselCompany,
    source.Forwarder,
    source.PortOfLoading,
    source.Consignee,
    source.BlType,
    source.FreeTime,
    source.CourierAddress,
    source.EoriNo,
    source.BookingNo,
    source.NotifyParty,
    source.AlsoNotify1,
    source.AlsoNotify2,
    source.DeliverTo,
    source.Requirements,
    source.Note,
    source.Note2,
    source.Note3,
    source.Description,
    source.UnderDescription,
    source.ShippingMark,
    source.BelowSignature,
    source.CreatedAt,
    source.UpdatedAt
  );

-- Default active workflow permissions from STANDARD preset
MERGE dbo.HeaderActionPermission AS target USING (
  VALUES
    (N'SUBMIT_LINE', N'DRAFT', N'CREATED', N'TRADER'),
    (N'SUBMIT_LINE', N'DRAFT', N'CREATED', N'UEC_SALE'),
    (N'SUBMIT_LINE', N'DRAFT', N'CREATED', N'TSL_SALE'),
    (
      N'APPROVE_LINE',
      N'CREATED',
      N'APPROVED',
      N'TSL_SALE'
    ),
    (
      N'SET_ETD',
      N'APPROVED',
      N'WAIT_SALE_UEC_APPROVE_PO',
      N'TSL_CS'
    ),
    (
      N'APPROVE_SALE_PO',
      N'WAIT_SALE_UEC_APPROVE_PO',
      N'WAIT_MGR_UEC_APPROVE_PO',
      N'UEC_SALE'
    ),
    (
      N'APPROVE_MGR_PO',
      N'WAIT_MGR_UEC_APPROVE_PO',
      N'VESSEL_SCHEDULED',
      N'UEC_MANAGER'
    ),
    (
      N'UPLOAD_FINAL_DOCS',
      N'VESSEL_SCHEDULED',
      N'VESSEL_DEPARTED',
      N'TSL_CS'
    )
) AS source (
  HeaderActionCode,
  FromOrderHeaderStatusCode,
  ToOrderHeaderStatusCode,
  AllowedUserGroupCode
) ON target.HeaderActionCode = source.HeaderActionCode
AND target.FromOrderHeaderStatusCode = source.FromOrderHeaderStatusCode
AND target.AllowedUserGroupCode = source.AllowedUserGroupCode WHEN MATCHED THEN
UPDATE
SET
  target.ToOrderHeaderStatusCode = source.ToOrderHeaderStatusCode WHEN NOT MATCHED BY TARGET THEN INSERT (
    HeaderActionCode,
    FromOrderHeaderStatusCode,
    ToOrderHeaderStatusCode,
    AllowedUserGroupCode
  )
VALUES
  (
    source.HeaderActionCode,
    source.FromOrderHeaderStatusCode,
    source.ToOrderHeaderStatusCode,
    source.AllowedUserGroupCode
  );

-- Workflow permission preset headers
MERGE dbo.HeaderPermissionPreset AS target USING (
  VALUES
    (
      CONVERT(
        uniqueidentifier,
        '11111111-1111-1111-1111-111111111111'
      ),
      N'STANDARD',
      1,
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    ),
    (
      CONVERT(
        uniqueidentifier,
        '22222222-2222-2222-2222-222222222222'
      ),
      N'STRICT',
      1,
      SYSUTCDATETIME (),
      SYSUTCDATETIME ()
    )
) AS source (
  HeaderPermissionPresetId,
  PresetName,
  IsSystemPreset,
  CreatedAt,
  UpdatedAt
) ON target.PresetName = source.PresetName WHEN MATCHED THEN
UPDATE
SET
  target.IsSystemPreset = source.IsSystemPreset,
  target.UpdatedAt = source.UpdatedAt WHEN NOT MATCHED BY TARGET THEN INSERT (
    HeaderPermissionPresetId,
    PresetName,
    IsSystemPreset,
    CreatedAt,
    UpdatedAt
  )
VALUES
  (
    source.HeaderPermissionPresetId,
    source.PresetName,
    source.IsSystemPreset,
    source.CreatedAt,
    source.UpdatedAt
  );

-- Workflow permission preset rules
DELETE target
FROM
  dbo.HeaderPermissionPresetRule AS target
  INNER JOIN dbo.HeaderPermissionPreset AS preset ON preset.HeaderPermissionPresetId = target.HeaderPermissionPresetId
WHERE
  preset.PresetName IN (N'STANDARD', N'STRICT');

INSERT INTO
  dbo.HeaderPermissionPresetRule (
    HeaderPermissionPresetId,
    HeaderActionCode,
    FromOrderHeaderStatusCode,
    ToOrderHeaderStatusCode,
    AllowedUserGroupCode
  )
VALUES
  (
    CONVERT(
      uniqueidentifier,
      '11111111-1111-1111-1111-111111111111'
    ),
    N'SUBMIT_LINE',
    N'DRAFT',
    N'CREATED',
    N'TRADER'
  ),
  (
    CONVERT(
      uniqueidentifier,
      '11111111-1111-1111-1111-111111111111'
    ),
    N'SUBMIT_LINE',
    N'DRAFT',
    N'CREATED',
    N'UEC_SALE'
  ),
  (
    CONVERT(
      uniqueidentifier,
      '11111111-1111-1111-1111-111111111111'
    ),
    N'SUBMIT_LINE',
    N'DRAFT',
    N'CREATED',
    N'TSL_SALE'
  ),
  (
    CONVERT(
      uniqueidentifier,
      '11111111-1111-1111-1111-111111111111'
    ),
    N'APPROVE_LINE',
    N'CREATED',
    N'APPROVED',
    N'TSL_SALE'
  ),
  (
    CONVERT(
      uniqueidentifier,
      '11111111-1111-1111-1111-111111111111'
    ),
    N'SET_ETD',
    N'APPROVED',
    N'WAIT_SALE_UEC_APPROVE_PO',
    N'TSL_CS'
  ),
  (
    CONVERT(
      uniqueidentifier,
      '11111111-1111-1111-1111-111111111111'
    ),
    N'APPROVE_SALE_PO',
    N'WAIT_SALE_UEC_APPROVE_PO',
    N'WAIT_MGR_UEC_APPROVE_PO',
    N'UEC_SALE'
  ),
  (
    CONVERT(
      uniqueidentifier,
      '11111111-1111-1111-1111-111111111111'
    ),
    N'APPROVE_MGR_PO',
    N'WAIT_MGR_UEC_APPROVE_PO',
    N'VESSEL_SCHEDULED',
    N'UEC_MANAGER'
  ),
  (
    CONVERT(
      uniqueidentifier,
      '11111111-1111-1111-1111-111111111111'
    ),
    N'UPLOAD_FINAL_DOCS',
    N'VESSEL_SCHEDULED',
    N'VESSEL_DEPARTED',
    N'TSL_CS'
  ),
  (
    CONVERT(
      uniqueidentifier,
      '22222222-2222-2222-2222-222222222222'
    ),
    N'SUBMIT_LINE',
    N'DRAFT',
    N'CREATED',
    N'TRADER'
  ),
  (
    CONVERT(
      uniqueidentifier,
      '22222222-2222-2222-2222-222222222222'
    ),
    N'APPROVE_LINE',
    N'CREATED',
    N'APPROVED',
    N'TSL_SALE'
  ),
  (
    CONVERT(
      uniqueidentifier,
      '22222222-2222-2222-2222-222222222222'
    ),
    N'SET_ETD',
    N'APPROVED',
    N'WAIT_SALE_UEC_APPROVE_PO',
    N'TSL_CS'
  ),
  (
    CONVERT(
      uniqueidentifier,
      '22222222-2222-2222-2222-222222222222'
    ),
    N'APPROVE_SALE_PO',
    N'WAIT_SALE_UEC_APPROVE_PO',
    N'WAIT_MGR_UEC_APPROVE_PO',
    N'UEC_SALE'
  ),
  (
    CONVERT(
      uniqueidentifier,
      '22222222-2222-2222-2222-222222222222'
    ),
    N'APPROVE_MGR_PO',
    N'WAIT_MGR_UEC_APPROVE_PO',
    N'VESSEL_SCHEDULED',
    N'UEC_MANAGER'
  ),
  (
    CONVERT(
      uniqueidentifier,
      '22222222-2222-2222-2222-222222222222'
    ),
    N'UPLOAD_FINAL_DOCS',
    N'VESSEL_SCHEDULED',
    N'VESSEL_DEPARTED',
    N'TSL_CS'
  );

COMMIT TRANSACTION;

GO
