---
title: API Costs & Data Flow (proposed)
status: reference
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: 90d
related: [docs/engineering/TARGET_ARCHITECTURE.md, docs/decisions/0005-vision-model-provider.md]
---

> **Status: reference.** Costing and data-flow design for the proposed backend. Assumes the
> self-hosted-model path of [ADR-0005](../decisions/0005-vision-model-provider.md), which is
> undecided. None of this infrastructure exists.

# FMB · ART: API Costs, Vercel Capabilities & Data Flow

**Focus:** Can Vercel handle orchestration? Exact costs. Detailed data flow from LLM → Supabase.

---

## 1. Can Vercel Handle This Architecture?

### **Short Answer: YES, Vercel is perfect for this.**

Vercel serverless functions are ideal for:
- ✅ Orchestrating calls between services (RunPod, Supabase)
- ✅ Validating and transforming data (JSON parsing, schema validation)
- ✅ File uploads/downloads with signed URLs
- ✅ Database operations (Supabase Postgres)
- ✅ Long-running operations (up to 30-60 seconds per request)

### **Vercel Serverless Function Limits**

| Aspect | Limit | Impact on FMB |
|--------|-------|---------------|
| **Function timeout** | 60 seconds (Pro), 10s (free) | ✅ LLM call (3-5s) + DB write (1s) = well under limit |
| **Memory** | 3GB | ✅ Image processing (500MB max) is fine |
| **Payload size** | 4.5MB | ✅ Signed URL (~2KB) + image URL + metadata << limit |
| **Concurrent executions** | Unlimited (auto-scale) | ✅ 100→1000 users: Vercel scales automatically |
| **Cold start** | ~500ms on Pro | ✅ Acceptable (LLM inference dominates timing) |
| **Cost** | Pay-per-call + compute time | ✅ See breakdown below |

**Why Vercel is better than alternatives:**
- **AWS Lambda:** Same capabilities, but requires more boilerplate + IAM setup
- **Cloudflare Workers:** Too small for image processing + long-running inference
- **Self-hosted:** You'd have to manage servers, which defeats the purpose

---

## 2. Detailed Cost Breakdown

### **RunPod LLM API Costs**

RunPod offers **two pricing models**:

#### **Model A: Serverless (Recommended for FMB)**

You **only pay when the GPU is actually running**. Perfect for variable load.

```
Pricing:
• A40 GPU: $0.0005 per second of execution
• Setup overhead: ~$0.005 per request

Example: Analyzing 1 artwork
├─ Image downloaded: 0.5 seconds
├─ LLM inference: 3-5 seconds average (3.5s)
├─ Output validation: 0.5 seconds
├─ Total: 4.5 seconds
└─ Cost: 4.5s × $0.0005/s = $0.00225 per analysis

At scale:
├─ 100 users × 20 uploads/year = 2,000 analyses
├─ 2,000 × $0.00225 = $4.50/year ✅ NEGLIGIBLE
│
├─ 1,000 users = $45/year
├─ 10,000 users = $450/year
└─ 100,000 users = $4,500/year
```

**Cost comparison to other providers:**

| Provider | Model | Cost/Image |
|----------|-------|-----------|
| **RunPod Serverless (A40)** | Pay-per-second | $0.00225 |
| **RunPod On-Demand (A40/hour)** | Reserved GPU | $0.40/hour ($0.0001/sec if fully utilized) |
| **Claude Vision API** | Per call | $0.01-0.02 |
| **Together.ai** | Per-token | $0.0018/image (estimate) |

**RunPod Serverless is 5-10x cheaper than Claude Vision API.**

#### **Model B: On-Demand Pod (if you want dedicated GPU)**

```
Pricing:
• A40 GPU: $0.40/hour
• Runs continuously (even if idle)

For FMB:
├─ Assumption: 2,000 analyses/month = 166/day
├─ At 3.5s per analysis = 583 seconds of compute/day
├─ 583s ÷ 3600s = 0.16 hours of actual GPU work/day
├─ But you pay $0.40/hour × 24 hours = $9.60/day = $288/month
│
└─ This is WASTEFUL for FMB (only 0.16 hours utilized out of 24)
```

**Recommendation: Use Serverless, NOT On-Demand.**

---

### **Supabase Storage Costs**

Supabase Storage is **S3-compatible**, charged per GB stored:

```
Pricing:
• Storage: $0.10 per GB per month (charged monthly)
• Egress (downloads): $0.12 per GB

FMB storage model:
├─ Master image: 2.5MB
├─ Optimized image: 500KB
├─ Total per artwork: 3MB
│
├─ At 100 users, 20 artworks/year = 2,000 artworks
├─ 2,000 × 3MB = 6,000MB = 6GB
├─ Cost: 6GB × $0.10/month = $0.60/month ✅
│
├─ At 1,000 users = 60GB = $6/month
├─ At 10,000 users = 600GB = $60/month
└─ At 100,000 users = 6,000GB (6TB) = $600/month
```

**Egress costs (when users download prints, share images):**

```
Example: User orders a 8×10 print
├─ Vercel downloads master image: 2.5MB × $0.12 = $0.30
├─ Printful API receives image: included in Vercel → Printful transfer (free)
│
→ Each print order costs ~$0.30 in egress

At scale:
├─ 10,000 users × 10% order prints = 1,000 orders/year
├─ 1,000 × $0.30 = $300/year in egress
├─ Or $25/month average
│
└─ Profit per print ($50 margin) >>> egress cost ($0.30) ✅
```

---

### **Vercel API Route Costs**

```
Pricing:
• Function execution: $0.50 per 1 million function invocations
• Bandwidth (out): Included in Vercel Pro ($20/month)

FMB usage:
├─ 1 analysis per upload
├─ 2,000 uploads/year @ 100 users
├─ 2,000 invocations = $0.001/month ✅ NEGLIGIBLE
│
├─ At 10,000 users = 200,000 invocations = $0.10/month
└─ At 100,000 users = 2,000,000 invocations = $1/month
```

**Bandwidth included in Vercel Pro ($20/month):**
- All API route traffic (uploads, JSON responses)
- Image optimization and resizing
- Includes up to ~2TB/month bandwidth

---

### **Supabase Postgres Costs**

```
Pricing:
• Pro tier: $25/month (includes everything)
  - 8GB database size
  - Unlimited API requests
  - Unlimited edge functions
  - RLS (Row-Level Security)

FMB usage per 100 users:
├─ artwork table: 2,000 rows × ~2KB = 4MB
├─ discovery_dots table: 2,000 × 3 dots × ~200B = 1.2MB
├─ users table: 100 rows × ~1KB = 100KB
├─ Total: ~5MB ✅ Well within 8GB limit
│
├─ At 1,000 users ≈ 50MB
├─ At 10,000 users ≈ 500MB
└─ At 100,000 users ≈ 5GB (still under 8GB, might need Team tier at $115/mo)
```

---

### **Supabase Auth Costs**

```
Pricing:
• Included in Pro tier ($25/month)
• Unlimited users
• JWT signing, OAuth, email/password auth

FMB usage:
├─ 100 users = free (included)
├─ 10,000 users = free (included)
└─ 1,000,000 users = still free (included in Pro tier)
```

---

### **Complete Cost Breakdown (Phase 1, 100 users)**

| Component | Unit Cost | Monthly | Annual |
|-----------|-----------|---------|--------|
| **Vercel (hosting + functions)** | $20/mo (Pro) | $20 | $240 |
| **Supabase (DB + storage + auth)** | $25/mo (Pro) | $25 | $300 |
| **RunPod LLM (serverless)** | $0.00225 per image | $4.50 | $54 |
| **Monitoring (Sentry + logs)** | Free tier | Free | Free |
| **TOTAL** | — | **$49.50** | **$594** |

**At 100 users:**
- Revenue (if $49/year subscription): 100 × $49 = $4,900/year
- Operating cost: $594/year
- **Gross margin: 88% ✅**

---

### **Cost Scaling to 10K Users**

| Component | 100 users | 1K users | 10K users |
|-----------|-----------|----------|-----------|
| Vercel | $20 | $20 | $30 |
| Supabase | $25 | $25 | $50 |
| RunPod | $4.50 | $45 | $450 |
| **TOTAL/month** | **$49.50** | **$90** | **$530** |
| **TOTAL/year** | **$594** | **$1,080** | **$6,360** |
| — | — | — | — |
| **Revenue** (at $49/user/year) | $4,900 | $49,000 | $490,000 |
| **Gross margin** | 88% | 98% | 98.7% |

**Key insight:** LLM costs scale **linearly** with usage. But they're so cheap that **margin stays >98% at scale**.

---

## 3. Information Flow: LLM Result → Supabase

### **Complete Step-by-Step Data Flow**

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Frontend sends image path + user context            │
└─────────────────────────────────────────────────────────────┘

Frontend (React)
    ↓
POST /api/analyze
    ├─ Body: { imagePath, artistName, childAge }
    ├─ Auth: Bearer token (JWT)
    └─ Content-Type: application/json

┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Vercel receives, authenticates                      │
└─────────────────────────────────────────────────────────────┘

Vercel API Route
    ├─ Extract JWT from Authorization header
    ├─ Call supabase.auth.admin.verifyJWT(token)
    ├─ Extract user_id from decoded token
    └─ If invalid → return 401 Unauthorized

Example decoded JWT:
{
  "sub": "user-uuid-12345",
  "email": "parent@example.com",
  "exp": 1719705600
}

┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Get signed URL for image                            │
└─────────────────────────────────────────────────────────────┘

Vercel API
    ├─ Call: supabase.storage.from("artwork")
    │         .createSignedUrl(imagePath, 3600)
    │
    └─ Response: {
         "path": "assets/art/gato-cubista.jpeg",
         "signedUrl": "https://supabase.storage.../..."
       }

Duration: 1 hour (expires after 1 hour, so RunPod must complete before then)

┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Call RunPod LLM API                                 │
└─────────────────────────────────────────────────────────────┘

Vercel API
    ├─ Prepare payload:
    │  {
    │    "image_url": "https://supabase.storage/.../gato-cubista.jpeg",
    │    "prompt": "Analyze this child's artwork...",
    │    "model": "llava-next-13b-lora"
    │  }
    │
    ├─ Call: fetch("https://your-runpod-endpoint/analyze", {
    │         method: "POST",
    │         headers: {
    │           "Content-Type": "application/json",
    │           "Authorization": "Bearer RUNPOD_API_KEY"
    │         },
    │         body: JSON.stringify(payload),
    │         timeout: 30000
    │       })
    │
    └─ Timeout: 30 seconds (LLM takes 3-5 seconds)

RunPod Processing (actual GPU work):
    ├─ Download image from signed URL: 0.5s
    ├─ Load model weights (cached): 0s
    ├─ Inference (vision + text): 3-5s
    ├─ Generate JSON response: 0.5s
    └─ Total: ~4.5 seconds

RunPod Response (success):
{
  "title": "Gato Cubista",
  "description": "Miguel's brave exploration of abstraction...",
  "palette": ["#c41e3a", "#4a90e2", "#ffd700", "#2d5016", "#ffffff", "#1a1a1a"],
  "animation_hint": "spin",
  "discovery_points": [
    {
      "text": "Notice the sharp angles instead of curves",
      "position": "35,45"
    },
    {
      "text": "The red makes the blue stand out even more",
      "position": "65,60"
    },
    {
      "text": "See how the geometric shapes create movement",
      "position": "45,25"
    }
  ]
}

┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Validate JSON schema                                │
└─────────────────────────────────────────────────────────────┘

Vercel API (using Zod)
    ├─ Parse response JSON
    ├─ Validate each field:
    │  ├─ title: string, 1-50 chars ✅
    │  ├─ description: 10-500 chars ✅
    │  ├─ palette: array of 6 valid hex colors
    │  │  └─ Check: /^#[0-9a-f]{6}$/i
    │  │  └─ Verify 6 colors: ["#c41e3a", ...] ✅
    │  ├─ animation_hint: one of enum ✅
    │  └─ discovery_points: 3-4 objects with text + position
    │     └─ Verify position is "x,y" format ✅
    │
    └─ If any field invalid:
       ├─ Log error with LLM response
       ├─ Return 500 Internal Server Error
       └─ Frontend shows "Analysis failed, please try again"

Cost of this step: <1ms

┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Create artwork record in Postgres                   │
└─────────────────────────────────────────────────────────────┘

Vercel API
    ├─ Call: supabase.from("artwork")
    │         .insert({
    │           user_id: "user-uuid-12345",
    │           file_path: "assets/art/gato-cubista.jpeg",
    │           file_size_bytes: 1507382,
    │           title: "Gato Cubista",
    │           description: "Miguel's brave...",
    │           palette: ["#c41e3a", "#4a90e2", ...],
    │           animation_hint: "spin",
    │           artist_name: "Miguel",
    │           child_age: 5,
    │           created_at: "2026-05-29T10:30:00Z"
    │         })
    │         .select()
    │         .single()
    │
    └─ Response: {
         id: "artwork-uuid-67890",
         user_id: "user-uuid-12345",
         ...
       }

Postgres Execution:
    ├─ INSERT into artwork table
    ├─ Generate UUID for artwork
    ├─ Set created_at to NOW()
    ├─ Return inserted row
    └─ Cost: ~10-50ms (network latency)

┌─────────────────────────────────────────────────────────────┐
│ STEP 7: Create discovery_dots records                       │
└─────────────────────────────────────────────────────────────┘

Vercel API
    ├─ Transform LLM response into discovery_dots format:
    │  {
    │    artwork_id: "artwork-uuid-67890",
    │    x_percent: 35,
    │    y_percent: 45,
    │    description: "Notice the sharp angles..."
    │  }
    │
    ├─ Call: supabase.from("discovery_dots")
    │         .insert([
    │           { artwork_id, x_percent: 35, y_percent: 45, ... },
    │           { artwork_id, x_percent: 65, y_percent: 60, ... },
    │           { artwork_id, x_percent: 45, y_percent: 25, ... }
    │         ])
    │
    └─ Response: 3 rows inserted

Postgres Execution:
    ├─ INSERT 3 rows into discovery_dots
    ├─ Each generates UUID
    ├─ Each links to artwork_id via foreign key
    └─ Cost: ~10-50ms

┌─────────────────────────────────────────────────────────────┐
│ STEP 8: Return success response                             │
└─────────────────────────────────────────────────────────────┘

Vercel API → Frontend
{
  "success": true,
  "artwork": {
    "id": "artwork-uuid-67890",
    "title": "Gato Cubista",
    "description": "Miguel's brave...",
    "palette": [...],
    "animation_hint": "spin",
    "discovery_points": [...]
  }
}

Status: 201 Created
Content-Type: application/json

┌─────────────────────────────────────────────────────────────┐
│ STEP 9: Frontend updates gallery                            │
└─────────────────────────────────────────────────────────────┘

React Component
    ├─ Receive artwork object from API
    ├─ Add to local state (Zustand/React Query)
    ├─ Animate in new artwork card
    ├─ Show "Recording ready" message
    └─ User can now record audio for discovery dots
```

### **Total Flow Duration**

| Step | Duration | Notes |
|------|----------|-------|
| 1. Frontend → Vercel | 100ms | Network latency |
| 2. Auth verification | 10ms | JWT check |
| 3. Get signed URL | 50ms | Supabase API call |
| 4. Call RunPod | 4,500ms | **LLM inference dominates** |
| 5. Validate JSON | 5ms | Zod schema validation |
| 6. Create artwork record | 50ms | Postgres INSERT + index update |
| 7. Create discovery_dots | 50ms | 3 × INSERT |
| 8. Return response | 10ms | JSON serialization |
| **TOTAL** | **~4,775ms** | **~4.8 seconds** |

**User experience:**
- Click "Upload" → see loading spinner
- Spinner: "Analyzing your artwork..."
- After ~5 seconds → success screen shows "Recording ready"

---

## 4. Error Handling & Retries

### **What can go wrong?**

```typescript
// /api/analyze (with error handling)
export async function POST(req: NextRequest) {
  try {
    // ===== POTENTIAL ERROR 1: Invalid auth =====
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 }
      );
    }

    // ===== POTENTIAL ERROR 2: Supabase auth verification fails =====
    let decoded;
    try {
      decoded = await supabase.auth.admin.verifyJWT(token);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // ===== POTENTIAL ERROR 3: Missing image path =====
    const { imagePath } = await req.json();
    if (!imagePath) {
      return NextResponse.json(
        { error: "Missing imagePath" },
        { status: 400 }
      );
    }

    // ===== POTENTIAL ERROR 4: Signed URL generation fails =====
    let signedUrl;
    try {
      const { data } = await supabase.storage
        .from("artwork")
        .createSignedUrl(imagePath, 3600);
      if (!data?.signedUrl) throw new Error("No signed URL returned");
      signedUrl = data.signedUrl;
    } catch (error) {
      console.error("Signed URL error:", error);
      return NextResponse.json(
        { error: "Failed to access image" },
        { status: 500 }
      );
    }

    // ===== POTENTIAL ERROR 5: RunPod timeout or failure =====
    let llmResponse;
    try {
      const runpodRes = await fetch(
        `${process.env.RUNPOD_ENDPOINT_URL}/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.RUNPOD_API_KEY}`,
          },
          body: JSON.stringify({
            image_url: signedUrl,
            prompt: "...",
            model: "llava-next-13b-lora",
          }),
          timeout: 30000, // 30 second timeout
        }
      );

      if (!runpodRes.ok) {
        const errorBody = await runpodRes.text();
        throw new Error(`RunPod error: ${runpodRes.status} ${errorBody}`);
      }

      llmResponse = await runpodRes.json();
    } catch (error) {
      console.error("LLM error:", error);
      
      // Retry logic (optional)
      if (error instanceof Error && error.message.includes("timeout")) {
        // Could implement exponential backoff here
        console.log("LLM timed out, user can retry");
      }
      
      return NextResponse.json(
        { error: "LLM analysis failed. Please try again." },
        { status: 500 }
      );
    }

    // ===== POTENTIAL ERROR 6: Invalid JSON response =====
    let metadata;
    try {
      metadata = LLMResponseSchema.parse(llmResponse);
    } catch (validationError) {
      console.error("Schema validation failed:", validationError);
      console.error("LLM returned:", llmResponse);
      
      // Log to Sentry for debugging
      Sentry.captureException(validationError, {
        extra: { llmResponse }
      });
      
      return NextResponse.json(
        { error: "Invalid response structure from LLM" },
        { status: 500 }
      );
    }

    // ===== POTENTIAL ERROR 7: Database insert fails =====
    try {
      const { data: artwork, error: insertError } = await supabase
        .from("artwork")
        .insert({...})
        .select()
        .single();

      if (insertError) throw insertError;

      // ===== POTENTIAL ERROR 8: Discovery dots insert fails =====
      const { error: dotsError } = await supabase
        .from("discovery_dots")
        .insert([...]);

      if (dotsError) throw dotsError;

      // Success!
      return NextResponse.json(
        { success: true, artwork },
        { status: 201 }
      );
    } catch (dbError) {
      console.error("Database error:", dbError);
      Sentry.captureException(dbError);
      
      return NextResponse.json(
        { error: "Failed to save artwork" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### **Error Recovery Strategy**

| Error | Cause | User Impact | Recovery |
|-------|-------|-------------|----------|
| **401 Unauthorized** | Invalid JWT | Can't upload | User re-logs in |
| **400 Bad Request** | Missing imagePath | Validation error | Frontend checks before submit |
| **500 Signed URL fails** | File doesn't exist in Storage | Upload failed | Retry upload |
| **500 RunPod timeout** | LLM took >30s | Analysis failed | User can retry immediately |
| **500 Schema validation fails** | LLM returned bad JSON | Internal error | Log to Sentry, notify ops team |
| **500 Database insert fails** | Postgres connection issue | Data loss risk | Log to Sentry, retry (idempotent) |

**Key: All errors return 500 with user-friendly message. Never expose internal details.**

---

## 5. Data Flow Diagram (ASCII)

```
┌──────────────────────────────────────────────────────────────────┐
│                        VERCEL (Serverless)                       │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ POST /api/analyze                                         │  │
│  │ ├─ Parse JWT                                              │  │
│  │ ├─ Get signed URL from Supabase Storage                   │  │
│  │ ├─ Call RunPod LLM (blocking, 4.5s)                       │  │
│  │ ├─ Validate JSON response                                 │  │
│  │ └─ Insert artwork + discovery_dots                        │  │
│  └──────────────────┬────────────────────────────────────────┘  │
└─────────────────────┼───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
    ┌────────┐   ┌─────────┐   ┌──────────────┐
    │ Supabase│   │ RunPod  │   │ Supabase     │
    │ Storage │   │ LLM API │   │ Postgres     │
    │ (get    │   │ (image  │   │ (write       │
    │ signed  │   │ analysis)   │ metadata)    │
    │ URL)    │   │         │   │              │
    └────────┘   └─────────┘   └──────────────┘
        │             │             │
        │ signed URL  │             │
        ├─────────→   │             │
        │         image_url         │
        │         ──────────→       │
        │                           │
        │         JSON response     │
        │         ←──────────       │
        │                           │
        │         INSERT artwork    │
        │         ──────────────→   │
        │         INSERT dots       │
        │         ──────────────→   │
        │                           │
        └─────────────────────────→ JSON rows
                (return artwork ID)
```

---

## 6. Data Structure in Supabase (Final State)

After `/api/analyze` completes, here's what's stored:

### **artwork table**
```sql
-- Single row for "Gato Cubista"
SELECT * FROM artwork WHERE id = 'artwork-uuid-67890';

id                    | artwork-uuid-67890
user_id               | user-uuid-12345
file_path             | assets/art/gato-cubista.jpeg
file_size_bytes       | 1507382
title                 | Gato Cubista
description           | Miguel's brave exploration...
palette               | ["#c41e3a", "#4a90e2", ...]
animation_hint        | spin
artist_name           | Miguel
child_age             | 5
created_at            | 2026-05-29T10:30:00Z
updated_at            | 2026-05-29T10:30:00Z
```

### **discovery_dots table**
```sql
-- 3 rows (hotspots)
SELECT * FROM discovery_dots WHERE artwork_id = 'artwork-uuid-67890';

id              | dot-uuid-1              | dot-uuid-2              | dot-uuid-3
artwork_id      | artwork-uuid-67890      | artwork-uuid-67890      | artwork-uuid-67890
x_percent       | 35                      | 65                      | 45
y_percent       | 45                      | 60                      | 25
description     | Notice sharp angles...  | Red makes blue pop...   | Geometric shapes...
audio_url       | NULL (not yet recorded) | NULL                    | NULL
audio_duration  | NULL                    | NULL                    | NULL
created_at      | 2026-05-29T10:30:00Z    | 2026-05-29T10:30:00Z    | 2026-05-29T10:30:00Z
```

**Later, when user records audio:**
```sql
-- User taps dot 1, records 8-second audio clip
UPDATE discovery_dots
SET 
  audio_url = 'https://supabase.storage/.../dot-uuid-1.webm',
  audio_duration = 8
WHERE id = 'dot-uuid-1';
```

---

## 7. Vercel vs. Self-Hosted API Comparison

| Aspect | Vercel | AWS Lambda | Self-Hosted |
|--------|--------|-----------|------------|
| **Setup time** | 5 minutes | 1 hour | 1 week |
| **Scaling** | Auto | Manual | Manual |
| **Cost at 100 users** | $20/mo | $5/mo | $500+/mo (server) |
| **Cost at 10K users** | $30/mo | $50/mo | $500+/mo |
| **Cold start** | 500ms | 1-2s | 0ms (always warm) |
| **Maintenance** | None | Minimal | High |
| **Integration with Next.js** | Native | Via API Gateway | Custom setup |

**Vercel is 100% the right choice for FMB.**

---

## 8. Monitoring & Observability

### **What to monitor?**

```typescript
// Add monitoring to /api/analyze

import * as Sentry from "@sentry/nextjs";
import { performance } from "perf_hooks";

export async function POST(req: NextRequest) {
  const startTime = performance.now();

  try {
    // Track each step
    const authStart = performance.now();
    const decoded = await supabase.auth.admin.verifyJWT(token);
    Sentry.captureMessage("Auth verified", {
      level: "debug",
      contexts: {
        performance: {
          auth_duration_ms: performance.now() - authStart,
        },
      },
    });

    // Track RunPod call
    const runpodStart = performance.now();
    const runpodRes = await fetch(/* ... */);
    const runpodDuration = performance.now() - runpodStart;
    
    Sentry.captureMessage("LLM call completed", {
      level: "debug",
      contexts: {
        performance: {
          llm_duration_ms: runpodDuration,
          runpod_status: runpodRes.status,
        },
      },
    });

    // Track database writes
    const dbStart = performance.now();
    await supabase.from("artwork").insert({...});
    const dbDuration = performance.now() - dbStart;
    
    Sentry.captureMessage("Database writes completed", {
      level: "debug",
      contexts: {
        performance: {
          db_duration_ms: dbDuration,
        },
      },
    });

    const totalDuration = performance.now() - startTime;
    
    // Success metric
    Sentry.captureMessage("Upload analysis succeeded", {
      level: "info",
      tags: {
        event: "analysis_complete",
      },
      contexts: {
        performance: {
          total_duration_ms: totalDuration,
          auth: authDuration,
          llm: runpodDuration,
          db: dbDuration,
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    const totalDuration = performance.now() - startTime;
    
    Sentry.captureException(error, {
      tags: {
        event: "analysis_failed",
      },
      contexts: {
        performance: {
          failed_after_ms: totalDuration,
        },
      },
    });

    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
```

### **Metrics to track**

```
Dashboard: "API Analysis Performance"

1. P50/P95/P99 latency
   ├─ Goal: P95 < 10 seconds
   ├─ Red alert: P95 > 30 seconds
   └─ Breakdown: auth (10ms), LLM (5s), DB (50ms)

2. Error rate
   ├─ Goal: < 1% errors
   ├─ Track by error type: auth, LLM, DB, validation
   └─ Alert: Error rate > 5% for 5 minutes

3. RunPod API cost per request
   ├─ Expected: $0.00225 per analysis
   ├─ Alert: Cost > $0.01 per request (means inference is slow)
   └─ Calculate: (RunPod charges) / (analyses count)

4. Concurrent requests
   ├─ Track: Active function executions
   ├─ Monitor: Vercel auto-scaling in action
   └─ Alert: >100 concurrent (means load spike)
```

---

## Summary: Can Vercel Handle It?

| Question | Answer | Notes |
|----------|--------|-------|
| **Can Vercel orchestrate API calls?** | ✅ YES | Perfect for this |
| **Is 60s timeout enough?** | ✅ YES | Takes ~4.8s, 12x margin |
| **Can it scale to 10K users?** | ✅ YES | Auto-scales, no changes needed |
| **Is the cost acceptable?** | ✅ YES | $30-50/mo, 98%+ margin |
| **Will image optimization work?** | ✅ YES | Sharp library built-in |
| **Can it handle concurrent uploads?** | ✅ YES | Vercel handles unlimited concurrent |
| **Is monitoring/debugging easy?** | ✅ YES | Sentry integration native |

---

## Next Steps

1. **Set up Sentry for error tracking**
   ```
   npm install @sentry/nextjs
   // Initialize in next.config.js
   ```

2. **Create monitoring dashboard**
   - Sentry dashboard for errors
   - Simple spreadsheet for costs (RunPod usage)

3. **Test locally first**
   - Mock RunPod responses
   - Verify validation schema
   - Check database structure

4. **Deploy to Vercel**
   - Set environment variables (API keys)
   - Test with 10 real images
   - Compare LLM output to Claude Vision

