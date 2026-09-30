import aiApi from './aiApi';
import { handleApiError } from './api';

/**
 * Uploads a crop specimen image file.
 * @param {File} file - The image file to upload.
 * @returns {Promise<Object>} File metadata returned by the server.
 */
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await aiApi.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Retrieves a list of all uploaded specimens.
 * @returns {Promise<Array>} List of uploads.
 */
export const getUploads = async () => {
  try {
    const response = await api.get('/uploads');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Deletes a uploaded specimen.
 * @param {string|number} id - The ID of the upload to delete.
 * @returns {Promise<Object>} Server response.
 */
export const deleteUpload = async (id) => {
  try {
    const response = await api.delete(`/uploads/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

const uploadApi = {
  uploadImage,
  getUploads,
  deleteUpload,
};

export default uploadApi;
