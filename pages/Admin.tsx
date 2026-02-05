import React, { useState } from 'react';
import { useStore } from '../store';
import { Role, DocumentType } from '../types';
import { UserCog, Shield, Check, X, User, Plus, UserPlus } from 'lucide-react';
import Swal from 'sweetalert2';

export const Admin: React.FC = () => {
  const { users, updateUserPermissions, addActivity, addUser, companies } =
    useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    role: Role.SALE,
    customerCompanyId: '',
    allowedDocumentTypes: [] as DocumentType[]
  });

  const togglePermission = (
    userId: string,
    currentPerms: DocumentType[],
    type: DocumentType
  ) => {
    const newPerms = currentPerms.includes(type)
      ? currentPerms.filter((t) => t !== type)
      : [...currentPerms, type];

    updateUserPermissions(userId, newPerms);
    addActivity(
      'Update Permissions',
      'Admin',
      `Updated document permissions for user ${userId}`
    );
  };

  const handleAddUser = () => {
    if (!newUser.username.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Username Required',
        text: 'Please enter a username',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }

    if (
      users.some(
        (u) => u.username.toLowerCase() === newUser.username.toLowerCase()
      )
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Username Exists',
        text: 'This username is already taken',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }

    addUser(newUser);
    Swal.fire({
      icon: 'success',
      title: 'User Created',
      text: `User ${newUser.username} has been created successfully`,
      timer: 2000,
      showConfirmButton: false
    });

    setNewUser({
      username: '',
      role: Role.SALE,
      customerCompanyId: '',
      allowedDocumentTypes: []
    });
    setShowAddForm(false);
  };

  const toggleNewUserPermission = (type: DocumentType) => {
    setNewUser((prev) => ({
      ...prev,
      allowedDocumentTypes: prev.allowedDocumentTypes.includes(type)
        ? prev.allowedDocumentTypes.filter((t) => t !== type)
        : [...prev.allowedDocumentTypes, type]
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            User Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Manage user access and document viewing permissions.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg"
        >
          <UserPlus size={18} />
          Add User
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <UserCog className="text-slate-400 dark:text-slate-500" size={18} />
          <h2 className="font-bold text-slate-900 dark:text-white">
            Permission Matrix
          </h2>
        </div>

        {showAddForm && (
          <div className="p-6 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-3xl space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus size={16} className="text-indigo-600" />
                New User Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser({ ...newUser, username: e.target.value })
                    }
                    className="shadcn-input h-10 text-sm w-full"
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                    Role *
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value as Role })
                    }
                    className="shadcn-input h-10 text-sm w-full"
                  >
                    {Object.values(Role).map((role) => (
                      <option key={role} value={role}>
                        {role.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {(newUser.role === Role.MAIN_TRADER ||
                  newUser.role === Role.UBE_JAPAN) && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                      Customer Company
                    </label>
                    <select
                      value={newUser.customerCompanyId}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          customerCompanyId: e.target.value
                        })
                      }
                      className="shadcn-input h-10 text-sm w-full"
                    >
                      <option value="">Select Company</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                  Document Permissions
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(DocumentType).map((docType) => {
                    const isAllowed =
                      newUser.allowedDocumentTypes.includes(docType);
                    return (
                      <button
                        key={docType}
                        onClick={() => toggleNewUserPermission(docType)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          isAllowed
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {isAllowed ? (
                          <Check
                            size={12}
                            className="text-emerald-600 dark:text-emerald-400"
                          />
                        ) : (
                          <X size={12} className="text-slate-400" />
                        )}
                        {docType}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddUser}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  <Check size={14} />
                  Create User
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewUser({
                      username: '',
                      role: Role.SALE,
                      customerCompanyId: '',
                      allowedDocumentTypes: []
                    });
                  }}
                  className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left">Username</th>
                <th className="px-6 py-4 text-left">Role</th>
                <th className="px-6 py-4 text-left">Allowed Document Types</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 text-xs">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {user.username}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 uppercase">
                      <User size={12} />
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {Object.values(DocumentType).map((docType) => {
                        const isAllowed =
                          user.allowedDocumentTypes.includes(docType);
                        return (
                          <button
                            key={docType}
                            onClick={() =>
                              togglePermission(
                                user.id,
                                user.allowedDocumentTypes,
                                docType
                              )
                            }
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              isAllowed
                                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {isAllowed ? (
                              <Check
                                size={12}
                                className="text-emerald-600 dark:text-emerald-400"
                              />
                            ) : (
                              <X size={12} className="text-slate-400" />
                            )}
                            {docType}
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
