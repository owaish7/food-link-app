import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiCheck, FiX, FiMessageCircle, FiList, FiNavigation, FiStar } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { useOrderUpdates } from '../../context/SocketContext';
import { API_URL } from '../../config';
import { foodImage } from '../../lib/foodImages';
import { readCache, writeCache } from '../../lib/dataCache';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import {
  CodeModal,
  ReviewModal,
  ListingsModal,
  ReviewBlock,
  CodeField,
} from '../../components/orders/OrderBits';

// Custom teardrop pin markers (Leaflet's default PNG markers break under Vite).
const pinIcon = (emoji, color) =>
  L.divIcon({
    className: 'foodlink-pin',
    html: `<div class="fl-pin" style="background:${color}"><span>${emoji}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });

const MAP_ICONS = {
  origin: pinIcon('🍽️', '#059669'),
  dest: pinIcon('🤝', '#d97706'),
  meet: pinIcon('📍', '#4f46e5'),
};

const RestaurantTransactionsPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { isDarkMode } = useDarkMode();

  const cacheKey = `rest-orders:${user?._id}`;
  const [orders, setOrders] = useState(() => readCache(cacheKey) || []);
  const [loading, setLoading] = useState(() => !readCache(cacheKey));
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actingId, setActingId] = useState(null);

  const [showListings, setShowListings] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showFulfill, setShowFulfill] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [cancelCode, setCancelCode] = useState('');
  const [fulfillCode, setFulfillCode] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [fulfillError, setFulfillError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [routeData, setRouteData] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [routing, setRouting] = useState(false);
  const [cachedRoutes, setCachedRoutes] = useState({});

  const fetchOrders = useCallback(async () => {
    if (!user?._id) return;
    try {
      const response = await axios.get(`${API_URL}/orders/restaurant`, {
        params: { restaurant_id: user._id },
      });
      const data = response.data.data || [];
      setOrders(data);
      writeCache(cacheKey, data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [user, cacheKey]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useOrderUpdates(fetchOrders);

  useEffect(() => {
    const onFocus = () => fetchOrders();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchOrders]);

  const handleAccept = async (orderId) => {
    setActingId(orderId);
    try {
      await axios.put(`${API_URL}/orders/${orderId}/accept`);
      await fetchOrders();
      toast.success('Order accepted — a pickup code was generated.');
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Failed to accept order.');
    } finally {
      setActingId(null);
    }
  };

  const handleDecline = async (orderId) => {
    setActingId(orderId);
    try {
      await axios.put(`${API_URL}/orders/${orderId}/decline`);
      await fetchOrders();
      toast.info('Order declined.');
    } catch (error) {
      console.error('Error declining order:', error);
      toast.error('Failed to decline order.');
    } finally {
      setActingId(null);
    }
  };

  const handleCancel = async () => {
    setSubmitting(true);
    setCancelError('');
    try {
      const response = await axios.put(`${API_URL}/orders/${selectedOrder._id}/cancel`, {
        code: cancelCode,
        user_type: user.userType,
      });
      setShowCancel(false);
      setCancelCode('');
      await fetchOrders();
      toast.success(response.data.message || 'Order cancelled.');
    } catch (error) {
      setCancelError(error.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFulfill = async () => {
    setSubmitting(true);
    setFulfillError('');
    try {
      const response = await axios.put(`${API_URL}/orders/${selectedOrder._id}/fulfill`, {
        code: fulfillCode,
        user_type: user.userType,
      });
      setShowFulfill(false);
      setFulfillCode('');
      await fetchOrders();
      toast.success(response.data.message || 'Order fulfilled!');
    } catch (error) {
      setFulfillError(error.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const postReview = async () => {
    setSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/addRestReview/${selectedOrder._id}`, {
        review: reviewText,
      });
      setShowReview(false);
      setReviewText('');
      await fetchOrders();
      toast.success(
        response.data.sentiment
          ? `Review posted (${response.data.sentiment}).`
          : 'Review posted.'
      );
    } catch (error) {
      console.error('Error posting review:', error);
      toast.error('Failed to post review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirections = (ngoId) => {
    if (!user?.latitude || !user?.longitude) {
      toast.error('Your location is unavailable.');
      return;
    }
    if (!ngoId) {
      toast.error('NGO location is missing.');
      return;
    }
    if (cachedRoutes[ngoId]) {
      setRouteData(cachedRoutes[ngoId]);
      setShowMap(true);
      return;
    }
    setRouting(true);
    axios
      .get(`${API_URL}/ngo/profile/${ngoId}`)
      .then((response) => {
        const ngoData = response.data;
        if (!ngoData?.latitude || !ngoData?.longitude) {
          throw new Error('NGO location data is unavailable.');
        }
        // Must be an absolute URL to the API — a relative '/calculate_route'
        // only works via the Vite dev proxy and 404s on Vercel in production.
        return axios.post(`${API_URL}/calculate_route`, {
          origin_latitude: user.latitude,
          origin_longitude: user.longitude,
          destination_latitude: ngoData.latitude,
          destination_longitude: ngoData.longitude,
        });
      })
      .then((routeResponse) => {
        const data = routeResponse.data;
        setRouteData(data);
        setCachedRoutes((prev) => ({ ...prev, [ngoId]: data }));
        setShowMap(true);
      })
      .catch((error) => {
        console.error('Error calculating route:', error);
        toast.error(error.message || 'Could not calculate the route.');
      })
      .finally(() => setRouting(false));
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code || '');
    toast.success('Code copied to clipboard!');
  };

  const canReview = (order) =>
    (order.status === 'cancelled' || order.status === 'fulfilled') && !order.rest_review;
  const canChat = (order) =>
    ['accepted', 'fulfilled', 'cancelled', 'dismissed'].includes(order.status);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 min-h-[70vh]">
      <PageHeader
        title="Transactions"
        subtitle="Incoming requests and pickups from NGOs — updates in real time."
      />

      {routing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-stone-900/60 text-white px-6 text-center">
          <Spinner size={40} />
          <p className="max-w-xs text-sm font-medium">Calculating the route…</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 flex gap-4">
              <Skeleton className="h-28 w-28 rounded-xl shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-9 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No orders yet"
          description="When an NGO requests one of your listings, it will show up here."
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order._id} className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <img
                  src={foodImage(order.listings?.[0]?.food_type, order._id)}
                  alt="Order"
                  className="h-40 sm:h-28 sm:w-28 w-full object-cover rounded-xl shrink-0"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-stone-400">Requested by</p>
                      <h3 className="text-lg font-semibold text-stone-900 dark:text-white">
                        {order.ngo_name || 'NGO'}
                      </h3>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  {order.status === 'requested' && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        className="flex-1"
                        loading={actingId === order._id}
                        onClick={() => handleAccept(order._id)}
                      >
                        <FiCheck /> Accept
                      </Button>
                      <Button
                        variant="danger"
                        className="flex-1"
                        loading={actingId === order._id}
                        onClick={() => handleDecline(order._id)}
                      >
                        <FiX /> Decline
                      </Button>
                    </div>
                  )}

                  {order.status === 'accepted' && (
                    <div className="mt-3 space-y-3">
                      <CodeField label="Your pickup code" code={order.rest_code} onCopy={() => copyCode(order.rest_code)} />
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { setSelectedOrder(order); setCancelError(''); setShowCancel(true); }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => { setSelectedOrder(order); setFulfillError(''); setShowFulfill(true); }}
                        >
                          <FiCheck size={14} /> Fulfill
                        </Button>
                      </div>
                    </div>
                  )}

                  <ReviewBlock label="Your review" review={order.rest_review} sentiment={order.rest_sentiment} />
                  <ReviewBlock label="NGO review" review={order.ngo_review} sentiment={order.ngo_sentiment} />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedOrder(order); setShowListings(true); }}>
                      <FiList size={14} /> Items
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDirections(order.ngo_id)}>
                      <FiNavigation size={14} /> Directions
                    </Button>
                    {canChat(order) && (
                      <Link to={`/chat/${order._id}`}>
                        <Button variant="ghost" size="sm">
                          <FiMessageCircle size={14} /> Chat
                        </Button>
                      </Link>
                    )}
                    {canReview(order) && (
                      <Button variant="subtle" size="sm" onClick={() => { setSelectedOrder(order); setReviewText(''); setShowReview(true); }}>
                        <FiStar size={14} /> Review
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Map modal */}
      <Modal open={showMap && !!routeData} onClose={() => setShowMap(false)} title="Route to NGO" size="lg">
        {routeData && (
          <>
            <MapContainer
              bounds={routeData.route}
              boundsOptions={{ padding: [36, 36] }}
              scrollWheelZoom
              style={{ height: '380px', width: '100%', borderRadius: '0.9rem' }}
            >
              <TileLayer
                url={
                  isDarkMode
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                }
                attribution="&copy; OpenStreetMap &copy; CARTO"
              />
              {/* White casing under the route for a crisp modern look */}
              <Polyline positions={routeData.route} color="#ffffff" weight={8} opacity={0.9} />
              <Polyline
                positions={routeData.route}
                color="#059669"
                weight={5}
                opacity={0.95}
                lineCap="round"
                lineJoin="round"
              />
              <Marker position={routeData.route[0]} icon={MAP_ICONS.origin}>
                <Popup>Your restaurant</Popup>
              </Marker>
              <Marker position={routeData.route[routeData.route.length - 1]} icon={MAP_ICONS.dest}>
                <Popup>NGO destination</Popup>
              </Marker>
              {routeData.optimal_meeting_point && (
                <Marker position={routeData.optimal_meeting_point} icon={MAP_ICONS.meet}>
                  <Popup>Suggested meeting point</Popup>
                </Marker>
              )}
            </MapContainer>
            {routeData.distance != null && (
              <div className="mt-4 flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 dark:bg-brand-900/30 px-4 py-1.5 text-sm font-semibold text-brand-700 dark:text-brand-300">
                  {(routeData.distance / 1000).toFixed(1)} km · ~{Math.max(1, Math.round(routeData.duration / 60))} min drive
                </span>
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-sm text-stone-600 dark:text-stone-300">
              <span className="inline-flex items-center gap-1.5">🍽️ Restaurant</span>
              <span className="inline-flex items-center gap-1.5">📍 Meeting point</span>
              <span className="inline-flex items-center gap-1.5">🤝 NGO</span>
            </div>
          </>
        )}
      </Modal>

      <ListingsModal open={showListings} onClose={() => setShowListings(false)} order={selectedOrder} />
      <CodeModal
        open={showCancel}
        onClose={() => setShowCancel(false)}
        title="Cancel order"
        actionLabel="Cancel order"
        variant="danger"
        value={cancelCode}
        onChange={(e) => setCancelCode(e.target.value)}
        onSubmit={handleCancel}
        loading={submitting}
        error={cancelError}
      />
      <CodeModal
        open={showFulfill}
        onClose={() => setShowFulfill(false)}
        title="Fulfill order"
        actionLabel="Fulfill order"
        value={fulfillCode}
        onChange={(e) => setFulfillCode(e.target.value)}
        onSubmit={handleFulfill}
        loading={submitting}
        error={fulfillError}
      />
      <ReviewModal
        open={showReview}
        onClose={() => setShowReview(false)}
        onSubmit={postReview}
        loading={submitting}
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
      />
    </div>
  );
};

export default RestaurantTransactionsPage;
