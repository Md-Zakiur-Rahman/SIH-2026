import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function downloadReportPdf(element, filename) {
  if (!element) throw new Error('Report layout is unavailable.');
  if (document.fonts?.ready) await document.fonts.ready;

  const pages = [...element.querySelectorAll('[data-pdf-page]')];
  if (!pages.length) throw new Error('Report pages are unavailable.');

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  for (const [index, page] of pages.entries()) {
    const canvas = await html2canvas(page, {
      backgroundColor: '#f7f8fa',
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: 794,
    });
    if (index > 0) pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.94), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  }
  pdf.save(filename);
}
