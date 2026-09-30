# Dataset Split Cleaning Report

**Date:** 2026-08-26
**Source Dataset Path:** `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\classification`
**Quarantine Directory:** `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates`

## Summary of Cleaning Actions

- **Initial Total Images Scanned:** 56002
- **Unique Content Image Hashes:** 54149
- **Duplicate Hash Groups Identified:** 1727
- **Total Files Moved to Quarantine:** 1853
- **Remaining Clean Unique Images:** 54149

## Class Distribution After Duplicate Cleaning

| Class Name | Clean Train | Clean Validation | Clean Test | Clean Total |
| :--- | ---: | ---: | ---: | ---: |
| **Corn_Common_Rust** | 953 | 120 | 119 | 1192 |
| **Corn_Gray_Leaf_Spot** | 410 | 52 | 51 | 513 |
| **Corn_Healthy** | 929 | 116 | 117 | 1162 |
| **Corn_Northern_Leaf_Blight** | 788 | 98 | 99 | 985 |
| **Pepper_Bacterial_Spot** | 797 | 100 | 100 | 997 |
| **Pepper_Healthy** | 1183 | 148 | 147 | 1478 |
| **Potato_Early_Blight** | 800 | 100 | 100 | 1000 |
| **Potato_Healthy** | 121 | 16 | 15 | 152 |
| **Potato_Late_Blight** | 800 | 100 | 100 | 1000 |
| **Rice_Bacterial_Blight** | 3160 | 359 | 348 | 3867 |
| **Rice_Bacterial_Streak** | 79 | 10 | 10 | 99 |
| **Rice_Bakanae** | 80 | 10 | 10 | 100 |
| **Rice_Brown_Spot** | 3453 | 388 | 370 | 4211 |
| **Rice_False_Smut** | 86 | 7 | 6 | 99 |
| **Rice_Grassy_Stunt_Virus** | 80 | 10 | 10 | 100 |
| **Rice_Healthy** | 2358 | 295 | 295 | 2948 |
| **Rice_Hispa** | 1767 | 221 | 221 | 2209 |
| **Rice_Leaf_Blast** | 2741 | 341 | 337 | 3419 |
| **Rice_Leaf_Scald** | 2070 | 253 | 253 | 2576 |
| **Rice_Leaf_Smut** | 838 | 70 | 52 | 960 |
| **Rice_Narrow_Brown_Spot** | 1432 | 178 | 179 | 1789 |
| **Rice_Neck_Blast** | 840 | 85 | 75 | 1000 |
| **Rice_Ragged_Stunt_Virus** | 80 | 10 | 10 | 100 |
| **Rice_Sheath_Blight** | 504 | 62 | 62 | 628 |
| **Rice_Sheath_Rot** | 73 | 9 | 9 | 91 |
| **Rice_Stem_Rot** | 80 | 10 | 10 | 100 |
| **Rice_Tungro** | 2582 | 323 | 323 | 3228 |
| **Tomato_Bacterial_Spot** | 1702 | 212 | 213 | 2127 |
| **Tomato_Early_Blight** | 800 | 100 | 100 | 1000 |
| **Tomato_Healthy** | 1269 | 158 | 158 | 1585 |
| **Tomato_Late_Blight** | 1522 | 189 | 190 | 1901 |
| **Tomato_Leaf_Mold** | 761 | 96 | 95 | 952 |
| **Tomato_Mosaic_Virus** | 299 | 37 | 37 | 373 |
| **Tomato_Septoria_Leaf_Spot** | 1417 | 177 | 177 | 1771 |
| **Tomato_Spider_Mites** | 1341 | 168 | 167 | 1676 |
| **Tomato_Target_Spot** | 1123 | 140 | 141 | 1404 |
| **Tomato_Yellow_Leaf_Curl_Virus** | 4286 | 536 | 535 | 5357 |
| **TOTAL** | **43604** | **5304** | **5241** | **54149** |

## Audit Log of Quarantined Files (Sample of First 50)

| Filename | Class | Original Split | Master Split | Reason | Quarantine Path |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `BB_2_a3085502da42.jpg` | Rice_Bacterial_Blight | test | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\test\Rice_Bacterial_Blight\BB_2_a3085502da42.jpg` |
| `BB_3_40e930939f6a.jpg` | Rice_Bacterial_Blight | test | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\test\Rice_Bacterial_Blight\BB_3_40e930939f6a.jpg` |
| `BACTERAILBLIGHT3_086_1155c4125df6.jpg` | Rice_Bacterial_Blight | validation | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\validation\Rice_Bacterial_Blight\BACTERAILBLIGHT3_086_1155c4125df6.jpg` |
| `BACTERAILBLIGHT3_088_e2ab97060b0b.jpg` | Rice_Bacterial_Blight | validation | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\validation\Rice_Bacterial_Blight\BACTERAILBLIGHT3_088_e2ab97060b0b.jpg` |
| `BACTERAILBLIGHT3_090_59f360145694.jpg` | Rice_Bacterial_Blight | validation | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\validation\Rice_Bacterial_Blight\BACTERAILBLIGHT3_090_59f360145694.jpg` |
| `BACTERAILBLIGHT3_084_9440da1faa77.jpg` | Rice_Bacterial_Blight | test | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\test\Rice_Bacterial_Blight\BACTERAILBLIGHT3_084_9440da1faa77.jpg` |
| `BACTERAILBLIGHT3_085_da156f3d7fb1.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_085_da156f3d7fb1.jpg` |
| `BACTERAILBLIGHT3_168_2b2b901efafb.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_168_2b2b901efafb.jpg` |
| `BACTERAILBLIGHT3_073_82cefcb23465.jpg` | Rice_Bacterial_Blight | validation | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\validation\Rice_Bacterial_Blight\BACTERAILBLIGHT3_073_82cefcb23465.jpg` |
| `BACTERAILBLIGHT3_173_da82bef60369.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_173_da82bef60369.jpg` |
| `BB_5_24bc1de9ba2b.jpg` | Rice_Bacterial_Blight | validation | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\validation\Rice_Bacterial_Blight\BB_5_24bc1de9ba2b.jpg` |
| `BACTERAILBLIGHT3_202_3f82562eed10.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_202_3f82562eed10.jpg` |
| `BACTERAILBLIGHT3_117_edd803503dc6.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_117_edd803503dc6.jpg` |
| `BACTERAILBLIGHT3_251_be52863293be.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_251_be52863293be.jpg` |
| `BACTERAILBLIGHT3_119_a67991b89e20.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_119_a67991b89e20.jpg` |
| `BACTERAILBLIGHT3_156_8d6c15373a1d.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_156_8d6c15373a1d.jpg` |
| `BB_9_e0274bfbca11.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BB_9_e0274bfbca11.jpg` |
| `BACTERAILBLIGHT3_120_3b0eaad4adbf.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_120_3b0eaad4adbf.jpg` |
| `BACTERAILBLIGHT3_157_f18eec11125c.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_157_f18eec11125c.jpg` |
| `BACTERAILBLIGHT3_158_60b36171de41.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_158_60b36171de41.jpg` |
| `BACTERAILBLIGHT3_122_2699d6be7131.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_122_2699d6be7131.jpg` |
| `BACTERAILBLIGHT3_159_93e179023c02.jpg` | Rice_Bacterial_Blight | test | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\test\Rice_Bacterial_Blight\BACTERAILBLIGHT3_159_93e179023c02.jpg` |
| `BACTERAILBLIGHT3_123_9dcc8395484d.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_123_9dcc8395484d.jpg` |
| `BACTERAILBLIGHT3_160_60e90322bfc2.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_160_60e90322bfc2.jpg` |
| `BACTERAILBLIGHT3_161_7ba4b634444b.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_161_7ba4b634444b.jpg` |
| `BB_12_c6881b52e6e2.jpg` | Rice_Bacterial_Blight | validation | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\validation\Rice_Bacterial_Blight\BB_12_c6881b52e6e2.jpg` |
| `BACTERAILBLIGHT3_162_94ec5b230d2a.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_162_94ec5b230d2a.jpg` |
| `BACTERAILBLIGHT3_127_eb9c09f7c9e2.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_127_eb9c09f7c9e2.jpg` |
| `BACTERAILBLIGHT3_163_bb7e52e2c360.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_163_bb7e52e2c360.jpg` |
| `BACTERAILBLIGHT3_166_c9692557c90b.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_166_c9692557c90b.jpg` |
| `BACTERAILBLIGHT3_167_ea554708670d.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_167_ea554708670d.jpg` |
| `BACTERAILBLIGHT3_116_84d6c1604cc7.jpg` | Rice_Bacterial_Blight | test | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\test\Rice_Bacterial_Blight\BACTERAILBLIGHT3_116_84d6c1604cc7.jpg` |
| `BACTERAILBLIGHT3_118_1ef2dda6acc8.jpg` | Rice_Bacterial_Blight | validation | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\validation\Rice_Bacterial_Blight\BACTERAILBLIGHT3_118_1ef2dda6acc8.jpg` |
| `BACTERAILBLIGHT3_181_f0df92146e3f.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_181_f0df92146e3f.jpg` |
| `BACTERAILBLIGHT3_182_f89ccccd61be.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_182_f89ccccd61be.jpg` |
| `BACTERAILBLIGHT3_184_b7350637c412.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_184_b7350637c412.jpg` |
| `BACTERAILBLIGHT3_186_90eef45bdcaa.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_186_90eef45bdcaa.jpg` |
| `BACTERAILBLIGHT3_180_e3f7cc4cbfbb.jpg` | Rice_Bacterial_Blight | test | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\test\Rice_Bacterial_Blight\BACTERAILBLIGHT3_180_e3f7cc4cbfbb.jpg` |
| `BACTERAILBLIGHT3_187_c1710492a727.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_187_c1710492a727.jpg` |
| `BACTERAILBLIGHT3_171_5e46971eb0ee.jpg` | Rice_Bacterial_Blight | test | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\test\Rice_Bacterial_Blight\BACTERAILBLIGHT3_171_5e46971eb0ee.jpg` |
| `BB_14_a12e2f76771a.jpg` | Rice_Bacterial_Blight | test | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\test\Rice_Bacterial_Blight\BB_14_a12e2f76771a.jpg` |
| `BACTERAILBLIGHT3_193_ed6765c145b9.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_193_ed6765c145b9.jpg` |
| `BB_16_02cda0f8277c.jpg` | Rice_Bacterial_Blight | validation | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\validation\Rice_Bacterial_Blight\BB_16_02cda0f8277c.jpg` |
| `BACTERAILBLIGHT3_197_bc731940eb13.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_197_bc731940eb13.jpg` |
| `BACTERAILBLIGHT3_201_c0ff84a6330c.jpg` | Rice_Bacterial_Blight | train | train | Within-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\train\Rice_Bacterial_Blight\BACTERAILBLIGHT3_201_c0ff84a6330c.jpg` |
| `BACTERAILBLIGHT3_249_3b846ac150d7.jpg` | Rice_Bacterial_Blight | test | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\test\Rice_Bacterial_Blight\BACTERAILBLIGHT3_249_3b846ac150d7.jpg` |
| `BACTERAILBLIGHT3_250_781cd211841f.jpg` | Rice_Bacterial_Blight | test | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\test\Rice_Bacterial_Blight\BACTERAILBLIGHT3_250_781cd211841f.jpg` |
| `BB_19_8b237921d2d1.jpg` | Rice_Bacterial_Blight | validation | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\validation\Rice_Bacterial_Blight\BB_19_8b237921d2d1.jpg` |
| `BACTERAILBLIGHT3_252_534ddf7fa49f.jpg` | Rice_Bacterial_Blight | test | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\test\Rice_Bacterial_Blight\BACTERAILBLIGHT3_252_534ddf7fa49f.jpg` |
| `BB_20_74571fa4cc65.jpg` | Rice_Bacterial_Blight | test | train | Cross-split duplicate | `c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\quarantine_duplicates\test\Rice_Bacterial_Blight\BB_20_74571fa4cc65.jpg` |