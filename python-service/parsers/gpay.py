import re
from datetime import datetime

def parse(email_body: str, email_date: str) -> dict | None:
    """Parse a Google Pay transaction email."""

    if 'google pay' not in email_body.lower() and 'gpay' not in email_body.lower() and 'tez' not in email_body.lower():
        return None

    transaction = {'source': 'gpay'}

    # Amount
    amount_patterns = [
        r'₹\s*(\d+(?:,\d+)*(?:\.\d{2})?)',
        r'Rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)',
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

    # Type
    body_lower = email_body.lower()
    if any(kw in body_lower for kw in ['you paid', 'sent', 'debited', 'payment to']):
        transaction['type'] = 'debit'
    elif any(kw in body_lower for kw in ['you received', 'credited', 'received from']):
        transaction['type'] = 'credit'
    else:
        transaction['type'] = 'debit'

    # Merchant
    merchant_patterns = [
        r'you paid ([A-Za-z0-9\s&\-\.]+?)(?:\s+₹|\s+Rs|\s+on|\.|$)',
        r'payment to ([A-Za-z0-9\s&\-\.]+?)(?:\s+₹|\s+Rs|\s+on|\.|$)',
        r'sent to ([A-Za-z0-9\s&\-\.]+?)(?:\s+₹|\s+Rs|\s+on|\.|$)',
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