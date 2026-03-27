async def parse_form16_pdf(content: bytes) -> dict:
    """Parse Form 16 PDF and extract salary/tax details.
    
    This is a placeholder implementation. In production, use:
    - PyPDF2 for text extraction
    - Tabula-py for table extraction
    - AI (Gemini Vision) for complex Form 16 layouts
    """
    # TODO: Implement actual PDF parsing
    # For now, return structure for manual input
    return {
        "parsed": False,
        "message": "Form 16 uploaded. Please verify the extracted data.",
        "extracted_data": {
            "gross_salary": 0,
            "hra_received": 0,
            "standard_deduction": 50000,
            "professional_tax": 0,
            "section_80c_total": 0,
            "section_80d_total": 0,
            "tax_deducted": 0,
        },
    }
