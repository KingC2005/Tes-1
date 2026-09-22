import React, { useState } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Wallet,
  Check,
  X,
  UserCheck,
  UserX,
  Shield,
  User
} from 'lucide-react';
import { Member, MemberType, MemberFinancialSummary } from '../types';
import {
  toPersianDigits,
  formatCurrency,
  getTodayJalali
} from '../utils/jalali';

interface MembersViewProps {
  members: Member[];
  memberSummaries: MemberFinancialSummary[];
  onSaveMember: (member: Member) => void;
  onDeleteMember: (memberId: string) => void;
  onViewMemberLedger: (memberId: string) => void;
  currency?: string;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  memberSummaries,
  onSaveMember,
  onDeleteMember,
  onViewMemberLedger,
  currency = 'تومان'
}) => {
  const [filterType, setFilterType] = useState<'all' | 'primary' | 'secondary'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<MemberType>('primary');
  const [formPhone, setFormPhone] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const openAddModal = () => {
    setEditingMember(null);
    setFormName('');
    setFormType('primary');
    setFormPhone('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setFormName(member.name);
    setFormType(member.type);
    setFormPhone(member.phone || '');
    setFormIsActive(member.isActive);
    setIsModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('لطفاً نام عضو را وارد نمایید.');
      return;
    }

    const today = getTodayJalali();
    const memberToSave: Member = {
      id: editingMember ? editingMember.id : `mem-${Date.now()}`,
      name: formName.trim(),
      type: formType,
      phone: formPhone.trim() || undefined,
      isActive: formIsActive,
      joinedDateJalali: editingMember?.joinedDateJalali || today.formatted,
      joinedDateIso: editingMember?.joinedDateIso || today.isoString,
      joinedAt: editingMember ? editingMember.joinedAt : today.formatted
    };

    onSaveMember(memberToSave);
    setIsModalOpen(false);
  };

  const handleToggleActive = (member: Member) => {
    onSaveMember({
      ...member,
      isActive: !member.isActive
    });
  };

  const summaryMap = new Map<string, MemberFinancialSummary>();
  memberSummaries.forEach((s) => summaryMap.set(s.member.id, s));

  const filteredMembers = members.filter((m) => {
    if (filterType === 'primary') return m.type === 'primary';
    if (filterType === 'secondary') return m.type === 'secondary';
    return true;
  });

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              مدیریت اعضای مجموعه ({toPersianDigits(members.length)} نفر)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تفکیک اعضای اصلی (شریک در خریدهای انبار) و اعضای فرعی (مهمان یا تسویه وعده‌ای)
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-sm shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن عضو جدید</span>
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filterType === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          همه اعضا ({toPersianDigits(members.length)})
        </button>
        <button
          onClick={() => setFilterType('primary')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filterType === 'primary'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          اعضای اصلی ({toPersianDigits(members.filter((m) => m.type === 'primary').length)})
        </button>
        <button
          onClick={() => setFilterType('secondary')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filterType === 'secondary'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          اعضای فرعی / مهمان ({toPersianDigits(members.filter((m) => m.type === 'secondary').length)})
        </button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => {
          const summary = summaryMap.get(member.id);
          const balance = summary ? summary.netBalance : 0;
          const isCreditor = balance > 0;
          const isDebtor = balance < 0;

          return (
            <div
              key={member.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between ${
                member.isActive
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50/50 dark:bg-slate-900/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold ${
                        member.type === 'primary'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                      }`}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                          {member.name}
                        </h3>
                        {!member.isActive && (
                          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 px-1.5 py-0.5 rounded-sm">
                            غیرفعال
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            member.type === 'primary'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                              : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900'
                          }`}
                        >
                          {member.type === 'primary' ? 'عضو اصلی' : 'عضو فرعی / مهمان'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(member)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      title="ویرایش"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(member)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        member.isActive
                          ? 'text-emerald-600 hover:text-rose-600'
                          : 'text-slate-400 hover:text-emerald-600'
                      }`}
                      title={member.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                    >
                      {member.isActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {member.phone && (
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    <span className="dir-ltr">{toPersianDigits(member.phone)}</span>
                  </div>
                )}

                {/* Financial overview snippet */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">مانده حساب فعلی</span>
                    <span
                      className={`font-extrabold ${
                        isCreditor
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isDebtor
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {isCreditor && '+'}
                      {formatCurrency(balance, currency)}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 block">وضعیت مالی</span>
                    <span
                      className={`text-[11px] font-bold ${
                        isCreditor
                          ? 'text-emerald-600'
                          : isDebtor
                          ? 'text-rose-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {isCreditor ? 'طلبکار' : isDebtor ? 'بدهکار' : 'تسویه'}
                    </span>
                  </div>
                </div>
              </div>

              {/* View Ledger Button */}
              <div className="mt-3 pt-2">
                <button
                  onClick={() => onViewMemberLedger(member.id)}
                  className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Wallet className="w-3.5 h-3.5 text-blue-600" />
                  <span>مشاهده ریز تراکنش‌ها و دفتر کل</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add / Edit Member */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingMember ? 'ویرایش مشخصات عضو' : 'افزودن عضو جدید'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام و نام خانوادگی *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثلاً: علی احمدی"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نوع عضویت
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('primary')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      formType === 'primary'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <Shield className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    <span>عضو اصلی</span>
                    <span className="block text-[9px] font-normal text-slate-400 mt-0.5">
                      شریک در خرید انبار
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('secondary')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      formType === 'secondary'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <User className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                    <span>عضو فرعی / مهمان</span>
                    <span className="block text-[9px] font-normal text-slate-400 mt-0.5">
                      صرفاً دنگ ناهار مصرفی
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شماره تماس (اختیاری)
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="0912..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isActive" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  عضو فعال در وعده‌های ناهار است
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  ذخیره
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
