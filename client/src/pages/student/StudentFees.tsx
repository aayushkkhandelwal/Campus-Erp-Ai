import { useState } from 'react';
import { CreditCard, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

export const StudentFees = () => {
  const [paid, setPaid] = useState<boolean>(() => {
    return localStorage.getItem('college_erp_student_fees_paid') === 'true';
  });

  const handlePay = () => {
    localStorage.setItem('college_erp_student_fees_paid', 'true');
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('college_erp_fees_updated'));
    setPaid(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2 font-['Outfit']">
          <CreditCard className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          Fees & Online Payment Portal
        </h1>
        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1">
          Review academic tuition fee structure, payment receipts, and outstanding dues
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-3xl border border-amber-200/80 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <span className="text-xs font-extrabold uppercase tracking-wider text-stone-400">Total Semester Fee</span>
          <div className="text-3xl font-black text-stone-900 dark:text-white mt-1 font-['Outfit']">₹1,20,000</div>
          <p className="text-xs font-semibold text-stone-500 mt-1">Academic Year 2026-2027</p>
        </div>

        <div className="rounded-3xl border border-amber-200/80 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">Amount Paid</span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-['Outfit']">
            {paid ? '₹1,20,000' : '₹90,000'}
          </div>
          <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> {paid ? 'Tuition Fee Fully Paid' : 'First Installment Approved'}
          </p>
        </div>

        <div className="rounded-3xl border border-amber-200/80 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600">Pending Dues</span>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1 font-['Outfit']">
            {paid ? '₹0' : '₹30,000'}
          </div>
          <p className="text-xs font-semibold text-rose-500 mt-1 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {paid ? 'No Dues Remaining' : 'Due by 15 October'}
          </p>
        </div>
      </div>

      {/* Pay Action Card */}
      {!paid ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-6 dark:border-rose-900/50 dark:bg-rose-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-rose-900 dark:text-rose-200 font-['Outfit']">
              Outstanding Second Installment: ₹30,000
            </h3>
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 mt-0.5">
              Avoid late fee surcharges by completing the online payment before the due date.
            </p>
          </div>
          <button
            onClick={handlePay}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-3 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all cursor-pointer whitespace-nowrap"
          >
            <ShieldCheck className="h-4 w-4" /> Pay Pending Dues (₹30,000)
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-900/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          All tuition fees for Semester 5 are fully paid and verified! (Receipt REC-2026-0904 generated)
        </div>
      )}

      {/* Transaction History Table */}
      <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <h3 className="text-base font-black text-stone-900 dark:text-white font-['Outfit'] mb-4">
          Payment History & Receipts
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-amber-100 dark:border-stone-800 text-stone-400 uppercase tracking-wider font-extrabold">
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 dark:divide-stone-800">
              <tr className="hover:bg-amber-50/40 dark:hover:bg-stone-800/40 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">REC-2026-0812</td>
                <td className="py-3.5 px-4 font-extrabold text-stone-900 dark:text-white">Semester 5 - First Installment</td>
                <td className="py-3.5 px-4 font-semibold text-stone-600 dark:text-stone-400">12 August 2026</td>
                <td className="py-3.5 px-4 font-black text-stone-900 dark:text-white">₹90,000</td>
                <td className="py-3.5 px-4">
                  <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">APPROVED</span>
                </td>
              </tr>
              {paid && (
                <tr className="hover:bg-amber-50/40 dark:hover:bg-stone-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">REC-2026-0904</td>
                  <td className="py-3.5 px-4 font-extrabold text-stone-900 dark:text-white">Semester 5 - Second Installment</td>
                  <td className="py-3.5 px-4 font-semibold text-stone-600 dark:text-stone-400">Paid & Verified</td>
                  <td className="py-3.5 px-4 font-black text-stone-900 dark:text-white">₹30,000</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">APPROVED</span>
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

export default StudentFees;
