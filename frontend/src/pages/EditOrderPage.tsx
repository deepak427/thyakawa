import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { Order, Service, Address, Timeslot, DeliveryType } from '../types';
import api from '../services/api';

const EditOrderPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [order, setOrder] = useState<Order | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedTimeslotId, setSelectedTimeslotId] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(DeliveryType.STANDARD);

  useEffect(() => {
    if (orderId) {
      fetchData();
    }
  }, [orderId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderRes, servicesRes, addressesRes, timeslotsRes] = await Promise.all([
        api.get<{ order: Order }>(`/orders/${orderId}`),
        api.get<{ services?: Service[] }>('/services'),
        api.get<{ addresses: Address[] }>('/addresses'),
        api.get<{ timeslots?: Timeslot[] }>('/timeslots'),
      ]);

      const orderData = orderRes.data.order;
      setOrder(orderData);
      setServices(Array.isArray(servicesRes.data) ? servicesRes.data : (servicesRes.data.services || []));

      // Pre-fill form
      const itemsMap: Record<string, number> = {};
      orderData.items?.forEach(item => {
        itemsMap[item.serviceId] = item.quantity;
      });
      setSelectedItems(itemsMap);
      setSelectedAddressId(orderData.addressId);
      setSelectedTimeslotId(orderData.timeslotId);
      setDeliveryType(orderData.deliveryType);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load order', 'error');
      navigate(`/user/orders/${orderId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      const newItems = { ...selectedItems };
      delete newItems[serviceId];
      setSelectedItems(newItems);
    } else {
      setSelectedItems({ ...selectedItems, [serviceId]: quantity });
    }
  };

  const DELIVERY_CHARGES = {
    STANDARD: 0,
    PREMIUM: 5000,
  };

  const calculateSubtotal = () => {
    return Object.entries(selectedItems).reduce((total, [serviceId, quantity]) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.basePriceCents || 0) * quantity;
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + DELIVERY_CHARGES[deliveryType];
  };

  const formatCurrency = (cents: number) => {
    return `₹${(cents / 100).toFixed(2)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (Object.keys(selectedItems).length === 0) {
      showToast('Please select at least one service', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const items = Object.entries(selectedItems).map(([serviceId, quantity]) => ({
        serviceId,
        quantity,
      }));

      await api.put(`/orders/${orderId}`, {
        addressId: selectedAddressId,
        timeslotId: selectedTimeslotId,
        deliveryType,
        items,
      });

      showToast('Order updated successfully!', 'success');
      navigate(`/user/orders/${orderId}`);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update order', 'error');
    } finally {
      setSubmitting(false);
    }
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

  if (!order) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-8">
          <button
            onClick={() => navigate(`/user/orders/${orderId}`)}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center font-medium transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Order
          </button>
          <h1 className="text-4xl font-bold text-primary-900">Edit Order</h1>
          <p className="text-secondary-500 mt-2">Modify your order before pickup</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Services */}
          <div className="card bg-white p-6">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">Services</h2>
            <div className="grid grid-cols-1 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`border rounded-xl p-4 flex justify-between items-center transition ${
                    selectedItems[service.id] ? 'border-primary-500 bg-primary-50/30' : 'border-secondary-200'
                  }`}
                >
                  <div>
                    <p className="font-bold text-secondary-900">{service.name}</p>
                    <p className="text-sm text-secondary-500">{formatCurrency(service.basePriceCents)} per item</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(service.id, (selectedItems[service.id] || 0) - 1)}
                      className="w-8 h-8 rounded-md bg-secondary-100 hover:bg-secondary-200 text-secondary-600"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold">{selectedItems[service.id] || 0}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(service.id, (selectedItems[service.id] || 0) + 1)}
                      className="w-8 h-8 rounded-md bg-primary-600 hover:bg-primary-700 text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Type */}
          <div className="card bg-white p-6">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">Delivery Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`border-2 rounded-xl p-4 cursor-pointer ${deliveryType === 'STANDARD' ? 'border-primary-500 bg-primary-50/30' : 'border-secondary-200'}`}>
                <input
                  type="radio"
                  name="deliveryType"
                  value="STANDARD"
                  checked={deliveryType === DeliveryType.STANDARD}
                  onChange={() => setDeliveryType(DeliveryType.STANDARD)}
                  className="sr-only"
                />
                <div className="font-bold text-secondary-900 mb-1">Standard (48h)</div>
                <div className="text-accent-600 font-bold">FREE</div>
              </label>
              <label className={`border-2 rounded-xl p-4 cursor-pointer ${deliveryType === 'PREMIUM' ? 'border-accent-500 bg-accent-50/30' : 'border-secondary-200'}`}>
                <input
                  type="radio"
                  name="deliveryType"
                  value="PREMIUM"
                  checked={deliveryType === DeliveryType.PREMIUM}
                  onChange={() => setDeliveryType(DeliveryType.PREMIUM)}
                  className="sr-only"
                />
                <div className="font-bold text-secondary-900 mb-1">Premium (24h)</div>
                <div className="text-accent-600 font-bold">₹50</div>
              </label>
            </div>
          </div>

          {/* Price Summary */}
          <div className="card bg-primary-50 border-2 border-primary-200 p-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary-700 font-medium">Subtotal</span>
                <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-700 font-medium">Delivery</span>
                <span className="font-semibold">{deliveryType === 'STANDARD' ? 'FREE' : formatCurrency(DELIVERY_CHARGES.PREMIUM)}</span>
              </div>
              <div className="border-t-2 border-primary-300 pt-3 flex justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-bold text-primary-600">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(`/user/orders/${orderId}`)}
              className="btn-secondary px-6 py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 btn-primary py-3"
            >
              {submitting ? 'Updating...' : 'Update Order'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditOrderPage;
