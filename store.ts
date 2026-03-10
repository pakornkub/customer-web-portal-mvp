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
  IntegrationLog
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
    destinationIds: ['DEST-JAKARTA']
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
    destinationIds: ['DEST-XIAMEN']
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
    destinationIds: ['DEST-SHANGHAI', 'DEST-HANGZHOU']
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
    id: 'SHIP-PT-HANKOOK',
    name: 'PT. HANKOOK TIRE INDONESIA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SEMARANG']
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
    { id: 'DEST-SOUTHAMPTON', name: 'Southampton, UK' }
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
  shipTos: INITIAL_SHIP_TO_MAPPINGS
};

const mergeById = <T extends { id: string }>(
  base: T[],
  persisted: T[] | undefined
) => {
  const map = new Map(base.map((item) => [item.id, item]));
  if (Array.isArray(persisted)) {
    persisted.forEach((item) => {
      const current = map.get(item.id);
      map.set(item.id, current ? { ...current, ...item } : item);
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
      shipTos: [...INITIAL_MASTER.shipTos]
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
            shipTos: safeShipTos
          }
        } as AppState;
      }
    }
  )
);
