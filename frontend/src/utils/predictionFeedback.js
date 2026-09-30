export const CONFIDENCE_THRESHOLDS = Object.freeze({
  high: 0.8,
  moderate: 0.6,
});

export const MIN_RECOMMENDED_IMAGE_DIMENSION = 224;

export function getConfidenceFeedback(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    return {
      key: 'unavailable',
      label: 'Confidence unavailable',
      percentage: null,
      description: 'The prediction did not provide a valid classification confidence value.',
      recommendation: 'Review the prediction details and request a new assessment if needed.',
    };
  }

  if (value >= CONFIDENCE_THRESHOLDS.high) {
    return {
      key: 'high',
      label: 'High confidence',
      percentage: value * 100,
      description: 'The classifier assigned a comparatively high probability to its selected class.',
      recommendation: 'Use this as model decision support alongside normal review procedures.',
    };
  }

  if (value >= CONFIDENCE_THRESHOLDS.moderate) {
    return {
      key: 'moderate',
      label: 'Moderate confidence',
      percentage: value * 100,
      description: 'The classifier selected this class with moderate probability.',
      recommendation: 'Consider the image and assessment details before relying on this result.',
    };
  }

  return {
    key: 'low',
    label: 'Low confidence',
    percentage: value * 100,
    description: 'The classifier has limited separation between its selected class and alternatives.',
    recommendation: 'Low-confidence results (< 60%) trigger automatic routing to manual review by an inspector.',
  };
}

export function getImageInputFeedback({ readable, width, height, fileSizeBytes } = {}) {
  const fileSizeValid = typeof fileSizeBytes === 'number' && Number.isFinite(fileSizeBytes) && fileSizeBytes >= 0;
  const dimensionsValid = Number.isInteger(width) && width > 0 && Number.isInteger(height) && height > 0;

  if (readable === false) {
    return {
      key: 'unreadable',
      label: 'Image could not be read',
      dimensions: null,
      fileSizeBytes: fileSizeValid ? fileSizeBytes : null,
      recommendation: 'Choose another JPG or PNG file that your browser can decode.',
    };
  }

  if (readable !== true || !dimensionsValid) {
    return {
      key: 'checking',
      label: 'Checking image input',
      dimensions: null,
      fileSizeBytes: fileSizeValid ? fileSizeBytes : null,
      recommendation: 'Waiting for browser image metadata.',
    };
  }

  const isSmall = width < MIN_RECOMMENDED_IMAGE_DIMENSION || height < MIN_RECOMMENDED_IMAGE_DIMENSION;
  return {
    key: isSmall ? 'small' : 'ready',
    label: isSmall ? 'Small image dimensions' : 'Image input checks complete',
    dimensions: { width, height },
    fileSizeBytes: fileSizeValid ? fileSizeBytes : null,
    recommendation: isSmall
      ? `One side is below ${MIN_RECOMMENDED_IMAGE_DIMENSION}px. A larger, well-framed source image may provide more visual detail.`
      : `Browser decode, dimensions, and file size were available. This is not a blur or disease-quality assessment.`,
  };
}
