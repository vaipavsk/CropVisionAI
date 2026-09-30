import aiApi from './aiApi';
import { handleApiError } from './api';

/**
 * Runs YOLOv8 and EfficientNet inference on an uploaded crop image.
 * @param {string|number} uploadId - The ID of the uploaded specimen.
 * @returns {Promise<Object>} The prediction details and Grad-CAM maps.
 */
export const predict = async (uploadId) => {
  try {
    const response = await aiApi.post(`/predict/${uploadId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Retrieves the details of a past prediction.
 * @param {string|number} id - The ID of the prediction to retrieve.
 * @returns {Promise<Object>} The prediction object.
 */
export const getPrediction = async (id) => {
  try {
    const response = await api.get(`/predictions/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

const predictionApi = {
  predict,
  getPrediction,
};

export default predictionApi;
