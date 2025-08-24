import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { format, parseISO, isValid as isValidDateFns } from 'date-fns'
import type { JobApplicationData } from '@/components/job-application/types'

// Format date to DD-MM-YYYY regardless of input (YYYY-MM-DD, ISO, etc.)
function formatDateDDMMYYYY(value?: string): string {
  if (!value) return ''
  try {
    const parsedISO = parseISO(value)
    if (isValidDateFns(parsedISO)) return format(parsedISO, 'dd-MM-yyyy')
    const d = new Date(value)
    if (!isNaN(d.getTime())) return format(d, 'dd-MM-yyyy')
  } catch {}
  return value
}

function formatFromTo(from?: string, to?: string) {
  const f = formatDateDDMMYYYY(from)
  const t = formatDateDDMMYYYY(to)
  if (f && t) return `${f} - ${t}`
  return f || t || ''
}


// Text writing helper with wrapping and pagination
interface WriterCtx {
  doc: PDFDocument
  page: any
  font: any
  boldFont: any
  fontSize: number
  margin: number
  y: number
  lineHeight: number
  color: { r: number; g: number; b: number }
}

function addPage(ctx: WriterCtx) {
  ctx.page = ctx.doc.addPage()
  ctx.y = ctx.page.getHeight() - ctx.margin
}

function ensureSpace(ctx: WriterCtx, requiredHeight: number) {
  if (ctx.y - requiredHeight < ctx.margin) {
    addPage(ctx)
  }
}

function drawText(ctx: WriterCtx, text: string, options?: { bold?: boolean; size?: number }) {
  const font = options?.bold ? ctx.boldFont : ctx.font
  const size = options?.size ?? ctx.fontSize
  const maxWidth = ctx.page.getWidth() - ctx.margin * 2

  const words = (text ?? '').split(/\s+/)
  let line = ''
  const lines: string[] = []

  for (const w of words) {
    const testLine = line ? `${line} ${w}` : w
    const width = font.widthOfTextAtSize(testLine, size)
    if (width > maxWidth) {
      if (line) lines.push(line)
      line = w
    } else {
      line = testLine
    }
  }
  if (line) lines.push(line)

  const blockHeight = lines.length * ctx.lineHeight
  ensureSpace(ctx, blockHeight)
  for (const l of lines) {
    ctx.page.drawText(l, {
      x: ctx.margin,
      y: ctx.y - ctx.lineHeight,
      size,
      font,
      color: rgb(ctx.color.r, ctx.color.g, ctx.color.b),
    })
    ctx.y -= ctx.lineHeight
  }
}

function addSpacer(ctx: WriterCtx, amount = 8) {
  ensureSpace(ctx, amount)
  ctx.y -= amount
}

function addSectionTitle(ctx: WriterCtx, title: string) {
  addSpacer(ctx, 8)
  drawText(ctx, title, { bold: true, size: ctx.fontSize + 3 })
  // underline divider
  const lineY = ctx.y - 2
  ctx.page.drawRectangle({
    x: ctx.margin,
    y: lineY,
    width: ctx.page.getWidth() - ctx.margin * 2,
    height: 1,
    color: rgb(0.85, 0.85, 0.85),
  })
  ctx.y = lineY - 6
}


function addKeyValue(ctx: WriterCtx, label: string, value?: string) {
  drawText(ctx, `${label}: ${value ?? ''}`)
}

// Layout helpers for nicer, two-column design
const GUTTER = 18

function getColWidth(ctx: WriterCtx) {
  return (ctx.page.getWidth() - ctx.margin * 2 - GUTTER) / 2
}

function wrapLines(font: any, size: number, text: string, maxWidth: number) {
  const words = (text ?? '').toString().split(/\s+/)
  let line = ''
  const lines: string[] = []
  for (const w of words) {
    const testLine = line ? `${line} ${w}` : w
    const width = font.widthOfTextAtSize(testLine, size)
    if (width > maxWidth) {
      if (line) lines.push(line)
      line = w
    } else {
      line = testLine
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawTextAt(
  ctx: WriterCtx,
  text: string,
  x: number,
  yStart: number,
  width: number,
  options?: { bold?: boolean; size?: number }
) {
  const font = options?.bold ? ctx.boldFont : ctx.font
  const size = options?.size ?? ctx.fontSize
  const lines = wrapLines(font, size, text ?? '', width)
  let y = yStart
  for (const l of lines) {
    ctx.page.drawText(l, {
      x,
      y: y - ctx.lineHeight,
      size,
      font,
      color: rgb(ctx.color.r, ctx.color.g, ctx.color.b),
    })
    y -= ctx.lineHeight
  }
  return lines.length * ctx.lineHeight
}

function measureKeyValueHeight(ctx: WriterCtx, value: string | undefined, width: number) {
  const valueLines = wrapLines(ctx.font, ctx.fontSize, String(value ?? ''), width)
  // one line for label + value lines
  return ctx.lineHeight + valueLines.length * ctx.lineHeight
}

function drawKeyValueInArea(
  ctx: WriterCtx,
  label: string,
  value: string | undefined,
  x: number,
  yStart: number,
  width: number
) {
  // Label
  ctx.page.drawText(label, {
    x,
    y: yStart - ctx.lineHeight,
    size: ctx.fontSize,
    font: ctx.boldFont,
    color: rgb(ctx.color.r, ctx.color.g, ctx.color.b),
  })
  // Value
  const used = drawTextAt(ctx, String(value ?? ''), x, yStart - ctx.lineHeight, width)
  return ctx.lineHeight + used
}

function renderTwoColGrid(ctx: WriterCtx, pairs: Array<[string, string | undefined]>) {
  const colWidth = getColWidth(ctx)
  const leftX = ctx.margin
  const rightX = ctx.margin + colWidth + GUTTER
  const rowGap = 8

  for (let i = 0; i < pairs.length; i += 2) {
    const left = pairs[i]
    const right = pairs[i + 1]
    const leftH = measureKeyValueHeight(ctx, left?.[1], colWidth)
    const rightH = right ? measureKeyValueHeight(ctx, right[1], colWidth) : 0
    const rowHeight = Math.max(leftH, rightH)

    ensureSpace(ctx, rowHeight + rowGap)
    const yStart = ctx.y

    if (left) drawKeyValueInArea(ctx, left[0], left[1], leftX, yStart, colWidth)
    if (right) drawKeyValueInArea(ctx, right[0], right[1], rightX, yStart, colWidth)

    ctx.y -= rowHeight + rowGap
  }
}


export async function generateJobApplicationPdf(data: JobApplicationData) {
  const doc = await PDFDocument.create()
  const page = doc.addPage()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)

  const ctx: WriterCtx = {
    doc,
    page,
    font,
    boldFont,
    fontSize: 11,
    margin: 40,
    y: page.getHeight() - 40,
    lineHeight: 16,
    color: { r: 0, g: 0, b: 0 },
  }

  // Header
  drawText(ctx, 'Job Application Summary', { bold: true, size: 16 })
  addSpacer(ctx, 6)
  drawText(ctx, `Applicant: ${data.personalInfo?.fullName ?? ''}`)
  drawText(ctx, `Position Applied For: ${data.personalInfo?.positionAppliedFor ?? ''}`)
  drawText(ctx, `Generated: ${formatDateDDMMYYYY(new Date().toISOString())}`)
  addSpacer(ctx, 10)

  // Personal Information
  addSectionTitle(ctx, '1. Personal Information')
  const pi = data.personalInfo || ({} as any)
  const piPairs: Array<[string, string | undefined]> = [
    ['Title', pi.title],
    ['Full Name', pi.fullName],
    ['Email', pi.email],
    ['Telephone/Mobile', pi.telephone],
    ['Date of Birth', formatDateDDMMYYYY(pi.dateOfBirth)],
    ['Street Address', pi.streetAddress],
    ['Street Address Second Line', pi.streetAddress2],
    ['Town', pi.town],
    ['Borough', pi.borough],
    ['Postcode', pi.postcode],
    ['Proficiency in English (if not first language)', pi.englishProficiency],
    ['Which other languages do you speak?', (pi.otherLanguages || []).join(', ')],
    ['Position applied for', pi.positionAppliedFor],
    ['Are you willing to do personal care for?', pi.personalCareWillingness],
    ['Do you have a recent or updated DBS?', pi.hasDBS],
    ['National Insurance Number', pi.nationalInsuranceNumber],
    ['Do you currently have your own car and licence?', pi.hasCarAndLicense],
  ]
  renderTwoColGrid(ctx, piPairs)


  // Availability
  addSectionTitle(ctx, '2. Availability')
  const av = data.availability || ({} as any)
  const avaPairs: Array<[string, string | undefined]> = [
    ['How many hours per week are you willing to work?', av.hoursPerWeek],
    ['Do you have current right to live and work in the UK?', av.hasRightToWork],
  ]
  renderTwoColGrid(ctx, avaPairs)

  const timeSlots = av.timeSlots || {}
  const slotEntries = Object.entries(timeSlots)
  if (slotEntries.length) {
    drawText(ctx, 'Selected Time Slots', { bold: true })
    const slotPairs = slotEntries.map(([slotId, days]) => [
      String(slotId),
      Array.isArray(days) ? (days as string[]).join(', ') : String(days ?? ''),
    ]) as Array<[string, string]>
    renderTwoColGrid(ctx, slotPairs)
  }


  // Emergency Contact
  addSectionTitle(ctx, '3. Emergency Contact')
  const ec = data.emergencyContact || ({} as any)
  renderTwoColGrid(ctx, [
    ['Full Name', ec.fullName],
    ['Relationship', ec.relationship],
    ['Contact number', ec.contactNumber],
    ['How did you Hear about us', ec.howDidYouHear],
  ])


  // Employment History
  addSectionTitle(ctx, '4. Employment History')
  addKeyValue(ctx, 'Were you previously been employed?', data.employmentHistory?.previouslyEmployed)
  if (data.employmentHistory?.previouslyEmployed === 'yes') {
    const recent = data.employmentHistory?.recentEmployer as any
    if (recent) {
      drawText(ctx, 'Most Recent Employer', { bold: true })
      renderTwoColGrid(ctx, [
        ['Company', recent.company],
        ['Name', recent.name],
        ['Email', recent.email],
        ['Position Held', recent.position],
        ['Address', recent.address],
        ['Address 2', recent.address2],
        ['Town', recent.town],
        ['Postcode', recent.postcode],
        ['Telephone Number', recent.telephone],
        ['From to', formatFromTo(recent.from, recent.to)],
        ['Leaving date or notice (if relevant)', formatDateDDMMYYYY(recent.leavingDate)],
        ['Reason for leaving', recent.reasonForLeaving],
      ])
      if (recent.keyTasks) {
        drawText(ctx, 'Key Tasks/Responsibilities', { bold: true })
        drawText(ctx, recent.keyTasks)
      }
    }

    const prevList = data.employmentHistory?.previousEmployers || []
    if (prevList.length) {
      drawText(ctx, 'Previous employers (from most recent)', { bold: true })
      prevList.forEach((emp) => {
        renderTwoColGrid(ctx, [
          ['Company', emp.company],
          ['Name', emp.name],
          ['Email', emp.email],
          ['Position Held', emp.position],
          ['Address', emp.address],
          ['Address 2', emp.address2],
          ['Town', emp.town],
          ['Postcode', emp.postcode],
          ['Telephone Number', emp.telephone],
          ['From to', formatFromTo(emp.from, emp.to)],
          ['Leaving date or notice (if relevant)', formatDateDDMMYYYY(emp.leavingDate)],
          ['Reason for leaving', emp.reasonForLeaving],
        ])
        if (emp.keyTasks) {
          drawText(ctx, 'Key Tasks/Responsibilities', { bold: true })
          drawText(ctx, emp.keyTasks)
        }
        addSpacer(ctx, 6)
      })
    }
  }

  // References (dynamic)
  addSectionTitle(ctx, '5. References')
  const refs: any[] = Object.values<any>(data.references || {})
  refs
    .filter((r) => r && (r.name || r.company || r.email))
    .forEach((ref, idx) => {
      drawText(ctx, `Reference #${idx + 1}`, { bold: true })
      addKeyValue(ctx, 'Name', ref.name)
      addKeyValue(ctx, 'Company', ref.company)
      addKeyValue(ctx, 'Job Title', ref.jobTitle)
      addKeyValue(ctx, 'Email', ref.email)
      addKeyValue(ctx, 'Contact Number', ref.contactNumber)
      addKeyValue(ctx, 'Address 1', ref.address)
      addKeyValue(ctx, 'Address 2', ref.address2)
      addKeyValue(ctx, 'Town', ref.town)
      addKeyValue(ctx, 'Postcode', ref.postcode)
      addSpacer(ctx, 6)
    })

  // Skills & Experience
  addSectionTitle(ctx, '6. Skills & Experience')
  const skills = data.skillsExperience?.skills || {}
  const skillEntries = Object.entries(skills)
  if (skillEntries.length) {
    skillEntries.forEach(([skill, level]) => {
      addKeyValue(ctx, skill, String(level))
    })
  } else {
    drawText(ctx, 'No specific skills listed')
  }

  // Declaration
  addSectionTitle(ctx, '7. Declaration')
  const dec = data.declaration
  addKeyValue(ctx, 'Social Service Enquiry', dec?.socialServiceEnquiry)
  if (dec?.socialServiceDetails) addKeyValue(ctx, 'Details', dec.socialServiceDetails)
  addKeyValue(ctx, 'Convicted of Offence', dec?.convictedOfOffence)
  if (dec?.convictedDetails) addKeyValue(ctx, 'Details', dec.convictedDetails)
  addKeyValue(ctx, 'Safeguarding Investigation', dec?.safeguardingInvestigation)
  if (dec?.safeguardingDetails) addKeyValue(ctx, 'Details', dec.safeguardingDetails)
  addKeyValue(ctx, 'Criminal Convictions', dec?.criminalConvictions)
  if (dec?.criminalDetails) addKeyValue(ctx, 'Details', dec.criminalDetails)
  addKeyValue(ctx, 'Health Conditions', dec?.healthConditions)
  if (dec?.healthDetails) addKeyValue(ctx, 'Details', dec.healthDetails)
  addKeyValue(ctx, 'Cautions / Reprimands', dec?.cautionsReprimands)
  if (dec?.cautionsDetails) addKeyValue(ctx, 'Details', dec.cautionsDetails)

  // Terms & Policy
  addSectionTitle(ctx, '8. Terms & Policy')
  addKeyValue(ctx, 'Consent to Terms', data.termsPolicy?.consentToTerms ? 'Yes' : 'No')
  addKeyValue(ctx, 'Signature (name)', data.termsPolicy?.signature)
  addKeyValue(ctx, 'Full Name', data.termsPolicy?.fullName)
  addKeyValue(ctx, 'Date', formatDateDDMMYYYY(data.termsPolicy?.date))

  // Footer note
  addSpacer(ctx, 10)
  drawText(ctx, 'This is a system-generated document based on the submitted application.', { size: 10 })

  const bytes = await doc.save()
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)

  const name = (data.personalInfo?.fullName || 'Applicant').replace(/\s+/g, '_')
  const filename = `Job_Application_${name}_${formatDateDDMMYYYY(new Date().toISOString())}.pdf`

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
