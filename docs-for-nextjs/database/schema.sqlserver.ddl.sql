SET
  ANSI_NULLS ON;

GO
SET
  QUOTED_IDENTIFIER ON;

GO
/*
SQL Server reference DDL for the next backend project.
Physical names follow the SQL Server naming guidance documented in:
- database/DATABASE-SCHEMA-SQLSERVER.md
- requirements/domain/ORDER-STRUCTURE.md
 */
CREATE TABLE
  dbo.CustomerCompany (
    CompanyCode NVARCHAR (50) NOT NULL,
    CompanyName NVARCHAR (200) NOT NULL,
    CreatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_CustomerCompany_CreatedAt DEFAULT SYSUTCDATETIME (),
    UpdatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_CustomerCompany_UpdatedAt DEFAULT SYSUTCDATETIME (),
    CONSTRAINT PK_CustomerCompany PRIMARY KEY CLUSTERED (CompanyCode)
  );

GO
CREATE TABLE
  dbo.GroupSaleType (
    GroupSaleTypeCode NVARCHAR (20) NOT NULL,
    GroupSaleTypeName NVARCHAR (100) NOT NULL,
    CONSTRAINT PK_GroupSaleType PRIMARY KEY CLUSTERED (GroupSaleTypeCode),
    CONSTRAINT CK_GroupSaleType_GroupSaleTypeCode CHECK (GroupSaleTypeCode IN ('OVERSEAS', 'DOMESTIC'))
  );

GO
CREATE TABLE
  dbo.Destination (
    DestinationCode NVARCHAR (50) NOT NULL,
    DestinationName NVARCHAR (200) NOT NULL,
    CreatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_Destination_CreatedAt DEFAULT SYSUTCDATETIME (),
    UpdatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_Destination_UpdatedAt DEFAULT SYSUTCDATETIME (),
    CONSTRAINT PK_Destination PRIMARY KEY CLUSTERED (DestinationCode)
  );

GO
CREATE TABLE
  dbo.ShippingTerm (
    TermCode NVARCHAR (50) NOT NULL,
    TermName NVARCHAR (200) NOT NULL,
    CreatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_ShippingTerm_CreatedAt DEFAULT SYSUTCDATETIME (),
    UpdatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_ShippingTerm_UpdatedAt DEFAULT SYSUTCDATETIME (),
    CONSTRAINT PK_ShippingTerm PRIMARY KEY CLUSTERED (TermCode)
  );

GO
CREATE TABLE
  dbo.ProductGrade (
    GradeCode NVARCHAR (50) NOT NULL,
    GradeName NVARCHAR (200) NOT NULL,
    CreatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_ProductGrade_CreatedAt DEFAULT SYSUTCDATETIME (),
    UpdatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_ProductGrade_UpdatedAt DEFAULT SYSUTCDATETIME (),
    CONSTRAINT PK_ProductGrade PRIMARY KEY CLUSTERED (GradeCode)
  );

GO
CREATE TABLE
  dbo.ShipTo (
    ShipToCode NVARCHAR (100) NOT NULL,
    ShipToName NVARCHAR (300) NOT NULL,
    GroupSaleTypeCode NVARCHAR (20) NOT NULL,
    CreatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_ShipTo_CreatedAt DEFAULT SYSUTCDATETIME (),
    UpdatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_ShipTo_UpdatedAt DEFAULT SYSUTCDATETIME (),
    CONSTRAINT PK_ShipTo PRIMARY KEY CLUSTERED (ShipToCode),
    CONSTRAINT FK_ShipTo_GroupSaleType FOREIGN KEY (GroupSaleTypeCode) REFERENCES dbo.GroupSaleType (GroupSaleTypeCode) ON DELETE NO ACTION ON UPDATE NO ACTION
  );

GO
CREATE TABLE
  dbo.AppUser (
    UserId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_AppUser_UserId DEFAULT NEWSEQUENTIALID (),
    UserName NVARCHAR (100) NOT NULL,
    RoleCode NVARCHAR (30) NOT NULL,
    UserGroupCode NVARCHAR (30) NOT NULL,
    CompanyCode NVARCHAR (50) NOT NULL,
    CanCreateOrder BIT NOT NULL CONSTRAINT DF_AppUser_CanCreateOrder DEFAULT (0),
    ShipToAccessMode NVARCHAR (20) NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_AppUser_IsActive DEFAULT (1),
    CreatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_AppUser_CreatedAt DEFAULT SYSUTCDATETIME (),
    UpdatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_AppUser_UpdatedAt DEFAULT SYSUTCDATETIME (),
    CONSTRAINT PK_AppUser PRIMARY KEY CLUSTERED (UserId),
    CONSTRAINT UQ_AppUser_UserName UNIQUE (UserName),
    CONSTRAINT CK_AppUser_RoleCode CHECK (
      RoleCode IN (
        'UBE_JAPAN',
        'MAIN_TRADER',
        'CS',
        'SALE',
        'SALE_MANAGER',
        'ADMIN'
      )
    ),
    CONSTRAINT CK_AppUser_UserGroupCode CHECK (
      UserGroupCode IN (
        'TRADER',
        'UEC_SALE',
        'TSL_SALE',
        'UEC_MANAGER',
        'TSL_CS',
        'ADMIN'
      )
    ),
    CONSTRAINT CK_AppUser_ShipToAccessMode CHECK (ShipToAccessMode IN ('ALL', 'SELECTED')),
    CONSTRAINT FK_AppUser_CustomerCompany FOREIGN KEY (CompanyCode) REFERENCES dbo.CustomerCompany (CompanyCode) ON DELETE NO ACTION ON UPDATE NO ACTION
  );

GO
CREATE TABLE
  dbo.UserShipToAccess (
    UserId UNIQUEIDENTIFIER NOT NULL,
    ShipToCode NVARCHAR (100) NOT NULL,
    CONSTRAINT PK_UserShipToAccess PRIMARY KEY CLUSTERED (UserId, ShipToCode),
    CONSTRAINT FK_UserShipToAccess_AppUser FOREIGN KEY (UserId) REFERENCES dbo.AppUser (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_UserShipToAccess_ShipTo FOREIGN KEY (ShipToCode) REFERENCES dbo.ShipTo (ShipToCode) ON DELETE NO ACTION ON UPDATE NO ACTION
  );

GO
CREATE TABLE
  dbo.UserDocumentTypeAccess (
    UserId UNIQUEIDENTIFIER NOT NULL,
    DocumentTypeCode NVARCHAR (40) NOT NULL,
    CONSTRAINT PK_UserDocumentTypeAccess PRIMARY KEY CLUSTERED (UserId, DocumentTypeCode),
    CONSTRAINT CK_UserDocumentTypeAccess_DocumentTypeCode CHECK (
      DocumentTypeCode IN (
        'Shipping Document',
        'BL',
        'Invoice',
        'COA',
        'PO_PDF',
        'SHIPPING_INSTRUCTION_PDF'
      )
    ),
    CONSTRAINT FK_UserDocumentTypeAccess_AppUser FOREIGN KEY (UserId) REFERENCES dbo.AppUser (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION
  );

GO
CREATE TABLE
  dbo.ShipToDestinationMap (
    ShipToCode NVARCHAR (100) NOT NULL,
    DestinationCode NVARCHAR (50) NOT NULL,
    CONSTRAINT PK_ShipToDestinationMap PRIMARY KEY CLUSTERED (ShipToCode, DestinationCode),
    CONSTRAINT FK_ShipToDestinationMap_ShipTo FOREIGN KEY (ShipToCode) REFERENCES dbo.ShipTo (ShipToCode) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_ShipToDestinationMap_Destination FOREIGN KEY (DestinationCode) REFERENCES dbo.Destination (DestinationCode) ON DELETE NO ACTION ON UPDATE NO ACTION
  );

GO
CREATE TABLE
  dbo.PoTemplate (
    PoTemplateId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_PoTemplate_PoTemplateId DEFAULT NEWSEQUENTIALID (),
    ShipToCode NVARCHAR (100) NOT NULL,
    ToBlock NVARCHAR (MAX) NOT NULL,
    ConsigneeNotify NVARCHAR (MAX) NOT NULL,
    Agent NVARCHAR (MAX) NULL,
    EndUser NVARCHAR (MAX) NULL,
    TermsOfPayment NVARCHAR (MAX) NULL,
    PackingInstructions NVARCHAR (MAX) NULL,
    ConfirmBy NVARCHAR (MAX) NULL,
    CreatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_PoTemplate_CreatedAt DEFAULT SYSUTCDATETIME (),
    UpdatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_PoTemplate_UpdatedAt DEFAULT SYSUTCDATETIME (),
    CONSTRAINT PK_PoTemplate PRIMARY KEY CLUSTERED (PoTemplateId),
    CONSTRAINT UQ_PoTemplate_ShipToCode UNIQUE (ShipToCode),
    CONSTRAINT FK_PoTemplate_ShipTo FOREIGN KEY (ShipToCode) REFERENCES dbo.ShipTo (ShipToCode) ON DELETE NO ACTION ON UPDATE NO ACTION
  );

GO
CREATE TABLE
  dbo.SiTemplate (
    SiTemplateId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_SiTemplate_SiTemplateId DEFAULT NEWSEQUENTIALID (),
    ShipToCode NVARCHAR (100) NOT NULL,
    Attn NVARCHAR (MAX) NULL,
    FromBlock NVARCHAR (MAX) NULL,
    PoNumberHeader NVARCHAR (MAX) NULL,
    No2Header NVARCHAR (MAX) NULL,
    No2 NVARCHAR (MAX) NULL,
    MaterialCodeHeader NVARCHAR (MAX) NULL,
    MaterialCode NVARCHAR (MAX) NULL,
    NoteUnderMaterial NVARCHAR (MAX) NULL,
    UserText NVARCHAR (MAX) NULL,
    Country NVARCHAR (MAX) NULL,
    Shipper NVARCHAR (MAX) NULL,
    FeederVessel NVARCHAR (MAX) NULL,
    MotherVessel NVARCHAR (MAX) NULL,
    VesselCompany NVARCHAR (MAX) NULL,
    Forwarder NVARCHAR (MAX) NULL,
    PortOfLoading NVARCHAR (MAX) NULL,
    Consignee NVARCHAR (MAX) NULL,
    BlType NVARCHAR (MAX) NULL,
    FreeTime NVARCHAR (MAX) NULL,
    CourierAddress NVARCHAR (MAX) NULL,
    EoriNo NVARCHAR (MAX) NULL,
    BookingNo NVARCHAR (MAX) NULL,
    NotifyParty NVARCHAR (MAX) NULL,
    AlsoNotify1 NVARCHAR (MAX) NULL,
    AlsoNotify2 NVARCHAR (MAX) NULL,
    DeliverTo NVARCHAR (MAX) NULL,
    Requirements NVARCHAR (MAX) NULL,
    Note NVARCHAR (MAX) NULL,
    Note2 NVARCHAR (MAX) NULL,
    Note3 NVARCHAR (MAX) NULL,
    Description NVARCHAR (MAX) NULL,
    UnderDescription NVARCHAR (MAX) NULL,
    ShippingMark NVARCHAR (MAX) NULL,
    BelowSignature NVARCHAR (MAX) NULL,
    CreatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_SiTemplate_CreatedAt DEFAULT SYSUTCDATETIME (),
    UpdatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_SiTemplate_UpdatedAt DEFAULT SYSUTCDATETIME (),
    CONSTRAINT PK_SiTemplate PRIMARY KEY CLUSTERED (SiTemplateId),
    CONSTRAINT UQ_SiTemplate_ShipToCode UNIQUE (ShipToCode),
    CONSTRAINT FK_SiTemplate_ShipTo FOREIGN KEY (ShipToCode) REFERENCES dbo.ShipTo (ShipToCode) ON DELETE NO ACTION ON UPDATE NO ACTION
  );

GO
CREATE TABLE
  dbo.OrderHeader (
    OrderHeaderId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_OrderHeader_OrderHeaderId DEFAULT NEWSEQUENTIALID (),
    PurchaseOrderNumber NVARCHAR (100) NOT NULL,
    OrderDate DATE NOT NULL,
    CompanyCode NVARCHAR (50) NOT NULL,
    ShipToCode NVARCHAR (100) NOT NULL,
    DestinationCode NVARCHAR (50) NOT NULL,
    TermCode NVARCHAR (50) NOT NULL,
    OrderHeaderStatusCode NVARCHAR (40) NOT NULL,
    RequestedEtd DATE NULL,
    RequestedEta DATE NULL,
    Price DECIMAL(18, 4) NULL,
    CurrencyCode NVARCHAR (10) NULL,
    OtherRequestedText NVARCHAR (MAX) NULL,
    SaleNote NVARCHAR (MAX) NULL,
    QuotationNumber NVARCHAR (50) NULL,
    IsAsap BIT NOT NULL CONSTRAINT DF_OrderHeader_IsAsap DEFAULT (0),
    ActualEtd DATE NULL,
    ClearanceDate DATE NULL,
    FeederVesselName NVARCHAR (200) NULL,
    MotherVesselName NVARCHAR (200) NULL,
    VesselCompanyName NVARCHAR (200) NULL,
    ForwarderName NVARCHAR (200) NULL,
    VesselEtd DATE NULL,
    VesselEta DATE NULL,
    OrderNote NVARCHAR (MAX) NULL,
    PdfSnapshotJson NVARCHAR (MAX) NULL,
    CreatedByUserName NVARCHAR (100) NOT NULL,
    UpdatedByUserName NVARCHAR (100) NOT NULL,
    CreatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_OrderHeader_CreatedAt DEFAULT SYSUTCDATETIME (),
    UpdatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_OrderHeader_UpdatedAt DEFAULT SYSUTCDATETIME (),
    CONSTRAINT PK_OrderHeader PRIMARY KEY CLUSTERED (OrderHeaderId),
    CONSTRAINT UQ_OrderHeader_PurchaseOrderNumber UNIQUE (PurchaseOrderNumber),
    CONSTRAINT CK_OrderHeader_OrderHeaderStatusCode CHECK (
      OrderHeaderStatusCode IN (
        'DRAFT',
        'CREATED',
        'APPROVED',
        'WAIT_SALE_UEC_APPROVE_PO',
        'WAIT_MGR_UEC_APPROVE_PO',
        'VESSEL_SCHEDULED',
        'VESSEL_DEPARTED'
      )
    ),
    CONSTRAINT CK_OrderHeader_PdfSnapshotJson CHECK (
      PdfSnapshotJson IS NULL
      OR ISJSON (PdfSnapshotJson) = 1
    ),
    CONSTRAINT FK_OrderHeader_CustomerCompany FOREIGN KEY (CompanyCode) REFERENCES dbo.CustomerCompany (CompanyCode) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_OrderHeader_ShipTo FOREIGN KEY (ShipToCode) REFERENCES dbo.ShipTo (ShipToCode) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_OrderHeader_Destination FOREIGN KEY (DestinationCode) REFERENCES dbo.Destination (DestinationCode) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_OrderHeader_ShippingTerm FOREIGN KEY (TermCode) REFERENCES dbo.ShippingTerm (TermCode) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_OrderHeader_CreatedByUser FOREIGN KEY (CreatedByUserName) REFERENCES dbo.AppUser (UserName) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_OrderHeader_UpdatedByUser FOREIGN KEY (UpdatedByUserName) REFERENCES dbo.AppUser (UserName) ON DELETE NO ACTION ON UPDATE NO ACTION
  );

GO
CREATE TABLE
  dbo.OrderLine (
    OrderLineId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_OrderLine_OrderLineId DEFAULT NEWSEQUENTIALID (),
    OrderHeaderId UNIQUEIDENTIFIER NOT NULL,
    LineNumber INT NOT NULL,
    ProductCode NVARCHAR (100) NULL,
    GradeCode NVARCHAR (50) NULL,
    ProductName NVARCHAR (200) NULL,
    Quantity DECIMAL(18, 3) NOT NULL,
    UnitCode NVARCHAR (30) NULL,
    RemarkText NVARCHAR (MAX) NULL,
    CreatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_OrderLine_CreatedAt DEFAULT SYSUTCDATETIME (),
    UpdatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_OrderLine_UpdatedAt DEFAULT SYSUTCDATETIME (),
    CONSTRAINT PK_OrderLine PRIMARY KEY CLUSTERED (OrderLineId),
    CONSTRAINT UQ_OrderLine_OrderHeaderId_LineNumber UNIQUE (OrderHeaderId, LineNumber),
    CONSTRAINT FK_OrderLine_OrderHeader FOREIGN KEY (OrderHeaderId) REFERENCES dbo.OrderHeader (OrderHeaderId) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_OrderLine_ProductGrade FOREIGN KEY (GradeCode) REFERENCES dbo.ProductGrade (GradeCode) ON DELETE NO ACTION ON UPDATE NO ACTION
  );

GO
CREATE TABLE
  dbo.OrderLineDocument (
    OrderLineDocumentId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_OrderLineDocument_OrderLineDocumentId DEFAULT NEWSEQUENTIALID (),
    OrderLineId UNIQUEIDENTIFIER NOT NULL,
    DocumentTypeCode NVARCHAR (40) NOT NULL,
    FileName NVARCHAR (260) NOT NULL,
    StorageUrl NVARCHAR (MAX) NULL,
    UploadedByUserName NVARCHAR (100) NOT NULL,
    UploadedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_OrderLineDocument_UploadedAt DEFAULT SYSUTCDATETIME (),
    CONSTRAINT PK_OrderLineDocument PRIMARY KEY CLUSTERED (OrderLineDocumentId),
    CONSTRAINT UQ_OrderLineDocument_OrderLineId_DocumentTypeCode UNIQUE (OrderLineId, DocumentTypeCode),
    CONSTRAINT CK_OrderLineDocument_DocumentTypeCode CHECK (
      DocumentTypeCode IN (
        'Shipping Document',
        'BL',
        'Invoice',
        'COA',
        'PO_PDF',
        'SHIPPING_INSTRUCTION_PDF'
      )
    ),
    CONSTRAINT FK_OrderLineDocument_OrderLine FOREIGN KEY (OrderLineId) REFERENCES dbo.OrderLine (OrderLineId) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_OrderLineDocument_AppUser FOREIGN KEY (UploadedByUserName) REFERENCES dbo.AppUser (UserName) ON DELETE NO ACTION ON UPDATE NO ACTION
  );

GO
CREATE TABLE
  dbo.OrderHeaderDocument (
    OrderHeaderDocumentId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_OrderHeaderDocument_OrderHeaderDocumentId DEFAULT NEWSEQUENTIALID (),
    OrderHeaderId UNIQUEIDENTIFIER NOT NULL,
    DocumentTypeCode NVARCHAR (40) NOT NULL,
    FileName NVARCHAR (260) NOT NULL,
    StorageUrl NVARCHAR (MAX) NULL,
    DataUrl NVARCHAR (MAX) NULL,
    UploadedByUserName NVARCHAR (100) NOT NULL,
    UploadedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_OrderHeaderDocument_UploadedAt DEFAULT SYSUTCDATETIME (),
    CONSTRAINT PK_OrderHeaderDocument PRIMARY KEY CLUSTERED (OrderHeaderDocumentId),
    CONSTRAINT UQ_OrderHeaderDocument_OrderHeaderId_DocumentTypeCode UNIQUE (OrderHeaderId, DocumentTypeCode),
    CONSTRAINT CK_OrderHeaderDocument_DocumentTypeCode CHECK (
      DocumentTypeCode IN (
        'Shipping Document',
        'BL',
        'Invoice',
        'COA',
        'PO_PDF',
        'SHIPPING_INSTRUCTION_PDF'
      )
    ),
    CONSTRAINT FK_OrderHeaderDocument_OrderHeader FOREIGN KEY (OrderHeaderId) REFERENCES dbo.OrderHeader (OrderHeaderId) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_OrderHeaderDocument_AppUser FOREIGN KEY (UploadedByUserName) REFERENCES dbo.AppUser (UserName) ON DELETE NO ACTION ON UPDATE NO ACTION
  );

GO
CREATE TABLE
  dbo.HeaderActionPermission (
    HeaderActionCode NVARCHAR (40) NOT NULL,
    FromOrderHeaderStatusCode NVARCHAR (40) NOT NULL,
    ToOrderHeaderStatusCode NVARCHAR (40) NOT NULL,
    AllowedUserGroupCode NVARCHAR (30) NOT NULL,
    CONSTRAINT PK_HeaderActionPermission PRIMARY KEY CLUSTERED (
      HeaderActionCode,
      FromOrderHeaderStatusCode,
      AllowedUserGroupCode
    ),
    CONSTRAINT CK_HeaderActionPermission_HeaderActionCode CHECK (
      HeaderActionCode IN (
        'SUBMIT_LINE',
        'APPROVE_LINE',
        'SET_ETD',
        'APPROVE_SALE_PO',
        'APPROVE_MGR_PO',
        'UPLOAD_FINAL_DOCS'
      )
    ),
    CONSTRAINT CK_HeaderActionPermission_FromOrderHeaderStatusCode CHECK (
      FromOrderHeaderStatusCode IN (
        'DRAFT',
        'CREATED',
        'APPROVED',
        'WAIT_SALE_UEC_APPROVE_PO',
        'WAIT_MGR_UEC_APPROVE_PO',
        'VESSEL_SCHEDULED',
        'VESSEL_DEPARTED'
      )
    ),
    CONSTRAINT CK_HeaderActionPermission_ToOrderHeaderStatusCode CHECK (
      ToOrderHeaderStatusCode IN (
        'DRAFT',
        'CREATED',
        'APPROVED',
        'WAIT_SALE_UEC_APPROVE_PO',
        'WAIT_MGR_UEC_APPROVE_PO',
        'VESSEL_SCHEDULED',
        'VESSEL_DEPARTED'
      )
    ),
    CONSTRAINT CK_HeaderActionPermission_AllowedUserGroupCode CHECK (
      AllowedUserGroupCode IN (
        'TRADER',
        'UEC_SALE',
        'TSL_SALE',
        'UEC_MANAGER',
        'TSL_CS',
        'ADMIN'
      )
    )
  );

GO
CREATE TABLE
  dbo.HeaderPermissionPreset (
    HeaderPermissionPresetId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_HeaderPermissionPreset_HeaderPermissionPresetId DEFAULT NEWSEQUENTIALID (),
    PresetName NVARCHAR (100) NOT NULL,
    IsSystemPreset BIT NOT NULL CONSTRAINT DF_HeaderPermissionPreset_IsSystemPreset DEFAULT (0),
    CreatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_HeaderPermissionPreset_CreatedAt DEFAULT SYSUTCDATETIME (),
    UpdatedAt DATETIME2 (3) NOT NULL CONSTRAINT DF_HeaderPermissionPreset_UpdatedAt DEFAULT SYSUTCDATETIME (),
    CONSTRAINT PK_HeaderPermissionPreset PRIMARY KEY CLUSTERED (HeaderPermissionPresetId),
    CONSTRAINT UQ_HeaderPermissionPreset_PresetName UNIQUE (PresetName)
  );

GO
CREATE TABLE
  dbo.HeaderPermissionPresetRule (
    HeaderPermissionPresetId UNIQUEIDENTIFIER NOT NULL,
    HeaderActionCode NVARCHAR (40) NOT NULL,
    FromOrderHeaderStatusCode NVARCHAR (40) NOT NULL,
    ToOrderHeaderStatusCode NVARCHAR (40) NOT NULL,
    AllowedUserGroupCode NVARCHAR (30) NOT NULL,
    CONSTRAINT PK_HeaderPermissionPresetRule PRIMARY KEY CLUSTERED (
      HeaderPermissionPresetId,
      HeaderActionCode,
      FromOrderHeaderStatusCode,
      AllowedUserGroupCode
    ),
    CONSTRAINT CK_HeaderPermissionPresetRule_HeaderActionCode CHECK (
      HeaderActionCode IN (
        'SUBMIT_LINE',
        'APPROVE_LINE',
        'SET_ETD',
        'APPROVE_SALE_PO',
        'APPROVE_MGR_PO',
        'UPLOAD_FINAL_DOCS'
      )
    ),
    CONSTRAINT CK_HeaderPermissionPresetRule_FromOrderHeaderStatusCode CHECK (
      FromOrderHeaderStatusCode IN (
        'DRAFT',
        'CREATED',
        'APPROVED',
        'WAIT_SALE_UEC_APPROVE_PO',
        'WAIT_MGR_UEC_APPROVE_PO',
        'VESSEL_SCHEDULED',
        'VESSEL_DEPARTED'
      )
    ),
    CONSTRAINT CK_HeaderPermissionPresetRule_ToOrderHeaderStatusCode CHECK (
      ToOrderHeaderStatusCode IN (
        'DRAFT',
        'CREATED',
        'APPROVED',
        'WAIT_SALE_UEC_APPROVE_PO',
        'WAIT_MGR_UEC_APPROVE_PO',
        'VESSEL_SCHEDULED',
        'VESSEL_DEPARTED'
      )
    ),
    CONSTRAINT CK_HeaderPermissionPresetRule_AllowedUserGroupCode CHECK (
      AllowedUserGroupCode IN (
        'TRADER',
        'UEC_SALE',
        'TSL_SALE',
        'UEC_MANAGER',
        'TSL_CS',
        'ADMIN'
      )
    ),
    CONSTRAINT FK_HeaderPermissionPresetRule_HeaderPermissionPreset FOREIGN KEY (HeaderPermissionPresetId) REFERENCES dbo.HeaderPermissionPreset (HeaderPermissionPresetId) ON DELETE NO ACTION ON UPDATE NO ACTION
  );

GO
CREATE TABLE
  dbo.AppSetting (
    SettingKey NVARCHAR (100) NOT NULL,
    SettingValueJson NVARCHAR (MAX) NOT NULL,
    CONSTRAINT PK_AppSetting PRIMARY KEY CLUSTERED (SettingKey),
    CONSTRAINT CK_AppSetting_SettingValueJson CHECK (ISJSON (SettingValueJson) = 1)
  );

GO
CREATE TABLE
  dbo.IntegrationLog (
    IntegrationLogId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_IntegrationLog_IntegrationLogId DEFAULT NEWSEQUENTIALID (),
    OrderHeaderId UNIQUEIDENTIFIER NOT NULL,
    IntegrationTypeCode NVARCHAR (40) NOT NULL,
    IntegrationStatusCode NVARCHAR (20) NOT NULL,
    MessageText NVARCHAR (MAX) NOT NULL,
    OccurredAt DATETIME2 (3) NOT NULL CONSTRAINT DF_IntegrationLog_OccurredAt DEFAULT SYSUTCDATETIME (),
    CONSTRAINT PK_IntegrationLog PRIMARY KEY CLUSTERED (IntegrationLogId),
    CONSTRAINT CK_IntegrationLog_IntegrationStatusCode CHECK (
      IntegrationStatusCode IN ('SUCCESS', 'FAILED', 'PENDING')
    ),
    CONSTRAINT FK_IntegrationLog_OrderHeader FOREIGN KEY (OrderHeaderId) REFERENCES dbo.OrderHeader (OrderHeaderId) ON DELETE NO ACTION ON UPDATE NO ACTION
  );

GO
CREATE TABLE
  dbo.NotificationLog (
    NotificationLogId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_NotificationLog_NotificationLogId DEFAULT NEWSEQUENTIALID (),
    OrderHeaderId UNIQUEIDENTIFIER NULL,
    MessageText NVARCHAR (MAX) NOT NULL,
    OccurredAt DATETIME2 (3) NOT NULL CONSTRAINT DF_NotificationLog_OccurredAt DEFAULT SYSUTCDATETIME (),
    TargetRoleCode NVARCHAR (30) NOT NULL,
    NotificationTypeCode NVARCHAR (20) NOT NULL,
    EventName NVARCHAR (100) NOT NULL,
    CONSTRAINT PK_NotificationLog PRIMARY KEY CLUSTERED (NotificationLogId),
    CONSTRAINT CK_NotificationLog_TargetRoleCode CHECK (
      TargetRoleCode IN (
        'UBE_JAPAN',
        'MAIN_TRADER',
        'CS',
        'SALE',
        'SALE_MANAGER',
        'ADMIN'
      )
    ),
    CONSTRAINT CK_NotificationLog_NotificationTypeCode CHECK (NotificationTypeCode IN ('email', 'system')),
    CONSTRAINT FK_NotificationLog_OrderHeader FOREIGN KEY (OrderHeaderId) REFERENCES dbo.OrderHeader (OrderHeaderId) ON DELETE NO ACTION ON UPDATE NO ACTION
  );

GO
CREATE TABLE
  dbo.ActivityLog (
    ActivityLogId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ActivityLog_ActivityLogId DEFAULT NEWSEQUENTIALID (),
    OrderHeaderId UNIQUEIDENTIFIER NULL,
    ActivityCategoryCode NVARCHAR (30) NOT NULL,
    ActionName NVARCHAR (200) NOT NULL,
    ActorUserName NVARCHAR (100) NOT NULL,
    OccurredAt DATETIME2 (3) NOT NULL CONSTRAINT DF_ActivityLog_OccurredAt DEFAULT SYSUTCDATETIME (),
    DetailText NVARCHAR (MAX) NOT NULL,
    CONSTRAINT PK_ActivityLog PRIMARY KEY CLUSTERED (ActivityLogId),
    CONSTRAINT FK_ActivityLog_OrderHeader FOREIGN KEY (OrderHeaderId) REFERENCES dbo.OrderHeader (OrderHeaderId) ON DELETE NO ACTION ON UPDATE NO ACTION
  );

GO CREATE INDEX IX_OrderHeader_CompanyCode_OrderDate ON dbo.OrderHeader (CompanyCode, OrderDate DESC);

GO CREATE INDEX IX_OrderHeader_ShipToCode_UpdatedAt ON dbo.OrderHeader (ShipToCode, UpdatedAt DESC);

GO CREATE INDEX IX_OrderHeader_OrderHeaderStatusCode_UpdatedAt ON dbo.OrderHeader (OrderHeaderStatusCode, UpdatedAt DESC);

GO CREATE INDEX IX_OrderLine_OrderHeaderId ON dbo.OrderLine (OrderHeaderId);

GO CREATE INDEX IX_OrderLine_GradeCode ON dbo.OrderLine (GradeCode);

GO CREATE INDEX IX_OrderLineDocument_OrderLineId ON dbo.OrderLineDocument (OrderLineId);

GO CREATE INDEX IX_OrderHeaderDocument_OrderHeaderId ON dbo.OrderHeaderDocument (OrderHeaderId);

GO CREATE INDEX IX_IntegrationLog_OrderHeaderId_OccurredAt ON dbo.IntegrationLog (OrderHeaderId, OccurredAt DESC);

GO CREATE INDEX IX_NotificationLog_TargetRoleCode_OccurredAt ON dbo.NotificationLog (TargetRoleCode, OccurredAt DESC);

GO CREATE INDEX IX_ActivityLog_ActivityCategoryCode_OccurredAt ON dbo.ActivityLog (ActivityCategoryCode, OccurredAt DESC);

GO CREATE INDEX IX_HeaderActionPermission_FromOrderHeaderStatusCode_HeaderActionCode ON dbo.HeaderActionPermission (FromOrderHeaderStatusCode, HeaderActionCode);

GO
