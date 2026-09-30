import aiApi from './aiApi';

/**
 * Submit or update an inspector's AI explanation feedback for a claim's Grad-CAM heatmap.
 *
 * @param {number|string} claimId - Database ID of the claim.
 * @param {Object} feedbackData
 * @param {string} feedbackData.feedback_label - One of: 'RELEVANT', 'PARTIALLY_RELEVANT', 'NOT_RELEVANT', 'UNABLE_TO_ASSESS'
 * @param {string} [feedbackData.comment] - Optional inspector comments
 * @returns {Promise<Object>} Response object containing saved feedback record
 */
export async function submitExplanationFeedback(claimId, { feedback_label, comment = '' }) {
  if (!claimId) throw new Error('Claim ID is required to submit explanation feedback.');
  if (!feedback_label) throw new Error('Please select a feedback label.');

  const payload = {
    feedback_label,
    comment: comment && comment.trim() ? comment.trim() : null,
  };

  const response = await aiApi.post(`/claims/${claimId}/feedback`, payload);
  return response.data;
}

/**
 * Fetch all recorded explanation feedbacks for a specific claim.
 *
 * @param {number|string} claimId - Database ID of the claim.
 * @returns {Promise<Object>} Response containing feedbacks list
 */
export async function getClaimFeedback(claimId) {
  if (!claimId) throw new Error('Claim ID is required to load feedback.');
  const response = await aiApi.get(`/claims/${claimId}/feedback`);
  return response.data;
}

const feedbackApi = {
  submitExplanationFeedback,
  getClaimFeedback,
};

export default feedbackApi;
