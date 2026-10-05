'use client';

import { useEffect, useRef, useState } from 'react';
import { activityApi, type ActivityEvent } from '@/lib/api/activity';
import { isDevelopmentAuthBypassEnabled } from '@/lib/authPreview';

export type ActivityTransport = 'WebSocket' | 'SSE' | 'Preview' | 'Polling';
export type ActivityConnection = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';

export function useActivityStream(
  companyId: string | undefined,
  initialEvents: ActivityEvent[] = [],
) {
  const [events, setEvents] = useState<ActivityEvent[]>(initialEvents);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [connection, setConnection] = useState<ActivityConnection>('CONNECTING');
  const [transport, setTransport] = useState<ActivityTransport>('Polling');
  const wsRef = useRef<WebSocket | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setEvents(initialEvents);
  }, [companyId]);

  useEffect(() => {
    if (!initialEvents.length) return;
    setEvents((prev) => {
      if (prev.length === 0) return initialEvents;
      const known = new Set(prev.map((event) => event.id));
      const extras = initialEvents.filter((event) => !known.has(event.id));
      if (extras.length === 0 && prev.length >= initialEvents.length) return prev;
      return [...extras, ...prev].slice(0, 200);
    });
  }, [initialEvents]);

  useEffect(() => {
    if (!companyId) return;

    if (isDevelopmentAuthBypassEnabled()) {
      setConnection('CONNECTED');
      setTransport('Preview');
      return;
    }

    let subscribed = true;

    const prepend = (incoming: ActivityEvent) => {
      if (!incoming?.event_type || !incoming.id) return;
      setEvents((prev) => {
        if (prev.some((event) => event.id === incoming.id)) return prev;
        return [incoming, ...prev].slice(0, 200);
      });
      setFreshIds((prev) => {
        const next = new Set(prev);
        next.add(incoming.id);
        return next;
      });
      window.setTimeout(() => {
        setFreshIds((prev) => {
          if (!prev.has(incoming.id)) return prev;
          const next = new Set(prev);
          next.delete(incoming.id);
          return next;
        });
      }, 2200);
    };

    const connectSse = () => {
      try {
        const source = new EventSource(activityApi.getStreamUrl(companyId));
        sseRef.current = source;
        setTransport('SSE');
        source.onopen = () => {
          if (subscribed) setConnection('CONNECTED');
        };
        source.onmessage = (message) => {
          if (!subscribed) return;
          try {
            prepend(JSON.parse(message.data) as ActivityEvent);
          } catch {
            /* heartbeat */
          }
        };
        source.onerror = () => {
          if (!subscribed) return;
          setConnection('DISCONNECTED');
          source.close();
        };
      } catch {
        setConnection('DISCONNECTED');
        setTransport('Polling');
      }
    };

    try {
      const socket = new WebSocket(activityApi.getWebSocketUrl(companyId));
      wsRef.current = socket;
      setTransport('WebSocket');
      setConnection('CONNECTING');
      socket.onopen = () => {
        if (subscribed) setConnection('CONNECTED');
      };
      socket.onmessage = (message) => {
        if (!subscribed) return;
        try {
          prepend(JSON.parse(message.data) as ActivityEvent);
        } catch {
          /* heartbeat */
        }
      };
      socket.onerror = () => {
        if (!subscribed) return;
        socket.close();
        connectSse();
      };
      socket.onclose = () => {
        if (!subscribed) return;
        if (sseRef.current) return;
        setConnection('DISCONNECTED');
      };
    } catch {
      connectSse();
    }

    return () => {
      subscribed = false;
      wsRef.current?.close();
      wsRef.current = null;
      sseRef.current?.close();
      sseRef.current = null;
    };
  }, [companyId]);

  return { events, freshIds, connection, transport };
}
