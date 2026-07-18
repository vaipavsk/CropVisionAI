import api, { handleApiError } from './api';

/**
 * Retrieves general dashboard metrics and summary statistics.
 * @returns {Promise<Object>} Object containing stats like claim values, confidence indexes, and scan counts.
 */
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Retrieves the history of crop scans and claim verifications.
 * @returns {Promise<Array>} List of historical predictions.
 */
export const getPredictionHistory = async () => {
  try {
    const response = await api.get('/dashboard/history');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

const dashboardApi = {
  getDashboardStats,
  getPredictionHistory,
};

export default dashboardApi;
