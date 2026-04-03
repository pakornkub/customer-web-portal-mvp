import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Role,
  OrderLineStatus,
  OrderProgressStatus,
  UserGroup,
  GroupSaleType,
  GroupSaleTypeRecord,
  LineAction,
  LineActionPermission,
  User,
  Order,
  CustomerCompany,
  ShipToRecord,
  MasterDataRecord,
  NotificationLog,
  ActivityLog,
  DocumentType,
  IntegrationLog,
  PoTemplate,
  SiTemplate
} from './types';

export const deriveOrderProgressStatus = (
  items: Order['items']
): OrderProgressStatus => {
  if (items.length === 0) return OrderProgressStatus.CREATE;

  const allCompleted = items.every(
    (item) => item.status === OrderLineStatus.VESSEL_DEPARTED
  );
  if (allCompleted) return OrderProgressStatus.COMPLETE;

  const allDraft = items.every((item) => item.status === OrderLineStatus.DRAFT);
  if (allDraft) return OrderProgressStatus.CREATE;

  return OrderProgressStatus.IN_PROGRESS;
};

export const canUserAccessShipTo = (user: User, shipToId: string) => {
  if (user.role === Role.ADMIN) return true;
  if (user.shipToAccess === 'ALL') return true;
  return user.allowedShipToIds.includes(shipToId);
};

export const getVisibleOrdersForUser = (orders: Order[], user: User | null) => {
  if (!user) return [];
  if (user.role === Role.ADMIN) return orders;

  return orders
    .map((order) => {
      const visibleItems = order.items.filter((item) =>
        canUserAccessShipTo(user, item.shipToId)
      );

      if (visibleItems.length === 0) return null;

      return {
        ...order,
        items: visibleItems,
        status: deriveOrderProgressStatus(visibleItems)
      };
    })
    .filter((order): order is Order => Boolean(order));
};

const canGroupRunAction = (user: User, permission: LineActionPermission) =>
  permission.allowedUserGroups.includes(user.userGroup);

export const canUserRunLineAction = (
  user: User | null,
  lineStatus: OrderLineStatus,
  action: LineAction,
  matrix: LineActionPermission[]
) => {
  if (!user) return false;
  if (user.role === Role.ADMIN) return true;

  const permission = matrix.find(
    (item) => item.action === action && item.fromStatus === lineStatus
  );
  if (!permission) return false;

  return canGroupRunAction(user, permission);
};

interface MasterDataState {
  destinations: MasterDataRecord[];
  terms: MasterDataRecord[];
  grades: MasterDataRecord[];
  shipTos: ShipToRecord[];
  groupSaleTypes: GroupSaleTypeRecord[];
  poTemplates: PoTemplate[];
  siTemplates: SiTemplate[];
}

interface LinePermissionNamedPreset {
  id: string;
  name: string;
  matrix: LineActionPermission[];
}

interface AppState {
  theme: 'light' | 'dark';
  currentUser: User | null;
  users: User[];
  companies: CustomerCompany[];
  orders: Order[];
  integrationLogs: IntegrationLog[];
  masterData: MasterDataState;
  linePermissionMatrix: LineActionPermission[];
  linePermissionLocked: boolean;
  linePermissionCustomPresets: LinePermissionNamedPreset[];
  notifications: NotificationLog[];
  activities: ActivityLog[];

  // Actions
  toggleTheme: () => void;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderNo: string, updates: Partial<Order>) => void;
  deleteOrder: (orderNo: string) => void;
  addNotification: (
    message: string,
    role: Role,
    type?: 'email' | 'system'
  ) => void;
  addActivity: (action: string, user: string, details: string) => void;
  addIntegrationLog: (log: Omit<IntegrationLog, 'id' | 'timestamp'>) => void;
  updateMasterData: (
    type: 'destinations' | 'terms' | 'grades',
    data: MasterDataRecord[]
  ) => void;
  updateShipTos: (data: ShipToRecord[]) => void;
  updateGroupSaleTypes: (data: GroupSaleTypeRecord[]) => void;
  updateCompanies: (data: CustomerCompany[]) => void;
  addPoTemplate: (
    template: Omit<PoTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;
  updatePoTemplate: (
    id: string,
    updates: Partial<Omit<PoTemplate, 'id' | 'createdAt'>>
  ) => void;
  removePoTemplate: (id: string) => void;
  addSiTemplate: (
    template: Omit<SiTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;
  updateSiTemplate: (
    id: string,
    updates: Partial<Omit<SiTemplate, 'id' | 'createdAt'>>
  ) => void;
  removeSiTemplate: (id: string) => void;
  updateUserPermissions: (userId: string, perms: DocumentType[]) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  deleteUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<Omit<User, 'id'>>) => void;
  updateLinePermission: (
    action: LineAction,
    updates: Partial<Omit<LineActionPermission, 'action'>>
  ) => void;
  setLinePermissionLocked: (locked: boolean) => void;
  saveLinePermissionCustomPreset: (name: string) => boolean;
  applyLinePermissionCustomPreset: (presetId: string) => boolean;
  deleteLinePermissionCustomPreset: (presetId: string) => void;
  resetLinePermissionMatrix: () => void;
  applyLinePermissionPreset: (preset: 'STANDARD' | 'STRICT') => void;
  runScheduledChecks: () => void;
  resetStore: () => void;
  clearTransactionalData: () => void;
}

export const createStandardLinePermissionMatrix =
  (): LineActionPermission[] => [
    {
      action: LineAction.SUBMIT_LINE,
      fromStatus: OrderLineStatus.DRAFT,
      toStatus: OrderLineStatus.CREATED,
      allowedUserGroups: [
        UserGroup.TRADER,
        UserGroup.UEC_SALE,
        UserGroup.TSL_SALE
      ]
    },
    {
      action: LineAction.APPROVE_LINE,
      fromStatus: OrderLineStatus.CREATED,
      toStatus: OrderLineStatus.APPROVED,
      allowedUserGroups: [UserGroup.TSL_SALE]
    },
    {
      action: LineAction.SET_ETD,
      fromStatus: OrderLineStatus.APPROVED,
      toStatus: OrderLineStatus.WAIT_SALE_UEC_APPROVE_PO,
      allowedUserGroups: [UserGroup.TSL_CS]
    },
    {
      action: LineAction.APPROVE_SALE_PO,
      fromStatus: OrderLineStatus.WAIT_SALE_UEC_APPROVE_PO,
      toStatus: OrderLineStatus.WAIT_MGR_UEC_APPROVE_PO,
      allowedUserGroups: [UserGroup.UEC_SALE]
    },
    {
      action: LineAction.APPROVE_MGR_PO,
      fromStatus: OrderLineStatus.WAIT_MGR_UEC_APPROVE_PO,
      toStatus: OrderLineStatus.VESSEL_SCHEDULED,
      allowedUserGroups: [UserGroup.UEC_MANAGER]
    },
    {
      action: LineAction.UPLOAD_FINAL_DOCS,
      fromStatus: OrderLineStatus.VESSEL_SCHEDULED,
      toStatus: OrderLineStatus.VESSEL_DEPARTED,
      allowedUserGroups: [UserGroup.TSL_CS]
    }
  ];

export const createStrictLinePermissionMatrix = (): LineActionPermission[] => [
  {
    action: LineAction.SUBMIT_LINE,
    fromStatus: OrderLineStatus.DRAFT,
    toStatus: OrderLineStatus.CREATED,
    allowedUserGroups: [UserGroup.TRADER]
  },
  {
    action: LineAction.APPROVE_LINE,
    fromStatus: OrderLineStatus.CREATED,
    toStatus: OrderLineStatus.APPROVED,
    allowedUserGroups: [UserGroup.TSL_SALE]
  },
  {
    action: LineAction.SET_ETD,
    fromStatus: OrderLineStatus.APPROVED,
    toStatus: OrderLineStatus.WAIT_SALE_UEC_APPROVE_PO,
    allowedUserGroups: [UserGroup.TSL_CS]
  },
  {
    action: LineAction.APPROVE_SALE_PO,
    fromStatus: OrderLineStatus.WAIT_SALE_UEC_APPROVE_PO,
    toStatus: OrderLineStatus.WAIT_MGR_UEC_APPROVE_PO,
    allowedUserGroups: [UserGroup.UEC_SALE]
  },
  {
    action: LineAction.APPROVE_MGR_PO,
    fromStatus: OrderLineStatus.WAIT_MGR_UEC_APPROVE_PO,
    toStatus: OrderLineStatus.VESSEL_SCHEDULED,
    allowedUserGroups: [UserGroup.UEC_MANAGER]
  },
  {
    action: LineAction.UPLOAD_FINAL_DOCS,
    fromStatus: OrderLineStatus.VESSEL_SCHEDULED,
    toStatus: OrderLineStatus.VESSEL_DEPARTED,
    allowedUserGroups: [UserGroup.TSL_CS]
  }
];

const INITIAL_LINE_PERMISSION_MATRIX = createStandardLinePermissionMatrix();

const UBE_JAPAN_COMPANY_ID = 'AG-UBE-JP';

const clonePermissionMatrix = (matrix: LineActionPermission[]) =>
  matrix.map((item) => ({
    ...item,
    allowedUserGroups: [...item.allowedUserGroups]
  }));

const INITIAL_COMPANIES: CustomerCompany[] = [
  { id: 'C001', name: 'UBE Thailand' },
  { id: UBE_JAPAN_COMPANY_ID, name: 'UBE Japan' },
  { id: 'AG-UBE-EU', name: 'UBE Europe' },
  { id: 'AG-UBE-SH', name: 'UBE Shanghai' },
  { id: 'AG-UBE-TW', name: 'UBE Taiwan' },
  { id: 'AG-UBE-US', name: 'UBE America' },
  { id: 'AG-MAR', name: 'Marubeni' },
  { id: 'AG-SHI', name: 'Shiraishi' },
  { id: 'AG-MIT', name: 'Mitsubishi' }
];

const INITIAL_SHIP_TO_MAPPINGS: ShipToRecord[] = [
  {
    id: 'SHIP-AV-THOMAS',
    name: 'A.V. THOMAS & CO.LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-COCHIN']
  },
  {
    id: 'SHIP-ALERON-VIETNAM',
    name: 'ALERON VIETNAM FOOTWEAR LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-ALLIANCE-TIRE',
    name: 'ALLIANCE TIRE GROUP',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIFA']
  },
  {
    id: 'SHIP-ALPHA-POLYMER',
    name: 'ALPHA-POLYMER CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-AMTEX',
    name: 'AMTEX INTERNATIONAL S.A. DE C.V.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-MANZANILLO']
  },
  {
    id: 'SHIP-APOLLO-TYRES',
    name: 'APOLLO TYRES LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NHAVA-SHEVA', 'DEST-KATTUPALLI']
  },
  {
    id: 'SHIP-BRIDGESTONE-AMERICAS',
    name: 'BRIDGESTONE AMERICAS TIRE OPERATIONS LLC',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-WILSON', 'DEST-CALUMET-CITY']
  },
  {
    id: 'SHIP-BRIDGESTONE-BANDAG',
    name: 'BRIDGESTONE BANDAG LLC',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-MT-VERNON']
  },
  {
    id: 'SHIP-BRIDGESTONE-EUROPE',
    name: 'BRIDGESTONE EUROPE NV/SA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-ANTWERP']
  },
  {
    id: 'SHIP-BRIDGESTONE-INDIA',
    name: 'BRIDGESTONE INDIA PRIVATE LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NHAVA-SHEVA']
  },
  {
    id: 'SHIP-CEAT-LTD',
    name: 'CEAT LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NHAVA-SHEVA']
  },
  {
    id: 'SHIP-CHENG-SHIN-CHINA',
    name: 'CHENG SHIN RUBBER (XIAMEN) IND. CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-XIAMEN']
  },
  {
    id: 'SHIP-CHENG-SHIN-VIETNAM',
    name: 'CHENG SHIN RUBBER VIETNAM CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-CHINA-RUBBER',
    name: 'CHINA RUBBER INDUSTRY ASSOCIATION',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-CONFAB',
    name: 'CONFAB INDUSTRIAL S.A.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SANTOS']
  },
  {
    id: 'SHIP-CONTINENTAL-GERMANY',
    name: 'CONTINENTAL REIFEN DEUTSCHLAND GMBH',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HANNOVER']
  },
  {
    id: 'SHIP-CONTINENTAL-INDIA',
    name: 'CONTINENTAL INDIA LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CHENNAI']
  },
  {
    id: 'SHIP-CONTINENTAL-ROMANIA',
    name: 'CONTINENTAL ANVELOPE S.R.L.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TIMISOARA']
  },
  {
    id: 'SHIP-CONTINENTAL-US',
    name: 'CONTINENTAL TIRE THE AMERICAS LLC',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-MT-VERNON', 'DEST-LAWTON']
  },
  {
    id: 'SHIP-COOPER-TIRE',
    name: 'COOPER TIRE & RUBBER COMPANY',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-WHITE', 'DEST-FINDLAY']
  },
  {
    id: 'SHIP-ENGLEBERT',
    name: 'ENGLEBERT S.R.O.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-OTROKOVICE']
  },
  {
    id: 'SHIP-EUROMASTER',
    name: 'EUROMASTER GMBH',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HANAU']
  },
  {
    id: 'SHIP-FALCON-TYRES',
    name: 'FALCON TYRES LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-MYSORE']
  },
  {
    id: 'SHIP-FENNER-INDIA',
    name: 'FENNER (INDIA) LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CHENNAI']
  },
  {
    id: 'SHIP-GOODYEAR-CHINA',
    name: 'GOODYEAR (CHINA) INVESTMENT CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-QINGDAO', 'DEST-DALIAN']
  },
  {
    id: 'SHIP-GOODYEAR-INDIA',
    name: 'GOODYEAR INDIA LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NHAVA-SHEVA']
  },
  {
    id: 'SHIP-GOODYEAR-LUXEMBOURG',
    name: 'GOODYEAR OPERATIONS SA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-ANTWERP']
  },
  {
    id: 'SHIP-GOODYEAR-POLAND',
    name: 'GOODYEAR DUNLOP TYRES POLSKA SP. Z O.O.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-GDYNIA']
  },
  {
    id: 'SHIP-GOODYEAR-SLOVENIA',
    name: 'GOODYEAR DUNLOP SAVA TIRES D.O.O.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KOPER']
  },
  {
    id: 'SHIP-GOODYEAR-TURKEY',
    name: 'GOODYEAR LASTIKLERI T.A.S.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-GEMLIK']
  },
  {
    id: 'SHIP-GUMOPLAST',
    name: 'GUMOPLAST SP. Z O.O.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-WARSAW-AIRPORT']
  },
  {
    id: 'SHIP-HANKOOK-HUNGARY',
    name: 'HANKOOK TIRE HUNGARY KFT.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-BUDAPEST']
  },
  {
    id: 'SHIP-HANKOOK-INDONESIA',
    name: 'PT. HANKOOK TIRE INDONESIA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JAKARTA', 'DEST-SEMARANG']
  },
  {
    id: 'SHIP-HANKOOK-KOREA',
    name: 'HANKOOK TIRE & TECHNOLOGY CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-BUSAN']
  },
  {
    id: 'SHIP-HANKOOK-US',
    name: 'HANKOOK TYRE AMERICA CORP.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SAVANNAH']
  },
  {
    id: 'SHIP-HENKEL-GERMANY',
    name: 'HENKEL AG & CO. KGAA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAMBURG']
  },
  {
    id: 'SHIP-HUTCHINSON-FRANCE',
    name: 'HUTCHINSON SA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-LE-HAVRE']
  },
  {
    id: 'SHIP-INOUE-RUBBER',
    name: 'INOUE RUBBER CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KOBE']
  },
  {
    id: 'SHIP-IRC',
    name: 'INOUE RUBBER (THAILAND) CO., LTD.',
    groupSaleType: GroupSaleType.DOMESTIC,
    destinationIds: []
  },
  {
    id: 'SHIP-JK-TYRE',
    name: 'JK TYRE & INDUSTRIES LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NHAVA-SHEVA', 'DEST-CHENNAI']
  },
  {
    id: 'SHIP-KENDA-RUBBER',
    name: 'KENDA RUBBER INDUSTRIAL CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KEELUNG']
  },
  {
    id: 'SHIP-KUMHO-KOREA',
    name: 'KUMHO TIRE CO., INC.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-BUSAN']
  },
  {
    id: 'SHIP-KUMHO-VIETNAM',
    name: 'KUMHO TIRE VIETNAM CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-LINGLONG-CHINA',
    name: 'SHANDONG LINGLONG TYRE CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-QINGDAO']
  },
  {
    id: 'SHIP-MAXXIS-CHINA',
    name: 'CHENG SHIN RUBBER IND. CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-XIAMEN', 'DEST-TAICHUNG']
  },
  {
    id: 'SHIP-MAXXIS-INDIA',
    name: 'MAXXIS INDUSTRIES (INDIA) PVT. LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CHENNAI']
  },
  {
    id: 'SHIP-MICHELIN-BRAZIL',
    name: 'MICHELIN BRASIL LTDA.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SANTOS']
  },
  {
    id: 'SHIP-MICHELIN-CHINA',
    name: 'MICHELIN (CHINA) INVESTMENT CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI', 'DEST-SHENYANG']
  },
  {
    id: 'SHIP-MICHELIN-FRANCE',
    name: 'MANUFACTURE FRANCAISE DES PNEUMATIQUES MICHELIN',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-LE-HAVRE']
  },
  {
    id: 'SHIP-MICHELIN-GERMANY',
    name: 'MICHELIN REIFENWERKE AG & CO. KGAA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAMBURG']
  },
  {
    id: 'SHIP-MICHELIN-INDIA',
    name: 'MICHELIN INDIA TAMIL NADU TYRES PVT. LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CHENNAI']
  },
  {
    id: 'SHIP-MICHELIN-INDONESIA',
    name: 'PT. MICHELIN INDONESIA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JAKARTA']
  },
  {
    id: 'SHIP-MICHELIN-KOREA',
    name: 'MICHELIN KOREA CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-BUSAN']
  },
  {
    id: 'SHIP-MICHELIN-SERBIA',
    name: 'TIGAR TYRES D.O.O.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KRUSEVAC']
  },
  {
    id: 'SHIP-MICHELIN-THAILAND',
    name: 'SIAM MICHELIN CO., LTD.',
    groupSaleType: GroupSaleType.DOMESTIC,
    destinationIds: []
  },
  {
    id: 'SHIP-MICHELIN-US',
    name: 'MICHELIN NORTH AMERICA INC.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SAVANNAH']
  },
  {
    id: 'SHIP-MRF',
    name: 'MRF LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CHENNAI']
  },
  {
    id: 'SHIP-NEXEN-KOREA',
    name: 'NEXEN TIRE CORPORATION',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-BUSAN']
  },
  {
    id: 'SHIP-NEXEN-CZECHIA',
    name: 'NEXEN TIRE EUROPE S.R.O.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-ZATEC']
  },
  {
    id: 'SHIP-NITTO-JAPAN',
    name: 'NITTO TIRE CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TOKYO']
  },
  {
    id: 'SHIP-NOKIAN-FINLAND',
    name: 'NOKIAN TYRES PLC',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HELSINKI']
  },
  {
    id: 'SHIP-OTANI-THAILAND',
    name: 'OTANI TYRE CO., LTD.',
    groupSaleType: GroupSaleType.DOMESTIC,
    destinationIds: []
  },
  {
    id: 'SHIP-PIRELLI-BRAZIL',
    name: 'PIRELLI PNEUS LTDA.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SANTOS']
  },
  {
    id: 'SHIP-PIRELLI-ITALY',
    name: 'PIRELLI TYRE S.P.A.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-GENOA']
  },
  {
    id: 'SHIP-PIRELLI-TURKEY',
    name: 'PIRELLI LASTIKLERI A.S.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-GEBZE']
  },
  {
    id: 'SHIP-PT-EPN',
    name: 'PT. ELANGPERDANA TYRE INDUSTRY',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JAKARTA']
  },
  {
    id: 'SHIP-PT-GAJAH-TUNGGAL',
    name: 'PT. GAJAH TUNGGAL TBK',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JAKARTA', 'DEST-SEMARANG']
  },
  {
    id: 'SHIP-PT-IRC-INDONESIA',
    name: 'PT. IRC INOAC INDONESIA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JAKARTA']
  },
  {
    id: 'SHIP-PT-MULTISTRADA',
    name: 'PT. MULTISTRADA ARAH SARANA TBK',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JAKARTA']
  },
  {
    id: 'SHIP-PT-SURYARAYA',
    name: 'PT. SURYARAYA RUBBERINDO INDUSTRIES',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JAKARTA']
  },
  {
    id: 'SHIP-QIANKUN-CHINA',
    name: 'QIANKUN TIRE & RUBBER CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-QINGDAO']
  },
  {
    id: 'SHIP-SAILUN-CHINA',
    name: 'SAILUN JINYU GROUP CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-QINGDAO']
  },
  {
    id: 'SHIP-SHANDONG-YONGTAI',
    name: 'SHANDONG YONGTAI GROUP CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-QINGDAO']
  },
  {
    id: 'SHIP-SHIRAISHI-CALCIUM',
    name: 'SHIRAISHI CALCIUM KAISHA LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-OSAKA']
  },
  {
    id: 'SHIP-SRI-TRANG',
    name: 'SRI TRANG AGRO-INDUSTRY PCL',
    groupSaleType: GroupSaleType.DOMESTIC,
    destinationIds: []
  },
  {
    id: 'SHIP-SUMITOMO-JAPAN',
    name: 'SUMITOMO RUBBER INDUSTRIES LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KOBE']
  },
  {
    id: 'SHIP-SUMITOMO-SOUTH-AFRICA',
    name: 'SUMITOMO RUBBER SOUTH AFRICA PTY LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-DURBAN']
  },
  {
    id: 'SHIP-SUMITOMO-THAILAND',
    name: 'FALKEN TYRE (THAILAND) CO., LTD.',
    groupSaleType: GroupSaleType.DOMESTIC,
    destinationIds: []
  },
  {
    id: 'SHIP-SUMITOMO-US',
    name: 'FALKEN TIRE CORPORATION',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-RANCHO-CUCAMONGA']
  },
  {
    id: 'SHIP-TOYO-CHINA',
    name: 'TOYO TIRE (ZHANGZHOU) CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-XIAMEN']
  },
  {
    id: 'SHIP-TOYO-JAPAN',
    name: 'TOYO TIRE CORPORATION',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-OSAKA', 'DEST-KOBE']
  },
  {
    id: 'SHIP-TOYO-MALAYSIA',
    name: 'TOYO TYRE MALAYSIA SDN. BHD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KAMUNTING']
  },
  {
    id: 'SHIP-TOYO-US',
    name: 'TOYO TIRE U.S.A. CORP.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-WHITE', 'DEST-DALLAS']
  },
  {
    id: 'SHIP-TPR',
    name: 'THAI PREMIER RUBBER CO., LTD.',
    groupSaleType: GroupSaleType.DOMESTIC,
    destinationIds: []
  },
  {
    id: 'SHIP-TRIANGLE-CHINA',
    name: 'TRIANGLE TYRE CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-QINGDAO']
  },
  {
    id: 'SHIP-TRINSEO-GERMANY',
    name: 'TRINSEO DEUTSCHLAND GMBH',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SCHKOPAU']
  },
  {
    id: 'SHIP-TRINSEO-US',
    name: 'TRINSEO LLC',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CALUMET-CITY']
  },
  {
    id: 'SHIP-TYRE-MAX',
    name: 'TYRE MAX (AUST) PTY. LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SYDNEY']
  },
  {
    id: 'SHIP-UBE-EU',
    name: 'UBE ELASTOMERS EUROPE SAS',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-ANTWERP']
  },
  {
    id: 'SHIP-UBE-SHANGHAI',
    name: 'UBE ELASTOMERS SHANGHAI CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-UBE-SINGAPORE',
    name: 'UBE ELASTOMERS SINGAPORE PTE. LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SINGAPORE']
  },
  {
    id: 'SHIP-UBE-US',
    name: 'UBE ELASTOMERS AMERICA CORP.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NEW-ORLEANS']
  },
  {
    id: 'SHIP-UNIROYAL-GERMANY',
    name: 'CONTINENTAL REIFEN DEUTSCHLAND GMBH (UNIROYAL)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-AACHEN']
  },
  {
    id: 'SHIP-VBCF',
    name: 'VAN BERKEL CHEMICAL SYSTEMS BV',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-ROTTERDAM']
  },
  {
    id: 'SHIP-VIMAX',
    name: 'VIMAX RUBBER (THAILAND) CO., LTD.',
    groupSaleType: GroupSaleType.DOMESTIC,
    destinationIds: []
  },
  {
    id: 'SHIP-YOKOHAMA-JAPAN',
    name: 'YOKOHAMA RUBBER CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TOKYO', 'DEST-YOKOHAMA']
  },
  {
    id: 'SHIP-YOKOHAMA-PHILIPPINES',
    name: 'YOKOHAMA TIRE PHILIPPINES INC.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SUBIC']
  },
  {
    id: 'SHIP-YOKOHAMA-THAILAND',
    name: 'THAI YOKOHAMA TYRE CO., LTD.',
    groupSaleType: GroupSaleType.DOMESTIC,
    destinationIds: []
  },
  {
    id: 'SHIP-YOKOHAMA-US',
    name: 'YOKOHAMA TIRE CORPORATION',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-WEST-POINT', 'DEST-SALEM']
  },
  {
    id: 'SHIP-ZEON-JAPAN',
    name: 'ZEON CORPORATION',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TOKYO', 'DEST-OSAKA']
  },
  {
    id: 'SHIP-ZEON-TAIWAN',
    name: 'ZEON CHEMICALS LP (TAIWAN)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TAICHUNG']
  },
  {
    id: 'SHIP-ZC-RUBBER',
    name: 'ZHONGCE RUBBER GROUP CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI', 'DEST-HANGZHOU', 'DEST-NINGBO']
  },
  {
    id: 'SHIP-BRIDGESTONE-THAILAND',
    name: 'BRIDGESTONE TIRE MANUFACTURING (THAILAND) CO., LTD.',
    groupSaleType: GroupSaleType.DOMESTIC,
    destinationIds: []
  },
  {
    id: 'SHIP-CONTINENTHAL-THAILAND',
    name: 'CONTINENTAL TYRE (THAILAND) CO., LTD.',
    groupSaleType: GroupSaleType.DOMESTIC,
    destinationIds: []
  },
  {
    id: 'SHIP-GOODYEAR-THAILAND',
    name: 'GOODYEAR (THAILAND) PUBLIC COMPANY LIMITED',
    groupSaleType: GroupSaleType.DOMESTIC,
    destinationIds: []
  },
  {
    id: 'SHIP-MAXXIS-THAILAND',
    name: 'CHENG SHIN RUBBER (THAILAND) CO., LTD.',
    groupSaleType: GroupSaleType.DOMESTIC,
    destinationIds: []
  },
  {
    id: 'SHIP-NITTO-THAILAND',
    name: 'NITTO DENKO (THAILAND) CO., LTD.',
    groupSaleType: GroupSaleType.DOMESTIC,
    destinationIds: []
  },
  {
    id: 'SHIP-YOKOHAMA-INDIA',
    name: 'YOKOHAMA INDIA PVT. LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NHAVA-SHEVA']
  },
  {
    id: 'SHIP-SUMITOMO-INDIA',
    name: 'FALKEN TYRE INDIA PVT. LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NHAVA-SHEVA']
  },
  {
    id: 'SHIP-VOGUE-TYRE',
    name: 'VOGUE TYRE AND RUBBER CO.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CHICAGO']
  },
  {
    id: 'SHIP-WESTLAKE-CHINA',
    name: 'WESTLAKE CHEMICAL CORPORATION (CHINA)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TIANJIN']
  },
  {
    id: 'SHIP-XINGYUAN-CHINA',
    name: 'SHANDONG XINGYUAN INTERNATIONAL TYRE CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-QINGDAO']
  },
  {
    id: 'SHIP-ZHONGCE-HANGZHOU',
    name: 'ZHONGCE RUBBER (HANGZHOU) CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HANGZHOU']
  },
  {
    id: 'SHIP-APOLLO-SOUTH-AFRICA',
    name: 'APOLLO TYRES SOUTH AFRICA PTY LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-DURBAN']
  },
  {
    id: 'SHIP-BALKRISHNA-INDIA',
    name: 'BALKRISHNA INDUSTRIES LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NHAVA-SHEVA']
  },
  {
    id: 'SHIP-BIRLA-CARBON',
    name: 'BIRLA CARBON INDIA PVT. LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NHAVA-SHEVA']
  },
  {
    id: 'SHIP-BURT-SOLOMONS',
    name: 'BURT SOLOMONS HOLDINGS (PTY) LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-PORT-ELIZABETH']
  },
  {
    id: 'SHIP-CHEMOURS',
    name: 'THE CHEMOURS COMPANY FC LLC',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NEW-ORLEANS']
  },
  {
    id: 'SHIP-EVONIK-GERMANY',
    name: 'EVONIK INDUSTRIES AG',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAMBURG', 'DEST-FRANKFURT']
  },
  {
    id: 'SHIP-FULDA',
    name: 'CONTINENTAL REIFEN DEUTSCHLAND GMBH (FULDA)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-FULDA']
  },
  {
    id: 'SHIP-CABOT-GERMANY',
    name: 'CABOT CORP. (GERMANY)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-FRANKFURT']
  },
  {
    id: 'SHIP-HAIMA-CHINA',
    name: 'HAIMA AUTOMOBILE CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIKOU']
  },
  {
    id: 'SHIP-HNBR-JAPAN',
    name: 'ZEON CORPORATION (HNBR)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TOKYO']
  },
  {
    id: 'SHIP-JIHUA-CHINA',
    name: 'JIHUA GROUP CORPORATION LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TIANJIN']
  },
  {
    id: 'SHIP-KANSAI-PAINT',
    name: 'KANSAI PAINT CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-OSAKA']
  },
  {
    id: 'SHIP-LANXESS-GERMANY',
    name: 'LANXESS DEUTSCHLAND GMBH',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-FRANKFURT', 'DEST-HAMBURG']
  },
  {
    id: 'SHIP-LATIN-CHEM',
    name: 'LATINQUIMICA S.A.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-BUENOS-AIRES']
  },
  {
    id: 'SHIP-LG-CHEM',
    name: 'LG CHEM LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-BUSAN']
  },
  {
    id: 'SHIP-MITSUI-CHEMICALS',
    name: 'MITSUI CHEMICALS INC.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-OSAKA', 'DEST-TOKYO']
  },
  {
    id: 'SHIP-NANYA-PLASTICS',
    name: 'NAN YA PLASTICS CORPORATION',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TAICHUNG', 'DEST-KEELUNG']
  },
  {
    id: 'SHIP-OMSK-RUSSIA',
    name: 'OMSK CARBON GROUP',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-VLADIVOSTOK']
  },
  {
    id: 'SHIP-PIRELLI-BRAZIL-2',
    name: 'PIRELLI PNEUS LTDA (GRAVATAÍ)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-PARANAGUA']
  },
  {
    id: 'SHIP-REKORD-CZECH',
    name: 'CONTINENTAL BARUM S.R.O.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-OTROKOVICE']
  },
  {
    id: 'SHIP-SCHLUMBERGER',
    name: 'SCHLUMBERGER N.V.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-ROTTERDAM']
  },
  {
    id: 'SHIP-SINOPEC',
    name: 'CHINA PETROLEUM & CHEMICAL CORPORATION (SINOPEC)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI', 'DEST-TIANJIN']
  },
  {
    id: 'SHIP-SWISS-RUBBER',
    name: 'SWISS RUBBER CO.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-ANTWERP']
  },
  {
    id: 'SHIP-TAIYA-RUBBER',
    name: 'TAIYA RUBBER CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TAICHUNG']
  },
  {
    id: 'SHIP-THAILAND-RUBBER',
    name: 'THAI RUBBER & ALLIED PRODUCTS PCL',
    groupSaleType: GroupSaleType.DOMESTIC,
    destinationIds: []
  },
  {
    id: 'SHIP-TIANZHAN-CHINA',
    name: 'TIANJIN ZHENTIAN RUBBER & PLASTIC CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TIANJIN']
  },
  {
    id: 'SHIP-TITAN-INTL',
    name: 'TITAN INTERNATIONAL INC.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-QUINCY']
  },
  {
    id: 'SHIP-TPI-POLENE',
    name: 'TPI POLENE PCL',
    groupSaleType: GroupSaleType.DOMESTIC,
    destinationIds: []
  },
  {
    id: 'SHIP-TREDWAY',
    name: 'TREDWAY COMPANY GMBH',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-FRANKFURT']
  },
  {
    id: 'SHIP-TRONOX',
    name: 'TRONOX (NETHERLANDS) CO. B.V.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-ROTTERDAM']
  },
  {
    id: 'SHIP-TRUCKMASTER',
    name: 'TRUCKMASTER (EUROPE) B.V.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-ROTTERDAM']
  },
  {
    id: 'SHIP-TTR',
    name: 'THAI TIRE & RUBBER CO., LTD.',
    groupSaleType: GroupSaleType.DOMESTIC,
    destinationIds: []
  },
  {
    id: 'SHIP-TUBA-INDIA',
    name: 'TUBA EXIM PVT. LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NHAVA-SHEVA']
  },
  {
    id: 'SHIP-TYPHOON-UK',
    name: 'TYPHOON INTERNATIONAL LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SOUTHAMPTON']
  },
  {
    id: 'SHIP-VEYANCE-INDIA',
    name: 'VEYANCE TECHNOLOGIES INDIA PVT. LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NHAVA-SHEVA']
  },
  {
    id: 'SHIP-VIPAL-BRAZIL',
    name: 'VIPAL BORRACHAS S.A.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-PARANAGUA']
  },
  {
    id: 'SHIP-VITTORIA-ITALY',
    name: 'VITTORIA INDUSTRY S.R.L.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-GENOA']
  },
  {
    id: 'SHIP-VONG-THONG',
    name: 'VONG THONG TIRE CO., LTD.',
    groupSaleType: GroupSaleType.DOMESTIC,
    destinationIds: []
  },
  {
    id: 'SHIP-VONIN-INDIA',
    name: 'VONIN POLYMER INDUSTRIES PVT. LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NHAVA-SHEVA']
  },
  // --- Entries added from reconciliation against official ShipTo master list ---
  {
    id: 'SHIP-ALL-WELLS-INTL',
    name: 'ALL WELLS INTERNATIONAL CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-ALPHA-POLYMER-DONGHAI',
    name: 'ALPHA-POLYMER CO., LTD. C/O DONG NAI PORT BONDED WAREHOUSE',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-ALPHA-POLYMER-WHALESHIP',
    name: 'ALPHA-POLYMER CO.,LTD C/O WHALESHIP LOGISTICS LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TAICHUNG']
  },
  {
    id: 'SHIP-ANNORA-VIETNAM',
    name: 'ANNORA VIETNAM FOOTWEAR LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-AURORA-VIETNAM',
    name: 'AURORA VIETNAM INDUSTRIAL FOOTWEAR CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-BOEHLE-CHEMICALS',
    name: 'BOEHLE CHEMICALS',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CALUMET-CITY']
  },
  {
    id: 'SHIP-BRIDGESTONE-TIANJIN',
    name: 'BRIDGESTONE (TIANJIN) TIRE CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-BEIJING-AIRPORT']
  },
  {
    id: 'SHIP-BRIDGESTONE-WUXI',
    name: 'BRIDGESTONE (WUXI) TIRE CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-BRIDGESTONE-CORP',
    name: 'Bridgestone Corporation',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TOKYO']
  },
  {
    id: 'SHIP-BRIDGESTONE-MEXICO',
    name: 'BRIDGESTONE DE MEXICO, S.A. DE C.V.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-MANZANILLO']
  },
  {
    id: 'SHIP-BRIDGESTONE-BRASIL',
    name: 'BRIDGESTONE DO BRASIL',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SANTOS']
  },
  {
    id: 'SHIP-BRIDGESTONE-FIRESTONE-WILSON',
    name: 'BRIDGESTONE FIRESTONE NT WILSON PLANT',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-WILSON']
  },
  {
    id: 'SHIP-BRIDGESTONE-POZNAN',
    name: 'BRIDGESTONE POZNAN SP/ZO.O.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-GDYNIA']
  },
  {
    id: 'SHIP-BRIDGESTONE-SA',
    name: 'BRIDGESTONE SA (PTY) LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-PORT-ELIZABETH']
  },
  {
    id: 'SHIP-BRIDGESTONE-TAIWAN',
    name: 'BRIDGESTONE TAIWAN CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KEELUNG']
  },
  {
    id: 'SHIP-BRIDGESTONE-TATABANYA',
    name: 'BRIDGESTONE TATABANYA MANUFACTURING LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAMBURG']
  },
  {
    id: 'SHIP-BRIDGESTONE-VIETNAM',
    name: 'BRIDGESTONE VIETNAM',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-BRISA-TURKEY',
    name: 'BRISA BRIDGESTONE SABANCI LASTIK SANAYI VE TICARET A.S.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-GEBZE']
  },
  {
    id: 'SHIP-CEAT-KELANI',
    name: 'CEAT KELANI INTERNATIONAL TYRES PVT LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-COLOMBO']
  },
  {
    id: 'SHIP-CEAT-CHENNAI',
    name: 'CEAT LIMITED CHENNAI',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CHENNAI']
  },
  {
    id: 'SHIP-CHENGSHIN-TAIWAN',
    name: 'CHENGSHIN RUBBER TAIWAN',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TAICHUNG']
  },
  {
    id: 'SHIP-CHENG-SHIN-TIRE-SHANGHAI',
    name: 'CHENG SHIN TIRE & RUBBER (CHINA) CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-CHENG-SHIN-CHONGQING',
    name: 'CHENG SHIN TIRE & RUBBER (CHONGQING) CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CHONGQING']
  },
  {
    id: 'SHIP-CHENG-SHIN-TIRE-XIAMEN',
    name: 'CHENG SHIN TIRE (XIAMEN) CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-XIAMEN']
  },
  {
    id: 'SHIP-CHINH-DUONG',
    name: 'CHINH DUONG ONE MEMBER CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-CHUN-XIANG-RUBBER',
    name: 'CHUN XIANG RUBBER PLASTIC PRODUCT CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-CONG-TY-ANTHAI',
    name: 'CONG TY TNHH CONG NGHE CAO SU ANTHAI VIETNAM',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-CREATIVE-SOURCE-VN',
    name: 'CONG TY TNHH CREATIVE SOURCE VIET NAM',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-VIET-SIEU',
    name: 'CONG TY TNHH SX TM VIET SIEU',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-CONTINENTAL-STOECKEN',
    name: 'CONTINENTAL AG STOECKEN',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HANNOVER', 'DEST-KOPER']
  },
  {
    id: 'SHIP-CONTINENTAL-AACHEN',
    name: 'CONTINENTAL AG WERK AACHEN',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-AACHEN']
  },
  {
    id: 'SHIP-CONTINENTAL-AUTO-ROMANIA',
    name: 'Continental Automotive Products S.R.L.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TIMISOARA']
  },
  {
    id: 'SHIP-CONTINENTAL-FRANCE',
    name: 'CONTINENTAL FRANCE SAS',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SARREGUEMINES']
  },
  {
    id: 'SHIP-CONTINENTAL-INDIA-PRIVATE',
    name: 'CONTINENTAL INDIA PRIVATE LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NHAVA-SHEVA']
  },
  {
    id: 'SHIP-CONTINENTAL-KORBACH',
    name: 'CONTINENTAL KORBACH',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KORBACH']
  },
  {
    id: 'SHIP-CONTINENTAL-MABOR',
    name: 'Continental Mabor Industria de Pneus, S.A.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-LOUSADO']
  },
  {
    id: 'SHIP-CONTINENTAL-TIRE-AMERICAS',
    name: 'CONTINENTAL TIRE THE AMERICAS, LLC',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-MT-VERNON']
  },
  {
    id: 'SHIP-CONTINENTAL-TIRES-CHINA',
    name: 'CONTINENTAL TIRES (CHINA) CO.,LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-CONTINENTAL-TIRES-SLOVAKIA',
    name: 'CONTINENTAL TIRES SLOVAKIA, S.R.O.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KOPER', 'DEST-PUCHOV']
  },
  {
    id: 'SHIP-CONTINENTAL-TYRE-MALAYSIA',
    name: 'CONTINENTAL TYRE AS MALAYSIA SDN. BHD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-ALOR-SETAR']
  },
  {
    id: 'SHIP-CONTINENTAL-TYRE-SA',
    name: 'CONTINENTAL TYRE SOUTH AFRICA PTY LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-PORT-ELIZABETH']
  },
  {
    id: 'SHIP-COOPER-SERBIA',
    name: 'COOPER TIRE AND RUBBER COMPANY SERBIA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KRUSEVAC']
  },
  {
    id: 'SHIP-COOPER-KUNSHAN',
    name: 'COOPER(KUNSHAN)TIRE CO.,LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-DONA-PACIFIC-VN',
    name: 'DONA PACIFIC (VIETNAM) CO.,LTD/FT',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-DONA-VICTOR',
    name: 'DONA VICTOR FOOTWEAR COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-DONGGUAN-CHUNXIANG',
    name: 'Dongguan Chunxiang Rubber and Plastic Product Co., Ltd.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHATIAN']
  },
  {
    id: 'SHIP-DONGGUAN-YUECHUAN',
    name: 'DONGGUAN CITY YUECHUAN CHEMICAL CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHATIAN']
  },
  {
    id: 'SHIP-DONGGUAN-GLUN',
    name: 'DONGGUAN G-LUN RUBBER & PLASTIC CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: [
      'DEST-HUANGPU',
      'DEST-SHATIAN',
      'DEST-TAIPING',
      'DEST-YANTIAN',
      'DEST-JIAOXIN'
    ]
  },
  {
    id: 'SHIP-DONGGUAN-HERRY',
    name: 'DONGGUAN HERRY PLASTIC AND RUBBER TECHNOLOGY CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHATIAN']
  },
  {
    id: 'SHIP-DONGGUAN-JIAYUE',
    name: 'DONGGUAN JIAYUE RUBBER AND PLASTIC MATERIAL TECHNOLOGY CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TAIPING']
  },
  {
    id: 'SHIP-DONGGUAN-LAAYOUNE',
    name: 'DONGGUAN LAAYOUNE CHEMICAL CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HUANGPU', 'DEST-TAIPING', 'DEST-XIAMEN']
  },
  {
    id: 'SHIP-DONGGUAN-QIHANG',
    name: 'Dongguan Qihang Rubber & Plastic Co.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHATIAN']
  },
  {
    id: 'SHIP-DONGGUAN-SUN-KIU',
    name: 'DONGGUAN SUN KIU SHOES CO.,LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TAIPING']
  },
  {
    id: 'SHIP-DONGGUAN-YINGFENG',
    name: 'DONGGUAN YINGFENG RUBBER CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TAIPING']
  },
  {
    id: 'SHIP-DONGGUAN-YINGTAI',
    name: 'DONGGUAN YINGTAI COMMERCE CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TAIPING', 'DEST-XIAMEN']
  },
  {
    id: 'SHIP-DOUBLESTAR-DONGFENG',
    name: 'DOUBLESTAR DONGFENG TYRE CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-QINGDAO']
  },
  {
    id: 'SHIP-DUONG-PHAT',
    name: 'DUONG PHAT IMPORT AND EXPORT SERVICES TRADING COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-EAST-WIND-FOOTWEAR',
    name: 'EAST WIND FOOTWEAR COMPANY LIMITED (INDIA)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CHENNAI', 'DEST-KATTUPALLI']
  },
  {
    id: 'SHIP-ETERNAL-PROWESS',
    name: 'ETERNAL PROWESS',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-EVER-POWER',
    name: 'EVER POWER INTERNATIONAL CO.,LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SIHANOUKVILLE']
  },
  {
    id: 'SHIP-FAIRWAY-ENTERPRISES',
    name: 'FAIRWAY ENTERPRISES COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CHENNAI', 'DEST-KATTUPALLI']
  },
  {
    id: 'SHIP-FEET-BIT',
    name: 'FEET BIT INTERNATIONAL COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HONG-KONG']
  },
  {
    id: 'SHIP-FUJIAN-LIFENG',
    name: 'FUJIAN LIFENG FOOTWEAR INDUSTRIAL DEVELOPMENT CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-MAWEI-FUZHOU', 'DEST-XIAMEN']
  },
  {
    id: 'SHIP-FUJIAN-SANFENG',
    name: 'FUJIAN SAN FENG FOOTWEAR CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-MAWEI-FUZHOU', 'DEST-XIAMEN']
  },
  {
    id: 'SHIP-FUJIAN-XIEFENG',
    name: 'FUJIAN XIEFENG FOOTWEAR CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-MAWEI-FUZHOU', 'DEST-XIAMEN']
  },
  {
    id: 'SHIP-GEE-HORN',
    name: 'GEE HORN INTERNATIONAL CO.,LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KEELUNG']
  },
  {
    id: 'SHIP-GEM-TREADS',
    name: 'GEM TREADS PRIVATE LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-COCHIN']
  },
  {
    id: 'SHIP-GEMCO-RUBBER',
    name: 'GEMCO RUBBER PRIVATE LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-COCHIN']
  },
  {
    id: 'SHIP-GOODYEAR-DALIAN',
    name: 'GOODYEAR DALIAN TIRE CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-DALIAN', 'DEST-QINGDAO']
  },
  {
    id: 'SHIP-GOODYEAR-BRASIL',
    name: 'GOODYEAR DO BRASIL PRODUTOS DE BORRACHA LTDA.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SANTOS']
  },
  {
    id: 'SHIP-GOODYEAR-DUNLOP-SAVA',
    name: 'GOODYEAR DUNLOP SAVA TIRES',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KRANJ']
  },
  {
    id: 'SHIP-GOODYEAR-DUNLOP-AMIENS',
    name: 'GOODYEAR DUNLOP TIRES AMIENS SUD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-AMIENS']
  },
  {
    id: 'SHIP-GOODYEAR-DUNLOP-GERMANY',
    name: 'GOODYEAR DUNLOP TIRES GERMANY',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-FRANKFURT', 'DEST-FURSTENWALDE', 'DEST-HAMBURG']
  },
  {
    id: 'SHIP-GOODYEAR-DUNLOP-GERMANY-GMBH',
    name: 'GOODYEAR DUNLOP TIRES GERMANY GMBH',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-FRANKFURT', 'DEST-HAMBURG', 'DEST-HANAU']
  },
  {
    id: 'SHIP-GOODYEAR-DUNLOP-OPS',
    name: 'GOODYEAR DUNLOP TIRES OPERATIONS s.a.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-BERVEREN']
  },
  {
    id: 'SHIP-GOODYEAR-FULDA',
    name: 'GOODYEAR FULDA TIRES GERMANY',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-FRANKFURT', 'DEST-FULDA']
  },
  {
    id: 'SHIP-GOODYEAR-LASTIKLERI',
    name: 'GOODYEAR LASTIKLERI T.A.S. GYTURKEY',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-GEMLIK']
  },
  {
    id: 'SHIP-GOODYEAR-SERBIA',
    name: 'Goodyear Serbia, d. o. o.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KRUSEVAC']
  },
  {
    id: 'SHIP-GOODYEAR-TIRE-RUBBER',
    name: 'GOODYEAR TIRE AND RUBBER COMPANY',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-DALLAS', 'DEST-LAWTON']
  },
  {
    id: 'SHIP-GRAND-GAIN-FOOTWEAR',
    name: 'GRAND GAIN FOOTWEAR MANUFACTURING CO.,LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-GUANGZHOU-ZHANGMOSHI',
    name: 'GUANGZHOU ZHANGMOSHI INTERNATIONAL TRADING CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HUANGPU']
  },
  {
    id: 'SHIP-GUORONG-QINGYUAN',
    name: 'GUORONG (QINGYUAN) RUBBER INDUSTRY CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HUANGPU', 'DEST-QINGYUAN']
  },
  {
    id: 'SHIP-HAIAN-RUBBER',
    name: 'HAIAN RUBBER GROUP CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-XIAMEN']
  },
  {
    id: 'SHIP-HANSUK-INTL',
    name: 'HANSUK INTERNATIONAL LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-BUSAN']
  },
  {
    id: 'SHIP-HENGDASHENG-TOYO',
    name: 'HENGDASHENG TOYO TIRE (ZHANGJIAGANG) CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-ZHANGJIAGANG']
  },
  {
    id: 'SHIP-HOA-THANH',
    name: 'HOA THANH COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-HUA-SHEN-VN',
    name: 'HUA SHEN VIETNAM COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-HWASEUNG-RACH-GIA',
    name: 'HWASEUNG RACH GIA COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-JINAN-ZHONGTIAN',
    name: 'Jinan Zhongtian New Materials Co., Ltd.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-QINGDAO']
  },
  {
    id: 'SHIP-JIUCHENG-VN',
    name: 'JIUCHENG INDUSTRIAL (VN) LIMITED COMPANY',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-KASAN-MALAYSIA',
    name: 'KASAN CORPORATION (MALAYSIA) SDN BHD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KUALA-LUMPUR']
  },
  {
    id: 'SHIP-KENDA-CHINA',
    name: 'KENDA RUBBER (CHINA) CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-KENDA-INDONESIA',
    name: 'KENDA RUBBER (INDONESIA)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JAKARTA']
  },
  {
    id: 'SHIP-KENDA-TIANJIN',
    name: 'KENDA RUBBER (TIANJIN) CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TIANJIN']
  },
  {
    id: 'SHIP-KENDA-VIETNAM',
    name: 'KENDA RUBBER (VIETNAM) CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-LAAYOUNE-INDUSTRIAL',
    name: 'LAAYOUNE INDUSTRIAL CO.,LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TAIPING']
  },
  {
    id: 'SHIP-LAC-TY-II',
    name: 'LAC TY II COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-LOTUS-FOOTWEAR',
    name: 'LOTUS FOOTWEAR ENTERPRISES',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CHENNAI', 'DEST-KATTUPALLI']
  },
  {
    id: 'SHIP-MFP-MICHELIN',
    name: 'M.F.P. Michelin P/C Simastock',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-LE-HAVRE']
  },
  {
    id: 'SHIP-MFP-MICHELIN-THIANT',
    name: 'M.F.P. Michelin P/C Simastock Thiant',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-LE-HAVRE']
  },
  {
    id: 'SHIP-MAXXIS-RUBBER-INDIA',
    name: 'MAXXIS RUBBER INDIA PRIVATE LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-ICD-SANAND']
  },
  {
    id: 'SHIP-MICHELIN-HOMBURG',
    name: 'MICHELIN HOMBURG. (HBG)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-ROTTERDAM']
  },
  {
    id: 'SHIP-MICHELIN-POLAND',
    name: 'MICHELIN POLAND (OLS)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-WARSAW-AIRPORT']
  },
  {
    id: 'SHIP-MICHELIN-SHENYANG',
    name: 'MICHELIN SHENYANG TIRE CO.(SHY)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-DALIAN']
  },
  {
    id: 'SHIP-MRF-TYRE',
    name: 'MRF TYRE',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CHENNAI', 'DEST-KATTUPALLI']
  },
  {
    id: 'SHIP-NANKANG-RUBBER',
    name: 'NANKANG RUBBER TIRE',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-ZHANGJIAGANG']
  },
  {
    id: 'SHIP-NANKANG-KEELUNG',
    name: 'NANKANG RUBBER TIRE CORP., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KEELUNG']
  },
  {
    id: 'SHIP-NGU-HAN',
    name: 'NGU HAN TRANSPORT SERVICE CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-NINH-BINH-VN',
    name: 'NINH BINH -VIETNAM CHUNG JYE SHOES MANUFA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-PT-BRIDGESTONE',
    name: 'P.T. BRIDGESTONE TIRE INDONESIA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JAKARTA']
  },
  {
    id: 'SHIP-PHOENIX-COMPOUNDING',
    name: 'PHOENIX COMPOUNDING TECHNOLOGY',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAMBURG', 'DEST-WALTERSHAUSEN']
  },
  {
    id: 'SHIP-PIRELLI-DEUTSCHLAND',
    name: 'PIRELLI DEUTSCHLAND GMBH',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-OBERNBURG']
  },
  {
    id: 'SHIP-PIRELLI-MEXICO',
    name: 'Pirelli Neumaticos S.A. de C.V.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-MANZANILLO']
  },
  {
    id: 'SHIP-PT-ALNU',
    name: 'PT. ALNU SPORTING GOODS INDONESIA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SEMARANG']
  },
  {
    id: 'SHIP-PT-BOOSAN',
    name: 'PT. BOOSAN SARANG',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JAKARTA']
  },
  {
    id: 'SHIP-PT-KUM-KANG',
    name: 'PT. KUM KANG TECH INDONESIA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JAKARTA']
  },
  {
    id: 'SHIP-PT-SEONGSAN',
    name: 'PT. SEONGSAN INTERNATIONAL',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JAKARTA']
  },
  {
    id: 'SHIP-PT-HWA-SEUNG',
    name: 'PT.HWA SEUNG INDONESIA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JAKARTA']
  },
  {
    id: 'SHIP-QINGDAO-FUHUA',
    name: 'QINGDAO FREE TRADE ZONE FUHUA INTERNATIONAL TRADING CO.,LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: [
      'DEST-HUANGPU',
      'DEST-HUMEN',
      'DEST-NANSHA',
      'DEST-QINGDAO',
      'DEST-SHANGHAI',
      'DEST-TAIPING',
      'DEST-XIAMEN'
    ]
  },
  {
    id: 'SHIP-QINGDAO-GERUIDА',
    name: 'Qingdao Ge Rui Da Rubber Co., Ltd',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-QINGDAO']
  },
  {
    id: 'SHIP-QINGDAO-HUAWU',
    name: 'QINGDAO HUAWU RUBBER & PLASTIC CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-QINGDAO']
  },
  {
    id: 'SHIP-QINGDAO-RONGYUE',
    name: 'Qingdao Rongyue Import And Export Co., Ltd.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-QINGDAO-YUEYOU',
    name: 'QINGDAO YUEYOU INTERNATIONAL TRADE CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-QINGDAO']
  },
  {
    id: 'SHIP-RDC-ITALY',
    name: 'RDC Srl',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-GENOA']
  },
  {
    id: 'SHIP-ROLL-SPORT-VN',
    name: 'ROLL SPORT VIETNAM FOOTWEAR LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-RUBBER-MIX-CHILE',
    name: 'RUBBER MIX S.A.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SAN-ANTONIO-CHILE']
  },
  {
    id: 'SHIP-SPA-MICHELIN-ITALIANA',
    name: 'S.P.A. MICHELIN ITALIANA (CNO)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-GENOA']
  },
  {
    id: 'SHIP-SAILUN-VIETNAM',
    name: 'SAILUN (VIETNAM) CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-SAMIL-TONG-SANG',
    name: 'SAMIL TONG SANG VINA CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-SANTEC-TRADING',
    name: 'SANTEC TRADING AGENCY',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CHATTOGRAM']
  },
  {
    id: 'SHIP-SHANDONG-DURATTI',
    name: 'Shandong Duratti Rubber Co., Ltd.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-QINGDAO']
  },
  {
    id: 'SHIP-SHANGHAI-MICHELIN',
    name: 'SHANGHAI MICHELIN TIRE CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-SHINIMEX-II',
    name: 'SHINIMEX II CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-SHYANG-TA',
    name: 'SHYANG TA CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-SINTEX-CHEMICAL',
    name: 'SINTEX CHEMICAL CORP. C/O ICD TAN CANG-LONG BINH JOINT STOCK BONDED WAREHOUSE',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-SUCCESS-PROSPERITY',
    name: 'SUCCESS PROSPERITY SHOE MATERIAL COMPANY',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-SUMITOMO-CHANGSHU',
    name: 'SUMITOMO RUBBER (CHANGSHU) CO.,LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-SUMITOMO-HUNAN',
    name: 'SUMITOMO RUBBER (HUNAN) CO. LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-SUMITOMO-BRASIL',
    name: 'SUMITOMO RUBBER DO BRASIL LTDA.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-PARANAGUA']
  },
  {
    id: 'SHIP-SUZHOU-YOKOHAMA',
    name: 'SUZHOU YOKOHAMA TIRE CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-TAN-HOA-THANH',
    name: 'TAN HOA THANH COMMERCIAL PRODUCTION CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-TAN-THANH-HOA-LONG-AN',
    name: 'TAN THANH HOA LONG AN TRADING AND MANUFACTURING CO.,LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-THE-INHERITANCE-CAMBODIA',
    name: 'THE INHERITANCE (CAMBODIA) CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SIHANOUKVILLE']
  },
  {
    id: 'SHIP-THIEN-VINH',
    name: 'THIEN VINH INTERNATIONAL CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-THUAN-ICH',
    name: 'THUAN ICH SHOES MATERIAL COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-TIRE-COMPANY-DEBICA',
    name: 'TIRE COMPANY DEBICA S.A.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-DEBICA']
  },
  {
    id: 'SHIP-TITAN-RUBBER-MANILA',
    name: 'Titan rubber Industrial Mfg Corporation',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-MANILA']
  },
  {
    id: 'SHIP-TORTUGA-BRASIL',
    name: 'TORTUGA PRODUTOS DE BORRACHA LTDA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-PARANAGUA']
  },
  {
    id: 'SHIP-TOYO-TIRE-NA',
    name: 'TOYO TIRE NORTH AMERICA MANUFACTURING INC.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CRANDALL', 'DEST-SAVANNAH', 'DEST-WHITE']
  },
  {
    id: 'SHIP-TVS-SRICHAKRA',
    name: 'TVS SRICHAKRA LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TUTICORIN']
  },
  {
    id: 'SHIP-UBE-ELASTOMER',
    name: 'UBE Elastomer Co. Ltd.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TOKYO']
  },
  {
    id: 'SHIP-UBE-MEXICO',
    name: 'UBE MEXICO S. de R.L. de C.V.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-MANZANILLO']
  },
  {
    id: 'SHIP-USINE-MICHELIN-CHOLET',
    name: 'USINE MICHELIN DE CHOLET (CHO)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-LE-HAVRE']
  },
  {
    id: 'SHIP-VICTORY-SPORTS-DG',
    name: 'VICTORY SPORTS GOODS CO.,LTD.(DONGGUAN)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHATIAN']
  },
  {
    id: 'SHIP-VIET-NAM-VICTORY-SPORTS',
    name: 'VIET NAM VICTORY SPORTS TECHNOLOGY COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-VIETNAM-DONA-STANDARD',
    name: 'VIETNAM DONA STANDARD FOOTWEAR CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-VIETNAM-NAM-HA',
    name: 'VIETNAM NAM HA FOOTWEAR COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-VINH-LONG-FOOTWEAR',
    name: 'VINH LONG FOOTWEAR CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-WEILINA-VN',
    name: 'WEILINA VIET NAM FOOTWEAR COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-WELLOFF-SHANGHAI',
    name: 'WELLOFF INTERNATIONAL TRADING (SHANGHAI) CO.,LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-XIAMEN']
  },
  {
    id: 'SHIP-XIAMEN-HUAHE',
    name: 'XIAMEN HUAHE IMPORT AND EXPORT CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JIAOXIN']
  },
  {
    id: 'SHIP-XIAMEN-KUOCHENG',
    name: 'XIAMEN KUOCHENG RUBBER CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NINGBO', 'DEST-SHATIAN', 'DEST-XIAMEN']
  },
  {
    id: 'SHIP-YOKOHAMA-TIRE-MFG',
    name: 'YOKOHAMA TIRE MANUFACTURING',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NEW-ORLEANS', 'DEST-WEST-POINT']
  },
  {
    id: 'SHIP-YOKOHAMA-TYRE-VIETNAM',
    name: 'YOKOHAMA TYRE VIETNAM INC. (YTVI)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-VSIP']
  },
  {
    id: 'SHIP-YU-QING',
    name: 'YU QING ENTERPRISE CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-Z-AND-W-RUBBER',
    name: 'Z AND W RUBBER CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HUANGPU']
  }
];

const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    username: 'admin',
    role: Role.ADMIN,
    userGroup: UserGroup.ADMIN,
    companyId: 'C001',
    canCreateOrder: true,
    shipToAccess: 'ALL',
    allowedShipToIds: [],
    allowedDocumentTypes: Object.values(DocumentType)
  },
  {
    id: 'u2',
    username: 'trader1',
    role: Role.MAIN_TRADER,
    userGroup: UserGroup.TRADER,
    companyId: 'C001',
    canCreateOrder: true,
    shipToAccess: 'ALL',
    allowedShipToIds: [],
    allowedDocumentTypes: [
      DocumentType.PO_PDF,
      DocumentType.SHIPPING_INSTRUCTION_PDF,
      DocumentType.INVOICE,
      DocumentType.COA
    ]
  },
  {
    id: 'u3',
    username: 'ubejp1',
    role: Role.UBE_JAPAN,
    userGroup: UserGroup.UEC_SALE,
    companyId: UBE_JAPAN_COMPANY_ID,
    canCreateOrder: true,
    shipToAccess: 'ALL',
    allowedShipToIds: [],
    allowedDocumentTypes: [
      DocumentType.PO_PDF,
      DocumentType.SHIPPING_INSTRUCTION_PDF,
      DocumentType.INVOICE
    ]
  },
  {
    id: 'u4',
    username: 'sale1',
    role: Role.SALE,
    userGroup: UserGroup.TSL_SALE,
    companyId: 'C001',
    canCreateOrder: false,
    shipToAccess: 'ALL',
    allowedShipToIds: [],
    allowedDocumentTypes: Object.values(DocumentType)
  },
  {
    id: 'u-sale-mgr',
    username: 'sale_mgr1',
    role: Role.SALE_MANAGER,
    userGroup: UserGroup.UEC_MANAGER,
    companyId: 'C001',
    canCreateOrder: false,
    shipToAccess: 'ALL',
    allowedShipToIds: [],
    allowedDocumentTypes: Object.values(DocumentType)
  },
  {
    id: 'u5',
    username: 'cs1',
    role: Role.CS,
    userGroup: UserGroup.TSL_CS,
    companyId: 'C001',
    canCreateOrder: false,
    shipToAccess: 'ALL',
    allowedShipToIds: [],
    allowedDocumentTypes: Object.values(DocumentType)
  }
];

const INITIAL_MASTER: MasterDataState = {
  groupSaleTypes: [
    { id: GroupSaleType.OVERSEAS, name: 'Overseas Sales Group' },
    { id: GroupSaleType.DOMESTIC, name: 'Domestic Sales Group' }
  ],
  destinations: [
    { id: 'DEST-HAIPHONG', name: 'Haiphong, Vietnam' },
    { id: 'DEST-CAT-LAI-HCM', name: 'Cat Lai (Ho Chi Minh), Vietnam' },
    { id: 'DEST-VSIP', name: 'VSIP, Vietnam' },
    { id: 'DEST-SHANGHAI', name: 'Shanghai, China' },
    { id: 'DEST-XIAMEN', name: 'Xiamen, China' },
    { id: 'DEST-QINGDAO', name: 'Qingdao, China' },
    { id: 'DEST-TIANJIN', name: 'Tianjin, China' },
    { id: 'DEST-DALIAN', name: 'Dalian, China' },
    { id: 'DEST-NINGBO', name: 'Ningbo, China' },
    { id: 'DEST-MAWEI-FUZHOU', name: 'Mawei (Fuzhou), China' },
    { id: 'DEST-HUANGPU', name: 'Huangpu, China' },
    { id: 'DEST-NANSHA', name: 'Nansha, China' },
    { id: 'DEST-TAIPING', name: 'Taiping, China' },
    { id: 'DEST-SHATIAN', name: 'Shatian, China' },
    { id: 'DEST-YANTIAN', name: 'Yantian, China' },
    { id: 'DEST-ZHANGJIAGANG', name: 'Zhangjiagang, China' },
    { id: 'DEST-CHONGQING', name: 'Chongqing, China' },
    { id: 'DEST-QINGYUAN', name: 'Qingyuan, China' },
    { id: 'DEST-BEIJING-AIRPORT', name: 'Beijing Airport, China' },
    { id: 'DEST-HUMEN', name: 'Humen, China' },
    { id: 'DEST-HANGZHOU', name: 'Hangzhou, China' },
    { id: 'DEST-SHENYANG', name: 'Shenyang, China' },
    { id: 'DEST-HAIKOU', name: 'Haikou, China' },
    { id: 'DEST-NHAVA-SHEVA', name: 'Nhava Sheva (Mumbai), India' },
    { id: 'DEST-CHENNAI', name: 'Chennai, India' },
    { id: 'DEST-COCHIN', name: 'Cochin, India' },
    { id: 'DEST-KATTUPALLI', name: 'Kattupalli, India' },
    { id: 'DEST-TUTICORIN', name: 'Tuticorin, India' },
    { id: 'DEST-ICD-SANAND', name: 'ICD Sanand, India' },
    { id: 'DEST-MYSORE', name: 'Mysore, India' },
    { id: 'DEST-TOKYO', name: 'Tokyo, Japan' },
    { id: 'DEST-OSAKA', name: 'Osaka, Japan' },
    { id: 'DEST-KOBE', name: 'Kobe, Japan' },
    { id: 'DEST-YOKOHAMA', name: 'Yokohama, Japan' },
    { id: 'DEST-TAICHUNG', name: 'Taichung, Taiwan' },
    { id: 'DEST-KEELUNG', name: 'Keelung, Taiwan' },
    { id: 'DEST-BUSAN', name: 'Busan, South Korea' },
    { id: 'DEST-JAKARTA', name: 'Jakarta, Indonesia' },
    { id: 'DEST-SEMARANG', name: 'Semarang, Indonesia' },
    { id: 'DEST-KUALA-LUMPUR', name: 'Kuala Lumpur, Malaysia' },
    { id: 'DEST-KAMUNTING', name: 'Kamunting, Malaysia' },
    { id: 'DEST-ALOR-SETAR', name: 'Alor Setar, Malaysia' },
    { id: 'DEST-PENANG', name: 'Penang, Malaysia' },
    { id: 'DEST-SUBIC', name: 'Subic Bay, Philippines' },
    { id: 'DEST-MANILA', name: 'Manila, Philippines' },
    { id: 'DEST-SIHANOUKVILLE', name: 'Sihanoukville, Cambodia' },
    { id: 'DEST-HONG-KONG', name: 'Hong Kong' },
    { id: 'DEST-COLOMBO', name: 'Colombo, Sri Lanka' },
    { id: 'DEST-CHATTOGRAM', name: 'Chattogram, Bangladesh' },
    { id: 'DEST-SINGAPORE', name: 'Singapore' },
    { id: 'DEST-HAIFA', name: 'Haifa, Israel' },
    { id: 'DEST-HAMBURG', name: 'Hamburg, Germany' },
    { id: 'DEST-HANNOVER', name: 'Hannover, Germany' },
    { id: 'DEST-FRANKFURT', name: 'Frankfurt, Germany' },
    { id: 'DEST-AACHEN', name: 'Aachen, Germany' },
    { id: 'DEST-KORBACH', name: 'Korbach, Germany' },
    { id: 'DEST-FULDA', name: 'Fulda, Germany' },
    { id: 'DEST-OBERNBURG', name: 'Obernburg, Germany' },
    { id: 'DEST-WALTERSHAUSEN', name: 'Waltershausen, Germany' },
    { id: 'DEST-FURSTENWALDE', name: 'Fürstenwalde, Germany' },
    { id: 'DEST-HANAU', name: 'Hanau, Germany' },
    { id: 'DEST-SCHKOPAU', name: 'Schkopau, Germany' },
    { id: 'DEST-AMIENS', name: 'Amiens, France' },
    { id: 'DEST-LE-HAVRE', name: 'Le Havre, France' },
    { id: 'DEST-SARREGUEMINES', name: 'Sarreguemines, France' },
    { id: 'DEST-ROTTERDAM', name: 'Rotterdam, Netherlands' },
    { id: 'DEST-ANTWERP', name: 'Antwerp, Belgium' },
    { id: 'DEST-GENOA', name: 'Genoa, Italy' },
    { id: 'DEST-GDYNIA', name: 'Gdynia, Poland' },
    { id: 'DEST-WARSAW-AIRPORT', name: 'Warsaw Airport, Poland' },
    { id: 'DEST-DEBICA', name: 'Dębica, Poland' },
    { id: 'DEST-TIMISOARA', name: 'Timișoara, Romania' },
    { id: 'DEST-OTROKOVICE', name: 'Otrokovice, Czech Republic' },
    { id: 'DEST-PUCHOV', name: 'Púchov, Slovakia' },
    { id: 'DEST-KOPER', name: 'Koper, Slovenia' },
    { id: 'DEST-KRANJ', name: 'Kranj, Slovenia' },
    { id: 'DEST-KRUSEVAC', name: 'Kruševac, Serbia' },
    { id: 'DEST-GEBZE', name: 'Gebze, Turkey' },
    { id: 'DEST-GEMLIK', name: 'Gemlik, Turkey' },
    { id: 'DEST-LOUSADO', name: 'Lousado, Portugal' },
    { id: 'DEST-PORT-ELIZABETH', name: 'Port Elizabeth, South Africa' },
    { id: 'DEST-DURBAN', name: 'Durban, South Africa' },
    { id: 'DEST-CALUMET-CITY', name: 'Calumet City, IL, USA' },
    { id: 'DEST-MT-VERNON', name: 'Mt. Vernon, IL, USA' },
    { id: 'DEST-WILSON', name: 'Wilson, NC, USA' },
    { id: 'DEST-LAWTON', name: 'Lawton, OK, USA' },
    { id: 'DEST-DALLAS', name: 'Dallas, TX, USA' },
    { id: 'DEST-CRANDALL', name: 'Crandall, TX, USA' },
    { id: 'DEST-SAVANNAH', name: 'Savannah, GA, USA' },
    { id: 'DEST-WHITE', name: 'White, GA, USA' },
    { id: 'DEST-NEW-ORLEANS', name: 'New Orleans, LA, USA' },
    { id: 'DEST-WEST-POINT', name: 'West Point, MS, USA' },
    { id: 'DEST-RANCHO-CUCAMONGA', name: 'Rancho Cucamonga, CA, USA' },
    { id: 'DEST-CHICAGO', name: 'Chicago, IL, USA' },
    { id: 'DEST-FINDLAY', name: 'Findlay, OH, USA' },
    { id: 'DEST-QUINCY', name: 'Quincy, IL, USA' },
    { id: 'DEST-SALEM', name: 'Salem, VA, USA' },
    { id: 'DEST-MANZANILLO', name: 'Manzanillo, Mexico' },
    { id: 'DEST-SANTOS', name: 'Santos, Brazil' },
    { id: 'DEST-PARANAGUA', name: 'Paranaguá, Brazil' },
    { id: 'DEST-SAN-ANTONIO-CHILE', name: 'San Antonio, Chile' },
    { id: 'DEST-BUENOS-AIRES', name: 'Buenos Aires, Argentina' },
    { id: 'DEST-HELSINKI', name: 'Helsinki, Finland' },
    { id: 'DEST-ZATEC', name: 'Žatec, Czech Republic' },
    { id: 'DEST-BUDAPEST', name: 'Budapest, Hungary' },
    { id: 'DEST-VLADIVOSTOK', name: 'Vladivostok, Russia' },
    { id: 'DEST-SYDNEY', name: 'Sydney, Australia' },
    { id: 'DEST-SOUTHAMPTON', name: 'Southampton, UK' },
    { id: 'DEST-JIAOXIN', name: 'Jiaoxin, China' },
    { id: 'DEST-BERVEREN', name: 'Beveren, Belgium' }
  ],
  terms: [
    { id: 'CFR', name: 'CFR' },
    { id: 'CIF', name: 'CIF' },
    { id: 'CIP', name: 'CIP' },
    { id: 'CPT', name: 'CPT' },
    { id: 'DAP', name: 'DAP' },
    { id: 'DAT', name: 'DAT' },
    { id: 'DPU', name: 'DPU' },
    { id: 'EXW', name: 'EXW' },
    { id: 'FCA', name: 'FCA' },
    { id: 'FOB', name: 'FOB' }
  ],
  grades: [
    { id: 'BR150', name: 'UBEPOL BR150' },
    { id: 'BR150B', name: 'UBEPOL BR150B' },
    { id: 'BR150GN', name: 'UBEPOL BR150GN' },
    { id: 'BR150L', name: 'UBEPOL BR150L' },
    { id: 'BR150LGN', name: 'UBEPOL BR150LGN' },
    { id: 'BR360B', name: 'UBEPOL BR360B' },
    { id: 'VCR412', name: 'UBEPOL VCR412' },
    { id: 'VCR617', name: 'UBEPOL VCR617' },
    { id: 'X-200', name: 'X-200' }
  ],
  shipTos: INITIAL_SHIP_TO_MAPPINGS,
  poTemplates: [
    {
      id: 'POT-BRIDGESTONE-POZNAN',
      shipToId: 'SHIP-BRIDGESTONE-POZNAN',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP',
      consigneeNotify:
        'BRIDGESTONE POZNAN SP/ZO.O.\nUL.BALTYCKA 65\n61-017 POZNAN, POLAND',
      agent: '',
      endUser: '',
      termsOfPayment: 'BY T.T.R 60 DAYS AFTER B/L DATE',
      packingInstructions: 'STANDARD EXPORT PACKING BY GPS',
      confirmBy:
        'T. Fujioka\nSenior Executive Vice President\nThai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'POT-COOPER-KUNSHAN',
      shipToId: 'SHIP-COOPER-KUNSHAN',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP',
      consigneeNotify: '',
      agent: 'UBE EUROPE GMBH',
      endUser: 'Cooper (Kunshan) Tire Co., Ltd.',
      termsOfPayment: 'BY T.T.R 105 DAYS AFTER B/L DATE',
      packingInstructions: 'STANDARD EXPORT PACKING',
      confirmBy: 'Thai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // ── Bridgestone Brasil ──────────────────────────────────────────
    {
      id: 'POT-BRIDGESTONE-BRASIL',
      shipToId: 'SHIP-BRIDGESTONE-BRASIL',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP',
      consigneeNotify:
        'BRIDGESTONE DO BRASIL\nAV.QUEIROS DOS SANTOS 1717\nSANTO ANDRE-09015-901-SAO PAULO-BRAZIL\nCNPJ:57497539/0001-15\nTEL:(011)4433-1666 FAX(011)4433-1187\nMr.Paulo',
      agent: '',
      endUser: '',
      termsOfPayment: 'BY T.T.R 45 DAYS AFTER B/L DATE',
      packingInstructions: 'STANDARD EXPORT PACKING BY GPS',
      confirmBy:
        'T. Fujioka\nSenior Executive Vice President\nThai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // ── Bridgestone Hungary (Tatabanya) ─────────────────────────────
    {
      id: 'POT-BRIDGESTONE-TATABANYA',
      shipToId: 'SHIP-BRIDGESTONE-TATABANYA',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP',
      consigneeNotify:
        'Bridgestone Tatabanya Manufacturing Ltd.\nH-2851 Korneye, Kohid u. 1.\nATTN:Erika Gulyas\nTEL +36 30 696 0061 FAX:+36.34.521.200',
      agent: '',
      endUser: '',
      termsOfPayment: 'BY T.T.R 60 DAYS AFTER B/L DATE',
      packingInstructions: 'STANDARD EXPORT PACKING BY GPS',
      confirmBy:
        'T. Fujioka\nSenior Executive Vice President\nThai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // ── Michelin Shenyang ───────────────────────────────────────────
    {
      id: 'POT-MICHELIN-SHENYANG',
      shipToId: 'SHIP-MICHELIN-SHENYANG',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND',
      consigneeNotify:
        'Michelin Shenyang Tire Co.,Ltd\nNo.12,Xihesi North Street,Shenyang Economic\nand Technological Development Area,Shenyang,\nLiaoning,P.R.China .110142\nTel:+8624 8603 5105 Fax:86-24-25176770',
      agent: '',
      endUser: 'Michelin Shenyang Tire Co.,Ltd',
      termsOfPayment: 'BY T.T.R 135 DAYS AFTER B/L DATE',
      packingInstructions: 'STANDARD EXPORT PACKING',
      confirmBy: 'Thai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // ── Shanghai Michelin ───────────────────────────────────────────
    {
      id: 'POT-MICHELIN-SHANGHAI',
      shipToId: 'SHIP-SHANGHAI-MICHELIN',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND',
      consigneeNotify:
        'Shanghai Michelin Tire Co.,Ltd.\nNO.2915 JIANCHUAN ROAD, MIN HANG DEVELOPMENT ZONE,\nSHANGHAI, 201111 P.R.CHINA\nTel:+86 21 3405 4888 Fax:54723540\nMs.Jun You',
      agent: '',
      endUser: 'Shanghai Michelin Tire Co.,Ltd.',
      termsOfPayment: 'BY T.T.R 135 DAYS AFTER B/L DATE',
      packingInstructions: 'STANDARD EXPORT PACKING',
      confirmBy: 'Thai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // ── Goodyear Amiens Sud ─────────────────────────────────────────
    {
      id: 'POT-GOODYEAR-AMIENS',
      shipToId: 'SHIP-GOODYEAR-DUNLOP-AMIENS',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP',
      consigneeNotify:
        'GOODYEAR DUNLOP TIRES\n60 AV ROGER DUMOULIN\n80030 AMIENS\nFRANCE',
      agent: 'UBE EUROPE GMBH',
      endUser: 'GOODYEAR AMIENS SUD',
      termsOfPayment: 'BY T.T.R 105 DAYS AFTER B/L DATE',
      packingInstructions: 'STANDARD EXPORT PACKING',
      confirmBy: 'Thai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // ── Goodyear Brasil ─────────────────────────────────────────────
    {
      id: 'POT-GOODYEAR-BRASIL',
      shipToId: 'SHIP-GOODYEAR-BRASIL',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP',
      consigneeNotify:
        'Goodyear do Brasil Produtos de Borracha Ltda.\nAv. Affonso Pansan, 3415 (Anhanguera, KM 128)\n13473-620 Vila Bertini - Americana City\nSao Paulo State / Brazil\nCNPJ 60.500.246/0016-30',
      agent: 'UBE EUROPE GMBH',
      endUser: 'GOODYEAR DO BRASIL PRODUTOS DE BORRACHA LTDA',
      termsOfPayment: 'BY T.T.R 105 DAYS AFTER B/L DATE',
      packingInstructions: 'STANDARD EXPORT PACKING',
      confirmBy: 'Thai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // ── Sumitomo Rubber Brasil ──────────────────────────────────────
    {
      id: 'POT-SUMITOMO-BRASIL',
      shipToId: 'SHIP-SUMITOMO-BRASIL',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP',
      consigneeNotify:
        'SUMITOMO RUBBER DO BRASIL LTDA\nR.FRANCISCO FERREIRA DA CRUZ 4656\n83820293 FAZENDA RIO GRANDE-PR-PAR\nBRAZIL\nCNPJ:13.816.470/0001-70',
      agent: 'UBE EUROPE GMBH',
      endUser: '',
      termsOfPayment: 'BY T.T.R 60 DAYS AFTER B/L DATE',
      packingInstructions: 'GPS',
      confirmBy:
        'T. Fujioka\nSenior Executive Vice President\nThai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // ── Sumitomo Rubber South Africa ────────────────────────────────
    {
      id: 'POT-SUMITOMO-SOUTH-AFRICA',
      shipToId: 'SHIP-SUMITOMO-SOUTH-AFRICA',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP',
      consigneeNotify:
        'Sumitomo Rubber South Africa (Pty) Ltd\nAttention : Lorna Bandoraho\nLion Match Office Park\nThe Old Factory Building\n892 Umgeni Road\nDurban 4001\nKwazulu Natal\nSouth Africa\nTel: +27-31-2421111',
      agent: 'UBE EUROPE GMBH',
      endUser: '',
      termsOfPayment: 'BY T.T.R 90 DAYS AFTER B/L DATE',
      packingInstructions: 'GPS',
      confirmBy:
        'T. Fujioka\nSenior Executive Vice President\nThai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // ── Sumitomo Rubber Hunan ───────────────────────────────────────
    {
      id: 'POT-SUMITOMO-HUNAN',
      shipToId: 'SHIP-SUMITOMO-HUNAN',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP',
      consigneeNotify:
        'Sumitomo Rubber (Hunan) CO.LTD\nNo.1318 Liangtang East Road, Changlong street,\nChangsha county, Changsha city,\nHunan province, China\nTEL:0086-731-86407006-1229',
      agent: '',
      endUser: '',
      termsOfPayment: 'BY T.T.R 90 DAYS AFTER B/L DATE',
      packingInstructions: 'STANDARD EXPORT PACKING',
      confirmBy:
        'T. Fujioka\nSenior Executive Vice President\nThai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // ── Toyo Tyre Malaysia ─────────────────────────────────────────
    {
      id: 'POT-TOYO-MALAYSIA',
      shipToId: 'SHIP-TOYO-MALAYSIA',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP',
      consigneeNotify:
        'Toyo Tyre Malaysia Sdn Bhd\nPT23101, Jalan Tembaga Kuning\nKawasan Perindustrian Kamunting Raya\nPO Box 1, 34600, Kamunting, Perak. Malaysia\nContact Person: Ms Lim / Ms Yap\nTel: 605-8206669 Fax: 605-8206659',
      agent: '',
      endUser: '',
      termsOfPayment: 'BY T.T.R 30 DAYS AFTER B/L DATE',
      packingInstructions: 'GPS',
      confirmBy:
        'T. Fujioka\nSenior Executive Vice President\nThai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // ── Hengdasheng Toyo Zhangjiagang ──────────────────────────────
    {
      id: 'POT-HENGDASHENG-TOYO',
      shipToId: 'SHIP-HENGDASHENG-TOYO',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP',
      consigneeNotify:
        'HENGDASHENG TOYO TIRE(ZHANGJIAGANG) CO., LTD.\n58,DONGHAI ROAD, YANGTZE INTERNATIONAL CHEMICAL\nINDUSTRIAL PARK, ZHANGJIAGANG, JIANGSU, CHINA\nCONTACT PERSON: Lili Yu E-MAIL: yulili@toyotiresz.com\nTEL:0512-3500-7124',
      agent: '',
      endUser: '',
      termsOfPayment: 'BY T.T.R 60 DAYS AFTER B/L DATE',
      packingInstructions: 'STANDARD EXPORT PACKING',
      confirmBy:
        'T. Fujioka\nSenior Executive Vice President\nThai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // ── Toyo Tire North America ────────────────────────────────────
    {
      id: 'POT-TOYO-TIRE-NA',
      shipToId: 'SHIP-TOYO-TIRE-NA',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP',
      consigneeNotify:
        'TOYO TIRE NORTH AMERICA MANUFACTURING INC.\n3660 Highway 411 NE\nWhite, GA 30184\nATTN: SUSAN WOOD',
      agent: '',
      endUser: '',
      termsOfPayment: 'BY T.T.R 60 DAYS AFTER B/L DATE',
      packingInstructions: 'STANDARD EXPORT PACKING',
      confirmBy:
        'T. Fujioka\nSenior Executive Vice President\nThai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // ── Bridgestone India ──────────────────────────────────────────
    {
      id: 'POT-BRIDGESTONE-INDIA',
      shipToId: 'SHIP-BRIDGESTONE-INDIA',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP',
      consigneeNotify:
        'Bridgestone India Private Limited\nPLOT NO. A-43, PHASE-II, MIDC CHAKAN\nVILLAGE SAWARDARI, TALUKA KHED, DIST. PUNE,\nMAHARASHTRA - 410 501, INDIA\nTEL: +91.2135.672.000\nIEC NO. 0396013341/GSTIN Number 27AABCB2304E1ZD',
      agent: '',
      endUser: '',
      termsOfPayment: 'BY T.T.R 60 DAYS AFTER B/L DATE',
      packingInstructions: 'One Way Box',
      confirmBy:
        'T. Fujioka\nSenior Executive Vice President\nThai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // ── Bridgestone South Africa ───────────────────────────────────
    {
      id: 'POT-BRIDGESTONE-SA',
      shipToId: 'SHIP-BRIDGESTONE-SA',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP',
      consigneeNotify:
        'BRIDGESTONE SA (PTY) LTD\n189 GRAHAMSTOWN ROAD, DEAL PARTY,\nPORT ELIZABETH, 6001, SOUTH AFRICA\nATTN:SHIPPING DEPT\nPO BOX 992 PORT ELIZABETH, 6000',
      agent: '',
      endUser: '',
      termsOfPayment: 'BY T.T.R 90 DAYS AFTER B/L DATE',
      packingInstructions: 'GPS',
      confirmBy:
        'T. Fujioka\nSenior Executive Vice President\nThai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // ── Brisa Turkey ───────────────────────────────────────────────
    {
      id: 'POT-BRISA-TURKEY',
      shipToId: 'SHIP-BRISA-TURKEY',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP',
      consigneeNotify:
        'BRISA BRIDGESTONE SABANCI LASTIK SANAYI VE TICARET A.S.\nAlikahya Fatih Mah.Sanayi Cad.No:98\n41310 Izmit / KOCAELI Turkey\nContact Person: BURCU YUZUAK\nPhone: +90 (262) 316 57 53',
      agent: '',
      endUser: '',
      termsOfPayment: 'BY T.T.R 45 DAYS AFTER B/L DATE',
      packingInstructions: 'GPS',
      confirmBy:
        'T. Fujioka\nSenior Executive Vice President\nThai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // ── Bridgestone Firestone Wilson ───────────────────────────────
    {
      id: 'POT-BRIDGESTONE-FIRESTONE-WILSON',
      shipToId: 'SHIP-BRIDGESTONE-FIRESTONE-WILSON',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP',
      consigneeNotify:
        'Bridgestone Firestone NT Wilson Plant\nTriangle East Storage 2010 Baldree Road Wilson\nNC27893 USA\nTEL: 252-246-7630 FAX: 252-246-7315\nATTN: Jeff Pyle',
      agent: '',
      endUser: '',
      termsOfPayment: 'BY T.T.R 90 DAYS AFTER B/L DATE',
      packingInstructions: 'METAL BOX',
      confirmBy:
        'T. Fujioka\nSenior Executive Vice President\nThai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // ── Bridgestone Wuxi ───────────────────────────────────────────
    {
      id: 'POT-BRIDGESTONE-WUXI',
      shipToId: 'SHIP-BRIDGESTONE-WUXI',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP',
      consigneeNotify:
        'BRIDGESTONE (WUXI) TIRE CO.,LTD.\nNo.67, XINMEI ROAD, WUXI NATIONAL HIGH-NEW\nTECHNICAL INDUSTRIAL DEVELOPMENT ZONE,\nWUXI 214028, JIANGSU, CHINA\nFAX:86-0510-8532-2199 TEL:86-0510-8532-2288',
      agent: '',
      endUser: '',
      termsOfPayment: 'BY T.T.R 60 DAYS AFTER B/L DATE',
      packingInstructions: 'GPS',
      confirmBy:
        'T. Fujioka\nSenior Executive Vice President\nThai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // ── Bridgestone Indonesia ──────────────────────────────────────
    {
      id: 'POT-BRIDGESTONE-INDONESIA',
      shipToId: 'SHIP-PT-BRIDGESTONE',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP',
      consigneeNotify:
        'PT. BRIDGESTONE TIRE INDONESIA\nKawasan Industri Surya Cipta Jl. Surya Utama Kav 8-13,\nKutamekar, Ciampel, Kab. Karawang, Jawa Barat, 41363\nPhone No.: (+62-267) 440 201\nNPWP No. 0010 0011 8809 2000',
      agent: '',
      endUser: '',
      termsOfPayment: 'BY T.T.R 30 DAYS AFTER B/L DATE',
      packingInstructions: 'GPS',
      confirmBy:
        'T. Fujioka\nSenior Executive Vice President\nThai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // ── Bridgestone Taiwan ─────────────────────────────────────────
    {
      id: 'POT-BRIDGESTONE-TAIWAN',
      shipToId: 'SHIP-BRIDGESTONE-TAIWAN',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP',
      consigneeNotify:
        'BRIDGESTONE TAIWAN CO.,LTD.\nNo.1-1, Wenhua Rd, Hukou Township\nHsinchu County 30352 Taiwan (R.O.C.)\nPHONE:886-35-981621',
      agent: '',
      endUser: '',
      termsOfPayment: 'BY T.T.R 10 DAYS AFTER B/L DATE',
      packingInstructions: 'GPS',
      confirmBy:
        'T. Fujioka\nSenior Executive Vice President\nThai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // ── Bridgestone Mexico ─────────────────────────────────────────
    {
      id: 'POT-BRIDGESTONE-MEXICO',
      shipToId: 'SHIP-BRIDGESTONE-MEXICO',
      toBlock:
        'THAI SYNTHETIC RUBBERS CO., LTD.\n18th Floor, Sathorn Square Office Tower,\n98 North Sathorn Road,\nSilom, Bangrak, Bangkok 10500,\nTHAILAND\nATTN.: T. Fujioka / SEVP',
      consigneeNotify: 'PLEASE REFER TO THE SI',
      agent: '',
      endUser: '',
      termsOfPayment: 'BY T.T.R 90 DAYS AFTER B/L DATE',
      packingInstructions: 'STANDARD EXPORT PACKING',
      confirmBy:
        'T. Fujioka\nSenior Executive Vice President\nThai Synthetic Rubbers Co., Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    }
  ] as PoTemplate[],
  siTemplates: [
    // -- BRIDGESTONE POZNAN SP/ZO.O ----------------------------------------
    {
      id: 'SIT-BRIDGESTONE-POZNAN',
      shipToId: 'SHIP-BRIDGESTONE-POZNAN',
      attn: 'MR.T. Fujioka /SEVP\nTHAI SYNTHETIC RUBBERS\nCO., LTD.',
      from: 'D.KAWAMORI/UEDA\nUBE Elastomer Co. Ltd.\nTEL:81-3-5419-6167\nFAX:81-3-5419-6250',
      poNumberHeader: 'BS POLAND PO No.:',
      no2Header: '',
      no2: '',
      materialCodeHeader: '',
      materialCode: '',
      noteUnderMaterial: '',
      user: 'BRIDGESTONE POZNAN SP/ZO.O',
      country: 'GDYNIA POLAND',
      shipper: 'TSL',
      feederVessel: 'ITHACA V.111S',
      motherVessel: 'ONE SATISFACTION V.001W',
      vesselCompany: 'OCEAN NETWORK EXPRESS PTE LTD. C/O',
      forwarder: 'DIRECT',
      portOfLoading: '',
      consignee: 'BRIDGESTONE POZNAN SP/ZO.O.',
      blType: '',
      freeTime: '',
      courierAddress: 'No need original courier.',
      eoriNo: 'PL782205233400000',
      bookingNo: '',
      notifyParty: 'SAME AS CONSIGNEE',
      alsoNotify1: '',
      alsoNotify2: '',
      deliverTo: '',
      requirements:
        '* FULL SET OF surrendered B/L.\n* Pls mark BSEU code "HB12-B" and "5500070292"on all document\n* Certificate of Origin issued by manufacturer\n* Certificate of Analysis marked BS material code and PO number\nissued by manufacturer\n* Declaration of non coniferous wood packing materials" issued by manufacturer\n* General Insurance policy is accepted.\n( TSL don\'t need to send the insurance policy together with shipping documents)',
      note: '*Please send all original docs and COMMERCIAL IV (between UBE and TSL) by PDF copies by E-mail to UBE Tokyo.\n*NO need original courier to BS and UBE Tokyo.                      ? Changed !!',
      note2: '',
      note3: '',
      description: 'POLYBUTADIENE RUBBER\nHB12-B / UBEPOL VCR412',
      underDescription: '',
      shippingMark:
        'SHIPPING MARK\nBRIDGESTONE POZNAN SP/ZO.O\nGDYNIA\nORDER:5500070292\nHB12-B/UBEPOL VCR412\nC/NO.1-15\nMADE IN THAILAND',
      belowSignature: 'UBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- BRIDGESTONE BRASIL ----------------------------------------
    {
      id: 'SIT-BRIDGESTONE-BRASIL',
      shipToId: 'SHIP-BRIDGESTONE-BRASIL',
      attn: 'MR.T. Fujioka/SEVP\nTHAI SYNTHETIC RUBBERS\nCO., LTD.\nFAX:66-2-685-3056',
      from: 'KAWAMORI/UEDA\nUBE Elastomer Co. Ltd.\nTEL:81-3-5419-6167\nFAX:81-3-5419-6250',
      poNumberHeader: 'BS BRASIL PO No.',
      no2Header: '',
      no2: '',
      materialCodeHeader: '',
      materialCode: '',
      noteUnderMaterial: '',
      user: 'BRIDGESTONE BRASIL',
      country: 'SANTOS, BRAZIL',
      shipper: 'TSL',
      feederVessel: 'ONE GRUS V.023E',
      motherVessel: 'EVER LOTUS V.1571-060W',
      vesselCompany: 'YANGMING',
      forwarder: 'MERCURIAL',
      portOfLoading: '',
      consignee:
        'BRIDGESTONE DO BRASIL INDUSTRIA E COMERCIO LTDA.\nAV.QUEIROS DOS SANTOS 1717\nSANTO ANDRE-09015-901-SAO PAULO-BRAZIL\nCNPJ:57497539/0001-15   ATTN:Mr.Paulo\nTEL:(011)4433-1666 FAX(011)4433-1187\nE-mail ?ImportacaoLASRM@la-bridgestone.com\nE-mail ? impo-bridgestone@nelsonheusi.com.',
      blType: '',
      freeTime: '',
      courierAddress: '',
      eoriNo: '',
      bookingNo: '',
      notifyParty:
        'BRIDGESTONE DO BRASIL IND. E COM. LTDA.\nAv. Jornalista Roberto Marinho, 85\nTower Bridge Corporate – 18º. Floor\n04576-010 – São Paulo - SP – BRAZIL\nATT: Dept. COMEX – Thatielen Bastos\nPhone 55-11-4433-1634\nE-mail ?ImportacaoLASRM@la-bridgestone.com\nE-mail ? impo-bridgestone@nelsonheusi.com.\nCNPJ 57.497.539/0024-01',
      alsoNotify1: '',
      alsoNotify2: '',
      deliverTo: '',
      requirements:
        '* FULL SET OF CLEAN OCEAN B/L 3 ORIGIANAL +4 COPIES(issued at destination)\n*PLEASE SHOW THE FOLLOWING WORDS ON DESCRIPTION OF  B/L\n(CNPJ: 57.497.539/0001-15 (when is for Santos Port) and\n(CNPJ: 57.497.539/0007-00 (when is for Salvador Port).\n(NCM CODE (HARMONIZED SYSTEM);4002 <=only 4 number\n(INVOICE NO.4900001722(ITEM10))\n*"NCM code for empty packages : 7326" on B/L<=only 4 number\n* Pls mark BSBR code "EC050A(AA2646)" and " PO NO.4900001722 on all document\n* 2 original (Full set)of Certificate of Origin issued by CHAMBER OF COMMERCE\n* 3 original of Certificate of Analysis marked BS material code and PO number\nissued by manufacturer\n* two copies of Declaration of non coniferous wood packing materials issued by manufacturer\n?Please write the manufacturing date on the Packing List.\n*please try to get 21days free time and pls. show it on BL(if you can)\nAll documents must signed by hand in blue ink indicating name and title of person signing',
      note: '*PLASE SEND ALL ORIGINAL DOCS EXCEPT COMMERCIAL CIF I/V(TSL-UBE) TO BS BRASIL DIRECLTY(PLS REFER ABOVE ADDRESS)\n*PLASE SEND US ALL DOCS PDF COPIES BY E-MAIL, NO NEED TO SEND  BY COURIER TO US',
      note2: '',
      note3: '',
      description:
        'SYNTHETIC RUBBER UBE 150 L BRIDGESTONE\nFIRSTONE COMMON CODE:EC050A(AA2646)',
      underDescription:
        'NCM:4002\n"NCM code for empty packages : 7326" on B/L\n(CNPJ:57497539/0001-15)\nINVOICE NO.',
      shippingMark:
        'SHIPPING MARK\nBRIDGESTONE DO BRASIL IND. COM.\nLTDA\nSAO PAULO-BRAZIL\nSHIP:SANTOS\nORDER NO.:4900001722\nEC050\nMADE IN THAILAND\nPRODUCER:THAI SYNTHETIC RUBBER\nATTN:Dept. COMEX – Thatielen Bastos\nTELL:55-11-4433-1634\nCOM:BRIDGESTONE DO BRASIL\nINDUSTRIA E COMERCIO LTDA.\nADD:Av. Jornalista Roberto Marinho, 85\nTower Bridge Corporate – 18º. FL Cidade Monções\n04576-010 – São Paulo - SP – BRAZIL\nZIP CODE;04576-010, CNPJ;57.497.539/0024-01\nBRIDGESTONE DO BRASIL IND. E COM. LTDA.\nAv. Jornalista Roberto Marinho, 85\nTower Bridge Corporate – 18º. Floor\n04576-010 – São Paulo - SP – BRAZIL\nATT: Dept. COMEX – Thatielen Bastos\nPhone 55-11-4433-1634\nE-mail ?ImportacaoLASRM@la-bridgestone.com\nE-mail ? impo-bridgestone@nelsonheusi.com.\nCNPJ 57.497.539/0024-01',
      belowSignature: 'UBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- BRIDGESTONE HUNGARY ----------------------------------------
    {
      id: 'SIT-BRIDGESTONE-TATABANYA',
      shipToId: 'SHIP-BRIDGESTONE-TATABANYA',
      attn: 'MR.T. Fujioka /SEVP\nTHAI SYNTHETIC RUBBERS\nCO., LTD.',
      from: 'D.KAWAMORI/UEDA\nUBE Elastomer Co. Ltd.\nTEL:81-3-5419-6167\nFAX:81-3-5419-6250',
      poNumberHeader: 'BS TATABANYA PO No.:',
      no2Header: '',
      no2: '',
      materialCodeHeader: '',
      materialCode: '',
      noteUnderMaterial: '',
      user: 'BRIDGESTONE HUNGARY',
      country: 'HUNGARY',
      shipper: 'TSL',
      feederVessel: 'PELICAN V.073S',
      motherVessel: 'ONE HELSINKI V.063W',
      vesselCompany: 'OCEAN NETWORK EXPRESS PTE. LTD.',
      forwarder: 'DIRECT',
      portOfLoading: '',
      consignee: 'Bridgestone Tatabanya Manufacturing Ltd.',
      blType: '',
      freeTime: '',
      courierAddress: '',
      eoriNo: 'HU0002515281',
      bookingNo: '',
      notifyParty: 'SAME AS CONSIGNEE',
      alsoNotify1: '',
      alsoNotify2: '',
      deliverTo: '',
      requirements:
        '* SEA WAY BILL is required.\n* Pls mark BSEU code "HB12" and "5500069106"on all document\n* Certificate of Origin issued by CHAMBER OF COMMERCE\n* Certificate of Analysis marked BS material code and PO number\nissued by manufacturer\n* Declaration of non coniferous wood packing materials issued by manufacturer\n* General Insurance policy is accepted.\n( TSL don\'t need to send the insurance policy together with shipping documents)\n*MSDS',
      note: '**Please e-mail ALL docs and  CIF COMMERCIAL IV (between UBE and TSL) by PDF copies to UBE Tokyo.\n*NO need original courier to BS and UBE Tokyo if SEA WAY BILL.',
      note2: '',
      note3: '',
      description: 'POLYBUTADIENE RUBBER\nHB12/ UBEPOL VCR412',
      underDescription: '',
      shippingMark:
        'SHIPPING MARK\nBRIDGESTONE TATABANYA\nTERMELO Kft\nORDER NO:5500069106\nHB12/UBEPOL VCR412\nC/NO.1-16\nMADE IN THAILAND',
      belowSignature: 'UBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- MICHELIN SHENYANG TIRE CO. ----------------------------------------
    {
      id: 'SIT-MICHELIN-SHENYANG',
      shipToId: 'SHIP-MICHELIN-SHENYANG',
      attn: '',
      from: '',
      poNumberHeader: '',
      no2Header: '',
      no2: '',
      materialCodeHeader: '',
      materialCode: '',
      noteUnderMaterial: '',
      user: 'MICHELIN SHENYANG TIRE CO.',
      country: 'SHENYANG, CHINA',
      shipper: 'FULL CONTACT DETAIL OF TSL\n*WITH TRADE RESISTRATION NO.',
      feederVessel: '',
      motherVessel: '',
      vesselCompany: '',
      forwarder: '',
      portOfLoading: 'LAEM CHABANG, THAILAND',
      consignee:
        'Michelin Shenyang Tire Co.,Ltd\nNo.12,Xihesi North Street,Shenyang Economic\nandTechnologicalDevelopment Area,Shenyang ,\nLiaoning,P.R.China .110142\n( Tel:+ 8624 8603 5105    Fax: 86-24-25176770/25176762)\nUSCI:912101066046211235\nATTN:SY2 PUR department /Suning. Wang. E-Mail: suning.wang@michelin.com',
      blType: '',
      freeTime: '',
      courierAddress: '',
      eoriNo: '',
      bookingNo: '',
      notifyParty: 'SAME AS CONSIGNEE',
      alsoNotify1: '',
      alsoNotify2: '',
      deliverTo: '',
      requirements:
        '*NO NEED TO DISPATCH THE ORIGINAL DOCS. EXCEPT FORM E, PDF FILES OF ORIGINAL ARE ENOUGH.\n*PLEASE COURIER ORIGINAL FULL SET OF FORME TO MSC SHENYANG\n*PDF OF BL AND FORM-E MUST BE SCAN OF THE ORIGINAL WITH COLORED\n*Please issue P/L,Surrendered B/L,CoA,I/P(No need I/P cert. for each shipment).\n(showing"returnable metal boxes "  on B/L)\n*please issue PROFORMA I/V and P/L for  box only\n*please issue Full set of FORM-E WITH UBE INVOICE  (H.S.CODE:40022090\n(PLEASE INFORM US FORM-E THIRD PARTY INV\'S DETAILS)\n*Please  issue TSL FOB CUSTOM  I/V for From-E\n*PLEASE SHOW "PG CODE: PG02596AD" AND "MFD CODE:MFD1308561A" ON ALL DOCS.',
      note: "*Please send ALL ORIGINAL DOCS.PDF COPIES BY E-MAIL to UEC Matsumoto.\n*don't need to include our third party Invoice in your all DOC. PDF.",
      note2:
        'MSC SHENYANG\nCourier address\n*In case original Form-E\nneed to be dispatched',
      note3:
        'Michelin Shenyang Tire Co., LTD\nNO.12 XI HE SI BEI Street SHENYANG ECONOMIC & TECHNOLOGICAL?\nDEVELOPMENT AREA (SEDA)Shenyang, Liaoning Province, CHINA\nZIP CODE:110142 OR 110141            ATTN:ATTN:Suning. Wang./ + 8624 8603 5105',
      description: 'POLYBUTADIENE RUBBER\nUBEPOL BR150L',
      underDescription: '',
      shippingMark:
        "SHIPPING MARK\nNAME OF SUPPLIER : TSL\nUBEPOL BR150L\nMICHELIN'S ORDER NUMBER :5910244622\nMATERIAL CODE:\nPG CODE: PG02596AD\nMFD CODE:MFD1308561A\nLOT NO.\nDATE OF FABRICATION:\nQUANTITY:20.16MTS\nMADE IN THAILAND\nNO.1-UP",
      belowSignature: 'UBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- SHANGHAI MICHELIN TIRE CO., LTD. ----------------------------------------
    {
      id: 'SIT-MICHELIN-SHANGHAI',
      shipToId: 'SHIP-SHANGHAI-MICHELIN',
      attn: '',
      from: '',
      poNumberHeader: '',
      no2Header: '',
      no2: '',
      materialCodeHeader: '',
      materialCode: '',
      noteUnderMaterial: '',
      user: 'SHANGHAI MICHELIN TIRE CO., LTD.',
      country: 'SHANGHAI, CHINA',
      shipper: 'FULL CONTACT DETAIL OF TSL\n*WITH TRADE RESISTRATION NO.',
      feederVessel: '',
      motherVessel: '',
      vesselCompany: '',
      forwarder: '',
      portOfLoading: 'LAEM CHABANG, THAILAND',
      consignee:
        'Shanghai Michelin Tire Co.,Ltd.\nNO. 2915 JIAN CHUAN ROAD, MIN HANG DEVELOPMENT\nZONE, SHANGHAI, 201111 P.R.CHINA Ms.Jun You\nTel: +86 21 3405 4888 *3226\nFax:54723540 or 86 21 3372 7711 *226\nUSCI:91310000607429866C E-MAIL\n:jun.you@michelin.com',
      blType: '',
      freeTime: '',
      courierAddress:
        'Attn:Bilin-san and Jun-san\ntel:0086-21-3405488\nSHANGHAI MICHELIN WARRIOR TIRE\nNO.2915 JIANCHUAN ROAD, MIN HANG\nDEVELOPMENT ZONE,\nSHANGHAI\nCHINA zip code 201111',
      eoriNo: '',
      bookingNo: '',
      notifyParty: 'SAME AS CONSIGNEE',
      alsoNotify1: '',
      alsoNotify2: '',
      deliverTo: 'SAME AS CONSIGNEE',
      requirements:
        '*NO NEED TO DISPATCH THE ORIGINAL DOCS.  BY COURIER, PDF FILES OF ORIGINAL ARE ENOUGH.\n*PDF OF BL AND FORM-E MUST BE SCANED OF THE ORIGINAL WITH COLORED\n*Please issue P/L,Surrendered B/L and arrange I/P(No need cert. for each shipment).\n*Please issue the original FORM-E  WITH TSL FOB Custom I/V.\n*Please issue of TSL FOB CUSTOM I/V for Form-E\n(please mark net weight (xx.xxxTON) on the form-E  ( 7 Column ) .\n*Please issue  CoA(and show NIF code  01406 on CoA)\n*Please issue  Declaration of No-Wood Packing Material\n*Please issue  the proforma I/V AND P/L for boxes.\n*Please apply Shipping Line to extend D/M & D/T Free Time each 14days.',
      note: '*Please send ALL ORIGINAL DOCS.(including TSL commercial INV) PDF COPIES BY E-MAIL to UEC Matsumoto.\n*Please keep the original Form-E 2 for 2 months after ETD.',
      note2: '',
      note3: '',
      description: 'SYNTHETIC RUBBER\nUBEPOL BR150L',
      underDescription: '',
      shippingMark:
        "SHIPPING MARK\nNAME OF SUPPLIER : TSL\nBR150L\nMICHELIN'S ORDER NUMBE.:5400138582\nMATERIAL NO. PG02596AD/NIF code 01406 .\nLOT:NO.\nDATE OF FABRICATION:\nQUANTITY:20.16MTS\nMADE IN THAILAND\nNO.1-UP",
      belowSignature: 'Overseas Sales Group\nUBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- Cooper (Kunshan) Tire Co,. Ltd ----------------------------------------
    {
      id: 'SIT-COOPER-KUNSHAN',
      shipToId: 'SHIP-COOPER-KUNSHAN',
      attn: '',
      from: '',
      poNumberHeader: 'UEG PO No.',
      no2Header: 'Cooper NO.:',
      no2: '72026877',
      materialCodeHeader: 'Material Code',
      materialCode: 'SMITHIC on grade label',
      noteUnderMaterial: '*put marking CODE on both sides of GPS box',
      user: 'Cooper (Kunshan) Tire Co,. Ltd',
      country: 'CHINA',
      shipper: 'FULL CONTACT DETAIL OF TSL\nWITH TRADE RESISTRATION NO.',
      feederVessel: '',
      motherVessel: '',
      vesselCompany: '',
      forwarder: '',
      portOfLoading: 'LAEM CHABANG, THAILAND',
      consignee:
        'Cooper (Kunshan) Tire Co., Ltd.\nNo. 168 Bailing Road, Kunshan Development\nZone, Jiangsu Province\n215331 Kunshan, Jiangsu Province\nCHINA\nContact: Maggie Pan (Import/Export Dept)\nTel: +86- 0512 5772-7609\nmaggie_pan@goodyear.com\nUSCI?91320583772033662N',
      blType: '',
      freeTime: '',
      courierAddress: '',
      eoriNo: '',
      bookingNo: '',
      notifyParty:
        'Cooper (Kunshan) Tire Co., Ltd.\nNo. 168 Bailing Road, Kunshan Development\nZone, Jiangsu Province\n215331 Kunshan, Jiangsu Province\nCHINA\nContact: Maggie Pan (Import/Export Dept)\nTel: +86- 0512 5772-7609\nmaggie_pan@goodyear.com\npeyton_shan@goodyear.com',
      alsoNotify1: '',
      alsoNotify2: '',
      deliverTo:
        'Cooper (Kunshan) Tire Co., Ltd.\nNo. 168 Bailing Road, Kunshan Development\nZone, Jiangsu Province\n215331 Kunshan, Jiangsu Province\nCHINA\nContact: Maggie Pan\nTel: +86- 0512 5772-7609',
      requirements:
        "*SWB,P/L,I/P,CoA\n*I/V AND P/L FOR BOX\n*FULL SET OF ORIGINAL FORM-E(WITH TSL INVOICE)\n* COOPER PO NO.AND   Material Code: SMITHIC,  SHOULD BE ON ALL DOCS.\n*NO NEED TO ISSUE I/P CERTIFICATE FOR THIS SHIPMENT\n*PLEASE DISPATCH FULL SET OF ORIGINAL  FORM-E, customs INV TO UEG,\nFOR OTHER DOCS, YOU DON'T NEED TO DISPATCH.\n*Please send all original docs. copies( COLORED PDF) by email to UEG and UEC, and send UEC INV+BL copies separately.",
      note: '',
      note2: '',
      note3: '',
      description: 'SYNTHETIC RUBBER',
      underDescription: '',
      shippingMark:
        'SHIPPING MARK\nCooper (Kunshan) Tire Co,. Ltd\nCooper PO# No.72026877\nLot No.\nQuantity:    kg\nMaterial Code:SMITHIC\nCountry of Origin: Thailand\nProduction Date:\nExpiry Date:',
      belowSignature: 'Overseas Sales Group\nUBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- GOODYEAR AMIENS SUD ----------------------------------------
    {
      id: 'SIT-GOODYEAR-AMIENS',
      shipToId: 'SHIP-GOODYEAR-DUNLOP-AMIENS',
      attn: '',
      from: '',
      poNumberHeader: 'UEG PO No.',
      no2Header: 'GY PO NO.:',
      no2: '8210256629',
      materialCodeHeader: 'GOODYEAR CODE',
      materialCode: 'ESTHERIC on grade label',
      noteUnderMaterial: '*put marking CODE on both sides of Goodpack box',
      user: 'GOODYEAR DUNLOP TIRES',
      country: 'FRANCE',
      shipper: 'TSL /UBE EUROPE GMBH',
      feederVessel: '',
      motherVessel: '',
      vesselCompany: '',
      forwarder: '',
      portOfLoading: 'LAEM CHABANG, THAILAND',
      consignee:
        'GOODYEAR OPERATIONS SA.\nAmiens plant\nAVENUE GORDON SMITH\n7750  COLMAR-BERG\nLU -  LUXEMBOURG',
      blType: '',
      freeTime: '',
      courierAddress: '',
      eoriNo: '',
      bookingNo: '',
      notifyParty:
        'PSA BDP INTERNATIONAL LOJISTIK\nANONIM SIRKETI\nMASLAK MAHALLESI, SAAT SOKAK\nSPINE TOWER SITESI NO:5, IC KAPI NO:48,\nKAT:3\n34398 SARIYER ISTANBUL,TURKEY\n+90 (212) 346-0601\nContact email: goodyear-ofimp.llptr@bdpint.com\nSar?yer V.D tax number 7331238168',
      alsoNotify1: '',
      alsoNotify2: '',
      deliverTo:
        'GOODYEAR AMIENS SUD\n60 AV ROGER DUMOULIN\n80030 AMIENS\nFRANCE',
      requirements: '*SWB, P/L, CoA,I/P',
      note: '*NO NEED TO ISSUE I/P CERTIFICATE FOR THIS SHIPMENT\n*NO NEED TO DISPATCH ANY DOCS. TO UEG\n*Please send all original docs. copies( COLORED PDF) by email to UEG and UEC, and send UEC INV+BL copies separately.',
      note2: '',
      note3: '',
      description: 'SYNTHETIC RUBBER',
      underDescription: '',
      shippingMark:
        'SHIPPING MARK\nDUNLOP\nAMIENS\nUBEPOL VCR412\nGOODYEAR CODE:ESTHERIC\nGY PO NO.  8210256629\nC/NO. 1-UP',
      belowSignature: 'Overseas Sales Group\nUBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- GOODYEAR DO BRASIL PRODUTOS DE BORRACHA LTDA ----------------------------------------
    {
      id: 'SIT-GOODYEAR-BRASIL',
      shipToId: 'SHIP-GOODYEAR-BRASIL',
      attn: '',
      from: '',
      poNumberHeader: 'UEG PO No.',
      no2Header: 'GY PO NO.:',
      no2: '4500477572',
      materialCodeHeader: 'GOODYEAR CODE:',
      materialCode: 'SMITHIC on grade label',
      noteUnderMaterial: '*put marking CODE on both sides of Goodpack box',
      user: 'GOODYEAR DUNLOP TIRES',
      country: 'BRASIL',
      shipper: 'TSL ON BEHALF OF  UBE EUROPE GMBH',
      feederVessel: '',
      motherVessel: '',
      vesselCompany: '',
      forwarder: '',
      portOfLoading: 'LAEM CHABANG, THAILAND',
      consignee:
        'Goodyear do Brasil Produtos\nde Borracha Ltda.\nAv. Affonso Pansan, 3415 (Anhanguera, KM 128)\n13473-620 Vila Bertini - Americana City\nSao Paulo State / Brazil\nCNPJ 60.500.246/0016-30\nAttn.: Mrs. Cassia Rodrigues\ncassia_rodrigues@goodyear.com\nTel.:+55 19 2109-1708',
      blType: '',
      freeTime: '',
      courierAddress: '',
      eoriNo: '',
      bookingNo: '',
      notifyParty:
        'S. Magalhaes S.A. Logistica em\nComercio Exterior\nPraca da Republica, 62- 2nd Floor\n11013-010 Santos, SP/ Brasil\nCNPJ 58.130.089/0001-90\nA/C: Giselia Oliveira and Wilson Carlos\nE-Mail: importgy@smagalhaes.com.br',
      alsoNotify1: '',
      alsoNotify2: '',
      deliverTo:
        'Goodyear do Brasil Produtos de Borracha Ltda.\nAv. Affonso Pansan, 3415 (Anhanguera, KM128)\nVila Bertini – Americana City\nSão Paulo State/Brazil\nZip Code 13473-620\nCNPJ 60.500.246/0016-30\nAttn.: Fernanda Duarte\nfernanda_duarte@goodyear.com\nTel.:+55 19 2109-1672',
      requirements:
        '*FULL SET OF ORIGIAL B/L\n(PLEASE SHOW FREIGHT VALUE ON BL)\n*P/L, I/P, COA\n*I/V for Returnable Metal box(INV including packing details)\n(Please be shown Container No. and Lot No. on P/L)',
      note: '*Please show material NCM NO.4002.20 on BL and P/L.\n*Please show Box NCM NO.7309.00(GPS) on BL(In case of returnable Box, )\n*Plesae send all docs.Draft to UEG (CC;KIKUCHI)before issue the original doc.\n*All documents must signed by hand in blue ink indicating name and title of person signing\n*Please dispatch the full set of  ORIGINAL BL to UEG, for other docs  PDF COPIES are enough.\n*Please send all original docs. copies(COLORED PDF) by email to UEG and UEC, and send UEC INV+BL copies separately.',
      note2: '',
      note3: '',
      description: 'POLYBUTADIENE RUBBER',
      underDescription: '',
      shippingMark:
        'GOODYEAR DO BRASIL\nPRODUTOS\nGY P.O.: NO.4500477572\nUBEPOLVCR617\nMATERIAL CODE:SMITHIC\nC/NO. 1-UP\nPRODUCTION DATE:\nLOT.NO:',
      belowSignature: 'Overseas Sales Group\nUBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- SUMITOMO RUBBER BRASIL ----------------------------------------
    {
      id: 'SIT-SUMITOMO-BRASIL',
      shipToId: 'SHIP-SUMITOMO-BRASIL',
      attn: 'T.FUJIOKA / SEVP\nTHAI SYNTHETIC RUBBERS\nCO., LTD.\nFAX:66-2-685-3056',
      from: 'S.OKUNI/H.UEDA\nUBE Elastomer Co. Ltd.\nTEL:81-3-5419-6167\nFAX:81-3-5419-6250',
      poNumberHeader: 'UEG PO No.',
      no2Header: 'SUMITOMO PO NO.:',
      no2: '100752',
      materialCodeHeader: '',
      materialCode: '',
      noteUnderMaterial: '',
      user: 'SUMITOMO RUBBER BRASIL',
      country: 'BRASIL',
      shipper: 'TSL /UBE EUROPE GMBH',
      feederVessel: 'SINAR BAJO V.110S',
      motherVessel: 'CMA CGM BUZIOS V.0010W',
      vesselCompany:
        'PACIFIC INTERNATIONAL LINES (PRIVATE ) LIMITED C/O PIL SHIPPING (THAILAND)LTD.',
      forwarder: 'DLT',
      portOfLoading: 'LAEM CHABANG, THAILAND',
      consignee:
        'SUMITOMO RUBBER DO BRASIL LTDA\nR.FRANCISCO FERREIRA DA CRUZ 4656\n83820293 FAZENDA RIO GRANDE-PR-PAR\nBRAZIL CONTACT:EMANUELA BECHLIN,\nEMANUELA BECHLIN, JEISELAINE KOZAN\nTEL:+55 41 3060-9250 EXT.1115\nTEL:+55 41 3060-9250 EXT.1112\nCNPJ:13.816.470/0001-70',
      blType: '',
      freeTime: '21 DAYS FREE TIME',
      courierAddress: '',
      eoriNo: '',
      bookingNo: '',
      notifyParty:
        'SUMITOMO RUBBER DO BRASIL LTDA\nCNPJ:13.816.470/0001-70 AV.FRANCISCO\nFERREIRA DA\nCRUZ,4656 BAIRRO:EUCALIPTUS-FAZENDA\nRIO GRANDE-PR\nBRASIL CEP:83.820-293 AC:VITOR MELLO\nE-MAIL:vitor.mello@dunloppneus.com.br\nTEL:+55 41 3060-9250/EXT:1168\nID:55*57344*107',
      alsoNotify1: '',
      alsoNotify2: '',
      deliverTo: '',
      requirements:
        '*ALL DOCS MUST BE SIGNED IN BLUE INK PEN\n*Handwritten amendments are not acceptable.\n* ISSUANCE OF THE ORIGINAL B/L AT DESTINATION(BRAZIL)SHOWING FREIGH COSTS\n( For B/L details, please refer to the  "sumitomo document checklist")\n*COLOR SCAN OF B/L COPY\n*PACKING LIST\n( For details, please refer to the  "sumitomo document checklist" )\n*INVOICE FOR METAL BOX FOR CUSTOMS PURPOSES ONLY.\n( For details, please refer to the  "sumitomo document checklist" )\n*CERTIFICATE OF ANALYSIS\n( For details, please refer to the attached "sumitomo document checklist" )\n*CONTAINER PHOTOS – BEFORE AND AFTER LOADING WITH PHOTO OF SEAL\n*REQ: SEND SHIPPING DOCS EXCEPT COMMERCIAL I/V IN PDF BY EMAIL TO UEG AND UEC\n*REQ: SEND B/L COPY AND COMMERCIAL IV IN PDF BY E-MAILTO UEC\n*NO NEED : CoO BY CHAMBER OF COMMERCE\n*CUSTOME TARIFF NO.40022000\n*"NCM Number :  4002.20.99  Ubepol VCR 617" AND\n*"NCM Number :  7309.00 GPS Metal Box" show on all documents.\n*Please send the all docs draft to UEG before issue the original.\n*Please mention always on BL "Wooden Package: not applicable"',
      note: '?SI???????TSL????SI???????\n*PLASE SEND ALL ORIGINAL DOCS EXCEPT COMMERCIAL CIF I/V(TSL-UBE) TO UEG DIRECLTY\n*PLASE SEND ALL ORIGINAL DOCS EXCEPT COMMERCIAL CIF I/V(TSL-UBE) TO UEG DIRECLTY\n*PLASE SEND ALL DOCS PDF COPIES BY E-MAIL TO UBE MATSUMOTO, NO NEED TO SEND THEM BY COURIER.',
      note2: '',
      note3: '',
      description: 'SYNTHETIC RUBBER',
      underDescription: '',
      shippingMark:
        'SHIPPING MARK\nSUMIOTMO RUBBER BRASIL\nPRODUCT NAME :UBEPOL VCR617\nSUMITOMO RUBBER BRASIL PO#100752\nMATERIAL SPEC:TMS-1233-B-07\nMATERIAL NO. 120310220\nLOT NO.:\nC/NO. 1-16',
      belowSignature: 'UBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- SUMITOMO RUBBER SOUTH AFRICA (PTY) LTD. ----------------------------------------
    {
      id: 'SIT-SUMITOMO-SOUTH-AFRICA',
      shipToId: 'SHIP-SUMITOMO-SOUTH-AFRICA',
      attn: 'T.FUJIOKA / SEVP\nTHAI SYNTHETIC RUBBERS\nCO., LTD.\nFAX:66-2-685-3056',
      from: 'S. OKUNI/ H.UEDA\nDOMESTIC SALES GROUP\nUBE ELASTOMER. LTD.\nTEL:81-3-5419-6167\nFAX:81-3-5419-6250',
      poNumberHeader: 'UEG PO No.',
      no2Header: 'SUMITOMO PO NO.:',
      no2: '7100189111',
      materialCodeHeader: '',
      materialCode: '',
      noteUnderMaterial: '',
      user: 'SUMITOMO RUBBER SOUTH AFRICA (PTY) LTD.',
      country: 'SOUTH AFRICA',
      shipper: 'TSL /UBE EUROPE GMBH',
      feederVessel: 'ONE WREN V.029E',
      motherVessel: 'NYK FUJI V.135W',
      vesselCompany: 'OCEAN NETWORK EXPRESS PTE. LTD. C/O',
      forwarder: 'FOB / DSV',
      portOfLoading: 'LAEM CHABANG, THAILAND',
      consignee:
        'Sumitomo Rubber South Africa (Pty) Ltd\nAttention : Zwelakhe Nhleko\nLion Match Office Park\nThe Old Factory Building\n892 Umgeni Road\nDurban 4001\nKwazulu Natal\nSouth Africa\nTel: +27 031 242 1202\nEmail : Zwelakhe.Nhleko@srigroup.co.za',
      blType: '',
      freeTime: '-',
      courierAddress: '',
      eoriNo: '',
      bookingNo: '',
      notifyParty:
        'DSV South Africa (Pty) Ltd.\n1st Floor Podium, John Ross House,\n22/23 Mncadi Ave, Esplanade\n4001 Durban\nP O BOX 1008, Durban, 4000\nSouth Africa 4018\nContact: : Suraj Seobaran\nEmail: Suraj.Seobaran@za.dsv.com\nPhone: 27(031)  310 6000 (Switchboard)\nPhone: 27 (031) 310 6004 (Direct line)',
      alsoNotify1: '',
      alsoNotify2: '',
      deliverTo: '',
      requirements:
        '*P/L\n*Telex released B/L\n*Quality Certificate\n*Invoice 1 original',
      note: '*Please submit complete set of documents in advance for final aproval of Sumitomo\n*PLASE SEND ALL DOCS PDF  COLOURED COPIES BY E-MAIL TO UEC OKUNI, NO NEED TO SEND THEM BY COURIER.',
      note2: '',
      note3: '',
      description: 'SYNTHETIC RUBBER',
      underDescription: '',
      shippingMark:
        'SHIPPING MARK\nSUMIOTMO RUBBER SOUTH AFRICA\nPRODUCT NAME :UBEPOL VCR617\nSUMITOMO RUBBER\nSOUTH AFRICA PO\n7100189111\nMATERIAL CODE:L1239\nLOT NO.:\nC/NO. 1-16',
      belowSignature: 'UBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- Sumitomo Rubber ?Hunan?CO.LTD ----------------------------------------
    {
      id: 'SIT-SUMITOMO-HUNAN',
      shipToId: 'SHIP-SUMITOMO-HUNAN',
      attn: 'T.FUJIOKA/SEVP\nTHAI SYNTHETIC RUBBERS\nCO., LTD.',
      from: 'S.OKUNI/ H.UEDA\nUBE Elastomer Co. Ltd.\nTEL:81-3-5419-6167\nFAX:81-3-5419-6250',
      poNumberHeader: 'USH PO No.:',
      no2Header: '',
      no2: '',
      materialCodeHeader: '',
      materialCode: '',
      noteUnderMaterial: '',
      user: 'Sumitomo Rubber ?Hunan?CO.LTD',
      country: 'CHINA',
      shipper:
        'FULL CONTACT DETAIL OF TSL\nWITH TRADE RESISTRATION NO.\n(no need On Behalf of USH)',
      feederVessel: 'HEUNG-A BANGKOK V.2602N',
      motherVessel: '-',
      vesselCompany: 'HEUNG A',
      forwarder: 'DIRECT',
      portOfLoading: 'LAEM CHABANG, THAILAND',
      consignee:
        'Sumitomo Rubber ?Hunan?CO.LTD\nNo.1318 Liangtang East Road ,?Changlong street,?Changsha county,?\nChangsha city,?Hunan province,?China\nTEL: 0086-731-86407006-1229\nFAX: 0086-731-86407030\nATTN: DingJin Wu\ndj_wu@srh.dunlop.com.cn\nUSCI:91430100561703582X',
      blType: '',
      freeTime:
        'D/M:14DAYS       D/T:14DAYS    * Please apply 14 days Free Time',
      courierAddress:
        "COURIER ADDRESS:ATTN:Yang Jie-SAN\nUBE (SHANGHAI) LTD.\nRoom 2403#, Shanghai International Trade Centre,\nYan'an West Road 2201#, changning district,\nSHANGHAI,CHINA ZIP:200336\nTELL:021-6273-2288",
      eoriNo: '',
      bookingNo: '',
      notifyParty:
        "THE SAME AS ABOVE AND\nUBE (SHANGHAI) LTD.\nROOM 2403#, SHANGHAI INTERNATIONAL TRADE CENTRE,\nYAN'AN WEST ROAD 2201#, CHANGNING DISTRICT, SHANGHAI, CHINA 200336\nCONTACT PERSON : Yang Jie\nTEL : 0021-6273-2288  FAX : 0021-6273-3833\nUSCI:913101157030082793",
      alsoNotify1: '',
      alsoNotify2: '',
      deliverTo: '',
      requirements:
        '*FULL SET OF SURRENDERED B.L\n* No need to issue individual I/P\n*ORIGINAL OF CERTIFICATE OF ANALYSIS AND  ORIGINAL TOGETHER WITH THE PRODUCT\n*Please issue full set Form-E with UEC I/V.\n(please show NET Weight on Form-E)\n*Please check (?)"Third Party invoicing" and add below sentence in Section 7 on Form-E.\nTHIRD-PARTY OPERATOR : UBE ELASTOMER CO. LTD.  ADD : SEAVANS NORTH BUILDING, 1-2-1, SHIBAURA, MINATO-KU, TOKYO JAPAN\n*Please add "PO NO. :BRHN-26-07" in section 10 on Form-E.\n"Please put special label of "Low-smell UBEPOL VCR617" on GPS packaging"\n"SRI Code will be changed to 1239C"\n*ORIGINAL OF CERT. OF NO WOOD PACKING MATERIAL\n*Original of VANNING REPORT(WHEN There are 2 items in one shipment)\n*Original of  CERT of FREE TIME of 14 day\n*HS CODE:4002.20\n*Please send FORM E to USH direclty by courier.\n*Please e-mail ALL docs and  CIF COMMERCIAL IV (between UEC and TSL) by PDF copies to UEC Tokyo.\n*Please note B/L and Form E are color copies',
      note: '',
      note2: '',
      note3: '',
      description: 'SYNTHETIC RUBBER UBEPOL VCR617',
      underDescription: '',
      shippingMark:
        'SHIPPING MARK\nSYNTHETIC RUBBER\nUBEPOL\nVCR617\nMade in Thailand',
      belowSignature: 'UBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- TOYO TYRE MALAISIA ----------------------------------------
    {
      id: 'SIT-TOYO-MALAYSIA',
      shipToId: 'SHIP-TOYO-MALAYSIA',
      attn: 'T.FUJIOKA/SEVP\nTHAI SYNTHETIC RUBBERS\nCO., LTD.',
      from: 'M.KAWAMORI / H.UEDA\nUBE Elastomer Co. Ltd.\nTEL:81-3-5419-6167\nFAX:81-3-5419-6250',
      poNumberHeader: '',
      no2Header: '',
      no2: '',
      materialCodeHeader: '',
      materialCode: '',
      noteUnderMaterial: '',
      user: 'TOYO TYRE MALAISIA',
      country: 'Malaysia',
      shipper: 'TSL WITH FULL ADRESS',
      feederVessel: 'INTERASIA TRIUMPH V.W007',
      motherVessel: '-',
      vesselCompany: 'WANHAI',
      forwarder: 'LEO',
      portOfLoading: 'LAEM CHABANG, THAILAND',
      consignee:
        'Toyo Tyre Malaysia Sdn Bhd\nPT23101, Jalan Tembaga Kuning\nKawasan Perindustrian Kamunting Raya\nPO Box 1,34600, Kamunting, Perak. Malaysia\nContact Person : Ms Lim / Ms Yap\nTel : 605-8206669 Fax : 605-8206659',
      blType: 'SURRENDERED B/L',
      freeTime: 'D/M:14DAYS    D/T:14DAYS * Please apply 14 days Free Time',
      courierAddress: '',
      eoriNo: '',
      bookingNo: '',
      notifyParty: 'SAME AS CONSIGNEE',
      alsoNotify1: '',
      alsoNotify2: '',
      deliverTo: '',
      requirements:
        '*CERTIFICATE OF ANALYSIS\n*PACKING LIST\n*Please discribe MAR161A(TTM MATERIAL CODE) on all delivery documents. (BL,PL,COA)\n*No need to issue individual I/P and COO.\n*Please send Arrival Notice to below e-mail address\nwong_py@toyotires.com.my\nyap_bk@toyotires.com.my\n*Please send all  docs and COMMERCIAL IV (between UEC and TSL) by PDF copies by E-mail to UEC Tokyo.',
      note: '',
      note2: '',
      note3: '',
      description: 'POLYBUTADIENE RUBBER\nUBEPOL VCR617',
      underDescription: '',
      shippingMark:
        'SHIPPING MARK\nTOYO TYRE MALAYSIA PLANT\nMAR161A\nORDER NO.:7800009932-4\nUBEPOL VCR617(TSL?\nC/NO, 1-16\nMADE IN THAILAND',
      belowSignature: 'UBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- HENGDASHENG TOYO TIRE(ZHANGJIAGANG) CO., LTD. ----------------------------------------
    {
      id: 'SIT-HENGDASHENG-TOYO',
      shipToId: 'SHIP-HENGDASHENG-TOYO',
      attn: 'T.FUJIOKA/SEVP\nTHAI SYNTHETIC RUBBERS\nCO., LTD.\nFAX:66-2-685-3056',
      from: 'S.OKUNI/H.UEDA\nUBE Elastomer Co. Ltd.\nTEL:81-3-5419-6167\nFAX:81-3-5419-6250',
      poNumberHeader: 'USH PO No.:',
      no2Header: '',
      no2: '',
      materialCodeHeader: '',
      materialCode: '',
      noteUnderMaterial: '',
      user: '',
      country: '',
      shipper:
        'FULL CONTACT DETAIL OF TSL\nWITH TRADE RESISTRATION NO.\n(no need On Behalf of USH)',
      feederVessel: 'JOSCO LUCKY V.2511N',
      motherVessel: '-',
      vesselCompany: 'TAICANG CONTAINER LINES CO.,LTD',
      forwarder: 'LEO',
      portOfLoading: 'LAEM CHABANG, THAILAND',
      consignee:
        'HENGDASHENG TOYO TIRE(ZHANGJIAGANG) CO., LTD.\n58,DONGHAI ROAD, YANGTZE INTERNATIONAL CHEMICAL\nINDUSTRIAL PARK, ZHANGJIAGANG, JIANGSU, CHINA\nCONTACT PERSON: Lili Yu  E-MAIL: yulili@toyotiresz.com\nTEL?0512-3500-7124 FAX?0512-35007203\nUSCI:91320592553812607A',
      blType: 'SURRENDERED B/L',
      freeTime:
        'D/M:14DAYS       D/T:14DAYS    * Please apply 14 days Free Time',
      courierAddress: '',
      eoriNo: '',
      bookingNo: '',
      notifyParty:
        "THE SAME AS ABOVE AND\nUBE (SHANGHAI) LTD.  ATTN:Yang Jie-san\nRoom 2403#, Shanghai International Trade Centre,\nYan'an West Road 2201#, changning district,\nSHANGHAI,CHINA ZIP:200336\nTELL:021-6273-2288\nUSCI:913101157030082793",
      alsoNotify1: '',
      alsoNotify2: '',
      deliverTo: '',
      requirements:
        '*FULL SET OF SURRENDERED B.L\n*No need to issue individual I/P. (Customer accepted General I/P.)\n*PLEASE MARK HS CODE 4002.20.90 ON BL\n*3 ORIGINAL OF CERTIFICATE OF ANALYSIS and 1 original together with product\n*Please issue full set of Form-E with TSL FOB custom I/V.\n*Please show NET Weight on Form-E\n*NEED "R161"LABEL ON THE PACKING\n*Please issue 3 original of No wood packing material OR IPPC PALLET\n*Pls send PDF copies of all original docs.to UEC(Okuni) by e-mail and send all original docs to UBE shanghai directly.\nexcept commercial CIF invoice to UBE (Courier address of UBE shanghai, please refer to the above)',
      note: '',
      note2: '',
      note3: '',
      description: 'SYNTHETIC RUBBER',
      underDescription: '',
      shippingMark:
        "SHIPPING MARK\nVCR617?TSL?\nBR-TOYO-2503\nC/NO. 1-16\nMADE IN THAILAND\nCONSIGNEE:TOYO TIRE\nR161\nUSH COURIER ADDRESS:ATTN:Yang Jie-san\nUBE (SHANGHAI) LTD.\nRoom 2403#, Shanghai International Trade Centre,\nYan'an West Road 2201#, changning district,\nSHANGHAI,CHINA ZIP:200336\nTELL:021-6273-2288",
      belowSignature: 'UBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- TOYO TIRE NORTH AMERICA ----------------------------------------
    {
      id: 'SIT-TOYO-TIRE-NA',
      shipToId: 'SHIP-TOYO-TIRE-NA',
      attn: 'T.FUJIOKA/SEVP\nTHAI SYNTHETIC RUBBERS CO.,LTD.',
      from: 'S. OKUNI/ D. KAWAMORI\nUBE Elastomer Co. Ltd.\nTEL:81-3-5419-6167\nFAX:81-3-5419-6250',
      poNumberHeader: 'UAI PO NO',
      no2Header: 'TOYO PO',
      no2: '4501239925',
      materialCodeHeader: '',
      materialCode: '',
      noteUnderMaterial: '',
      user: 'TOYO TIRE NORTH AMERICA',
      country: 'U. S. A.',
      shipper: 'TSL WITH FULL ADRESS\nON BEHALF OF UBE AMERICA',
      feederVessel: 'MSC BRIDGEPORT V.GU606W',
      motherVessel: 'ZIM THAILAND V.14E',
      vesselCompany: 'MSC',
      forwarder: 'DIRECT / FOB',
      portOfLoading: 'LAEM CHABANG,THAILAND',
      consignee:
        'TOYO TIRE NORTH AMERICA MANUFACTURING INC.\n3660 Highway 411 NE\nWhite, GA 30184\nATTN:SUSAN WOOD   woods@toyotires.com\nTEL: 678-492-2165',
      blType: '',
      freeTime: '',
      courierAddress: '',
      eoriNo: '',
      bookingNo: '',
      notifyParty:
        'D.J.Powers Company, Inc.\n5000 Business Center Drive, Suite 1000\nSavannah, GA 31405\nTEL:912-790-1927\nATTN: DANETTE PENTECOST\nTOYO.TIRE@DJPOWERS.COM',
      alsoNotify1: 'SAME AS CONSIGNEE',
      alsoNotify2:
        'UBE America Inc.\nTel: +1  (248) 516-4911\n38777 Six Mile Road, Suite 400, Livonia, MI 48152\nE-mail: akiko@ube.com\nE-mail: k.kikuta@ube.com',
      deliverTo:
        'TOYO TIRE NORTH AMERICA MANUFACTURING INC.\n3660 Highway 411 NE\nWhite, GA 30184\nATTN:  SUSAN WOOD',
      requirements:
        '* Full set of Sea Waybill\n* 2/2 ORIGINAL CoA\n*Please show "TOYO ITEM NO.GAR161A"  & "TOYO 4501202829" on all doc.\n*Please send ISF data to UEC and UAI by e-mail at once. When you get it\nUAI people;\nAkiko Hirayama <akiko@ube.com> & Kaori Kikuta <k.kikuta@ube.com>',
      note: '*Please e-mail ALL docs and FOB COMMERCIAL IV (between UEC and TSL)  by PDF copies to UEC Tokyo(Okuni)\n*NO need original courier to UAI and us.',
      note2: '',
      note3: '',
      description: 'POLYBUTADIENE RUBBER',
      underDescription: '',
      shippingMark:
        'SHIPPING MARK\nUBEPOL VCR617\nTOYO PO:4501239925\nNO. 1-28\nMADE IN THAILAND\nTOYO ITEM NO.GAR161A(VCR617)',
      belowSignature: 'UBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- BRIDGESTONE INDIA PRIVATE LIMITED ----------------------------------------
    {
      id: 'SIT-BRIDGESTONE-INDIA',
      shipToId: 'SHIP-BRIDGESTONE-INDIA',
      attn: 'MR.FUJIOKA/SEVP\nTHAI SYNTHETIC RUBBERS\nCO., LTD.\nFAX:66-2-685-3056',
      from: 'W.MIYANAMI\nSYNTHETIC RUBBUR DIV.\nUBE ELASTOMER CO.LTD.\nTEL:81-3-5419-6167',
      poNumberHeader: 'BS INDIA PO No.:',
      no2Header: '',
      no2: '',
      materialCodeHeader: '',
      materialCode: '',
      noteUnderMaterial: '',
      user: 'BRIDGESTONE INDIA PRIVATE LIMITED',
      country: 'INDIA',
      shipper: 'TSL WITH FULL CONTACT DETAILS\nAND RESISTRATION NO.',
      feederVessel: 'xx',
      motherVessel: 'xx',
      vesselCompany: 'xx',
      forwarder: 'xx',
      portOfLoading: '',
      consignee:
        'Bridgestone India Private Limited\nPLOT NO. A-43, PHASE-II, MIDC CHAKAN\nVILLAGE SAWARDARI, TALUKA KHED, DIST. PUNE,\nMAHARASHTRA - 410 501, INDIA\nTEL: +91.2135.672.000\nATTN:\n(prashant-verma@bridgestone.co.in)\nIEC NO. 0396013341\nGSTIN Number 27AABCB2304E1ZD',
      blType: '',
      freeTime: 'D/M : 14 DAYS, D/T : 14 DAYS',
      courierAddress:
        'Bridgestone India Private Limited\nPLOT NO. A-43, PHASE-II, MIDC CHAKAN\nVILLAGE SAWARDARI, TALUKA KHED, DIST. PUNE,\nMAHARASHTRA - 410 501, INDIA\nTEL         : +91 2135 672166,+91 2135672000\nATTN:Ms. Neha Latare/Mr. Sagar Gujarathi/Mr.Sandeep Gallani',
      eoriNo: '',
      bookingNo: '',
      notifyParty:
        'Bridgestone India Private Limited\nPLOT NO. A-43, PHASE-II, MIDC CHAKAN\nVILLAGE SAWARDARI, TALUKA KHED, DIST. PUNE,\nMAHARASHTRA - 410 501, INDIA\nAttn: Prashant Verma\n(prashant-verma@bridgestone.co.in)\nTel: +91.2135.672.174\nPAN Number (Permanent Account Number) of\nnotify party address.:-  "AABCB2304E "',
      alsoNotify1: '',
      alsoNotify2: '',
      deliverTo: '',
      requirements:
        '*Full set of Surrendered MASTER B/L(NOT FORWARDER BL)\nIMPORTANT!! ? *PLS MARK "FREE TIME: 14 DAYS FREE DETENTION AT NHAVA SHEVA.\n*HS CODE:\n*PAN Number (Permanent Account Number) of notify party address.:-  "AABCB2304E " ON BL\n* 2 original of Certificate of Origin Form-AI with TSL FOB customs Invoice.\nNEW!!?*Please issue 1 ORIGINAL FORM I (section III) with Manufacturing process outline\nWhenever there is change in Manufacturing process, please inform us along with necessary documents.\n* 3 original of Certificate of Analysis marked BS material code (TC 50)and PO number\nissued by manufacturer\n* 2 original of Declaration of non coniferous wood packing materials issued by manufacturer\n*please send us the draft of ONLY B/L before issue the original\n*Det at Nhava must be 14 days as we cofirmed',
      note: '*Please send all original docs. to BS INDIA direclty except CIF COMMERCIAL IV (between UBE and TSL) by courier.\n(FOR COURIER ADDRESS, PLEASE REFER AS FOLLOWS(SI/ PAGE 2)\n*Please send ALL docs. PDF copies by E-mail to UBE Tokyo(Matsumoto) /NO need original courier to us.',
      note2: '',
      note3: '',
      description: 'TC 50\nPOLY BUTADIENE\nRUBBER  UBEPOL BR150L',
      underDescription: '',
      shippingMark:
        "SHIPPING MARK\nBRIDGESTONE INDIA PRIVATE LIMITED\nTRADE NAME:UBEPOL BR150L\nTC50/BSID/4500077118\nINVOICE NO./4500077118\nMANUFACTURE'S NAME\nTHAI SYNTHETIC RUBBERS CO., LTD.\nLOT.NO:\nGROSS WT.  ---Please advise\nNET WT. 2,100\nMADE IN THAILAND",
      belowSignature: 'UBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- BRIDGESTONE SA (PTY) LTD ----------------------------------------
    {
      id: 'SIT-BRIDGESTONE-SA',
      shipToId: 'SHIP-BRIDGESTONE-SA',
      attn: 'T. Fujioka/SEVP\nTHAI SYNTHETIC RUBBERS\nCO., LTD.',
      from: 'D.KAWAMORI/UEDA\nUBE Elastomer Co. Ltd.\nTEL:81-3-5419-6167\nFAX:81-3-5419-6250',
      poNumberHeader: 'BFAFRICA PO No.:',
      no2Header: '',
      no2: '',
      materialCodeHeader: '',
      materialCode: '',
      noteUnderMaterial: '',
      user: 'BRIDGESTONE SOUTH AFRICA',
      country: 'AFRICA',
      shipper: 'TSL ON BEHALF OF UBE Elastomer Co. Ltd.',
      feederVessel: 'xx',
      motherVessel: 'xx',
      vesselCompany: 'xx',
      forwarder: 'xx',
      portOfLoading: '',
      consignee:
        'BRIDGESTONE SA (PTY) LTD\n189 GRAHAMSTOWN ROAD\nDEAL PARTY, PORT ELIZABETH, 6001, SOUTH AFRICA',
      blType: '',
      freeTime: '',
      courierAddress: '',
      eoriNo: '',
      bookingNo: '',
      notifyParty:
        'ATTN:SHIPPING DEPT\nBRIDGESTONE SA (PTY) LTD\nEmail: bsaf.imports@bridgestone.co.za',
      alsoNotify1: '',
      alsoNotify2: '',
      deliverTo: '',
      requirements:
        '*You don\'t need to send original doc.by courier. Only PDF copies are OK.\n*SURRENDERED BL IS REQUIRED.\n* Pls mark BS material code "HB12" and " PO NO. 4501193944" on all document\n* 3 COPY OF CERTIFICATE OF ANALYSIS\n*PACKING LIST MUST SHOW GROSS,TARE,AND NET WEIGHT\n* CoA IS REQUIRED PRIOR, PLEASE SEND US THE PDF AS SSON AS POSSIBLE.\n* BRIDGESTONE CODE OF  "HB12"SHOULD BE MARKED ON ALL BAGS, DRUMS,CONTAINERS',
      note: '',
      note2: '',
      note3: '',
      description: 'POLYBUTADIENE RUBBER\nHB12 / UBEPOL VCR412',
      underDescription: '',
      shippingMark:
        'SHIPPING MARK\nBRIDGESTONE S.A. PTY\nPORT ELIZABETH\nORDER NO.4501193944\nHB12(UBEPOL VCR412)\nC/S NO.1-UP\nMADE IN THAILAND',
      belowSignature: 'UBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- BRISA BRIDGESTONE SABANCI LASTIKSANAYI VE TICARET A.S. ----------------------------------------
    {
      id: 'SIT-BRISA-TURKEY',
      shipToId: 'SHIP-BRISA-TURKEY',
      attn: 'MR.T. Fujioka /SEVP\nTHAI SYNTHETIC RUBBERS\nCO., LTD.',
      from: 'KAWAMORI/UEDA\nUBE Elastomer Co. Ltd.\nTEL:81-3-5419-6167\nFAX:81-3-5419-6250',
      poNumberHeader: 'BRISA BRIDGESTONE  PO No.:',
      no2Header: '',
      no2: '',
      materialCodeHeader: '',
      materialCode: '',
      noteUnderMaterial: '',
      user: 'BRISA BRIDGESTONE SABANCI\nLASTIK SANAYI VE TICARET A.S.',
      country: 'TURKEY',
      shipper: 'TSL ON BE HALF OF UEC',
      feederVessel: '',
      motherVessel: '',
      vesselCompany: '',
      forwarder: '',
      portOfLoading: '',
      consignee:
        'CONSIGNEE;\nBRISA BRIDGESTONE SABANCI LASTIK SANAYI VE TICARET A.S.\nAlikahya Fatih Mah.Sanayi Cad.No:98\n41310 ?zmit / KOCAEL? Turkey\nContact Person : BURCU YUZUAK\nPhone : +90 (262) 316 57 53\nE-Mail ?b.yuzuak@brisa.com.tr',
      blType: '',
      freeTime: '',
      courierAddress: '',
      eoriNo: '',
      bookingNo: '',
      notifyParty: 'SAME AS CONSIGNEE',
      alsoNotify1: '',
      alsoNotify2: '',
      deliverTo: '',
      requirements:
        '* FULL SET OF SEA WAY BILL\n* FULL SET OF CERT. OF ORIGIN BY MANUFACTURE\n* 3 ORIGINAL OF CERTIFICATE OF ANALYSIS,\n* PLEAE SHOW PRODUCTION DATE AND TEST DATE ON COA\n* PLEASE SHOW - Material code AND ID on all Doc.\n* Please label BS code no." HB12 " on each box.(4 side)',
      note: '',
      note2: '',
      note3: '',
      description: 'POLYBUTADIENE RUBBER\nHB12 / UBEPOL VCR412',
      underDescription: '',
      shippingMark:
        'SHIPPING MARK\nBRISA /TURKEY\nMaterila code:HB12\nID: HB12-B\nMADE IN THAILAND\nTHAI SYNTHETIC RUBBERS CO.,LTD\nPRODUCTION DATE:',
      belowSignature: 'UBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- BRIDGESTONE FIRESTONE NT WILSON PLANT ----------------------------------------
    {
      id: 'SIT-BRIDGESTONE-FIRESTONE-WILSON',
      shipToId: 'SHIP-BRIDGESTONE-FIRESTONE-WILSON',
      attn: 'T. Fujioka/SEVP\nTHAI SYNTHETIC RUBBERS\nCO., LTD.',
      from: 'D.KAWAMORI/UEDA\nUBE Elastomer Co. Ltd.\nTEL:81-3-5419-6167\nFAX:81-3-5419-6250',
      poNumberHeader: 'BFS WILSON PO No.:',
      no2Header: '',
      no2: '',
      materialCodeHeader: '',
      materialCode: '',
      noteUnderMaterial: '',
      user: 'BRIDGESTONE FIRESTONE NT\nWILSON PLANT',
      country: 'WILSON   USA',
      shipper: 'TSL',
      feederVessel: '',
      motherVessel: '',
      vesselCompany: '',
      forwarder: '',
      portOfLoading: '',
      consignee:
        'Bridgestone Firestone NT  Wilson Plant\nTriangle East Storage 2010 Baldree Road Wilson NC27893  USA\nTEL: 252-246-7630\nATTN: Jeff Pyle\npylejeff@bfusa.com\nSpurlinlee@bfusa.com',
      blType: '',
      freeTime: '',
      courierAddress: '',
      eoriNo: '',
      bookingNo: '',
      notifyParty: 'SAME AS CONSIGNEE',
      alsoNotify1:
        'V Alexander and Co., Inc.\n22 Century Blvd # 510\nNashville, TN 37214\nE-mail: BRIDGESTONE@VALEXANDER.COM\nPhone: 615-885-0020',
      alsoNotify2: '',
      deliverTo: '',
      requirements:
        '!! New INSTRUCTION,!! YOU don\'t need to send us the oirignal docs, only PDF copies by e-mail are ok.\n*A non-negotiable " Waybill\n* Pls mark BS material code "TC030" and " PO NO4900235021LINE ITEM 00010 " on all document\n* CERTIFICATE OF ANALYSIS, CERTIFICATE OF COMPLIANCE AND PACKING LIST MUST BE\nATTACHED ON CONTAINER(MANUFACTURE DATE SHOULD BE ON CoA)\n*PACKING LIST MUST SHOW GROSS,TARE,AND NET WEIGHT\n*ALL CONTAINERS (INCLUDING INDIVIDUAL BAGS, BOXES) OF MATERIALS MUST BE MARKED\nWITH THE  CHEMICAL AND /OR TRADENAME THAT APPEARS ON THE PRODUCT\'S MSDS\n*WEIGHT IN NO LESS THAN ONE INCH(PREFERABLY 2 INCH)LETTERS\n*Certificate of Origin issued by manufacturer\n*Declaration of non coniferous wood packing materials',
      note: '',
      note2: '',
      note3: '',
      description: 'POLYBUTADIENE RUBBER\nTC030 / UBEPOL VCR412',
      underDescription: '',
      shippingMark:
        'SHIPPING MARK\nBRIDGESTONE AMERICAS, INC.\nBFS WILSON\nORDER NO. 4900235021\nTC030/UBEPOL VCR412\nC/NO.1 -14\n17,640kg\nMADE IN THAILAND',
      belowSignature: 'UBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- BRIDGESTONE (WUXI) TIRE CO., LTD. ----------------------------------------
    {
      id: 'SIT-BRIDGESTONE-WUXI',
      shipToId: 'SHIP-BRIDGESTONE-WUXI',
      attn: 'MR.T. Fujioka /SEVP\nTHAI SYNTHETIC RUBBERS\nCO., LTD.',
      from: 'KAWAMORI/UEDA\nUBE Elastomer Co. Ltd.\nTEL:81-3-5419-6167\nFAX:81-3-5419-6250',
      poNumberHeader: 'BS WUXI PO No.:',
      no2Header: '',
      no2: '',
      materialCodeHeader: '',
      materialCode: '',
      noteUnderMaterial: '',
      user: 'BRIDGESTONE WUXI TIRE',
      country: 'FULL CONTACT DETAIL OF TSL',
      shipper: 'WITH TRADE RESISTRATION NO.',
      feederVessel: '',
      motherVessel: '',
      vesselCompany: '',
      forwarder: '',
      portOfLoading: '',
      consignee:
        'BRIDGESTONE (WUXI) TIRE CO.,LTD.\nNo.67, XINMEI ROAD,WUXI NATIONAL HIGH-NEW\nTECHNICAL INDUSTRIAL DEVELOPMENT\nZONE, WUXI 214028, JIANGSU, CHINA\nFAX:86-0510-8532-2199\nTEL:86-0510-8532-2288\nxiaoqi.ding@bridgestone.com\nhuiyun.chen@bridgestone.com\nUSCI:913202147462278772.',
      blType: '',
      freeTime: '',
      courierAddress: '',
      eoriNo: '',
      bookingNo: '',
      notifyParty: 'SAME AS CONSIGNEE',
      alsoNotify1:
        'Please send Arrival Notice by e-mail to\nXiaoqi Ding (xiaoqi.ding@bridgestone.com)\nChen Huiyun(huiyun.chen@bridgestone.com)',
      alsoNotify2: '',
      deliverTo: '',
      requirements:
        '*FULL SET OF SURRENDERE B/L\n* Pls mark BS material code "TC30"ON ALL DOCS.\n*3 ORIGINAL OF CERTIFICATE OF ANALYSIS & 1 ORIGINAL CoA TOGETHER WITH PRODUCT\n*3 ORIGINAL OF  NO WOOD PACKING OR IPPC CERT.\n* PACKING LIST MUST SHOW GROSS,TARE,AND NET WEIGHT\n* BRIDGESTONE CODE OF  "TC30"SHOULD BE MARKED ON ALL BAGS, DRUMS,CONTAINERS\n*PLEASE ISSUE FULL SET OF FORM-E WITH UBE INVOICE\n*TSL FOB CUSTOM I/V for Form-E\n*No need to issue individual I/P\n*Please send Arrival Notice by e-mail to Xiaoqi Ding (xiaoqi.ding@bridgestone.com)\n*CIF COMMERCIAL IV(BETWEEN TSL AND UEC)\n*Please label BS code no." TC30 or TC50 " on each box.(4 side)',
      note: "*Don't  need to send all original docs to BS WUXI directly by courier including 1 original COMMERCIAL CIF I/V(I/V between TSL and UEC)\n*Please send ALL docs by PDF copies by E-mail to UEC /NO need original courier to UEC also.",
      note2: '',
      note3: '',
      description: 'POLYBUTADIENE RUBBER\nTC30 / UBEPOL VCR412',
      underDescription: '',
      shippingMark:
        'SHIPPING MARK\nBRIDGESTONE (WUXI) TIRE CO.,LTD.\nORDER NO.:4500471133\nTC30 (UBEPOL VCR412)\nC/S NO.1-16\nMADE IN THAILAND',
      belowSignature: 'UBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- P.T. BRIDGESTONE TIRE INDONESIA ----------------------------------------
    {
      id: 'SIT-BRIDGESTONE-INDONESIA',
      shipToId: 'SHIP-PT-BRIDGESTONE',
      attn: 'MR.FUJIOKA\nTHAI SYNTHETIC RUBBERS\nCO., LTD.\nFAX:66-2-685-3056',
      from: 'Miyanami\nUBE Elastomer Co.Ltd.\nTEL:81-3-5419-6167\nFAX:81-3-5419-6250',
      poNumberHeader: 'CO NUMBER:',
      no2Header: '',
      no2: '',
      materialCodeHeader: '',
      materialCode: '',
      noteUnderMaterial: '',
      user: 'BS INDONESIA',
      country: 'INDONESIA',
      shipper: 'TSL',
      feederVessel: '',
      motherVessel: '',
      vesselCompany: '',
      forwarder: '',
      portOfLoading: '',
      consignee: 'PT. BRIDGESTONE TIRE INDONESIA',
      blType: '',
      freeTime: '',
      courierAddress:
        'PT Bridgestone Tire Indonesia -  Karawang Plant\nKawasan Industri Surya Cipta Jl. Surya Utama Kav 8 – 13,\nKutamekar, Ciampel, Kab. Karawang, Jawa Barat, 41363\nTel: (+62-267) 440 201\nAttn. Mr. Bayu Nasti',
      eoriNo: '',
      bookingNo: '',
      notifyParty: 'Kawasan Industri Surya Cipta Jl. Surya Utama Kav 8 – 13,',
      alsoNotify1:
        'Kutamekar, Ciampel, Kab. Karawang, Jawa Barat, 41363\nNPWP No.(TAX ID No.) 0010 0011 8809 2000',
      alsoNotify2: '',
      deliverTo: '',
      requirements:
        '*please extend the free time as long as possible.\n* Surrenderd B/L(MASTER BL)\n* Pls mark  CO NUMBER: F2602-TSL-2 on all document\n* 3 ORIGINAL OF CERTIFICATE OF ANALYSIS,\n* PACKING LIST MUST SHOW GROSS,TARE,AND NET WEIGHT\n* Insurance Policy: *110%*CONTRACT PRICE\n*PLEASE ISSUE THE FORM-D WITH UEC INVOICE\nAND   Check ( ?) "Retroactively" is only if GAP the BL date and\nForm D date is more than 3 days.\nPlease kindly send to CONSIGNEE the announcement from shipping line if the BL already surrendered.\n*Please label BS code no." TC50 " on each box.(4 side)\n*HS code DOC4002.20.1000 ON ALL DOCS.\n*Pls send us all docs. PDF copy by e-mail as soon as you get all original docs.before courier\n*Pls send all documents copy to UEC by email\nNo need original courier.\n*PLEASE ARRANGE THIS FREE TIME 21 DAYS COMBINED.\n*PLEASE SHOW FREE TIME ON BL.',
      note: '',
      note2: '',
      note3: '',
      description:
        'SYNTHETIC RUBBER\n/ UBEPOL BR150L(TC50)\nCO NUMBER :F2602-TSL-2',
      underDescription: '',
      shippingMark:
        'SHIPPING MARK\nBRIDGESTONE INDONESIA\nCO NUMBER :F2602-TSL-2\nTC50/BR150L\nC/NO.1-32\nMADE IN THAILAND',
      belowSignature: 'Ube Elastomer Co.Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- BRIDGESTONE TAIWAN CO., LTD. ----------------------------------------
    {
      id: 'SIT-BRIDGESTONE-TAIWAN',
      shipToId: 'SHIP-BRIDGESTONE-TAIWAN',
      attn: 'MR.T. Fujioka /SEVP\nTHAI SYNTHETIC RUBBERS\nCO., LTD.',
      from: 'KAWAMORI/UEDA\nUBE Elastomer Co. Ltd.\nTEL:81-3-5419-6167\nFAX:81-3-5419-6250',
      poNumberHeader: 'BS TAIWAN PO NO.',
      no2Header: '',
      no2: '',
      materialCodeHeader: '',
      materialCode: '',
      noteUnderMaterial: '',
      user: 'BRIDGESTONE TAIWAN CO.,LTD.\nNO.1, CHUANG CHING ROAD,\nHSIN CHU IND.ZONE, TAIWAN.\nPHONE:886-35-981621',
      country: 'TAIWAN',
      shipper: 'TSL',
      feederVessel: '',
      motherVessel: '',
      vesselCompany: '',
      forwarder: '',
      portOfLoading: '',
      consignee:
        'BRIDGESTONE TAIWAN CO.,LTD.\nNo.1-1, Wenhua RD., Hsinchu Industrial Park\nHukou Township, Hsinchu County 30352, Taiwan\nPHONE:866-3-598-1621\nMavis Chou (Ms.)\nmavis.chou@bridgestone.com',
      blType: '',
      freeTime: '',
      courierAddress: '',
      eoriNo: '',
      bookingNo: '',
      notifyParty: 'SAME AS CONSIGNEE',
      alsoNotify1: '',
      alsoNotify2: '',
      deliverTo: '',
      requirements:
        '*surrendered  B/L\n*1 SET OF CoA\n*1 SET OF MSDS\n*PLEASE PUT THE NAME OF BSFC CODE NO.OF TC 30 or TC50 ON 4 sides of Metal box.\n*PLEASE TAKE the picture of packing outward appearance of 200008199 before you export.\n*General Insurance policy is accepted.',
      note: "*You don't need to send all original docs. to BS TAIWAN(ABOVE ADDRESS) direclty by courier. << CHANGE!\n*Please send ALL docs. PDF copies by E-mail to UBE Tokyo/NO need original coueirer.\n1.     Please label BS code no. TC30 or TC50 at front and both\nsides of each your steel box.\n2.     Please make the figure size of BS code no. as following",
      note2: '',
      note3: '',
      description: 'SYNTHETIC RUBBER\nTC30 UBEPOL  VCR412',
      underDescription: '',
      shippingMark:
        "SHIPPING MARK\nBSFC P,O. NO:200008199\nVCR412/TC30\nCASE NO.:1-12\nN/W  :  15,120KG\nG/W  :  16,707.6KG\nMAKER'S NAMETHAI SYNTHETIC RUBBERS CO, LTD\nCOUTRY OF ORIGIN:THAILAND",
      belowSignature: 'UBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // -- BRIDGESTONE DE MEXICO, S.A. DE C.V. ----------------------------------------
    {
      id: 'SIT-BRIDGESTONE-MEXICO',
      shipToId: 'SHIP-BRIDGESTONE-MEXICO',
      attn: 'T.FUJIOKA/SEVP\nTHAI SYNTHETIC RUBBERS CO., LTD.\nFAX:66-2-685-3056',
      from: 'W. MIYANAMI\nUBE Elastomer Co. Ltd.\nTEL:81-3-5419-6167\nFAX:81-3-5419-6250',
      poNumberHeader: '',
      no2Header: '',
      no2: '',
      materialCodeHeader: '',
      materialCode: '',
      noteUnderMaterial: '',
      user: 'BS MEXICO',
      country: 'MEXICO',
      shipper: 'TSL WITH FULL ADDRESS',
      feederVessel: '',
      motherVessel: '',
      vesselCompany: '',
      forwarder: '',
      portOfLoading: '',
      consignee:
        'Bridgestone de México S.A. de C.V.\nJuan Vazquez de Mella 481 4°piso - Col Los Morales, Polanco\nTel. (52 55) 5626-6600\nRFC: BFM910826TW6\nATTN:Nathalia Zonzini',
      blType: '',
      freeTime: '21 days COMBINED DET AND DEM',
      courierAddress: '',
      eoriNo: '',
      bookingNo: '',
      notifyParty: 'SAME AS CCONSIGNEE',
      alsoNotify1: '',
      alsoNotify2: '',
      deliverTo: '',
      requirements:
        '*Full set SEA WAY BILL REQUIRED\n*PLS show the following words on all docs.on all DOCs.\n"TC030" "UBE Elastomer Co. Ltd."\n*CERTIFICATE OF ANALYSIS including SPECIFICATION AND QUALITY RANGE\n*CERTIFICATE OF ORIGIN BY TSL MANUFACTURE AND SHOW HS CODE 4002.20.01\n*Box IV of GPS ($50/box)\n*21 DAYS FREE TIME ( WE CONFIRMED THIS)\n*FULL SET OF I/P WITH COVERING ALL RISK',
      note: '*Please send all original docs. to BSMX direclty except CIF COMMERCIAL IV (between UEC and TSL) by courier.\n*Please send ALL docs. PDF copies by E-mail to UBE Tokyo/NO need original courier to us.',
      note2: '',
      note3: '',
      description: 'POLYBUTADIEN RUBBER',
      underDescription: '',
      shippingMark:
        'SHIPPING MARK\nBridgestone Mexico,\nSHIP TO :MEXICO\nORDER NO.:4200036311\nITEM CODE: TC030\nMADE IN THAILAND\nPRODUCER:THAI SYNTHETIC RUBBER',
      belowSignature: 'UBE Elastomer Co. Ltd.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    }
  ] as SiTemplate[]
};

const SEED_TIMESTAMP = '2026-01-01T00:00:00.000Z';

const mergeById = <T extends { id: string }>(
  base: T[],
  persisted: T[] | undefined
) => {
  const map = new Map(base.map((item) => [item.id, item]));
  if (Array.isArray(persisted)) {
    persisted.forEach((item) => {
      const current = map.get(item.id);
      if (!current) {
        map.set(item.id, item);
        return;
      }
      // If the persisted entry was never user-edited (updatedAt still equals the
      // original seed timestamp), always prefer the current seed so that updated
      // seed data (e.g. newly added multi-line fields) is not blocked by stale
      // localStorage values.
      const persistedUpdatedAt = (item as Record<string, unknown>)['updatedAt'];
      if (persistedUpdatedAt === SEED_TIMESTAMP) {
        // Keep seed (current) as-is — user never modified this entry
        return;
      }
      // User has edited this entry: merge field-by-field, persisted wins on
      // non-empty values so user edits are preserved.
      const merged: Record<string, unknown> = { ...current };
      for (const key in item) {
        const v = (item as Record<string, unknown>)[key];
        if (v !== '' && v !== null && v !== undefined) {
          merged[key] = v;
        }
      }
      map.set(item.id, merged as T);
    });
  }
  return Array.from(map.values());
};

const getInitialDataState = () => {
  return {
    theme: 'light' as const,
    currentUser: null as User | null,
    users: [...INITIAL_USERS],
    companies: [...INITIAL_COMPANIES],
    orders: [] as Order[],
    integrationLogs: [] as IntegrationLog[],
    masterData: {
      groupSaleTypes: [...INITIAL_MASTER.groupSaleTypes],
      destinations: [...INITIAL_MASTER.destinations],
      terms: [...INITIAL_MASTER.terms],
      grades: [...INITIAL_MASTER.grades],
      shipTos: [...INITIAL_MASTER.shipTos],
      poTemplates: [...INITIAL_MASTER.poTemplates],
      siTemplates: [...INITIAL_MASTER.siTemplates]
    },
    linePermissionMatrix: clonePermissionMatrix(INITIAL_LINE_PERMISSION_MATRIX),
    linePermissionLocked: false,
    linePermissionCustomPresets: [] as LinePermissionNamedPreset[],
    notifications: [] as NotificationLog[],
    activities: [] as ActivityLog[]
  };
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...getInitialDataState(),

      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      login: (username, password) => {
        const user = get().users.find((u) => u.username === username);
        if (user) {
          set({ currentUser: user });
          get().addActivity('Login', user.username, 'User logged into system');
          get().runScheduledChecks();
          return true;
        }
        return false;
      },

      logout: () => {
        const user = get().currentUser;
        if (user) get().addActivity('Logout', user.username, 'User logged out');
        set({ currentUser: null });
      },

      addOrder: (order) => {
        const now = new Date().toISOString();
        const orderWithTimestamps = {
          ...order,
          status: deriveOrderProgressStatus(order.items),
          createdAt: now,
          updatedAt: now
        };
        set((state) => ({ orders: [orderWithTimestamps, ...state.orders] }));
        get().addActivity(
          'Create Order',
          order.createdBy,
          `Order ${order.orderNo} created`
        );
      },

      updateOrder: (orderNo, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          orders: state.orders.map((o) =>
            o.orderNo === orderNo
              ? {
                  ...o,
                  ...updates,
                  status: deriveOrderProgressStatus(updates.items || o.items),
                  updatedAt: now,
                  updatedBy: get().currentUser?.username || o.updatedBy
                }
              : o
          )
        }));
        get().addActivity(
          'Update Order',
          get().currentUser?.username || 'system',
          `Order ${orderNo} updated`
        );
      },

      deleteOrder: (orderNo) => {
        set((state) => ({
          orders: state.orders.filter((o) => o.orderNo !== orderNo)
        }));
        get().addActivity(
          'Delete Order',
          get().currentUser?.username || 'system',
          `Order ${orderNo} deleted`
        );
      },

      addNotification: (message, role, type = 'system') => {
        const id = Math.random().toString(36).substr(2, 9);
        set((state) => ({
          notifications: [
            { id, message, timestamp: new Date().toISOString(), role, type },
            ...state.notifications
          ]
        }));
      },

      addActivity: (action, user, details) => {
        const id = Math.random().toString(36).substr(2, 9);
        set((state) => ({
          activities: [
            { id, action, user, timestamp: new Date().toISOString(), details },
            ...state.activities
          ]
        }));
      },

      addIntegrationLog: (log) => {
        const id = Math.random().toString(36).substr(2, 9);
        set((state) => ({
          integrationLogs: [
            { ...log, id, timestamp: new Date().toISOString() },
            ...state.integrationLogs
          ]
        }));
      },

      updateMasterData: (type, data) => {
        set((state) => ({
          masterData: { ...state.masterData, [type]: data }
        }));
      },

      updateShipTos: (data) => {
        set((state) => ({
          masterData: { ...state.masterData, shipTos: data }
        }));
      },

      updateGroupSaleTypes: (data) => {
        set((state) => ({
          masterData: { ...state.masterData, groupSaleTypes: data }
        }));
      },

      updateCompanies: (data) => {
        set({ companies: data });
      },

      addPoTemplate: (template) => {
        const now = new Date().toISOString();
        const id =
          'POT-' + Math.random().toString(36).slice(2, 8).toUpperCase();
        const newTemplate: PoTemplate = {
          ...template,
          id,
          createdAt: now,
          updatedAt: now
        };
        set((state) => ({
          masterData: {
            ...state.masterData,
            poTemplates: [...state.masterData.poTemplates, newTemplate]
          }
        }));
      },

      updatePoTemplate: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          masterData: {
            ...state.masterData,
            poTemplates: state.masterData.poTemplates.map((t) =>
              t.id === id ? { ...t, ...updates, updatedAt: now } : t
            )
          }
        }));
      },

      removePoTemplate: (id) => {
        set((state) => ({
          masterData: {
            ...state.masterData,
            poTemplates: state.masterData.poTemplates.filter((t) => t.id !== id)
          }
        }));
      },

      addSiTemplate: (template) => {
        const now = new Date().toISOString();
        const id =
          'SIT-' + Math.random().toString(36).slice(2, 8).toUpperCase();
        const newTemplate: SiTemplate = {
          ...template,
          id,
          createdAt: now,
          updatedAt: now
        };
        set((state) => ({
          masterData: {
            ...state.masterData,
            siTemplates: [...state.masterData.siTemplates, newTemplate]
          }
        }));
      },

      updateSiTemplate: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          masterData: {
            ...state.masterData,
            siTemplates: state.masterData.siTemplates.map((t) =>
              t.id === id ? { ...t, ...updates, updatedAt: now } : t
            )
          }
        }));
      },

      removeSiTemplate: (id) => {
        set((state) => ({
          masterData: {
            ...state.masterData,
            siTemplates: state.masterData.siTemplates.filter((t) => t.id !== id)
          }
        }));
      },

      updateUserPermissions: (userId, perms) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId ? { ...u, allowedDocumentTypes: perms } : u
          )
        }));
      },

      addUser: (user) => {
        const id = 'u' + Math.random().toString(36).substr(2, 9);
        const newUser: User = { ...user, id };
        set((state) => ({ users: [...state.users, newUser] }));
        get().addActivity(
          'Create User',
          get().currentUser?.username || 'Admin',
          `User ${user.username} created with role ${user.role}`
        );
      },

      deleteUser: (userId) => {
        const targetUser = get().users.find((user) => user.id === userId);
        if (!targetUser) return;

        set((state) => ({
          users: state.users.filter((user) => user.id !== userId),
          currentUser:
            state.currentUser?.id === userId ? null : state.currentUser
        }));

        get().addActivity(
          'Delete User',
          get().currentUser?.username || 'Admin',
          `User ${targetUser.username} deleted`
        );
      },

      updateUser: (userId, updates) => {
        set((state) => ({
          users: state.users.map((user) =>
            user.id === userId ? { ...user, ...updates } : user
          )
        }));
      },

      updateLinePermission: (action, updates) => {
        if (get().linePermissionLocked) return;
        set((state) => ({
          linePermissionMatrix: state.linePermissionMatrix.map((permission) =>
            permission.action === action
              ? { ...permission, ...updates, action }
              : permission
          )
        }));
      },

      setLinePermissionLocked: (locked) => {
        set({ linePermissionLocked: locked });
      },

      saveLinePermissionCustomPreset: (name) => {
        const trimmedName = name.trim();
        if (!trimmedName) return false;

        const exists = get().linePermissionCustomPresets.some(
          (preset) => preset.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (exists) return false;

        const id = 'lp-' + Math.random().toString(36).substr(2, 9);
        set((state) => ({
          linePermissionCustomPresets: [
            {
              id,
              name: trimmedName,
              matrix: clonePermissionMatrix(state.linePermissionMatrix)
            },
            ...state.linePermissionCustomPresets
          ]
        }));

        return true;
      },

      applyLinePermissionCustomPreset: (presetId) => {
        const preset = get().linePermissionCustomPresets.find(
          (item) => item.id === presetId
        );
        if (!preset) return false;

        set({ linePermissionMatrix: clonePermissionMatrix(preset.matrix) });
        return true;
      },

      deleteLinePermissionCustomPreset: (presetId) => {
        set((state) => ({
          linePermissionCustomPresets: state.linePermissionCustomPresets.filter(
            (item) => item.id !== presetId
          )
        }));
      },

      resetLinePermissionMatrix: () => {
        set({
          linePermissionMatrix: clonePermissionMatrix(
            createStandardLinePermissionMatrix()
          )
        });
      },

      applyLinePermissionPreset: (preset) => {
        set({
          linePermissionMatrix: clonePermissionMatrix(
            preset === 'STRICT'
              ? createStrictLinePermissionMatrix()
              : createStandardLinePermissionMatrix()
          )
        });
      },

      runScheduledChecks: () => {
        const { orders, addNotification, addActivity } = get();
        const now = new Date();
        const thirtyDaysFromNow = new Date(
          now.getTime() + 30 * 24 * 60 * 60 * 1000
        );

        let urgentCount = 0;
        orders.forEach((order) => {
          const hasUrgentETA = order.items.some((item) => {
            if (item.status !== OrderLineStatus.APPROVED) return false;
            if (!item.asap) return false;
            const eta = new Date(item.requestETA);
            return eta >= now && eta <= thirtyDaysFromNow;
          });

          if (hasUrgentETA) {
            urgentCount++;
            addNotification(
              `URGENT: Order ${order.orderNo} has ASAP items with ETA within 30 days. Vessel scheduling required immediately.`,
              Role.CS,
              'email'
            );
            addActivity(
              'Scheduled Alert',
              'System',
              `Sent urgent CS notification for ${order.orderNo} (ASAP ETA within 30 days)`
            );
          }
        });

        if (urgentCount > 0) {
          console.log(
            `[Scheduler] Sent ${urgentCount} urgent notifications to CS`
          );
        }
      },

      resetStore: () => {
        set(getInitialDataState());
      },

      clearTransactionalData: () => {
        set({
          currentUser: null,
          orders: [],
          integrationLogs: [],
          notifications: [],
          activities: []
        });
      }
    }),
    {
      name: 'ube-portal-storage-v5',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AppState> | undefined;
        const persistedMaster = persisted?.masterData;
        const safeShipTos = mergeById(
          currentState.masterData.shipTos,
          Array.isArray(persistedMaster?.shipTos)
            ? persistedMaster.shipTos
            : undefined
        );
        const safeGroupSaleTypes = mergeById(
          currentState.masterData.groupSaleTypes,
          Array.isArray(persistedMaster?.groupSaleTypes)
            ? persistedMaster.groupSaleTypes
            : undefined
        );
        const safePoTemplates = mergeById(
          currentState.masterData.poTemplates,
          Array.isArray(persistedMaster?.poTemplates)
            ? persistedMaster.poTemplates
            : undefined
        );
        const safeSiTemplates = mergeById(
          currentState.masterData.siTemplates,
          Array.isArray(persistedMaster?.siTemplates)
            ? persistedMaster.siTemplates
            : undefined
        );
        const safeCompanies = mergeById(
          currentState.companies,
          Array.isArray(persisted?.companies)
            ? (persisted.companies as CustomerCompany[])
            : undefined
        );
        const safeUsers = mergeById(
          currentState.users,
          Array.isArray(persisted?.users)
            ? (persisted.users as User[])
            : undefined
        );

        return {
          ...currentState,
          ...persisted,
          users: safeUsers,
          companies: safeCompanies,
          linePermissionLocked:
            typeof persisted?.linePermissionLocked === 'boolean'
              ? persisted.linePermissionLocked
              : currentState.linePermissionLocked,
          linePermissionCustomPresets: Array.isArray(
            persisted?.linePermissionCustomPresets
          )
            ? persisted.linePermissionCustomPresets.map((preset) => ({
                ...preset,
                matrix: clonePermissionMatrix(preset.matrix || [])
              }))
            : currentState.linePermissionCustomPresets,
          linePermissionMatrix: Array.isArray(persisted?.linePermissionMatrix)
            ? clonePermissionMatrix(persisted.linePermissionMatrix)
            : clonePermissionMatrix(currentState.linePermissionMatrix),
          masterData: {
            ...currentState.masterData,
            ...(persistedMaster || {}),
            groupSaleTypes: safeGroupSaleTypes,
            shipTos: safeShipTos,
            poTemplates: safePoTemplates,
            siTemplates: safeSiTemplates
          }
        } as AppState;
      }
    }
  )
);
