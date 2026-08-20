import React from 'react';
import { useSocket } from '../../hooks/useSocket';

export const ConnectionStatus = () => {
  const { isConnected, isReconnecting } = useSocket();

  if (isReconnecting) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-yellow-500 font-medium px-2 py-1 bg-yellow-500/10 rounded-md w-fit">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
        </span>
        Reconnecting...
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium px-2 py-1 bg-emerald-500/10 rounded-md w-fit">
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        Connected
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium px-2 py-1 bg-rose-500/10 rounded-md w-fit">
      <span className="relative flex h-2 w-2">
        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
      </span>
      Disconnected
    </div>
  );
};
