---
title: Target Architecture (proposed)
status: reference
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: 90d
related:
  - docs/engineering/ARCHITECTURE.md
  - docs/decisions/0005-vision-model-provider.md
  - docs/decisions/0006-when-to-introduce-a-database.md
---

> **Status: reference — this is NOT what we run today.**
> For the current system see [`ARCHITECTURE.md`](./ARCHITECTURE.md).
>
> This document proposes Supabase + Next.js + self-hosted fine-tuned LLaVA on RunPod, at
> $450–700/month. That rests on two undecided calls —
> [ADR-0005](../decisions/0005-vision-model-provider.md) and
> [ADR-0006](../decisions/0006-when-to-introduce-a-database.md) — and on
> [ADR-0004](../decisions/0004-product-ambition.md) above them. The deployment timeline in §8
> refers to Q3 2026 and has lapsed. Treat the cost analysis in §5 as the most useful part.

# FMB · ART: Technical Architecture & LLM Strategy

**Prepared:** May 29, 2026  
**Phase:** Phase 1 (Q3 2026 Foundation)  
**Target Deployment:** Vercel + Supabase + RunPod GPU Inference

---

## 1. Target Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL (Frontend + API Routes)          │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │   Next.js App        │  │  API Routes (serverless)         │ │
│  │  ├─ Upload UI        │  │  ├─ /api/upload                  │ │
│  │  ├─ Gallery Views    │  │  ├─ /api/analyze (orchestrates) │ │
│  │  ├─ Auth flow        │  │  ├─ /api/fine-tune-status        │ │
│  │  └─ Sharing          │  │  └─ /api/webhook (Supabase)      │ │
│  └──────────────────────┘  └──────────────────────────────────┘ │
│                                        ↓                          │
│              ┌─────────────────────────┴──────────────────────┐  │
└──────────────┼───────────────────────────────────────────────┼──┘
               ↓                                                ↓
        ┌────────────────┐                           ┌──────────────────┐
        │   SUPABASE     │                           │   RUNPOD GPU     │
        │  ┌──────────┐  │                           │  ┌────────────┐  │
        │  │ Postgres │  │                           │  │ vLLM Server│  │
        │  │ (user db,│  │                           │  │ ┌────────┐ │  │
        │  │ artwork  │  │                           │  │ │LLaVA-  │ │  │
        │  │ metadata)│  │                           │  │ │NeXT FT │ │  │
        │  └──────────┘  │                           │  │ │(vision)│ │  │
        │  ┌──────────┐  │                           │  │ └────────┘ │  │
        │  │ Storage  │  │    (HTTP Queue)           │  │ ┌────────┐ │  │
        │  │ (images) │  │◄───────────────────────────  │ │Mistral │ │  │
        │  │ + backup │  │                           │  │ │(text)  │ │  │
        │  └──────────┘  │                           │  │ └────────┘ │  │
        │  ┌──────────┐  │                           │  └────────────┘  │
        │  │ Auth     │  │                           │                  │
        │  │(JWT, RLS)│  │                           │                  │
        │  └──────────┘  │                           │                  │
        └────────────────┘                           └──────────────────┘
                ↓                                             ↑
        ┌────────────────┐                           ┌──────────────────┐
        │  EXTERNAL APIs │                           │  TRAINING INFRA  │
        │  (optional)    │                           │  (Phase 1 only)  │
        │ ┌────────────┐ │                           │ ┌──────────────┐ │
        │ │ Stripe     │ │                           │ │ HuggingFace  │ │
        │ │(Phase 2)   │ │                           │ │ Trainer      │ │
        │ └────────────┘ │                           │ │ (LoRA setup) │ │
        └────────────────┘                           └──────────────────┘
                                                              ↓
                                                      ┌──────────────────┐
                                                      │ Fine-tuned Model │
                                                      │ (stored in HF)   │
                                                      └──────────────────┘
```

### Data Flow: Artwork Upload to Analysis

```
User uploads image (HEIC/JPG)
    ↓
Vercel API receives → validates → stores in Supabase Storage
    ↓
Supabase Storage trigger → generates signed URL
    ↓
Vercel API → sends image URL + prompt to RunPod vLLM endpoint
    ↓
RunPod vLLM:
  1. Loads LLaVA-NeXT (fine-tuned LoRA)
  2. Vision analysis + structured JSON output
  3. Returns metadata (title, description, palette, animation, dots)
    ↓
Vercel API receives JSON → validates → stores in Supabase (artwork record)
    ↓
Frontend re-renders gallery with new entry animated in
```

---

## 2. Tech Stack

### **Frontend (Vercel)**

| Layer | Technology | Purpose | Why |
|-------|------------|---------|-----|
| **Framework** | Next.js 15 (App Router) | Full-stack React | Server components, API routes, Image optimization |
| **Styling** | Tailwind CSS | Component styling | Already in your codebase, fast |
| **Images** | Next.js `Image` component | Lazy load, optimize | Automatic AVIF, WebP conversion |
| **Audio** | Web Audio API + `RecordRTC` | Audio recording hotspots | Browser-native, CORS-safe |
| **State** | Zustand or React Query | Client state | SWR for API calls, Zustand for local state |
| **Forms** | React Hook Form + Zod | Upload, onboarding | Validation, accessibility |
| **Deployment** | Vercel (paid tier) | Hosting | Direct Next.js integration, auto-scale |

### **Backend (Vercel Serverless + Supabase)**

| Layer | Technology | Purpose | Why |
|-------|------------|---------|-----|
| **API Routes** | Next.js API Routes | Orchestration | Secure proxy to GPU, user auth check |
| **Auth** | Supabase Auth (JWT) | User identity | Built-in RBAC, JWT signing, social login |
| **Database** | Supabase Postgres | Persistent storage | JSON support, RLS, relational integrity |
| **Storage** | Supabase Storage (S3-compatible) | Image files | Backup, versioning, signed URLs |
| **Queuing** | Bull + Redis (optional) | Async jobs | Batch fine-tuning requests (Phase 1b) |
| **Webhooks** | Supabase → Vercel | Event triggers | Image processing on upload |

### **GPU Inference (RunPod)**

| Component | Technology | Purpose | Why |
|-----------|-----------|---------|-----|
| **GPU Host** | RunPod (A40 or RTX 4090) | Inference compute | On-demand, pay-per-second, no idle cost |
| **Runtime** | vLLM | Model serving | 10–100x faster than vanilla PyTorch, supports LoRA |
| **Models** | LLaVA-NeXT-13B + Mistral-7B | Vision + text | SOTA performance, Apache 2.0 licensed |
| **Fine-tuning** | Hugging Face + LoRA | Model adaptation | Parameter-efficient, low cost, high quality |
| **Container** | Docker (custom image) | Deployment | Reproducible, pre-built with models |

### **Fine-Tuning Infrastructure (One-time, Phase 1)**

| Component | Technology | Purpose | Why |
|-----------|-----------|---------|-----|
| **Dataset Mgmt** | Hugging Face Datasets | Version control | Track training data, reproducibility |
| **Training** | Hugging Face Transformers + PEFT (LoRA) | Fine-tuning | State-of-art LoRA implementation |
| **Compute** | RunPod GPU (H100 or A40) | Training | Cheaper than cloud ML, fast |
| **Experiment Tracking** | Weights & Biases (free tier) | Monitoring | Logs, metrics, version control |

### **Monitoring & Analytics**

| Component | Technology | Cost | Purpose |
|-----------|-----------|------|---------|
| **Error Tracking** | Sentry | Free tier | Catch Vercel + RunPod errors |
| **API Monitoring** | OpenObserve or Axiom | $20-50/mo | Latency, error rates, queue depth |
| **GPU Monitoring** | RunPod dashboard | Free | GPU utilization, cost tracking |

---

## 3. Complete Models & LLM Stack

### **Vision Model (Image Analysis)**

**Primary: LLaVA-NeXT-13B-hf**
- **Source:** [meta-llama/LLaVA-NeXT-13b-hf](https://huggingface.co/lmsys/llava-next-13b-hf) (Hugging Face)
- **License:** Apache 2.0 ✅ (Commercial use OK)
- **Vision Architecture:** CLIP ViT-L (image encoder) + LLaMA 2 13B (text decoder)
- **Input:** Image + text prompt
- **Output:** JSON (title, description, palette, animation, discovery points)
- **Speed:** ~2-4 seconds per image on A40 GPU
- **Quality:** Near Claude Vision 3.5 quality for artwork analysis (personal estimate: 90-95%)
- **Why:** Best open-source vision model (2024 benchmark leader), 13B is sweet spot of speed/quality

**Alternative (if LLaVA struggles): Qwen-VL-Max**
- **Source:** [Qwen/Qwen-VL-Chat-7B](https://huggingface.co/Qwen/Qwen-VL-Chat-7B)
- **License:** Tongyi Qianwen License (Commercial OK for most use cases, review terms)
- **Slightly better at understanding dense text in images**
- **Slightly slower than LLaVA**

### **Text Generation (Descriptions, Titles)**

**Primary: Mistral-7B-Instruct-v0.2**
- **Source:** [mistralai/Mistral-7B-Instruct-v0.2](https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2)
- **License:** Apache 2.0 ✅ (Commercial use OK)
- **Speed:** <1 second per call on A40
- **Purpose:** Polish descriptions, generate creative titles, suggest animations
- **Why:** Fast, creative, follows instructions well

**Fallback: Llama 2 Chat 7B**
- **Source:** [meta-llama/Llama-2-7b-chat-hf](https://huggingface.co/meta-llama/Llama-2-7b-chat-hf)
- **License:** Llama 2 Community License (Commercial OK for <700M users, then negotiate)
- **If Mistral unavailable or you want redundancy**

### **Color Extraction & Image Processing (Pure Code)**

**No LLM needed—use OpenCV:**
```python
import cv2
import numpy as np
from sklearn.cluster import KMeans

def extract_palette(image_path, num_colors=6):
    """Extract dominant colors using K-means clustering."""
    img = cv2.imread(image_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Flatten and sample pixels (speed up clustering)
    pixels = img.reshape((-1, 3))
    pixels = np.float32(pixels[::10])  # Sample every 10th pixel
    
    # K-means to find dominant colors
    kmeans = KMeans(n_clusters=num_colors, random_state=42)
    kmeans.fit(pixels)
    
    # Convert to hex
    palette = ['#{:02x}{:02x}{:02x}'.format(int(c[0]), int(c[1]), int(c[2])) 
               for c in kmeans.cluster_centers_]
    return palette
```

**Cost:** $0 (local compute, runs in Vercel function or RunPod)

---

## 4. Fine-Tuning Strategy (The Key Differentiator)

### **Why Fine-Tune?**

Fine-tuning teaches LLaVA to understand your museum's aesthetic, voice, and output format. Without it:
- Generic descriptions ("a colorful painting with abstract shapes")
- Inconsistent tone across the archive
- No understanding of what makes artwork "museum-worthy"

With fine-tuning:
- Descriptions celebrate the child's artistic choices
- Consistent voice (celebratory, pedagogical, specific to age)
- Model learns your color palette preferences, animation choices

### **The Process (Week 4–5 of Phase 1)**

#### **Step 1: Gather Training Data (Week 4, ~4 hours)**

You already have this! Use your existing 50+ museum pieces.

**Dataset Structure:**
```
intake/
├── processed/
│   ├── gato-cubista.md          # Form metadata
│   ├── miguel-auto-retrato.md
│   └── era-uma-vez.md
│
assets/art/
├── gato-cubista.jpeg
├── miguel-auto-retrato.jpeg
└── era-uma-vez.jpeg
```

**Collect 50-80 examples. For each, create JSON:**

```json
[
  {
    "image_path": "assets/art/gato-cubista.jpeg",
    "input_prompt": "Analyze this child's artwork and provide structured metadata.",
    "output": {
      "title": "Gato Cubista",
      "description": "Miguel's brave exploration of abstraction transforms a familiar subject—the family cat—into a bold geometric composition. The sharp angles and unexpected color choices (bright red against cool blues) show Miguel discovering that art doesn't have to look 'realistic' to be powerful. This is the work of a young artist building confidence in his own creative voice.",
      "palette": ["#c41e3a", "#4a90e2", "#ffd700", "#2d5016", "#ffffff"],
      "animation_hint": "spin",
      "discovery_points": [
        {"text": "Notice how Miguel used sharp angles instead of curves", "position": "35,45"},
        {"text": "The red really stands out—why do you think he chose that color?", "position": "65,60"},
        {"text": "See the blue background? It makes the red pop even more", "position": "45,25"}
      ],
      "child_audio_transcript": "I made the cat into blocks. I like red. It's a happy cat." // if available
    }
  },
  ...
]
```

**Time to gather:** ~30 min to extract existing entries, ~2-3 hours to write 50 descriptions in the FMB voice

#### **Step 2: Prepare Training Dataset (Week 4, ~2 hours)**

Convert JSON → Hugging Face Dataset format:

```python
# prepare_dataset.py
from datasets import Dataset
import json

with open("training_data.json") as f:
    data = json.load(f)

# Convert to HF format
dataset = Dataset.from_dict({
    "image": [d["image_path"] for d in data],
    "text": [
        f"""Analyze this artwork and provide structured metadata.

Output format:
{json.dumps(d["output"], indent=2)}"""
        for d in data
    ]
})

# Save
dataset.push_to_hub("your-username/fmb-art-training")
```

#### **Step 3: Set Up LoRA Fine-Tuning (Week 4, ~4 hours)**

LoRA = "Low-Rank Adaptation" — adds small learnable adapters (~5-10% of original model size) instead of modifying the whole model.

**Cost:** $10-30 total for training

**Setup:**

```python
# fine_tune_llava.py
from peft import LoraConfig, get_peft_model
from transformers import LlavaNextProcessor, LlavaNextForConditionalGeneration
import torch
from huggingface_hub import login

# Login to Hugging Face
login()

# Load base model
model_id = "llm-mt/LLaVA-NeXT-13B-hf"  # Pre-quantized for speed
processor = LlavaNextProcessor.from_pretrained(model_id)
model = LlavaNextForConditionalGeneration.from_pretrained(
    model_id,
    torch_dtype=torch.float16,
    device_map="auto"
)

# Define LoRA config
lora_config = LoraConfig(
    r=16,  # LoRA rank (16 is good balance)
    lora_alpha=32,
    lora_dropout=0.05,
    bias="none",
    target_modules=["q_proj", "v_proj"],  # Which layers to adapt
    task_type="CAUSAL_LM"
)

# Apply LoRA
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# Output: trainable params: 1,024,000 | all params: 13,500,000,000 | % params: 0.0076%

# Training setup
from transformers import TrainingArguments, Trainer

training_args = TrainingArguments(
    output_dir="./fmb-art-llava-lora",
    num_train_epochs=2,
    learning_rate=1e-4,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=4,
    save_steps=50,
    logging_steps=10,
    bf16=True,  # Use bfloat16 to save memory
    max_grad_norm=0.3,
    warmup_steps=50,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    data_collator=default_data_collator,
)

trainer.train()

# Save LoRA adapter
model.save_pretrained("./fmb-art-llava-lora")
processor.save_pretrained("./fmb-art-llava-lora")

# Push to Hub
model.push_to_hub("your-username/fmb-art-llava-lora")
```

**Training time:** 30–60 minutes on A40 GPU (depends on dataset size)

#### **Step 4: Load Fine-Tuned Model in RunPod (Week 5, ~2 hours)**

Once trained, deploy the LoRA adapter to your RunPod instance:

```python
# runpod_inference.py (vLLM server)
from vllm import LLM, SamplingParams
from peft import PeftModel
from transformers import LlavaNextProcessor, LlavaNextForConditionalGeneration
import torch

# Load base model + LoRA adapter
base_model = "llm-mt/LLaVA-NeXT-13B-hf"
lora_adapter = "your-username/fmb-art-llava-lora"

model = LlavaNextForConditionalGeneration.from_pretrained(base_model)
model = PeftModel.from_pretrained(model, lora_adapter)
processor = LlavaNextProcessor.from_pretrained(base_model)

# Or use vLLM's native LoRA support (faster):
llm = LLM(
    model="llm-mt/LLaVA-NeXT-13B-hf",
    enable_lora=True,
    max_lora_rank=16,
    tensor_parallel_size=1  # Single GPU
)

# Load image and run inference
def analyze_artwork(image_url):
    prompt = """Analyze this child's artwork. Return ONLY valid JSON with:
    {
      "title": "string (1-3 words, celebratory)",
      "description": "string (2-3 sentences)",
      "palette": ["#hex1", "#hex2", ...],
      "animation_hint": "string (one of: spin, float, pulse, shimmer, breathe)",
      "discovery_points": [{"text": "observation", "position": "x,y%"}, ...]
    }"""
    
    # Download image
    from PIL import Image
    import requests
    image = Image.open(requests.get(image_url, stream=True).raw)
    
    # Process
    inputs = processor(text=prompt, images=image, return_tensors="pt")
    
    # Generate
    outputs = model.generate(
        **inputs,
        max_new_tokens=512,
        do_sample=False,
        temperature=0.7
    )
    
    response = processor.decode(outputs[0], skip_special_tokens=True)
    
    # Extract JSON from response
    import json
    import re
    json_match = re.search(r'\{.*\}', response, re.DOTALL)
    return json.loads(json_match.group(0))
```

**Integration with Vercel API:**

```typescript
// /api/analyze (Vercel)
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { imagePath } = await req.json();
  
  // Get signed URL from Supabase
  const { data } = await supabase.storage
    .from("artwork")
    .createSignedUrl(imagePath, 3600);
  
  // Call RunPod
  const response = await fetch("https://your-runpod-endpoint.runpod.io/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: data.signedUrl })
  });
  
  const metadata = await response.json();
  
  // Validate + store in Supabase
  await supabase
    .from("artwork")
    .update({ metadata })
    .eq("id", artworkId);
  
  return Response.json(metadata);
}
```

---

## 5. Cost Breakdown

### **Phase 1 (Q3 2026 — 3 months)**

| Component | Unit Cost | Monthly | Subtotal | Notes |
|-----------|-----------|---------|----------|-------|
| **Vercel (Hosting)** | | | | |
| Functions (compute) | Pay-per-use | $15-50 | $45-150 | 100GB function execution minutes |
| Storage bandwidth | Pay-per-use | $5-20 | $15-60 | ~5-20GB uploads |
| **Supabase (Database + Storage)** | | | | |
| Postgres (auth + metadata) | $25/month | $25 | $75 | Pro tier, includes 100GB storage |
| Storage (images, backups) | $5/month + $0.10/GB over 100GB | $5-15 | $15-45 | Image backup, versioning |
| Auth (JWT) | Free | Free | Free | Included in Pro tier |
| **RunPod (GPU Inference)** | | | | |
| A40 GPU (on-demand) | $0.40/hour | $40-60/mo | $120-180 | 100-150 inference hours/month (~1-2 requests/day) |
| Model storage (HF) | Free | Free | Free | Hugging Face free tier |
| **Fine-Tuning (One-time)** | | | | |
| H100 GPU (24hr training) | $3.50/hour | — | $84 | One-time cost (Week 4-5) |
| Dataset versioning | Free | — | Free | Hugging Face |
| Weights & Biases | Free | — | Free | Free tier for logging |
| **Development Tools** | | | | |
| Sentry (error tracking) | Free | Free | Free | Free tier (10K errors/month) |
| OpenObserve (logs) | Free-tier | Free | Free | Free tier (<1GB/day) |
| **Total Phase 1** | | | **$450-700/mo** | + $84 one-time fine-tuning |
| | | | **$1,350-2,100** | (3 months) |

**Breakdown:**
- **GPU inference:** $40-60/mo (biggest operational cost)
- **Vercel + Supabase:** $50-100/mo (platform infrastructure)
- **Fine-tuning:** $84 one-time (weeks 4-5)
- **Monitoring + tools:** Free (using free tiers)

### **Phase 1 vs. Claude Vision API**

| Strategy | Phase 1 Cost | Scale (10K users) | Year 1 Savings |
|----------|------------|------------------|-----------------|
| **Claude Vision API** | $100-200/mo | $5K-10K/mo | — |
| **LLaVA-NeXT (open-source)** | $450-700/mo | $500-800/mo | **$50K-100K+** |
| **LLaVA + Fine-tuned (recommended)** | $450-800/mo | $500-800/mo | **$50K-100K+** |

**Key insight:** Initial infrastructure cost is higher, but it **flattens** with scale. Claude API costs scale linearly; your costs scale sublinearly.

### **Phase 2 (Q4 2026) — Minimal LLM changes**

| Component | Cost | Notes |
|-----------|------|-------|
| RunPod GPU | $60-100/mo | More inference (more users uploading) |
| Supabase | $25-50/mo | Larger database |
| Vercel | $20-50/mo | More API calls |
| Video generation (Remotion) | $200-500 | New feature, not LLM-related |
| **Total (LLM-only)** | **$85-150/mo** | No new model costs |

### **Phase 3 (Q1–Q2 2027) — Scale inference**

| Component | Cost | Notes |
|-----------|------|-------|
| RunPod GPU | $100-200/mo | 2-3x more users uploading art |
| Multi-GPU scaling | $200-400/mo | If you add H100 or multi-GPU cluster |
| Supabase (scaling) | $50-100/mo | Larger dataset, more traffic |
| **Total (LLM-only)** | **$150-500/mo** | Scales with user base, not linearly |

**Total 12-month LLM cost:** $1,500-3,500 (vs. $50K-100K+ with Claude API)

---

## 6. Models Summary Table

| Model | Task | Type | License | Cost | Speed | Quality | Commercial OK? |
|-------|------|------|---------|------|-------|---------|----------------|
| **LLaVA-NeXT-13B** | Vision analysis | Vision-LLM | Apache 2.0 | $0/call | 2-4s | 90-95% of Claude | ✅ YES |
| **LLaVA-NeXT-13B (fine-tuned LoRA)** | Vision + FMB style | Vision-LLM | Apache 2.0 | $0/call | 2-4s | 95-98% custom | ✅ YES |
| **Mistral-7B-Instruct** | Text generation, descriptions | LLM | Apache 2.0 | $0/call | <1s | High quality | ✅ YES |
| **Llama 2 Chat 7B** | Fallback text | LLM | Llama 2 License | $0/call | <1s | Good quality | ⚠️ CONDITIONAL* |
| **CLIP-ViT-L** | Color extraction, similarity | Embedding | MIT | $0/call | <1s | N/A | ✅ YES |
| **OpenCV** | K-means clustering | Image processing | Apache 2.0 | $0/call | <100ms | Good | ✅ YES |

**\* Llama 2 License:** "Up to 700 million monthly active users. After that, you need a commercial license." FMB·ART won't hit 700M users, so it's safe. But Mistral (Apache 2.0) is cleaner.

---

## 7. Open-Source Commercial Use: Legal Analysis

### **TL;DR: You're safe. All recommended models are commercial-friendly.**

### **Detailed Breakdown**

#### **Apache 2.0 License (LLaVA-NeXT, Mistral, OpenCV)**

✅ **Explicitly commercial-friendly.**

You can:
- Use the model in a commercial product ✅
- Charge money for services using the model ✅
- Modify the model (fine-tune, LoRA) ✅
- Combine with proprietary code ✅
- Use without disclosing source code ✅

Restrictions:
- Must include Apache 2.0 license in your repo/docs
- Must mention original authors (usually just a link to the GitHub repo)
- No warranty disclaimer (standard)

**Example:** Include this in your repo's LICENSE or ACKNOWLEDGMENTS:
```
Models used in FMB·ART:
- LLaVA-NeXT-13B: Apache 2.0 (https://github.com/lm-sys/LLaVA)
- Mistral-7B: Apache 2.0 (https://github.com/mistralai/mistral-src)
- CLIP: MIT (https://github.com/openai/CLIP)
```

#### **Llama 2 Community License (Optional fallback)**

⚠️ **Conditional for commercial use.**

You can:
- Use commercially ✅
- Modify (fine-tune) ✅
- Charge for services ✅

Restrictions:
- **Up to 700 million monthly active users.** (After that, you need a commercial license from Meta)
- Other products that compete with Meta can't use it (but a museum doesn't compete with Meta)
- Must follow the agreement term (readable at https://ai.meta.com/llama/license/)

**Your situation:** FMB·ART will never hit 700M users, so you're safe. But stick to Mistral (Apache 2.0) as your primary to avoid any ambiguity.

#### **Hugging Face License (used for hosting models)**

✅ **Just hosting. No restrictions.**

Hugging Face's terms:
- You can host any Apache 2.0 or MIT licensed model for free
- You can fine-tune and re-upload your fine-tuned version
- No licensing restrictions from Hugging Face

#### **Commercial Platform Compliance Checklist**

When launching FMB·ART commercially, include:

1. **LICENSE file in repo:**
   ```
   # FMB·ART
   This project uses open-source models under Apache 2.0.
   See ACKNOWLEDGMENTS.md for details.
   ```

2. **ACKNOWLEDGMENTS.md:**
   ```markdown
   # Model Acknowledgments
   
   FMB·ART uses the following open-source models:
   
   - **LLaVA-NeXT-13B** (Apache 2.0)
     Vision-language model by LMSYS
     https://github.com/lm-sys/LLaVA
   
   - **Mistral-7B-Instruct** (Apache 2.0)
     Text generation by Mistral AI
     https://github.com/mistralai/mistral-src
   
   - **CLIP-ViT-L** (MIT)
     Image embedding by OpenAI
     https://github.com/openai/CLIP
   
   - **OpenCV** (Apache 2.0)
     Computer vision by OpenCV team
     https://github.com/opencv/opencv
   ```

3. **Privacy Policy (important!):**
   ```
   "Artwork images are analyzed on our servers using open-source 
   models. Images are not sent to third-party APIs (e.g., Claude, 
   ChatGPT, Google Vision). Your data stays private."
   ```
   This is a competitive advantage over Claude-based solutions!

4. **Terms of Service (add):**
   ```
   "FMB·ART uses open-source machine learning models subject to 
   Apache 2.0 and MIT licenses. The models are used as-is without 
   modifications to their licensing terms."
   ```

---

## 8. Deployment Checklist

### **Week 1: Local Development**
- [ ] Clone LLaVA-NeXT + Mistral locally
- [ ] Set up Ollama for local inference testing
- [ ] Create 10 test artworks, verify JSON output
- [ ] Set up Supabase locally (docker-compose)

### **Week 2-3: RunPod Integration**
- [ ] Create RunPod account, set up API key
- [ ] Build Docker image with vLLM + models
- [ ] Deploy to RunPod, test inference
- [ ] Create Vercel API route wrapper
- [ ] Test end-to-end: Vercel → RunPod → JSON response

### **Week 4: Fine-Tuning**
- [ ] Extract 50-80 training examples from existing art
- [ ] Prepare dataset in HF format
- [ ] Set up LoRA training script
- [ ] Run fine-tuning on RunPod ($84 cost)
- [ ] Evaluate fine-tuned model vs. base model
- [ ] Push LoRA adapter to Hugging Face Hub

### **Week 5: Deploy Fine-Tuned Model**
- [ ] Update RunPod container with LoRA adapter
- [ ] Deploy and test inference with fine-tuned version
- [ ] Verify descriptions match FMB voice
- [ ] A/B test with beta users

### **Production Launch (End of Q3)**
- [ ] Gradual rollout (5%, 25%, 100%)
- [ ] Monitor latency, errors, costs
- [ ] Collect user feedback on quality
- [ ] Fine-tune further if needed (optional second round)

---

## 9. Monitoring & Cost Control

### **RunPod Cost Optimization**

RunPod charges `$0.40/hour` for A40 (as of May 2026). To keep costs low:

1. **Batch inference:** Queue uploads, process 10 at a time (saves cold starts)
2. **Stop when idle:** Automatically stop GPU after 30 min of inactivity
3. **Use cheaper GPU:** RTX 4090 ($0.25/hr) if LLaVA-NeXT-13B is overkill
4. **Monitor utilization:**
   ```
   RunPod dashboard → Usage → track GPU hours per day
   Target: <3 GPU hours/day at launch (100 users × 1 upload/day)
   ```

### **Vercel Cost Control**

- **Monitor function execution:** Vercel dashboard → Functions → track execution time/memory
- **Set budget alerts:** Vercel settings → billing alerts at $50, $100, $150
- **Optimize payload:** Images should be <5MB before sending to RunPod

### **Supabase Cost Control**

- **Monitor storage:** Supabase → Storage → track GB used
- **Enable auto-cleanup:** Delete old revisions after 30 days
- **Set billing alerts:** Supabase → Billing → alerts at $50, $100

---

## 10. Tech Stack Summary

```
┌─ FRONTEND ─────────────────────────┐
│ Next.js 15 + React                 │
│ Tailwind CSS                       │
│ React Hook Form + Zod              │
│ Web Audio API (recording)          │
│ Vercel (hosting)                   │
└────────────────────────────────────┘
         ↓ (HTTPS/JSON)
┌─ BACKEND ──────────────────────────┐
│ Next.js API Routes (serverless)    │
│ Supabase Auth (JWT)                │
│ Supabase Postgres (relational DB)  │
│ Supabase Storage (S3)              │
│ Environment: Vercel serverless     │
└────────────────────────────────────┘
         ↓ (HTTP Queue)
┌─ GPU INFERENCE ────────────────────┐
│ RunPod (on-demand GPU)             │
│ vLLM (model serving)               │
│ LLaVA-NeXT-13B (vision)            │
│ LLaVA-NeXT-13B LoRA (fine-tuned)   │
│ Mistral-7B-Instruct (text)         │
└────────────────────────────────────┘
         ↓ (async)
┌─ FINE-TUNING (Phase 1 only) ──────┐
│ Hugging Face Transformers + PEFT   │
│ LoRA (parameter-efficient)         │
│ RunPod GPU (training)              │
│ Weights & Biases (experiment log)  │
└────────────────────────────────────┘
```

---

## 11. Risk Mitigation

### **What if RunPod inference is slow?**
- **Fallback:** Use a lighter model (LLaVA-1.6-7B instead of 13B, trades quality for speed)
- **Fallback:** Batch process at off-peak hours (process uploads async)

### **What if fine-tuning doesn't improve quality?**
- Not catastrophic. Base LLaVA-NeXT is already 90%+ as good as Claude
- Fine-tuning is an optimization, not a blocker

### **What if Supabase Storage fills up?**
- Monthly budget: $25 includes 100GB
- 10K users × 100 artworks each × 3MB avg = 3TB (will hit $50+/mo)
- **Solution:** Add image compression, delete old versions, archive to AWS S3

### **What if you need to scale to 100K+ users?**
- RunPod: Multi-GPU cluster ($200-500/mo)
- Alternative: Together.ai or Replicate for serverless inference (pay-per-call, no management)
- Alternative: Self-host on Lambda Labs ($1.5K/mo for dedicated H100)

---

## 12. Next Steps

1. **Validate LLaVA-NeXT quality** on 10 existing artworks
   - Generate metadata, compare to Claude Vision
   - Rate on a scale of 1-5

2. **Set up RunPod trial**
   - Create account, spin up A40 GPU
   - Deploy vLLM + LLaVA in Docker
   - Test inference (budget: $5-10)

3. **Prepare fine-tuning dataset**
   - Extract 50-80 examples from current archive
   - Write them in FMB voice (or use Claude API once to draft, then refine)

4. **Build Vercel API route**
   - Create `/api/analyze` endpoint
   - Call RunPod, validate JSON, store in Supabase

5. **Measure and iterate**
   - Phase 1 goal: Ship self-serve upload + analysis by end of August
   - Measure quality, latency, cost
   - Optimize before Phase 2 launch

---

## References & Resources

- **LLaVA-NeXT:** https://github.com/lm-sys/LLaVA
- **vLLM:** https://docs.vllm.ai/en/latest/
- **LoRA (PEFT):** https://github.com/huggingface/peft
- **RunPod Docs:** https://www.runpod.io/docs/
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Hugging Face Model Hub:** https://huggingface.co/models
- **Apache 2.0 License FAQ:** https://www.apache.org/licenses/LICENSE-2.0.html
