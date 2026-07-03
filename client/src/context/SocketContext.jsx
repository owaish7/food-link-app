import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { API_URL } from '../config';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext) || { socket: null, connected: false };

// One shared, authenticated Socket.IO connection for the whole logged-in
// session. The server authenticates it via the httpOnly accessToken cookie
// (withCredentials) and auto-joins the user's personal room, so order events
// and chat both ride this single connection.
export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      setConnected(false);
      return undefined;
    }
    const s = io(API_URL, { withCredentials: true });
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>
  );
}

// Subscribe to real-time 'order_update' events. The handler is kept in a ref so
// callers don't need to memoize it, and it re-binds whenever the socket changes.
export function useOrderUpdates(handler) {
  const { socket } = useSocket();
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    if (!socket) return undefined;
    const fn = (payload) => ref.current?.(payload);
    socket.on('order_update', fn);
    return () => socket.off('order_update', fn);
  }, [socket]);
}
