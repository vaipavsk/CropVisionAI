"""
EfficientNet-B0 37-Class Training & Evaluation Script for CropVisionAI.
Trains a candidate 37-class crop disease classifier on augmented training set.
Evaluates strictly on clean, un-augmented validation and test splits.
Does NOT modify production configuration or deploy candidate weights.
"""

import os
import sys
import json
import time
import random
import argparse
import numpy as np
from pathlib import Path
from PIL import Image

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights

# Optimize CPU multithreading
torch.set_num_threads(os.cpu_count() or 4)

def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

class CropDataset(Dataset):
    def __init__(self, samples, transform=None):
        self.samples = samples
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        with Image.open(img_path) as img:
            if img.mode != 'RGB':
                img = img.convert('RGB')
            if self.transform:
                img_tensor = self.transform(img)
            return img_tensor, label

def load_split_samples(split_dir, class_to_idx):
    samples = []
    split_path = Path(split_dir)
    for class_name, idx in class_to_idx.items():
        cdir = split_path / class_name
        if not cdir.exists():
            continue
        for img_path in cdir.glob('*'):
            if img_path.is_file():
                samples.append((str(img_path), idx))
    return samples

def compute_metrics_numpy(targets, preds, num_classes, eps=1e-12):
    targets = np.array(targets, dtype=np.int64)
    preds = np.array(preds, dtype=np.int64)
    
    total_samples = len(targets)
    acc = float(np.sum(preds == targets) / total_samples) if total_samples > 0 else 0.0
    
    cm = np.zeros((num_classes, num_classes), dtype=np.int64)
    for t, p in zip(targets, preds):
        if 0 <= t < num_classes and 0 <= p < num_classes:
            cm[t, p] += 1
            
    per_class_p = np.zeros(num_classes, dtype=np.float64)
    per_class_r = np.zeros(num_classes, dtype=np.float64)
    per_class_f1 = np.zeros(num_classes, dtype=np.float64)
    per_class_supp = np.zeros(num_classes, dtype=np.int64)
    
    for i in range(num_classes):
        tp = cm[i, i]
        fp = np.sum(cm[:, i]) - tp
        fn = np.sum(cm[i, :]) - tp
        support = np.sum(cm[i, :])
        
        prec = tp / (tp + fp + eps)
        rec = tp / (tp + fn + eps)
        f1 = (2 * prec * rec) / (prec + rec + eps)
        
        per_class_p[i] = prec
        per_class_r[i] = rec
        per_class_f1[i] = f1
        per_class_supp[i] = support
        
    macro_p = float(np.mean(per_class_p))
    macro_r = float(np.mean(per_class_r))
    macro_f1 = float(np.mean(per_class_f1))
    
    total_supp = np.sum(per_class_supp)
    if total_supp > 0:
        weighted_p = float(np.sum(per_class_p * per_class_supp) / total_supp)
        weighted_r = float(np.sum(per_class_r * per_class_supp) / total_supp)
        weighted_f1 = float(np.sum(per_class_f1 * per_class_supp) / total_supp)
    else:
        weighted_p = weighted_r = weighted_f1 = 0.0

    return {
        'accuracy': acc,
        'macro_precision': macro_p,
        'macro_recall': macro_r,
        'macro_f1': macro_f1,
        'weighted_precision': weighted_p,
        'weighted_recall': weighted_r,
        'weighted_f1': weighted_f1,
        'per_class_precision': per_class_p.tolist(),
        'per_class_recall': per_class_r.tolist(),
        'per_class_f1': per_class_f1.tolist(),
        'per_class_support': per_class_supp.tolist(),
        'confusion_matrix': cm.tolist()
    }

def evaluate_model(model, dataloader, device, num_classes):
    model.eval()
    all_preds = []
    all_targets = []
    total_loss = 0.0
    criterion = nn.CrossEntropyLoss()

    with torch.no_grad():
        for inputs, targets in dataloader:
            inputs, targets = inputs.to(device), targets.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            total_loss += loss.item() * inputs.size(0)
            
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_targets.extend(targets.cpu().numpy())

    avg_loss = total_loss / len(dataloader.dataset)
    metrics = compute_metrics_numpy(all_targets, all_preds, num_classes)
    metrics['loss'] = avg_loss
    metrics['predictions'] = all_preds
    metrics['targets'] = all_targets
    return metrics

def train_and_evaluate(dataset_dir, output_dir, epochs=5, batch_size=64, lr=1e-3, seed=42):
    set_seed(seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using compute device: {device} (CPU threads: {torch.get_num_threads()})", flush=True)

    dataset_path = Path(dataset_dir)
    train_dir = dataset_path / "train"
    val_dir = dataset_path / "validation"
    test_dir = dataset_path / "test"

    # 1. Discover 37 classes
    classes = sorted([d.name for d in train_dir.iterdir() if d.is_dir()])
    num_classes = len(classes)
    assert num_classes == 37, f"Expected 37 classes, found {num_classes}"
    class_to_idx = {c: i for i, c in enumerate(classes)}

    print(f"Discovered {num_classes} agricultural classes.", flush=True)

    # Save class mapping
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    mapping_file = out_path / "class_mapping.json"
    with open(mapping_file, "w") as f:
        json.dump(class_to_idx, f, indent=2)
    print(f"Class mapping saved to: {mapping_file}", flush=True)

    # 2. Data transforms
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    eval_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # 3. Load Datasets
    train_samples = load_split_samples(train_dir, class_to_idx)
    val_samples = load_split_samples(val_dir, class_to_idx)
    test_samples = load_split_samples(test_dir, class_to_idx)

    print(f"Loaded samples -> Train: {len(train_samples)}, Val: {len(val_samples)}, Test: {len(test_samples)}", flush=True)

    train_loader = DataLoader(CropDataset(train_samples, train_transform), batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(CropDataset(val_samples, eval_transform), batch_size=batch_size, shuffle=False, num_workers=0)
    test_loader = DataLoader(CropDataset(test_samples, eval_transform), batch_size=batch_size, shuffle=False, num_workers=0)

    # 4. Construct Model (Transfer Learning: Fine-tuning top layers & classifier head)
    print("Constructing EfficientNet-B0 transfer learning model with 37-class output head...", flush=True)
    weights = EfficientNet_B0_Weights.DEFAULT
    model = efficientnet_b0(weights=weights)
    
    # Freeze early layers for fast CPU training
    for param in model.features[:-2].parameters():
        param.requires_grad = False
        
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    model.to(device)

    # 5. Evaluate Baseline (Initial Classifier Head on Test Set)
    print("\n--- Evaluating Baseline (Initial Random Classifier Head) on Real Test Set ---", flush=True)
    baseline_metrics = evaluate_model(model, test_loader, device, num_classes)
    print(f"Baseline Test Accuracy: {baseline_metrics['accuracy']*100:.2f}%, Macro F1: {baseline_metrics['macro_f1']:.4f}", flush=True)

    # 6. Training setup
    trainable_params = [p for p in model.parameters() if p.requires_grad]
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = torch.optim.AdamW(trainable_params, lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)

    candidate_ckpt_path = out_path / "efficientnet_b0_37class_candidate.pth"
    best_val_f1 = 0.0
    patience = 4
    patience_counter = 0

    print("\n=== STARTING EFFICIENTNET-B0 TRAINING ===", flush=True)
    start_time = time.time()
    
    epoch_logs = []
    total_batches = len(train_loader)

    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        ep_start = time.time()

        for step, (inputs, targets) in enumerate(train_loader, 1):
            inputs, targets = inputs.to(device), targets.to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            _, preds = torch.max(outputs, 1)
            correct += preds.eq(targets).sum().item()
            total += targets.size(0)

            if step % 200 == 0 or step == total_batches:
                print(f"  [Epoch {epoch}/{epochs}] Batch {step}/{total_batches} - Loss: {running_loss/total:.4f} Acc: {correct/total*100:.2f}%", flush=True)

        scheduler.step()

        train_loss = running_loss / total
        train_acc = correct / total

        # Validation
        val_metrics = evaluate_model(model, val_loader, device, num_classes)

        val_loss = val_metrics['loss']
        val_acc = val_metrics['accuracy']
        val_f1 = val_metrics['macro_f1']
        ep_dur = time.time() - ep_start

        print(f"Epoch {epoch:02d}/{epochs:02d} ({ep_dur/60:.1f}m) | Train Loss: {train_loss:.4f} Acc: {train_acc*100:.2f}% | Val Loss: {val_loss:.4f} Acc: {val_acc*100:.2f}% F1: {val_f1:.4f}", flush=True)

        epoch_logs.append({
            'epoch': epoch,
            'train_loss': train_loss,
            'train_acc': train_acc,
            'val_loss': val_loss,
            'val_acc': val_acc,
            'val_f1': val_f1
        })

        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            torch.save(model.state_dict(), candidate_ckpt_path)
            print(f"  [SAVED CHECKPOINT] New best Val F1: {val_f1:.4f} -> {candidate_ckpt_path.name}", flush=True)
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"Early stopping triggered after {epoch} epochs.", flush=True)
                break

    total_training_time = time.time() - start_time
    print(f"\nTraining Completed in {total_training_time/60:.2f} minutes.", flush=True)

    # 7. Evaluate Best Candidate Model on Real Test Set
    print("\n=== EVALUATING CANDIDATE MODEL ON REAL UNSEEN TEST SET ===", flush=True)
    model.load_state_dict(torch.load(candidate_ckpt_path, map_location=device))
    test_metrics = evaluate_model(model, test_loader, device, num_classes)

    print(f"\nCandidate Model Real Test Performance:")
    print(f"  - Test Accuracy: {test_metrics['accuracy']*100:.2f}%")
    print(f"  - Macro Precision: {test_metrics['macro_precision']:.4f}")
    print(f"  - Macro Recall: {test_metrics['macro_recall']:.4f}")
    print(f"  - Macro F1-Score: {test_metrics['macro_f1']:.4f}")
    print(f"  - Weighted F1-Score: {test_metrics['weighted_f1']:.4f}", flush=True)

    # Class performance breakdown
    class_perf = []
    for i, c_name in enumerate(classes):
        class_perf.append({
            'class_name': c_name,
            'precision': test_metrics['per_class_precision'][i],
            'recall': test_metrics['per_class_recall'][i],
            'f1': test_metrics['per_class_f1'][i],
            'support': test_metrics['per_class_support'][i]
        })

    # Sort classes by F1
    sorted_perf = sorted(class_perf, key=lambda x: x['f1'], reverse=True)
    top_5 = sorted_perf[:5]
    bottom_5 = sorted_perf[-5:]

    print("\nTop 5 Strongest Classes:", flush=True)
    for c in top_5:
        print(f"  - {c['class_name']}: F1={c['f1']:.4f}, Precision={c['precision']:.4f}, Recall={c['recall']:.4f}", flush=True)

    print("\nTop 5 Weakest Classes:", flush=True)
    for c in bottom_5:
        print(f"  - {c['class_name']}: F1={c['f1']:.4f}, Precision={c['precision']:.4f}, Recall={c['recall']:.4f}", flush=True)

    # Save metrics JSON & Markdown report
    report_dict = {
        'training_time_seconds': total_training_time,
        'baseline_test_metrics': {
            'accuracy': baseline_metrics['accuracy'],
            'macro_f1': baseline_metrics['macro_f1']
        },
        'candidate_test_metrics': {
            'accuracy': test_metrics['accuracy'],
            'macro_precision': test_metrics['macro_precision'],
            'macro_recall': test_metrics['macro_recall'],
            'macro_f1': test_metrics['macro_f1'],
            'weighted_f1': test_metrics['weighted_f1']
        },
        'per_class_metrics': class_perf,
        'epoch_logs': epoch_logs,
        'candidate_model_path': str(candidate_ckpt_path)
    }

    metrics_json_path = out_path / "model_evaluation_metrics.json"
    with open(metrics_json_path, "w") as f:
        json.dump(report_dict, f, indent=2)

    cm_json_path = out_path / "confusion_matrix.json"
    with open(cm_json_path, "w") as f:
        json.dump({'classes': classes, 'matrix': test_metrics['confusion_matrix']}, f, indent=2)

    # Markdown Report
    md_lines = [
        "# EfficientNet-B0 37-Class Candidate Model Evaluation Report",
        "",
        f"**Date:** 2026-08-26",
        f"**Candidate Model Checkpoint:** `{candidate_ckpt_path}`",
        f"**Class Mapping:** `{mapping_file}`",
        f"**Training Set Size:** {len(train_samples)} (43,604 real + 15,096 synthetic)",
        f"**Validation Set Size:** {len(val_samples)} (100% real unseen)",
        f"**Test Set Size:** {len(test_samples)} (100% real unseen)",
        f"**Training Time:** {total_training_time/60:.2f} minutes",
        "",
        "## Real Unseen Test Set Metrics",
        "",
        "| Model Variant | Test Accuracy | Macro Precision | Macro Recall | Macro F1-Score | Weighted F1-Score |",
        "| :--- | ---: | ---: | ---: | ---: | ---: |",
        f"| **Baseline (Initial Random Classifier Head)** | {baseline_metrics['accuracy']*100:.2f}% | {baseline_metrics['macro_precision']:.4f} | {baseline_metrics['macro_recall']:.4f} | {baseline_metrics['macro_f1']:.4f} | {baseline_metrics['weighted_f1']:.4f} |",
        f"| **Candidate Model (37-Class Fine-Tuned)** | **{test_metrics['accuracy']*100:.2f}%** | **{test_metrics['macro_precision']:.4f}** | **{test_metrics['macro_recall']:.4f}** | **{test_metrics['macro_f1']:.4f}** | **{test_metrics['weighted_f1']:.4f}** |",
        "",
        "## Top 5 Strongest Classes",
        ""
    ]
    for c in top_5:
        md_lines.append(f"- **{c['class_name']}**: F1 = **{c['f1']:.4f}** (Precision = {c['precision']:.4f}, Recall = {c['recall']:.4f}, Support = {c['support']})")
        
    md_lines.extend(["", "## Top 5 Weakest Classes", ""])
    for c in bottom_5:
        md_lines.append(f"- **{c['class_name']}**: F1 = **{c['f1']:.4f}** (Precision = {c['precision']:.4f}, Recall = {c['recall']:.4f}, Support = {c['support']})")

    md_lines.extend([
        "",
        "## Complete 37-Class Performance Breakdown",
        "",
        "| Class Name | Test Support | Precision | Recall | F1-Score |",
        "| :--- | ---: | ---: | ---: | ---: |"
    ])
    for c in class_perf:
        md_lines.append(f"| **{c['class_name']}** | {c['support']} | {c['precision']:.4f} | {c['recall']:.4f} | {c['f1']:.4f} |")

    report_md_file1 = Path(r"c:\Users\vipin\OneDrive\Documents\CropVisionAI\reports\model_training_report.md")
    report_md_file2 = Path(r"c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\reports\model_training_report.md")
    report_md_file1.parent.mkdir(parents=True, exist_ok=True)
    report_md_file2.parent.mkdir(parents=True, exist_ok=True)

    report_md_content = "\n".join(md_lines)
    report_md_file1.write_text(report_md_content, encoding="utf-8")
    report_md_file2.write_text(report_md_content, encoding="utf-8")

    print(f"\nSaved evaluation reports to:\n  - {metrics_json_path}\n  - {cm_json_path}\n  - {report_md_file1}", flush=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Train EfficientNet-B0 candidate model on CropVisionAI 37-class dataset.")
    parser.add_argument("--dataset-dir", type=str, default=r"c:\Users\vipin\OneDrive\Documents\CropVisionAI\datasets\classification")
    parser.add_argument("--output-dir", type=str, default=r"c:\Users\vipin\OneDrive\Documents\CropVisionAI\ai-service\trained_models")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    train_and_evaluate(
        dataset_dir=args.dataset_dir,
        output_dir=args.output_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        seed=args.seed
    )
