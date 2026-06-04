'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Pusher from 'pusher-js';

interface ConnectWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceName: string; // The dynamic string identifier for your Evolution / WhatsApp instance
  teamId?: number;     // Optional team ID if passed by parent
}

interface QRResponse {
  success: boolean;
  qrCode?: string | null;
  base64?: string | null;
  qrcode?: string | null;
  qr?: string | null;
  code?: string | null;
  pairingCode?: string | null;
  status?: string;
}

export default function ConnectWhatsAppModal({ isOpen, onClose, instanceName, teamId: initialTeamId }: ConnectWhatsAppModalProps) {
  const router = useRouter();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [teamId, setTeamId] = useState<number | null>(initialTeamId || null);

  // 1. Fetching QR Payload securely via backend proxy route
  const fetchQRCode = useCallback(async (isSilent = false) => {
    if (!instanceName) return;
    if (!isSilent) {
      setLoading(true);
      setError(false);
    }

    try {
      const response = await fetch(`/api/instance/connect?instanceName=${encodeURIComponent(instanceName)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to retrieve active QR payload');

      const data: QRResponse = await response.json();
      
      if (data.status === 'open' || data.status === 'connected') {
        onClose();
        router.push('/en/inbox');
        router.refresh();
        return;
      }

      const qrCode = data.base64 || data.qrCode || data.qrcode || data.qr || null;
      if (qrCode) {
        setQrCodeUrl(qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`);
        setError(false);
      } else if (data.status === 'connecting') {
        // Keep waiting/loading state
        if (!isSilent) {
          setQrCodeUrl(null);
        }
      } else {
        throw new Error('QR field missing in server response payload');
      }
    } catch (err) {
      console.error('QR Execution Failure:', err);
      if (!isSilent) {
        setError(true);
      }
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  }, [instanceName, router, onClose]);

  // Fetch Team ID if not provided as prop
  useEffect(() => {
    if (teamId || !isOpen) return;

    const fetchTeam = async () => {
      try {
        const res = await fetch('/api/team');
        if (res.ok) {
          const data = await res.json();
          if (data && data.id) {
            setTeamId(data.id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch team ID for Pusher subscription:', err);
      }
    };

    fetchTeam();
  }, [teamId, isOpen]);

  // Hook into modal visibility changes
  useEffect(() => {
    if (isOpen) {
      fetchQRCode();
    }
  }, [isOpen, fetchQRCode]);

  // 2. Establish Pusher listener channel for real-time authentication
  useEffect(() => {
    if (!isOpen || !instanceName || !teamId) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1';

    if (!pusherKey) {
      console.warn('Pusher client key missing. Real-time scanning redirect will fallback.');
      return;
    }

    // Initialize Pusher Client
    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      forceTLS: true,
    });

    // Subscribing to team channel
    const targetChannel = `team-${teamId}`;
    const channel = pusher.subscribe(targetChannel);

    const handleQrUpdate = (data: { instance?: string; qrcode?: { base64?: string; code?: string; pairingCode?: string } }) => {
      if (data.instance && data.instance !== instanceName) return;
      if (data.qrcode?.base64) {
        const b64 = data.qrcode.base64;
        setQrCodeUrl(b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`);
        setLoading(false);
        setError(false);
      } else {
        fetchQRCode(true);
      }
    };

    const handleConnectionStatus = (data: { status: string; instance?: string }) => {
      if (data.instance && data.instance !== instanceName) return;
      if (data.status === 'open' || data.status === 'connected') {
        channel.unbind_all();
        pusher.unsubscribe(targetChannel);
        pusher.disconnect();
        
        onClose();
        router.push('/en/inbox');
        router.refresh();
      } else if (data.status === 'connecting') {
        setLoading(true);
      } else if (data.status === 'waiting_qr') {
        fetchQRCode(true);
      }
    };

    // Bind events emitted via backend webhook
    channel.bind('qr-update-needed', handleQrUpdate);
    channel.bind('connection-status', handleConnectionStatus);

    // Cleanup hook on component destruction or unexpected close operations
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(targetChannel);
      pusher.disconnect();
    };
  }, [isOpen, instanceName, teamId, router, onClose, fetchQRCode]);

  // Fallback Polling (in case Pusher fails/drops or is not configured)
  useEffect(() => {
    if (!isOpen || !instanceName) return;

    const interval = setInterval(() => {
      fetchQRCode(true); // silent fetch to update QR or detect open status
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [isOpen, instanceName, fetchQRCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 bg-black/40 backdrop-blur-sm">
      
      <div className="relative w-full max-w-md p-6 mx-4 duration-200 bg-white border border-gray-100 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95">
        
        {/* Dynamic Close UI Switch */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-lg p-1.5 hover:bg-gray-50 transition-colors"
          aria-label="Close dialog"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        
        <div className="mt-2 mb-6 text-center">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900">Connect WhatsApp</h3>
          <p className="mt-1 text-sm text-gray-500">Scan the code to link your device</p>
        </div>

        
        <div className="flex flex-col items-center justify-center min-h-[270px] bg-gray-50/70 rounded-xl border border-dashed border-gray-200 p-6 mb-6">
          
          {loading && (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-10 h-10 border-[3.5px] border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-medium text-gray-500">Contacting Evolution Engine...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center space-y-3 text-center">
              <span className="text-xs uppercase tracking-wider font-semibold text-red-500 px-2.5 py-0.5 bg-red-50 rounded-full">Error</span>
              <p className="text-sm text-gray-600">Could not load QR Code.</p>
              <button
                onClick={() => fetchQRCode(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 transition-all bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 active:bg-gray-100"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && qrCodeUrl && (
            <div className="relative p-3 bg-white border shadow-md rounded-xl border-gray-100/80 group">
              <img 
                src={qrCodeUrl} 
                alt="WhatsApp Active Authentication QR" 
                className="object-contain w-52 h-52 mix-blend-multiply"
              />
            </div>
          )}
        </div>

        
        <div className="p-4 space-y-3 text-xs text-gray-600 border border-gray-100 bg-gray-50 rounded-xl">
          <div className="flex items-start space-x-3">
            <span className="flex items-center justify-center w-5 h-5 font-bold text-gray-700 bg-white border border-gray-200 rounded-full shadow-sm shrink-0">1</span>
            <p className="pt-0.5 text-gray-600">Open WhatsApp on your phone.</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="flex items-center justify-center w-5 h-5 font-bold text-gray-700 bg-white border border-gray-200 rounded-full shadow-sm shrink-0">2</span>
            <p className="pt-0.5 text-gray-600">Go to <span className="font-semibold text-gray-900">Settings &gt; Linked Devices</span>.</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="flex items-center justify-center w-5 h-5 font-bold text-gray-700 bg-white border border-gray-200 rounded-full shadow-sm shrink-0">3</span>
            <p className="pt-0.5 text-gray-600">Tap <span className="font-semibold text-emerald-600">"Link a Device"</span> and point your camera here.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
