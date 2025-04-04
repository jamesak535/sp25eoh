from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from inference import img_to_smiles
from ic50_model import predict_ic50
from rdkit import Chem
import os
import json

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route("/image-to-smiles", methods=["POST"])
def convert_image():
    if 'image' not in request.files:
        return jsonify({'error': '이미지가 없습니다!'}), 400

    image = Image.open(request.files['image'].stream)
    smiles = img_to_smiles(image)

    if not smiles:
        return jsonify({'error': 'SMILES 변환 실패'}), 500

    try:
        ic50 = predict_ic50(smiles)
        return jsonify({'smiles': smiles, 'ic50': ic50})
    except Exception as e:
        print(f"[ic50 예측 실패] {e}")
        return jsonify({'smiles': smiles, 'ic50': '예측 실패'}), 200

@app.route("/mol-to-smiles", methods=["POST"])
def mol_to_smiles():
    data = request.get_json()
    mol_block = data.get("mol")

    if not mol_block:
        return jsonify({"error": "Mol 데이터 없음"}), 400

    try:
        mol = Chem.MolFromMolBlock(mol_block, sanitize=False)
        Chem.SanitizeMol(mol)
        smiles = Chem.MolToSmiles(mol)

        ic50 = predict_ic50(smiles)
        return jsonify({"smiles": smiles, "ic50": ic50})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

LEADERBOARD_FILE = "leaderboard.json"

def load_leaderboard():
    if not os.path.exists(LEADERBOARD_FILE):
        return []
    with open(LEADERBOARD_FILE, "r") as f:
        return json.load(f)

def save_leaderboard(data):
    with open(LEADERBOARD_FILE, "w") as f:
        json.dump(data, f, indent=2)

@app.route("/submit-score", methods=["POST"])
def submit_score():
    data = request.get_json()
    name = data.get("name")
    smiles = data.get("smiles")
    ic50 = data.get("ic50")

    if not name or not smiles or ic50 is None:
        return jsonify({"error": "Missing required fields"}), 400

    leaderboard = load_leaderboard()
    leaderboard.append({
        "name": name,
        "smiles": smiles,
        "ic50": ic50
    })
    save_leaderboard(leaderboard)
    return jsonify({"message": "Success", "leaderboard": leaderboard})

@app.route("/leaderboard", methods=["GET"])
def get_leaderboard():
    leaderboard = load_leaderboard()
    return jsonify({"leaderboard": leaderboard})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
