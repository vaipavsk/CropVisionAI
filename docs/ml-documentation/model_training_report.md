# EfficientNet-B0 37-Class Candidate Model Evaluation Report

**Date:** 2026-08-26
**Candidate Model Checkpoint:** `c:\Users\vipin\OneDrive\Documents\CropVisionAI\ai-service\trained_models\efficientnet_b0_37class_candidate.pth`
**Class Mapping:** `c:\Users\vipin\OneDrive\Documents\CropVisionAI\ai-service\trained_models\class_mapping.json`
**Training Set Size:** 58700 (43,604 real + 15,096 synthetic)
**Validation Set Size:** 5304 (100% real unseen)
**Test Set Size:** 5241 (100% real unseen)
**Training Time:** 260.51 minutes

## Real Unseen Test Set Metrics

| Model Variant | Test Accuracy | Macro Precision | Macro Recall | Macro F1-Score | Weighted F1-Score |
| :--- | ---: | ---: | ---: | ---: | ---: |
| **Baseline (Initial Random Classifier Head)** | 1.16% | 0.0090 | 0.0176 | 0.0078 | 0.0117 |
| **Candidate Model (37-Class Fine-Tuned)** | **97.65%** | **0.9755** | **0.9800** | **0.9771** | **0.9764** |

## Top 5 Strongest Classes

- **Rice_Tungro**: F1 = **1.0000** (Precision = 1.0000, Recall = 1.0000, Support = 323)
- **Corn_Common_Rust**: F1 = **1.0000** (Precision = 1.0000, Recall = 1.0000, Support = 119)
- **Corn_Healthy**: F1 = **1.0000** (Precision = 1.0000, Recall = 1.0000, Support = 117)
- **Rice_Neck_Blast**: F1 = **1.0000** (Precision = 1.0000, Recall = 1.0000, Support = 75)
- **Tomato_Mosaic_Virus**: F1 = **1.0000** (Precision = 1.0000, Recall = 1.0000, Support = 37)

## Top 5 Weakest Classes

- **Rice_Leaf_Smut**: F1 = **0.9455** (Precision = 0.8966, Recall = 1.0000, Support = 52)
- **Rice_Leaf_Blast**: F1 = **0.9173** (Precision = 0.9299, Recall = 0.9050, Support = 337)
- **Rice_Hispa**: F1 = **0.9082** (Precision = 0.9461, Recall = 0.8733, Support = 221)
- **Rice_Bacterial_Streak**: F1 = **0.8696** (Precision = 0.7692, Recall = 1.0000, Support = 10)
- **Rice_Sheath_Rot**: F1 = **0.8235** (Precision = 0.8750, Recall = 0.7778, Support = 9)

## Complete 37-Class Performance Breakdown

| Class Name | Test Support | Precision | Recall | F1-Score |
| :--- | ---: | ---: | ---: | ---: |
| **Corn_Common_Rust** | 119 | 1.0000 | 1.0000 | 1.0000 |
| **Corn_Gray_Leaf_Spot** | 51 | 0.9808 | 1.0000 | 0.9903 |
| **Corn_Healthy** | 117 | 1.0000 | 1.0000 | 1.0000 |
| **Corn_Northern_Leaf_Blight** | 99 | 1.0000 | 0.9899 | 0.9949 |
| **Pepper_Bacterial_Spot** | 100 | 0.9900 | 0.9900 | 0.9900 |
| **Pepper_Healthy** | 147 | 0.9932 | 1.0000 | 0.9966 |
| **Potato_Early_Blight** | 100 | 0.9901 | 1.0000 | 0.9950 |
| **Potato_Healthy** | 15 | 1.0000 | 1.0000 | 1.0000 |
| **Potato_Late_Blight** | 100 | 1.0000 | 0.9900 | 0.9950 |
| **Rice_Bacterial_Blight** | 348 | 0.9690 | 0.9885 | 0.9787 |
| **Rice_Bacterial_Streak** | 10 | 0.7692 | 1.0000 | 0.8696 |
| **Rice_Bakanae** | 10 | 1.0000 | 1.0000 | 1.0000 |
| **Rice_Brown_Spot** | 370 | 0.9464 | 0.9541 | 0.9502 |
| **Rice_False_Smut** | 6 | 1.0000 | 1.0000 | 1.0000 |
| **Rice_Grassy_Stunt_Virus** | 10 | 1.0000 | 1.0000 | 1.0000 |
| **Rice_Healthy** | 295 | 0.9283 | 0.9661 | 0.9468 |
| **Rice_Hispa** | 221 | 0.9461 | 0.8733 | 0.9082 |
| **Rice_Leaf_Blast** | 337 | 0.9299 | 0.9050 | 0.9173 |
| **Rice_Leaf_Scald** | 253 | 0.9920 | 0.9802 | 0.9861 |
| **Rice_Leaf_Smut** | 52 | 0.8966 | 1.0000 | 0.9455 |
| **Rice_Narrow_Brown_Spot** | 179 | 1.0000 | 0.9944 | 0.9972 |
| **Rice_Neck_Blast** | 75 | 1.0000 | 1.0000 | 1.0000 |
| **Rice_Ragged_Stunt_Virus** | 10 | 1.0000 | 1.0000 | 1.0000 |
| **Rice_Sheath_Blight** | 62 | 0.9839 | 0.9839 | 0.9839 |
| **Rice_Sheath_Rot** | 9 | 0.8750 | 0.7778 | 0.8235 |
| **Rice_Stem_Rot** | 10 | 1.0000 | 1.0000 | 1.0000 |
| **Rice_Tungro** | 323 | 1.0000 | 1.0000 | 1.0000 |
| **Tomato_Bacterial_Spot** | 213 | 0.9859 | 0.9859 | 0.9859 |
| **Tomato_Early_Blight** | 100 | 1.0000 | 0.9700 | 0.9848 |
| **Tomato_Healthy** | 158 | 0.9937 | 1.0000 | 0.9968 |
| **Tomato_Late_Blight** | 190 | 0.9845 | 1.0000 | 0.9922 |
| **Tomato_Leaf_Mold** | 95 | 0.9895 | 0.9895 | 0.9895 |
| **Tomato_Mosaic_Virus** | 37 | 1.0000 | 1.0000 | 1.0000 |
| **Tomato_Septoria_Leaf_Spot** | 177 | 1.0000 | 0.9774 | 0.9886 |
| **Tomato_Spider_Mites** | 167 | 0.9708 | 0.9940 | 0.9822 |
| **Tomato_Target_Spot** | 141 | 0.9853 | 0.9504 | 0.9675 |
| **Tomato_Yellow_Leaf_Curl_Virus** | 535 | 0.9926 | 0.9981 | 0.9953 |