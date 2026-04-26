import axios from 'axios';
import { getToken } from './tokenService';

const BASE_URL = 'https://api.unklatam.com';

const createClient = (token = null) => {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: { Accept: 'application/json' },
  });

  client.interceptors.request.use(async (config) => {
    const t = token || (await getToken());
    if (t) {
      config.headers.Authorization = `Bearer ${t}`;
    }
    return config;
  });

  return client;
};

export default createClient;
