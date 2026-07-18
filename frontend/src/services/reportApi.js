import api, { handleApiError } from './api';

/**
 * Retrieves a list of diagnostic reports.
 * @returns {Promise<Array>} List of generated claim reports.
 */
export const getReports = async () => {
  try {
    const response = await api.get('/reports');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Downloads a specific diagnostic report file (e.g. PDF).
 * @param {string|number} id - The ID of the report.
 * @returns {Promise<Blob>} File contents blob.
 */
export const downloadReport = async (id) => {
  try {
    const response = await api.get(`/reports/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

const reportApi = {
  getReports,
  downloadReport,
};

export default reportApi;
