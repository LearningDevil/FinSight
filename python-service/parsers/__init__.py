from . import phonepe, gpay, paytm

# Map email senders to their parsers
SENDER_MAP = {
    'no-reply@phonepe.com':           phonepe,
    'alerts@phonepe.com':             phonepe,
    'noreply@google.com':             gpay,
    'googlepay-noreply@google.com':   gpay,
    'noreply@paytm.com':              paytm,
    'care@paytm.com':                 paytm,
}

def parse_email(sender: str, body: str, email_date: str) -> dict | None:
    """
    Route email to the correct parser based on sender.
    Returns parsed transaction or None if no parser found.
    """
    sender_lower = sender.lower()

    for known_sender, parser in SENDER_MAP.items():
        if known_sender in sender_lower:
            return parser.parse(body, email_date)

    # Try all parsers as fallback
    for parser in [phonepe, gpay, paytm]:
        result = parser.parse(body, email_date)
        if result:
            return result

    return None