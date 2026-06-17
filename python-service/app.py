import os
from flask import Flask, request, jsonify
from flask_cors import CORS

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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)