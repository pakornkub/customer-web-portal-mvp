export enum Role {
  UBE_JAPAN = 'UBE_JAPAN',
  MAIN_TRADER = 'MAIN_TRADER',
  CS = 'CS',
  SALE = 'SALE',
  SALE_MANAGER = 'SALE_MANAGER',
  ADMIN = 'ADMIN'
}

export enum OrderLineStatus {
  DRAFT = 'DRAFT',
  CREATED = 'CREATED',
  APPROVED = 'APPROVED',
  WAIT_SALE_UEC_APPROVE_PO = 'WAIT_SALE_UEC_APPROVE_PO',
  WAIT_MGR_UEC_APPROVE_PO = 'WAIT_MGR_UEC_APPROVE_PO',
  VESSEL_SCHEDULED = 'VESSEL_SCHEDULED',
  VESSEL_DEPARTED = 'VESSEL_DEPARTED'
}

export enum OrderProgressStatus {
  CREATE = 'CREATE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETE = 'COMPLETE'
}

export enum UserGroup {
  TRADER = 'TRADER',
  UEC_SALE = 'UEC_SALE',
  TSL_SALE = 'TSL_SALE',
  UEC_MANAGER = 'UEC_MANAGER',
  TSL_CS = 'TSL_CS',
  ADMIN = 'ADMIN'
}

export enum GroupSaleType {
  OVERSEAS = 'OVERSEAS',
  DOMESTIC = 'DOMESTIC'
}

export enum LineAction {
  SUBMIT_LINE = 'SUBMIT_LINE',
  APPROVE_LINE = 'APPROVE_LINE',
  SET_ETD = 'SET_ETD',
  APPROVE_SALE_PO = 'APPROVE_SALE_PO',
  APPROVE_MGR_PO = 'APPROVE_MGR_PO',
  UPLOAD_FINAL_DOCS = 'UPLOAD_FINAL_DOCS'
}

export enum DocumentType {
  SHIPPING_DOC = 'Shipping Document',
  BL = 'BL',
  INVOICE = 'Invoice',
  COA = 'COA',
  PO_PDF = 'PO_PDF',
  SHIPPING_INSTRUCTION_PDF = 'SHIPPING_INSTRUCTION_PDF'
}

export interface CustomerCompany {
  id: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  role: Role;
  userGroup: UserGroup;
  companyId: string;
  canCreateOrder: boolean;
  shipToAccess: 'ALL' | 'SELECTED';
  allowedShipToIds: string[];
  allowedDocumentTypes: DocumentType[];
}

export interface MasterDataRecord {
  id: string;
  name: string;
}

export interface ShipToRecord extends MasterDataRecord {
  groupSaleType: GroupSaleType;
  destinationIds: string[];
}

export interface GroupSaleTypeRecord {
  id: GroupSaleType;
  name: string;
}

export interface LineActionPermission {
  action: LineAction;
  fromStatus: OrderLineStatus;
  toStatus: OrderLineStatus;
  allowedUserGroups: UserGroup[];
}

export interface OrderDocument {
  id: string;
  type: DocumentType;
  filename: string;
  dataUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface OrderItem {
  id: string;
  poNo: string;
  shipToId: string;
  status: OrderLineStatus;
  destinationId: string;
  termId: string;
  requestETD: string;
  requestETA: string;
  gradeId: string;
  qty: number;
  price?: number;
  currency?: string;
  otherRequested?: string;
  saleNote?: string;
  quotationNo?: string;
  asap: boolean;
  actualETD?: string;
  clearanceDate?: string;
  feederVessel?: string;
  motherVessel?: string;
  vesselCompany?: string;
  forwarder?: string;
  vesselEtd?: string;
  vesselEta?: string;
  documents: OrderDocument[];
  pdfSnapshot?: PdfGenerationSnapshot;
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
  status: OrderProgressStatus;
  quotationNo?: string;
  companyId: string;
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

// ── PO/SI Master Templates ─────────────────────────────────────────
export interface PoTemplate {
  id: string;
  shipToId: string;
  /** Multi-line: "Company\nAddr1\nAddr2\nATTN: contact" */
  toBlock: string;
  /** Multi-line: "Company\nAddr1\nAddr2\nContact Person\nTel/Fax" */
  consigneeNotify: string;
  agent: string;
  endUser: string;
  termsOfPayment: string;
  packingInstructions: string;
  /** Multi-line: "Name\nTitle\nCompany" */
  confirmBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SiTemplate {
  id: string;
  shipToId: string;
  attn: string;
  from: string;
  poNumberHeader: string;
  no2Header: string;
  no2: string;
  materialCodeHeader: string;
  materialCode: string;
  noteUnderMaterial: string;
  user: string;
  country: string;
  shipper: string;
  feederVessel: string;
  motherVessel: string;
  vesselCompany: string;
  forwarder: string;
  portOfLoading: string;
  /** Multi-line: "Company\nAddr1\nAddr2\nContact" */
  consignee: string;
  blType: string;
  freeTime: string;
  courierAddress: string;
  eoriNo: string;
  bookingNo: string;
  notifyParty: string;
  alsoNotify1: string;
  alsoNotify2: string;
  deliverTo: string;
  requirements: string;
  note: string;
  note2: string;
  note3: string;
  description: string;
  underDescription: string;
  /** Multi-line additional shipping mark lines */
  shippingMark: string;
  belowSignature: string;
  createdAt: string;
  updatedAt: string;
}

export interface PdfGenerationSnapshot {
  generatedAt: string;
  generatedBy: string;
  poTemplateId?: string;
  siTemplateId?: string;
  poFields: Record<string, string>;
  siFields: Record<string, string>;
}
