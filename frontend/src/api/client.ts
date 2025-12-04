import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL ?? "/api",
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;
