from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from schemas.pa_form import PAFormFields
from pydantic import BaseModel

router = APIRouter()


class PDFRequest(BaseModel):
    form: PAFormFields
    patient_name: str = ""


@router.post("", response_class=Response)
def generate_pdf(req: PDFRequest):
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
        import io

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter,
                                rightMargin=0.75*inch, leftMargin=0.75*inch,
                                topMargin=0.75*inch, bottomMargin=0.75*inch)

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle("Title", parent=styles["Heading1"], fontSize=14,
                                     alignment=TA_CENTER, spaceAfter=4)
        heading_style = ParagraphStyle("Heading", parent=styles["Heading2"], fontSize=11,
                                       textColor=colors.HexColor("#1e40af"), spaceBefore=12, spaceAfter=4)
        normal = styles["Normal"]
        f = req.form

        def field_row(label: str, value: str) -> list:
            return [Paragraph(f"<b>{label}</b>", normal), Paragraph(value or "—", normal)]

        def bool_str(v: bool) -> str:
            return "Yes" if v else "No"

        story = []

        # Header
        story.append(Paragraph("MassHealth Prior Authorization Request", title_style))
        story.append(Paragraph("GLP-1 Receptor Agonist — Pediatric Obesity", title_style))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e40af"), spaceAfter=8))

        def section(title: str, rows: list[list]):
            story.append(Paragraph(title, heading_style))
            t = Table(rows, colWidths=[2.5*inch, 4.5*inch])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f0f4ff")),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
                ("PADDING", (0, 0), (-1, -1), 5),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]))
            story.append(t)

        section("Section A — Patient Information", [
            field_row("Name", f"{f.patient_first_name} {f.patient_last_name}"),
            field_row("Date of Birth", f.patient_dob),
            field_row("Sex", f.patient_sex),
            field_row("MRN", f.patient_mrn),
            field_row("Insurance ID", f.patient_insurance_id),
            field_row("Address", f.patient_address),
            field_row("Phone", f.patient_phone),
        ])

        section("Section B — Diagnosis & Clinical Data", [
            field_row("Primary Dx Code", f.primary_diagnosis_code),
            field_row("Primary Dx Description", f.primary_diagnosis_description),
            field_row("Secondary Diagnoses", f.secondary_diagnoses),
            field_row("Current BMI", f.current_bmi),
            field_row("BMI Percentile", f.bmi_percentile),
            field_row("Weight (kg)", f.current_weight_kg),
            field_row("Height (cm)", f.current_height_cm),
        ])

        comorbidities = []
        if f.comorbidity_hypertension: comorbidities.append("Hypertension")
        if f.comorbidity_dyslipidemia: comorbidities.append("Dyslipidemia")
        if f.comorbidity_prediabetes: comorbidities.append("Prediabetes")
        if f.comorbidity_sleep_apnea: comorbidities.append("Obstructive Sleep Apnea")
        if f.comorbidity_nafld: comorbidities.append("NAFLD")
        if f.comorbidity_other: comorbidities.append(f.comorbidity_other)

        section("Section C — Weight Management History", [
            field_row("Program Description", f.weight_management_program),
            field_row("Duration (months)", f.program_duration_months),
            field_row("Comorbidities", ", ".join(comorbidities) if comorbidities else "None"),
            field_row("Prior Medications Tried", f.prior_medications_tried),
        ])

        section("Section D — Requested Medication", [
            field_row("Drug", f.requested_drug),
            field_row("Dose/Route", f.requested_dose),
            field_row("Quantity", f.quantity),
            field_row("Duration (months)", f.duration_months),
        ])

        section("Section E — Prescriber", [
            field_row("Prescriber Name", f.prescriber_name),
            field_row("NPI", f.prescriber_npi),
            field_row("Specialty", f.prescriber_specialty),
        ])

        section("Section F — Contraindication Attestations", [
            field_row("No history of pancreatitis", bool_str(f.no_pancreatitis_history)),
            field_row("No history of MEN type 2", bool_str(f.no_men2_history)),
            field_row("No history of thyroid carcinoma", bool_str(f.no_thyroid_cancer_history)),
        ])

        # Clinical justification
        story.append(Paragraph("Section G — Clinical Justification", heading_style))
        just_style = ParagraphStyle("just", parent=normal, fontSize=9, leading=13, spaceAfter=6)
        for para in (f.clinical_justification or "").split("\n\n"):
            if para.strip():
                story.append(Paragraph(para.strip(), just_style))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="PA_{f.patient_last_name}_{f.patient_first_name}.pdf"'},
        )

    except ImportError:
        raise HTTPException(status_code=500, detail="reportlab not installed — run: pip install reportlab")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
