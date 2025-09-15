


import React, { useState, useMemo } from 'react';
import type { Teacher, Permission, TeacherWorkload, RateCard, PayrollRun, TeacherPayrollData } from '../types';
// FIX: Import DocumentTextIcon to resolve missing member error.
import { ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon, ArrowDownTrayIcon, CheckCircleIcon, DocumentTextIcon } from './Icons';
import TabButton from './TabButton';
import PayslipModal from './PayslipModal';
import ConfirmationModal from './ConfirmationModal';

/*
-- SQL for Supabase Setup
-- Run these commands in the Supabase SQL Editor.

-- 1. Create the rate_cards table
CREATE TABLE public.rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_salary NUMERIC(10, 2) NOT NULL,
  rate_per_period NUMERIC(10, 2) NOT NULL,
  rate_per_moderation_hour NUMERIC(10, 2) NOT NULL,
  tax_percentage NUMERIC(5, 2) NOT NULL,
  standard_deductions JSONB DEFAULT '[]'::jsonb
);

-- 2. Alter the teachers table
ALTER TABLE public.teachers
ADD COLUMN rate_card_id UUID REFERENCES public.rate_cards(id),
ADD COLUMN moderation_hours_logged INT DEFAULT 0;

-- 3. Create the payroll_runs table
CREATE TABLE public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  approved_by TEXT NOT NULL,
  total_nett_pay NUMERIC(12, 2) NOT NULL,
  total_cost NUMERIC(12, 2) NOT NULL,
  payroll_data JSONB NOT NULL -- Snapshot of all calculated teacher payroll data
);
*/


interface PayrollProps {
    teachers: Teacher[];
    permissions: Permission[];
    logAction: (action: string, details: string) => void;
    workloads: Map<string, TeacherWorkload>;
    rateCards: RateCard[];
    payrollHistory: PayrollRun[];
    setPayrollHistory: React.Dispatch<React.SetStateAction<PayrollRun[]>>;
    currentUser: Teacher;
    currentTenantId: string;
}

type SortableKey = 'name' | 'nettPay' | 'salaryCost' | 'totalEarnings';
type PayrollTab = 'current' | 'history';

const Payroll: React.FC<PayrollProps> = ({ teachers, permissions, logAction, workloads, rateCards, payrollHistory, setPayrollHistory, currentUser, currentTenantId }) => {
    const [activeTab, setActiveTab] = useState<PayrollTab>('current');
    const [sortConfig, setSortConfig] = useState<{ key: SortableKey, direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });
    const [searchTerm, setSearchTerm] = useState('');
    const [payslipData, setPayslipData] = useState<{ teacher: Teacher, data: TeacherPayrollData } | null>(null);
    const [isConfirmRunModalOpen, setConfirmRunModalOpen] = useState(false);

    const rateCardMap = useMemo(() => new Map(rateCards.map(rc => [rc.id, rc])), [rateCards]);

    // FIX: Refactor to use an explicitly typed variable to resolve a subtle TypeScript type inference issue with the filter predicate.
    const calculatedPayroll: TeacherPayrollData[] = useMemo(() => {
        return teachers
            .map(teacher => {
                const rateCard = teacher.rateCardId ? rateCardMap.get(teacher.rateCardId) : null;
                if (!rateCard) return null;

                const workload = workloads.get(teacher.id);
                const periodsWorked = workload?.totalPeriods || 0;
                const moderationHours = teacher.moderationHoursLogged || 0;

                const variablePay = (periodsWorked * rateCard.ratePerPeriod) + (moderationHours * rateCard.ratePerModerationHour);
                const totalEarnings = rateCard.baseSalary + variablePay;
                const tax = totalEarnings * (rateCard.taxPercentage / 100);
                const otherDeductions = rateCard.standardDeductions.reduce((sum, d) => sum + d.amount, 0);
                const totalDeductions = tax + otherDeductions;
                const nettPay = totalEarnings - totalDeductions;
                const totalCompanyContributions = 0; // Placeholder for things like company pension contribution
                const salaryCost = totalEarnings + totalCompanyContributions;

                const data: TeacherPayrollData = {
                    teacherId: teacher.id,
                    teacherName: teacher.fullName,
                    employeeCode: teacher.employeeCode,
                    rateCardName: rateCard.name,
                    periodsWorked,
                    moderationHours,
                    baseSalary: rateCard.baseSalary,
                    variablePay,
                    totalEarnings,
                    tax,
                    otherDeductions,
                    totalDeductions,
                    nettPay,
                    totalCompanyContributions,
                    salaryCost
                };
                return data;
            })
            .filter((p): p is TeacherPayrollData => p !== null);
    }, [teachers, workloads, rateCardMap]);

    const sortedAndFilteredPayroll = useMemo(() => {
        let filtered = calculatedPayroll.filter(p => p.teacherName.toLowerCase().includes(searchTerm.toLowerCase()));

        if (sortConfig) {
            filtered.sort((a, b) => {
                let aValue: any, bValue: any;
                if (sortConfig.key === 'name') { aValue = a.teacherName; bValue = b.teacherName; }
                else { aValue = a[sortConfig.key]; bValue = b[sortConfig.key]; }
                
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [searchTerm, calculatedPayroll, sortConfig]);
    
    const requestSort = (key: SortableKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortableKey) => {
        if (!sortConfig || sortConfig.key !== key) return <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />;
        return sortConfig.direction === 'ascending' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />;
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
    
    const handleExport = () => {
        const headers = ["Employee Code", "Full Name", "Rate Card", "Base Salary", "Variable Pay", "Total Earnings", "Total Deductions", "Nett Pay", "Total Cost"];
        const rows = sortedAndFilteredPayroll.map(p => [ p.employeeCode || '', `"${p.teacherName}"`, p.rateCardName, p.baseSalary, p.variablePay, p.totalEarnings, p.totalDeductions, p.nettPay, p.salaryCost ].join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `payroll_run_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRunPayroll = () => {
        const totalNettPay = calculatedPayroll.reduce((sum, p) => sum + p.nettPay, 0);
        const totalCost = calculatedPayroll.reduce((sum, p) => sum + p.salaryCost, 0);

        // FIX: Add tenantId to new payroll run object to satisfy the PayrollRun type.
        const newRun: PayrollRun = {
            id: `run-${Date.now()}`,
            runDate: new Date().toISOString(),
            approvedBy: currentUser.fullName,
            payrollData: calculatedPayroll,
            totalNettPay,
            totalCost,
            tenantId: currentTenantId,
        };
        setPayrollHistory(prev => [newRun, ...prev]);
        logAction('run:payroll', `Payroll run for ${formatCurrency(totalCost)} approved.`);
        setConfirmRunModalOpen(false);
    };

    const renderCurrentRun = () => (
         <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
             <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                 <div className="mb-2 sm:mb-0">
                     <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">Current Payroll Run (Calculated)</h3>
                     <p className="text-sm text-gray-500 dark:text-gray-400">Salaries are dynamically calculated based on rate cards and workload data.</p>
                 </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-64 px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-transparent rounded-md text-sm focus:outline-none" />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium"><div onClick={() => requestSort('name')}>Name {getSortIcon('name')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium">Rate Card</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium"><div onClick={() => requestSort('totalEarnings')}>Earnings {getSortIcon('totalEarnings')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium">Deductions</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium"><div onClick={() => requestSort('nettPay')}>Nett Pay {getSortIcon('nettPay')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium"><div onClick={() => requestSort('salaryCost')}>Total Cost {getSortIcon('salaryCost')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                        {sortedAndFilteredPayroll.map(p => {
                            const teacher = teachers.find(t => t.id === p.teacherId);
                            return (
                            <tr key={p.teacherId}>
                                <td className="px-6 py-4 font-medium">{p.teacherName}</td>
                                <td className="px-6 py-4">{p.rateCardName}</td>
                                <td className="px-6 py-4">{formatCurrency(p.totalEarnings)}</td>
                                <td className="px-6 py-4 text-red-600">{formatCurrency(p.totalDeductions)}</td>
                                <td className="px-6 py-4 font-semibold text-green-600">{formatCurrency(p.nettPay)}</td>
                                <td className="px-6 py-4 font-bold">{formatCurrency(p.salaryCost)}</td>
                                <td className="px-6 py-4">
                                    <button onClick={() => teacher && setPayslipData({ teacher, data: p })} className="text-brand-primary hover:text-rose-800" title="View Payslip">
                                        <DocumentTextIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
             <div className="mt-6 flex justify-end gap-2">
                <button onClick={handleExport} className="bg-brand-dark-gray text-white px-4 py-2 text-sm rounded-md font-medium">Export CSV</button>
                <button onClick={() => setConfirmRunModalOpen(true)} className="bg-brand-accent text-white px-4 py-2 text-sm rounded-md font-medium flex items-center gap-2"><CheckCircleIcon className="w-4 h-4" /> Run & Approve Payroll</button>
            </div>
        </div>
    );
    
    const renderHistory = () => (
         <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
             <h3 className="text-lg font-semibold">Payroll History</h3>
             <div className="mt-4 space-y-3">
                 {payrollHistory.map(run => (
                     <div key={run.id} className="p-4 border dark:border-slate-700 rounded-lg flex justify-between items-center">
                         <div>
                             <p className="font-semibold">Run Date: {new Date(run.runDate).toLocaleString()}</p>
                             <p className="text-sm text-gray-500">Approved by: {run.approvedBy}</p>
                         </div>
                         <div>
                             <p className="text-sm">Total Cost: <span className="font-bold">{formatCurrency(run.totalCost)}</span></p>
                             <p className="text-sm">Total Nett Pay: <span className="font-semibold">{formatCurrency(run.totalNettPay)}</span></p>
                         </div>
                     </div>
                 ))}
                 {payrollHistory.length === 0 && <p className="text-center text-gray-500 py-8">No payroll history found.</p>}
             </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="p-1.5 bg-gray-100 dark:bg-slate-800/50 rounded-lg flex flex-wrap gap-1 self-start">
                <TabButton tabId="current" label="Current Run" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                <TabButton tabId="history" label="History" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
            </div>
            {activeTab === 'current' ? renderCurrentRun() : renderHistory()}
            {payslipData && (
                <PayslipModal isOpen={!!payslipData} onClose={() => setPayslipData(null)} teacher={payslipData.teacher} payrollData={payslipData.data} />
            )}
            {isConfirmRunModalOpen && (
                <ConfirmationModal
                    isOpen={isConfirmRunModalOpen}
                    onClose={() => setConfirmRunModalOpen(false)}
                    onConfirm={handleRunPayroll}
                    title="Confirm Payroll Run"
                    message="Are you sure you want to approve and run this payroll? This will create a permanent historical record and cannot be undone."
                    confirmButtonText="Yes, Approve & Run"
                />
            )}
        </div>
    );
};

export default Payroll;
