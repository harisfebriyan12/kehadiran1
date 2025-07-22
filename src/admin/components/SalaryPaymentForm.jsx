import React, { useState, useEffect } from 'react';
import Swal from '../../utils/swal';
import { 
  DollarSign, 
  Calendar, 
  CreditCard, 
  Building, 
  User, 
  Send, 
  X, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Clock,
  Briefcase
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

const SalaryPaymentForm = ({ employee, onClose, onPaymentProcessed }) => {
  const [formData, setFormData] = useState({
    amount: employee?.salary || 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'transfer',
    bank_account: employee?.bank_account || '',
    notes: '',
    bonus: 0,
    deductions: 0
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);

  useEffect(() => {
    fetchBanks();
    if (employee?.bank_id) {
      fetchEmployeeBank();
    }
  }, [employee]);

  const fetchBanks = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_info')
        .select('*')
        .eq('is_active', true)
        .order('bank_name');

      if (error) throw error;
      setBanks(data || []);
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  };

  const fetchEmployeeBank = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_info')
        .select('*')
        .eq('id', employee.bank_id)
        .single();

      if (error) throw error;
      setSelectedBank(data);
    } catch (error) {
      console.error('Error fetching employee bank:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const calculateTotalAmount = () => {
    const baseAmount = parseFloat(formData.amount) || 0;
    const bonus = parseFloat(formData.bonus) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    return baseAmount + bonus - deductions;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!employee?.id) {
      setError('Data karyawan tidak valid');
      return;
    }

    const totalAmount = calculateTotalAmount();
    if (totalAmount <= 0) {
      setError('Total pembayaran harus lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create salary payment record
      const paymentData = {
        employee_id: employee.id,
        amount: parseFloat(formData.amount),
        bonus: parseFloat(formData.bonus) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        total_amount: totalAmount,
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        bank_account: formData.bank_account,
        bank_id: employee.bank_id,
        status: 'completed',
        notes: formData.notes,
        created_at: new Date().toISOString(),
        processed_by: (await supabase.auth.getUser()).data.user?.id
      };

      const { data, error } = await supabase
        .from('salary_payments')
        .insert([paymentData])
        .select();

      if (error) throw error;

      // Update employee's last payment date
      await supabase
        .from('profiles')
        .update({ 
          last_salary_payment: formData.payment_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', employee.id);

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Pembayaran Gaji Berhasil',
        html: `
          <div class="text-left">
            <p class="mb-2"><strong>Karyawan:</strong> ${employee.name}</p>
            <p class="mb-2"><strong>Total Dibayar:</strong> ${formatCurrency(totalAmount)}</p>
            <p class="mb-2"><strong>Tanggal:</strong> ${new Date(formData.payment_date).toLocaleDateString('id-ID')}</p>
            <p class="mb-2"><strong>Metode:</strong> ${formData.payment_method === 'transfer' ? 'Transfer Bank' : 'Tunai'}</p>
            ${selectedBank ? `<p class="mb-2"><strong>Bank:</strong> ${selectedBank.bank_name}</p>` : ''}
          </div>
        `,
        confirmButtonText: 'OK',
        confirmButtonColor: '#10b981'
      });

      if (onPaymentProcessed) {
        onPaymentProcessed(data[0]);
      }
      
      onClose();

    } catch (error) {
      console.error('Error processing salary payment:', error);
      setError(error.message || 'Gagal memproses pembayaran gaji');
      
      await Swal.fire({
        icon: 'error',
        title: 'Gagal Memproses Pembayaran',
        text: error.message || 'Terjadi kesalahan saat memproses pembayaran gaji',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (!employee) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Pembayaran Gaji</h2>
                <p className="text-sm opacity-90">{employee.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium">Terjadi Kesalahan</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Employee Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Informasi Karyawan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Nama:</span>
                <span className="font-medium">{employee.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Posisi:</span>
                <span className="font-medium">{employee.position || '-'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Departemen:</span>
                <span className="font-medium">{employee.department || '-'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Gaji Pokok:</span>
                <span className="font-medium">{formatCurrency(employee.salary || 0)}</span>
              </div>
              {selectedBank && (
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Bank:</span>
                  <span className="font-medium">{selectedBank.bank_name}</span>
                </div>
              )}
              {employee.bank_account && (
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">No. Rekening:</span>
                  <span className="font-medium">{employee.bank_account}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gaji Pokok *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="1000"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Pembayaran *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    name="payment_date"
                    value={formData.payment_date}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Bonus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bonus
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    name="bonus"
                    value={formData.bonus}
                    onChange={handleInputChange}
                    min="0"
                    step="1000"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Deductions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Potongan
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    name="deductions"
                    value={formData.deductions}
                    onChange={handleInputChange}
                    min="0"
                    step="1000"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metode Pembayaran *
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="transfer">Transfer Bank</option>
                  <option value="cash">Tunai</option>
                </select>
              </div>

              {/* Bank Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Rekening
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="bank_account"
                    value={formData.bank_account}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nomor rekening"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Catatan tambahan (opsional)"
              />
            </div>

            {/* Total Summary */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-3">Ringkasan Pembayaran</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Gaji Pokok:</span>
                  <span className="font-medium">{formatCurrency(formData.amount)}</span>
                </div>
                {formData.bonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-700">Bonus:</span>
                    <span className="font-medium text-green-600">+{formatCurrency(formData.bonus)}</span>
                  </div>
                )}
                {formData.deductions > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-700">Potongan:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(formData.deductions)}</span>
                  </div>
                )}
                <div className="border-t border-green-200 pt-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-green-900">Total Dibayar:</span>
                    <span className="font-bold text-lg text-green-900">{formatCurrency(calculateTotalAmount())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || calculateTotalAmount() <= 0}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Proses Pembayaran</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SalaryPaymentForm;