"""
Gmail search and statement extraction.
Searches a user's Gmail inbox for bank statement emails within a bounded
date window, downloads PDF attachments into memory, and returns them for
parsing — never writing anything to disk.
"""

import base64
from datetime import datetime
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

# Sender patterns per bank — statement emails come from these addresses.
# Extend this list as we learn real formats from each bank.
BANK_SENDER_PATTERNS = {
    "kotak":   ["kotak.bank.in", "kotak.com", "kotakbank.com"],
    "axis":    ["axisbank.com"],
    "federal": ["federalbank.co.in"],
}


def build_gmail_service(access_token: str):
    """Create an authenticated Gmail API client from a (decrypted) access token."""
    creds = Credentials(token=access_token)
    return build("gmail", "v1", credentials=creds)


def search_statement_emails(access_token: str, bank: str, after_date: str = None, before_date: str = None) -> list:
    """
    Search Gmail for statement emails from a specific bank.

    Bounded by default to the current calendar year — we never scan a user's
    entire mailbox unless they explicitly widen the range via after/before.

    Returns a list of dicts: { id, subject, date, has_pdf_attachment }
    """
    service = build_gmail_service(access_token)

    senders = BANK_SENDER_PATTERNS.get(bank, [])
    if not senders:
        return []

    # Default window: Jan 1 of current year -> today. Keeps every sync fast.
    if not after_date:
        after_date = f"{datetime.now().year}/01/01"
    if not before_date:
        before_date = datetime.now().strftime("%Y/%m/%d")

    sender_query = " OR ".join(f"from:{s}" for s in senders)
    query = f"({sender_query}) has:attachment filename:pdf after:{after_date} before:{before_date}"

    results = service.users().messages().list(userId="me", q=query, maxResults=25).execute()
    messages = results.get("messages", [])

    found = []
    for msg in messages:
        detail = service.users().messages().get(userId="me", id=msg["id"], format="metadata",
                                                   metadataHeaders=["Subject", "Date"]).execute()
        headers = {h["name"]: h["value"] for h in detail.get("payload", {}).get("headers", [])}

        found.append({
            "id": msg["id"],
            "subject": headers.get("Subject", ""),
            "date": headers.get("Date", ""),
        })

    return found


def download_pdf_attachment(access_token: str, message_id: str) -> bytes | None:
    """
    Downloads the first PDF attachment from a given Gmail message, in memory.
    Returns raw PDF bytes, or None if no PDF attachment found.
    Nothing is written to disk at any point.
    """
    service = build_gmail_service(access_token)

    message = service.users().messages().get(userId="me", id=message_id, format="full").execute()
    parts = message.get("payload", {}).get("parts", [])

    for part in parts:
        filename = part.get("filename", "")
        if filename.lower().endswith(".pdf"):
            attachment_id = part["body"].get("attachmentId")
            if not attachment_id:
                continue

            attachment = service.users().messages().attachments().get(
                userId="me", messageId=message_id, id=attachment_id
            ).execute()

            # Gmail returns attachment data as URL-safe base64 — decode to raw bytes
            pdf_bytes = base64.urlsafe_b64decode(attachment["data"])
            return pdf_bytes

    return None
