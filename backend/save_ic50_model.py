# save_ic50_model.py
from ic50_predictor_class import SMILEStoIC50Predictor
import joblib
import pandas as pd

# 데이터 불러오기
data = pd.read_csv('sorted_f_avg_IC50.csv')
data = data.dropna(subset=['f_avg_IC50'])
smiles_list = data['SMILES'].tolist()
ic50_list = data['f_avg_IC50'].tolist()

# 모델 정의 및 훈련
model = SMILEStoIC50Predictor()
cleaned_smiles, cleaned_ic50, _ = model.clean_data(smiles_list, ic50_list)
X, y, _ = model.prepare_data(cleaned_smiles, cleaned_ic50)
model.train(X, y)

# 저장! (이제는 __main__이 아니라 모듈로부터 불러온 상태라 OK!)
joblib.dump(model, 'ic50_model.pkl')
print("✅ 모델 저장 완료!")
