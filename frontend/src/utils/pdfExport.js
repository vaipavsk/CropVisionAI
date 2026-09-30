import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import aiApi from '../services/aiApi';

const API_ORIGIN = (import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

/**
 * Fetches an authenticated image via JWT aiApi instance and converts it to a base64 Data URL.
 * Returns null if fetching fails or path is missing.
 */
export async function fetchAuthenticatedImageDataUrl(path) {
  if (!path) return null;
  const fullUrl = path.startsWith('http') ? path : `${API_ORIGIN}${path}`;
  try {
    const response = await aiApi.get(fullUrl, { responseType: 'blob' });
    const blob = response.data;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Failed to fetch authenticated image for PDF export:', path, err);
    return null;
  }
}

/**
 * Captures a DOM container element and exports it as a multi-page A4 PDF file.
 */
export async function exportReportElementToPDF(element, filename = 'Claim_Assessment_Report.pdf') {
  if (!element) throw new Error('Report DOM element not found');

  // Capture canvas with 2x scale for high resolution print quality
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#0b1329', // Dark theme matching AI Mission Control
    windowWidth: 1100,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pdfHeight;

  // Additional pages if report exceeds one page
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;
  }

  pdf.save(filename);
}
