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
      if (order.companyId !== user.companyId) return null;

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
      allowedUserGroups: [UserGroup.TRADER, UserGroup.UBE, UserGroup.SALE]
    },
    {
      action: LineAction.UBE_APPROVE_LINE,
      fromStatus: OrderLineStatus.CREATED,
      toStatus: OrderLineStatus.UBE_APPROVED,
      allowedUserGroups: [UserGroup.UBE]
    },
    {
      action: LineAction.APPROVE_LINE,
      fromStatus: OrderLineStatus.UBE_APPROVED,
      toStatus: OrderLineStatus.APPROVED,
      allowedUserGroups: [UserGroup.SALE]
    },
    {
      action: LineAction.SET_ETD,
      fromStatus: OrderLineStatus.APPROVED,
      toStatus: OrderLineStatus.VESSEL_SCHEDULED,
      allowedUserGroups: [UserGroup.CS]
    },
    {
      action: LineAction.MARK_RECEIVED_PO,
      fromStatus: OrderLineStatus.VESSEL_SCHEDULED,
      toStatus: OrderLineStatus.RECEIVED_ACTUAL_PO,
      allowedUserGroups: [UserGroup.TRADER]
    },
    {
      action: LineAction.UPLOAD_FINAL_DOCS,
      fromStatus: OrderLineStatus.RECEIVED_ACTUAL_PO,
      toStatus: OrderLineStatus.VESSEL_DEPARTED,
      allowedUserGroups: [UserGroup.CS]
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
    action: LineAction.UBE_APPROVE_LINE,
    fromStatus: OrderLineStatus.CREATED,
    toStatus: OrderLineStatus.UBE_APPROVED,
    allowedUserGroups: [UserGroup.UBE]
  },
  {
    action: LineAction.APPROVE_LINE,
    fromStatus: OrderLineStatus.UBE_APPROVED,
    toStatus: OrderLineStatus.APPROVED,
    allowedUserGroups: [UserGroup.SALE]
  },
  {
    action: LineAction.SET_ETD,
    fromStatus: OrderLineStatus.APPROVED,
    toStatus: OrderLineStatus.VESSEL_SCHEDULED,
    allowedUserGroups: [UserGroup.CS]
  },
  {
    action: LineAction.MARK_RECEIVED_PO,
    fromStatus: OrderLineStatus.VESSEL_SCHEDULED,
    toStatus: OrderLineStatus.RECEIVED_ACTUAL_PO,
    allowedUserGroups: [UserGroup.CS]
  },
  {
    action: LineAction.UPLOAD_FINAL_DOCS,
    fromStatus: OrderLineStatus.RECEIVED_ACTUAL_PO,
    toStatus: OrderLineStatus.VESSEL_DEPARTED,
    allowedUserGroups: [UserGroup.CS]
  }
];

const INITIAL_LINE_PERMISSION_MATRIX = createStandardLinePermissionMatrix();

const UBE_JAPAN_COMPANY_ID = 'AG-UBE-JP';
const UBE_JAPAN_DEFAULT_USERNAMES = new Set([
  'mizutani',
  'sakuma',
  'oyamada',
  'yoshinaga',
  'miyanami',
  'kawamori',
  'kawasaki'
]);

const normalizeUbeJapanDefaultUser = (user: User): User => {
  if (!UBE_JAPAN_DEFAULT_USERNAMES.has(user.username.toLowerCase())) {
    return user;
  }

  return {
    ...user,
    role: Role.UBE_JAPAN,
    userGroup: UserGroup.UBE,
    companyId: UBE_JAPAN_COMPANY_ID
  };
};

const clonePermissionMatrix = (matrix: LineActionPermission[]) =>
  matrix.map((item) => ({
    ...item,
    allowedUserGroups: [...item.allowedUserGroups]
  }));

const normalizeLinePermissionMatrix = (matrix: LineActionPermission[]) => {
  const cloned = clonePermissionMatrix(matrix);

  const legacyApproveFromCreated = cloned.find(
    (item) =>
      item.action === LineAction.APPROVE_LINE &&
      item.fromStatus === OrderLineStatus.CREATED
  );

  const matrixWithoutLegacy = cloned.filter(
    (item) =>
      !(
        item.action === LineAction.APPROVE_LINE &&
        item.fromStatus === OrderLineStatus.CREATED
      )
  );

  const hasUbeApproveStep = matrixWithoutLegacy.some(
    (item) =>
      item.action === LineAction.UBE_APPROVE_LINE &&
      item.fromStatus === OrderLineStatus.CREATED
  );

  if (!hasUbeApproveStep) {
    matrixWithoutLegacy.push({
      action: LineAction.UBE_APPROVE_LINE,
      fromStatus: OrderLineStatus.CREATED,
      toStatus: OrderLineStatus.UBE_APPROVED,
      allowedUserGroups: [UserGroup.UBE]
    });
  }

  const hasSaleApproveFromUbe = matrixWithoutLegacy.some(
    (item) =>
      item.action === LineAction.APPROVE_LINE &&
      item.fromStatus === OrderLineStatus.UBE_APPROVED
  );

  if (!hasSaleApproveFromUbe) {
    matrixWithoutLegacy.push({
      action: LineAction.APPROVE_LINE,
      fromStatus: OrderLineStatus.UBE_APPROVED,
      toStatus: legacyApproveFromCreated?.toStatus || OrderLineStatus.APPROVED,
      allowedUserGroups: legacyApproveFromCreated?.allowedUserGroups?.length
        ? legacyApproveFromCreated.allowedUserGroups
        : [UserGroup.SALE]
    });
  }

  return matrixWithoutLegacy;
};

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
    id: 'SHIP-MICHELIN',
    name: 'Michelin',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.OVERSEAS
  },
  {
    id: 'SHIP-MICHELIN-GOODYEAR-LATAM',
    name: 'Michelin, Goodyear, LATAM Local',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.OVERSEAS
  },
  {
    id: 'SHIP-CHINA-LOCAL-SAILUN-MAXTREK',
    name: 'China Local / Sailun, Maxtrek',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.OVERSEAS
  },
  {
    id: 'SHIP-OIA-NON-OIA',
    name: 'OIA, Non OIA',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.OVERSEAS
  },
  {
    id: 'SHIP-VARIOUS',
    name: 'Various',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.OVERSEAS
  },
  {
    id: 'SHIP-HENKEL',
    name: 'Henkel',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.OVERSEAS
  },
  {
    id: 'SHIP-CONTINENTAL',
    name: 'Continental',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.OVERSEAS
  },
  {
    id: 'SHIP-CHENGSHIN-MAXXIS',
    name: 'Chengshin, Maxxis',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.OVERSEAS
  },
  {
    id: 'SHIP-OTHER-LOCAL-KENDA',
    name: 'Other Local / Kenda',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.OVERSEAS
  },
  {
    id: 'SHIP-INDIAN-LOCAL',
    name: 'Indian Local',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.OVERSEAS
  },
  {
    id: 'SHIP-BRIDGESTONE',
    name: 'Bridgestone',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.DOMESTIC
  },
  {
    id: 'SHIP-TOYO-MALAYSIA',
    name: 'Toyo Malaysia',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.DOMESTIC
  },
  {
    id: 'SHIP-YOKOHAMA-INDIA',
    name: 'Yokohama India',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.DOMESTIC
  },
  {
    id: 'SHIP-TOYO-TIRE',
    name: 'Toyo Tire',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.DOMESTIC
  },
  {
    id: 'SHIP-SUMITOMO-RUBBER',
    name: 'Sumitomo Rubber',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.DOMESTIC
  },
  {
    id: 'SHIP-TOYAMA-TIRE',
    name: 'Toyama Tire',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.DOMESTIC
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
    username: 'ube1',
    role: Role.UBE_JAPAN,
    userGroup: UserGroup.UBE,
    companyId: 'C001',
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
    id: 'u5',
    username: 'cs1',
    role: Role.CS,
    userGroup: UserGroup.CS,
    companyId: 'C001',
    canCreateOrder: false,
    shipToAccess: 'ALL',
    allowedShipToIds: [],
    allowedDocumentTypes: Object.values(DocumentType)
  },
  {
    id: 'u-sale-mizutani',
    username: 'mizutani',
    role: Role.UBE_JAPAN,
    userGroup: UserGroup.UBE,
    companyId: UBE_JAPAN_COMPANY_ID,
    canCreateOrder: true,
    shipToAccess: 'SELECTED',
    allowedShipToIds: ['SHIP-MICHELIN', 'SHIP-MICHELIN-GOODYEAR-LATAM'],
    allowedDocumentTypes: Object.values(DocumentType)
  },
  {
    id: 'u-sale-sakuma',
    username: 'sakuma',
    role: Role.UBE_JAPAN,
    userGroup: UserGroup.UBE,
    companyId: UBE_JAPAN_COMPANY_ID,
    canCreateOrder: false,
    shipToAccess: 'SELECTED',
    allowedShipToIds: [
      'SHIP-CHINA-LOCAL-SAILUN-MAXTREK',
      'SHIP-CONTINENTAL',
      'SHIP-CHENGSHIN-MAXXIS',
      'SHIP-OTHER-LOCAL-KENDA'
    ],
    allowedDocumentTypes: Object.values(DocumentType)
  },
  {
    id: 'u-sale-oyamada',
    username: 'oyamada',
    role: Role.UBE_JAPAN,
    userGroup: UserGroup.UBE,
    companyId: UBE_JAPAN_COMPANY_ID,
    canCreateOrder: false,
    shipToAccess: 'SELECTED',
    allowedShipToIds: ['SHIP-OIA-NON-OIA'],
    allowedDocumentTypes: Object.values(DocumentType)
  },
  {
    id: 'u-sale-yoshinaga',
    username: 'yoshinaga',
    role: Role.UBE_JAPAN,
    userGroup: UserGroup.UBE,
    companyId: UBE_JAPAN_COMPANY_ID,
    canCreateOrder: false,
    shipToAccess: 'SELECTED',
    allowedShipToIds: ['SHIP-VARIOUS', 'SHIP-HENKEL', 'SHIP-INDIAN-LOCAL'],
    allowedDocumentTypes: Object.values(DocumentType)
  },
  {
    id: 'u-sale-miyanami',
    username: 'miyanami',
    role: Role.UBE_JAPAN,
    userGroup: UserGroup.UBE,
    companyId: UBE_JAPAN_COMPANY_ID,
    canCreateOrder: true,
    shipToAccess: 'SELECTED',
    allowedShipToIds: ['SHIP-BRIDGESTONE', 'SHIP-YOKOHAMA-INDIA'],
    allowedDocumentTypes: Object.values(DocumentType)
  },
  {
    id: 'u-sale-kawamori',
    username: 'kawamori',
    role: Role.UBE_JAPAN,
    userGroup: UserGroup.UBE,
    companyId: UBE_JAPAN_COMPANY_ID,
    canCreateOrder: true,
    shipToAccess: 'SELECTED',
    allowedShipToIds: ['SHIP-TOYO-MALAYSIA', 'SHIP-TOYO-TIRE'],
    allowedDocumentTypes: Object.values(DocumentType)
  },
  {
    id: 'u-sale-kawasaki',
    username: 'kawasaki',
    role: Role.UBE_JAPAN,
    userGroup: UserGroup.UBE,
    companyId: UBE_JAPAN_COMPANY_ID,
    canCreateOrder: false,
    shipToAccess: 'SELECTED',
    allowedShipToIds: ['SHIP-SUMITOMO-RUBBER', 'SHIP-TOYAMA-TIRE'],
    allowedDocumentTypes: Object.values(DocumentType)
  }
];

const INITIAL_MASTER: MasterDataState = {
  groupSaleTypes: [
    { id: GroupSaleType.OVERSEAS, name: 'Overseas Sales Group' },
    { id: GroupSaleType.DOMESTIC, name: 'Domestic Sales Group' }
  ],
  destinations: [
    { id: 'DEST-TKY', name: 'Tokyo Port', customerCompanyIds: ['C001'] },
    { id: 'DEST-SH', name: 'Shanghai Port', customerCompanyIds: ['C001'] },
    {
      id: 'DEST-OSA',
      name: 'Osaka Port',
      customerCompanyIds: ['C001']
    }
  ],
  terms: [
    {
      id: 'CIF',
      name: 'CIF (Cost, Insurance, Freight)',
      customerCompanyIds: ['C001']
    },
    { id: 'FOB', name: 'FOB (Free on Board)', customerCompanyIds: ['C001'] },
    {
      id: 'EXW',
      name: 'EXW (Ex Works)',
      customerCompanyIds: ['C001']
    }
  ],
  grades: [
    {
      id: 'BR150',
      name: 'BR150',
      customerCompanyIds: ['C001']
    },
    {
      id: 'BR150B',
      name: 'BR150B',
      customerCompanyIds: ['C001']
    },
    {
      id: 'BR150L',
      name: 'BR150L',
      customerCompanyIds: ['C001']
    },
    {
      id: 'BR360',
      name: 'BR360',
      customerCompanyIds: ['C001']
    },
    {
      id: 'BR360B',
      name: 'BR360B',
      customerCompanyIds: ['C001']
    },
    {
      id: 'VCR-412',
      name: 'VCR-412',
      customerCompanyIds: ['C001']
    },
    {
      id: 'VCR-617',
      name: 'VCR-617',
      customerCompanyIds: ['C001']
    }
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

const splitShipToRecords = (shipTos: ShipToRecord[]) => {
  const normalizedRows: ShipToRecord[] = [];
  const splitIdMap = new Map<string, string[]>();
  const usedIds = new Set<string>();

  const allocateId = (baseId: string) => {
    let nextId = baseId;
    let index = 2;
    while (usedIds.has(nextId)) {
      nextId = `${baseId}-${index}`;
      index += 1;
    }
    usedIds.add(nextId);
    return nextId;
  };

  shipTos.forEach((row) => {
    const parts = row.name
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (parts.length <= 1) {
      normalizedRows.push({
        ...row,
        id: allocateId(row.id),
        name: row.name.trim()
      });
      return;
    }

    const splitIds: string[] = [];
    parts.forEach((part, index) => {
      const splitId = allocateId(`${row.id}-S${index + 1}`);
      splitIds.push(splitId);
      normalizedRows.push({
        ...row,
        id: splitId,
        name: part
      });
    });

    splitIdMap.set(row.id, splitIds);
  });

  return { shipTos: normalizedRows, splitIdMap };
};

const normalizeUsersBySplitShipToIds = (
  users: User[],
  splitIdMap: Map<string, string[]>
) =>
  users.map((user) => {
    if (
      !Array.isArray(user.allowedShipToIds) ||
      user.allowedShipToIds.length === 0
    ) {
      return user;
    }

    const expandedIds = user.allowedShipToIds.flatMap((shipToId) => {
      const splitIds = splitIdMap.get(shipToId);
      return splitIds && splitIds.length > 0 ? splitIds : [shipToId];
    });

    const uniqueIds = Array.from(new Set(expandedIds));
    return {
      ...user,
      allowedShipToIds: uniqueIds
    };
  });

const getInitialDataState = () => {
  const splitInitialShipTos = splitShipToRecords(INITIAL_MASTER.shipTos);
  const normalizedInitialUsers = normalizeUsersBySplitShipToIds(
    INITIAL_USERS.map(normalizeUbeJapanDefaultUser),
    splitInitialShipTos.splitIdMap
  );

  return {
    theme: 'light' as const,
    currentUser: null as User | null,
    users: [...normalizedInitialUsers],
    companies: [...INITIAL_COMPANIES],
    orders: [] as Order[],
    integrationLogs: [] as IntegrationLog[],
    masterData: {
      groupSaleTypes: [...INITIAL_MASTER.groupSaleTypes],
      destinations: [...INITIAL_MASTER.destinations],
      terms: [...INITIAL_MASTER.terms],
      grades: [...INITIAL_MASTER.grades],
      shipTos: [...splitInitialShipTos.shipTos]
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
          linePermissionMatrix: normalizeLinePermissionMatrix(
            createStandardLinePermissionMatrix()
          )
        });
      },

      applyLinePermissionPreset: (preset) => {
        set({
          linePermissionMatrix: normalizeLinePermissionMatrix(
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
      name: 'ube-portal-storage-v4',
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
        const normalizedShipToResult = splitShipToRecords(safeShipTos);
        const normalizedUsersByShipTo = normalizeUsersBySplitShipToIds(
          safeUsers.map(normalizeUbeJapanDefaultUser),
          normalizedShipToResult.splitIdMap
        );

        return {
          ...currentState,
          ...persisted,
          users: normalizedUsersByShipTo,
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
                matrix: normalizeLinePermissionMatrix(preset.matrix || [])
              }))
            : currentState.linePermissionCustomPresets,
          linePermissionMatrix: Array.isArray(persisted?.linePermissionMatrix)
            ? normalizeLinePermissionMatrix(persisted.linePermissionMatrix)
            : normalizeLinePermissionMatrix(currentState.linePermissionMatrix),
          masterData: {
            ...currentState.masterData,
            ...(persistedMaster || {}),
            groupSaleTypes: safeGroupSaleTypes,
            shipTos: normalizedShipToResult.shipTos
          }
        } as AppState;
      }
    }
  )
);
