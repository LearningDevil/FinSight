import re
from datetime import datetime

def parse(email_body: str, email_date: str) -> dict | None:
    """Parse a Paytm transaction email."""

    if 'paytm' not in email_body.lower():
        return None

    transaction = {'source': 'paytm'}

    amount_patterns = [
        r'Rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)',
        r'₹\s*(\d+(?:,\d+)*(?:\.\d{2})?)',
        r'INR\s*(\d+(?:,\d+)*(?:\.\d{2})?)',
    ]

    amount = None
    for pattern in amount_patterns:
        match = re.search(pattern, email_body, re.IGNORECASE)
        if match:
            amount = float(match.group(1).replace(',', ''))
            break

    if not amount:
        return None

    transaction['amount'] = amount

    body_lower = email_body.lower()
    if any(kw in body_lower for kw in ['paid', 'debited', 'sent', 'payment successful']):
        transaction['type'] = 'debit'
    elif any(kw in body_lower for kw in ['received', 'credited', 'refund']):
        transaction['type'] = 'credit'
    else:
        transaction['type'] = 'debit'

    merchant_patterns = [
        r'paid to ([A-Za-z0-9\s&\-\.]+?)(?:\s+on|\s+via|\s+of|\.|$)',
        r'payment to ([A-Za-z0-9\s&\-\.]+?)(?:\s+on|\s+via|\s+of|\.|$)',
    ]

    merchant = None
    for pattern in merchant_patterns:
        match = re.search(pattern, email_body, re.IGNORECASE)
        if match:
            merchant = match.group(1).strip()
            break

    transaction['merchant'] = merchant or 'Unknown'
    transaction['transaction_date'] = email_date or datetime.now().strftime('%Y-%m-%d')

    return transaction