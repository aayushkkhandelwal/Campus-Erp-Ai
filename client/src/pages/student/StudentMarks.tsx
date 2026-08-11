import { useState } from 'react';
import { Award, CheckCircle2, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const StudentMarks = () => {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const markSheet = [
    { subject: 'Database Management Systems (DBMS)', code: 'CS-501', internal: 28, external: 64, total: 92, grade: 'A+' },
    { subject: 'Operating Systems (OS)', code: 'CS-502', internal: 25, external: 58, total: 83, grade: 'A' },
    { subject: 'Computer Networks (CN)', code: 'CS-503', internal: 29, external: 66, total: 95, grade: 'A+' },
    { subject: 'Software Engineering (SE)', code: 'CS-504', internal: 26, external: 54, total: 80, grade: 'A' },
  ];

  const handleDownloadPDF = () => {
    setDownloading(true);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this site to print or download your PDF Marksheet.');
      setDownloading(false);
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Academic Marksheet Transcript - ${user?.fullName || 'Student'}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #0f172a; line-height: 1.5; }
            .header { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 15px; margin-bottom: 25px; }
            .college-title { font-size: 22px; font-weight: 900; text-transform: uppercase; color: #0f172a; margin: 0; letter-spacing: 1px; }
            .sub-title { font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; margin-top: 4px; }
            .doc-type { font-size: 13px; font-weight: 800; background: #f1f5f9; display: inline-block; padding: 6px 16px; border-radius: 6px; margin-top: 10px; border: 1px solid #cbd5e1; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 25px; font-size: 12px; }
            .info-item { font-weight: 700; }
            .info-item span { color: #64748b; font-weight: 500; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; }
            th { background: #0f172a; color: white; padding: 10px 12px; text-align: left; text-transform: uppercase; font-size: 11px; }
            td { padding: 11px 12px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background: #f8fafc; }
            .grade-badge { font-weight: 900; padding: 3px 10px; border-radius: 4px; background: #dcfce7; color: #166534; display: inline-block; }
            .summary-box { display: flex; justify-content: space-between; background: #0f172a; color: white; padding: 14px 18px; border-radius: 8px; margin-bottom: 40px; font-weight: 700; font-size: 13px; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; text-align: center; font-size: 11px; font-weight: 600; color: #475569; }
            .sig-line { border-top: 1.5px dashed #94a3b8; width: 170px; margin-top: 40px; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="college-title">University College of Engineering & Technology</div>
            <div class="sub-title">Office of the Controller of Examinations • Official Transcript</div>
            <div class="doc-type">STATEMENT OF MARKS & EVALUATION REPORT</div>
          </div>

          <div class="info-grid">
            <div class="info-item"><span>Student Name:</span> ${user?.fullName || 'Emma Watson'}</div>
            <div class="info-item"><span>Student ID / Roll No:</span> STU-2026-001</div>
            <div class="info-item"><span>Department:</span> Computer Science & Engineering</div>
            <div class="info-item"><span>Academic Term:</span> Semester 5 (2026-2027)</div>
            <div class="info-item"><span>Email Address:</span> ${user?.email || 'student@college.edu'}</div>
            <div class="info-item"><span>Date of Issue:</span> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Subject Code</th>
                <th>Subject Name</th>
                <th>Internal (30)</th>
                <th>External (70)</th>
                <th>Total Score (100)</th>
                <th style="text-align: center">Grade</th>
              </tr>
            </thead>
            <tbody>
              ${markSheet
                .map(
                  (m) => `
                <tr>
                  <td style="font-family: monospace; font-weight: 700; color: #0284c7;">${m.code}</td>
                  <td><strong>${m.subject}</strong></td>
                  <td>${m.internal} / 30</td>
                  <td>${m.external} / 70</td>
                  <td><strong>${m.total} / 100</strong></td>
                  <td style="text-align: center"><span class="grade-badge">${m.grade}</span></td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="summary-box">
            <div>Result Status: PASSED (FIRST CLASS WITH DISTINCTION)</div>
            <div>Cumulative SGPA: 3.85 / 4.00</div>
          </div>

          <div class="footer">
            <div>
              <div class="sig-line">Prepared By (Academic Registrar)</div>
            </div>
            <div>
              <div class="sig-line">Verified By (HOD CSE)</div>
            </div>
            <div>
              <div class="sig-line">Controller of Examinations</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setDownloading(false);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2 font-['Outfit']">
            <Award className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            My Academic Marks & Grade Report
          </h1>
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1">
            Official evaluation transcript for Semester 5 (2026-2027)
          </p>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 text-xs font-black shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all cursor-pointer border border-amber-400 shrink-0"
        >
          {downloading ? (
            <span className="animate-pulse">Generating PDF...</span>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Download Marksheet PDF</span>
            </>
          )}
        </button>
      </div>

      {downloadSuccess && (
        <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>Official Marksheet PDF Generated! Print dialog opened successfully.</span>
        </div>
      )}

      <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-amber-100 dark:border-stone-800 text-stone-400 uppercase tracking-wider font-extrabold">
                <th className="py-3 px-4">Subject Code</th>
                <th className="py-3 px-4">Subject Name</th>
                <th className="py-3 px-4">Internal (30)</th>
                <th className="py-3 px-4">External (70)</th>
                <th className="py-3 px-4">Total Score</th>
                <th className="py-3 px-4 text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 dark:divide-stone-800">
              {markSheet.map((m) => (
                <tr key={m.code} className="hover:bg-amber-50/40 dark:hover:bg-stone-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                    {m.code}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-stone-900 dark:text-white">
                    {m.subject}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-stone-700 dark:text-stone-300">
                    {m.internal} / 30
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-stone-700 dark:text-stone-300">
                    {m.external} / 70
                  </td>
                  <td className="py-3.5 px-4 font-black text-stone-900 dark:text-white">
                    {m.total} / 100
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-black text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {m.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentMarks;
