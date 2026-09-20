/**
 * NIRAMAYAH Unified Report & PDF System
 * This utility handles standardized PDF generation and report data formatting
 */

export interface ReportData {
  patientName: string;
  patientRef: string;
  date: string | Date;
  riskLevel: string;
  summary: string;
  urgency: string;
  confidenceScore: number;
  keyRiskFactors: string[];
  possibleConditions: string[];
  recommendation: string;
  inputData: any;
  ai_interaction_log?: { question: string; answer: string }[];
}

export const generateReportPdf = (data: ReportData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to download the report.");
    return;
  }

  const formatVal = (val: any) => {
    if (val === undefined || val === null || val === '' || val === false) return 'Not provided';
    if (val === true || val === 'yes') return 'Yes';
    if (val === 'no') return 'No';
    return val;
  };

  const formattedDate = new Date(data.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const d = data.inputData || {};
  const fileName = `NIRAMAYAH_Report_${data.patientRef}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${fileName}</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }

        html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            overflow: hidden !important;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-family: Arial, Helvetica, sans-serif;
        }

        .report-print-area {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 0 !important;
            overflow: hidden !important;
            background: white !important;
        }

        .report-page {
            width: 210mm !important;
            height: 297mm !important;
            box-sizing: border-box !important;
            padding: 12mm 14mm 8mm 14mm !important;
            background: #ffffff !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
            color: #071a38 !important;
            margin: 0 !important;
            page-break-before: avoid !important;
            page-break-after: avoid !important;
            break-before: avoid !important;
            break-after: avoid !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            transform: none !important;
        }

        .report-header {
            flex-shrink: 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #071a38;
            padding-bottom: 8px;
            margin-bottom: 8px;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .logo { width: 24px; height: 24px; }
        .brand-info h1 { font-size: 16px; font-weight: 800; color: #071a38; margin: 0; line-height: 1.1; }
        .brand-info p { font-size: 7px; color: #00856f; text-transform: uppercase; margin: 0; letter-spacing: 1.5px; font-weight: 700; }
        .header-right { text-align: right; font-size: 7px; color: #071a38; font-weight: 700; line-height: 1.4; }

        .report-body { flex: 1; min-height: 0; }

        .risk-banner { border: 2px solid #f59e0b; background: #fffdf5; color: #d97706; font-size: 11px; font-weight: 800; letter-spacing: 4px; text-transform: uppercase; border-radius: 5px; padding: 7px; text-align: center; margin-bottom: 8px; }

        .section-title { font-size: 10px; font-weight: 800; color: #071a38; text-transform: uppercase; margin-bottom: 6px; }
        .summary-box { background: #f8fbfd; border: 1px solid #d8e0ea; border-radius: 6px; padding: 8px; font-size: 8px; line-height: 1.35; color: #334155; margin-bottom: 8px; }

        .cards-container { display: flex; gap: 8px; margin-bottom: 8px; }
        .card { flex: 1; background: #f8fbfd; border: 1px solid #d8e0ea; border-radius: 6px; padding: 9px; }
        .card h3 { font-size: 8px; font-weight: 800; color: #071a38; text-transform: uppercase; margin: 0 0 4px 0; }
        .card ul { margin: 0; padding-left: 12px; list-style-type: disc; }
        .card li { font-size: 8px; color: #334155; line-height: 1.4; }

        .recommendation-section { background: #f8fbfd; border-left: 4px solid #00856f; border-radius: 6px; padding: 10px 12px; margin-bottom: 8px; }
        .recommendation-section h2 { font-size: 14px; font-weight: 800; color: #071a38; text-transform: uppercase; margin: 0 0 6px 0; padding-bottom: 5px; border-bottom: 1px solid #d8e0ea; }
        .recommendation-section p { margin: 0; font-size: 9px; font-weight: 700; color: #071a38; }

        .health-info-section { background: #f8fbfd; border-left: 4px solid #071a38; border-radius: 6px; padding: 12px; margin-bottom: 8px; }
        .health-info-section h2 { font-size: 16px; font-weight: 800; color: #071a38; text-transform: uppercase; margin: 0 0 8px 0; padding-bottom: 6px; border-bottom: 1px solid #d8e0ea; }
        .group-title { font-size: 10px; font-weight: 800; color: #00856f; border-bottom: 1px solid #c7f0df; padding-bottom: 3px; margin-top: 6px; margin-bottom: 4px; }
        .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px; }
        .data-row { display: flex; justify-content: space-between; border-bottom: 1px solid #d8e0ea; padding: 4px 0; font-size: 9px; }
        .data-label { color: #718096; font-weight: 700; }
        .data-value { color: #071a38; font-weight: 800; text-align: right; }

        .stats-row { display: flex; justify-content: space-between; font-size: 8px; letter-spacing: 1px; font-weight: 800; margin-top: 6px; }
        .urgency-label { color: #8a9bb0; }
        .urgency-value { color: #d97706; }
        .confidence-label { color: #8a9bb0; }

        .report-footer { flex-shrink: 0; margin-top: auto; text-align: center; page-break-inside: avoid; break-inside: avoid; }
        .footer-disclaimer { font-size: 6.5px; line-height: 1.25; color: #8a9bb0; font-style: italic; max-width: 165mm; margin: 0 auto 6px auto; border-top: 1px solid #e5eaf0; padding-top: 6px; }
        .footer-tricolor { display: flex; justify-content: center; align-items: center; gap: 7px; height: 20px; }
        .footer-line { width: 65px; height: 2px; display: inline-block; }
        .footer-line.saffron { background: #ff9933; }
        .footer-line.green { background: #138808; }
        .footer-chakra { width: 18px; height: 18px; object-fit: contain; display: block; }
        .footer-made-india { margin-top: 3px; font-size: 7px; letter-spacing: 4px; font-weight: 800; color: #071a38; line-height: 1; }

        @media print {
            @page { size: A4; margin: 0; }
            html, body { margin: 0 !important; padding: 0 !important; width: 210mm !important; height: 297mm !important; overflow: hidden !important; background: white !important; }
            .report-page { page-break-before: avoid !important; page-break-after: avoid !important; break-before: avoid !important; break-after: avoid !important; position: fixed !important; top: 0 !important; left: 0 !important; }
            .no-print, nav, aside, .sidebar, .topbar { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="report-print-area">
        <div class="report-page">
            <div class="report-header">
                <div class="header-left">
                    <img src="/NIRAMAYAH_LOGO.png" alt="Logo" class="logo">
                    <div class="brand-info">
                        <h1>NIRAMAYAH</h1>
                        <p>PRECISION CARDIAC AI</p>
                    </div>
                </div>
                <div class="header-right">
                    <div>REPORT ID: ${data.patientRef}</div>
                    <div>DATE: ${formattedDate}</div>
                    <div>PATIENT: ${data.patientName}</div>
                </div>
            </div>

            <div class="report-body">
                <div class="risk-banner">
                    ${data.riskLevel.toUpperCase()} RISK DETECTED
                </div>

                <div class="section-title">DIAGNOSTIC SUMMARY</div>
                <div class="summary-box">
                    ${data.summary}
                </div>

                <div class="cards-container">
                    <div class="card">
                        <h3>PRIMARY RISK FACTORS</h3>
                        <ul>
                            ${(data.keyRiskFactors || []).slice(0, 4).map(f => `<li>${f}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="card">
                        <h3>DIFFERENTIAL DIAGNOSIS</h3>
                        <ul>
                            ${(data.possibleConditions || []).slice(0, 4).map(c => `<li>${c}</li>`).join('')}
                        </ul>
                    </div>
                </div>

                <div class="recommendation-section">
                    <h2>RECOMMENDATION & NEXT STEPS</h2>
                    <p>${data.recommendation}</p>
                </div>

                <div class="health-info-section">
                    <h2>SUBMITTED HEALTH INFORMATION</h2>
                    
                    <div class="group-title">A. Basic Profile</div>
                    <div class="data-grid">
                        <div class="data-row"><span class="data-label">Age</span><span class="data-value">${formatVal(d.age)} yrs</span></div>
                        <div class="data-row"><span class="data-label">Gender</span><span class="data-value">${formatVal(d.gender)}</span></div>
                        <div class="data-row"><span class="data-label">Height</span><span class="data-value">${formatVal(d.height)} cm</span></div>
                        <div class="data-row"><span class="data-label">Weight</span><span class="data-value">${formatVal(d.weight)} kg</span></div>
                    </div>

                    <div class="group-title">B. Vital Signs</div>
                    <div class="data-grid">
                        <div class="data-row"><span class="data-label">Systolic BP</span><span class="data-value">${formatVal(d.bp_sys)} mmHg</span></div>
                        <div class="data-row"><span class="data-label">Diastolic BP</span><span class="data-value">${formatVal(d.bp_dia)} mmHg</span></div>
                        <div class="data-row"><span class="data-label">Heart Rate</span><span class="data-value">${formatVal(d.heart_rate)} bpm</span></div>
                        <div class="data-row"><span class="data-label">Blood Sugar</span><span class="data-value">${formatVal(d.blood_sugar)} mg/dL</span></div>
                    </div>

                    <div class="group-title">C. Lifestyle Factors</div>
                    <div class="data-grid">
                        <div class="data-row"><span class="data-label">Smoking</span><span class="data-value">${formatVal(d.smoking)}</span></div>
                        <div class="data-row"><span class="data-label">Activity</span><span class="data-value">${formatVal(d.activity)}</span></div>
                        <div class="data-row"><span class="data-label">Stress</span><span class="data-value">${formatVal(d.stress)}</span></div>
                        <div class="data-row"><span class="data-label">Alcohol</span><span class="data-value">${formatVal(d.alcohol)}</span></div>
                    </div>

                    <div class="group-title">D. Medical History</div>
                    <div class="data-grid">
                        <div class="data-row"><span class="data-label">Family History</span><span class="data-value">${formatVal(d.family_history)}</span></div>
                        <div class="data-row"><span class="data-label">Diabetes</span><span class="data-value">${formatVal(d.diabetes)}</span></div>
                        <div class="data-row"><span class="data-label">Hypertension</span><span class="data-value">${formatVal(d.hypertension)}</span></div>
                        <div class="data-row"><span class="data-label">Prev. Attack</span><span class="data-value">${formatVal(d.previous_attack)}</span></div>
                    </div>

                    <div class="group-title">E. Current Symptoms</div>
                    <div class="data-grid">
                        <div class="data-row"><span class="data-label">Chest Pain</span><span class="data-value">${formatVal(d.chestPain)}</span></div>
                        <div class="data-row"><span class="data-label">Pain Type</span><span class="data-value">${formatVal(d.pain_type)}</span></div>
                        <div class="data-row"><span class="data-label">Pain Radiates</span><span class="data-value">${formatVal(d.pain_radiate)}</span></div>
                        <div class="data-row"><span class="data-label">Breathlessness</span><span class="data-value">${formatVal(d.breathlessness)}</span></div>
                        <div class="data-row"><span class="data-label">Palpitations</span><span class="data-value">${formatVal(d.palpitations)}</span></div>
                        <div class="data-row"><span class="data-label">Dizziness</span><span class="data-value">${formatVal(d.dizziness)}</span></div>
                        <div class="data-row"><span class="data-label">Swelling</span><span class="data-value">${formatVal(d.swelling)}</span></div>
                        <div class="data-row"><span class="data-label">Fatigue</span><span class="data-value">${formatVal(d.fatigue)}</span></div>
                        <div class="data-row"><span class="data-label">Sweating</span><span class="data-value">${formatVal(d.sweating)}</span></div>
                    </div>

                    <div class="group-title">F. Advanced & Optional</div>
                    <div class="data-grid">
                        <div class="data-row"><span class="data-label">ECG Available</span><span class="data-value">${formatVal(d.ecg_available)}</span></div>
                        <div class="data-row"><span class="data-label">HRV</span><span class="data-value">${formatVal(d.hrv)}</span></div>
                        <div class="data-row"><span class="data-label">SpO2</span><span class="data-value">${formatVal(d.spo2)}%</span></div>
                        <div class="data-row"><span class="data-label">Known Diagnosis</span><span class="data-value">${formatVal(d.known_diagnosis)}</span></div>
                    </div>
                </div>

                <div class="stats-row">
                    <div><span class="urgency-label">URGENCY: </span><span class="urgency-value">${data.urgency?.toUpperCase() || 'NORMAL'}</span></div>
                    <div><span class="confidence-label">AI CONFIDENCE SCORE: </span><span>${data.confidenceScore || 0}%</span></div>
                </div>
            </div>

            <div class="report-footer">
                <p class="footer-disclaimer">
                    MEDICAL DISCLAIMER: This AI-generated report is for pre-screening and informational purposes only. It does not constitute a formal medical diagnosis. Cardiac conditions require professional evaluation by a qualified healthcare provider. If you are experiencing an emergency, contact medical services immediately.
                </p>
                <div class="footer-tricolor">
                    <span class="footer-line saffron"></span>
                    <img src="/ashoka_chakra.png" alt="Chakra" class="footer-chakra">
                    <span class="footer-line green"></span>
                </div>
                <div class="footer-made-india">PROUDLY MADE IN INDIA</div>
            </div>
        </div>
    </div>
    <script>
        window.onload = function() {
            window.print();
        };
    </script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
};
