import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { Address } from '../types';
import api from '../services/api';

interface AddressFormData {
  label: string;
  line1: string;
  city: string;
  pincode: string;
  lat?: number;
  lng?: number;
}

const AddressManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<AddressFormData>({
    label: '',
    line1: '',
    city: '',
    pincode: '',
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ addresses: Address[] }>('/addresses');
      setAddresses(response.data.addresses || []);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load addresses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      if (editingId) {
        await api.put(`/addresses/${editingId}`, formData);
        showToast('Address updated successfully', 'success');
      } else {
        await api.post('/addresses', formData);
        showToast('Address added successfully', 'success');
      }

      resetForm();
      await fetchAddresses();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save address', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (address: Address) => {
    setFormData({
      label: address.label,
      line1: address.line1,
      city: address.city,
      pincode: address.pincode,
      lat: address.lat,
      lng: address.lng,
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      await api.delete(`/addresses/${id}`);
      showToast('Address deleted successfully', 'success');
      await fetchAddresses();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete address', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      label: '',
      line1: '',
      city: '',
      pincode: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-8">
          <button
            onClick={() => navigate('/user/dashboard')}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center font-medium transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-bold text-primary-900">Manage Addresses</h1>
              <p className="text-secondary-500 mt-2">Add and manage your delivery addresses</p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add New Address
              </button>
            )}
          </div>
        </div>

        {/* Address Form */}
        {showForm && (
          <div className="card bg-white p-6 mb-8 animate-slide-up">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6 border-b border-secondary-100 pb-2">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Label *
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="e.g., Home, Office"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="e.g., 560001"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Address Line *
                </label>
                <input
                  type="text"
                  value={formData.line1}
                  onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                  placeholder="House/Flat No., Street Name"
                  className="input-field"
                  required
                />
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g., Bangalore"
                  className="input-field"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary shadow-lg shadow-primary-500/30"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Addresses List */}
        <div className="grid grid-cols-1 gap-4">
          {addresses.length === 0 && !showForm ? (
            <div className="text-center py-16 bg-secondary-50 rounded-2xl border border-dashed border-secondary-300">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-secondary-500 mb-4 font-medium">No addresses saved yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="text-primary-600 hover:text-primary-700 font-bold hover:underline"
              >
                Add your first address →
              </button>
            </div>
          ) : (
            addresses.map((address) => (
              <div
                key={address.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-secondary-200 hover:shadow-md hover:border-primary-200 transition-all group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-secondary-100 text-secondary-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide group-hover:bg-primary-100 group-hover:text-primary-700 transition-colors">
                        {address.label}
                      </span>
                    </div>
                    <p className="text-secondary-900 font-bold text-lg mb-1">{address.line1}</p>
                    <p className="text-secondary-500 text-sm font-medium">
                      {address.city}, {address.pincode}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(address)}
                      className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="p-2 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AddressManagementPage;
