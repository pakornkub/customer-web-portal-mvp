import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Select, { MultiValue, SingleValue } from 'react-select';
import { CircleX, Pencil, Plus, Save, Search, Trash2 } from 'lucide-react';
import { ActionIconButton } from '../components/ActionIconButton';
import { useStore } from '../store';
import {
  CustomerCompany,
  GroupSaleType,
  MasterDataRecord,
  ShipToRecord
} from '../types';
import Swal from '../utils/swal';

type TabKey =
  | 'companies'
  | 'destinations'
  | 'terms'
  | 'grades'
  | 'shipTos'
  | 'groupSaleTypes';

type CompanyOption = {
  value: string;
  label: string;
};

type SingleOption = {
  value: string;
  label: string;
};

type EditDraft = {
  name: string;
  customerCompanyIds: string[];
  groupSaleType: GroupSaleType;
};

export const MasterData: React.FC = () => {
  const {
    theme,
    companies,
    masterData,
    updateMasterData,
    updateShipTos,
    updateGroupSaleTypes,
    updateCompanies
  } = useStore();

  const [tab, setTab] = useState<TabKey>('shipTos');
  const [name, setName] = useState('');
  const [companyIds, setCompanyIds] = useState<string[]>([]);
  const [groupSaleType, setGroupSaleType] = useState<GroupSaleType>(
    GroupSaleType.OVERSEAS
  );
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [editDraft, setEditDraft] = useState<EditDraft>({
    name: '',
    customerCompanyIds: [],
    groupSaleType: GroupSaleType.OVERSEAS
  });

  const getCompanyName = (companyId: string) =>
    companies.find((company) => company.id === companyId)?.name || companyId;

  const companyOptions = useMemo<CompanyOption[]>(
    () =>
      companies.map((company) => ({ value: company.id, label: company.name })),
    [companies]
  );

  const selectedCompanyOptions = useMemo(
    () => companyOptions.filter((option) => companyIds.includes(option.value)),
    [companyOptions, companyIds]
  );

  const saleGroupOptions = useMemo<SingleOption[]>(
    () =>
      masterData.groupSaleTypes.map((group) => ({
        value: group.id,
        label: group.name
      })),
    [masterData.groupSaleTypes]
  );

  const selectStyles = useMemo(() => {
    const isDark = theme === 'dark';
    return {
      menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
      control: (base: any, state: any) => ({
        ...base,
        minHeight: 40,
        borderRadius: 'var(--radius-control)',
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        borderColor: state.isFocused
          ? isDark
            ? '#818cf8'
            : '#6366f1'
          : isDark
            ? '#334155'
            : '#cbd5e1',
        boxShadow: 'none',
        ':hover': {
          borderColor: state.isFocused
            ? isDark
              ? '#818cf8'
              : '#6366f1'
            : isDark
              ? '#475569'
              : '#94a3b8'
        }
      }),
      menu: (base: any) => ({
        ...base,
        borderRadius: 'var(--radius-control)',
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`
      }),
      valueContainer: (base: any) => ({
        ...base,
        minHeight: 38,
        padding: '0 12px'
      }),
      indicatorSeparator: (base: any) => ({
        ...base,
        marginTop: 8,
        marginBottom: 8,
        backgroundColor: isDark ? '#334155' : '#cbd5e1'
      }),
      dropdownIndicator: (base: any) => ({
        ...base,
        padding: 8,
        color: isDark ? '#cbd5e1' : '#475569'
      }),
      clearIndicator: (base: any) => ({
        ...base,
        padding: 8,
        color: isDark ? '#cbd5e1' : '#475569'
      }),
      singleValue: (base: any) => ({
        ...base,
        color: isDark ? '#e2e8f0' : '#0f172a'
      }),
      input: (base: any) => ({
        ...base,
        color: isDark ? '#e2e8f0' : '#0f172a'
      }),
      placeholder: (base: any) => ({
        ...base,
        color: isDark ? '#94a3b8' : '#64748b'
      }),
      option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isSelected
          ? isDark
            ? '#4338ca'
            : '#4f46e5'
          : state.isFocused
            ? isDark
              ? '#1e293b'
              : '#eef2ff'
            : 'transparent',
        color: state.isSelected ? '#ffffff' : isDark ? '#e2e8f0' : '#0f172a'
      }),
      multiValue: (base: any) => ({
        ...base,
        backgroundColor: isDark ? '#1e293b' : '#e2e8f0'
      }),
      multiValueLabel: (base: any) => ({
        ...base,
        color: isDark ? '#cbd5e1' : '#334155'
      }),
      multiValueRemove: (base: any) => ({
        ...base,
        color: isDark ? '#cbd5e1' : '#334155',
        ':hover': {
          backgroundColor: isDark ? '#334155' : '#cbd5e1',
          color: isDark ? '#ffffff' : '#0f172a'
        }
      })
    };
  }, [theme]);

  const selectMenuProps = useMemo(
    () => ({
      menuPortalTarget: document.body,
      menuPosition: 'fixed' as const,
      styles: selectStyles
    }),
    [selectStyles]
  );

  const isMasterRecordTab =
    tab === 'destinations' || tab === 'terms' || tab === 'grades';
  const showScopeColumn = tab !== 'groupSaleTypes' && tab !== 'companies';
  const showGroupSaleTypeColumn = tab === 'shipTos';

  const resetForm = () => {
    setName('');
    setCompanyIds([]);
    setGroupSaleType(GroupSaleType.OVERSEAS);
  };

  const onCompanyScopeChange = (selected: MultiValue<CompanyOption>) => {
    setCompanyIds(selected.map((option) => option.value));
  };

  const tabRows = useMemo(() => {
    if (tab === 'companies') return companies;
    if (tab === 'shipTos') return masterData.shipTos;
    if (tab === 'groupSaleTypes') return masterData.groupSaleTypes;
    return masterData[tab];
  }, [companies, masterData, tab]);

  const filteredRows = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return tabRows;

    return tabRows.filter((row: any) => {
      const scopeText = Array.isArray(row.customerCompanyIds)
        ? row.customerCompanyIds
            .map((companyId: string) => getCompanyName(companyId))
            .join(' ')
        : '';

      const searchable = [row.id, row.name, row.groupSaleType || '', scopeText]
        .join(' ')
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }, [getCompanyName, searchTerm, tabRows]);

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = useMemo(
    () =>
      filteredRows.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [filteredRows, currentPage]
  );
  const editingRow = useMemo(
    () => tabRows.find((row: any) => row.id === editingRowId) || null,
    [tabRows, editingRowId]
  );

  useEffect(() => {
    setCurrentPage(1);
    setEditingRowId(null);
    setShowAddModal(false);
    setSearchTerm('');
  }, [tab]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const nextRunningNo = (ids: string[]) => {
    const maxNo = ids.reduce((max, id) => {
      const match = id.match(/(\d+)$/);
      if (!match) return max;
      return Math.max(max, Number(match[1]));
    }, 0);
    return maxNo + 1;
  };

  const formatRunningNo = (index: number) => String(index + 1).padStart(3, '0');

  const addRecord = () => {
    if (!name.trim()) {
      Swal.fire({ icon: 'error', title: 'Name required' });
      return;
    }

    if (tab === 'companies') {
      const normalized = name.trim().toLowerCase();
      if (
        companies.some((company) => company.name.toLowerCase() === normalized)
      ) {
        Swal.fire({ icon: 'error', title: 'Company/Agent already exists' });
        return;
      }

      const nextNo = nextRunningNo(companies.map((company) => company.id));
      const id = `C${String(nextNo).padStart(3, '0')}`;
      const row: CustomerCompany = {
        id,
        name: name.trim()
      };
      updateCompanies([...companies, row]);
      resetForm();
      setShowAddModal(false);
      return;
    }

    if (tab === 'groupSaleTypes') {
      const id = name.toUpperCase().includes('DOMESTIC')
        ? GroupSaleType.DOMESTIC
        : GroupSaleType.OVERSEAS;
      updateGroupSaleTypes([
        ...masterData.groupSaleTypes,
        { id, name: name.trim() }
      ]);
      resetForm();
      setShowAddModal(false);
      return;
    }

    if (companyIds.length === 0) {
      Swal.fire({ icon: 'error', title: 'Select Company/Agent scope' });
      return;
    }

    if (tab === 'shipTos') {
      const nextNo = nextRunningNo(masterData.shipTos.map((row) => row.id));
      const row: ShipToRecord = {
        id: `SHIP-${String(nextNo).padStart(3, '0')}`,
        name: name.trim(),
        customerCompanyIds: companyIds,
        groupSaleType
      };
      updateShipTos([...masterData.shipTos, row]);
      resetForm();
      setShowAddModal(false);
      return;
    }

    if (isMasterRecordTab) {
      const prefixMap: Record<'destinations' | 'terms' | 'grades', string> = {
        destinations: 'DEST',
        terms: 'TERM',
        grades: 'GRADE'
      };
      const nextNo = nextRunningNo(masterData[tab].map((row) => row.id));
      const row: MasterDataRecord = {
        id: `${prefixMap[tab]}-${String(nextNo).padStart(3, '0')}`,
        name: name.trim(),
        customerCompanyIds: companyIds
      };
      updateMasterData(tab, [...masterData[tab], row]);
      resetForm();
      setShowAddModal(false);
    }
  };

  const removeRecord = (id: string, label?: string) => {
    if (tab === 'companies') {
      updateCompanies(companies.filter((row) => row.id !== id));
      return;
    }

    if (tab === 'groupSaleTypes') {
      updateGroupSaleTypes(
        masterData.groupSaleTypes.filter((row) => row.id !== id)
      );
      return;
    }

    if (tab === 'shipTos') {
      updateShipTos(masterData.shipTos.filter((row) => row.id !== id));
      return;
    }

    if (isMasterRecordTab) {
      updateMasterData(
        tab,
        masterData[tab].filter((row) => row.id !== id)
      );
    }
  };

  const startEdit = (row: any) => {
    setEditingRowId(row.id);
    setEditDraft({
      name: row.name || '',
      customerCompanyIds: Array.isArray(row.customerCompanyIds)
        ? [...row.customerCompanyIds]
        : [],
      groupSaleType:
        (row.groupSaleType as GroupSaleType) || GroupSaleType.OVERSEAS
    });
  };

  const cancelEdit = () => {
    setEditingRowId(null);
    setEditDraft({
      name: '',
      customerCompanyIds: [],
      groupSaleType: GroupSaleType.OVERSEAS
    });
  };

  const saveEdit = () => {
    if (!editingRowId) return;

    if (!editDraft.name.trim()) {
      Swal.fire({ icon: 'error', title: 'Name required' });
      return;
    }

    if (
      tab !== 'groupSaleTypes' &&
      tab !== 'companies' &&
      editDraft.customerCompanyIds.length === 0
    ) {
      Swal.fire({ icon: 'error', title: 'Select Company/Agent scope' });
      return;
    }

    if (tab === 'companies') {
      const duplicated = companies.some(
        (company) =>
          company.id !== editingRowId &&
          company.name.toLowerCase() === editDraft.name.trim().toLowerCase()
      );
      if (duplicated) {
        Swal.fire({ icon: 'error', title: 'Company/Agent already exists' });
        return;
      }

      updateCompanies(
        companies.map((row) =>
          row.id === editingRowId
            ? { ...row, name: editDraft.name.trim() }
            : row
        )
      );
      cancelEdit();
      return;
    }

    if (tab === 'groupSaleTypes') {
      updateGroupSaleTypes(
        masterData.groupSaleTypes.map((row) =>
          row.id === editingRowId
            ? { ...row, name: editDraft.name.trim() }
            : row
        )
      );
      cancelEdit();
      return;
    }

    if (tab === 'shipTos') {
      updateShipTos(
        masterData.shipTos.map((row) =>
          row.id === editingRowId
            ? {
                ...row,
                name: editDraft.name.trim(),
                customerCompanyIds: editDraft.customerCompanyIds,
                groupSaleType: editDraft.groupSaleType
              }
            : row
        )
      );
      cancelEdit();
      return;
    }

    if (isMasterRecordTab) {
      updateMasterData(
        tab,
        masterData[tab].map((row) =>
          row.id === editingRowId
            ? {
                ...row,
                name: editDraft.name.trim(),
                customerCompanyIds: editDraft.customerCompanyIds
              }
            : row
        )
      );
      cancelEdit();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="ui-page-title">Master Data Settings</h1>
          <p className="ui-page-subtitle">
            Manage Company/Agent, Ship-to, Sale Group, and company/agent-scoped
            master data.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 ui-radius-control text-sm font-bold hover:bg-indigo-700 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Record
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'companies', label: 'Company / Agent' },
            { id: 'shipTos', label: 'Ship To' },
            { id: 'groupSaleTypes', label: 'Sale Group' },
            { id: 'destinations', label: 'Destinations' },
            { id: 'terms', label: 'Terms' },
            { id: 'grades', label: 'Grades' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as TabKey)}
              className={`px-4 py-2 ui-radius-control text-xs font-bold border ${
                tab === item.id
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
                  : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {showAddModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40">
            <div className="w-full max-w-3xl bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl overflow-visible">
              <div className="flex items-center justify-between">
                <h2 className="ui-subheader text-slate-900 dark:text-white">
                  Add Record
                </h2>
                <ActionIconButton
                  onClick={() => setShowAddModal(false)}
                  tone="slate"
                  title="Close"
                >
                  <CircleX className="w-3.5 h-3.5" />
                </ActionIconButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="ui-form-label">
                    {tab === 'companies' ? 'Company / Agent Name' : 'Name'}
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="shadcn-input h-10 text-sm w-full"
                    placeholder={
                      tab === 'companies' ? 'Company / Agent Name' : 'Name'
                    }
                  />
                </div>

                {tab === 'shipTos' && (
                  <div className="space-y-1">
                    <label className="ui-form-label">Sale Group</label>
                    <Select
                      options={saleGroupOptions}
                      value={saleGroupOptions.find(
                        (option) => option.value === groupSaleType
                      )}
                      onChange={(option: SingleValue<SingleOption>) => {
                        if (!option) return;
                        setGroupSaleType(option.value as GroupSaleType);
                      }}
                      classNamePrefix="sale-group"
                      {...selectMenuProps}
                    />
                  </div>
                )}
              </div>

              {tab !== 'groupSaleTypes' && tab !== 'companies' && (
                <div className="space-y-2">
                  <label className="ui-form-label">Company / Agent</label>
                  <Select
                    isMulti
                    options={companyOptions}
                    value={selectedCompanyOptions}
                    onChange={onCompanyScopeChange}
                    placeholder="Select Company / Agent scope"
                    classNamePrefix="company-scope"
                    {...selectMenuProps}
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 ui-radius-control text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={addRecord}
                  className="bg-indigo-600 text-white px-4 py-2 ui-radius-control text-sm font-bold hover:bg-indigo-700 inline-flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {editingRow &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40">
            <div className="w-full max-w-3xl bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl overflow-visible">
              <div className="flex items-center justify-between">
                <h2 className="ui-subheader text-slate-900 dark:text-white">
                  Edit Record
                </h2>
                <ActionIconButton
                  onClick={cancelEdit}
                  tone="slate"
                  title="Close"
                >
                  <CircleX className="w-3.5 h-3.5" />
                </ActionIconButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="ui-form-label">
                    {tab === 'companies' ? 'Company / Agent Name' : 'Name'}
                  </label>
                  <input
                    value={editDraft.name}
                    onChange={(e) =>
                      setEditDraft((prev) => ({
                        ...prev,
                        name: e.target.value
                      }))
                    }
                    className="shadcn-input h-10 text-sm w-full"
                    placeholder={
                      tab === 'companies' ? 'Company / Agent Name' : 'Name'
                    }
                  />
                </div>

                {tab === 'shipTos' && (
                  <div className="space-y-1">
                    <label className="ui-form-label">Sale Group</label>
                    <Select
                      options={saleGroupOptions}
                      value={saleGroupOptions.find(
                        (option) => option.value === editDraft.groupSaleType
                      )}
                      onChange={(option: SingleValue<SingleOption>) => {
                        if (!option) return;
                        setEditDraft((prev) => ({
                          ...prev,
                          groupSaleType: option.value as GroupSaleType
                        }));
                      }}
                      classNamePrefix="sale-group"
                      {...selectMenuProps}
                    />
                  </div>
                )}
              </div>

              {tab !== 'groupSaleTypes' && tab !== 'companies' && (
                <div className="space-y-2">
                  <label className="ui-form-label">
                    Company / Agent Scope (select multiple)
                  </label>
                  <Select
                    isMulti
                    options={companyOptions}
                    value={companyOptions.filter((option) =>
                      editDraft.customerCompanyIds.includes(option.value)
                    )}
                    onChange={(selected: MultiValue<CompanyOption>) =>
                      setEditDraft((prev) => ({
                        ...prev,
                        customerCompanyIds: selected.map(
                          (option) => option.value
                        )
                      }))
                    }
                    placeholder="Select Company / Agent scope"
                    classNamePrefix="company-scope"
                    {...selectMenuProps}
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={cancelEdit}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 ui-radius-control text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="bg-indigo-600 text-white px-4 py-2 ui-radius-control text-sm font-bold hover:bg-indigo-700 inline-flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <div className="bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ID, name, company/agent, sale group..."
              className="shadcn-input h-10 text-sm w-full pl-9 pr-9"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                title="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <CircleX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <table className="w-full text-sm ui-table-standard">
          <thead className="bg-slate-50/50 dark:bg-slate-950/50 ui-table-head border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3 text-left">Running No</th>
              <th className="px-4 py-3 text-left">Name</th>
              {showScopeColumn && (
                <th className="px-4 py-3 text-left">Company / Agent</th>
              )}
              {showGroupSaleTypeColumn && (
                <th className="px-4 py-3 text-left">Sale Group</th>
              )}
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {pagedRows.map((row: any, pageIndex: number) => {
              const absoluteIndex = (currentPage - 1) * PAGE_SIZE + pageIndex;

              return (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">
                    {formatRunningNo(absoluteIndex)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {row.name}
                  </td>
                  {showScopeColumn && (
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                      {Array.isArray(row.customerCompanyIds)
                        ? row.customerCompanyIds
                            .map((companyId: string) =>
                              getCompanyName(companyId)
                            )
                            .join(', ')
                        : '-'}
                    </td>
                  )}
                  {showGroupSaleTypeColumn && (
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                      {'groupSaleType' in row ? row.groupSaleType : '-'}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <ActionIconButton
                        onClick={() => startEdit(row)}
                        tone="indigo"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </ActionIconButton>
                      <ActionIconButton
                        onClick={() => removeRecord(row.id, row.name)}
                        tone="rose"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </ActionIconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
            {pagedRows.length === 0 && (
              <tr>
                <td
                  colSpan={
                    showScopeColumn && showGroupSaleTypeColumn
                      ? 5
                      : showScopeColumn || showGroupSaleTypeColumn
                        ? 4
                        : 3
                  }
                  className="px-4 py-6 text-center text-slate-500 dark:text-slate-400"
                >
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="ui-micro-text text-slate-500 dark:text-slate-400">
            Showing{' '}
            {pagedRows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} -{' '}
            {(currentPage - 1) * PAGE_SIZE + pagedRows.length} of{' '}
            {filteredRows.length}
          </p>
          <div className="inline-flex items-center gap-1.5">
            <ActionIconButton
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              tone="slate"
              title="Previous page"
              disabled={currentPage === 1}
            >
              <span className="ui-micro-text font-bold">◀</span>
            </ActionIconButton>
            <span className="px-2 py-1 ui-micro-text font-bold text-slate-700 dark:text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <ActionIconButton
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              tone="slate"
              title="Next page"
              disabled={currentPage === totalPages}
            >
              <span className="ui-micro-text font-bold">▶</span>
            </ActionIconButton>
          </div>
        </div>
      </div>
    </div>
  );
};
