import { useEffect, useState } from 'react';
import { socket } from '../lib/socket';
import { useAuth } from './useAuth';

export const useSocket = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    if (user) {
      // Connect when authenticated
      if (!socket.connected) {
        socket.connect();
      }

      const onConnect = () => {
        setIsConnected(true);
        setIsReconnecting(false);
      };

      const onDisconnect = () => {
        setIsConnected(false);
      };

      const onConnectError = (err: Error) => {
        console.error('Socket connection error:', err.message);
        setIsReconnecting(true);
      };

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('connect_error', onConnectError);

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('connect_error', onConnectError);
      };
    } else {
      // Disconnect when logged out
      if (socket.connected) {
        socket.disconnect();
      }
    }
  }, [user]);

  return { socket, isConnected, isReconnecting };
};
