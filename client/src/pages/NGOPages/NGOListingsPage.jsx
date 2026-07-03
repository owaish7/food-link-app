import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiCheck, FiPlus, FiClock, FiPackage, FiShoppingBag, FiStar, FiMapPin } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useOrderUpdates } from '../../context/SocketContext';
import { API_URL } from '../../config';
import { foodImage } from '../../lib/foodImages';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/cn';

const idOf = (l) => String(l._id || l.listingId || '');
const ridOf = (l) => String(l.restaurant_id || l.restaurantId || '');
const rnameOf = (l) => l.restaurant_name || l.restaurantName || 'Restaurant';

function NgoCard({ listing, selected, onToggle }) {
  return (
    <div
      className={cn(
        'shrink-0 w-56 rounded-2xl border bg-white dark:bg-stone-900 shadow-card overflow-hidden transition-all',
        selected
          ? 'border-brand-500 ring-2 ring-brand-500/30'
          : 'border-stone-200/80 dark:border-stone-800'
      )}
    >
      <div className="h-28 w-full overflow-hidden">
        <img
          src={foodImage(listing.food_type, idOf(listing) || listing.name)}
          alt={listing.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-stone-900 dark:text-white truncate">{listing.name}</h3>
        <p className="text-xs text-stone-400 truncate">{rnameOf(listing)}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone="brand">{listing.food_type}</Badge>
          <Badge tone="gray">
            <FiPackage size={11} /> {listing.quantity}kg
          </Badge>
          <Badge tone="amber">
            <FiClock size={11} /> {listing.expiry}h
          </Badge>
        </div>
        <Button
          variant={selected ? 'primary' : 'secondary'}
          size="sm"
          className="mt-3 w-full"
          onClick={onToggle}
        >
          {selected ? (
            <>
              <FiCheck size={14} /> Selected
            </>
          ) : (
            <>
              <FiPlus size={14} /> Select
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function Rail({ title, icon, items, isSelected, onToggle }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
          {icon}
        </span>
        <h2 className="font-display text-lg font-bold text-stone-900 dark:text-white">{title}</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {items.map((l) => (
          <NgoCard key={idOf(l) || l.name} listing={l} selected={isSelected(l)} onToggle={() => onToggle(l)} />
        ))}
      </div>
    </section>
  );
}

const NGOListingsPage = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [restaurants, setRestaurants] = useState({});
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [cbfItems, setCbfItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user?._id) return;
    const { longitude, latitude, _id: ngoId } = user;
    try {
      const [nearby, recs, cbf] = await Promise.allSettled([
        axios.get(`${API_URL}/nearbyRestaurants`, { params: { ngoId, longitude, latitude } }),
        axios.get(`${API_URL}/recommendations/ml`, { params: { ngo_id: ngoId } }),
        axios.get(`${API_URL}/content-based-recommendations`, { params: { ngo_id: ngoId } }),
      ]);

      if (nearby.status === 'fulfilled') {
        const grouped = {};
        (nearby.value.data || []).forEach((listing) => {
          const key = listing.restaurantName || 'Restaurant';
          (grouped[key] = grouped[key] || []).push(listing);
        });
        setRestaurants(grouped);
      }
      if (recs.status === 'fulfilled') {
        setRecommendedItems(Array.isArray(recs.value.data) ? recs.value.data : []);
      }
      if (cbf.status === 'fulfilled') {
        setCbfItems(cbf.value.data?.recommendations || []);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useOrderUpdates(fetchAll);

  const isSelected = (l) => selected.some((s) => idOf(s) === idOf(l));
  const toggle = (l) =>
    setSelected((prev) => (isSelected(l) ? prev.filter((s) => idOf(s) !== idOf(l)) : [...prev, l]));

  const handleRequest = async () => {
    if (selected.length === 0) {
      toast.error('Select at least one item to request.');
      return;
    }
    setRequesting(true);
    try {
      // Group by restaurant so each order is single-restaurant (backend requires one).
      const groups = {};
      selected.forEach((l) => {
        const rid = ridOf(l);
        (groups[rid] = groups[rid] || []).push(l);
      });

      for (const [rid, items] of Object.entries(groups)) {
        // eslint-disable-next-line no-await-in-loop
        await axios.post(`${API_URL}/orders`, {
          restaurantId: rid,
          ngoId: String(user._id),
          listings: items.map((l) => ({
            listing: idOf(l),
            name: l.name,
            quantity: l.quantity,
            expiry: l.expiry,
            food_type: l.food_type,
            restaurant_id: rid,
            restaurant_name: rnameOf(l),
            view: 'not blocked',
          })),
        });
      }

      const count = Object.keys(groups).length;
      toast.success(`Order request${count > 1 ? 's' : ''} sent!`);
      setSelected([]);
      fetchAll();
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.response?.data?.error || 'Failed to create order. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  const hasAnything =
    recommendedItems.length > 0 || cbfItems.length > 0 || Object.keys(restaurants).length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 min-h-[70vh] pb-28">
      <PageHeader
        title="Discover Food"
        subtitle="Browse surplus from nearby restaurants and our recommendations, then request a pickup."
      />

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shrink-0 w-56">
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="mt-3 h-4 w-2/3" />
              <Skeleton className="mt-2 h-8 w-full" />
            </div>
          ))}
        </div>
      ) : !hasAnything ? (
        <EmptyState
          icon="🔍"
          title="No listings nearby yet"
          description="There's no surplus food available around you right now. Check back soon — new listings appear here."
        />
      ) : (
        <>
          <Rail
            title="Recommended for you"
            icon={<FiStar size={16} />}
            items={recommendedItems}
            isSelected={isSelected}
            onToggle={toggle}
          />
          <Rail
            title="Similar to your past orders"
            icon={<FiShoppingBag size={16} />}
            items={cbfItems}
            isSelected={isSelected}
            onToggle={toggle}
          />
          {Object.keys(restaurants).map((name) => (
            <Rail
              key={name}
              title={name}
              icon={<FiMapPin size={16} />}
              items={restaurants[name]}
              isSelected={isSelected}
              onToggle={toggle}
            />
          ))}
        </>
      )}

      {/* Sticky request bar */}
      {selected.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-950/90 backdrop-blur-lg animate-fade-in-up">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
            <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
              {selected.length} item{selected.length > 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setSelected([])}>
                Clear
              </Button>
              <Button loading={requesting} onClick={handleRequest}>
                <FiShoppingBag /> Request pickup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NGOListingsPage;
