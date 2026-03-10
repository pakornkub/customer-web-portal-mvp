import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Select, { MultiValue, SingleValue } from 'react-select';
import {
  Plus,
  X,
  Search,
  UserPlus,
  CircleX,
  Pencil,
  Save,
  Trash2,
  Lock,
  Unlock,
  RotateCcw
} from 'lucide-react';
import { ActionIconButton } from '../components/ActionIconButton';
import {
  createStandardLinePermissionMatrix,
  createStrictLinePermissionMatrix,
  useStore
} from '../store';
import {
  DocumentType,
  LineAction,
  LineActionPermission,
  Role,
  User,
  UserGroup
} from '../types';
import Swal from '../utils/swal';
import { formatStatusLabel } from '../utils/statusLabel';

const GROUP_OPTIONS = Object.values(UserGroup);

type ShipToAccess = 'ALL' | 'SELECTED';

type AccessOption = {
  value: ShipToAccess;
  label: string;
};

type ShipToOption = {
  value: string;
  label: string;
};

type SingleOption = {
  value: string;
  label: string;
};

const SHIP_TO_ACCESS_OPTIONS: AccessOption[] = [
  { value: 'ALL', label: 'ALL' },
  { value: 'SELECTED', label: 'SELECTED' }
];

const DEFAULT_UBE_JAPAN_COMPANY_ID = 'AG-UBE-JP';

const normalizeShipToAccess = (value?: string): ShipToAccess =>
  value === 'SELECTED' ? 'SELECTED' : 'ALL';

const normalizeMatrix = (matrix: LineActionPermission[]) =>
  [...matrix]
    .sort((left, right) => left.action.localeCompare(right.action))
    .map((item) => ({
      ...item,
      allowedUserGroups: [...item.allowedUserGroups].sort()
    }));

const deriveRoleFromGroup = (group: UserGroup): Role => {
  if (group === UserGroup.ADMIN) return Role.ADMIN;
  if (group === UserGroup.TSL_CS) return Role.CS;
  if (group === UserGroup.TSL_SALE) return Role.SALE;
  if (group === UserGroup.UEC_MANAGER) return Role.SALE_MANAGER;
  if (group === UserGroup.UEC_SALE) return Role.UBE_JAPAN;
  return Role.MAIN_TRADER;
};

type UserEditDraft = {
  userGroup: UserGroup;
  companyId: string;
  canCreateOrder: boolean;
  shipToAccess: ShipToAccess;
  allowedShipToIds: string[];
  allowedDocumentTypes: DocumentType[];
};

const createDraftFromUser = (user: User): UserEditDraft => ({
  userGroup: user.userGroup,
  companyId: user.companyId,
  canCreateOrder: user.canCreateOrder,
  shipToAccess: normalizeShipToAccess(user.shipToAccess),
  allowedShipToIds: [...user.allowedShipToIds],
  allowedDocumentTypes: [...user.allowedDocumentTypes]
});

const isUserDraftDirty = (user: User, draft: UserEditDraft) =>
  user.userGroup !== draft.userGroup ||
  user.companyId !== draft.companyId ||
  user.canCreateOrder !== draft.canCreateOrder ||
  user.shipToAccess !== draft.shipToAccess ||
  user.allowedShipToIds.join('|') !== draft.allowedShipToIds.join('|') ||
  user.allowedDocumentTypes.join('|') !== draft.allowedDocumentTypes.join('|');

export const Admin: React.FC = () => {
  const {
    currentUser,
    theme,
    users,
    companies,
    masterData,
    linePermissionMatrix,
    linePermissionLocked,
    linePermissionCustomPresets,
    addUser,
    deleteUser,
    updateUser,
    updateLinePermission,
    setLinePermissionLocked,
    saveLinePermissionCustomPreset,
    applyLinePermissionCustomPreset,
    deleteLinePermissionCustomPreset,
    resetLinePermissionMatrix,
    applyLinePermissionPreset
  } = useStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [editingUsers, setEditingUsers] = useState<
    Record<string, UserEditDraft>
  >({});
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUser, setNewUser] = useState({
    username: '',
    role: deriveRoleFromGroup(UserGroup.UEC_SALE),
    userGroup: UserGroup.UEC_SALE,
    companyId:
      companies.find((company) => company.id === DEFAULT_UBE_JAPAN_COMPANY_ID)
        ?.id ||
      companies[0]?.id ||
      'C001',
    canCreateOrder: true,
    shipToAccess: 'ALL' as 'ALL' | 'SELECTED',
    allowedShipToIds: [] as string[],
    allowedDocumentTypes: Object.values(DocumentType)
  });

  const allShipToOptions = useMemo<ShipToOption[]>(
    () =>
      masterData.shipTos.map((shipTo) => ({
        value: shipTo.id,
        label: shipTo.name
      })),
    [masterData.shipTos]
  );

  const createShipToOptions = allShipToOptions;

  const createSelectedShipToOptions = useMemo(() => {
    const optionById = new Map(
      [...allShipToOptions, ...createShipToOptions].map((option) => [
        option.value,
        option
      ])
    );
    return newUser.allowedShipToIds
      .map((id) => optionById.get(id))
      .filter((option): option is ShipToOption => Boolean(option));
  }, [allShipToOptions, createShipToOptions, newUser.allowedShipToIds]);

  const groupSelectOptions = useMemo<SingleOption[]>(
    () => GROUP_OPTIONS.map((group) => ({ value: group, label: group })),
    []
  );

  const companySelectOptions = useMemo<SingleOption[]>(
    () =>
      companies.map((company) => ({ value: company.id, label: company.name })),
    [companies]
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

  const SELECT_MENU_PROPS = useMemo(
    () => ({
      menuPortalTarget: document.body,
      menuPosition: 'fixed' as const,
      styles: selectStyles
    }),
    [selectStyles]
  );

  const currentPreset = useMemo(() => {
    const current = JSON.stringify(normalizeMatrix(linePermissionMatrix));
    const standard = JSON.stringify(
      normalizeMatrix(createStandardLinePermissionMatrix())
    );
    const strict = JSON.stringify(
      normalizeMatrix(createStrictLinePermissionMatrix())
    );

    if (current === standard) return 'STANDARD';
    if (current === strict) return 'STRICT';
    return 'CUSTOM';
  }, [linePermissionMatrix]);

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return users;

    return users.filter((user) => {
      const companyName =
        companies.find((company) => company.id === user.companyId)?.name || '';
      const shipToNames = masterData.shipTos
        .filter((shipTo) => user.allowedShipToIds.includes(shipTo.id))
        .map((shipTo) => shipTo.name)
        .join(' ');
      const docs = user.allowedDocumentTypes.join(' ');

      const searchable = [
        user.username,
        user.userGroup,
        companyName,
        user.shipToAccess,
        shipToNames,
        docs,
        user.canCreateOrder ? 'enabled' : 'disabled'
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }, [companies, masterData.shipTos, searchTerm, users]);

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = useMemo(
    () =>
      filteredUsers.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [filteredUsers, currentPage]
  );
  const editingUser = useMemo(
    () => users.find((user) => user.id === editingUserId) || null,
    [users, editingUserId]
  );
  const editingDraft = editingUserId ? editingUsers[editingUserId] : undefined;
  const editingUserShipToOptions = allShipToOptions;

  const editingSelectedShipToOptions = useMemo(() => {
    if (!editingDraft) return [] as ShipToOption[];
    const optionById = new Map(
      [...allShipToOptions, ...editingUserShipToOptions].map((option) => [
        option.value,
        option
      ])
    );
    return editingDraft.allowedShipToIds
      .map((id) => optionById.get(id))
      .filter((option): option is ShipToOption => Boolean(option));
  }, [editingDraft, editingUserShipToOptions, allShipToOptions]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleApplyPreset = (preset: 'STANDARD' | 'STRICT') => {
    applyLinePermissionPreset(preset);
    setLinePermissionLocked(true);
    Swal.fire({
      icon: 'success',
      title: `${preset} applied`,
      timer: 1200,
      showConfirmButton: false
    });
  };

  const handleResetDefault = () => {
    resetLinePermissionMatrix();
    setLinePermissionLocked(false);
    Swal.fire({
      icon: 'success',
      title: 'Matrix reset',
      timer: 1200,
      showConfirmButton: false
    });
  };

  const handleToggleLock = () => {
    const nextLocked = !linePermissionLocked;
    setLinePermissionLocked(nextLocked);
    Swal.fire({
      icon: 'success',
      title: nextLocked ? 'Matrix locked' : 'Matrix unlocked',
      timer: 1000,
      showConfirmButton: false
    });
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Preset name required',
        text: 'Please enter preset name before saving'
      });
      return;
    }

    const saved = saveLinePermissionCustomPreset(presetName);
    if (!saved) {
      Swal.fire({
        icon: 'error',
        title: 'Cannot save preset',
        text: 'Preset name is duplicated or invalid'
      });
      return;
    }

    setPresetName('');
    Swal.fire({
      icon: 'success',
      title: 'Preset saved',
      timer: 1000,
      showConfirmButton: false
    });
  };

  const handleApplyCustomPreset = (presetId: string, presetName: string) => {
    const applied = applyLinePermissionCustomPreset(presetId);
    if (!applied) {
      Swal.fire({
        icon: 'error',
        title: 'Preset not found'
      });
      return;
    }

    setLinePermissionLocked(false);
    Swal.fire({
      icon: 'success',
      title: 'Preset applied',
      timer: 1000,
      showConfirmButton: false
    });
  };

  const handleDeleteCustomPreset = (presetId: string, presetName: string) => {
    deleteLinePermissionCustomPreset(presetId);
    Swal.fire({
      icon: 'success',
      title: 'Preset deleted',
      timer: 1000,
      showConfirmButton: false
    });
  };

  const handleCreate = () => {
    if (!newUser.username.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Username required',
        text: 'Please enter username'
      });
      return;
    }

    if (
      users.some(
        (user) => user.username.toLowerCase() === newUser.username.toLowerCase()
      )
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Username already exists',
        text: 'Please use another username'
      });
      return;
    }

    if (
      newUser.shipToAccess === 'SELECTED' &&
      newUser.allowedShipToIds.length === 0
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Ship-to required',
        text: 'Please select at least one ship-to or use ALL'
      });
      return;
    }

    addUser(newUser);
    setShowAddModal(false);
    setNewUser({
      username: '',
      role: deriveRoleFromGroup(UserGroup.UEC_SALE),
      userGroup: UserGroup.UEC_SALE,
      companyId:
        companies.find((company) => company.id === DEFAULT_UBE_JAPAN_COMPANY_ID)
          ?.id ||
        companies[0]?.id ||
        'C001',
      canCreateOrder: true,
      shipToAccess: 'ALL',
      allowedShipToIds: [],
      allowedDocumentTypes: Object.values(DocumentType)
    });
  };

  const handleDeleteUser = (userId: string, username: string) => {
    if (currentUser?.id === userId) {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot delete current login user',
        text: 'Please login with another account to delete this user.'
      });
      return;
    }

    deleteUser(userId);
    Swal.fire({
      icon: 'success',
      title: 'User deleted',
      timer: 1000,
      showConfirmButton: false
    });
  };

  const updateDraftForUser = (
    user: User,
    updater: (current: UserEditDraft) => UserEditDraft
  ) => {
    setEditingUsers((state) => {
      const current = state[user.id] || createDraftFromUser(user);
      return {
        ...state,
        [user.id]: updater(current)
      };
    });
  };

  const startEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditingUsers((state) => ({
      ...state,
      [user.id]: state[user.id] || createDraftFromUser(user)
    }));
  };

  const handleCancelUserEdit = (userId: string) => {
    setEditingUsers((state) => {
      const { [userId]: _, ...rest } = state;
      return rest;
    });
    setEditingUserId((current) => (current === userId ? null : current));
  };

  const handleSaveUserEdit = (user: User, draft: UserEditDraft) => {
    if (
      draft.shipToAccess === 'SELECTED' &&
      draft.allowedShipToIds.length === 0
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Ship-to required',
        text: 'Please select at least one ship-to or use ALL'
      });
      return;
    }

    updateUser(user.id, {
      userGroup: draft.userGroup,
      role: deriveRoleFromGroup(draft.userGroup),
      companyId: draft.companyId,
      canCreateOrder: draft.canCreateOrder,
      shipToAccess: draft.shipToAccess,
      allowedShipToIds: draft.allowedShipToIds,
      allowedDocumentTypes: draft.allowedDocumentTypes
    });

    handleCancelUserEdit(user.id);
    setEditingUserId(null);
    Swal.fire({
      icon: 'success',
      title: 'User updated',
      timer: 1000,
      showConfirmButton: false
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ui-page-title">User Management</h1>
          <p className="ui-page-subtitle">
            Configure user group, company/agent, ship-to and per-user
            create-order permission.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 ui-radius-control text-sm font-bold hover:bg-indigo-700 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {showAddModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40">
            <div className="w-full max-w-5xl bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl overflow-visible">
              <div className="flex items-center justify-between">
                <h2 className="ui-subheader text-slate-900 dark:text-white">
                  Add User
                </h2>
                <ActionIconButton
                  onClick={() => setShowAddModal(false)}
                  tone="slate"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </ActionIconButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="ui-form-label">Username</label>
                  <input
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        username: e.target.value
                      }))
                    }
                    className="shadcn-input h-10 text-sm w-full"
                    placeholder="Username"
                  />
                </div>

                <div className="space-y-1">
                  <label className="ui-form-label">Group</label>
                  <Select
                    options={groupSelectOptions}
                    value={groupSelectOptions.find(
                      (option) => option.value === newUser.userGroup
                    )}
                    onChange={(option: SingleValue<SingleOption>) => {
                      if (!option) return;
                      setNewUser((prev) => ({
                        ...prev,
                        userGroup: option.value as UserGroup,
                        role: deriveRoleFromGroup(option.value as UserGroup)
                      }));
                    }}
                    classNamePrefix="user-group"
                    {...SELECT_MENU_PROPS}
                  />
                </div>

                <div className="space-y-1">
                  <label className="ui-form-label">Company / Agent</label>
                  <Select
                    options={companySelectOptions}
                    value={companySelectOptions.find(
                      (option) => option.value === newUser.companyId
                    )}
                    onChange={(option: SingleValue<SingleOption>) => {
                      if (!option) return;
                      setNewUser((prev) => ({
                        ...prev,
                        companyId: option.value,
                        allowedShipToIds: []
                      }));
                    }}
                    classNamePrefix="company-single"
                    {...SELECT_MENU_PROPS}
                  />
                </div>

                <div className="space-y-1">
                  <label className="ui-form-label">Ship-to Access</label>
                  <Select
                    options={SHIP_TO_ACCESS_OPTIONS}
                    value={SHIP_TO_ACCESS_OPTIONS.find(
                      (option) => option.value === newUser.shipToAccess
                    )}
                    onChange={(option: SingleValue<AccessOption>) =>
                      setNewUser((prev) => ({
                        ...prev,
                        shipToAccess: normalizeShipToAccess(option?.value),
                        allowedShipToIds:
                          normalizeShipToAccess(option?.value) === 'ALL'
                            ? []
                            : prev.allowedShipToIds
                      }))
                    }
                    classNamePrefix="shipto-access"
                    {...SELECT_MENU_PROPS}
                  />
                </div>

                <div className="space-y-1">
                  <label className="ui-form-label">Create Order</label>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 h-10">
                    <input
                      type="checkbox"
                      checked={newUser.canCreateOrder}
                      onChange={(e) =>
                        setNewUser((prev) => ({
                          ...prev,
                          canCreateOrder: e.target.checked
                        }))
                      }
                    />
                    Enabled
                  </label>
                </div>
              </div>

              {newUser.shipToAccess === 'SELECTED' && (
                <div className="space-y-1">
                  <label className="ui-form-label">Allowed Ship-to</label>
                  <Select
                    isMulti
                    options={createShipToOptions}
                    value={createSelectedShipToOptions}
                    onChange={(selected: MultiValue<ShipToOption>) =>
                      setNewUser((prev) => ({
                        ...prev,
                        allowedShipToIds: selected.map((option) => option.value)
                      }))
                    }
                    placeholder="Select ship-to"
                    classNamePrefix="shipto-multi"
                    {...SELECT_MENU_PROPS}
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
                  onClick={handleCreate}
                  className="bg-indigo-600 text-white px-4 py-2 ui-radius-control text-sm font-bold hover:bg-indigo-700 inline-flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Create User
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {editingUser &&
        editingDraft &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40">
            <div className="w-full max-w-5xl bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl overflow-visible">
              <div className="flex items-center justify-between">
                <h2 className="ui-subheader text-slate-900 dark:text-white">
                  Edit User: {editingUser.username}
                </h2>
                <ActionIconButton
                  onClick={() => handleCancelUserEdit(editingUser.id)}
                  tone="slate"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </ActionIconButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="ui-form-label">Username</label>
                  <input
                    value={editingUser.username}
                    disabled
                    className="shadcn-input h-10 text-sm w-full bg-slate-100 dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="ui-form-label">Group</label>
                  <Select
                    options={groupSelectOptions}
                    value={groupSelectOptions.find(
                      (option) => option.value === editingDraft.userGroup
                    )}
                    onChange={(option: SingleValue<SingleOption>) => {
                      if (!option) return;
                      updateDraftForUser(editingUser, (current) => ({
                        ...current,
                        userGroup: option.value as UserGroup
                      }));
                    }}
                    classNamePrefix="user-group"
                    {...SELECT_MENU_PROPS}
                  />
                </div>

                <div className="space-y-1">
                  <label className="ui-form-label">Company / Agent</label>
                  <Select
                    options={companySelectOptions}
                    value={companySelectOptions.find(
                      (option) => option.value === editingDraft.companyId
                    )}
                    onChange={(option: SingleValue<SingleOption>) => {
                      if (!option) return;
                      updateDraftForUser(editingUser, (current) => ({
                        ...current,
                        companyId: option.value,
                        allowedShipToIds: []
                      }));
                    }}
                    classNamePrefix="company-single"
                    {...SELECT_MENU_PROPS}
                  />
                </div>

                <div className="space-y-1">
                  <label className="ui-form-label">Ship-to Access</label>
                  <Select
                    options={SHIP_TO_ACCESS_OPTIONS}
                    value={SHIP_TO_ACCESS_OPTIONS.find(
                      (option) => option.value === editingDraft.shipToAccess
                    )}
                    onChange={(option: SingleValue<AccessOption>) =>
                      updateDraftForUser(editingUser, (current) => ({
                        ...current,
                        shipToAccess: normalizeShipToAccess(option?.value),
                        allowedShipToIds:
                          normalizeShipToAccess(option?.value) === 'ALL'
                            ? []
                            : current.allowedShipToIds
                      }))
                    }
                    classNamePrefix="shipto-access"
                    {...SELECT_MENU_PROPS}
                  />
                </div>

                <div className="space-y-1">
                  <label className="ui-form-label">Create Order</label>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 h-10">
                    <input
                      type="checkbox"
                      checked={editingDraft.canCreateOrder}
                      onChange={(e) =>
                        updateDraftForUser(editingUser, (current) => ({
                          ...current,
                          canCreateOrder: e.target.checked
                        }))
                      }
                    />
                    Enabled
                  </label>
                </div>
              </div>

              {editingDraft.shipToAccess === 'SELECTED' && (
                <div className="space-y-1">
                  <label className="ui-form-label">Allowed Ship-to</label>
                  <Select
                    isMulti
                    options={editingUserShipToOptions}
                    value={editingSelectedShipToOptions}
                    onChange={(selected: MultiValue<ShipToOption>) =>
                      updateDraftForUser(editingUser, (current) => ({
                        ...current,
                        allowedShipToIds: selected.map((option) => option.value)
                      }))
                    }
                    placeholder="Select ship-to"
                    classNamePrefix="shipto-multi"
                    {...SELECT_MENU_PROPS}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="ui-form-label">Allowed Documents</label>
                <div className="flex flex-wrap gap-1.5 max-w-[420px]">
                  {Object.values(DocumentType).map((docType) => {
                    const enabled =
                      editingDraft.allowedDocumentTypes.includes(docType);
                    return (
                      <button
                        key={`edit-doc-${docType}`}
                        onClick={() => {
                          const next = enabled
                            ? editingDraft.allowedDocumentTypes.filter(
                                (type) => type !== docType
                              )
                            : [...editingDraft.allowedDocumentTypes, docType];
                          updateDraftForUser(editingUser, (current) => ({
                            ...current,
                            allowedDocumentTypes: next
                          }));
                        }}
                        className={`px-2 py-1 rounded ui-micro-text font-bold border ${
                          enabled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {docType}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => handleCancelUserEdit(editingUser.id)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 ui-radius-control text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveUserEdit(editingUser, editingDraft)}
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
              placeholder="Search user, group, company/agent, ship-to, docs..."
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm ui-table-standard">
            <thead className="bg-slate-50 dark:bg-slate-950/50 ui-table-head border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Group</th>
                <th className="px-4 py-3 text-left w-36">Company / Agent</th>
                <th className="px-4 py-3 text-left w-32">Create Order</th>
                <th className="px-4 py-3 text-left w-54">Ship-to</th>
                <th className="px-4 py-3 text-left">Docs</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pagedUsers.map((user) => {
                const selectedShipToNames = masterData.shipTos
                  .filter((shipTo) => user.allowedShipToIds.includes(shipTo.id))
                  .map((shipTo) => shipTo.name)
                  .join(', ');
                return (
                  <tr key={user.id} className="align-top">
                    <td className="px-4 py-4 font-bold text-slate-900 dark:text-white">
                      {user.username}
                    </td>
                    <td className="px-4 py-4">
                      <span className="ui-micro-text font-semibold text-slate-700 dark:text-slate-300">
                        {user.userGroup}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="ui-micro-text font-semibold text-slate-700 dark:text-slate-300">
                        {companies.find(
                          (company) => company.id === user.companyId
                        )?.name || user.companyId}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 rounded ui-micro-text font-bold border ${
                          user.canCreateOrder
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {user.canCreateOrder ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-4 space-y-2">
                      <div className="space-y-1">
                        <span className="ui-micro-text font-semibold text-slate-700 dark:text-slate-300">
                          {user.shipToAccess}
                        </span>
                        {user.shipToAccess === 'SELECTED' && (
                          <p className="ui-micro-text text-slate-500 dark:text-slate-400">
                            {selectedShipToNames || '-'}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[260px]">
                        {user.allowedDocumentTypes.map((docType) => (
                          <span
                            key={`${user.id}-${docType}`}
                            className="px-2 py-1 rounded ui-micro-text font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                          >
                            {docType}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <ActionIconButton
                          onClick={() => startEditUser(user)}
                          tone="indigo"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </ActionIconButton>
                        <ActionIconButton
                          onClick={() =>
                            handleDeleteUser(user.id, user.username)
                          }
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
              {pagedUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-slate-500 dark:text-slate-400"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <span>
            Showing{' '}
            {pagedUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-
            {(currentPage - 1) * PAGE_SIZE + pagedUsers.length} of{' '}
            {filteredUsers.length}
          </span>
          <div className="inline-flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 ui-radius-control border border-slate-300 dark:border-slate-700 disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 ui-radius-control border border-slate-300 dark:border-slate-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Line Permission Matrix
                </h2>
                <span
                  className={`px-2 py-0.5 rounded ui-micro-text font-bold border ${
                    currentPreset === 'STANDARD'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
                      : currentPreset === 'STRICT'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
                        : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                  }`}
                >
                  {currentPreset}
                </span>
                {linePermissionLocked && (
                  <span className="px-2 py-0.5 rounded ui-micro-text font-bold border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800">
                    LOCK
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure which user groups can move each line status step.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApplyPreset('STANDARD')}
                className="px-3 py-1.5 ui-radius-control text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 dark:hover:bg-indigo-900/50"
              >
                Apply Standard
              </button>
              <button
                onClick={() => handleApplyPreset('STRICT')}
                className="px-3 py-1.5 ui-radius-control text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-900/50"
              >
                Apply Strict
              </button>
              <button
                onClick={handleToggleLock}
                className={`px-3 py-1.5 ui-radius-control text-xs font-bold border ${
                  linePermissionLocked
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800 dark:hover:bg-rose-900/50'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/50'
                } inline-flex items-center gap-1.5`}
              >
                {linePermissionLocked ? (
                  <Unlock className="w-3.5 h-3.5" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                {linePermissionLocked ? 'Unlock Matrix' : 'Lock Matrix'}
              </button>
              <button
                onClick={handleResetDefault}
                className="px-3 py-1.5 ui-radius-control text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Default
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="shadcn-input h-9 text-xs w-full md:w-aut"
                placeholder="Custom preset name"
              />

              <button
                onClick={handleSavePreset}
                className="bg-indigo-600 text-white px-4 py-2 ui-radius-control text-sm font-bold hover:bg-indigo-700 inline-flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>

            {linePermissionCustomPresets.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {linePermissionCustomPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-1.5 px-2 py-1 ui-radius-control border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60"
                  >
                    <span className="ui-micro-text font-bold text-slate-700 dark:text-slate-200">
                      {preset.name}
                    </span>
                    <button
                      onClick={() =>
                        handleApplyCustomPreset(preset.id, preset.name)
                      }
                      className="px-1.5 py-0.5 rounded ui-micro-text font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 dark:hover:bg-indigo-900/50"
                    >
                      Apply
                    </button>
                    <ActionIconButton
                      onClick={() =>
                        handleDeleteCustomPreset(preset.id, preset.name)
                      }
                      tone="rose"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </ActionIconButton>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm ui-table-standard">
            <thead className="bg-slate-50 dark:bg-slate-950/40 ui-table-head">
              <tr>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Transition</th>
                <th className="px-4 py-3 text-left">Allowed Groups</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {linePermissionMatrix.map((item) => (
                <tr key={item.action} className="align-top">
                  <td className="px-4 py-4 text-xs font-bold text-slate-900 dark:text-white">
                    {item.action}
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400">
                    {formatStatusLabel(item.fromStatus)} →{' '}
                    {formatStatusLabel(item.toStatus)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-[360px]">
                      {Object.values(UserGroup).map((group) => {
                        const active = item.allowedUserGroups.includes(group);
                        return (
                          <button
                            key={`${item.action}-${group}`}
                            disabled={linePermissionLocked}
                            onClick={() =>
                              updateLinePermission(item.action as LineAction, {
                                allowedUserGroups: active
                                  ? item.allowedUserGroups.filter(
                                      (value) => value !== group
                                    )
                                  : [...item.allowedUserGroups, group]
                              })
                            }
                            className={`px-2 py-1 rounded ui-micro-text font-bold border ${
                              active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {group}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
