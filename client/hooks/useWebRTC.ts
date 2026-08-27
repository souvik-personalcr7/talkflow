import { useState, useRef, useCallback, useEffect } from 'react';
import { socket } from '../lib/socket';

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'declined' | 'busy' | 'offline' | 'failed' | 'ended';
export type CallType = 'audio' | 'video';

export interface CallState {
  status: CallStatus;
  type: CallType | null;
  remoteUserId: string | null;
  remoteUserName: string | null;
  isIncoming: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMicMuted: boolean;
  isCameraOff: boolean;
}

export function useWebRTC(showToast: (message: string, type: 'error'|'info'|'success') => void) {
  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    type: null,
    remoteUserId: null,
    remoteUserName: null,
    isIncoming: false,
    localStream: null,
    remoteStream: null,
    isMicMuted: false,
    isCameraOff: false,
  });

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  // Ice servers configuration
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const cleanup = useCallback(() => {
    // Stop local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    // Close PeerConnection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    // Reset state
    setCallState({
      status: 'idle',
      type: null,
      remoteUserId: null,
      remoteUserName: null,
      isIncoming: false,
      localStream: null,
      remoteStream: null,
      isMicMuted: false,
      isCameraOff: false,
    });
  }, []);

  const createPeerConnection = useCallback((remoteUserId: string) => {
    const pc = new RTCPeerConnection(rtcConfig);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('call:ice-candidate', { targetId: remoteUserId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      setCallState(prev => ({
        ...prev,
        remoteStream: event.streams[0]
      }));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState(prev => ({ ...prev, status: 'connected' }));
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        cleanup();
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnection.current = pc;
    return pc;
  }, [cleanup]);

  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({ ...prev, isMicMuted: !audioTrack.enabled }));
      }
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({ ...prev, isCameraOff: !videoTrack.enabled }));
      }
    }
  }, []);

  const initiateCall = useCallback(async (receiverId: string, receiverName: string, type: CallType) => {
    try {
      setCallState(prev => ({
        ...prev,
        status: 'calling',
        type,
        remoteUserId: receiverId,
        remoteUserName: receiverName,
        isIncoming: false
      }));

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });
      
      localStreamRef.current = stream;
      setCallState(prev => ({ ...prev, localStream: stream }));

      socket.emit('call:initiate', { receiverId, type });

    } catch (err) {
      console.error('Failed to get user media', err);
      showToast(type === 'video' ? 'Camera permission is required for video calls.' : 'Microphone permission is required for audio calls.', 'error');
      cleanup();
    }
  }, [cleanup, showToast]);

  const acceptCall = useCallback(async () => {
    if (!callState.remoteUserId || !callState.type) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callState.type === 'video'
      });
      
      localStreamRef.current = stream;
      setCallState(prev => ({ ...prev, localStream: stream, status: 'connecting' }));

      socket.emit('call:accept', { callerId: callState.remoteUserId });
    } catch (err) {
      console.error('Failed to get user media', err);
      showToast(callState.type === 'video' ? 'Camera permission is required for video calls.' : 'Microphone permission is required for audio calls.', 'error');
      socket.emit('call:decline', { callerId: callState.remoteUserId });
      cleanup();
    }
  }, [callState.remoteUserId, callState.type, cleanup, showToast]);

  const declineCall = useCallback(() => {
    if (callState.remoteUserId) {
      socket.emit('call:decline', { callerId: callState.remoteUserId });
    }
    cleanup();
  }, [callState.remoteUserId, cleanup]);

  const endCall = useCallback(() => {
    if (callState.remoteUserId) {
      socket.emit('call:end', { otherUserId: callState.remoteUserId });
    }
    cleanup();
  }, [callState.remoteUserId, cleanup]);

  // Socket event listeners
  useEffect(() => {
    const handleIncoming = (payload: { callerId: string, callerName: string, type: CallType }) => {
      // If already in a call or calling, automatically reject busy via socket logic on backend.
      // But just in case:
      setCallState(prev => {
        if (prev.status !== 'idle') return prev; 
        return {
          ...prev,
          status: 'ringing',
          type: payload.type,
          remoteUserId: payload.callerId,
          remoteUserName: payload.callerName,
          isIncoming: true
        };
      });
    };

    const handleAccepted = async (payload: { receiverId: string }) => {
      setCallState(prev => ({ ...prev, status: 'connecting' }));
      const pc = createPeerConnection(payload.receiverId);
      
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call:offer', { receiverId: payload.receiverId, offer });
      } catch (err) {
        console.error('Error creating offer', err);
      }
    };

    const handleOffer = async (payload: { callerId: string, offer: RTCSessionDescriptionInit }) => {
      const pc = createPeerConnection(payload.callerId);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('call:answer', { callerId: payload.callerId, answer });
      } catch (err) {
        console.error('Error handling offer', err);
      }
    };

    const handleAnswer = async (payload: { receiverId: string, answer: RTCSessionDescriptionInit }) => {
      if (peerConnection.current) {
        try {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
        } catch (err) {
          console.error('Error setting remote description from answer', err);
        }
      }
    };

    const handleIceCandidate = async (payload: { senderId: string, candidate: RTCIceCandidateInit }) => {
      if (peerConnection.current) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (err) {
          console.error('Error adding ice candidate', err);
        }
      }
    };

    const handleDeclined = () => {
      showToast('Call declined.', 'info');
      cleanup();
    };

    const handleEnded = () => {
      showToast('Call ended.', 'info');
      cleanup();
    };

    const handleBusy = () => {
      showToast('User is currently busy.', 'info');
      cleanup();
    };

    const handleUnavailable = () => {
      showToast('User is offline.', 'info');
      cleanup();
    };

    const handleError = (payload: { message: string }) => {
      showToast(payload.message || 'Call failed.', 'error');
      cleanup();
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:accepted', handleAccepted);
    socket.on('call:offer', handleOffer);
    socket.on('call:answer', handleAnswer);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:declined', handleDeclined);
    socket.on('call:ended', handleEnded);
    socket.on('call:busy', handleBusy);
    socket.on('call:unavailable', handleUnavailable);
    socket.on('call:error', handleError);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:accepted', handleAccepted);
      socket.off('call:offer', handleOffer);
      socket.off('call:answer', handleAnswer);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:declined', handleDeclined);
      socket.off('call:ended', handleEnded);
      socket.off('call:busy', handleBusy);
      socket.off('call:unavailable', handleUnavailable);
      socket.off('call:error', handleError);
    };
  }, [createPeerConnection, cleanup, showToast]);

  // Handle timeout for calling/ringing
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (callState.status === 'calling' || callState.status === 'ringing') {
      timeout = setTimeout(() => {
        if (callState.isIncoming) {
          declineCall();
        } else {
          showToast('No answer.', 'info');
          endCall();
        }
      }, 30000); // 30 seconds timeout
    }
    return () => clearTimeout(timeout);
  }, [callState.status, callState.isIncoming, declineCall, endCall, showToast]);

  return {
    ...callState,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMic,
    toggleCamera,
  };
}
