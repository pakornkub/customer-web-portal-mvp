import React, { useEffect, useState } from 'react';
import { X, FileText, Ship } from 'lucide-react';
import { useStore } from '../store';
import { Order, OrderItem } from '../types';

// Matches PoPdfInput in poPdf.ts — keep in sync
export type PoPdfInput = {
  orderNo: string;
  orderDate?: string;
  poNo: string;
  shipToId: string;
  destinationId: string;
  termId: string;
  gradeId: string;
  qty: number;
  price?: number;
  currency?: string;
  requestETD?: string;
  actualETD?: string;
  // PO template
  poToBlock?: string;
  poConsigneeNotify?: string;
  poTermsOfPayment?: string;
  poPackingInstructions?: string;
  poConfirmBy?: string;
  // Resolved display values (populated from masterData at build time)
  destinationName?: string;
  poGradeCode?: string;
  poGradeDescription?: string;
  // SI template
  siAttn?: string;
  siFrom?: string;
  siUser?: string;
  siCountry?: string;
  siShipper?: string;
  siFeederVessel?: string;
  siMotherVessel?: string;
  siVesselCompany?: string;
  siForwarder?: string;
  siPortOfLoading?: string;
  siConsignee?: string;
  siBlType?: string;
  siFreeTime?: string;
  siRequirements?: string;
  siNote?: string;
  siNote2?: string;
  siNote3?: string;
  siDescription?: string;
  siUnderDescription?: string;
  siShippingMark?: string;
  siBelowSignature?: string;
  // Cooper Kunshan-specific
  siNotifyParty?: string;
  siDeliverTo?: string;
  siNo2Header?: string;
  siNo2?: string;
  siMaterialCodeHeader?: string;
  siMaterialCode?: string;
  siNoteUnderMaterial?: string;
  // Bridgestone Poznan-specific
  siPoNumberHeader?: string;
  siBookingNo?: string;
  siCourierAddress?: string;
  siEoriNo?: string;
};

interface Props {
  order: Order;
  line: OrderItem;
  actualETD: string;
  onConfirm: (poInput: PoPdfInput, siInput: PoPdfInput) => void;
  onClose: () => void;
}

interface PoForm {
  toBlock: string;
  consigneeNotify: string;
  agent: string;
  endUser: string;
  termsOfPayment: string;
  packingInstructions: string;
  confirmBy: string;
}

interface SiForm {
  attn: string;
  from: string;
  user: string;
  country: string;
  shipper: string;
  feederVessel: string;
  motherVessel: string;
  vesselCompany: string;
  forwarder: string;
  portOfLoading: string;
  consignee: string;
  blType: string;
  freeTime: string;
  requirements: string;
  note: string;
  note2: string;
  note3: string;
  description: string;
  underDescription: string;
  shippingMark: string;
  belowSignature: string;
  // Cooper Kunshan-specific
  notifyParty: string;
  deliverTo: string;
  no2Header: string;
  no2: string;
  materialCodeHeader: string;
  materialCode: string;
  noteUnderMaterial: string;
  // Bridgestone Poznan-specific
  poNumberHeader: string;
  bookingNo: string;
  courierAddress: string;
  eoriNo: string;
}

const EMPTY_PO: PoForm = {
  toBlock: '',
  consigneeNotify: '',
  agent: '',
  endUser: '',
  termsOfPayment: '',
  packingInstructions: '',
  confirmBy: ''
};

const EMPTY_SI: SiForm = {
  attn: '',
  from: '',
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
  requirements: '',
  note: '',
  note2: '',
  note3: '',
  description: '',
  underDescription: '',
  shippingMark: '',
  belowSignature: '',
  // Cooper Kunshan-specific
  notifyParty: '',
  deliverTo: '',
  no2Header: '',
  no2: '',
  materialCodeHeader: '',
  materialCode: '',
  noteUnderMaterial: '',
  // Bridgestone Poznan-specific
  poNumberHeader: '',
  bookingNo: '',
  courierAddress: '',
  eoriNo: ''
};

const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({
  children,
  required
}) => (
  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
    {children}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const Input: React.FC<{
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

const Textarea: React.FC<{
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

const ReadOnlyField: React.FC<{ label: string; value: string }> = ({
  label,
  value
}) => (
  <div>
    <span className="text-xs text-slate-500 dark:text-slate-400">
      {label}:{' '}
    </span>
    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
      {value || '—'}
    </span>
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({
  children
}) => (
  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-4 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">
    {children}
  </h4>
);

export const PdfGenerationModal: React.FC<Props> = ({
  order,
  line,
  actualETD,
  onConfirm,
  onClose
}) => {
  const { masterData } = useStore();
  const [activeTab, setActiveTab] = useState<'po' | 'si'>('po');
  const [poForm, setPoForm] = useState<PoForm>(EMPTY_PO);
  const [siForm, setSiForm] = useState<SiForm>(EMPTY_SI);

  // Pre-fill from master templates on mount
  useEffect(() => {
    const poTpl = masterData.poTemplates.find(
      (t) => t.shipToId === line.shipToId
    );
    if (poTpl) {
      setPoForm({
        toBlock: poTpl.toBlock,
        consigneeNotify: poTpl.consigneeNotify,
        agent: poTpl.agent,
        endUser: poTpl.endUser,
        termsOfPayment: poTpl.termsOfPayment,
        packingInstructions: poTpl.packingInstructions,
        confirmBy: poTpl.confirmBy
      });
    }
    const siTpl = masterData.siTemplates.find(
      (t) => t.shipToId === line.shipToId
    );
    if (siTpl) {
      setSiForm({
        attn: siTpl.attn,
        from: siTpl.from,
        user: siTpl.user,
        country: siTpl.country,
        shipper: siTpl.shipper,
        feederVessel: siTpl.feederVessel,
        motherVessel: siTpl.motherVessel,
        vesselCompany: siTpl.vesselCompany,
        forwarder: siTpl.forwarder,
        portOfLoading: siTpl.portOfLoading,
        consignee: siTpl.consignee,
        blType: siTpl.blType,
        freeTime: siTpl.freeTime,
        requirements: siTpl.requirements,
        note: siTpl.note,
        note2: siTpl.note2,
        note3: siTpl.note3,
        description: siTpl.description,
        underDescription: siTpl.underDescription,
        shippingMark: siTpl.shippingMark,
        belowSignature: siTpl.belowSignature,
        // Cooper Kunshan-specific
        notifyParty: siTpl.notifyParty,
        deliverTo: siTpl.deliverTo,
        no2Header: siTpl.no2Header,
        no2: siTpl.no2,
        materialCodeHeader: siTpl.materialCodeHeader,
        materialCode: siTpl.materialCode,
        noteUnderMaterial: siTpl.noteUnderMaterial,
        // Bridgestone Poznan-specific
        poNumberHeader: siTpl.poNumberHeader ?? '',
        bookingNo: siTpl.bookingNo ?? '',
        courierAddress: siTpl.courierAddress ?? '',
        eoriNo: siTpl.eoriNo ?? ''
      });
    }
  }, [line.shipToId, masterData]);

  const setPo = (field: keyof PoForm) => (value: string) =>
    setPoForm((prev) => ({ ...prev, [field]: value }));

  const setSi = (field: keyof SiForm) => (value: string) =>
    setSiForm((prev) => ({ ...prev, [field]: value }));

  const buildBaseInput = (): PoPdfInput => {
    const destRecord = masterData.destinations.find(
      (d) => d.id === line.destinationId
    );
    const gradeRecord = masterData.grades.find((g) => g.id === line.gradeId);
    const gradeCode =
      (line.gradeId || '').match(/^[A-Za-z]+/)?.[0] || line.gradeId || 'BR';
    return {
      orderNo: order.orderNo,
      orderDate: order.orderDate,
      poNo: line.poNo,
      shipToId: line.shipToId,
      destinationId: line.destinationId,
      termId: line.termId,
      gradeId: line.gradeId,
      qty: line.qty,
      price: line.price,
      currency: line.currency,
      requestETD: line.requestETD,
      actualETD,
      destinationName: destRecord?.name,
      poGradeCode: gradeCode,
      poGradeDescription: gradeRecord?.name
    };
  };

  const handleConfirm = () => {
    const base = buildBaseInput();
    const poInput: PoPdfInput = {
      ...base,
      poToBlock: poForm.toBlock || undefined,
      poConsigneeNotify: poForm.consigneeNotify || undefined,
      poTermsOfPayment: poForm.termsOfPayment || undefined,
      poPackingInstructions: poForm.packingInstructions || undefined,
      poConfirmBy: poForm.confirmBy || undefined
    };
    const siInput: PoPdfInput = {
      ...base,
      siAttn: siForm.attn || undefined,
      siFrom: siForm.from || undefined,
      siUser: siForm.user || undefined,
      siCountry: siForm.country || undefined,
      siShipper: siForm.shipper || undefined,
      siFeederVessel: siForm.feederVessel || undefined,
      siMotherVessel: siForm.motherVessel || undefined,
      siVesselCompany: siForm.vesselCompany || undefined,
      siForwarder: siForm.forwarder || undefined,
      siPortOfLoading: siForm.portOfLoading || undefined,
      siConsignee: siForm.consignee || undefined,
      siBlType: siForm.blType || undefined,
      siFreeTime: siForm.freeTime || undefined,
      siRequirements: siForm.requirements || undefined,
      siNote: siForm.note || undefined,
      siNote2: siForm.note2 || undefined,
      siNote3: siForm.note3 || undefined,
      siDescription: siForm.description || undefined,
      siUnderDescription: siForm.underDescription || undefined,
      siShippingMark: siForm.shippingMark || undefined,
      siBelowSignature: siForm.belowSignature || undefined,
      // Cooper Kunshan-specific
      siNotifyParty: siForm.notifyParty || undefined,
      siDeliverTo: siForm.deliverTo || undefined,
      siNo2Header: siForm.no2Header || undefined,
      siNo2: siForm.no2 || undefined,
      siMaterialCodeHeader: siForm.materialCodeHeader || undefined,
      siMaterialCode: siForm.materialCode || undefined,
      siNoteUnderMaterial: siForm.noteUnderMaterial || undefined,
      // Bridgestone Poznan-specific
      siPoNumberHeader: siForm.poNumberHeader || undefined,
      siBookingNo: siForm.bookingNo || undefined,
      siCourierAddress: siForm.courierAddress || undefined,
      siEoriNo: siForm.eoriNo || undefined
    };
    onConfirm(poInput, siInput);
  };

  const shipToName =
    masterData.shipTos.find((s) => s.id === line.shipToId)?.name ||
    line.shipToId;
  const hasPoTemplate = masterData.poTemplates.some(
    (t) => t.shipToId === line.shipToId
  );
  const hasSiTemplate = masterData.siTemplates.some(
    (t) => t.shipToId === line.shipToId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Generate PO & SI Documents
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {shipToName} · PO: {line.poNo} · ETD: {actualETD}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Order/Line summary */}
        <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 grid grid-cols-4 gap-x-4 gap-y-1 shrink-0">
          <ReadOnlyField label="Order No." value={order.orderNo} />
          <ReadOnlyField label="Grade" value={line.gradeId} />
          <ReadOnlyField label="Qty" value={`${line.qty} MT`} />
          <ReadOnlyField
            label="Price"
            value={line.price ? `${line.price} ${line.currency || 'USD'}` : '—'}
          />
          <ReadOnlyField label="Terms" value={line.termId} />
          <ReadOnlyField
            label="Destination"
            value={
              masterData.destinations.find((d) => d.id === line.destinationId)
                ?.name || line.destinationId
            }
          />
          <ReadOnlyField label="ETD" value={actualETD} />
          <ReadOnlyField
            label="Order Date"
            value={order.orderDate?.slice(0, 10) || '—'}
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 shrink-0 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('po')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              activeTab === 'po'
                ? 'bg-white dark:bg-slate-900 border border-b-white dark:border-slate-700 dark:border-b-slate-900 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText size={14} />
            Purchase Order (PO)
            {hasPoTemplate && (
              <span className="ml-1 px-1 py-0.5 text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded">
                template
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('si')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              activeTab === 'si'
                ? 'bg-white dark:bg-slate-900 border border-b-white dark:border-slate-700 dark:border-b-slate-900 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Ship size={14} />
            Shipping Instruction (SI)
            {hasSiTemplate && (
              <span className="ml-1 px-1 py-0.5 text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded">
                template
              </span>
            )}
          </button>
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {activeTab === 'po' && (
            <div className="space-y-3">
              {!hasPoTemplate && (
                <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded px-3 py-2">
                  No PO template found for <strong>{shipToName}</strong>. Fields
                  are blank — fill in manually or add a template in PO/SI
                  Templates admin page.
                </div>
              )}

              <SectionTitle>TO: (Recipient)</SectionTitle>
              <div>
                <Label>TO: Block (multi-line)</Label>
                <Textarea
                  value={poForm.toBlock}
                  onChange={setPo('toBlock')}
                  rows={5}
                  placeholder={
                    'Company Name\nAddress Line 1\nAddress Line 2\nCity, Country\nATTN.: Name / Title'
                  }
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Each line = one line in PDF (max 6 lines)
                </p>
              </div>

              <SectionTitle>CONSIGNEE & NOTIFY</SectionTitle>
              <div>
                <Label>Consignee & Notify (multi-line)</Label>
                <Textarea
                  value={poForm.consigneeNotify}
                  onChange={setPo('consigneeNotify')}
                  rows={5}
                  placeholder={
                    'Company Name\nAddress Line 1\nAddress Line 2\nContact Person: ...\nTel: ... Fax: ...'
                  }
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Each line = one line in PDF (max 6 lines)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Agent</Label>
                  <Input
                    value={poForm.agent}
                    onChange={setPo('agent')}
                    placeholder="e.g. UBE EUROPE GMBH"
                  />
                </div>
                <div>
                  <Label>End User</Label>
                  <Input
                    value={poForm.endUser}
                    onChange={setPo('endUser')}
                    placeholder="End user company name"
                  />
                </div>
              </div>

              <SectionTitle>Terms</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Terms of Payment</Label>
                  <Input
                    value={poForm.termsOfPayment}
                    onChange={setPo('termsOfPayment')}
                    placeholder="BY T.T.R 60 DAYS AFTER B/L DATE"
                  />
                </div>
                <div>
                  <Label>Packing Instructions</Label>
                  <Input
                    value={poForm.packingInstructions}
                    onChange={setPo('packingInstructions')}
                    placeholder="STANDARD EXPORT PACKING BY GPS"
                  />
                </div>
              </div>

              <SectionTitle>Signature (Confirm By)</SectionTitle>
              <div>
                <Label>Confirm By (multi-line)</Label>
                <Textarea
                  value={poForm.confirmBy}
                  onChange={setPo('confirmBy')}
                  rows={3}
                  placeholder={'Name\nTitle\nCompany Name'}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Each line = one line in PDF (max 3 lines)
                </p>
              </div>
            </div>
          )}

          {activeTab === 'si' && (
            <div className="space-y-3">
              {!hasSiTemplate && (
                <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded px-3 py-2">
                  No SI template found for <strong>{shipToName}</strong>. Fields
                  are blank — fill in manually or add a template in PO/SI
                  Templates admin page.
                </div>
              )}

              <SectionTitle>Header Contacts</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>ATTN (at TSL)</Label>
                  <Input
                    value={siForm.attn}
                    onChange={setSi('attn')}
                    placeholder="T.FUJIOKA / SEVP"
                  />
                </div>
                <div>
                  <Label>From (at UBE)</Label>
                  <Input
                    value={siForm.from}
                    onChange={setSi('from')}
                    placeholder="M.KAWAMORI / H.UEDA"
                  />
                </div>
              </div>

              <SectionTitle>Reference Numbers</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ref No. Label (e.g. Cooper NO.:)</Label>
                  <Input
                    value={siForm.no2Header}
                    onChange={setSi('no2Header')}
                    placeholder="Cooper NO.:"
                  />
                </div>
                <div>
                  <Label>Ref No. Value</Label>
                  <Input
                    value={siForm.no2}
                    onChange={setSi('no2')}
                    placeholder="72026877"
                  />
                </div>
              </div>

              <SectionTitle>End-Party Info</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>User (Company)</Label>
                  <Input
                    value={siForm.user}
                    onChange={setSi('user')}
                    placeholder="TOYO TYRE MALAYSIA"
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={siForm.country}
                    onChange={setSi('country')}
                    placeholder="Malaysia"
                  />
                </div>
                <div>
                  <Label>Shipper</Label>
                  <Input
                    value={siForm.shipper}
                    onChange={setSi('shipper')}
                    placeholder="TSL WITH FULL ADDRESS"
                  />
                </div>
              </div>

              <SectionTitle>Vessel Information</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Feeder Vessel</Label>
                  <Input
                    value={siForm.feederVessel}
                    onChange={setSi('feederVessel')}
                    placeholder="INTERASIA MOTIVATION V.W026"
                  />
                </div>
                <div>
                  <Label>Mother Vessel</Label>
                  <Input
                    value={siForm.motherVessel}
                    onChange={setSi('motherVessel')}
                    placeholder="-"
                  />
                </div>
                <div>
                  <Label>Vessel Company</Label>
                  <Input
                    value={siForm.vesselCompany}
                    onChange={setSi('vesselCompany')}
                    placeholder="INTER ASIA"
                  />
                </div>
                <div>
                  <Label>Forwarder</Label>
                  <Input
                    value={siForm.forwarder}
                    onChange={setSi('forwarder')}
                    placeholder="LEO"
                  />
                </div>
                <div>
                  <Label>Port of Loading</Label>
                  <Input
                    value={siForm.portOfLoading}
                    onChange={setSi('portOfLoading')}
                    placeholder="LAEM CHABANG, THAILAND"
                  />
                </div>
              </div>

              <SectionTitle>Shipping Mark</SectionTitle>
              <div>
                <Label>Shipping Mark Lines (multi-line)</Label>
                <Textarea
                  value={siForm.shippingMark}
                  onChange={setSi('shippingMark')}
                  rows={5}
                  placeholder={'Mark Line 1\nMark Line 2\nMark Line 3\n...'}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Each line = one mark line in PDF (max 6 lines). Leave blank to
                  auto-generate from order data.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Material Code Label</Label>
                  <Input
                    value={siForm.materialCodeHeader}
                    onChange={setSi('materialCodeHeader')}
                    placeholder="Material Code"
                  />
                </div>
                <div>
                  <Label>Material Code Value</Label>
                  <Input
                    value={siForm.materialCode}
                    onChange={setSi('materialCode')}
                    placeholder="SMITHIC on grade label"
                  />
                </div>
              </div>
              <div>
                <Label>Note Under Material Code</Label>
                <Input
                  value={siForm.noteUnderMaterial}
                  onChange={setSi('noteUnderMaterial')}
                  placeholder="*put marking CODE on both sides of GPS box"
                />
              </div>

              <SectionTitle>Consignee (SI)</SectionTitle>
              <div>
                <Label>Consignee and Notify (multi-line)</Label>
                <Textarea
                  value={siForm.consignee}
                  onChange={setSi('consignee')}
                  rows={5}
                  placeholder={
                    'Company Name\nAddress Line 1\nAddress Line 2\nContact Person: ...\nTel: ... Fax: ...'
                  }
                />
              </div>
              <div>
                <Label>
                  Deliver To (multi-line — Cooper 3-col middle column)
                </Label>
                <Textarea
                  value={siForm.deliverTo}
                  onChange={setSi('deliverTo')}
                  rows={3}
                  placeholder={'Company Name\nAddress Line 1\nAddress Line 2'}
                />
              </div>
              <div>
                <Label>Notify Party</Label>
                <Input
                  value={siForm.notifyParty}
                  onChange={setSi('notifyParty')}
                  placeholder="SAME AS CONSIGNEE"
                />
              </div>
              <div>
                <Label>Courier Address (Bridgestone)</Label>
                <Input
                  value={siForm.courierAddress}
                  onChange={setSi('courierAddress')}
                  placeholder="No need original courier."
                />
              </div>
              <div>
                <Label>EORI No. (Bridgestone)</Label>
                <Input
                  value={siForm.eoriNo}
                  onChange={setSi('eoriNo')}
                  placeholder="PL782205233400000"
                />
              </div>

              <SectionTitle>Bridgestone-Specific</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>PO No. Header (right of CONTRACT)</Label>
                  <Input
                    value={siForm.poNumberHeader}
                    onChange={setSi('poNumberHeader')}
                    placeholder="BS POLAND PO No.:"
                  />
                </div>
                <div>
                  <Label>Booking No.</Label>
                  <Input
                    value={siForm.bookingNo}
                    onChange={setSi('bookingNo')}
                    placeholder="e.g. ABC123456"
                  />
                </div>
              </div>

              <SectionTitle>Document Requirements</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>B/L Type</Label>
                  <Input
                    value={siForm.blType}
                    onChange={setSi('blType')}
                    placeholder="SURRENDERED B/L"
                  />
                </div>
                <div>
                  <Label>Free Time</Label>
                  <Input
                    value={siForm.freeTime}
                    onChange={setSi('freeTime')}
                    placeholder="D/M:14DAYS    D/T 14DAYS"
                  />
                </div>
              </div>
              <div>
                <Label>Requirements Note (shown after FREE TIME label)</Label>
                <Input
                  value={siForm.requirements}
                  onChange={setSi('requirements')}
                  placeholder="* Please apply 14 days Free Time"
                />
              </div>

              <SectionTitle>Notes</SectionTitle>
              <div className="space-y-2">
                <div>
                  <Label>Note 1</Label>
                  <Input
                    value={siForm.note}
                    onChange={setSi('note')}
                    placeholder="*CERTIFICATE OF ANALYSIS"
                  />
                </div>
                <div>
                  <Label>Note 2</Label>
                  <Input
                    value={siForm.note2}
                    onChange={setSi('note2')}
                    placeholder="*PACKING LIST"
                  />
                </div>
                <div>
                  <Label>Note 3</Label>
                  <Input
                    value={siForm.note3}
                    onChange={setSi('note3')}
                    placeholder="*Please describe MAR information on all delivery documents."
                  />
                </div>
              </div>

              <SectionTitle>Product Description</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Description (in cargo table)</Label>
                  <Input
                    value={siForm.description}
                    onChange={setSi('description')}
                    placeholder="POLYBUTADIENE RUBBER"
                  />
                </div>
                <div>
                  <Label>Under Description</Label>
                  <Input
                    value={siForm.underDescription}
                    onChange={setSi('underDescription')}
                    placeholder=""
                  />
                </div>
                <div>
                  <Label>Below Signature</Label>
                  <Input
                    value={siForm.belowSignature}
                    onChange={setSi('belowSignature')}
                    placeholder="UBE Elastomer Co. Ltd."
                  />
                </div>
              </div>
            </div>
          )}
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
            onClick={handleConfirm}
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <FileText size={14} />
            Generate PO & SI
          </button>
        </div>
      </div>
    </div>
  );
};
