'use client';

import { useEffect } from 'react';
import { acquireSocket, releaseSocket } from './socket';

/**
 * Live updates for the portal shell, mirroring what HomePage.jsx listens for on
 * mobile.
 *
 * Vendors join `user_<vendorId>` — not `vendor_<id>` — because that is the room
 * the backend emits vendor events to (see keplix-backend/socket.js).
 */
export function useVendorSocket({ vendorId, queryClient, toast }) {
  useEffect(() => {
    if (!vendorId) return undefined;

    const socket = acquireSocket();
    if (!socket) return undefined;

    const refreshJobs = () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['walk-ins'] });
    };

    // Named handlers so cleanup removes only these — the socket is shared with
    // the chat screen, which listens for receive_message too.
    const handlers = {
      connect: () => socket.emit('join_room', `user_${vendorId}`),

      new_service_request: () => {
        refreshJobs();
        toast?.info('New service request — accept or decline it to lock the slot.');
      },

      booking_cancelled: () => {
        refreshJobs();
        toast?.info('A booking was cancelled by the customer.');
      },

      payment_received: () => {
        refreshJobs();
        queryClient.invalidateQueries({ queryKey: ['earnings'] });
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        toast?.success('Payment received.');
      },

      early_start_accepted: () => {
        refreshJobs();
        toast?.success('The customer agreed to start early.');
      },

      early_start_declined: () => {
        refreshJobs();
        toast?.info('The customer declined the early start.');
      },

      receive_message: () => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      },

      // Emitted by workers/notificationProcessor.js.
      notification: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
    };

    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));
    if (socket.connected) handlers.connect();

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
      releaseSocket();
    };
  }, [vendorId, queryClient, toast]);
}

export default useVendorSocket;
