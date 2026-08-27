'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useWebRTC, CallStatus, CallType, CallState } from '../hooks/useWebRTC';
import { useToast } from './ToastContext';

interface CallContextType extends CallState {
  initiateCall: (receiverId: string, receiverName: string, type: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  toggleMic: () => void;
  toggleCamera: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const webRTC = useWebRTC(showToast);

  return (
    <CallContext.Provider value={webRTC}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
