import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { Address, Service, Timeslot, Wallet } from '../types';
import api from '../services/api';

interface OrderItem {
  serviceId: string;
  quantity: number;
}

const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data
  const [services, setServices] = useState<Service[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  // Form data
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedTimeslotId, setSelectedTimeslotId] = useState('');
  const [deliveryType, setDeliveryType] = useState<'STANDARD' | 'PREMIUM'>('STANDARD');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [servicesRes, addressesRes, walletRes] = await Promise.all([
        api.get<{ services?: Service[] }>('/services'),
        api.get<{ addresses: Address[] }>('/addresses'),
        api.get<{ wallet: Wallet }>('/wallet'),
      ]);
      setServices(Array.isArray(servicesRes.data) ? servicesRes.data : (servicesRes.data.services || []));
      setAddresses(addressesRes.data.addresses || []);
      setWallet(walletRes.data.wallet);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeslots = async () => {
    try {
      const response = await api.get<{ timeslots?: Timeslot[] }>('/timeslots');
      const timeslotsData = Array.isArray(response.data) ? response.data : (response.data.timeslots || []);
      // Filter available timeslots
      const available = timeslotsData.filter(t => t.remainingCapacity > 0);
      setTimeslots(available);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load timeslots', 'error');
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
    PREMIUM: 5000, // ₹50
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

  const getEstimatedDeliveryTime = () => {
    const now = new Date();
    const hours = deliveryType === 'PREMIUM' ? 24 : 48;
    const deliveryDate = new Date(now.getTime() + hours * 60 * 60 * 1000);
    return deliveryDate;
  };

  const formatCurrency = (cents: number) => {
    return `₹${(cents / 100).toFixed(2)}`;
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (Object.keys(selectedItems).length === 0) {
        showToast('Please select at least one service', 'error');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedAddressId) {
        showToast('Please select a delivery address', 'error');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      await fetchTimeslots();
      setStep(4);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTimeslotId) {
      showToast('Please select a timeslot', 'error');
      return;
    }

    const total = calculateTotal();
    if (wallet && total > wallet.balanceCents) {
      showToast(`Insufficient balance. You need ${formatCurrency(total)} but have ${formatCurrency(wallet.balanceCents)}`, 'error');
      return;
    }

    try {
      setSubmitting(true);

      const items: OrderItem[] = Object.entries(selectedItems).map(([serviceId, quantity]) => ({
        serviceId,
        quantity,
      }));

      // Get centerId from selected timeslot
      const selectedTimeslot = timeslots.find(t => t.id === selectedTimeslotId);

      const response = await api.post('/orders', {
        addressId: selectedAddressId,
        centerId: selectedTimeslot?.centerId,
        timeslotId: selectedTimeslotId,
        deliveryType,
        items,
      });

      showToast('Order placed successfully!', 'success');
      navigate(`/user/orders/${response.data.id}`);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to create order', 'error');
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
          <h1 className="text-4xl font-bold text-primary-900">Create New Order</h1>
          <p className="text-secondary-500 mt-2">Follow the steps to place your order</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-10">
          <div className="relative flex items-center justify-between z-0">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-secondary-200 -z-10 rounded-full" />
            <div
              className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-primary-500 -z-10 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex flex-col items-center bg-gray-50 px-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${s <= step
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 scale-110'
                      : 'bg-white border-2 border-secondary-300 text-secondary-400'
                    }`}
                >
                  {s < step ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s}
                </div>
                <span className={`mt-2 text-sm font-medium transition-colors duration-300 ${s <= step ? 'text-primary-700' : 'text-secondary-400'
                  }`}>
                  {s === 1 ? 'Services' : s === 2 ? 'Address' : s === 3 ? 'Delivery' : 'Timeslot'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Select Services */}
        {step === 1 && (
          <div className="card bg-white p-6 animate-slide-up">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">Select Services</h2>
            <div className="grid grid-cols-1 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`border rounded-xl p-4 flex justify-between items-center transition-all duration-200 ${selectedItems[service.id]
                      ? 'border-primary-500 bg-primary-50/30 shadow-sm'
                      : 'border-secondary-200 hover:border-primary-300 hover:shadow-sm'
                    }`}
                >
                  <div>
                    <p className="font-bold text-secondary-900 text-lg">{service.name}</p>
                    <p className="text-sm text-secondary-500 font-medium">{formatCurrency(service.basePriceCents)} per item</p>
                  </div>
                  <div className="flex items-center gap-4 bg-white rounded-lg p-1 border border-secondary-200 shadow-sm">
                    <button
                      onClick={() => handleQuantityChange(service.id, (selectedItems[service.id] || 0) - 1)}
                      className="w-8 h-8 rounded-md bg-secondary-100 hover:bg-secondary-200 text-secondary-600 flex items-center justify-center transition-colors"
                      disabled={!selectedItems[service.id]}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-8 text-center font-bold text-secondary-900 text-lg">
                      {selectedItems[service.id] || 0}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(service.id, (selectedItems[service.id] || 0) + 1)}
                      className="w-8 h-8 rounded-md bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center transition-colors shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-secondary-100">
              <div className="flex justify-between items-center mb-6 bg-secondary-50 p-4 rounded-xl border border-secondary-100">
                <span className="text-lg font-semibold text-secondary-700">Total Estimated Cost</span>
                <span className="text-3xl font-bold text-primary-600">{formatCurrency(calculateTotal())}</span>
              </div>
              <button
                onClick={handleNextStep}
                className="btn-primary w-full py-4 text-lg shadow-lg shadow-primary-500/30"
              >
                Continue to Address
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Address */}
        {step === 2 && (
          <div className="card bg-white p-6 animate-slide-up">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">Select Delivery Address</h2>
            {addresses.length === 0 ? (
              <div className="text-center py-16 bg-secondary-50 rounded-2xl border border-dashed border-secondary-300">
                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-secondary-500 mb-4 font-medium">No addresses saved yet</p>
                <button
                  onClick={() => navigate('/user/addresses')}
                  className="text-primary-600 hover:text-primary-700 font-bold hover:underline"
                >
                  Add an address first →
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 mb-8">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`relative block border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 ${selectedAddressId === address.id
                          ? 'border-primary-500 bg-primary-50/30 shadow-md transform scale-[1.01]'
                          : 'border-secondary-200 hover:border-primary-300 hover:shadow-sm'
                        }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address.id}
                        checked={selectedAddressId === address.id}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedAddressId === address.id ? 'border-primary-600' : 'border-secondary-300'
                          }`}>
                          {selectedAddressId === address.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-secondary-100 text-secondary-700 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide">
                              {address.label}
                            </span>
                          </div>
                          <p className="text-secondary-900 font-bold text-lg">{address.line1}</p>
                          <p className="text-secondary-500 font-medium">
                            {address.city}, {address.pincode}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 btn-secondary py-3"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-1 btn-primary py-3 shadow-lg shadow-primary-500/30"
                  >
                    Continue to Delivery
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Select Delivery Type */}
        {step === 3 && (
          <div className="card bg-white p-6 animate-slide-up">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">Choose Delivery Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Standard Delivery */}
              <label
                className={`relative block border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                  deliveryType === 'STANDARD'
                    ? 'border-primary-500 bg-primary-50/30 shadow-lg transform scale-[1.02]'
                    : 'border-secondary-200 hover:border-primary-300 hover:shadow-md'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryType"
                  value="STANDARD"
                  checked={deliveryType === 'STANDARD'}
                  onChange={(e) => setDeliveryType(e.target.value as 'STANDARD' | 'PREMIUM')}
                  className="sr-only"
                />
                <div className="flex items-start gap-4">
                  <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    deliveryType === 'STANDARD' ? 'border-primary-600' : 'border-secondary-300'
                  }`}>
                    {deliveryType === 'STANDARD' && (
                      <div className="w-3 h-3 rounded-full bg-primary-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-secondary-900">Standard Delivery</h3>
                      <span className="text-2xl font-bold text-accent-600">FREE</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-secondary-600">
                        <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Delivered in 48 hours</span>
                      </div>
                      <div className="flex items-center gap-2 text-secondary-600">
                        <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Perfect for regular orders</span>
                      </div>
                    </div>
                  </div>
                </div>
              </label>

              {/* Premium Delivery */}
              <label
                className={`relative block border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                  deliveryType === 'PREMIUM'
                    ? 'border-accent-500 bg-accent-50/30 shadow-lg transform scale-[1.02]'
                    : 'border-secondary-200 hover:border-accent-300 hover:shadow-md'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryType"
                  value="PREMIUM"
                  checked={deliveryType === 'PREMIUM'}
                  onChange={(e) => setDeliveryType(e.target.value as 'STANDARD' | 'PREMIUM')}
                  className="sr-only"
                />
                <div className="absolute top-3 right-3">
                  <span className="bg-accent-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    Fast
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    deliveryType === 'PREMIUM' ? 'border-accent-600' : 'border-secondary-300'
                  }`}>
                    {deliveryType === 'PREMIUM' && (
                      <div className="w-3 h-3 rounded-full bg-accent-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-secondary-900">Premium Delivery</h3>
                      <span className="text-2xl font-bold text-accent-600">₹50</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-secondary-600">
                        <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="font-medium">Delivered in 24 hours</span>
                      </div>
                      <div className="flex items-center gap-2 text-secondary-600">
                        <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <span className="font-medium">Priority processing</span>
                      </div>
                    </div>
                  </div>
                </div>
              </label>
            </div>

            {/* Estimated Delivery Time */}
            <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg text-primary-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-secondary-500 font-medium">Estimated Delivery</p>
                  <p className="text-lg font-bold text-secondary-900">
                    {getEstimatedDeliveryTime().toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-5 mb-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-secondary-700 font-medium">Subtotal</span>
                  <span className="text-secondary-900 font-semibold">{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary-700 font-medium">Delivery Charge</span>
                  <span className={`font-semibold ${deliveryType === 'STANDARD' ? 'text-accent-600' : 'text-secondary-900'}`}>
                    {deliveryType === 'STANDARD' ? 'FREE' : formatCurrency(DELIVERY_CHARGES.PREMIUM)}
                  </span>
                </div>
                <div className="border-t-2 border-primary-300 pt-3 flex justify-between items-center">
                  <span className="text-lg font-bold text-secondary-900">Total</span>
                  <span className="text-2xl font-bold text-primary-600">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="btn-secondary px-6 py-3"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="flex-1 btn-primary py-3 shadow-lg shadow-primary-500/30"
              >
                Continue to Timeslot
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Select Timeslot */}
        {step === 4 && (
          <div className="card bg-white p-6 animate-slide-up">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">Select Pickup Timeslot</h2>
            {timeslots.length === 0 ? (
              <div className="text-center py-16 bg-secondary-50 rounded-2xl border border-dashed border-secondary-300">
                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-secondary-500 font-medium">No timeslots available at the moment</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {timeslots.map((timeslot) => (
                    <label
                      key={timeslot.id}
                      className={`relative block border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${selectedTimeslotId === timeslot.id
                          ? 'border-primary-500 bg-primary-50/30 shadow-md transform scale-[1.01]'
                          : 'border-secondary-200 hover:border-primary-300 hover:shadow-sm'
                        }`}
                    >
                      <input
                        type="radio"
                        name="timeslot"
                        value={timeslot.id}
                        checked={selectedTimeslotId === timeslot.id}
                        onChange={(e) => setSelectedTimeslotId(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-4">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedTimeslotId === timeslot.id ? 'border-primary-600' : 'border-secondary-300'
                          }`}>
                          {selectedTimeslotId === timeslot.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-secondary-900 text-lg">
                            {new Date(timeslot.date).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                          <p className="text-primary-600 font-semibold">
                            {timeslot.startTime} - {timeslot.endTime}
                          </p>
                          <p className="text-xs text-secondary-500 mt-1 font-medium bg-secondary-100 inline-block px-2 py-0.5 rounded">
                            {timeslot.remainingCapacity} slots left
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="bg-gradient-to-br from-secondary-50 to-white rounded-xl p-6 mb-8 border border-secondary-200 shadow-sm">
                  <h3 className="font-bold text-secondary-900 mb-4 text-lg border-b border-secondary-200 pb-2">Order Summary</h3>
                  <div className="space-y-3 text-sm">
                    {Object.entries(selectedItems).map(([serviceId, quantity]) => {
                      const service = services.find(s => s.id === serviceId);
                      return (
                        <div key={serviceId} className="flex justify-between items-center">
                          <span className="text-secondary-600 font-medium">{service?.name} <span className="text-secondary-400">× {quantity}</span></span>
                          <span className="font-bold text-secondary-900">{formatCurrency((service?.basePriceCents || 0) * quantity)}</span>
                        </div>
                      );
                    })}
                    <div className="pt-3 border-t border-secondary-200 flex justify-between items-center">
                      <span className="font-bold text-secondary-900 text-lg">Total</span>
                      <span className="text-2xl font-bold text-primary-600">{formatCurrency(calculateTotal())}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-secondary-100 mt-2">
                      <span className="text-secondary-600 font-medium">Wallet Balance</span>
                      <span className={`font-bold ${wallet && calculateTotal() > wallet.balanceCents ? 'text-red-500' : 'text-green-600'}`}>
                        {wallet ? formatCurrency(wallet.balanceCents) : '₹0.00'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(3)}
                    className="btn-secondary px-6 py-3"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 btn-primary py-3 shadow-lg shadow-primary-500/30"
                  >
                    {submitting ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CreateOrderPage;
