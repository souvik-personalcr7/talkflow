'use client';

import React, { useEffect, useRef } from 'react';
import { useCall } from '../../contexts/CallContext';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import Avatar from '../ui/Avatar';

export default function CallModal() {
  const {
    status,
    type,
    remoteUserName,
    isIncoming,
    localStream,
    remoteStream,
    isMicMuted,
    isCameraOff,
    acceptCall,
    declineCall,
    endCall,
    toggleMic,
    toggleCamera
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Bind streams to media elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, status]);

  useEffect(() => {
    if (remoteStream) {
      if (type === 'video' && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      } else if (type === 'audio' && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream, type, status]);

  if (status === 'idle') return null;

  // Incoming Call UI
  if (status === 'ringing' && isIncoming) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-in fade-in zoom-in duration-200">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            {type === 'video' ? (
              <Video className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Phone className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Incoming {type === 'video' ? 'Video' : 'Audio'} Call
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">{remoteUserName}</p>
          
          <div className="flex justify-center gap-6">
            <button
              onClick={declineCall}
              className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110 shadow-lg"
              aria-label="Decline"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button
              onClick={acceptCall}
              className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110 shadow-lg animate-bounce"
              aria-label="Accept"
            >
              {type === 'video' ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active or Outgoing Call UI
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 text-white">
      {/* Remote Video / Audio Background */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
        {type === 'video' && status === 'connected' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-2xl">
              <span className="text-5xl font-bold text-slate-300">
                {remoteUserName?.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-3xl font-bold mb-2">{remoteUserName}</h2>
            <p className="text-slate-400 text-lg">
              {status === 'calling' && 'Calling...'}
              {status === 'ringing' && 'Ringing...'}
              {status === 'connecting' && 'Connecting...'}
              {status === 'connected' && 'Connected'}
            </p>
          </div>
        )}
        
        {/* Hidden Audio Element for Audio Calls */}
        {type === 'audio' && status === 'connected' && (
          <audio ref={remoteAudioRef} autoPlay />
        )}

        {/* Local Video Preview (Picture in Picture) */}
        {type === 'video' && localStream && !isCameraOff && (
          <div className="absolute top-6 right-6 w-32 md:w-48 aspect-[3/4] bg-slate-800 rounded-xl overflow-hidden shadow-2xl border-2 border-slate-700 z-10 cursor-move">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="h-24 bg-slate-900/90 backdrop-blur border-t border-slate-800 flex items-center justify-center gap-6 px-6 relative z-20 shrink-0">
        <button
          onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            isMicMuted ? 'bg-slate-700 text-red-400' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
          aria-label={isMicMuted ? "Unmute mic" : "Mute mic"}
        >
          {isMicMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {type === 'video' && (
          <button
            onClick={toggleCamera}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isCameraOff ? 'bg-slate-700 text-red-400' : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
            aria-label={isCameraOff ? "Turn on camera" : "Turn off camera"}
          >
            {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        )}

        <button
          onClick={endCall}
          className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110 shadow-lg shadow-red-500/20"
          aria-label="End call"
        >
          <PhoneOff className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
