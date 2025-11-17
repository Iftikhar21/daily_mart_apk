import axios from 'axios';

export const BASE_URL = 'http://192.168.0.73:8000/api'; // ganti sesuai IP kamu

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

export default api;