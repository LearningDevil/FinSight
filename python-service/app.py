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
    data = request.get_json()
    if not data or 'body' not in data:
        return jsonify({'error': 'email body required'}), 400
    # parse logic in week 3
    return jsonify({'status': 'parser not yet implemented'})

# parse pdf bank statement
@app.route('/parse/pdf/statement', methods=['POST'])
def parse_statement():
    # weel 4 work
    return jsonify({'status': 'parser not yet implemented'})

# parse policy pdf
@app.route('/parse/pdf/policy', methods=['POST'])
def parse_policy():
    # week 5
    return jsonify({'status': 'insights not yet implemented'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)