"""
PDF Export API endpoints.

Provides PDF generation for submitted cases with credit consumption.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import Response

from app.dependencies.auth import AuthContext, get_current_user
from app.db.prisma_client import prisma
from app.services.pdf_service import pdf_service


router = APIRouter(prefix="/cases", tags=["pdf"])


async def _get_case_with_snapshot(case_id: str, tenant_id: str):
    """Get case with latest snapshot or raise appropriate error."""
    case = await prisma.case.find_first(
        where={"id": case_id, "tenant_id": tenant_id},
        include={"procedure": True},
    )
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CASE_NOT_FOUND", "message": "Case not found."},
        )
    return case


async def _get_latest_snapshot(case_id: str):
    """Get the latest snapshot for a case."""
    snapshot = await prisma.casesnapshot.find_first(
        where={"case_id": case_id},
        order={"version": "desc"},
    )
    return snapshot


async def _check_and_consume_credit(tenant_id: str, user_id: str, case_id: str, version: int) -> int:
    """
    Check if tenant has credits and consume one.
    
    Returns the new balance.
    Raises HTTPException if insufficient credits.
    """
    # Get current balance
    balance_record = await prisma.tenantcreditbalance.find_unique(
        where={"tenant_id": tenant_id}
    )
    
    current_balance = balance_record.balance if balance_record else 0
    
    if current_balance < 1:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "code": "INSUFFICIENT_CREDITS",
                "message": "Nicht genügend Credits. Bitte laden Sie Credits auf, um PDFs zu exportieren.",
                "details": {"balance": current_balance, "required": 1},
            },
        )
    
    # Consume credit atomically
    # Update balance (decrement by 1)
    updated_balance = await prisma.tenantcreditbalance.update(
        where={"tenant_id": tenant_id},
        data={"balance": {"decrement": 1}},
    )
    
    # Create ledger entry
    await prisma.creditledgerentry.create(
        data={
            "tenant_id": tenant_id,
            "delta": -1,
            "reason": "PDF_EXPORT",
            "metadata_json": {
                "case_id": case_id,
                "version": version,
            },
            "created_by_user_id": user_id,
        }
    )
    
    return updated_balance.balance


@router.post("/{case_id}/pdf")
async def export_case_pdf(
    case_id: str,
    request: Request,
    context: AuthContext = Depends(get_current_user),
) -> Response:
    """
    Export a submitted case as PDF.
    
    Preconditions:
    - Case must be SUBMITTED
    - Snapshot must exist
    - Tenant must have at least 1 credit
    
    On success:
    - Generates PDF from latest snapshot
    - Consumes 1 credit
    - Creates ledger entry for audit
    - Returns PDF as stream download
    
    Errors:
    - 404 CASE_NOT_FOUND: Case does not exist or not accessible
    - 409 CASE_NOT_SUBMITTED: Case is not in SUBMITTED status
    - 402 INSUFFICIENT_CREDITS: Tenant has no credits
    """
    tenant_id = context.tenant["id"]
    user_id = context.user["id"]
    
    # Get request ID for audit trail
    request_id = getattr(request.state, "request_id", "unknown")
    
    # 1. Get case
    case = await _get_case_with_snapshot(case_id, tenant_id)
    
    # 2. Check status
    if case.status != "SUBMITTED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CASE_NOT_SUBMITTED",
                "message": "Nur eingereichte Cases können als PDF exportiert werden.",
                "details": {"current_status": case.status},
            },
        )
    
    # 3. Get latest snapshot
    snapshot = await _get_latest_snapshot(case_id)
    if not snapshot:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "NO_SNAPSHOT",
                "message": "Kein Snapshot vorhanden. Case muss zuerst eingereicht werden.",
            },
        )
    
    # 4. Check and consume credit
    await _check_and_consume_credit(tenant_id, user_id, case_id, snapshot.version)
    
    # 5. Get procedure name (from case.procedure or snapshot)
    procedure_name = case.procedure.name if case.procedure else snapshot.procedure_code
    
    # 6. Generate PDF
    pdf_bytes = pdf_service.generate_pdf(
        case_id=case_id,
        version=snapshot.version,
        procedure_code=snapshot.procedure_code,
        procedure_version=snapshot.procedure_version,
        procedure_name=procedure_name,
        fields_json=snapshot.fields_json,
        request_id=request_id,
    )
    
    # 7. Generate filename
    filename = pdf_service.get_filename(
        procedure_code=snapshot.procedure_code,
        case_id=case_id,
        version=snapshot.version
    )
    
    # 8. Return PDF as download
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Credits-Consumed": "1",
        },
    )

