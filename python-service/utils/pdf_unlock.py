import pikepdf
import io

def unlock_pdf(file_bytes: bytes, password: str) -> bytes:
    """
    Takes encrypted PDF bytes + password.
    Returns decrypted PDF bytes (no password).
    Raises pikepdf.PasswordError if password is wrong
    """

    with pikepdf.open(io.BytesIO(file_bytes), password=password) as pdf:
        output = io.BytesIO()
        pdf.save(output)
        return output.getvalue()