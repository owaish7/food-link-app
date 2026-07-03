import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiList, FiCheck, FiX, FiSend } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useSocket, useOrderUpdates } from '../../../context/SocketContext';
import { API_URL } from '../../../config';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/ui/Spinner';
import { StatusBadge } from '../../../components/ui/Badge';
import { cn } from '../../../lib/cn';
import { CodeModal, ListingsModal, CodeField } from '../../../components/orders/OrderBits';

const ChatRoomPage = () => {
  const { user } = useAuth();
  const { orderId } = useParams();
  const toast = useToast();
  const { socket } = useSocket();

  const [orderDetails, setOrderDetails] = useState(null);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [acting, setActing] = useState(false);

  const [showListings, setShowListings] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showFulfill, setShowFulfill] = useState(false);
  const [cancelCode, setCancelCode] = useState('');
  const [fulfillCode, setFulfillCode] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [fulfillError, setFulfillError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const endRef = useRef(null);

  const fetchOrderDetails = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/${orderId}`);
      setOrderDetails(response.data.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  }, [orderId]);

  const fetchPreviousMessages = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/${orderId}/messages`);
      setChatMessages(response.data.data || []);
    } catch (error) {
      console.error('Error fetching previous messages:', error);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
    fetchPreviousMessages();
  }, [fetchOrderDetails, fetchPreviousMessages]);

  useOrderUpdates(fetchOrderDetails);

  // Chat over the shared, authenticated socket.
  useEffect(() => {
    if (!socket) return undefined;
    socket.emit('join_chat_room', orderId);
    const onMsg = (m) => setChatMessages((prev) => [...prev, m]);
    socket.on('receive_chat_message', onMsg);
    return () => socket.off('receive_chat_message', onMsg);
  }, [socket, orderId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const isRestaurant = user?.userType === 'Restaurant';
  const status = orderDetails?.status;
  const isAccepted = status === 'accepted';
  const myCode = isRestaurant ? orderDetails?.rest_code : orderDetails?.ngo_code;
  const otherName = isRestaurant ? orderDetails?.ngo_name : orderDetails?.restaurant_name;

  const handleSend = () => {
    if (message.trim() === '' || !socket) return;
    socket.emit('send_chat_message', { message, orderId, sender: user?._id });
    setMessage('');
  };

  const doAction = async (verb) => {
    setActing(true);
    try {
      await axios.put(`${API_URL}/orders/${orderId}/${verb}`);
      await fetchOrderDetails();
      toast.success(verb === 'accept' ? 'Order accepted.' : 'Order declined.');
    } catch (error) {
      toast.error(`Failed to ${verb} order.`);
    } finally {
      setActing(false);
    }
  };

  const handleCancel = async () => {
    setSubmitting(true);
    setCancelError('');
    try {
      const response = await axios.put(`${API_URL}/orders/${orderId}/cancel`, {
        code: cancelCode,
        user_type: user.userType,
      });
      setShowCancel(false);
      setCancelCode('');
      await fetchOrderDetails();
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
      const response = await axios.put(`${API_URL}/orders/${orderId}/fulfill`, {
        code: fulfillCode,
        user_type: user.userType,
      });
      setShowFulfill(false);
      setFulfillCode('');
      await fetchOrderDetails();
      toast.success(response.data.message || 'Order fulfilled!');
    } catch (error) {
      setFulfillError(error.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(myCode || '');
    toast.success('Code copied to clipboard!');
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col min-h-[calc(100vh-4rem)] px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={isRestaurant ? '/restaurant/transactions' : '/ngo/transactions'}>
              <Button variant="ghost" size="sm" className="!px-2">
                <FiArrowLeft size={18} />
              </Button>
            </Link>
            <div className="min-w-0">
              <p className="text-xs text-stone-400">Conversation with</p>
              <h2 className="font-semibold text-stone-900 dark:text-white truncate">
                {otherName || 'Loading…'}
              </h2>
            </div>
          </div>
          {status && <StatusBadge status={status} />}
        </div>

        {orderDetails && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowListings(true)}>
              <FiList size={14} /> Items
            </Button>

            {isRestaurant && status === 'requested' && (
              <>
                <Button size="sm" loading={acting} onClick={() => doAction('accept')}>
                  <FiCheck size={14} /> Accept
                </Button>
                <Button variant="danger" size="sm" loading={acting} onClick={() => doAction('decline')}>
                  <FiX size={14} /> Decline
                </Button>
              </>
            )}

            {isAccepted && (
              <>
                <Button variant="secondary" size="sm" onClick={() => { setCancelError(''); setShowCancel(true); }}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => { setFulfillError(''); setShowFulfill(true); }}>
                  <FiCheck size={14} /> Fulfill
                </Button>
              </>
            )}
          </div>
        )}

        {isAccepted && (
          <div className="mt-3">
            <CodeField label="Your pickup code" code={myCode} onCopy={copyCode} />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
        {chatMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-stone-400 dark:text-stone-500">
            No messages yet — say hello 👋
          </div>
        ) : (
          chatMessages.map((m, i) => {
            const mine = m.sender === user?._id;
            return (
              <div key={i} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-soft',
                    mine
                      ? 'bg-brand-600 text-white rounded-br-md'
                      : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-bl-md border border-stone-200/70 dark:border-stone-700'
                  )}
                >
                  {!mine && (
                    <p className="mb-0.5 text-xs font-semibold text-brand-600 dark:text-brand-400">
                      {otherName || 'Them'}
                    </p>
                  )}
                  {m.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      {isAccepted ? (
        <div className="sticky bottom-0 flex items-center gap-2 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-card p-2">
          <input
            type="text"
            placeholder="Type a message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none text-stone-800 dark:text-stone-100 placeholder-stone-400"
          />
          <Button size="sm" onClick={handleSend} disabled={!message.trim()}>
            <FiSend size={15} /> Send
          </Button>
        </div>
      ) : (
        orderDetails && (
          <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-4 text-center text-sm text-stone-400 dark:text-stone-500">
            {status === 'requested'
              ? 'Chat opens once the order is accepted.'
              : 'This order is no longer active — chat is read-only.'}
          </div>
        )
      )}

      {!orderDetails && (
        <div className="flex flex-1 items-center justify-center text-brand-600">
          <Spinner size={32} />
        </div>
      )}

      <ListingsModal open={showListings} onClose={() => setShowListings(false)} order={orderDetails} />
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
    </div>
  );
};

export default ChatRoomPage;
