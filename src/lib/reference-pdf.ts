import jsPDF from 'jspdf';

interface ReferenceData {
  refereeFullName: string;
  refereeJobTitle?: string;
  
  // Employment reference specific
  employmentStatus?: string; // current, previous, or neither
  relationshipDescription?: string;
  jobTitle?: string;
  startDate?: string;
  endDate?: string;
  attendance?: string;
  leavingReason?: string;
  
  // Common checkbox qualities
  honestTrustworthy?: boolean;
  communicatesEffectively?: boolean;
  effectiveTeamMember?: boolean;
  respectfulConfidentiality?: boolean;
  reliablePunctual?: boolean;
  suitablePosition?: boolean;
  kindCompassionate?: boolean;
  worksIndependently?: boolean;
  
  // If any qualities not ticked
  qualitiesNotTickedReason?: string;
  
  // Criminal/legal questions
  convictionsKnown?: string;
  criminalProceedingsKnown?: string;
  criminalDetails?: string;
  
  // Final comments and signature
  additionalComments?: string;
  signatureDate?: string;
}

interface CompletedReference {
  id: string;
  reference_name: string;
  reference_type: string;
  form_data: ReferenceData;
  completed_at: string;
  application_id: string;
}

interface CompanySettings {
  name: string;
  logo?: string;
}

export const generateReferencePDF = (
  reference: CompletedReference,
  applicantName: string,
  applicantDOB: string,
  applicantPostcode: string,
  companySettings: CompanySettings = { name: 'Company Name' }
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 6;
  let yPosition = 25;

  // Set font to support Unicode characters
  pdf.setFont('helvetica', 'normal');

  // Helper function to ensure space on page
  const ensureSpace = (needed: number) => {
    if (yPosition + needed > pageHeight - 25) {
      pdf.addPage();
      yPosition = 25;
    }
  };

  // Helper function to add text with word wrap
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 11): number => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * lineHeight);
  };

  // Header - Employment reference for [Name]
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  const referenceType = reference.reference_type === 'employer' ? 'Employment reference for' : 'Character reference for';
  pdf.text(`${referenceType} ${applicantName}`, margin, yPosition);
  yPosition += 12;

  // Personal details line
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  const dobFormatted = new Date(applicantDOB).toLocaleDateString('en-GB');
  pdf.text(`DOB: ${dobFormatted}`, pageWidth - 120, yPosition);
  pdf.text(`Post Code: ${applicantPostcode}`, pageWidth - 60, yPosition);
  yPosition += 15;

  // Referee Information
  pdf.setFont('helvetica', 'bold');
  pdf.text('Referee Name:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(reference.form_data.refereeFullName || '', margin + 70, yPosition);
  
  if (reference.form_data.refereeJobTitle) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Job Title:', margin + 200, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(reference.form_data.refereeJobTitle, margin + 250, yPosition);
  }
  yPosition += 15;

  // Employment questions with bullet points
  ensureSpace(60);
  if (reference.reference_type === 'employer') {
    // Employment Status
    pdf.setFont('helvetica', 'bold');
    pdf.text('●', margin, yPosition);
    pdf.text('Are you this person\'s current or previous employer?', margin + 8, yPosition);
    yPosition += lineHeight + 2;
    pdf.setFont('helvetica', 'normal');
    const currentBox = reference.form_data.employmentStatus === 'current' ? '☑' : '☐';
    const previousBox = reference.form_data.employmentStatus === 'previous' ? '☑' : '☐';
    const neitherBox = reference.form_data.employmentStatus === 'neither' ? '☑' : '☐';
    pdf.text(`     ${currentBox} Current     ${previousBox} Previous     ${neitherBox} Neither`, margin + 8, yPosition);
    yPosition += lineHeight + 8;

    // Relationship Description
    ensureSpace(25);
    pdf.setFont('helvetica', 'bold');
    pdf.text('●', margin, yPosition);
    pdf.text('What is your relationship to this person (e.g. "I am her/his manager")?', margin + 8, yPosition);
    yPosition += lineHeight + 2;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`     ${reference.form_data.relationshipDescription || ''}`, margin + 8, yPosition);
    yPosition += lineHeight + 8;

    // Job Title
    ensureSpace(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('●', margin, yPosition);
    pdf.text('Please state the person\'s job title:', margin + 8, yPosition);
    yPosition += lineHeight + 2;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`     ${reference.form_data.jobTitle || ''}`, margin + 8, yPosition);
    yPosition += lineHeight + 8;

    // Employment Dates - separate lines as shown in image
    ensureSpace(30);
    pdf.setFont('helvetica', 'bold');
    pdf.text('●', margin, yPosition);
    pdf.text('When did they start working for you (month/year)?', margin + 8, yPosition);
    yPosition += lineHeight + 2;
    pdf.setFont('helvetica', 'normal');
    const startDate = reference.form_data.startDate ? new Date(reference.form_data.startDate).toLocaleDateString('en-GB') : '';
    pdf.text(`     ${startDate}`, margin + 8, yPosition);
    yPosition += lineHeight + 4;

    pdf.setFont('helvetica', 'bold');
    pdf.text('●', margin, yPosition);
    pdf.text('When did they finish working for you (month/year)?', margin + 8, yPosition);
    yPosition += lineHeight + 2;
    pdf.setFont('helvetica', 'normal');
    const endDate = reference.form_data.endDate ? new Date(reference.form_data.endDate).toLocaleDateString('en-GB') : 'N/A';
    pdf.text(`     ${endDate}`, margin + 8, yPosition);
    yPosition += lineHeight + 8;

    // Attendance
    ensureSpace(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('●', margin, yPosition);
    pdf.text('How would you describe their recent attendance record?', margin + 8, yPosition);
    yPosition += lineHeight + 2;
    pdf.setFont('helvetica', 'normal');
    const goodBox = reference.form_data.attendance === 'good' ? '☑' : '☐';
    const averageBox = reference.form_data.attendance === 'average' ? '☑' : '☐';
    const poorBox = reference.form_data.attendance === 'poor' ? '☑' : '☐';
    pdf.text(`     ${goodBox} Good     ${averageBox} Average     ${poorBox} Poor`, margin + 8, yPosition);
    yPosition += lineHeight + 8;

    // Leaving Reason
    ensureSpace(30);
    pdf.setFont('helvetica', 'bold');
    pdf.text('●', margin, yPosition);
    pdf.text('Why did the person leave your employment (if they are still employed, please write \'still employed\')?', margin + 8, yPosition);
    yPosition += lineHeight + 2;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`     ${reference.form_data.leavingReason || ''}`, margin + 8, yPosition);
    yPosition += lineHeight + 8;
  } else {
    // Character reference specific content
    ensureSpace(40);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Do you know this person from outside employment or education?', margin, yPosition);
    yPosition += lineHeight;
    pdf.setFont('helvetica', 'normal');
    const outsideYesBox = reference.form_data.employmentStatus === 'yes' ? '[X]' : '[ ]';
    const outsideNoBox = reference.form_data.employmentStatus === 'no' ? '[X]' : '[ ]';
    pdf.text(`${outsideYesBox} Yes    ${outsideNoBox} No`, margin, yPosition);
    yPosition += lineHeight + 5;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Please describe your relationship with this person, including how long you have known them:', margin, yPosition);
    yPosition += lineHeight;
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(`${reference.form_data.relationshipDescription || 'Not provided'}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 10;
  }

  // Character qualities with bullet point
  ensureSpace(80);
  pdf.setFont('helvetica', 'bold');
  pdf.text('●', margin, yPosition);
  pdf.text('In your opinion, which of the following describes this person (tick each that is true)?', margin + 8, yPosition);
  yPosition += lineHeight + 6;

  const qualities = [
    { key: 'honestTrustworthy', label: 'Honest and trustworthy' },
    { key: 'communicatesEffectively', label: 'Communicates effectively' },
    { key: 'effectiveTeamMember', label: 'An effective team member' },
    { key: 'respectfulConfidentiality', label: 'Respectful of confidentiality' },
    { key: 'reliablePunctual', label: 'Reliable and punctual' },
    { key: 'suitablePosition', label: 'Suitable for the position applied for' },
    { key: 'kindCompassionate', label: 'Kind and compassionate' },
    { key: 'worksIndependently', label: 'Able to work well without close supervision' },
  ];

  pdf.setFont('helvetica', 'normal');
  qualities.forEach(quality => {
    ensureSpace(8);
    const isChecked = reference.form_data[quality.key as keyof ReferenceData];
    const checkbox = isChecked ? '☑' : '☐';
    pdf.text(`     ${checkbox}`, margin + 8, yPosition);
    pdf.text(quality.label, margin + 20, yPosition);
    yPosition += lineHeight;
  });

  // Qualities not ticked reason
  ensureSpace(40);
  yPosition += 5;
  pdf.text('     If you did not tick one or more of the above, please tell us why here:', margin + 8, yPosition);
  yPosition += lineHeight + 2;
  pdf.text(`     ${reference.form_data.qualitiesNotTickedReason || ''}`, margin + 8, yPosition);
  yPosition += 15;

  // Criminal background questions with bullet points
  ensureSpace(100);
  pdf.setFont('helvetica', 'bold');
  pdf.text('●', margin, yPosition);
  yPosition = addWrappedText('The position this person has applied for involves working with vulnerable people. Are you aware of any convictions, cautions, reprimands or final warnings that the person may have received that are not \'protected\' as defined by the Rehabilitation of Offenders Act 1974 (Exceptions) Order 1975 (as amended in 2013 by SI 210 1198)?', margin + 8, yPosition, pageWidth - 2 * margin - 8, 11);
  yPosition += 3;
  pdf.setFont('helvetica', 'normal');
  const convictionsYesBox = reference.form_data.convictionsKnown === 'yes' ? '☑' : '☐';
  const convictionsNoBox = reference.form_data.convictionsKnown === 'no' ? '☑' : '☐';
  pdf.text(`     ${convictionsYesBox} Yes     ${convictionsNoBox} No`, margin + 8, yPosition);
  yPosition += lineHeight + 8;

  ensureSpace(50);
  pdf.setFont('helvetica', 'bold');
  pdf.text('●', margin, yPosition);
  yPosition = addWrappedText('To your knowledge, is this person currently the subject of any criminal proceedings (for example, charged or summoned but not yet dealt with) or any police investigation?', margin + 8, yPosition, pageWidth - 2 * margin - 8, 11);
  yPosition += 3;
  pdf.setFont('helvetica', 'normal');
  const proceedingsYesBox = reference.form_data.criminalProceedingsKnown === 'yes' ? '☑' : '☐';
  const proceedingsNoBox = reference.form_data.criminalProceedingsKnown === 'no' ? '☑' : '☐';
  pdf.text(`     ${proceedingsYesBox} Yes     ${proceedingsNoBox} No`, margin + 8, yPosition);
  yPosition += lineHeight + 8;

  // Criminal details if provided
  if (reference.form_data.convictionsKnown === 'yes' || reference.form_data.criminalProceedingsKnown === 'yes' || reference.form_data.criminalDetails) {
    ensureSpace(40);
    pdf.text('     If you answered \'yes\' to either of the two previous questions, please provide details:', margin + 8, yPosition);
    yPosition += lineHeight + 2;
    pdf.text(`     ${reference.form_data.criminalDetails || ''}`, margin + 8, yPosition);
    yPosition += 15;
  }

  // Additional Comments
  ensureSpace(40);
  pdf.setFont('helvetica', 'bold');
  pdf.text('●', margin, yPosition);
  pdf.text('Please tell us anything else about this person that you think we should know:', margin + 8, yPosition);
  yPosition += lineHeight + 2;
  pdf.setFont('helvetica', 'normal');
  pdf.text(`     ${reference.form_data.additionalComments || ''}`, margin + 8, yPosition);
  yPosition += 20;

  // Referee Information at bottom - match image format
  ensureSpace(60);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Referee name:', margin, yPosition);
  yPosition += lineHeight + 2;
  pdf.setFont('helvetica', 'normal');
  pdf.text(reference.form_data.refereeFullName || '', margin, yPosition);
  yPosition += lineHeight + 5;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Company Name:', margin, yPosition);
  yPosition += lineHeight + 2;
  pdf.setFont('helvetica', 'normal');
  pdf.text(companySettings.name || '', margin, yPosition);
  yPosition += lineHeight + 5;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Position:', margin, yPosition);
  yPosition += lineHeight + 2;
  pdf.setFont('helvetica', 'normal');
  pdf.text(reference.form_data.refereeJobTitle || '', margin, yPosition);
  yPosition += lineHeight + 5;

  // Date
  pdf.setFont('helvetica', 'bold');
  pdf.text('Date:', margin, yPosition);
  yPosition += lineHeight + 2;
  pdf.setFont('helvetica', 'normal');
  const completedDate = reference.form_data.signatureDate || new Date(reference.completed_at).toLocaleDateString('en-GB');
  pdf.text(completedDate, margin, yPosition);

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

export const generateManualReferencePDF = (
  data: ManualReferenceInput,
  companySettings: CompanySettings = { name: 'Company Name' }
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 6;
  let yPosition = 25;

  // Set font
  pdf.setFont('helvetica', 'normal');

  // Helper function to ensure space on page
  const ensureSpace = (needed: number) => {
    if (yPosition + needed > pageHeight - 25) {
      pdf.addPage();
      yPosition = 25;
    }
  };

  // Helper function to add text with word wrap
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 11): number => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * lineHeight);
  };

  // Header - Employment reference for [Name]  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  const referenceType = data.referenceType === 'employer' ? 'Employment reference for' : 'Character reference for';
  pdf.text(`${referenceType} ${data.applicantName}`, margin, yPosition);
  yPosition += 12;

  // Personal details line - DOB and postcode on right
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('DOB: ___________________', pageWidth - 120, yPosition);
  pdf.text('Post Code: ____________', pageWidth - 60, yPosition);
  yPosition += 20;

  // Referee Information
  pdf.setFont('helvetica', 'bold');
  pdf.text('Referee Name:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  const nameValue = data.referee.name || '';
  pdf.text(nameValue, margin + 70, yPosition);
  // Draw line for completion
  if (!nameValue) {
    pdf.line(margin + 70, yPosition + 1.5, pageWidth - margin, yPosition + 1.5);
  }
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Job Title:', margin + 200, yPosition);
  pdf.setFont('helvetica', 'normal');
  const jobTitleValue = data.referee.jobTitle || '';
  pdf.text(jobTitleValue, margin + 250, yPosition);
  // Draw line for completion
  if (!jobTitleValue && pageWidth - (margin + 250) > 20) {
    pdf.line(margin + 250, yPosition + 1.5, pageWidth - margin, yPosition + 1.5);
  }
  yPosition += 20;

  // Employment questions with bullet points
  ensureSpace(60);
  if (data.referenceType === 'employer') {
    // Employment Status
    pdf.setFont('helvetica', 'bold');
    pdf.text('●', margin, yPosition);
    pdf.text('Are you this person\'s current or previous employer?', margin + 8, yPosition);
    yPosition += lineHeight + 2;
    pdf.setFont('helvetica', 'normal');
    pdf.text('     ☐ Current     ☐ Previous     ☐ Neither', margin + 8, yPosition);
    yPosition += lineHeight + 8;

    // Relationship Description
    ensureSpace(25);
    pdf.setFont('helvetica', 'bold');
    pdf.text('●', margin, yPosition);
    pdf.text('What is your relationship to this person (e.g. "I am her/his manager")?', margin + 8, yPosition);
    yPosition += lineHeight + 2;
    pdf.line(margin + 8, yPosition + 2, pageWidth - margin, yPosition + 2);
    yPosition += lineHeight + 8;

    // Job Title
    ensureSpace(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('●', margin, yPosition);
    pdf.text('Please state the person\'s job title:', margin + 8, yPosition);
    yPosition += lineHeight + 2;
    pdf.line(margin + 8, yPosition + 2, pageWidth - margin, yPosition + 2);
    yPosition += lineHeight + 8;

    // Employment Dates - separate lines
    ensureSpace(30);
    pdf.setFont('helvetica', 'bold');
    pdf.text('●', margin, yPosition);
    pdf.text('When did they start working for you (month/year)?', margin + 8, yPosition);
    yPosition += lineHeight + 2;
    pdf.line(margin + 8, yPosition + 2, pageWidth - margin, yPosition + 2);
    yPosition += lineHeight + 4;

    pdf.setFont('helvetica', 'bold');
    pdf.text('●', margin, yPosition);
    pdf.text('When did they finish working for you (month/year)?', margin + 8, yPosition);
    yPosition += lineHeight + 2;
    pdf.line(margin + 8, yPosition + 2, pageWidth - margin, yPosition + 2);
    yPosition += lineHeight + 8;

    // Attendance
    ensureSpace(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('●', margin, yPosition);
    pdf.text('How would you describe their recent attendance record?', margin + 8, yPosition);
    yPosition += lineHeight + 2;
    pdf.setFont('helvetica', 'normal');
    pdf.text('     ☐ Good     ☐ Average     ☐ Poor', margin + 8, yPosition);
    yPosition += lineHeight + 8;

    // Leaving Reason
    ensureSpace(30);
    pdf.setFont('helvetica', 'bold');
    pdf.text('●', margin, yPosition);
    pdf.text('Why did the person leave your employment (if they are still employed, please write \'still employed\')?', margin + 8, yPosition);
    yPosition += lineHeight + 2;
    pdf.line(margin + 8, yPosition + 2, pageWidth - margin, yPosition + 2);
    yPosition += lineHeight + 4;
    pdf.line(margin + 8, yPosition + 2, pageWidth - margin, yPosition + 2);
    yPosition += lineHeight + 8;
  } else {
    // Character reference questions with bullet points
    ensureSpace(40);
    pdf.setFont('helvetica', 'bold');
    pdf.text('●', margin, yPosition);
    pdf.text('Do you know this person from outside employment or education?', margin + 8, yPosition);
    yPosition += lineHeight + 2;
    pdf.setFont('helvetica', 'normal');
    pdf.text('     ☐ Yes     ☐ No', margin + 8, yPosition);
    yPosition += lineHeight + 8;

    pdf.setFont('helvetica', 'bold');
    pdf.text('●', margin, yPosition);
    pdf.text('Please describe your relationship with this person, including how long you have known them:', margin + 8, yPosition);
    yPosition += lineHeight + 2;
    pdf.line(margin + 8, yPosition + 2, pageWidth - margin, yPosition + 2);
    yPosition += lineHeight + 4;
    pdf.line(margin + 8, yPosition + 2, pageWidth - margin, yPosition + 2);
    yPosition += lineHeight + 8;
  }

  // Character qualities with bullet point
  ensureSpace(80);
  pdf.setFont('helvetica', 'bold');
  pdf.text('●', margin, yPosition);
  pdf.text('In your opinion, which of the following describes this person (tick each that is true)?', margin + 8, yPosition);
  yPosition += lineHeight + 6;

  const qualities = [
    'Honest and trustworthy',
    'Communicates effectively',
    'An effective team member',
    'Respectful of confidentiality',
    'Reliable and punctual',
    'Suitable for the position applied for',
    'Kind and compassionate',
    'Able to work well without close supervision'
  ];

  pdf.setFont('helvetica', 'normal');
  qualities.forEach(quality => {
    ensureSpace(8);
    pdf.text('     ☐', margin + 8, yPosition);
    pdf.text(quality, margin + 20, yPosition);
    yPosition += lineHeight;
  });

  // Qualities not ticked reason
  ensureSpace(40);
  yPosition += 5;
  pdf.text('     If you did not tick one or more of the above, please tell us why here:', margin + 8, yPosition);
  yPosition += lineHeight + 2;
  pdf.line(margin + 8, yPosition + 2, pageWidth - margin, yPosition + 2);
  yPosition += lineHeight + 4;
  pdf.line(margin + 8, yPosition + 2, pageWidth - margin, yPosition + 2);
  yPosition += 15;

  // Criminal background questions with bullet points
  ensureSpace(100);
  pdf.setFont('helvetica', 'bold');
  pdf.text('●', margin, yPosition);
  yPosition = addWrappedText('The position this person has applied for involves working with vulnerable people. Are you aware of any convictions, cautions, reprimands or final warnings that the person may have received that are not \'protected\' as defined by the Rehabilitation of Offenders Act 1974 (Exceptions) Order 1975 (as amended in 2013 by SI 210 1198)?', margin + 8, yPosition, pageWidth - 2 * margin - 8, 11);
  yPosition += 3;
  pdf.setFont('helvetica', 'normal');
  pdf.text('     ☐ Yes     ☐ No', margin + 8, yPosition);
  yPosition += lineHeight + 8;

  ensureSpace(50);
  pdf.setFont('helvetica', 'bold');
  pdf.text('●', margin, yPosition);
  yPosition = addWrappedText('To your knowledge, is this person currently the subject of any criminal proceedings (for example, charged or summoned but not yet dealt with) or any police investigation?', margin + 8, yPosition, pageWidth - 2 * margin - 8, 11);
  yPosition += 3;
  pdf.setFont('helvetica', 'normal');
  pdf.text('     ☐ Yes     ☐ No', margin + 8, yPosition);
  yPosition += lineHeight + 8;

  // Criminal details space
  ensureSpace(40);
  pdf.text('     If you answered \'yes\' to either of the two previous questions, please provide details:', margin + 8, yPosition);
  yPosition += lineHeight + 2;
  pdf.line(margin + 8, yPosition + 2, pageWidth - margin, yPosition + 2);
  yPosition += lineHeight + 4;
  pdf.line(margin + 8, yPosition + 2, pageWidth - margin, yPosition + 2);
  yPosition += 15;

  // Additional Comments
  ensureSpace(40);
  pdf.setFont('helvetica', 'bold');
  pdf.text('●', margin, yPosition);
  pdf.text('Please tell us anything else about this person that you think we should know:', margin + 8, yPosition);
  yPosition += lineHeight + 2;
  pdf.setFont('helvetica', 'normal');
  pdf.line(margin + 8, yPosition + 2, pageWidth - margin, yPosition + 2);
  yPosition += lineHeight + 4;
  pdf.line(margin + 8, yPosition + 2, pageWidth - margin, yPosition + 2);
  yPosition += 20;

  // Referee Information at bottom - match image format
  ensureSpace(60);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Referee name:', margin, yPosition);
  yPosition += lineHeight + 2;
  pdf.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
  yPosition += lineHeight + 5;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Company Name:', margin, yPosition);
  yPosition += lineHeight + 2;
  pdf.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
  yPosition += lineHeight + 5;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Position:', margin, yPosition);
  yPosition += lineHeight + 2;
  pdf.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
  yPosition += lineHeight + 5;

  // Date
  pdf.setFont('helvetica', 'bold');
  pdf.text('Date:', margin, yPosition);
  yPosition += lineHeight + 2;
  pdf.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);

  return pdf;
};