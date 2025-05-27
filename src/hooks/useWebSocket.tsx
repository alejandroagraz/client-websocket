import { useEffect, useState, useCallback, useRef } from 'react';

const useWebSocket = (url: string, token: string) => {
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [wsStatus, setWsStatus] = useState<string>('Offline');
    const [connectServer, setConnectServer] = useState<boolean>(false);
    const wsRef = useRef<WebSocket | null>(null); // Usar useRef para el WebSocket

    const startReconnect = useCallback((): void => {
        if (!connectServer) {
            console.log('Intentando reconectar...');
            setTimeout(() => {
                connectWebSocket(); // Aquí se usa connectWebSocket
            }, 3000);
        } else {
            console.error('Máximo de intentos de reconexión alcanzado');
        }
    }, [connectServer]); // Solo depende de connectServer

    const connectWebSocket = useCallback((): void => {
        if (token) {
            const websocket = new WebSocket(`//localhost:80?token=${token}`);
            wsRef.current = websocket; // Guardar el WebSocket en el ref

            websocket.onopen = () => {
                setConnectServer(true);
                setWsStatus('Online');
                console.log('WebSocket abierto');
            };

            websocket.onmessage = (event) => {
                console.log('Mensaje recibido:', event.data);
            };

            websocket.onclose = () => {
                setWsStatus('Offline');
                setConnectServer(false);
                console.log('WebSocket cerrado');
                startReconnect(); // Llamar a startReconnect aquí
            };

            websocket.onerror = (event) => {
                console.error('WebSocket error:', event);
            };

            setWs(websocket);
        } else {
            alert("Por favor, introduce un token.");
        }
    }, [url, token, startReconnect]); // Incluir startReconnect aquí

    useEffect(() => {
        if (token) {
            connectWebSocket();

            return () => {
                if (wsRef.current) {
                    wsRef.current.close(); // Cierra el WebSocket al desmontar el componente
                }
            };
        }
    }, [connectWebSocket, token]); // Incluir token aquí

    return { ws, wsStatus, connectServer, connectWebSocket };
};

export default useWebSocket;
