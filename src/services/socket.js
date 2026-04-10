import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

let socket = null;

/**
 * Connect to the Socket.io server with JWT authentication
 * @param {string} token - JWT auth token
 * @returns {import('socket.io-client').Socket}
 */
export function connectSocket(token) {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('🔌 Connected to CivicFix WebSocket');
  });

  socket.on('connect_error', (err) => {
    console.warn('🔌 Socket connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Disconnected from WebSocket:', reason);
  });

  return socket;
}

/**
 * Disconnect from the Socket.io server
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get the current socket instance
 * @returns {import('socket.io-client').Socket|null}
 */
export function getSocket() {
  return socket;
}

/**
 * Subscribe to an event
 * @param {string} event
 * @param {Function} callback
 */
export function onSocketEvent(event, callback) {
  if (socket) {
    socket.on(event, callback);
  }
}

/**
 * Unsubscribe from an event
 * @param {string} event
 * @param {Function} callback
 */
export function offSocketEvent(event, callback) {
  if (socket) {
    socket.off(event, callback);
  }
}

/**
 * Emit an event to the server
 * @param {string} event
 * @param {*} data
 */
export function emitSocketEvent(event, data) {
  if (socket?.connected) {
    socket.emit(event, data);
  }
}
