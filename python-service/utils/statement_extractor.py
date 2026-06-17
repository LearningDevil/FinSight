import pdfplumber
import io
from datetime import datetime

BANK_CONFIGS = {
    "kotak": {
        "date":        1,
        "description": 2,
        "ref":         3,
        "debit":       4,
        "credit":      5,
        "balance":     6,
    }
}

def parse_amount(value) -> float | None:
    """Convert '1,50,000.00' or None → float or None."""
    if not value or str(value).strip() == "":
        return None
    try:
        return float(str(value).replace(",", "").strip())
    except ValueError:
        return None

def parse_date(date_str: str) -> str:
    """Convert '01 Mar 2026' → '2026-03-01'."""
    try:
        return datetime.strptime(date_str.strip(), "%d %b %Y").strftime("%Y-%m-%d")
    except Exception:
        return datetime.now().strftime("%Y-%m-%d")

def extract_transactions(pdf_bytes: bytes, bank: str) -> list:
    """
    Takes unlocked PDF bytes + bank name.
    Returns list of transaction dicts.
    """
    config = BANK_CONFIGS.get(bank)
    if not config:
        raise ValueError(f"Unsupported bank: {bank}")

    transactions = []

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()  # ← plural
            for table in tables:
                if not table or len(table) < 2:
                    continue
                for row in table[1:]:  # skip header row
                    try:
                        # skip rows that are too short
                        if len(row) <= max(config.values()):
                            continue

                        date_str    = row[config["date"]]
                        description = row[config["description"]]
                        debit       = row[config["debit"]]
                        credit      = row[config["credit"]]
                        balance_raw = row[config["balance"]]

                        # skip rows with no transaction amount
                        debit_amt  = parse_amount(debit)
                        credit_amt = parse_amount(credit)
                        if debit_amt is None and credit_amt is None:
                            continue

                        # determine type and amount
                        if debit_amt is not None:
                            txn_type = "debit"
                            amount   = debit_amt
                        else:
                            txn_type = "credit"
                            amount   = credit_amt

                        # skip if date is missing
                        if not date_str or not date_str.strip():
                            continue

                        transactions.append({
                            "date":        parse_date(date_str),
                            "description": description.strip() if description else "",
                            "amount":      amount,
                            "type":        txn_type,
                            "balance":     parse_amount(balance_raw),
                            "source":      f"pdf_statement",
                            "bank":        bank,
                        })

                    except Exception:
                        continue  # malformed row — skip silently

    return transactions