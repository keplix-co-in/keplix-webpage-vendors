'use client';

import { useEffect } from 'react';
import { acquireSocket, releaseSocket } from './socket';
import { playAlertBeep, stopAlertBeep } from './alertSound';
import { showBrowserNotification } from './browserNotify';

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

      // The three alert channels, all opt-in from the header's Alerts menu:
      // the beep (this tab), a desktop notification (tab hidden), and Web Push
      // (delivered by the backend, works with the browser closed). The tag on
      // the desktop notification matches the one the push carries, so a vendor
      // with both on sees one alert, not two.
      new_service_request: (data) => {
        refreshJobs();
        toast?.info('New service request — accept or decline it to lock the slot.');
        playAlertBeep();
        showBrowserNotification({
          title: 'New service request',
          body: `${data?.userName || 'A customer'} requested ${data?.service || 'a service'}.`,
          tag: 'kx-NEW_BOOKING_ALERT',
          url: data?.bookingId ? `/bookings/${data.bookingId}` : '/bookings',
          urgent: true,
        });
      },

      booking_cancelled: (data) => {
        refreshJobs();
        // The request may have been ringing; there is nothing left to answer.
        stopAlertBeep();
        toast?.info('A booking was cancelled by the customer.');
        showBrowserNotification({
          title: 'Booking cancelled',
          body: 'A booking was cancelled by the customer.',
          tag: 'kx-BOOKING_CANCELLED',
          url: data?.bookingId ? `/bookings/${data.bookingId}` : '/bookings',
        });
      },

      payment_received: () => {
        refreshJobs();
        queryClient.invalidateQueries({ queryKey: ['earnings'] });
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        toast?.success('Payment received.');
        showBrowserNotification({
          title: 'Payment received',
          body: 'A customer payment has come in.',
          tag: 'kx-PAYMENT_RECEIVED',
          url: '/earnings',
        });
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
