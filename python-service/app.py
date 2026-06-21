import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import pikepdf

app = Flask(__name__)
CORS(app)

# health check
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'python-service'
    })

# parse email
@app.route('/parse/email', methods=['POST'])
def parse_email():
    from parsers import parse_email as do_parse
    
    data = request.get_json()
    if not data or 'body' not in data:
        return jsonify({'error': 'email body required'}), 400

    sender = data.get('sender', '')
    body = data.get('body', '')
    email_date = data.get('date', '')

    result = do_parse(sender, body, email_date)

    if result:
        return jsonify({ 'success': True, 'transaction': result })
    else:
        return jsonify({ 'success': False, 'message': 'Could not parse email' }), 422

# parse pdf bank statement
@app.route('/parse/pdf/statement', methods=['POST'])
def parse_statement():
    from utils.pdf_unlock import unlock_pdf
    from utils.statement_extractor import extract_transactions
    import pikepdf

    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file     = request.files['file']
    password = request.form.get('password', '')
    bank     = request.form.get('bank', 'kotak').lower()

    file_bytes = file.read()

    # Step 1: unlock PDF
    try:
        unlocked_bytes = unlock_pdf(file_bytes, password)
    except pikepdf.PasswordError:
        return jsonify({'error': 'Incorrect PDF password'}), 422
    except Exception as e:
        return jsonify({'error': f'Could not open PDF: {str(e)}'}), 500

    # Step 2: extract transactions
    try:
        transactions = extract_transactions(unlocked_bytes, bank)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Extraction failed: {str(e)}'}), 500

    return jsonify({
        'success':      True,
        'bank':         bank,
        'transactions': transactions,
        'count':        len(transactions),
    })

# parse policy pdf
@app.route('/parse/pdf/policy', methods=['POST'])
def parse_policy():
    # week 5
    return jsonify({'status': 'insights not yet implemented'})


@app.route('/gmail/sync', methods=['POST'])
def gmail_sync():
    from utils.gmail_search import search_statement_emails, download_pdf_attachment
    from utils.pdf_unlock import unlock_pdf
    from utils.statement_extractor import extract_transactions
    import pikepdf

    data = request.get_json()
    access_token = data.get('access_token')
    bank         = data.get('bank')
    password     = data.get('password')
    after_date   = data.get('after_date')   # optional, defaults to Jan 1 this year
    before_date  = data.get('before_date')  # optional, defaults to today
    already_synced_ids = set(data.get('already_synced_ids', []))  # from gmail_sync_log

    if not access_token or not bank or not password:
        return jsonify({'error': 'access_token, bank, and password are required'}), 400

    # Step 1: find candidate statement emails (bounded by date window)
    try:
        emails = search_statement_emails(access_token, bank, after_date, before_date)
    except Exception as e:
        return jsonify({'error': f'Gmail search failed: {str(e)}'}), 500

    # Step 2: skip anything already processed in a previous sync
    new_emails = [e for e in emails if e['id'] not in already_synced_ids]

    results = []
    for email in new_emails:
        entry = {
            'gmail_message_id': email['id'],
            'subject': email['subject'],
            'date': email['date'],
            'status': 'failed',
            'transactions': [],
            'error': None,
        }

        try:
            pdf_bytes = download_pdf_attachment(access_token, email['id'])
            if not pdf_bytes:
                entry['error'] = 'No PDF attachment found in this email'
                results.append(entry)
                continue

            unlocked_bytes = unlock_pdf(pdf_bytes, password)
            transactions = extract_transactions(unlocked_bytes, bank)

            entry['status'] = 'success'
            entry['transactions'] = transactions
            # pdf_bytes and unlocked_bytes go out of scope here -- never written to disk,
            # garbage collected once this loop iteration ends

        except pikepdf.PasswordError:
            entry['error'] = 'Incorrect password for this statement'
        except Exception as e:
            entry['error'] = f'Processing failed: {str(e)}'

        results.append(entry)

    return jsonify({
        'success': True,
        'bank': bank,
        'emails_found': len(emails),
        'emails_skipped': len(emails) - len(new_emails),
        'emails_processed': len(new_emails),
        'results': results,
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)