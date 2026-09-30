"""
Augmentation script for CropVisionAI agricultural classification dataset.
Applies ONLY local image processing transformations to the training set.
NEVER modifies validation or test sets.
"""

import os
import sys
import argparse
import random
import numpy as np
from pathlib import Path
from collections import defaultdict
from PIL import Image, ImageEnhance, ImageFilter

def apply_local_augmentation(pil_img, seed_val):
    """
    Applies realistic, local farmer-captured image variations:
    - rotation ±15°
    - horizontal flip
    - brightness variation (0.8 - 1.2)
    - contrast variation (0.8 - 1.2)
    - saturation variation (0.85 - 1.15)
    - mild Gaussian blur or ISO noise
    - small crop/zoom (up to 10%)
    """
    # Ensure RGB
    if pil_img.mode != 'RGB':
        pil_img = pil_img.convert('RGB')
        
    random.seed(seed_val)
    np.random.seed(seed_val % (2**32))
    
    # 1. Random Horizontal Flip (50% chance)
    if random.random() > 0.5:
        pil_img = pil_img.transpose(Image.FLIP_LEFT_RIGHT)
        
    # 2. Random Rotation (±15 degrees)
    angle = random.uniform(-15.0, 15.0)
    pil_img = pil_img.rotate(angle, resample=Image.BICUBIC, expand=False)
    
    # 3. Random Crop / Zoom (0 - 10%)
    w, h = pil_img.size
    crop_pct = random.uniform(0.0, 0.10)
    crop_w = int(w * (1.0 - crop_pct))
    crop_h = int(h * (1.0 - crop_pct))
    left = random.randint(0, w - crop_w)
    top = random.randint(0, h - crop_h)
    pil_img = pil_img.crop((left, top, left + crop_w, top + crop_h)).resize((w, h), Image.BICUBIC)
    
    # 4. Brightness variation (±20%)
    brightness_factor = random.uniform(0.80, 1.20)
    pil_img = ImageEnhance.Brightness(pil_img).enhance(brightness_factor)
    
    # 5. Contrast variation (±20%)
    contrast_factor = random.uniform(0.80, 1.20)
    pil_img = ImageEnhance.Contrast(pil_img).enhance(contrast_factor)
    
    # 6. Saturation variation (±15%)
    color_factor = random.uniform(0.85, 1.15)
    pil_img = ImageEnhance.Color(pil_img).enhance(color_factor)
    
    # 7. Mild Blur (20% chance)
    if random.random() < 0.20:
        pil_img = pil_img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.5, 1.2)))
        
    # 8. Mild Sensor Noise (20% chance)
    if random.random() < 0.20:
        img_np = np.array(pil_img, dtype=np.float32)
        noise = np.random.normal(0, random.uniform(3.0, 8.0), img_np.shape)
        img_np = np.clip(img_np + noise, 0, 255).astype(np.uint8)
        pil_img = Image.fromarray(img_np)
        
    return pil_img

def run_augmentation(dataset_dir, target_count, dry_run=False, seed=42):
    train_dir = Path(dataset_dir) / "train"
    if not train_dir.exists():
        print(f"ERROR: Training directory not found at: {train_dir}")
        sys.exit(1)
        
    print(f"=== CROPVISIONAI DATASET AUGMENTATION SCRIPT ===")
    print(f"Dataset Train Path: {train_dir}")
    print(f"Target Count per Class: {target_count}")
    print(f"Dry Run Mode: {dry_run}")
    print(f"Seed: {seed}\n")
    
    class_dirs = sorted([d for d in train_dir.iterdir() if d.is_dir()])
    
    total_existing_train = 0
    total_to_generate = 0
    
    plan = []
    
    for c_dir in class_dirs:
        class_name = c_dir.name
        existing_files = [f for f in c_dir.glob("*") if f.is_file() and not f.name.startswith("synth_")]
        count = len(existing_files)
        total_existing_train += count
        
        needed = max(0, target_count - count)
        total_to_generate += needed
        
        plan.append({
            "class_name": class_name,
            "existing_real": count,
            "target": target_count,
            "needed_aug": needed,
            "final_train_count": count + needed,
            "files": existing_files
        })
        
    print(f"{'Class Name':<35} | {'Existing Real':<13} | {'Target':<7} | {'Needed Aug':<10} | {'Final Count':<11}")
    print("-" * 85)
    for p in plan:
        print(f"{p['class_name']:<35} | {p['existing_real']:<13} | {p['target']:<7} | {p['needed_aug']:<10} | {p['final_train_count']:<11}")
    print("-" * 85)
    print(f"{'TOTAL':<35} | {total_existing_train:<13} | {'-':<7} | {total_to_generate:<10} | {total_existing_train + total_to_generate:<11}\n")
    
    if dry_run:
        print("[DRY RUN COMPLETE] Zero files created or modified on disk.")
        print(f"SUMMARY: Would generate {total_to_generate} synthetic images across {len(plan)} classes.")
        return plan
        
    print("=== EXECUTING SYNTHETIC IMAGE GENERATION ===")
    generated_count = 0
    verification_failures = 0
    
    per_class_results = []

    for p in plan:
        needed = p['needed_aug']
        if needed == 0:
            per_class_results.append((p['class_name'], p['existing_real'], 0, p['existing_real']))
            continue
            
        class_dir = train_dir / p['class_name']
        real_files = p['files']
        
        print(f"Generating {needed} augmented images for {p['class_name']}...", flush=True)
        class_gen = 0
        
        for i in range(needed):
            src_file = real_files[i % len(real_files)]
            out_filename = f"synth_{i+1:04d}_{src_file.stem}.jpg"
            out_path = class_dir / out_filename
            
            aug_seed = seed + hash(p['class_name']) % 10000 + i * 37
            
            try:
                with Image.open(src_file) as img:
                    aug_img = apply_local_augmentation(img, aug_seed)
                    aug_img.save(out_path, format="JPEG", quality=95)
                    
                # Verification step
                with Image.open(out_path) as test_open:
                    test_open.verify()
                generated_count += 1
                class_gen += 1
            except Exception as e:
                print(f"  [ERROR] Failed generating/verifying {out_path}: {e}")
                verification_failures += 1
                
        per_class_results.append((p['class_name'], p['existing_real'], class_gen, p['existing_real'] + class_gen))

    print(f"\nGeneration Finished: Successfully created {generated_count} images ({verification_failures} errors).", flush=True)
    
    # Save Report
    report_lines = [
        "# Dataset Classification Augmentation Report",
        "",
        f"**Date:** 2026-08-26",
        f"**Dataset Train Path:** `{train_dir}`",
        f"**Target Count Per Class:** {target_count}",
        f"**Total Real Training Images:** {total_existing_train}",
        f"**Total Synthetic Images Generated:** {generated_count}",
        f"**Final Total Training Images:** {total_existing_train + generated_count}",
        f"**Verification Failures:** {verification_failures}",
        "",
        "## Per-Class Synthetic Generation Breakdown",
        "",
        "| Class Name | Real Original | Synthetic Generated (`synth_`) | Total Training Images |",
        "| :--- | ---: | ---: | ---: |"
    ]
    
    for r in per_class_results:
        report_lines.append(f"| **{r[0]}** | {r[1]} | {r[2]} | {r[3]} |")
        
    report_lines.append(f"| **TOTAL** | **{total_existing_train}** | **{generated_count}** | **{total_existing_train + generated_count}** |")
    
    report_path1 = Path(r"c:\Users\vipin\OneDrive\Documents\CropVisionAI\reports\augmentation_report.md")
    report_path2 = Path(r"c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\reports\augmentation_report.md")
    
    report_path1.parent.mkdir(parents=True, exist_ok=True)
    report_path2.parent.mkdir(parents=True, exist_ok=True)
    
    report_content = "\n".join(report_lines)
    report_path1.write_text(report_content, encoding="utf-8")
    report_path2.write_text(report_content, encoding="utf-8")
    print(f"Augmentation report written to: {report_path1} and {report_path2}", flush=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Augment training dataset locally for CropVisionAI.")
    parser.add_argument("--dataset-dir", type=str, default=r"c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\classification")
    parser.add_argument("--target-count", type=int, default=1200)
    parser.add_argument("--dry-run", action="store_true", help="Perform a dry run without saving images.")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    
    run_augmentation(
        dataset_dir=args.dataset_dir,
        target_count=args.target_count,
        dry_run=args.dry_run,
        seed=args.seed
    )
