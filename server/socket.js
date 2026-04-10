import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

let io = null;

/**
 * Initialize Socket.io server and attach to HTTP server
 * @param {import('http').Server} httpServer
 * @returns {Server} Socket.io server instance
 */
export function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── Auth middleware — verify JWT on connection ──────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userDepartment = user.department;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // ─── Connection handler ─────────────────────────────
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.userId} (${socket.userRole})`);

    // Join personal room for targeted notifications
    socket.join(`user:${socket.userId}`);

    // Join role-based rooms
    socket.join(`role:${socket.userRole}`);

    // Join department room if applicable
    if (socket.userDepartment) {
      socket.join(`dept:${socket.userDepartment}`);
    }

    // ── Client requests to mark notification as read ──
    socket.on('notification:read', (notificationId) => {
      // This is handled via REST API, but we acknowledge
      socket.emit('notification:read:ack', { id: notificationId });
    });

    // ── Client requests unread count ──────────────────
    socket.on('notification:count', async () => {
      try {
        const { default: Notification } = await import('./models/Notification.js');
        const count = await Notification.countDocuments({
          recipient: socket.userId,
          isRead: false,
        });
        socket.emit('notification:count', { count });
      } catch (err) {
        console.error('Socket count error:', err);
      }
    });

    // ── Disconnect ────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${socket.userId} (${reason})`);
    });
  });

  console.log('⚡ Socket.io initialized');
  return io;
}

/**
 * Get the Socket.io server instance
 * @returns {Server|null}
 */
export function getIO() {
  return io;
}

/**
 * Emit a notification to a specific user
 * @param {string} userId - Target user ID
 * @param {object} notification - Notification data
 */
export function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

/**
 * Emit to all users in a department
 * @param {string} department - Department name
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
export function emitToDepartment(department, event, data) {
  if (io) {
    io.to(`dept:${department}`).emit(event, data);
  }
}

/**
 * Emit to all users with a specific role
 * @param {string} role - Role name
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
export function emitToRole(role, event, data) {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
}

/**
 * Broadcast to all connected clients
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
export function broadcast(event, data) {
  if (io) {
    io.emit(event, data);
  }
}
