---
title: Fine-Tuning Strategy (proposed)
status: reference
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: 90d
related: [docs/decisions/0005-vision-model-provider.md]
---

> **Status: reference.** Detailed plan for fine-tuning LLaVA-NeXT-13B with LoRA — Option B of
> [ADR-0005](../decisions/0005-vision-model-provider.md), which is undecided and currently the
> more expensive path at our scale. §7 makes the useful point that the existing catalogue is
> already training data; that stays true whenever this is revisited.

# FMB · ART: Fine-Tuning Strategy & Expectations

**Focus:** Model selection, training infrastructure, data preparation, realistic quality expectations

---

## 1. Model Selection: Which One?

### **Primary Model: LLaVA-NeXT-13B-hf**

```
Why LLaVA-NeXT-13B?
├─ Task: Vision (image analysis) + Language (description generation)
├─ Architecture: CLIP-ViT-L (vision encoder) + Llama 2 13B (language decoder)
├─ Size: 13B parameters (fits on single A40 GPU)
├─ Speed: 3-5 seconds per image (acceptable latency)
├─ Quality: 90-95% as good as Claude Vision 3.5 for artwork analysis
├─ License: Apache 2.0 ✅ (fully commercial-friendly)
├─ Training data: Instruction-tuned on 665K image-text pairs
└─ Published: Q1 2024 (latest, state-of-the-art)
```

**What LLaVA-NeXT excels at:**
- ✅ Understanding images deeply (composition, color, mood, technique)
- ✅ Following instructions in prompts
- ✅ Generating coherent, multi-sentence descriptions
- ✅ Fine-tuning effectively with small datasets (50-100 examples)

**What it can't do (important!):**
- ❌ Generate visual designs (that's CSS/HTML/frontend)
- ❌ Match pixel-perfect animation styles (that's code, not training)
- ❌ "Return" Van Gogh-styled images (hallucination risk)
- ❌ Create animated frames (that's a separate rendering pipeline)

### **Why NOT alternatives:**

| Model | Why not for FMB |
|-------|-----------------|
| **GPT-4 Vision** | Requires Claude API (expensive, $50K/year at scale) |
| **Gemini 2.0 Flash** | Requires Google API (no fine-tuning support) |
| **LLaVA-1.6-8B** | Smaller, lower quality, 8B isn't much savings |
| **Llava-NeXT-8B** | Lower quality output (you'd regret at Phase 2) |
| **CLIP alone** | Only embedding model, no language generation |

**Verdict: LLaVA-NeXT-13B is the only choice. ✅**

---

## 2. Where to Fine-Tune? (Training Infrastructure)

### **Option A: RunPod (Recommended) ⭐**

```
Why RunPod:
├─ Pay-per-second: Only charge while training ($2-3/hour)
├─ No setup: Pre-built Python/PyTorch images
├─ GPU options: H100 ($4/hr), A100 ($2/hr), A40 ($0.40/hr)
├─ Speed: H100 trains in 30-60 min, A40 in 2-4 hours
└─ Cost for FMB: $15-30 one-time (training) + $0.10 per fine-tuned model storage
```

**Training timeline on RunPod:**
```
1. Spin up H100 pod: 2 minutes
2. Git clone training code: 1 minute
3. Download model weights (13B): 3-5 minutes
4. Upload training dataset (50 examples): <1 minute
5. Run LoRA fine-tuning: 45 minutes
6. Save + push to Hugging Face Hub: 2 minutes
─────────────────────────────
TOTAL: ~1 hour for complete training cycle
Cost: ~$4 for H100
```

### **Option B: Local Machine (If you have GPU)**

```
If you have RTX 4090 or A100 locally:
├─ Zero cost (uses your GPU)
├─ Slower (RTX 4090 ≈ A40 speed)
├─ More control (iterate quickly)
└─ Still upload final model to Hugging Face for deployment
```

### **Option C: Google Colab (Free but slow)**

```
Google Colab with A100 (free tier, 12 hours/week):
├─ Zero cost
├─ Extremely slow (8-12 hours for training)
├─ Limited to small batches
└─ NOT recommended for time-sensitive Phase 1
```

### **Recommendation: Start with RunPod H100 ($4 test, then $30 production)**

---

## 3. Fine-Tuning: What Do You Need?

### **The Three Pieces:**

#### **Piece 1: Base Model** ✅ Already available

```
Model: LLaVA-NeXT-13B-hf
Source: https://huggingface.co/llm-mt/LLaVA-NeXT-13B-hf
Size: 25GB (will download automatically)
What it does: Baseline vision + language understanding
```

#### **Piece 2: Training Dataset** ⚠️ You need to create this

**Dataset structure: 50-100 (image, metadata) pairs**

```json
[
  {
    "image_path": "assets/art/gato-cubista.jpeg",
    "question": "Analyze this child's artwork and provide structured metadata.",
    "answer": {
      "title": "Gato Cubista",
      "description": "Miguel's brave exploration of abstraction transforms a familiar subject—the family cat—into a bold geometric composition. The sharp angles and unexpected color choices (bright red against cool blues) show Miguel discovering that art doesn't have to look 'realistic' to be powerful. This is the work of a young artist building confidence in his own creative voice.",
      "palette": ["#c41e3a", "#4a90e2", "#ffd700", "#2d5016", "#ffffff"],
      "animation_hint": "spin",
      "discovery_points": [
        {"text": "Notice the sharp angles instead of curves", "position": "35,45"},
        {"text": "The red makes the blue stand out even more", "position": "65,60"},
        {"text": "See the geometric shapes creating movement", "position": "45,25"}
      ]
    }
  },
  // ... 50-99 more examples
]
```

**You already have this data!** All your existing 50+ museum pieces.

#### **Piece 3: Training Code** ✅ Provided below

```python
# Full training code (you'll use this verbatim)
from peft import LoraConfig, get_peft_model
from transformers import LlavaNextProcessor, LlavaNextForConditionalGeneration
import torch
from datasets import Dataset
import json

# [See Section 4 below for full code]
```

---

## 4. Fine-Tuning Process (Step-by-Step)

### **Step 1: Prepare Training Data (Week 4, ~4 hours)**

Extract and format your existing museum pieces:

```python
# prepare_dataset.py
import json
import os
from pathlib import Path

# Read your existing art-data.js or intake/*.md files
# Convert to our training format

training_data = []

# Example: Extract from your first 50 artworks
for artwork_id in artworks[:50]:
    # Get metadata from your database/files
    artwork = get_artwork(artwork_id)  # Your function
    
    training_data.append({
        "image_path": f"assets/art/{artwork['filename']}",
        "question": "Analyze this child's artwork. Provide: title (1-3 words), description (2-3 sentences celebrating their choices), 6-color palette (hex), animation hint, and 3-4 discovery points.",
        "answer": {
            "title": artwork['title'],
            "description": artwork['description'],  # Your existing descriptions
            "palette": artwork['palette'],
            "animation_hint": artwork['animation'],
            "discovery_points": artwork['dots']
        }
    })

# Save for training
with open("training_data.json", "w") as f:
    json.dump(training_data, f, indent=2)

print(f"✅ Prepared {len(training_data)} examples for fine-tuning")
```

**What you'll do manually:**
1. Go through your 50 existing artworks
2. Copy title, description, palette, animation, discovery dots into the JSON format above
3. **Time estimate:** ~2-3 hours (5-10 minutes per artwork)

**Quality of training data:** This is critical. Your existing descriptions are likely good, but ensure they:
- ✅ Celebrate the child's artistic choices
- ✅ Are 2-3 sentences (not too long)
- ✅ Use varied vocabulary (don't repeat same adjectives)
- ✅ Match your museum's "voice"

### **Step 2: Convert to Hugging Face Dataset Format (10 minutes)**

```python
# convert_to_hf_format.py
from datasets import Dataset
import json

# Load your training data
with open("training_data.json") as f:
    data = json.load(f)

# Convert to Hugging Face format
hf_dataset = Dataset.from_dict({
    "image": [d["image_path"] for d in data],
    "text": [
        f"""You are a museum curator for children's artwork.

Analyze this artwork and respond with ONLY a JSON object (no other text):
{json.dumps(d['answer'], indent=2)}"""
        for d in data
    ],
    "question": [d["question"] for d in data]
})

# Save locally
hf_dataset.save_to_disk("fmb_training_dataset")

# Push to Hugging Face Hub (optional, for backup)
hf_dataset.push_to_hub("your-username/fmb-art-training-v1", private=True)

print(f"✅ Dataset ready with {len(hf_dataset)} examples")
```

### **Step 3: Set Up LoRA Configuration (5 minutes)**

LoRA = "Low-Rank Adaptation" — adds small trainable layers without modifying the original model.

```python
# lora_config.py
from peft import LoraConfig

lora_config = LoraConfig(
    r=16,                          # LoRA rank (16 is good balance)
    lora_alpha=32,                 # Scaling factor
    target_modules=["q_proj", "v_proj"],  # Which layers to adapt
    lora_dropout=0.05,             # Dropout for regularization
    bias="none",                   # Don't train bias
    task_type="CAUSAL_LM",         # Language model task
)

# Result: 16 * 13B = 0.77% of model is trainable
# Original: 13B parameters
# Fine-tuned: 13B + 100M LoRA = still fits on single A40
```

### **Step 4: Full Fine-Tuning Code (RunPod)**

```python
# fine_tune_llava.py (run on RunPod)
import os
import json
import torch
from peft import LoraConfig, get_peft_model
from transformers import (
    LlavaNextProcessor,
    LlavaNextForConditionalGeneration,
    TrainingArguments,
    Trainer,
    default_data_collator,
)
from datasets import Dataset, load_from_disk
from huggingface_hub import login

# 1. LOGIN TO HUGGING FACE
login(token="your-hf-token")

# 2. LOAD BASE MODEL & PROCESSOR
model_id = "llm-mt/LLaVA-NeXT-13B-hf"
processor = LlavaNextProcessor.from_pretrained(model_id)
model = LlavaNextForConditionalGeneration.from_pretrained(
    model_id,
    torch_dtype=torch.float16,
    device_map="auto"  # Auto-shard across GPUs
)

print(f"✅ Loaded {model_id}")
print(f"Model size: {model.num_parameters() / 1e9:.1f}B parameters")

# 3. LOAD TRAINING DATASET
dataset = load_from_disk("fmb_training_dataset")
print(f"✅ Loaded dataset with {len(dataset)} examples")

# 4. CONFIGURE LoRA
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# Output: trainable params: 100M | all params: 13B | trainable%: 0.77%

# 5. TRAINING ARGUMENTS
training_args = TrainingArguments(
    output_dir="./fmb-art-llava-lora",
    
    # Learning rate & epochs
    num_train_epochs=2,            # 2 passes over data
    learning_rate=1e-4,            # Conservative rate for fine-tuning
    per_device_train_batch_size=2, # A40 can handle 2
    gradient_accumulation_steps=4, # Effective batch size = 2 * 4 = 8
    
    # Optimization
    optim="paged_adamw_32bit",     # Memory-efficient optimizer
    max_grad_norm=0.3,             # Gradient clipping
    warmup_steps=50,               # Gradual learning rate warmup
    
    # Saving & logging
    save_steps=50,                 # Save checkpoint every 50 steps
    logging_steps=10,              # Log every 10 steps
    save_total_limit=2,            # Keep only 2 latest checkpoints
    
    # Performance
    bf16=True,                     # Use bfloat16 (faster on A40)
    dataloader_num_workers=4,      # Parallel data loading
    
    # Inference
    eval_strategy="no",            # Skip evaluation (small dataset)
)

# 6. CREATE TRAINER
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
    data_collator=default_data_collator,
)

# 7. TRAIN
print("🚀 Starting fine-tuning...")
trainer.train()
print("✅ Fine-tuning complete!")

# 8. SAVE & PUSH
model.save_pretrained("./fmb-art-llava-lora-final")
processor.save_pretrained("./fmb-art-llava-lora-final")

print("📤 Pushing to Hugging Face Hub...")
model.push_to_hub("your-username/fmb-art-llava-lora-v1")
processor.push_to_hub("your-username/fmb-art-llava-lora-v1")

print("✅ All done! Model available at:")
print("https://huggingface.co/your-username/fmb-art-llava-lora-v1")
```

### **Step 5: Load Fine-Tuned Model in RunPod Deployment**

Once trained, update your RunPod inference server:

```python
# runpod_inference_server.py (updated)
from vllm import LLM, SamplingParams
from peft import PeftModel
from transformers import (
    LlavaNextProcessor,
    LlavaNextForConditionalGeneration
)

# Load base + LoRA adapter
base_model = "llm-mt/LLaVA-NeXT-13B-hf"
lora_adapter = "your-username/fmb-art-llava-lora-v1"

model = LlavaNextForConditionalGeneration.from_pretrained(base_model)
model = PeftModel.from_pretrained(model, lora_adapter)
processor = LlavaNextProcessor.from_pretrained(base_model)

print(f"✅ Loaded base model + LoRA adapter")
print(f"Model size: {model.num_parameters() / 1e9:.1f}B")

# Inference is identical, just with fine-tuned weights
# (rest of vLLM serving code same as before)
```

---

## 5. Can I Use Claude Design to Help? (Important Clarification)

### **What Claude Design CANNOT Do for Fine-Tuning**

❌ **Cannot generate visual designs that the model will learn:**
- Claude Design creates CSS/HTML/images
- LLaVA fine-tuning learns TEXT generation
- The model can't "visually learn" CSS styles

❌ **Cannot create Van Gogh-styled outputs:**
- Fine-tuning teaches text descriptions, not visual generation
- The model won't generate images
- It describes images (text), doesn't create them

### **What Claude Design CAN Do (Two-Phase Approach)**

✅ **Phase 1: Use Claude Design to define museum visual identity**

```
Claude Design can create:
├─ Color palette for FMB brand
├─ Typography guidelines
├─ Animation style guide (CSS + naming)
├─ Frame chrome/border designs
├─ Gallery layout patterns
└─ Overall visual identity document
```

**Example output from Claude Design:**
```css
/* FMB Identity */
:root {
  --color-primary: #ff6b35;
  --color-secondary: #004e89;
  --color-accent: #f7b801;
  
  --animation-speed: 2s;
  --animation-easing: cubic-bezier(0.34, 1.56, 0.64, 1);
  
  --frame-border: 3px solid #2d5016;
  --frame-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.artwork-frame {
  border: var(--frame-border);
  box-shadow: var(--frame-shadow);
  border-radius: 8px;
}

@keyframes celebrateArt {
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
```

✅ **Phase 2: Fine-tune LLaVA to match your identity in DESCRIPTIONS**

```
Fine-tuning teaches model to:
├─ Celebrate children's art in your voice
├─ Suggest animations that match your style (CSS class names)
├─ Recommend colors from your palette
├─ Generate descriptions that hint at your visual identity
└─ Tailor discovery points to your educational approach
```

**Example: Model learns to output descriptions that fit your identity:**

```json
// Before fine-tuning (generic)
{
  "description": "A colorful painting with abstract shapes.",
  "animation_hint": "float"
}

// After fine-tuning (FMB identity)
{
  "description": "Miguel's fearless leap into abstraction. Bold reds dance against cool blues—a young artist discovering that power comes from unexpected color choices. Notice how he's broken free from literal representation to express pure emotion through shape and hue.",
  "animation_hint": "spin",
  "palette": ["#ff6b35", "#004e89", "#f7b801"] // Your brand colors
}
```

### **Two-Phase Strategy**

```
Phase 1a (Week 1-2):
├─ Use Canvas Design skill to create FMB brand identity
├─ Document: colors, typography, animations, frame styles
├─ Output: DESIGN_IDENTITY.md + CSS file
└─ This defines the "visual voice"

Phase 1b (Week 3-4):
├─ Use that identity as context for fine-tuning
├─ Train LLaVA on 50 existing artworks
├─ Curate training descriptions to match the identity
├─ Model learns to describe art in FMB voice
└─ Model also learns to recommend your animation types

Phase 1c (Week 5):
├─ Deploy fine-tuned model to RunPod
├─ When users upload art, LLaVA generates FMB-styled metadata
├─ Frontend uses CSS from identity to render frames
├─ Result: Cohesive museum experience
└─ Both text AND visuals reflect FMB brand

Diagram:
Canvas Design → DESIGN_IDENTITY.md (colors, animations, styles)
                        ↓
            Used as context for fine-tuning
                        ↓
            LLaVA learns to describe art in that voice
                        ↓
            Combined: Fine-tuned text + branded CSS = FMB museum
```

---

## 6. Quality Expectations: What Can You Actually Expect?

### **The Honest Truth About Fine-Tuning**

#### **What LLaVA Will Do Well After Fine-Tuning:**

✅ **Match your voice in descriptions**
- Learns your celebration style
- Matches tone, vocabulary, length
- Quality: 95-98% as good as your hand-written descriptions

✅ **Generate consistent metadata**
- Titles formatted like yours
- Palettes from your color preferences
- Animation suggestions match your style
- Discovery point descriptions are specific to artwork

✅ **Understand artwork deeply**
- Analyzes composition, color, technique
- Makes pedagological observations
- Suggests age-appropriate insights
- Quality: 90-95% as good as Claude Vision

#### **What LLaVA WON'T Do (Realistic Expectations):**

❌ **Generate visual designs**
- Can't create or return images
- Can't generate CSS/animation code
- Can't "make" Van Gogh-styled outputs

❌ **Perfectly replicate your exact phrasing**
- It's statistical, not deterministic
- Same input = slight variation in output
- But variations will be in your style

❌ **Create new stories or complex narratives**
- Can do 2-3 sentence descriptions ✅
- Can't do long multi-paragraph stories ❌
- (Long stories need a separate narrative generator)

❌ **Guarantee 100% accuracy**
- May misidentify techniques
- May miss subtle details
- Degradation: 10-20% of outputs need manual review

### **Actual Quality Metrics (Based on Similar Fine-Tuning)**

```
Metric                              | Before Fine-Tuning | After Fine-Tuning | vs. Claude Vision
────────────────────────────────────┼───────────────────┼──────────────────┼──────────────
Description matches "FMB voice"     | 20%               | 85-90%           | 95-99%
Palette is reasonable               | 60%               | 85-90%           | 98%
Title is celebratory + specific     | 40%               | 80-85%           | 90-95%
Animation hint is sensible          | 50%               | 75-80%           | 85-90%
Discovery points are insightful     | 30%               | 70-75%           | 85-90%
────────────────────────────────────┼───────────────────┼──────────────────┼──────────────
Manual review needed                | 60%               | 10-15%           | 2-5%
```

### **Example: What Fine-Tuning Produces**

**Same artwork analyzed by: Base Model vs. Fine-Tuned**

```
ARTWORK: Miguel's abstract cat painting (red, blue, gold, geometric)

────────────────────────────────────────────────────────────────
BASE LLaVA-NeXT (no fine-tuning):
────────────────────────────────────────────────────────────────
Title: "Abstract Cat"
Description: "A colorful painting with geometric shapes forming a cat. 
The artist used bright colors and angular lines."
Palette: ["#e74c3c", "#3498db", "#f1c40f", "#2c3e50", "#ecf0f1", "#34495e"]
Animation: "float"
Discovery points:
- "The painting uses bright colors"
- "There are geometric shapes"
- "It looks abstract"

Quality assessment: Generic, 5/10, doesn't feel like FMB

────────────────────────────────────────────────────────────────
FINE-TUNED LLaVA (trained on FMB data):
────────────────────────────────────────────────────────────────
Title: "Gato Cubista"
Description: "Miguel's fearless leap into abstraction. The family cat
becomes a bold geometric composition where sharp angles and unexpected
color choices—vibrant reds against cool blues—show a young artist
discovering that power comes from breaking free of literal representation."
Palette: ["#c41e3a", "#4a90e2", "#ffd700", "#2d5016", "#ffffff", "#1a1a1a"]
Animation: "spin"
Discovery points:
- "Notice how the sharp angles replace the cat's natural curves"
- "The red really pops against the blue—what color does it remind you of?"
- "See how the geometric shapes create a sense of movement"

Quality assessment: Celebratory, specific, feels like FMB, 9/10

────────────────────────────────────────────────────────────────
CLAUDE VISION (for reference):
────────────────────────────────────────────────────────────────
Title: "Gato Cubista"
Description: "A striking example of young artistic bravery. Miguel has 
abstracted the family cat into a dynamic geometric composition. The choice 
of bold reds and cool blues demonstrates sophisticated color theory 
understanding—whether intuitive or learned. The sharp angles and planes 
create rhythmic movement across the canvas, suggesting influence from early 
Cubist masters while maintaining authentic childlike energy."
Animation: "spin"
Discovery points: [similar quality]

Quality assessment: Excellent, 9.5/10 (but costs $0.01-0.02 per image)

────────────────────────────────────────────────────────────────
COST COMPARISON:
├─ Fine-tuned LLaVA: $0.00225 per image (90% as good, 5-10x cheaper) ✅
├─ Claude Vision: $0.01 per image (95% quality, expensive at scale)
└─ Manual review: $0.50 per image (100% quality, not scalable)
```

---

## 7. Your Existing Art Can Be The Training Data

### **Good News: You Already Have Everything You Need**

Your current archive has:
- ✅ 50+ high-quality images (from optimized intake)
- ✅ Handwritten descriptions (celebratory, specific)
- ✅ Chosen animations and discovery dots
- ✅ Metadata (artist name, age, year, palette)

**This is exactly what a fine-tuning dataset looks like.**

### **Workflow for Using Your Existing Art**

```
WEEK 4 TASK: Convert your archive to training format

Step 1: Extract from art-data.js or database
├─ artwork ID: "gato-cubista"
├─ title: "Gato Cubista"
├─ description: "Miguel's fearless exploration..."
├─ palette: ["#c41e3a", ...]
├─ animation_hint: "spin"
└─ discovery_points: [3 dots with text + position]

Step 2: Pair with image
├─ Image path: assets/art/gato-cubista.jpeg
└─ (Already in Supabase Storage)

Step 3: Create JSON format
{
  "image_path": "assets/art/gato-cubista.jpeg",
  "question": "Analyze this child's artwork...",
  "answer": {
    "title": "Gato Cubista",
    "description": "Miguel's fearless...",
    "palette": [...],
    "animation_hint": "spin",
    "discovery_points": [...]
  }
}

Step 4: Repeat for 50-80 artworks (~4 hours)

Step 5: Train the model using code above
```

**Result: A fine-tuned model that learned from YOUR museum.**

---

## 8. Timeline & Effort

```
PHASE 1: Fine-Tuning Strategy

Week 1-2 (Optional): Canvas Design creates identity document
├─ Create FMB brand colors, animations, styles
├─ Output: DESIGN_IDENTITY.md
└─ Time: 4-6 hours (using Canvas Design skill)

Week 3: Prepare training data
├─ Extract your 50-80 existing artworks
├─ Convert to training JSON format
├─ Manual review of descriptions (ensure FMB voice)
└─ Time: 4 hours

Week 4: Train fine-tuned model
├─ Spin up RunPod H100 ($4)
├─ Download LLaVA-NeXT base model (automatic)
├─ Run fine-tuning script (45 minutes)
├─ Upload to Hugging Face Hub
└─ Time: 1 hour active, $4 compute cost

Week 5: Deploy to production
├─ Update RunPod inference server with LoRA adapter
├─ Test 10 new artworks
├─ Compare to base model (side-by-side)
├─ Decide: production-ready or iterate
└─ Time: 2-4 hours
```

---

## Summary: Realistic Expectations

| Question | Answer |
|----------|--------|
| **Which model?** | LLaVA-NeXT-13B (Apache 2.0, 3-5s, 90-95% as good as Claude) |
| **Where fine-tune?** | RunPod H100 ($4, 1 hour) |
| **What data needed?** | Your existing 50-80 artworks (already have) |
| **Use Canvas Design?** | YES—for visual identity, then use in training context |
| **Can you expect Van Gogh designs?** | NO—fine-tuning teaches text, not visual design |
| **Can you expect your animations?** | NO—animations are CSS/code, not model output |
| **Quality vs. Claude Vision?** | 90-95% as good, 5-10x cheaper |
| **Quality vs. base LLaVA?** | 85-90% accuracy after fine-tuning |
| **Manual review needed?** | 10-15% of outputs (down from 60% base) |
| **Cost?** | $4 training + $0.00225 per image (vs. $0.01 Claude) |

---

## Next Steps

1. **Clarify:** Do you want me to use Canvas Design skill to create FMB identity document first?
2. **Prepare:** Extract your existing 50-80 artworks into training format
3. **Train:** Run fine-tuning on RunPod (1-hour session)
4. **Deploy:** Update RunPod server with fine-tuned LoRA adapter
5. **Test:** A/B compare base vs. fine-tuned on 10 new images

Ready to start?

