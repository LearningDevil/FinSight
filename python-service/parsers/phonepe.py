import re
from datetime import datetime

def parse(email_body: str, email_date: str) -> dict | None:
    """
    Parse a PhonePe transaction email and extract transaction details.
    Returns a dict with transaction data or None if parsing fails.
    """

    # ── Detect if this is actually a PhonePe email ───────
    if 'phonepe' not in email_body.lower() and 'phone pe' not in email_body.lower():
        return None

    transaction = {
        'source': 'phonepe',
        'raw_text': email_body[:500],  # store first 500 chars for debugging
    }

    # ── Extract amount ────────────────────────────────────
    # Patterns: "Rs. 250.00" or "INR 250" or "₹250.00"
    amount_patterns = [
        r'Rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)',
        r'INR\s*(\d+(?:,\d+)*(?:\.\d{2})?)',
        r'₹\s*(\d+(?:,\d+)*(?:\.\d{2})?)',
    ]

    amount = None
    for pattern in amount_patterns:
        match = re.search(pattern, email_body, re.IGNORECASE)
        if match:
            # Remove commas from "1,000.00" → "1000.00"
            amount = float(match.group(1).replace(',', ''))
            break

    if not amount:
        return None  # Can't parse without amount

    transaction['amount'] = amount

    # ── Detect credit or debit ────────────────────────────
    debit_keywords  = ['paid to', 'sent to', 'debited', 'payment of', 'transferred to']
    credit_keywords = ['received from', 'credited', 'money received', 'refund']

    body_lower = email_body.lower()

    if any(kw in body_lower for kw in debit_keywords):
        transaction['type'] = 'debit'
    elif any(kw in body_lower for kw in credit_keywords):
        transaction['type'] = 'credit'
    else:
        transaction['type'] = 'debit'  # default to debit if unclear

    # ── Extract merchant ──────────────────────────────────
    # Pattern: "paid to MERCHANT" or "sent to MERCHANT"
    merchant_patterns = [
        r'paid to ([A-Za-z0-9\s&\-\.]+?)(?:\s+on|\s+via|\s+at|\.|$)',
        r'sent to ([A-Za-z0-9\s&\-\.]+?)(?:\s+on|\s+via|\s+at|\.|$)',
        r'transferred to ([A-Za-z0-9\s&\-\.]+?)(?:\s+on|\s+via|\s+at|\.|$)',
    ]

    merchant = None
    for pattern in merchant_patterns:
        match = re.search(pattern, email_body, re.IGNORECASE)
        if match:
            merchant = match.group(1).strip()
            break

    transaction['merchant'] = merchant or 'Unknown'

    # ── Extract date ──────────────────────────────────────
    # Use email date if available, otherwise try to parse from body
    if email_date:
        transaction['transaction_date'] = email_date
    else:
        date_pattern = r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})'
        match = re.search(date_pattern, email_body, re.IGNORECASE)
        if match:
            try:
                parsed = datetime.strptime(match.group(1), '%d %b %Y')
                transaction['transaction_date'] = parsed.strftime('%Y-%m-%d')
            except:
                transaction['transaction_date'] = datetime.now().strftime('%Y-%m-%d')
        else:
            transaction['transaction_date'] = datetime.now().strftime('%Y-%m-%d')

    return transaction