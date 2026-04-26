import axios from 'axios';
import createClient from './apiClient';

const THINGSBOARD_URL = 'https://engine.unklatam.com';

/**
 * Obtener lista de trackers/sensores por customerId
 * Equivalente a ApiService.getTrackers
 */
export const getTrackers = async (customerId) => {
  const client = createClient();
  const { data } = await client.get('/qtrace/device/getTrackers', {
    params: { customerId },
  });
  return data;
};

/**
 * Obtener asset asociado a un sensor
 * Equivalente a ApiService.getAssetBySensor
 */
export const getAssetBySensor = async (deviceId) => {
  const client = createClient();
  const { data } = await client.get('/qtrace/device/asset-by-sensor', {
    params: { deviceId },
  });
  return data;
};

/**
 * Resolver dispositivo por nombre (MAC normalizada)
 * Equivalente a ApiService.resolveDeviceByName
 */
export const resolveDeviceByName = async (name) => {
  const client = createClient();
  const { data } = await client.get('/qtrace/device/resolve-by-name', {
    params: { name },
  });
  return data;
};

/**
 * Obtener telemetría de un dispositivo
 * Equivalente a ApiService.getTelemetry
 */
export const getTelemetry = async (entityId, keys, startTs, endTs) => {
  const client = createClient();
  const { data } = await client.get('/qtrace/device/getTelemetry', {
    params: { entityId, keys, startTs, endTs },
  });
  return data;
};

/**
 * Enviar telemetría al servidor
 * Equivalente a ApiService.sendTelemetry
 */
export const sendTelemetry = async (request) => {
  const client = createClient();
  const { data } = await client.post('/recover/device/saveTelemetry', request);
  return data;
};

/**
 * Generar reporte de vehículo (devuelve PDF en base64)
 * Equivalente a ApiService.generateVehicleReport
 */
export const generateVehicleReport = async (reportRequest) => {
  const client = createClient();
  const { data } = await client.post(
    '/reportes/api/generar-reporte-vehiculo',
    reportRequest
  );
  return data;
};

/**
 * Guardar reporte de vehículo (multipart: JSON + PDF)
 * Equivalente a ApiService.saveVehicleReport
 */
/**
 * Obtener los assets (tiendas) del customer desde ThingsBoard.
 * Equivalente a lo que el widget obtiene del contexto de dashboard.
 *   GET /api/customer/{customerId}/assets?pageSize=100&page=0
 */
export const getCustomerAssets = async (customerId) => {
  const token = await (await import('./tokenService')).getToken();
  const { data } = await axios.get(
    `${THINGSBOARD_URL}/api/customer/${customerId}/assets`,
    {
      params: { pageSize: 100, page: 0 },
      headers: { 'X-Authorization': `Bearer ${token}` },
      timeout: 30000,
    }
  );
  return data;
};

/**
 * Obtener historial de viajes de un asset (telemetría reportevehiculo).
 * Llama a ThingsBoard directamente, igual que el widget historial-viajes2:
 *   GET /api/plugins/telemetry/ASSET/{assetId}/values/timeseries?keys=reportevehiculo&startTs=...&endTs=...
 */
export const getTripsHistory = async (assetId, startTs, endTs) => {
  const token = await (await import('./tokenService')).getToken();
  const { data } = await axios.get(
    `${THINGSBOARD_URL}/api/plugins/telemetry/ASSET/${assetId}/values/timeseries`,
    {
      params: { keys: 'reportevehiculo', startTs, endTs },
      headers: { 'X-Authorization': `Bearer ${token}` },
      timeout: 30000,
    }
  );
  return data;
};

export const saveVehicleReport = async (activoTiendaId, reconstruirViajeJson, pdfUri) => {
  const client = createClient();

  const formData = new FormData();
  formData.append('activo_tienda_id', activoTiendaId);
  formData.append('reconstruir_viaje', reconstruirViajeJson);
  formData.append('pdf', {
    uri: pdfUri,
    name: 'reporte.pdf',
    type: 'application/pdf',
  });

  const { data } = await client.post(
    '/reportes/api/guardar-reporte-vehiculo',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
};
