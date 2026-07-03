import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiClock, FiPackage, FiLock } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useOrderUpdates } from '../../context/SocketContext';
import { API_URL } from '../../config';
import { foodImage } from '../../lib/foodImages';
import { readCache, writeCache } from '../../lib/dataCache';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Input, Select, Label } from '../../components/ui/Input';

const emptyForm = { name: '', quantity: '', expiry: '', food_type: '' };

function ListingFields({ form, setForm }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div className="space-y-4">
      <div>
        <Label>Food name</Label>
        <Input placeholder="e.g. Veg Biryani" value={form.name} onChange={set('name')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Quantity (kg)</Label>
          <Input type="number" min="1" placeholder="20" value={form.quantity} onChange={set('quantity')} />
        </div>
        <div>
          <Label>Expiry</Label>
          <Select value={form.expiry} onChange={set('expiry')}>
            <option value="">Select</option>
            <option value="1">1 hr</option>
            <option value="2">2 hrs</option>
            <option value="3">3 hrs</option>
          </Select>
        </div>
      </div>
      <div>
        <Label>Food type</Label>
        <Select value={form.food_type} onChange={set('food_type')}>
          <option value="">Select</option>
          <option value="Vegetarian">Vegetarian</option>
          <option value="Non-Vegetarian">Non-Vegetarian</option>
          <option value="Vegan">Vegan</option>
        </Select>
      </div>
    </div>
  );
}

const RestaurantListingsPage = () => {
  const { user } = useAuth();
  const restaurantId = user?._id;
  const toast = useToast();

  const cacheKey = `rest-listings:${restaurantId}`;
  const [listings, setListings] = useState(() => readCache(cacheKey) || []);
  const [loading, setLoading] = useState(() => !readCache(cacheKey));

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [adding, setAdding] = useState(false);

  const [editing, setEditing] = useState(null); // the listing being edited
  const [editForm, setEditForm] = useState(emptyForm);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const fetchListings = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const response = await axios.get(`${API_URL}/listings/${restaurantId}`);
      const data = Array.isArray(response.data) ? response.data : [];
      setListings(data);
      writeCache(cacheKey, data);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load listings.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, toast, cacheKey]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // A listing gets "blocked" when an NGO's order is accepted — refresh live.
  useOrderUpdates(fetchListings);

  const validate = (form) =>
    form.name && Number(form.quantity) > 0 && form.expiry && form.food_type;

  const handleAdd = async () => {
    if (!validate(addForm)) {
      toast.error('Please fill in all fields.');
      return;
    }
    setAdding(true);
    try {
      await axios.post(`${API_URL}/listings`, {
        restaurantId,
        name: addForm.name,
        quantity: parseInt(addForm.quantity, 10),
        expiry: parseInt(addForm.expiry, 10),
        food_type: addForm.food_type,
        view: 'not blocked',
      });
      await fetchListings();
      setShowAdd(false);
      setAddForm(emptyForm);
      toast.success('Listing added.');
    } catch (error) {
      console.error('Error adding listing:', error);
      toast.error(error.response?.data?.message || 'Failed to add listing.');
    } finally {
      setAdding(false);
    }
  };

  const openEdit = (listing) => {
    setEditing(listing);
    setEditForm({
      name: listing.name,
      quantity: String(listing.quantity),
      expiry: String(listing.expiry),
      food_type: listing.food_type,
    });
  };

  const handleEdit = async () => {
    if (!editing || !validate(editForm)) {
      toast.error('Please fill in all fields.');
      return;
    }
    setSavingEdit(true);
    try {
      await axios.put(`${API_URL}/listings/${editing._id}`, {
        ...editing,
        name: editForm.name,
        food_type: editForm.food_type,
        quantity: parseInt(editForm.quantity, 10),
        expiry: parseInt(editForm.expiry, 10),
      });
      await fetchListings();
      setEditing(null);
      toast.success('Listing updated.');
    } catch (error) {
      console.error('Error updating listing:', error);
      toast.error(error.response?.data?.message || 'Failed to update listing.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API_URL}/listings/${id}`);
      await fetchListings();
      toast.success('Listing deleted.');
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to delete listing.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 min-h-[70vh]">
      <PageHeader
        title="My Listings"
        subtitle="Post surplus food so nearby NGOs can request it before it expires."
        action={
          <Button onClick={() => { setAddForm(emptyForm); setShowAdd(true); }}>
            <FiPlus /> New listing
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-44 w-full rounded-none" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-16 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon="🍽️"
          title="No listings yet"
          description="Add your first surplus-food listing and NGOs nearby will be able to request it."
          action={
            <Button onClick={() => setShowAdd(true)}>
              <FiPlus /> Add a listing
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => {
            const blocked = listing.view === 'blocked';
            return (
              <Card key={listing._id} hover className="overflow-hidden flex flex-col">
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    src={foodImage(listing.food_type, listing._id)}
                    alt={listing.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge tone={blocked ? 'gray' : 'brand'} dot>
                      {blocked ? 'In an order' : 'Available'}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-lg font-semibold text-stone-900 dark:text-white">{listing.name}</h3>
                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 p-3 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-xs text-stone-400"><FiPackage size={12} /> Qty</div>
                      <div className="mt-0.5 font-semibold text-stone-800 dark:text-stone-100">{listing.quantity} kg</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-xs text-stone-400"><FiClock size={12} /> Expiry</div>
                      <div className="mt-0.5 font-semibold text-stone-800 dark:text-stone-100">{listing.expiry} hr</div>
                    </div>
                    <div>
                      <div className="text-xs text-stone-400">Type</div>
                      <div className="mt-0.5 font-semibold text-stone-800 dark:text-stone-100 text-xs">{listing.food_type}</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-1 flex-1 flex items-end">
                    {blocked ? (
                      <p className="flex items-center gap-1.5 text-sm text-stone-400 dark:text-stone-500">
                        <FiLock size={14} /> Locked while in an active order
                      </p>
                    ) : (
                      <div className="flex gap-2 w-full">
                        <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEdit(listing)}>
                          <FiEdit2 size={14} /> Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="flex-1"
                          loading={deletingId === listing._id}
                          onClick={() => handleDelete(listing._id)}
                        >
                          <FiTrash2 size={14} /> Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add a listing"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button loading={adding} onClick={handleAdd}>Add listing</Button>
          </>
        }
      >
        <ListingFields form={addForm} setForm={setAddForm} />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Update listing"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button loading={savingEdit} onClick={handleEdit}>Save changes</Button>
          </>
        }
      >
        <ListingFields form={editForm} setForm={setEditForm} />
      </Modal>
    </div>
  );
};

export default RestaurantListingsPage;
