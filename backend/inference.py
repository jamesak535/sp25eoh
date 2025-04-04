# inference.py
from PIL import Image
from io import BytesIO
from DECIMER import predict_SMILES  # ✅ 올바른 함수 이름으로 불러오기

def img_to_smiles(image: Image.Image) -> str:
    try:
        # PIL 이미지를 BytesIO 객체로 변환해서 DECIMER에 전달
        buf = BytesIO()
        image.save(buf, format='PNG')
        buf.seek(0)

        smiles = predict_SMILES(buf)  # ✅ 여기서 get_prediction 말고 predict_SMILES 사용
        return smiles
    except Exception as e:
        print(f"예측 중 오류 발생: {e}")
        return ""
