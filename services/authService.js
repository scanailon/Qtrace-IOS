import createClient from './apiClient';
import { saveToken, saveUser, clearToken, getToken } from './tokenService';

/**
 * Login via api.unklatam.com/qtrace/user/login
 * Equivalente a MainActivity.performLogin + RetrofitClient
 */
export const login = async (email, password) => {
  const client = createClient();

  const { data } = await client.post('/qtrace/user/login', {
    username: email,
    password,
  });

  const token = data.token;
  await saveToken(token);

  const authedClient = createClient(token);
  const { data: user } = await authedClient.get('/qtrace/user/getLoggedUser');

  await saveUser(user);

  return { token, user };
};

/**
 * Obtener usuario logueado (revalida sesi?n)
 */
export const getLoggedUser = async () => {
  const client = createClient();
  const { data } = await client.get('/qtrace/user/getLoggedUser');
  return data;
};

/**
 * Logout ? limpia token y datos
 */
export const logout = async () => {
  await clearToken();
};

export { getToken };
