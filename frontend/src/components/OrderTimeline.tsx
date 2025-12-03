import React from 'react';
import { OrderStatus, OrderLog } from '../types';

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  logs: OrderLog[];
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({ currentStatus, logs }) => {
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      PLACED: 'Order Placed',
      ASSIGNED_TO_PARTNER: 'Partner Assigned',
      PICKUP_PENDING: 'Pickup Pending',
      PICKED_UP: 'Picked Up',
      AT_CENTER: 'At Center',
      PROCESSING: 'Processing',
      QC: 'Quality Check',
      READY_FOR_DELIVERY: 'Ready for Delivery',
      OUT_FOR_DELIVERY: 'Out for Delivery',
      DELIVERED: 'Delivered',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      PICKUP_FAILED: 'Pickup Failed',
      DELIVERY_FAILED: 'Delivery Failed',
      REFUND_REQUESTED: 'Refund Requested',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const exceptionStatuses = ['CANCELLED', 'PICKUP_FAILED', 'DELIVERY_FAILED', 'REFUND_REQUESTED'];
    if (exceptionStatuses.includes(status)) {
      return 'bg-accent-500';
    }
    if (status === 'COMPLETED') {
      return 'bg-green-500';
    }
    return 'bg-primary-500';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-secondary-900 mb-6">Order Timeline</h3>

      <div className="space-y-6">
        {sortedLogs.map((log, index) => {
          const isLast = index === sortedLogs.length - 1;
          const statusColor = getStatusColor(log.toStatus);

          return (
            <div key={log.id} className="relative">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-secondary-200" />
              )}

              {/* Timeline item */}
              <div className="flex items-start">
                {/* Status dot */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${statusColor} flex items-center justify-center z-10 shadow-lg shadow-primary-500/20`}>
                  {isLast ? (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <div className="w-3 h-3 bg-white rounded-full" />
                  )}
                </div>

                {/* Content */}
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-secondary-900">
                      {getStatusLabel(log.toStatus)}
                    </h4>
                    <span className="text-xs text-secondary-500 font-medium">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                  {log.fromStatus && (
                    <p className="mt-1 text-xs text-secondary-500">
                      From: {getStatusLabel(log.fromStatus)}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-secondary-400">
                    By: {log.actorRole.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Status Badge */}
      <div className="mt-6 pt-6 border-t border-secondary-100">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-secondary-700">Current Status:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${getStatusColor(currentStatus)}`}>
            {getStatusLabel(currentStatus)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderTimeline;
