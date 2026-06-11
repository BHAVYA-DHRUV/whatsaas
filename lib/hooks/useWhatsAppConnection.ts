'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getTeamChannel } from '@/lib/pusher-client';

interface ConnectionStatus {
  status: 'connecting' | 'close' | 'open' | 'waiting_qr' | 'unknown' | 'connected' | 'disconnected';
  instance: string;
}

interface QRResponse {
  success: boolean;
  qrcode?: string;
  base64?: string;
  code?: string | null;
  pairingCode?: string | null;
  status?: string;
}

interface UseWhatsAppConnectionOptions {
  instanceName: string;
  teamId: number;
  onConnected?: () => void;
  onError?: (error: string) => void;
}

export function useWhatsAppConnection({
  instanceName,
  teamId,
  onConnected,
  onError,
}: UseWhatsAppConnectionOptions) {
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState<'initializing' | 'waiting_qr' | 'connecting' | 'open'>('initializing');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pusherChannelRef = useRef<any>(null);
  const mountedRef = useRef(true);

  // Clean up function
  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    if (pusherChannelRef.current) {
      pusherChannelRef.current.unbind('connection-status');
      pusherChannelRef.current.unsubscribe();
      pusherChannelRef.current = null;
    }
    
    mountedRef.current = false;
  }, []);

  // Fetch QR code from Evolution API
  const fetchQRCode = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      const response = await fetch(`/api/instance/connect?instanceName=${encodeURIComponent(instanceName)}`);
      const data: QRResponse = await response.json();

      if (!mountedRef.current) return;

      if (data.status === 'open') {
        // Already connected, bypass QR modal
        setConnectionStatus('open');
        setIsConnected(true);
        setQrCode(null);
        setCode(null);
        setPairingCode(null);
        return;
      }

      if (data.base64 || data.qrcode) {
        setQrCode(data.base64 || data.qrcode || null);
        setCode(data.code || null);
        setPairingCode(data.pairingCode || null);
        setConnectionStatus('waiting_qr');
      } else if (data.status === 'connecting') {
        setConnectionStatus('connecting');
      }
    } catch (err: any) {
      if (mountedRef.current) {
        const errorMessage = err.message || 'Failed to fetch QR code';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    }
  }, [instanceName, onError]);

  // Handle connection status updates from Pusher
  const handleConnectionStatus = useCallback((payload: ConnectionStatus) => {
    if (!mountedRef.current) return;

    console.log('[useWhatsAppConnection] Connection status update:', payload);

    if (payload.status === 'open' || payload.status === 'connected') {
      setConnectionStatus('open');
      setIsConnected(true);
      setQrCode(null);
      setCode(null);
      setPairingCode(null);
      setError(null);
      
      // Clean up and redirect
      cleanup();
      
      // Execute immediate programmatic routing
      setTimeout(() => {
        if (mountedRef.current) {
          router.push('/en/inbox');
          onConnected?.();
        }
      }, 100);
    } else if (payload.status === 'connecting') {
      setConnectionStatus('connecting');
    } else if (payload.status === 'close' || payload.status === 'disconnected') {
      setConnectionStatus('connecting');
      setIsConnected(false);
      // Restart QR polling if disconnected
      fetchQRCode();
    } else if (payload.status === 'waiting_qr') {
      setConnectionStatus('waiting_qr');
      fetchQRCode();
    }
  }, [cleanup, router, onConnected, fetchQRCode]);

  const connectionStatusRef = useRef(connectionStatus);
  useEffect(() => {
    connectionStatusRef.current = connectionStatus;
  }, [connectionStatus]);

  // Initialize connection
  useEffect(() => {
    mountedRef.current = true;
    
    // Initial QR fetch
    fetchQRCode();

    // Subscribe to Pusher channel for real-time connection updates
    const channel = getTeamChannel(teamId);
    if (channel) {
      pusherChannelRef.current = channel;
      channel.bind('connection-status', handleConnectionStatus);
    }

    // Set up polling for QR code refresh (QR codes expire in ~60 seconds)
    pollingIntervalRef.current = setInterval(() => {
      const currentStatus = connectionStatusRef.current;
      if (currentStatus === 'waiting_qr' || currentStatus === 'connecting') {
        fetchQRCode();
      }
    }, 30000); // Poll every 30 seconds

    return cleanup;
  }, [teamId, fetchQRCode, handleConnectionStatus, cleanup]);

  return {
    connectionStatus,
    qrCode,
    code,
    pairingCode,
    error,
    isConnected,
    refetchQR: fetchQRCode,
  };
}
