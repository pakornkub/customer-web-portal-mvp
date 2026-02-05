export enum Role {
  UBE_JAPAN = 'UBE_JAPAN',
  MAIN_TRADER = 'MAIN_TRADER',
  CS = 'CS',
  SALE = 'SALE',
  SALE_MANAGER = 'SALE_MANAGER',
  ADMIN = 'ADMIN'
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  CREATED = 'CREATED',
  CONFIRMED = 'CONFIRMED',
  VESSEL_BOOKED = 'VESSEL_BOOKED',
  RECEIVED_PO = 'RECEIVED_PO',
  VESSEL_DEPARTED = 'VESSEL_DEPARTED'
}

export enum DocumentType {
  SHIPPING_DOC = 'Shipping Document',
  BL = 'BL',
  INVOICE = 'Invoice',
  COA = 'COA',
  PO_PDF = 'PO_PDF'
}

export interface CustomerCompany {
  id: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  role: Role;
  customerCompanyId?: string;
  allowedDocumentTypes: DocumentType[];
}

export interface MasterDataRecord {
  id: string;
  name: string;
  customerCompanyId: string[];
}

export interface OrderDocument {
  id: string;
  type: DocumentType;
  filename: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface OrderItem {
  id: string;
  poNo: string;
  shipToId: string;
  destinationId: string;
  termId: string;
  requestETD: string;
  requestETA: string;
  gradeId: string;
  qty: number;
  price?: number;
  currency?: string;
  otherRequested?: string;
  asap: boolean;
  actualETD?: string;
}

export interface IntegrationLog {
  id: string;
  orderNo: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  message: string;
  timestamp: string;
}

export interface Order {
  orderNo: string;
  orderDate: string;
  note: string;
  status: OrderStatus;
  quotationNo?: string;
  customerCompanyId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  actualETD?: string;
  items: OrderItem[];
  documents: OrderDocument[];
  saleNote?: string;
}

export interface NotificationLog {
  id: string;
  message: string;
  timestamp: string;
  role: Role;
  type: 'email' | 'system';
}

export interface ActivityLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}
