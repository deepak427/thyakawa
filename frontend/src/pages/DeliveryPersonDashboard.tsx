import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { Trip } from '../types';
import api from '../services/api';

const DeliveryPersonDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await api.get('/partner/assignments');
      setTrips(response.data.trips || []);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load trips', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
      <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary-900 mb-2">My Trips</h1>
          <p className="text-secondary-500">Manage your delivery trips</p>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-secondary-300">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-secondary-500">No trips assigned yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {trips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => navigate(`/delivery/trips/${trip.id}`)}
                className="bg-white rounded-xl p-6 shadow-sm border border-secondary-100 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-secondary-900">Trip #{trip.id.slice(0, 8)}</h3>
                    <p className="text-secondary-500">
                      {new Date(trip.scheduledDate).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(trip.status)}`}>
                    {trip.status}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{trip.startTime} - {trip.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-secondary-600">
                      {trip.type === 'PICKUP' ? '📦 Pickup' : '🚚 Delivery'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span className="font-medium">
                      {(trip.orders?.length || 0) + (trip.orders?.length || 0)} Orders
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DeliveryPersonDashboard;
