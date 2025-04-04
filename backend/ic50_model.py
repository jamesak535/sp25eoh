from ic50_predictor_class import SMILEStoIC50Predictor
import joblib

model = joblib.load('ic50_model.pkl')

def predict_ic50(smiles: str) -> float:
    try:
        preds, _ = model.predict([smiles])
        return float(preds[0]) if preds else -1
    except Exception as e:
        print(f"[ic50 예측 실패] {e}")
        return -1
