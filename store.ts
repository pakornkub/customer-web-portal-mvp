import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Role,
  OrderStatus,
  User,
  Order,
  CustomerCompany,
  MasterDataRecord,
  NotificationLog,
  ActivityLog,
  DocumentType,
  IntegrationLog
} from './types';

interface AppState {
  theme: 'light' | 'dark';
  currentUser: User | null;
  users: User[];
  companies: CustomerCompany[];
  orders: Order[];
  integrationLogs: IntegrationLog[];
  masterData: {
    destinations: MasterDataRecord[];
    terms: MasterDataRecord[];
    grades: MasterDataRecord[];
    shipTos: MasterDataRecord[];
  };
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
    type: keyof AppState['masterData'],
    data: MasterDataRecord[]
  ) => void;
  updateUserPermissions: (userId: string, perms: DocumentType[]) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  runScheduledChecks: () => void;
  resetStore: () => void;
}

const INITIAL_COMPANIES: CustomerCompany[] = [
  { id: 'C001', name: 'UBE Thailand' },
  { id: 'C002', name: 'Global Trader Corp' }
];

const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    username: 'admin',
    role: Role.ADMIN,
    allowedDocumentTypes: Object.values(DocumentType)
  },
  {
    id: 'u2',
    username: 'trader1',
    role: Role.MAIN_TRADER,
    customerCompanyId: 'C001',
    allowedDocumentTypes: [
      DocumentType.PO_PDF,
      DocumentType.INVOICE,
      DocumentType.COA
    ]
  },
  {
    id: 'u3',
    username: 'ube1',
    role: Role.UBE_JAPAN,
    customerCompanyId: 'C001',
    allowedDocumentTypes: [DocumentType.PO_PDF, DocumentType.INVOICE]
  },
  {
    id: 'u4',
    username: 'sale1',
    role: Role.SALE,
    allowedDocumentTypes: Object.values(DocumentType)
  },
  {
    id: 'u5',
    username: 'cs1',
    role: Role.CS,
    allowedDocumentTypes: Object.values(DocumentType)
  },
  {
    id: 'u6',
    username: 'salemgr1',
    role: Role.SALE_MANAGER,
    allowedDocumentTypes: Object.values(DocumentType)
  }
];

const INITIAL_MASTER: AppState['masterData'] = {
  destinations: [
    { id: 'DEST-TKY', name: 'Tokyo Port', customerCompanyId: ['C001'] },
    { id: 'DEST-SH', name: 'Shanghai Port', customerCompanyId: ['C002'] },
    { id: 'DEST-OSA', name: 'Osaka Port', customerCompanyId: ['C001', 'C002'] }
  ],
  terms: [
    {
      id: 'CIF',
      name: 'CIF (Cost, Insurance, Freight)',
      customerCompanyId: ['C001']
    },
    { id: 'FOB', name: 'FOB (Free on Board)', customerCompanyId: ['C002'] },
    { id: 'EXW', name: 'EXW (Ex Works)', customerCompanyId: ['C001', 'C002'] }
  ],
  grades: [
    { id: 'GRADE-PA', name: 'Premium Grade A', customerCompanyId: ['C001'] },
    { id: 'GRADE-SB', name: 'Standard Grade B', customerCompanyId: ['C002'] },
    {
      id: 'GRADE-PX',
      name: 'Polymer X-90',
      customerCompanyId: ['C001', 'C002']
    }
  ],
  shipTos: [
    {
      id: 'SHIP-TH-BKK',
      name: 'Bangkok DC',
      customerCompanyId: ['C001']
    },
    {
      id: 'SHIP-JP-OSA',
      name: 'Osaka Warehouse',
      customerCompanyId: ['C001', 'C002']
    },
    {
      id: 'SHIP-CN-SH',
      name: 'Shanghai DC',
      customerCompanyId: ['C002']
    }
  ]
};

const getInitialDataState = () => ({
  theme: 'light' as const,
  currentUser: null as User | null,
  users: [...INITIAL_USERS],
  companies: [...INITIAL_COMPANIES],
  orders: [] as Order[],
  integrationLogs: [] as IntegrationLog[],
  masterData: {
    destinations: [...INITIAL_MASTER.destinations],
    terms: [...INITIAL_MASTER.terms],
    grades: [...INITIAL_MASTER.grades],
    shipTos: [...INITIAL_MASTER.shipTos]
  },
  notifications: [] as NotificationLog[],
  activities: [] as ActivityLog[]
});

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

      runScheduledChecks: () => {
        const { orders, addNotification, addActivity } = get();
        const now = new Date();
        const thirtyDaysFromNow = new Date(
          now.getTime() + 30 * 24 * 60 * 60 * 1000
        );

        let urgentCount = 0;
        orders.forEach((order) => {
          const hasUrgentETA = order.items.some((item) => {
            if (!item.asap) return false;
            const eta = new Date(item.requestETA);
            return eta >= now && eta <= thirtyDaysFromNow;
          });

          // Step 3.1: Notify CS for ASAP items with ETA within 30 days
          if (hasUrgentETA && order.status === OrderStatus.CONFIRMED) {
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
      name: 'ube-portal-storage-v3',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AppState> | undefined;
        const persistedMaster = persisted?.masterData;
        const safeShipTos = Array.isArray(persistedMaster?.shipTos)
          ? persistedMaster?.shipTos
          : currentState.masterData.shipTos;

        return {
          ...currentState,
          ...persisted,
          masterData: {
            ...currentState.masterData,
            ...(persistedMaster || {}),
            shipTos: safeShipTos
          }
        } as AppState;
      }
    }
  )
);
