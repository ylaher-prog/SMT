import React, { useRef } from 'react';
import Modal from './Modal';
import type { Teacher, TeacherPayrollData, RateCard } from '../types';

interface PayslipModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacher: Teacher;
    payrollData: TeacherPayrollData;
}

const PayslipModal: React.FC<PayslipModalProps> = ({ isOpen, onClose, teacher, payrollData }) => {
    const payslipRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const content = payslipRef.current;
        if (!content) return;
        const printWindow = window.open('', '', 'height=800,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Payslip</title>');
            printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
            printWindow.document.write('<style>body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } @page { size: A4; margin: 0; } </style>');
            printWindow.document.write('</head><body class="font-sans">');
            printWindow.document.write(content.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            setTimeout(() => { printWindow.print(); }, 500);
        }
    };
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Payslip: ${teacher.fullName}`} size="lg">
             <div className="bg-gray-100 dark:bg-brand-navy p-4 -m-6 max-h-[calc(90vh-100px)] overflow-y-auto">
                <div ref={payslipRef} className="p-8 bg-white text-gray-800 space-y-6 w-full max-w-[210mm] min-h-[297mm] mx-auto shadow-lg rounded-sm">
                    <header className="flex justify-between items-center border-b-4 border-brand-primary pb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-brand-navy">Payslip</h1>
                            <p className="text-brand-text-light">For month ending: {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
                        </div>
                        <h2 className="text-2xl font-bold text-brand-primary tracking-wider">SMT</h2>
                    </header>

                    <section className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p><strong>To:</strong> {payrollData.teacherName}</p>
                            <p><strong>Employee Code:</strong> {payrollData.employeeCode || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <p><strong>Pay Date:</strong> {new Date().toLocaleDateString('en-GB')}</p>
                            <p><strong>Rate Card:</strong> {payrollData.rateCardName}</p>
                        </div>
                    </section>
                    
                    <section>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 text-left w-2/3">Description</th>
                                    <th className="p-2 text-right">Earnings</th>
                                    <th className="p-2 text-right">Deductions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b"><td className="p-2">Base Salary</td><td className="p-2 text-right">{formatCurrency(payrollData.baseSalary)}</td><td className="p-2 text-right"></td></tr>
                                <tr className="border-b"><td className="p-2">Variable Pay (Periods & Moderation)</td><td className="p-2 text-right">{formatCurrency(payrollData.variablePay)}</td><td className="p-2 text-right"></td></tr>
                                <tr className="border-b"><td className="p-2">Tax (PAYE)</td><td className="p-2 text-right"></td><td className="p-2 text-right">({formatCurrency(payrollData.tax)})</td></tr>
                                <tr className="border-b"><td className="p-2">Other Deductions</td><td className="p-2 text-right"></td><td className="p-2 text-right">({formatCurrency(payrollData.otherDeductions)})</td></tr>
                            </tbody>
                            <tfoot className="font-bold">
                                 <tr className="border-b-2 border-gray-400">
                                     <td className="p-2 text-right">Total</td>
                                     <td className="p-2 text-right">{formatCurrency(payrollData.totalEarnings)}</td>
                                     <td className="p-2 text-right">({formatCurrency(payrollData.totalDeductions)})</td>
                                 </tr>
                                 <tr>
                                     <td colSpan={2} className="p-2 text-right text-lg">Nett Pay</td>
                                     <td className="p-2 text-right text-lg">{formatCurrency(payrollData.nettPay)}</td>
                                 </tr>
                            </tfoot>
                        </table>
                    </section>
                </div>
            </div>
             <div className="flex justify-end gap-3 p-4 bg-white dark:bg-slate-800 border-t dark:border-slate-700">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-5 py-2.5 rounded-md font-semibold hover:bg-gray-300 text-sm dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500">Close</button>
                <button type="button" onClick={handlePrint} className="bg-brand-primary text-white px-5 py-2.5 rounded-md font-semibold hover:bg-rose-900 text-sm">Print / Save as PDF</button>
            </div>
        </Modal>
    );
};

export default PayslipModal;
