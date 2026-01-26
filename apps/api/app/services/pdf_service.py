"""
PDF Generation Service.

Generates PDF documents from CaseSnapshots using WeasyPrint.
"""

from __future__ import annotations

from datetime import datetime, timezone
from io import BytesIO
from typing import Any

from jinja2 import Environment, BaseLoader
from weasyprint import HTML, CSS

from app.domain.summary import generate_case_summary, CaseSummary


# HTML Template for PDF generation
PDF_TEMPLATE = """
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>{{ procedure_name }} - {{ case_id }}</title>
    <style>
        @page {
            size: A4;
            margin: 2cm 1.5cm;
            @bottom-center {
                content: "Seite " counter(page) " von " counter(pages);
                font-size: 9pt;
                color: #666;
            }
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            color: #333;
        }
        
        .header {
            border-bottom: 2px solid #333;
            padding-bottom: 1cm;
            margin-bottom: 0.75cm;
        }
        
        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.5cm;
        }
        
        .logo {
            font-size: 18pt;
            font-weight: bold;
            color: #6366f1;
        }
        
        .document-meta {
            text-align: right;
            font-size: 9pt;
            color: #666;
        }
        
        .document-title {
            font-size: 16pt;
            font-weight: bold;
            margin: 0.5cm 0 0.25cm 0;
        }
        
        .document-subtitle {
            font-size: 11pt;
            color: #666;
        }
        
        .case-info {
            background: #f5f5f5;
            padding: 0.5cm;
            border-radius: 4px;
            margin-bottom: 0.75cm;
        }
        
        .case-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 0.5cm;
        }
        
        .case-info-item {
            font-size: 9pt;
        }
        
        .case-info-label {
            color: #666;
            display: block;
        }
        
        .case-info-value {
            font-weight: 500;
        }
        
        .section {
            margin-bottom: 0.75cm;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 12pt;
            font-weight: bold;
            color: #6366f1;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 0.2cm;
            margin-bottom: 0.4cm;
        }
        
        .field-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .field-row {
            border-bottom: 1px solid #eee;
        }
        
        .field-row:last-child {
            border-bottom: none;
        }
        
        .field-label {
            padding: 0.25cm 0;
            color: #666;
            width: 40%;
            vertical-align: top;
        }
        
        .field-value {
            padding: 0.25cm 0;
            font-weight: 500;
            text-align: right;
        }
        
        .footer {
            margin-top: 1cm;
            padding-top: 0.5cm;
            border-top: 1px solid #e0e0e0;
            font-size: 8pt;
            color: #888;
        }
        
        .footer-disclaimer {
            margin-bottom: 0.25cm;
        }
        
        .footer-meta {
            display: flex;
            justify-content: space-between;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-top">
            <div class="logo">ZollPilot</div>
            <div class="document-meta">
                <div>Erstellt am: {{ generated_at }}</div>
                <div>Request-ID: {{ request_id }}</div>
            </div>
        </div>
        <h1 class="document-title">Ausfüllhilfe zur Zollanmeldung (keine offizielle Anmeldung)</h1>
        <div class="document-subtitle">Vorbereitung für Internetbestellungen</div>
    </div>
    
    <div class="case-info">
        <div class="case-info-grid">
            <div class="case-info-item">
                <span class="case-info-label">Case-ID</span>
                <span class="case-info-value">{{ case_id_short }}</span>
            </div>
            <div class="case-info-item">
                <span class="case-info-label">Version</span>
                <span class="case-info-value">{{ version }}</span>
            </div>
            <div class="case-info-item">
                <span class="case-info-label">Verfahren</span>
                <span class="case-info-value">{{ procedure_code }} {{ procedure_version }}</span>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2 class="section-title">So verwenden Sie dieses Dokument</h2>
        <div style="background: #f9fafb; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 9pt;">
            <p style="margin-bottom: 5px;"><strong>Schritt 1:</strong> Öffnen Sie das offizielle Zollformular (z.B. Internetzollanmeldung IZA).</p>
            <p style="margin-bottom: 5px;"><strong>Schritt 2:</strong> Übertragen Sie die untenstehenden Werte in die entsprechenden Felder.</p>
            <p><strong>Schritt 3:</strong> Prüfen Sie Ihre Angaben und senden Sie das Formular im offiziellen Portal ab.</p>
        </div>
    </div>
    
    {% for section in sections %}
    <div class="section">
        <h2 class="section-title">{{ section.title }}</h2>
        <table class="field-table">
            {% for item in section.items %}
            <tr class="field-row">
                <td class="field-label">{{ item.label }}</td>
                <td class="field-value">{{ item.value }}</td>
            </tr>
            {% endfor %}
        </table>
    </div>
    {% endfor %}
    
    <div class="footer">
        <div class="footer-disclaimer">
            <strong>Hinweis:</strong> Diese Übersicht unterstützt Sie beim Ausfüllen des Zollformulars. 
            Sie ersetzt keine offizielle Zollanmeldung. ZollPilot übermittelt keine Daten an Zollbehörden.
            Der Nutzer ist für die Richtigkeit der Angaben verantwortlich.
        </div>
        <div class="footer-meta">
            <span>© ZollPilot {{ year }}</span>
            <span>Snapshot Version: {{ version }}</span>
        </div>
    </div>
</body>
</html>
"""


class PDFService:
    """Service for generating PDF documents from case data."""

    def __init__(self):
        self._env = Environment(loader=BaseLoader())
        self._template = self._env.from_string(PDF_TEMPLATE)

    def generate_pdf(
        self,
        case_id: str,
        version: int,
        procedure_code: str,
        procedure_version: str,
        procedure_name: str,
        fields_json: dict[str, Any],
        request_id: str,
    ) -> bytes:
        """
        Generate a PDF document from case snapshot data.

        Args:
            case_id: The case ID
            version: Snapshot version
            procedure_code: Procedure code (e.g., "IZA")
            procedure_version: Procedure version (e.g., "v1")
            procedure_name: Human-readable procedure name
            fields_json: Case field data
            request_id: Request ID for audit trail

        Returns:
            PDF file as bytes
        """
        # Generate structured summary
        summary = generate_case_summary(
            procedure_code=procedure_code,
            procedure_version=procedure_version,
            procedure_name=procedure_name,
            fields=fields_json
        )

        # Prepare template context
        now = datetime.now(timezone.utc)
        context = {
            "procedure_name": procedure_name,
            "procedure_code": procedure_code,
            "procedure_version": procedure_version,
            "case_id": case_id,
            "case_id_short": case_id[:8] + "...",
            "version": version,
            "sections": [
                {
                    "title": section.title,
                    "items": [
                        {"label": item.label, "value": item.value}
                        for item in section.items
                    ]
                }
                for section in summary.sections
            ],
            "generated_at": now.strftime("%d.%m.%Y %H:%M UTC"),
            "year": now.year,
            "request_id": request_id,
        }

        # Render HTML
        html_content = self._template.render(**context)

        # Generate PDF
        pdf_buffer = BytesIO()
        HTML(string=html_content).write_pdf(pdf_buffer)

        return pdf_buffer.getvalue()

    def get_filename(self, procedure_code: str, case_id: str, version: int) -> str:
        """
        Generate a standardized filename for the PDF.

        Format: ZollPilot_{procedure}_{case_id_short}_v{version}.pdf
        """
        case_id_short = case_id[:8]
        return f"ZollPilot_{procedure_code}_{case_id_short}_v{version}.pdf"


# Singleton instance
pdf_service = PDFService()

