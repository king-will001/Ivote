import { jsPDF } from 'jspdf';

const safeNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const sanitizeFileName = (title) =>
  String(title || 'election')
    .trim()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'election';

export const exportResultsPdf = ({
  title,
  totalVotes,
  endLabel,
  candidates = [],
}) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const safeTitle = title || 'Election Results';
  const safeTotalVotes = safeNumber(totalVotes);
  const resolvedEndLabel = endLabel || 'TBD';

  const header = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(safeTitle, 20, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Total Votes: ${safeTotalVotes}`, 20, 28);
    doc.text(`End Time: ${resolvedEndLabel}`, 20, 34);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Candidate', 20, 44);
    doc.text('Votes', 125, 44);
    doc.text('Percentage', 160, 44);
    doc.setLineWidth(0.2);
    doc.line(20, 46, 190, 46);
    return 52;
  };

  let cursorY = header();

  if (!Array.isArray(candidates) || candidates.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('No candidates found.', 20, cursorY);
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    candidates.forEach((candidate) => {
      const name = candidate.fullName || 'Unknown candidate';
      const voteCount = safeNumber(candidate.voteCount);
      const percentage =
        safeTotalVotes > 0 ? (voteCount / safeTotalVotes) * 100 : 0;

      const nameLines = doc.splitTextToSize(name, 95);
      const rowHeight = Math.max(nameLines.length, 1) * 6;

      if (cursorY + rowHeight > 285) {
        doc.addPage();
        cursorY = header();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
      }

      doc.text(nameLines, 20, cursorY);
      doc.text(String(voteCount), 125, cursorY);
      doc.text(`${percentage.toFixed(2)}%`, 160, cursorY);
      cursorY += rowHeight;
    });
  }

  const fileName = `${sanitizeFileName(safeTitle)}-results.pdf`;
  doc.save(fileName);
};
