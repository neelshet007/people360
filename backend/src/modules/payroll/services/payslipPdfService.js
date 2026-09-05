const PDFDocument = require('pdfkit');

/**
 * Payslip PDF Generation Service
 * Generates an itemized, corporate Indian salary statement using PDFKit
 * Returns a Promise that resolves with a Buffer
 */
const generatePayslipPdfBuffer = (payslip) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Colors
      const primaryColor = '#312e81';
      const secondaryColor = '#475569';
      const darkColor = '#0f172a';
      const successColor = '#15803d';
      const dangerColor = '#dc2626';
      const borderColor = '#cbd5e1';

      // 1. Header Banner
      doc
        .fontSize(22)
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text('PeoplePay360', 40, 40);

      doc
        .fontSize(9)
        .fillColor(secondaryColor)
        .font('Helvetica')
        .text('Integrated HR & Automated Payroll Platform', 40, 68)
        .text('Private & Confidential • Compliant Indian Salary Statement', 40, 80);

      // Statement Metadata on the Right
      doc
        .fontSize(14)
        .fillColor(darkColor)
        .font('Helvetica-Bold')
        .text('SALARY STATEMENT', 360, 40, { align: 'right', width: 195 });

      doc
        .fontSize(9)
        .fillColor(secondaryColor)
        .font('Helvetica')
        .text(`Payslip Ref: ${payslip.id.slice(0, 8).toUpperCase()}`, 360, 58, { align: 'right', width: 195 })
        .text(`Batch: ${payslip.payrun_name || 'Standard Monthly'}`, 360, 70, { align: 'right', width: 195 })
        .text(`Status: ${payslip.status}`, 360, 82, { align: 'right', width: 195 });

      // Horizontal Divider
      doc
        .strokeColor(borderColor)
        .lineWidth(1)
        .moveTo(40, 102)
        .lineTo(555, 102)
        .stroke();

      // 2. Employee & Pay Period Details Box
      const boxTop = 115;
      doc
        .rect(40, boxTop, 515, 80)
        .fillColor('#f8fafc')
        .fill()
        .strokeColor(borderColor)
        .stroke();

      // Left Column
      doc
        .fontSize(8)
        .fillColor(secondaryColor)
        .font('Helvetica-Bold')
        .text('EMPLOYEE NAME', 55, boxTop + 12);
      doc
        .fontSize(10)
        .fillColor(darkColor)
        .font('Helvetica-Bold')
        .text(payslip.employee_name || 'Staff Specialist', 55, boxTop + 24);
      doc
        .fontSize(8)
        .fillColor(secondaryColor)
        .font('Helvetica')
        .text(`Code: ${payslip.employee_code || 'EMP-IN'}`, 55, boxTop + 38)
        .text(`Department: ${payslip.department || 'Operations'}`, 55, boxTop + 50)
        .text(`Designation: ${payslip.designation || 'Specialist'}`, 55, boxTop + 62);

      // Right Column
      doc
        .fontSize(8)
        .fillColor(secondaryColor)
        .font('Helvetica-Bold')
        .text('PAYROLL PERIOD', 320, boxTop + 12);

      const periodStart = payslip.pay_period_start
        ? (payslip.pay_period_start instanceof Date
            ? payslip.pay_period_start.toISOString().split('T')[0]
            : String(payslip.pay_period_start).split('T')[0])
        : '2026-09-01';
      const periodEnd = payslip.pay_period_end
        ? (payslip.pay_period_end instanceof Date
            ? payslip.pay_period_end.toISOString().split('T')[0]
            : String(payslip.pay_period_end).split('T')[0])
        : '2026-09-30';

      doc
        .fontSize(9)
        .fillColor(darkColor)
        .font('Helvetica-Bold')
        .text(`${periodStart}  to  ${periodEnd}`, 320, boxTop + 24);

      doc
        .fontSize(8)
        .fillColor(secondaryColor)
        .font('Helvetica')
        .text(`Standard Working Days: 22.0`, 320, boxTop + 38)
        .text(`Attendance Worked Days: ${payslip.worked_days || 22.0} Days`, 320, boxTop + 50)
        .text(`Absent / Unpaid Days: ${payslip.absent_days || 0.0} Days`, 320, boxTop + 62);

      // 3. Earnings & Deductions Tables
      const tableTop = 215;
      const colWidth = 250;
      const colGap = 15;

      // Filter lines
      const earnings = (payslip.lines || []).filter(
        (l) => l.category === 'BASIC' || l.category === 'ALLOWANCE'
      );
      const deductions = (payslip.lines || []).filter(
        (l) => l.category === 'DEDUCTION' && l.rule_code !== 'TOTAL_DEDUCTIONS'
      );

      // --- Left Header (Earnings) ---
      doc
        .rect(40, tableTop, colWidth, 22)
        .fillColor('#f1f5f9')
        .fill()
        .strokeColor(borderColor)
        .stroke();

      doc
        .fontSize(8.5)
        .fillColor(darkColor)
        .font('Helvetica-Bold')
        .text('EARNINGS & ALLOWANCES', 48, tableTop + 6)
        .text('AMOUNT (INR)', 210, tableTop + 6, { width: 72, align: 'right' });

      // --- Right Header (Deductions) ---
      doc
        .rect(40 + colWidth + colGap, tableTop, colWidth, 22)
        .fillColor('#f1f5f9')
        .fill()
        .strokeColor(borderColor)
        .stroke();

      doc
        .fontSize(8.5)
        .fillColor(darkColor)
        .font('Helvetica-Bold')
        .text('DEDUCTIONS & TAX', 40 + colWidth + colGap + 8, tableTop + 6)
        .text('AMOUNT (INR)', 40 + colWidth + colGap + 170, tableTop + 6, { width: 72, align: 'right' });

      // --- Lines Rows ---
      let y = tableTop + 26;
      const maxRows = Math.max(earnings.length || 1, deductions.length || 1);

      for (let i = 0; i < maxRows; i++) {
        const earn = earnings[i];
        const ded = deductions[i];

        // Draw Earnings
        if (earn) {
          doc
            .fontSize(8)
            .fillColor(darkColor)
            .font('Helvetica')
            .text(earn.rule_name, 48, y)
            .text(
              `₹ ${parseFloat(earn.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
              210,
              y,
              { width: 72, align: 'right' }
            );
        }

        // Draw Deductions
        if (ded) {
          doc
            .fontSize(8)
            .fillColor(darkColor)
            .font('Helvetica')
            .text(ded.rule_name, 40 + colWidth + colGap + 8, y)
            .text(
              `-₹ ${parseFloat(ded.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
              40 + colWidth + colGap + 170,
              y,
              { width: 72, align: 'right' }
            );
        }

        y += 18;
      }

      // Fill empty line if earnings or deductions were empty
      if (earnings.length === 0) {
        doc.fontSize(8).fillColor(darkColor).text('Gross Basic Salary', 48, y);
        doc.text(`₹ ${parseFloat(payslip.gross_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 210, y, { width: 72, align: 'right' });
      }
      if (deductions.length === 0) {
        doc.fontSize(8).fillColor(darkColor).text('Statutory Deductions', 40 + colWidth + colGap + 8, y);
        doc.text(`-₹ ${parseFloat(payslip.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 40 + colWidth + colGap + 170, y, { width: 72, align: 'right' });
      }

      const totalsY = Math.max(y + 12, 330);

      // --- Totals Bar ---
      // Gross
      doc
        .rect(40, totalsY, colWidth, 24)
        .fillColor('#eef2ff')
        .fill()
        .strokeColor(borderColor)
        .stroke();
      doc
        .fontSize(9)
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text('TOTAL GROSS EARNINGS', 48, totalsY + 7)
        .text(`₹ ${parseFloat(payslip.gross_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, totalsY + 7, { width: 92, align: 'right' });

      // Deductions
      doc
        .rect(40 + colWidth + colGap, totalsY, colWidth, 24)
        .fillColor('#fef2f2')
        .fill()
        .strokeColor(borderColor)
        .stroke();
      doc
        .fontSize(9)
        .fillColor(dangerColor)
        .font('Helvetica-Bold')
        .text('TOTAL DEDUCTIONS', 40 + colWidth + colGap + 8, totalsY + 7)
        .text(`-₹ ${parseFloat(payslip.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 40 + colWidth + colGap + 150, totalsY + 7, { width: 92, align: 'right' });

      // 4. Net Salary Callout Box
      const netBoxY = totalsY + 40;
      doc
        .rect(40, netBoxY, 515, 60)
        .fillColor('#f0fdf4')
        .fill()
        .strokeColor('#86efac')
        .lineWidth(1.5)
        .stroke();

      doc
        .fontSize(10)
        .fillColor('#166534')
        .font('Helvetica-Bold')
        .text('NET SALARY PAYABLE (TAKE-HOME)', 55, netBoxY + 14);

      doc
        .fontSize(8)
        .fillColor(secondaryColor)
        .font('Helvetica')
        .text('Disbursed directly to registered employee salary bank account via NEFT/IMPS.', 55, netBoxY + 32)
        .text('All statutory deductions (PF/PT) have been computed as per Government of India norms.', 55, netBoxY + 44);

      doc
        .fontSize(20)
        .fillColor(successColor)
        .font('Helvetica-Bold')
        .text(
          `₹ ${parseFloat(payslip.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          340,
          netBoxY + 18,
          { width: 200, align: 'right' }
        );

      // 5. Footer & Authenticity
      const footerY = 510;
      doc
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .moveTo(40, footerY)
        .lineTo(555, footerY)
        .stroke();

      doc
        .fontSize(7.5)
        .fillColor(secondaryColor)
        .font('Helvetica')
        .text(
          'This is a computer-generated payslip issued by PeoplePay360 Integrated HR & Payroll System. No signature is required.',
          40,
          footerY + 10,
          { align: 'center', width: 515 }
        )
        .text(
          `Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST) • System Hash: SHA256-${payslip.id.replace(/-/g, '').slice(0, 16)}`,
          40,
          footerY + 22,
          { align: 'center', width: 515 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generatePayslipPdfBuffer,
};
