import aiApi from './aiApi';

/**
 * Read only the authenticated farmer's persisted claim records.
 * The API applies Firebase authentication and upload ownership filtering.
 */
export async function getMyClaims() {
  const response = await aiApi.get('/claims/mine');
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Create a new claim record for the authenticated user.
 */
export async function createClaim(claimData) {
  const response = await aiApi.post('/claims', claimData);
  return response.data;
}
