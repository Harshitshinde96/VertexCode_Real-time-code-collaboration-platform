import { io } from 'socket.io-client';

export const initSocket = () => {
    const backendURL = import.meta.env.VITE_BACKEND_URL;

    if (!backendURL) {
        throw new Error('VITE_BACKEND_URL is not defined in .env file');
    }

    const options = {
        reconnection: true,
        reconnectionAttempts: Infinity, 
        reconnectionDelay: 1000, 
        transports: ['websocket'],
    };

    return io(backendURL, options);
};