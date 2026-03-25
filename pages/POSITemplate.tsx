import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Pencil, Plus, Save, Ship, Trash2, X } from 'lucide-react';
import { ActionIconButton } from '../components/ActionIconButton';
import { useStore } from '../store';
import { PoTemplate, SiTemplate } from '../types';
import Swal from '../utils/swal';

type TabKey = 'po' | 'si';

// ─── Form state types ───────────────────────────────────────────────
type PoForm = Omit<PoTemplate, 'id' | 'createdAt' | 'updatedAt'>;
type SiForm = Omit<SiTemplate, 'id' | 'createdAt' | 'updatedAt'>;

const emptyPoForm = (): PoForm => ({
  shipToId: '',
  toBlock: '',
  consigneeNotify: '',
  agent: '',
  endUser: '',
  termsOfPayment: '',
  packingInstructions: '',
  confirmBy: ''
});

const emptySiForm = (): SiForm => ({
  shipToId: '',
  attn: '',
  from: '',
  poNumberHeader: '',
  no2Header: '',
  no2: '',
  materialCodeHeader: '',
  materialCode: '',
  noteUnderMaterial: '',
  user: '',
  country: '',
  shipper: '',
  feederVessel: '',
  motherVessel: '',
  vesselCompany: '',
  forwarder: '',
  portOfLoading: '',
  consignee: '',
  blType: '',
  freeTime: '',
  courierAddress: '',
  eoriNo: '',
  notifyParty: '',
  alsoNotify1: '',
  alsoNotify2: '',
  deliverTo: '',
  requirements: '',
  note: '',
  note2: '',
  note3: '',
  description: '',
  underDescription: '',
  shippingMark: '',
  belowSignature: ''
});

// ─── Re-usable field components ─────────────────────────────────────
const FLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({
  children,
  required
}) => (
  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
    {children}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const FInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => (
  <input
    className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
  />
);

const FTextarea: React.FC<{
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}> = ({ value, onChange, rows = 3, placeholder }) => (
  <textarea
    className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
    value={value}
    rows={rows}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
  />
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({
  children
}) => (
  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-5 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">
    {children}
  </h4>
);

// ─── PO Modal ────────────────────────────────────────────────────────
interface PoModalProps {
  initial?: PoForm;
  editingId?: string;
  usedShipToIds: string[];
  onSave: (form: PoForm) => void;
  onClose: () => void;
}

const PoModal: React.FC<PoModalProps> = ({
  initial,
  editingId,
  usedShipToIds,
  onSave,
  onClose
}) => {
  const { masterData } = useStore();
  const [form, setForm] = useState<PoForm>(initial ?? emptyPoForm());

  const set = (k: keyof PoForm) => (v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const availableShipTos = masterData.shipTos.filter(
    (s) => !usedShipToIds.includes(s.id) || s.id === (initial?.shipToId ?? '')
  );

  const handleSave = () => {
    if (!form.shipToId) {
      Swal.fire({
        icon: 'warning',
        title: 'Ship-To required',
        text: 'Please select a Ship-To.'
      });
      return;
    }
    onSave(form);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {editingId ? 'Edit PO Template' : 'Add PO Template'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div>
            <FLabel required>Ship-To</FLabel>
            <select
              className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.shipToId}
              onChange={(e) => set('shipToId')(e.target.value)}
            >
              <option value="">— Select Ship-To —</option>
              {availableShipTos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {availableShipTos.length === 0 && !editingId && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                All Ship-Tos already have a PO template.
              </p>
            )}
          </div>

          <SectionTitle>TO: Block (Recipient)</SectionTitle>
          <div>
            <FLabel>TO: Block (multi-line)</FLabel>
            <FTextarea
              value={form.toBlock}
              onChange={set('toBlock')}
              rows={5}
              placeholder={
                'Company Name\nAddress Line 1\nAddress Line 2\nCity, Country\nATTN.: Name / Title'
              }
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Each line = one line in PDF (max 6 lines shown)
            </p>
          </div>

          <SectionTitle>CONSIGNEE & NOTIFY</SectionTitle>
          <div>
            <FLabel>Consignee & Notify (multi-line)</FLabel>
            <FTextarea
              value={form.consigneeNotify}
              onChange={set('consigneeNotify')}
              rows={5}
              placeholder={
                'Company Name\nAddress Line 1\nAddress Line 2\nContact Person: ...\nTel: ... Fax: ...'
              }
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Each line = one line in PDF (max 6 lines shown)
            </p>
          </div>

          <SectionTitle>Other PO Fields</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FLabel>Agent</FLabel>
              <FInput
                value={form.agent}
                onChange={set('agent')}
                placeholder="e.g. UBE EUROPE GMBH"
              />
            </div>
            <div>
              <FLabel>End User</FLabel>
              <FInput
                value={form.endUser}
                onChange={set('endUser')}
                placeholder="End user company"
              />
            </div>
            <div>
              <FLabel>Terms of Payment</FLabel>
              <FInput
                value={form.termsOfPayment}
                onChange={set('termsOfPayment')}
                placeholder="BY T.T.R 60 DAYS AFTER B/L DATE"
              />
            </div>
            <div>
              <FLabel>Packing Instructions</FLabel>
              <FInput
                value={form.packingInstructions}
                onChange={set('packingInstructions')}
                placeholder="STANDARD EXPORT PACKING BY GPS"
              />
            </div>
          </div>

          <SectionTitle>Signature (Confirm By)</SectionTitle>
          <div>
            <FLabel>Confirm By (multi-line)</FLabel>
            <FTextarea
              value={form.confirmBy}
              onChange={set('confirmBy')}
              rows={3}
              placeholder={'Name\nTitle\nCompany Name'}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Each line = one line in PDF (max 3 lines)
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <Save size={14} />
            Save Template
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── SI Modal ────────────────────────────────────────────────────────
interface SiModalProps {
  initial?: SiForm;
  editingId?: string;
  usedShipToIds: string[];
  onSave: (form: SiForm) => void;
  onClose: () => void;
}

const SiModal: React.FC<SiModalProps> = ({
  initial,
  editingId,
  usedShipToIds,
  onSave,
  onClose
}) => {
  const { masterData } = useStore();
  const [form, setForm] = useState<SiForm>(initial ?? emptySiForm());

  const set = (k: keyof SiForm) => (v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const availableShipTos = masterData.shipTos.filter(
    (s) => !usedShipToIds.includes(s.id) || s.id === (initial?.shipToId ?? '')
  );

  const handleSave = () => {
    if (!form.shipToId) {
      Swal.fire({
        icon: 'warning',
        title: 'Ship-To required',
        text: 'Please select a Ship-To.'
      });
      return;
    }
    onSave(form);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {editingId ? 'Edit SI Template' : 'Add SI Template'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div>
            <FLabel required>Ship-To</FLabel>
            <select
              className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.shipToId}
              onChange={(e) => set('shipToId')(e.target.value)}
            >
              <option value="">— Select Ship-To —</option>
              {availableShipTos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <SectionTitle>Header Contacts</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FLabel>ATTN (at TSL)</FLabel>
              <FInput
                value={form.attn}
                onChange={set('attn')}
                placeholder="T.FUJIOKA / SEVP"
              />
            </div>
            <div>
              <FLabel>From (at UBE)</FLabel>
              <FInput
                value={form.from}
                onChange={set('from')}
                placeholder="M.KAWAMORI / H.UEDA"
              />
            </div>
          </div>

          <SectionTitle>Reference Sections</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FLabel>PO Number Header Label</FLabel>
              <FInput
                value={form.poNumberHeader}
                onChange={set('poNumberHeader')}
                placeholder="e.g. BS POLAND PO No.: "
              />
            </div>
            <div>
              <FLabel>No.2 Header Label</FLabel>
              <FInput
                value={form.no2Header}
                onChange={set('no2Header')}
                placeholder="e.g. Cooper NO.: "
              />
            </div>
            <div>
              <FLabel>No.2 Value</FLabel>
              <FInput
                value={form.no2}
                onChange={set('no2')}
                placeholder="e.g. 72026877"
              />
            </div>
            <div>
              <FLabel>Material Code Header</FLabel>
              <FInput
                value={form.materialCodeHeader}
                onChange={set('materialCodeHeader')}
                placeholder="Material Code"
              />
            </div>
            <div>
              <FLabel>Material Code Value</FLabel>
              <FInput
                value={form.materialCode}
                onChange={set('materialCode')}
                placeholder="SMITHIC on grade label"
              />
            </div>
          </div>
          <div>
            <FLabel>Note Under Material</FLabel>
            <FInput
              value={form.noteUnderMaterial}
              onChange={set('noteUnderMaterial')}
              placeholder="*put marking CODE on both sides of GPS box"
            />
          </div>

          <SectionTitle>End-Party Info</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FLabel>User (Company)</FLabel>
              <FInput
                value={form.user}
                onChange={set('user')}
                placeholder="TOYO TYRE MALAYSIA"
              />
            </div>
            <div>
              <FLabel>Country</FLabel>
              <FInput
                value={form.country}
                onChange={set('country')}
                placeholder="Malaysia"
              />
            </div>
            <div>
              <FLabel>Shipper</FLabel>
              <FInput
                value={form.shipper}
                onChange={set('shipper')}
                placeholder="TSL WITH FULL ADDRESS"
              />
            </div>
          </div>

          <SectionTitle>Vessel / Freight Info</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FLabel>Feeder Vessel</FLabel>
              <FInput
                value={form.feederVessel}
                onChange={set('feederVessel')}
                placeholder="INTERASIA MOTIVATION V.W026"
              />
            </div>
            <div>
              <FLabel>Mother Vessel</FLabel>
              <FInput
                value={form.motherVessel}
                onChange={set('motherVessel')}
                placeholder="-"
              />
            </div>
            <div>
              <FLabel>Vessel Company</FLabel>
              <FInput
                value={form.vesselCompany}
                onChange={set('vesselCompany')}
                placeholder="INTER ASIA"
              />
            </div>
            <div>
              <FLabel>Forwarder</FLabel>
              <FInput
                value={form.forwarder}
                onChange={set('forwarder')}
                placeholder="LEO"
              />
            </div>
            <div>
              <FLabel>Port of Loading</FLabel>
              <FInput
                value={form.portOfLoading}
                onChange={set('portOfLoading')}
                placeholder="LAEM CHABANG, THAILAND"
              />
            </div>
          </div>

          <SectionTitle>Shipping Mark</SectionTitle>
          <div>
            <FLabel>Shipping Mark Lines (multi-line)</FLabel>
            <FTextarea
              value={form.shippingMark}
              onChange={set('shippingMark')}
              rows={5}
              placeholder={'Mark Line 1\nMark Line 2\nMark Line 3\n...'}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Each line = one mark line in PDF (max 6). Leave blank to
              auto-generate from order data.
            </p>
          </div>

          <SectionTitle>Consignee (SI)</SectionTitle>
          <div>
            <FLabel>Consignee and Notify (multi-line)</FLabel>
            <FTextarea
              value={form.consignee}
              onChange={set('consignee')}
              rows={5}
              placeholder={
                'Company Name\nAddress Line 1\nAddress Line 2\nContact Person: ...\nTel: ... Fax: ...'
              }
            />
          </div>

          <SectionTitle>B/L & Delivery Details</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FLabel>B/L Type</FLabel>
              <FInput
                value={form.blType}
                onChange={set('blType')}
                placeholder="SURRENDERED B/L"
              />
            </div>
            <div>
              <FLabel>Free Time</FLabel>
              <FInput
                value={form.freeTime}
                onChange={set('freeTime')}
                placeholder="D/M:14DAYS    D/T 14DAYS"
              />
            </div>
            <div>
              <FLabel>Courier Address</FLabel>
              <FInput
                value={form.courierAddress}
                onChange={set('courierAddress')}
                placeholder=""
              />
            </div>
            <div>
              <FLabel>EORI No.</FLabel>
              <FInput
                value={form.eoriNo}
                onChange={set('eoriNo')}
                placeholder=""
              />
            </div>
            <div>
              <FLabel>Notify Party</FLabel>
              <FInput
                value={form.notifyParty}
                onChange={set('notifyParty')}
                placeholder=""
              />
            </div>
            <div>
              <FLabel>Also Notify 1</FLabel>
              <FInput
                value={form.alsoNotify1}
                onChange={set('alsoNotify1')}
                placeholder=""
              />
            </div>
            <div>
              <FLabel>Also Notify 2</FLabel>
              <FInput
                value={form.alsoNotify2}
                onChange={set('alsoNotify2')}
                placeholder=""
              />
            </div>
            <div>
              <FLabel>Deliver To</FLabel>
              <FInput
                value={form.deliverTo}
                onChange={set('deliverTo')}
                placeholder=""
              />
            </div>
          </div>

          <SectionTitle>Requirements & Notes</SectionTitle>
          <div>
            <FLabel>Requirements</FLabel>
            <FInput
              value={form.requirements}
              onChange={set('requirements')}
              placeholder="* Please apply 14 days Free Time"
            />
          </div>
          <div className="space-y-2">
            <div>
              <FLabel>Note 1</FLabel>
              <FInput
                value={form.note}
                onChange={set('note')}
                placeholder="*CERTIFICATE OF ANALYSIS"
              />
            </div>
            <div>
              <FLabel>Note 2</FLabel>
              <FInput
                value={form.note2}
                onChange={set('note2')}
                placeholder="*PACKING LIST"
              />
            </div>
            <div>
              <FLabel>Note 3</FLabel>
              <FInput
                value={form.note3}
                onChange={set('note3')}
                placeholder="*Please describe MAR information on all delivery documents."
              />
            </div>
          </div>

          <SectionTitle>Product Description</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FLabel>Description (in cargo table)</FLabel>
              <FInput
                value={form.description}
                onChange={set('description')}
                placeholder="POLYBUTADIENE RUBBER"
              />
            </div>
            <div>
              <FLabel>Under Description</FLabel>
              <FInput
                value={form.underDescription}
                onChange={set('underDescription')}
                placeholder=""
              />
            </div>
            <div>
              <FLabel>Below Signature</FLabel>
              <FInput
                value={form.belowSignature}
                onChange={set('belowSignature')}
                placeholder="UBE Elastomer Co. Ltd."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <Save size={14} />
            Save Template
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Main Page ────────────────────────────────────────────────────────
export const POSITemplate: React.FC = () => {
  const {
    masterData,
    addPoTemplate,
    updatePoTemplate,
    removePoTemplate,
    addSiTemplate,
    updateSiTemplate,
    removeSiTemplate
  } = useStore();

  const [tab, setTab] = useState<TabKey>('po');

  // PO modal state
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [editingPoId, setEditingPoId] = useState<string | null>(null);
  const [poInitial, setPoInitial] = useState<PoForm | undefined>(undefined);

  // SI modal state
  const [siModalOpen, setSiModalOpen] = useState(false);
  const [editingSiId, setEditingSiId] = useState<string | null>(null);
  const [siInitial, setSiInitial] = useState<SiForm | undefined>(undefined);

  const getShipToName = (id: string) =>
    masterData.shipTos.find((s) => s.id === id)?.name || id;

  // ── PO handlers ──────────────────────────────────────────────────
  const openAddPo = () => {
    setEditingPoId(null);
    setPoInitial(undefined);
    setPoModalOpen(true);
  };

  const openEditPo = (tpl: PoTemplate) => {
    setEditingPoId(tpl.id);
    setPoInitial({
      shipToId: tpl.shipToId,
      toBlock: tpl.toBlock,
      consigneeNotify: tpl.consigneeNotify,
      agent: tpl.agent,
      endUser: tpl.endUser,
      termsOfPayment: tpl.termsOfPayment,
      packingInstructions: tpl.packingInstructions,
      confirmBy: tpl.confirmBy
    });
    setPoModalOpen(true);
  };

  const handleSavePo = (form: PoForm) => {
    if (editingPoId) {
      updatePoTemplate(editingPoId, form);
    } else {
      addPoTemplate(form);
    }
    setPoModalOpen(false);
  };

  const handleDeletePo = async (id: string, shipToName: string) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete PO Template?',
      text: `Remove PO template for "${shipToName}"?`,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626'
    });
    if (result.isConfirmed) removePoTemplate(id);
  };

  // ── SI handlers ──────────────────────────────────────────────────
  const openAddSi = () => {
    setEditingSiId(null);
    setSiInitial(undefined);
    setSiModalOpen(true);
  };

  const openEditSi = (tpl: SiTemplate) => {
    setEditingSiId(tpl.id);
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = tpl;
    setSiInitial(rest as SiForm);
    setSiModalOpen(true);
  };

  const handleSaveSi = (form: SiForm) => {
    if (editingSiId) {
      updateSiTemplate(editingSiId, form);
    } else {
      addSiTemplate(form);
    }
    setSiModalOpen(false);
  };

  const handleDeleteSi = async (id: string, shipToName: string) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete SI Template?',
      text: `Remove SI template for "${shipToName}"?`,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626'
    });
    if (result.isConfirmed) removeSiTemplate(id);
  };

  const usedPoShipToIds = masterData.poTemplates.map((t) => t.shipToId);
  const usedSiShipToIds = masterData.siTemplates.map((t) => t.shipToId);

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          PO / SI Templates
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Master templates for Purchase Order and Shipping Instruction
          documents, linked per Ship-To.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setTab('po')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'po'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <FileText size={15} />
          PO Templates
          <span className="ml-1 px-1.5 py-0.5 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
            {masterData.poTemplates.length}
          </span>
        </button>
        <button
          onClick={() => setTab('si')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'si'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Ship size={15} />
          SI Templates
          <span className="ml-1 px-1.5 py-0.5 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
            {masterData.siTemplates.length}
          </span>
        </button>
      </div>

      {/* ── PO Tab ─────────────────────────────────────────────────── */}
      {tab === 'po' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pre-fill PO document fields per Ship-To. CS can edit values in the
              modal before generating.
            </p>
            <button
              onClick={openAddPo}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <Plus size={15} />
              Add PO Template
            </button>
          </div>

          {masterData.poTemplates.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-600">
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                No PO templates yet. Click "Add PO Template" to create one.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                      Ship-To
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                      TO: (first line)
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                      Terms of Payment
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                      Packing
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                      Updated
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {masterData.poTemplates.map((tpl) => (
                    <tr
                      key={tpl.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {getShipToName(tpl.shipToId)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                        {tpl.toBlock.split('\n')[0] || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[180px] truncate">
                        {tpl.termsOfPayment || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {tpl.packingInstructions || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-500 text-xs">
                        {tpl.updatedAt.slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 flex gap-2 justify-end">
                        <ActionIconButton
                          title="Edit"
                          tone="indigo"
                          onClick={() => openEditPo(tpl)}
                        >
                          <Pencil size={14} />
                        </ActionIconButton>
                        <ActionIconButton
                          title="Delete"
                          tone="rose"
                          onClick={() =>
                            handleDeletePo(tpl.id, getShipToName(tpl.shipToId))
                          }
                        >
                          <Trash2 size={14} />
                        </ActionIconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── SI Tab ─────────────────────────────────────────────────── */}
      {tab === 'si' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pre-fill Shipping Instruction fields per Ship-To. CS can edit
              values in the modal before generating.
            </p>
            <button
              onClick={openAddSi}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <Plus size={15} />
              Add SI Template
            </button>
          </div>

          {masterData.siTemplates.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-600">
              <Ship size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                No SI templates yet. Click "Add SI Template" to create one.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                      Ship-To
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                      ATTN
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                      User (Company)
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                      Country
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                      Port of Loading
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                      Updated
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {masterData.siTemplates.map((tpl) => (
                    <tr
                      key={tpl.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {getShipToName(tpl.shipToId)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {tpl.attn || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[150px] truncate">
                        {tpl.user || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {tpl.country || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[150px] truncate">
                        {tpl.portOfLoading || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-500 text-xs">
                        {tpl.updatedAt.slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 flex gap-2 justify-end">
                        <ActionIconButton
                          title="Edit"
                          tone="indigo"
                          onClick={() => openEditSi(tpl)}
                        >
                          <Pencil size={14} />
                        </ActionIconButton>
                        <ActionIconButton
                          title="Delete"
                          tone="rose"
                          onClick={() =>
                            handleDeleteSi(tpl.id, getShipToName(tpl.shipToId))
                          }
                        >
                          <Trash2 size={14} />
                        </ActionIconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {poModalOpen && (
        <PoModal
          initial={poInitial}
          editingId={editingPoId ?? undefined}
          usedShipToIds={usedPoShipToIds}
          onSave={handleSavePo}
          onClose={() => setPoModalOpen(false)}
        />
      )}
      {siModalOpen && (
        <SiModal
          initial={siInitial}
          editingId={editingSiId ?? undefined}
          usedShipToIds={usedSiShipToIds}
          onSave={handleSaveSi}
          onClose={() => setSiModalOpen(false)}
        />
      )}
    </div>
  );
};
