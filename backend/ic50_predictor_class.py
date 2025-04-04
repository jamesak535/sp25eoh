import pandas as pd
import numpy as np
from rdkit import Chem, DataStructs
from rdkit.Chem import AllChem, Descriptors, Lipinski
from rdkit.Chem.Descriptors import MolLogP, MolWt
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, RandomizedSearchCV, cross_val_score, KFold
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')
import xgboost as xgb

class SMILEStoIC50Predictor:
    """
    A comprehensive model for predicting IC50 values from SMILES strings.
    This class includes data cleaning (outlier removal) and stratified splitting
    using quantile-based bins to ensure the train/test sets represent the full range of pIC50 values.
    """
    
    def __init__(self, n_estimators=100, max_depth=None, random_state=42, 
                 fingerprint_radius=2, fingerprint_nbits=2048, use_descriptors=True,
                 min_samples_split=2, min_samples_leaf=1, max_features='sqrt', bootstrap=True):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.random_state = random_state
        self.fingerprint_radius = fingerprint_radius
        self.fingerprint_nbits = fingerprint_nbits
        self.use_descriptors = use_descriptors
        self.min_samples_split = min_samples_split
        self.min_samples_leaf = min_samples_leaf
        self.max_features = max_features
        self.bootstrap = bootstrap
        
        self.model = RandomForestRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=random_state,
            min_samples_split=min_samples_split,
            min_samples_leaf=min_samples_leaf,
            max_features=max_features,
            bootstrap=bootstrap,
            n_jobs=-1,
            oob_score=bootstrap  # Enable OOB scoring if bootstrap is True
        )
        self.scaler = StandardScaler()
        
        self.descriptor_names = [
            'MolWt', 'MolLogP', 'NumHDonors', 'NumHAcceptors', 'NumRotatableBonds',
            'NumAromaticRings', 'HeavyAtomCount', 'TPSA', 'LabuteASA', 'BalabanJ',
            'BertzCT', 'MolMR', 'FractionCSP3'
        ]
    
    def _smiles_to_mol(self, smiles):
        """Convert SMILES string to RDKit molecule object."""
        return Chem.MolFromSmiles(smiles)
    
    def _mol_to_features(self, mol):
        """
        Convert molecule to feature vector, combining Morgan fingerprints
        and RDKit descriptors.
        """
        if mol is None:
            return None
        
        # Generate Morgan fingerprint
        fingerprint = AllChem.GetMorganFingerprintAsBitVect(
            mol, self.fingerprint_radius, nBits=self.fingerprint_nbits
        )
        features = np.zeros((1,))
        DataStructs.ConvertToNumpyArray(fingerprint, features)
        
        if self.use_descriptors:
            descriptors = []
            descriptors.append(MolWt(mol))
            descriptors.append(MolLogP(mol))
            descriptors.append(Lipinski.NumHDonors(mol))
            descriptors.append(Lipinski.NumHAcceptors(mol))
            descriptors.append(Lipinski.NumRotatableBonds(mol))
            descriptors.append(Chem.Descriptors.NumAromaticRings(mol))
            descriptors.append(Chem.Lipinski.HeavyAtomCount(mol))
            descriptors.append(Chem.Descriptors.TPSA(mol))
            if hasattr(Descriptors, 'LabuteASA'):
                descriptors.append(Descriptors.LabuteASA(mol))
            if hasattr(Descriptors, 'BalabanJ'):
                descriptors.append(Descriptors.BalabanJ(mol))
            if hasattr(Descriptors, 'BertzCT'):
                descriptors.append(Descriptors.BertzCT(mol))
            if hasattr(Descriptors, 'MolMR'):
                descriptors.append(Descriptors.MolMR(mol))
            if hasattr(Descriptors, 'FractionCSP3'):
                descriptors.append(Descriptors.FractionCSP3(mol))
            
            features = np.concatenate([features, descriptors])
        
        return features
    
    def _convert_to_pic50(self, ic50):
        """Convert IC50 values (in μM) to pIC50 scale: -log10(IC50 in M)."""
        return -np.log10(ic50 * 1e-6)
    
    def _convert_to_ic50(self, pic50):
        """Convert pIC50 back to IC50 (in μM)."""
        return 10**(-pic50) * 1e6
    
    def clean_data(self, smiles_list, ic50_list, multiplier=1.5):
        """
        Remove outliers based on pIC50 values using the IQR method.
        """
        pic50_values = np.array([self._convert_to_pic50(ic50) for ic50 in ic50_list])
        Q1 = np.percentile(pic50_values, 25)
        Q3 = np.percentile(pic50_values, 75)
        IQR = Q3 - Q1
        lower_bound = Q1 - multiplier * IQR
        upper_bound = Q3 + multiplier * IQR
        
        valid_indices = [i for i, val in enumerate(pic50_values) if lower_bound <= val <= upper_bound]
        cleaned_smiles = [smiles_list[i] for i in valid_indices]
        cleaned_ic50 = [ic50_list[i] for i in valid_indices]
        
        print(f"Data cleaning: removed {len(smiles_list)-len(cleaned_smiles)} outliers.")
        return cleaned_smiles, cleaned_ic50, valid_indices
    
    def prepare_data(self, smiles_list, ic50_list, use_pic50=True):
        """
        Process SMILES strings and IC50 values into feature vectors for modeling.
        """
        features_list = []
        valid_indices = []
        valid_ic50 = []
        
        for i, (smiles, ic50) in enumerate(zip(smiles_list, ic50_list)):
            mol = self._smiles_to_mol(smiles)
            if mol is not None:
                features = self._mol_to_features(mol)
                if features is not None:
                    features_list.append(features)
                    valid_indices.append(i)
                    valid_ic50.append(ic50)
        
        if not features_list:
            raise ValueError("No valid molecules found in the input data.")
        
        X = np.vstack(features_list)
        if use_pic50:
            y = np.array([self._convert_to_pic50(ic50) for ic50 in valid_ic50])
        else:
            y = np.array(valid_ic50)
        self.use_pic50 = use_pic50
        return X, y, valid_indices
    
    def find_optimal_params_random(self, X, y, n_iter=50, cv=3):
        """
        Optimize Random Forest hyperparameters using RandomizedSearchCV.
        """
        X_scaled = self.scaler.fit_transform(X)
        param_dist = {
            'n_estimators': [100, 200, 300, 400, 500],
            'max_depth': [None, 10, 20, 30, 40],
            'min_samples_split': [2, 5, 10],
            'min_samples_leaf': [1, 2, 4, 6],
            'max_features': ['sqrt', 'log2', 0.3, 0.5],
            'bootstrap': [True, False]
        }
        rand_search = RandomizedSearchCV(
            RandomForestRegressor(random_state=self.random_state, n_jobs=-1),
            param_distributions=param_dist,
            n_iter=n_iter,
            cv=cv,
            scoring='r2',
            random_state=self.random_state,
            verbose=1
        )
        rand_search.fit(X_scaled, y)
        print("Best parameters (RandomizedSearchCV):", rand_search.best_params_)
        print("Best score:", rand_search.best_score_)
        best_params = rand_search.best_params_
        self.model = RandomForestRegressor(
            n_estimators=best_params['n_estimators'],
            max_depth=best_params['max_depth'],
            random_state=self.random_state,
            min_samples_split=best_params['min_samples_split'],
            min_samples_leaf=best_params['min_samples_leaf'],
            max_features=best_params['max_features'],
            bootstrap=best_params['bootstrap'],
            n_jobs=-1,
            oob_score=best_params['bootstrap']
        )
        return best_params
    
    def train(self, X, y, test_size=0.2, n_bins=5):
        """
        Train the Random Forest model using stratified splitting based on quantile bins of y.
        
        Parameters:
            X (ndarray): Feature matrix.
            y (ndarray): Target vector (pIC50).
            test_size (float): Proportion of the dataset to include in the test split.
            n_bins (int): Number of quantile bins for stratification.
        """
        X_scaled = self.scaler.fit_transform(X)
        # Use pd.qcut to create bins with roughly equal numbers of samples
        y_binned = pd.qcut(y, q=n_bins, labels=False, duplicates='drop')
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=test_size, random_state=self.random_state, stratify=y_binned
        )
        self.model.fit(X_train, y_train)
        y_train_pred = self.model.predict(X_train)
        y_test_pred = self.model.predict(X_test)
        
        metrics = {
            'train_r2': r2_score(y_train, y_train_pred),
            'test_r2': r2_score(y_test, y_test_pred),
            'train_rmse': np.sqrt(mean_squared_error(y_train, y_train_pred)),
            'test_rmse': np.sqrt(mean_squared_error(y_test, y_test_pred)),
            'train_mae': mean_absolute_error(y_train, y_train_pred),
            'test_mae': mean_absolute_error(y_test, y_test_pred)
        }
        if hasattr(self.model, 'oob_score_'):
            metrics['oob_score'] = self.model.oob_score_
        
        self.X_train, self.X_test = X_train, X_test
        self.y_train, self.y_test = y_train, y_test
        self.y_train_pred, self.y_test_pred = y_train_pred, y_test_pred
        return metrics
    
    def train_xgboost(self, X, y, test_size=0.2):
        """
        Train an XGBoost model and evaluate its performance.
        """
        X_scaled = self.scaler.fit_transform(X)
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=test_size, random_state=self.random_state
        )
        model_xgb = xgb.XGBRegressor(random_state=self.random_state, n_jobs=-1)
        model_xgb.fit(X_train, y_train)
        y_train_pred = model_xgb.predict(X_train)
        y_test_pred = model_xgb.predict(X_test)
        metrics = {
            'train_r2': r2_score(y_train, y_train_pred),
            'test_r2': r2_score(y_test, y_test_pred),
            'train_rmse': np.sqrt(mean_squared_error(y_train, y_train_pred)),
            'test_rmse': np.sqrt(mean_squared_error(y_test, y_test_pred)),
            'train_mae': mean_absolute_error(y_train, y_train_pred),
            'test_mae': mean_absolute_error(y_test, y_test_pred)
        }
        return metrics, model_xgb, X_train, X_test, y_train, y_test, y_train_pred, y_test_pred
    
    def cross_validate(self, X, y, cv=5):
        """
        Perform cross-validation on the Random Forest model.
        """
        X_scaled = self.scaler.fit_transform(X)
        kf = KFold(n_splits=cv, shuffle=True, random_state=self.random_state)
        r2_scores = cross_val_score(self.model, X_scaled, y, cv=kf, scoring='r2')
        neg_mse_scores = cross_val_score(self.model, X_scaled, y, cv=kf, scoring='neg_mean_squared_error')
        rmse_scores = np.sqrt(-neg_mse_scores)
        mae_scores = -cross_val_score(self.model, X_scaled, y, cv=kf, scoring='neg_mean_absolute_error')
        metrics = {
            'cv_r2_mean': np.mean(r2_scores),
            'cv_r2_std': np.std(r2_scores),
            'cv_rmse_mean': np.mean(rmse_scores),
            'cv_rmse_std': np.std(rmse_scores),
            'cv_mae_mean': np.mean(mae_scores),
            'cv_mae_std': np.std(mae_scores)
        }
        return metrics
    
    def predict(self, smiles_list):
        """
        Predict IC50 values for new SMILES strings.
        """
        valid_smiles = []
        features_list = []
        for smiles in smiles_list:
            mol = self._smiles_to_mol(smiles)
            if mol is not None:
                features = self._mol_to_features(mol)
                if features is not None:
                    features_list.append(features)
                    valid_smiles.append(smiles)
        if not features_list:
            return [], []
        X = np.vstack(features_list)
        X_scaled = self.scaler.transform(X)
        if self.use_pic50:
            pic50_predictions = self.model.predict(X_scaled)
            predictions = [self._convert_to_ic50(pic50) for pic50 in pic50_predictions]
        else:
            predictions = self.model.predict(X_scaled)
        return predictions, valid_smiles
    
    def plot_actual_vs_predicted(self):
        """
        Plot actual vs. predicted values for training and test sets.
        """
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
        sns.scatterplot(x=self.y_train, y=self.y_train_pred, alpha=0.6, ax=ax1)
        ax1.set_xlabel('Actual')
        ax1.set_ylabel('Predicted')
        ax1.set_title(f'Training Set (R² = {r2_score(self.y_train, self.y_train_pred):.3f})')
        min_val = min(self.y_train.min(), self.y_train_pred.min())
        max_val = max(self.y_train.max(), self.y_train_pred.max())
        ax1.plot([min_val, max_val], [min_val, max_val], 'k--')
        
        sns.scatterplot(x=self.y_test, y=self.y_test_pred, alpha=0.6, ax=ax2)
        ax2.set_xlabel('Actual')
        ax2.set_ylabel('Predicted')
        ax2.set_title(f'Test Set (R² = {r2_score(self.y_test, self.y_test_pred):.3f})')
        min_val = min(self.y_test.min(), self.y_test_pred.min())
        max_val = max(self.y_test.max(), self.y_test_pred.max())
        ax2.plot([min_val, max_val], [min_val, max_val], 'k--')
        plt.tight_layout()
        return fig
    
    def plot_feature_importance(self, n_features=20):
        """
        Plot the top important features from the Random Forest model.
        """
        importances = self.model.feature_importances_
        if self.use_descriptors:
            n_fingerprints = self.fingerprint_nbits
            feature_names = [f'Bit_{i}' for i in range(n_fingerprints)]
            feature_names.extend(self.descriptor_names)
        else:
            feature_names = [f'Bit_{i}' for i in range(len(importances))]
        indices = np.argsort(importances)[::-1][:n_features]
        top_names = [feature_names[i] for i in indices]
        top_importances = importances[indices]
        fig, ax = plt.subplots(figsize=(10, 8))
        sns.barplot(x=top_importances, y=top_names, ax=ax)
        ax.set_title('Top Feature Importances')
        ax.set_xlabel('Importance')
        ax.set_ylabel('Feature')
        plt.tight_layout()
        return fig