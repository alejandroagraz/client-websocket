
// frontend
// src/App.tsx

import React, { useEffect, useState } from 'react';
import './App.css';

interface Message {
    userId: string;
    message: string;
}

interface SentMessage {
    to: string;
    message: string;
}

const App: React.FC = () => {
    const CHANNELS_KEY = 'channels';
    const [messages, setMessages] = useState<Message[]>([]);
    const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);
    const [token, setToken] = useState('');
    const [userId, setUserId] = useState('');
    const [uuid, setUuid] = useState('');
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [wsStatus, setWsStatus] = useState<string>('Offline');
    const [channelNames, setChannelNames] = useState<string[]>([]);
    const [messageChannelName, setMessageChannelName] = useState('');
    const [channelMessage, setChannelMessage] = useState('');
    const [joinMessage, setJoinMessage] = useState('');
    const RECONNECT_INTERVAL = 3000;

    const connectWebSocket = () => {
        if (token && userId && uuid) {
            const url = process.env.REACT_APP_SOCKET_URL;
            const websocket = new WebSocket(`ws://${url}?token=${token}&userId=${userId}&uuid=${uuid}`);

            websocket.onopen = () => {
                console.log('WebSocket abierto');
                setWs(websocket);
                setWsStatus('Online');
            };

            websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.message) {
                    setMessages(prev => [...prev, { userId: "Servidor", message: data.message }]);
                }
            };

            websocket.onclose = (event) => {
                console.log('WebSocket cerrado', event);
                setWsStatus('Offline');
                handleReconnect()
            };

            websocket.onerror = (event) => {
                console.error('WebSocket error:', event);
            };
        } else {
            alert("Por favor, introduce un token.");
        }
    };

    const handleReconnect = () => {
        console.log('handleReconnect...');
        setTimeout(() => {
            connectWebSocket()
        }, RECONNECT_INTERVAL);
    };

    const joinChannel = () => {
        saveChannelsToLocalStorage(channelNames)
        console.log(channelNames, ws, 'joinChannel');
        if (ws && ws.readyState === WebSocket.OPEN && channelNames.length > 0) {
            const joinData = {
                type: 'join',
                channels: channelNames.reduce<string[]>((acc, channelName) => {
                    acc.push(channelName);
                    return acc;
                }, [])
            };
            ws.send(JSON.stringify(joinData));
            setJoinMessage(`Te has unido a los canales: ${channelNames.join(', ')}`);
        } else {
            console.warn('El WebSocket no está abierto. Intenta reconectar. joinChannel');
        }
    };

    const sendChannelMessage = () => {
        if (ws && ws.readyState === WebSocket.OPEN && channelMessage.trim()) {
            const msgData = {
                channel: messageChannelName,
                message: channelMessage,
            };
            ws.send(JSON.stringify(msgData));
            setSentMessages(prev => [
                ...prev,
                { to: messageChannelName || "Todos", message: channelMessage }
            ]);
            setChannelMessage('');
            setMessageChannelName('');
        } else {
            console.warn('El WebSocket no está abierto. Intenta reconectar. sendChannelMessage');
        }
    };

    const getChannelsFromLocalStorage = (): string[] => {
        const channels = localStorage.getItem(CHANNELS_KEY);
        return channels ? JSON.parse(channels) : [];
    };

    const saveChannelsToLocalStorage = (newChannels: string[]) => {
        const channels = getChannelsFromLocalStorage();
        newChannels.forEach(channel => {
            if (!channels.includes(channel)) {
                channels.push(channel);
            }
        });
        localStorage.setItem(CHANNELS_KEY, JSON.stringify(channels));
    };

    const reconnectingChannel = () => {
        const channels = getChannelsFromLocalStorage();
        console.log(channels, ws, 'reconnectingChannel');
        if (ws && ws.readyState === WebSocket.OPEN && channels.length > 0) {
            const joinData = {
                type: 'join',
                channels: channelNames.reduce<string[]>((acc, channelName) => {
                    acc.push(channelName);
                    return acc;
                }, [])
            };
            setTimeout(() => {
                ws.send(JSON.stringify(joinData));
            }, 1000);
            setJoinMessage(`Te has unido a los canales: ${channelNames.join(', ')}`);
        } else {
            console.warn('El WebSocket no está abierto. Intenta reconectar. joinChannel');
        }
    };

    useEffect(() => {
        if (joinMessage) {
            const timer = setTimeout(() => {
                setJoinMessage('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [joinMessage]);

    useEffect(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            reconnectingChannel();
        }
    }, [ws]);

    return (
        <div>
            <h1>WebSocket Client</h1>
            <label>
                User ID:
                <input
                    type="text"
                    value={userId}
                    onChange={e => setUserId(e.target.value)}
                    placeholder="Ingrese su User ID"
                />
            </label>
            <br />
            <label>
                UUID:
                <input
                    type="text"
                    value={uuid}
                    onChange={e => setUuid(e.target.value)}
                    placeholder="Ingrese su UUID"
                />
            </label>
            <br />
            <label>
                Token:
                <input
                    type="text"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                />
                <button onClick={connectWebSocket}>Conectar</button>
            </label>
            <p>Status: {wsStatus}</p>

            <label>
                Nombres de los Canales a los que desea unirse (separados por comas):
                <input
                    type="text"
                    value={channelNames.join(', ')}
                    onChange={e => setChannelNames(e.target.value.split(',').map(name => name.trim()))}
                    placeholder="Ingrese los nombres de los canales"
                />
            </label>
            <button onClick={joinChannel}>Unirse a los Canales</button> <br/>
            {joinMessage && <p>{joinMessage}</p>}

            <label>
                Canal para Enviar Mensaje:
                <input
                    type="text"
                    value={messageChannelName}
                    onChange={e => setMessageChannelName(e.target.value)}
                    placeholder="Ingrese el nombre del canal para el mensaje"
                />
            </label>

            <label>
                Mensaje al Canal:
                <input
                    type="text"
                    value={channelMessage}
                    onChange={e => setChannelMessage(e.target.value)}
                    placeholder="Ingrese el mensaje para el canal"
                />
            </label>
            <button onClick={sendChannelMessage}>Enviar Mensaje al Canal</button> <br/>

            <h2>Received Messages</h2>
            <ul>
                {[...messages].reverse().map((msg, index) => (
                    <li key={index}><strong>{msg.userId}:</strong> {msg.message}</li>
                ))}
            </ul>

            <h2>Sent Messages</h2>
            <ul>
                {[...sentMessages].reverse().map((sentMsg, index) => (
                    <li key={index}>
                        <strong>Para el canal: </strong> {sentMsg.to}     <strong>Mensaje:</strong> {sentMsg.message}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default App;
