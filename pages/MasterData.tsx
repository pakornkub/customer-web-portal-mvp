import React, { useState } from 'react';
import { useStore } from '../store';
import {
  Settings,
  Plus,
  Trash2,
  Globe,
  MapPin,
  Package,
  CreditCard,
  X,
  Check
} from 'lucide-react';
import Swal from '../utils/swal';

export const MasterData: React.FC = () => {
  const { masterData, updateMasterData, companies } = useStore();
  const [activeTab, setActiveTab] =
    useState<keyof typeof masterData>('destinations');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    customerCompanyIds: [] as string[]
  });

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete Record?',
      text: 'Are you sure you want to delete this record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    const newData = masterData[activeTab].filter((item) => item.id !== id);
    updateMasterData(activeTab, newData);

    Swal.fire({
      icon: 'success',
      title: 'Deleted',
      text: 'Record has been deleted',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleAdd = () => {
    setIsAddFormOpen(true);
    setFormData({ name: '', customerCompanyIds: [] });
  };

  const handleSubmitAdd = () => {
    if (!formData.name.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Name is required',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }

    if (formData.customerCompanyIds.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'At least one Customer Company is required',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }

    const newItem = {
      id: Math.random().toString(36).substr(2, 5),
      name: formData.name,
      customerCompanyId: formData.customerCompanyIds
    };

    updateMasterData(activeTab, [...masterData[activeTab], newItem]);

    Swal.fire({
      icon: 'success',
      title: 'Added',
      text: `${formData.name} has been added successfully`,
      timer: 1500,
      showConfirmButton: false
    });

    setIsAddFormOpen(false);
    setFormData({ name: '', customerCompanyIds: [] });
  };

  const toggleCompany = (companyId: string) => {
    setFormData((prev) => ({
      ...prev,
      customerCompanyIds: prev.customerCompanyIds.includes(companyId)
        ? prev.customerCompanyIds.filter((id) => id !== companyId)
        : [...prev.customerCompanyIds, companyId]
    }));
  };

  const tabs = [
    { id: 'destinations', label: 'Destinations', icon: Globe },
    { id: 'shipTos', label: 'Ship To', icon: MapPin },
    { id: 'terms', label: 'Terms', icon: CreditCard },
    { id: 'grades', label: 'Grades', icon: Package }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Master Data Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Configure global constants for various customers.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/10 shrink-0"
        >
          <Plus size={18} /> Add Record
        </button>
      </div>

      {/* Add Record Form - Inline like User Management */}
      {isAddFormOpen && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-3xl space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus size={16} className="text-indigo-600" />
                Add New {activeTab}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder={`Enter ${activeTab} name`}
                    className="shadcn-input h-10 text-sm w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                    Customer Scope <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {companies.map((company) => {
                      const isSelected = formData.customerCompanyIds.includes(
                        company.id
                      );
                      return (
                        <button
                          key={company.id}
                          onClick={() => toggleCompany(company.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          {isSelected ? (
                            <Check
                              size={12}
                              className="text-emerald-600 dark:text-emerald-400"
                            />
                          ) : (
                            <X size={12} className="text-slate-400" />
                          )}
                          {company.name} ({company.id})
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSubmitAdd}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  <Check size={14} />
                  Add Record
                </button>
                <button
                  onClick={() => {
                    setIsAddFormOpen(false);
                    setFormData({ name: '', customerCompanyIds: [] });
                  }}
                  className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all relative ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Icon size={18} />
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"></div>
                )}
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left">ID</th>
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 text-left">Customer Scope</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {masterData[activeTab].map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 group transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-xs text-slate-400 dark:text-slate-500">
                    {item.id}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    {item.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(item.customerCompanyId)
                        ? item.customerCompanyId
                        : [item.customerCompanyId]
                      ).map((companyId) => (
                        <span
                          key={companyId}
                          className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded font-bold text-[10px]"
                        >
                          {companyId}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {masterData[activeTab].length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 italic"
                  >
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
