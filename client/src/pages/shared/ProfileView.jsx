import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { FiMapPin, FiMail, FiStar } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useOrderUpdates } from '../../context/SocketContext';
import { API_URL } from '../../config';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';

function Stat({ value, label, tone }) {
  return (
    <Card className="p-4 text-center">
      <div className={`font-display text-2xl font-extrabold ${tone}`}>{value ?? 0}</div>
      <div className="mt-1 text-xs font-medium text-stone-500 dark:text-stone-400">{label}</div>
    </Card>
  );
}

export default function ProfileView({ base, roleLabel }) {
  const { user } = useAuth();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInfo = useCallback(async () => {
    if (!user?._id) return;
    try {
      const r = await axios.get(`${API_URL}/${base}/profile/${user._id}`);
      setInfo(r.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [base, user]);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  // Stats change when orders are fulfilled/cancelled — refresh live.
  useOrderUpdates(fetchInfo);

  const name = info?.username || user?.username || 'User';
  const rate =
    info?.totalOrders > 0 ? Math.round((info.fulfilledOrders / info.totalOrders) * 100) : 0;

  return (
    <div className="min-h-[70vh]">
      {/* Cover */}
      <div className="relative h-44 sm:h-56 bg-gradient-to-br from-brand-600 to-brand-800 overflow-hidden">
        <div className="absolute -top-10 -right-10 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 left-10 h-52 w-52 rounded-full bg-accent-400/20 blur-2xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Header card */}
        <Card className="-mt-16 p-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <Avatar name={name} size={96} className="ring-4 ring-white dark:ring-stone-900 -mt-20 sm:-mt-24 text-3xl" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-white">{name}</h1>
                <Badge tone="brand">{roleLabel}</Badge>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500 dark:text-stone-400">
                {user?.locationName && (
                  <span className="inline-flex items-center gap-1.5">
                    <FiMapPin size={14} /> {user.locationName}
                  </span>
                )}
                {info?.email && (
                  <span className="inline-flex items-center gap-1.5">
                    <FiMail size={14} /> {info.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        {loading ? (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat value={info?.totalOrders} label="Total orders" tone="text-stone-900 dark:text-white" />
              <Stat value={info?.fulfilledOrders} label="Fulfilled" tone="text-brand-600 dark:text-brand-400" />
              <Stat value={info?.cancelledOrders} label="Cancelled" tone="text-red-500" />
              <Stat value={info?.dismissedOrders} label="Dismissed" tone="text-stone-400" />
            </div>

            {info?.totalOrders > 0 && (
              <Card className="mt-4 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-stone-600 dark:text-stone-300">Fulfillment rate</span>
                  <span className="font-semibold text-brand-600 dark:text-brand-400">{rate}%</span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600" style={{ width: `${rate}%` }} />
                </div>
              </Card>
            )}

            {/* Reviews */}
            <div className="mt-8 mb-16">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-stone-900 dark:text-white">
                <FiStar className="text-accent-500" /> Reviews
              </h2>
              {info?.reviews?.length ? (
                <div className="mt-4 space-y-3">
                  {info.reviews.map((review, i) => (
                    <Card key={i} className="p-4 text-stone-700 dark:text-stone-200">
                      “{review}”
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-stone-400 dark:text-stone-500">No reviews yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
