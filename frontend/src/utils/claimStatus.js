const NOT_AVAILABLE = 'Unavailable';

export function getPersistedClaimStatus(status) {
  switch (typeof status === 'string' ? status.toUpperCase() : '') {
    case 'DRAFT':
    case 'PENDING':
      return {
        key: 'draft',
        label: 'Draft claim',
        description: 'A claim record exists in the backend but has not been submitted for review.',
      };
    case 'SUBMITTED':
      return {
        key: 'submitted',
        label: 'Submitted claim',
        description: 'The persisted record is marked submitted.',
      };
    case 'UNDER_REVIEW':
      return {
        key: 'under-review',
        label: 'Awaiting review',
        description: 'The API presents this persisted claim as under review.',
      };
    case 'APPROVED':
      return {
        key: 'approved',
        label: 'Approved',
        description: 'This status comes from a persisted backend claim record.',
      };
    case 'REJECTED':
      return {
        key: 'rejected',
        label: 'Rejected',
        description: 'This status comes from a persisted backend claim record.',
      };
    default:
      return {
        key: 'unavailable',
        label: NOT_AVAILABLE,
        description: 'The backend did not return a recognized persisted claim status.',
      };
  }
}

export function isManualReviewRecommendation(recommendation) {
  return typeof recommendation === 'string' && recommendation.toLowerCase().includes('manual review');
}

export function findClaimForUpload(claims, uploadId) {
  if (!Array.isArray(claims) || uploadId === null || uploadId === undefined) return null;
  return claims.find((claim) => claim?.upload?.id === uploadId) || null;
}

export function getDecisionConflictInfo(status, recommendation) {
  if (!status || !recommendation) {
    return { hasConflict: false, isOverride: false, note: null };
  }

  const normStatus = String(status).toUpperCase();
  const normRec = String(recommendation).toUpperCase();

  const isApproved = normStatus === 'APPROVED';
  const isRejected = normStatus === 'REJECTED';
  const aiApprove = normRec.includes('APPROVE');
  const aiReject = normRec.includes('REJECT');

  if ((isApproved && aiReject) || (isRejected && aiApprove)) {
    return {
      hasConflict: true,
      isOverride: true,
      note: 'Human Inspector Override: An authorized Inspector recorded a final decision that differs from the AI recommendation based on field verification or detailed review.',
    };
  }

  if (isApproved && aiApprove) {
    return {
      hasConflict: false,
      isOverride: false,
      note: 'Matching Alignment: Final Inspector approval aligns with the automated AI recommendation.',
    };
  }

  if (isRejected && aiReject) {
    return {
      hasConflict: false,
      isOverride: false,
      note: 'Matching Alignment: Final Inspector rejection aligns with the automated AI recommendation.',
    };
  }

  return { hasConflict: false, isOverride: false, note: null };
}
