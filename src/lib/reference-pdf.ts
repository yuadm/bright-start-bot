import jsPDF from 'jspdf';

interface ReferenceData {
  refereeFullName: string;
  refereeJobTitle: string;
  refereeCompany: string;
  refereeEmail: string;
  refereePhone: string;
  relationshipDuration: string;
  
  // Character reference specific
  personalQualities?: string;
  reliability?: string;
  integrity?: string;
  workEthic?: string;
  communication?: string;
  
  // Employer reference specific
  employmentDates?: string;
  jobPerformance?: string;
  attendance?: string;
  teamwork?: string;
  responsibilities?: string;
  reasonForLeaving?: string;
  rehireRecommendation?: string;
  
  // Common final fields
  overallRecommendation: string;
  additionalComments?: string;
  dateCompleted: string;
}

interface CompletedReference {
  id: string;
  reference_name: string;
  reference_type: string;
  form_data: ReferenceData;
  completed_at: string;
  application_id: string;
}

export const generateReferencePDF = (
  reference: CompletedReference,
  applicantName: string,
  companyName: string = 'Company Name'
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const lineHeight = 7;
  let yPosition = 30;

  // Helper function to add text with word wrap
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 11): number => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * lineHeight);
  };

  // Header
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Employment Reference', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Reference type and date
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const referenceType = reference.reference_type === 'employer' ? 'Employer Reference' : 'Character Reference';
  pdf.text(`${referenceType} for ${applicantName}`, margin, yPosition);
  yPosition += 10;

  pdf.text(`Completed: ${new Date(reference.completed_at).toLocaleDateString()}`, margin, yPosition);
  yPosition += 15;

  // Referee Information Section
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Referee Information', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  const refereeInfo = [
    `Name: ${reference.form_data.refereeFullName}`,
    `Job Title: ${reference.form_data.refereeJobTitle}`,
    `Company: ${reference.form_data.refereeCompany}`,
    `Email: ${reference.form_data.refereeEmail}`,
    `Phone: ${reference.form_data.refereePhone}`,
    `Relationship Duration: ${reference.form_data.relationshipDuration}`
  ];

  refereeInfo.forEach(info => {
    pdf.text(info, margin, yPosition);
    yPosition += lineHeight;
  });

  yPosition += 10;

  // Reference Content
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Reference Details', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');

  if (reference.reference_type === 'employer') {
    // Employer reference specific content
    if (reference.form_data.employmentDates) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Employment Dates:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(reference.form_data.employmentDates, margin + 80, yPosition);
      yPosition += lineHeight + 5;
    }

    if (reference.form_data.responsibilities) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Key Responsibilities:', margin, yPosition);
      yPosition += lineHeight;
      pdf.setFont('helvetica', 'normal');
      yPosition = addWrappedText(reference.form_data.responsibilities, margin, yPosition, pageWidth - 2 * margin);
      yPosition += 5;
    }

    if (reference.form_data.jobPerformance) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Job Performance:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(reference.form_data.jobPerformance.charAt(0).toUpperCase() + reference.form_data.jobPerformance.slice(1), margin + 80, yPosition);
      yPosition += lineHeight + 5;
    }

    if (reference.form_data.attendance) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Attendance:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(reference.form_data.attendance.charAt(0).toUpperCase() + reference.form_data.attendance.slice(1), margin + 80, yPosition);
      yPosition += lineHeight + 5;
    }

    if (reference.form_data.reasonForLeaving) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Reason for Leaving:', margin, yPosition);
      yPosition += lineHeight;
      pdf.setFont('helvetica', 'normal');
      yPosition = addWrappedText(reference.form_data.reasonForLeaving, margin, yPosition, pageWidth - 2 * margin);
      yPosition += 5;
    }

    if (reference.form_data.rehireRecommendation) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Would Rehire:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(reference.form_data.rehireRecommendation.charAt(0).toUpperCase() + reference.form_data.rehireRecommendation.slice(1), margin + 80, yPosition);
      yPosition += lineHeight + 5;
    }
  } else {
    // Character reference specific content
    if (reference.form_data.personalQualities) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Personal Qualities:', margin, yPosition);
      yPosition += lineHeight;
      pdf.setFont('helvetica', 'normal');
      yPosition = addWrappedText(reference.form_data.personalQualities, margin, yPosition, pageWidth - 2 * margin);
      yPosition += 5;
    }

    const ratings = [
      { label: 'Reliability', value: reference.form_data.reliability },
      { label: 'Integrity', value: reference.form_data.integrity },
      { label: 'Communication', value: reference.form_data.communication }
    ];

    ratings.forEach(rating => {
      if (rating.value) {
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${rating.label}:`, margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(rating.value.charAt(0).toUpperCase() + rating.value.slice(1), margin + 80, yPosition);
        yPosition += lineHeight + 3;
      }
    });
  }

  // Overall Recommendation
  if (reference.form_data.overallRecommendation) {
    yPosition += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Overall Recommendation:', margin, yPosition);
    yPosition += lineHeight;
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(reference.form_data.overallRecommendation, margin, yPosition, pageWidth - 2 * margin);
  }

  // Additional Comments
  if (reference.form_data.additionalComments) {
    yPosition += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Additional Comments:', margin, yPosition);
    yPosition += lineHeight;
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(reference.form_data.additionalComments, margin, yPosition, pageWidth - 2 * margin);
  }

  // Footer
  yPosition = pdf.internal.pageSize.getHeight() - 30;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  pdf.text('This reference was completed electronically and is digitally verified.', pageWidth / 2, yPosition, { align: 'center' });

  return pdf;
};

export interface ManualReferenceInput {
  applicantName: string;
  applicantPosition?: string;
  referenceType: 'employer' | 'character';
  referee: {
    name?: string;
    company?: string;
    jobTitle?: string;
    email?: string;
    phone?: string;
    address?: string;
    town?: string;
    postcode?: string;
  };
}

export const generateManualReferencePDF = (data: ManualReferenceInput) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 7;
  let y = 30;

  const addWrappedText = (text: string, size = 11) => {
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(text, contentWidth);
    pdf.text(lines, margin, y);
    y += lines.length * lineHeight;
  };

  const addTitle = (text: string) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text(text, pageWidth / 2, y, { align: 'center' });
    y += 14;
    pdf.setFont('helvetica', 'normal');
  };

  const addSection = (title: string) => {
    y += 6;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text(title, margin, y);
    y += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
  };

  const addLabeledLine = (label: string, value?: string) => {
    const labelText = `${label}`;
    pdf.text(labelText, margin, y);
    const startX = margin + pdf.getTextWidth(labelText) + 4;
    const endX = pageWidth - margin;
    // Pre-fill value if provided
    if (value) {
      pdf.text(value, startX + 1, y);
    }
    // Draw underline
    pdf.line(startX, y + 1.5, endX, y + 1.5);
    y += lineHeight;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      pdf.addPage();
      y = 30;
    }
  };

  // Header
  addTitle('Reference Form');
  pdf.setFontSize(12);
  pdf.text(`${data.referenceType === 'employer' ? 'Employer' : 'Character'} reference for ${data.applicantName}`, margin, y);
  y += 8;
  if (data.applicantPosition) {
    pdf.text(`Position Applied For: ${data.applicantPosition}`, margin, y);
    y += 8;
  }
  pdf.text(`Date: ____________________`, margin, y);
  y += 10;

  // Referee details
  addSection('Referee Information');
  addLabeledLine('Full Name:', data.referee.name);
  addLabeledLine('Job Title:', data.referee.jobTitle);
  addLabeledLine('Company/Organization:', data.referee.company);
  addLabeledLine('Email:', data.referee.email);
  addLabeledLine('Phone:', data.referee.phone);
  addLabeledLine('Address:', data.referee.address);
  addLabeledLine('Town/City:', data.referee.town);
  addLabeledLine('Postcode:', data.referee.postcode);

  // Relationship
  addSection('Relationship');
  addLabeledLine(`How long have you known ${data.applicantName}?`);

  // Questions
  if (data.referenceType === 'employer') {
    addSection('Employment Details');
    addLabeledLine('Employment Dates:');
    addWrappedText('Key Responsibilities:');
    ensureSpace(40);
    // Multi-line area
    pdf.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 12;
    pdf.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 12;
    pdf.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 14;

    addSection('Ratings');
    addLabeledLine('Job Performance (Excellent/Good/Satisfactory/Below Average):');
    addLabeledLine('Attendance (Excellent/Good/Fair/Poor):');

    addSection('Other');
    addWrappedText('Reason for Leaving:');
    ensureSpace(26);
    pdf.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 12;
    pdf.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 14;

    addLabeledLine('Would you rehire this person? (Yes without reservation / Yes with reservations / No):');
  } else {
    addSection('Character Assessment');
    addWrappedText('Personal Qualities:');
    ensureSpace(40);
    pdf.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 12;
    pdf.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 12;
    pdf.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 14;

    addLabeledLine('Reliability (Excellent/Good/Fair/Poor):');
    addLabeledLine('Integrity (Excellent/Good/Fair/Poor):');
    addLabeledLine('Communication (Excellent/Good/Fair/Poor):');
  }

  addSection('Final Recommendation');
  addWrappedText('Overall Recommendation:');
  ensureSpace(26);
  pdf.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 12;
  pdf.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 14;

  addWrappedText('Additional Comments:');
  ensureSpace(26);
  pdf.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 12;
  pdf.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 14;

  addSection('Signature');
  addLabeledLine('Referee Signature:');
  addLabeledLine('Date:');

  return pdf;
};