import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Order {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Payout {
  id: string;
  partnerId: string;
  orderId: string;
  amountCents: number;
  status: 'PENDING' | 'COMPLETED';
  createdAt: string;
  partner?: Partner;
  order?: Order;
}

const PayoutManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    partnerId: '',
    orderId: '',
    amountCents: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPayouts();
    fetchPartners();
  }, []);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/payouts');
      setPayouts(Array.isArray(response.data) ? response.data : (response.data.payouts || []));
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch payouts');
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const response = await api.get('/admin/users?role=PARTNER');
      setPartners(response.data || []);
    } catch (err) {
      console.error('Failed to fetch partners:', err);
    }
  };

  const openCreateForm = () => {
    setFormData({
      partnerId: '',
      orderId: '',
      amountCents: 0,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.partnerId || !formData.orderId || formData.amountCents <= 0) {
      alert('Please fill in all fields with valid values');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/admin/payouts', formData);
      await fetchPayouts();
      closeForm();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create payout');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (id: string) => {
    if (!confirm('Mark this payout as completed?')) return;

    try {
      await api.put(`/admin/payouts/${id}/complete`);
      await fetchPayouts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to complete payout');
    }
  };

  const formatCurrency = (cents: number) => {
    return `₹${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Payout Management</h1>
          </div>
          <button
            onClick={openCreateForm}
            className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition"
          >
            Create Payout
          </button>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Payouts Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payout ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payout.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payout.partner?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payout.partner?.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payout.orderId.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(payout.amountCents)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payout.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payout.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {payout.status === 'PENDING' && (
                        <button
                          onClick={() => handleComplete(payout.id)}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          Mark Completed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payouts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No payouts found. Click "Create Payout" to add one.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Create Payout</h3>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partner *
                </label>
                <select
                  value={formData.partnerId}
                  onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Select a partner --</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name} - {partner.phone}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order ID *
                </label>
                <input
                  type="text"
                  value={formData.orderId}
                  onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter order ID"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amountCents / 100}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amountCents: Math.round(parseFloat(e.target.value) * 100),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="100.00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Amount in rupees (e.g., 100.00 for ₹100)
                </p>
              </div>
            </form>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                disabled={submitting}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutManagementPage;
