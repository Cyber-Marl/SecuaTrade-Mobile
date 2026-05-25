import { create } from 'zustand';
import { Platform } from 'react-native';

const LAN_IP = process.env.EXPO_PUBLIC_API_IP || '10.169.85.43';

const getWsUrl = () => {
  return `ws://${LAN_IP}:8000/ws/market/`;
};

const useTradeStore = create((set, get) => ({
  activeAsset: null,
  orderBook: { bids: [], asks: [], current_price: null },
  prices: {},
  socket: null,
  isConnected: false,

  setActiveAsset: (asset) => {
    const currentAsset = get().activeAsset;
    const socket = get().socket;

    if (currentAsset?.id === asset?.id) return;

    if (socket && socket.readyState === WebSocket.OPEN && currentAsset) {
      socket.send(JSON.stringify({ action: 'unsubscribe', asset_id: currentAsset.id }));
    }

    set({ activeAsset: asset, orderBook: { bids: [], asks: [], current_price: null } });

    if (socket && socket.readyState === WebSocket.OPEN && asset) {
      socket.send(JSON.stringify({ action: 'subscribe', asset_id: asset.id }));
    }
  },

  connectWebSocket: () => {
    if (get().socket) return;
    
    const ws = new WebSocket(getWsUrl());
    
    ws.onopen = () => {
      set({ isConnected: true });
      const asset = get().activeAsset;
      if (asset) {
        ws.send(JSON.stringify({ action: 'subscribe', asset_id: asset.id }));
      }
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      // Handle L2 orderbook depth updates
      if (message.type === 'orderbook_update') {
        set({ 
          orderBook: {
            bids: message.bids || [],
            asks: message.asks || [],
            current_price: message.current_price
          } 
        });
      }
      
      // Handle real-time stock ticker price updates
      if (message.type === 'price_update') {
        const { ticker, price } = message.data;
        set(prev => ({
          prices: {
            ...prev.prices,
            [ticker]: price
          }
        }));
      }
    };

    ws.onclose = () => {
      set({ isConnected: false, socket: null });
      // Reconnect after 3 seconds if disconnected
      setTimeout(() => {
        get().connectWebSocket();
      }, 3000);
    };

    set({ socket: ws });
  },

  disconnectWebSocket: () => {
    const ws = get().socket;
    if (ws) {
      ws.close();
      set({ socket: null, isConnected: false });
    }
  }
}));

export default useTradeStore;
