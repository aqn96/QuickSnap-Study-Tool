from flask import Flask, request, jsonify
from flask_cors import CORS
import easyocr
import base64
from io import BytesIO
from PIL import Image
import numpy as np

app = Flask(__name__)
CORS(app)

print("Loading OCR model...")
reader = easyocr.Reader(['en'], gpu=False)
print("OCR ready!")

@app.route('/ocr', methods=['POST'])
def extract_text():
    try:
        data = request.json
        image_data = data['image'].split(',')[1]
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        image_np = np.array(image)
        results = reader.readtext(image_np, detail=0)
        text = ' '.join(results)
        return jsonify({'success': True, 'text': text})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(port=5001)