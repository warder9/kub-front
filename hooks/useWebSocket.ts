import { useEffect, useRef, useState } from 'react';

const useWebSocket = (chatId: number | null, onMessage: (message: any) => void) => {
    const ws = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!chatId) {
            return;
        }

        const token = localStorage.getItem('auth_token');
        if (!token) {
            return;
        }

        const wsUrl = `${process.env.NEXT_PUBLIC_WS_BASE_URL || 'wss://api.kubcrm.kz'}/chats/${chatId}/ws?token=${token}`;
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
        };

        ws.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            onMessage(message);
        };

        ws.current.onclose = (event) => {
            console.log('WebSocket disconnected', event.code, event.reason);
            setIsConnected(false);
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsConnected(false);
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [chatId, onMessage]);

    return { isConnected };
};

export default useWebSocket;
