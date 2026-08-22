---
title: Upload Flow, Audio & Storage (proposed)
status: reference
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: 90d
related: [docs/decisions/0007-audio-discovery-dots.md, docs/product/PLAN.md]
---

> **Status: reference.** The most directly actionable of the engineering docs: §1 specifies
> audio discovery dots ([ADR-0007](../decisions/0007-audio-discovery-dots.md)) and §2 the
> upload flow (PLAN **UPL-01…11**; the old P2-01…07 IDs are retired, mapping in PLAN §6). Written assuming Supabase; the audio design largely carries
> over to the static architecture too.

# FMB · ART: Upload Flow, Audio Integration & Storage Strategy

**Focus:** Complete data flow from upload → analysis → storage → print fulfillment

---

## 1. Voice Recording Integration (The Killer Feature)

### **What Are Audio Discovery Dots?**

When a parent or child uploads an artwork, they can:
1. Click on **hotspots** on the image (x, y coordinates)
2. Record a **10-15 second audio clip** explaining that hotspot
3. When visitors view the gallery, they tap the dot → plays the audio

**Example:**
- Artwork: "Gato Cubista" (Miguel's cubist cat)
- Audio dot 1 (top-left): "I made the red part because I like red" (8 seconds)
- Audio dot 2 (center): "These are the cat's eyes but I made them different" (12 seconds)
- Audio dot 3 (bottom-right): "The blue is the background and it makes red look brighter" (10 seconds)

**Emotional impact:** Hearing the child's own voice explaining their art creates an **unbreakable connection**. This is your moat.

---

### **Technical Implementation**

#### **Frontend: Recording & Storage**

```typescript
// components/AudioRecorder.tsx
import { useEffect, useRef, useState } from "react";
import RecordRTC from "recordrtc";

interface AudioDot {
  id: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  audioFile?: Blob; // Not yet uploaded
  audioUrl?: string; // URL after upload to Supabase
  transcript?: string; // Transcription (optional, Phase 2)
  duration: number; // seconds
}

export function AudioRecorder({ dot, artworkId, onAudioSaved }: {
  dot: AudioDot;
  artworkId: string;
  onAudioSaved: (dot: AudioDot) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const recorderRef = useRef<RecordRTC | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    recorderRef.current = new RecordRTC(stream, {
      type: "audio",
      mimeType: "audio/webm",
      recorderType: RecordRTC.StereoAudioRecorder,
      numberOfAudioChannels: 1,
      desiredSampleRate: 44100,
    });

    recorderRef.current.startRecording();
    setRecording(true);
    setDuration(0);

    // Auto-stop after 15 seconds
    timerRef.useRef = setTimeout(() => stopRecording(), 15000);

    // Update timer
    timerRef.current = setInterval(() => {
      setDuration(d => {
        if (d >= 15) stopRecording();
        return d + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (!recorderRef.current) return;

    recorderRef.current.stopRecording(() => {
      const audioBlob = recorderRef.current!.getBlob();
      
      // Upload to Supabase Storage
      uploadAudio(audioBlob, artworkId, dot.id);
    });

    setRecording(false);
    clearInterval(timerRef.current!);
  };

  const uploadAudio = async (audioBlob: Blob, artworkId: string, dotId: string) => {
    // Call Vercel API to upload audio
    const formData = new FormData();
    formData.append("audio", audioBlob);
    formData.append("artworkId", artworkId);
    formData.append("dotId", dotId);

    const response = await fetch("/api/upload-audio", {
      method: "POST",
      body: formData,
    });

    const { audioUrl } = await response.json();

    // Update local state
    onAudioSaved({
      ...dot,
      audioUrl,
      duration,
    });
  };

  return (
    <div className="audio-recorder">
      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? (
          <>🔴 Recording ({duration}s / 15s)</>
        ) : (
          <>🎤 Record audio for this dot</>
        )}
      </button>
      {duration > 0 && <p>{duration}s recorded</p>}
    </div>
  );
}
```

#### **Vercel API: Audio Upload Handler**

```typescript
// /api/upload-audio
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audioBlob = formData.get("audio") as Blob;
  const artworkId = formData.get("artworkId") as string;
  const dotId = formData.get("dotId") as string;

  // Verify user is authenticated
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Initialize Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify ownership of artwork
  const { data: artwork } = await supabase
    .from("artwork")
    .select("id, user_id")
    .eq("id", artworkId)
    .single();

  // Verify artwork belongs to authenticated user
  const decoded = await supabase.auth.admin.verifyJWT(token);
  if (artwork.user_id !== decoded.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Upload to Supabase Storage (audio-discovery-dots bucket)
  const fileName = `${artworkId}/${dotId}.webm`;
  const { error: uploadError } = await supabase.storage
    .from("audio-discovery-dots")
    .upload(fileName, audioBlob, {
      contentType: "audio/webm",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  // Get signed URL (valid for 1 year)
  const { data } = supabase.storage
    .from("audio-discovery-dots")
    .getPublicUrl(fileName);

  // Update artwork metadata in Postgres
  await supabase
    .from("artwork")
    .update({
      discovery_dots: supabase.rpc("update_discovery_dot_audio", {
        artwork_id: artworkId,
        dot_id: dotId,
        audio_url: data.publicUrl,
      }),
    })
    .eq("id", artworkId);

  return NextResponse.json({ audioUrl: data.publicUrl });
}
```

#### **Database: Discovery Dots Structure**

```sql
-- In Supabase Postgres

CREATE TABLE discovery_dots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artwork(id) ON DELETE CASCADE,
  x_percent FLOAT NOT NULL, -- 0-100
  y_percent FLOAT NOT NULL, -- 0-100
  description TEXT NOT NULL, -- "Notice the sharp angles..."
  audio_url TEXT, -- Signed URL to Supabase Storage (WebM)
  audio_duration INT, -- seconds
  transcript TEXT, -- Optional: transcription for accessibility
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for queries
CREATE INDEX idx_artwork_id ON discovery_dots(artwork_id);
```

#### **Gallery Display: Playing Audio**

```typescript
// components/DiscoveryDot.tsx
import { useRef, useState } from "react";

export function DiscoveryDot({ dot }: { dot: DiscoveryDotData }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div
      className="discovery-dot"
      style={{
        left: `${dot.x_percent}%`,
        top: `${dot.y_percent}%`,
      }}
      onClick={togglePlayback}
    >
      {/* Visual indicator when audio is present */}
      {dot.audio_url && (
        <div className={`audio-indicator ${isPlaying ? 'playing' : ''}`}>
          🔊
        </div>
      )}

      {/* Hidden audio element */}
      {dot.audio_url && (
        <audio
          ref={audioRef}
          src={dot.audio_url}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Text fallback */}
      <p className="dot-description">{dot.description}</p>
    </div>
  );
}
```

### **Audio Storage Details**

| Aspect | Detail |
|--------|--------|
| **Format** | WebM (browser-native, ~50KB per 10s) |
| **Storage** | Supabase Storage (`audio-discovery-dots` bucket) |
| **Lifetime** | Permanent (part of artwork archive) |
| **Access** | Public signed URLs (valid 1 year, then auto-refresh) |
| **Backup** | Automatic via Supabase backup policy |
| **Cost** | $0.10/GB/month (Supabase Storage, ~10 audio files = 0.5MB) |

**Example storage structure:**
```
audio-discovery-dots/
├── artwork-uuid-1/
│   ├── dot-uuid-1.webm (8 seconds, 50KB)
│   ├── dot-uuid-2.webm (12 seconds, 75KB)
│   └── dot-uuid-3.webm (10 seconds, 65KB)
├── artwork-uuid-2/
│   └── ...
```

---

## 2. Complete Upload → Analysis Flow

### **High-Level Data Flow**

```
STEP 1: Upload
┌──────────────────────────────────────────────────┐
│ User opens FMB app → "Upload Artwork"            │
│ • Select photo (HEIC, JPG, PNG)                 │
│ • App client-side validates (< 10MB)            │
│ • Vercel receives file                          │
│ • Vercel saves to Supabase Storage              │
│ • Returns signed URL                            │
└──────────────────────────────────────────────────┘
                    ↓
STEP 2: Optimize Image
┌──────────────────────────────────────────────────┐
│ Vercel API calls optimize.js script             │
│ • Auto-rotate (EXIF)                            │
│ • Resize to ≤ 3000px (print quality)            │
│ • Compress with MozJPEG (q=78)                  │
│ • Save optimized version back to Storage        │
│ └─→ Output: optimized.jpeg (~500KB-1.5MB)      │
└──────────────────────────────────────────────────┘
                    ↓
STEP 3: Send to Fine-Tuned LLM
┌──────────────────────────────────────────────────┐
│ Vercel API orchestrates analysis:               │
│ • Get signed URL for optimized image            │
│ • POST to RunPod vLLM endpoint                  │
│ • Payload: { image_url, prompt, model_name }   │
│ • Timeout: 30 seconds                           │
│ • Response: JSON metadata                       │
└──────────────────────────────────────────────────┘
                    ↓
STEP 4: Parse & Validate JSON
┌──────────────────────────────────────────────────┐
│ Vercel API receives:                            │
│ {                                               │
│   "title": "Gato Cubista",                      │
│   "description": "Miguel's exploration...",     │
│   "palette": ["#c41e3a", "#4a90e2", ...],      │
│   "animation_hint": "spin",                     │
│   "discovery_points": [                         │
│     {"text": "...", "position": "35,45"}        │
│   ]                                             │
│ }                                               │
│ • Validate JSON schema                          │
│ • Check palette is valid hex codes              │
│ • Check discovery points are within 0-100%      │
└──────────────────────────────────────────────────┘
                    ↓
STEP 5: Store in Database
┌──────────────────────────────────────────────────┐
│ Vercel inserts into Supabase Postgres:          │
│ • artwork record (metadata, analysis)           │
│ • discovery_dots records (hotspots)             │
│ • user_artwork relationship                     │
│ • created_at timestamp                          │
└──────────────────────────────────────────────────┘
                    ↓
STEP 6: Return to Frontend
┌──────────────────────────────────────────────────┐
│ Frontend receives success response               │
│ • Gallery re-renders with new artwork           │
│ • User can now record audio for discovery dots  │
│ • Can trigger animation preview                 │
└──────────────────────────────────────────────────┘
```

### **Detailed API Route: `/api/analyze`**

```typescript
// /api/analyze (Vercel serverless)
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Response schema from RunPod
const LLMResponseSchema = z.object({
  title: z.string().min(1).max(50),
  description: z.string().min(10).max(500),
  palette: z.array(z.string().regex(/^#[0-9a-f]{6}$/i)).length(6),
  animation_hint: z.enum([
    "spin",
    "float",
    "pulse",
    "shimmer",
    "breathe",
  ]),
  discovery_points: z.array(
    z.object({
      text: z.string().min(5).max(100),
      position: z.string().regex(/^\d{1,3},\d{1,3}$/), // "35,45"
    })
  ).min(3).max(4),
});

export async function POST(req: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. PARSE REQUEST
    const { imagePath, artistName, childAge } = await req.json();

    if (!imagePath) {
      return NextResponse.json(
        { error: "Missing imagePath" },
        { status: 400 }
      );
    }

    // 3. INITIALIZE SUPABASE
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify user
    const decoded = await supabase.auth.admin.verifyJWT(token);
    if (!decoded.sub) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 4. GET SIGNED URL FOR IMAGE
    const { data: signedUrlData } = await supabase.storage
      .from("artwork")
      .createSignedUrl(imagePath, 3600); // Valid for 1 hour

    if (!signedUrlData?.signedUrl) {
      return NextResponse.json(
        { error: "Failed to get signed URL" },
        { status: 500 }
      );
    }

    // 5. CALL RUNPOD LLM
    const runpodResponse = await fetch(
      `${process.env.RUNPOD_ENDPOINT_URL}/analyze`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RUNPOD_API_KEY}`,
        },
        body: JSON.stringify({
          image_url: signedUrlData.signedUrl,
          prompt: `You are a museum curator for children's artwork. Analyze this artwork and provide:
1. A celebratory title (1-3 words)
2. A description (2-3 sentences) that celebrates the child's artistic choices and what you notice
3. A palette of 6 hex colors sorted by dominance
4. Animation hint (one of: spin, float, pulse, shimmer, breathe)
5. 3-4 discovery points (interesting things to point out)

Return ONLY valid JSON matching this structure:
{
  "title": "string",
  "description": "string",
  "palette": ["#hex1", "#hex2", ...],
  "animation_hint": "string",
  "discovery_points": [{"text": "string", "position": "x,y"}]
}`,
          model: "llava-next-13b-lora", // Fine-tuned version
        }),
        timeout: 30000, // 30 second timeout
      }
    );

    if (!runpodResponse.ok) {
      const error = await runpodResponse.text();
      console.error("RunPod error:", error);
      return NextResponse.json(
        { error: "LLM analysis failed" },
        { status: 500 }
      );
    }

    const llmData = await runpodResponse.json();

    // 6. VALIDATE LLM RESPONSE
    let metadata;
    try {
      metadata = LLMResponseSchema.parse(llmData);
    } catch (validationError) {
      console.error("Validation error:", validationError);
      return NextResponse.json(
        { error: "Invalid response from LLM" },
        { status: 500 }
      );
    }

    // 7. CREATE ARTWORK RECORD
    const { data: artwork, error: insertError } = await supabase
      .from("artwork")
      .insert({
        user_id: decoded.sub,
        file_path: imagePath,
        file_size_bytes: 0, // Will update from storage metadata
        title: metadata.title,
        description: metadata.description,
        palette: metadata.palette,
        animation_hint: metadata.animation_hint,
        artist_name: artistName,
        child_age: childAge,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save artwork" },
        { status: 500 }
      );
    }

    // 8. CREATE DISCOVERY DOT RECORDS
    const discoveryDots = metadata.discovery_points.map((point) => ({
      artwork_id: artwork.id,
      x_percent: parseInt(point.position.split(",")[0]),
      y_percent: parseInt(point.position.split(",")[1]),
      description: point.text,
    }));

    await supabase.from("discovery_dots").insert(discoveryDots);

    // 9. RETURN SUCCESS
    return NextResponse.json(
      {
        success: true,
        artwork: {
          id: artwork.id,
          title: metadata.title,
          description: metadata.description,
          palette: metadata.palette,
          animation_hint: metadata.animation_hint,
          discovery_points: metadata.discovery_points,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### **Frontend: Upload Component**

```typescript
// components/UploadArtwork.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";

export function UploadArtwork() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [artistName, setArtistName] = useState("");
  const [childAge, setChildAge] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // STEP 1: Upload to Supabase Storage
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", `${Date.now()}-${file.name}`);

      const uploadRes = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      const { imagePath } = await uploadRes.json();

      // STEP 2: Trigger analysis
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imagePath,
          artistName,
          childAge: parseInt(childAge),
        }),
      });

      if (!analyzeRes.ok) {
        throw new Error("Analysis failed");
      }

      const { artwork } = await analyzeRes.json();

      // STEP 3: Redirect to artwork detail page
      router.push(`/artwork/${artwork.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="upload-form">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        disabled={loading}
      />
      <input
        type="text"
        placeholder="Child's name"
        value={artistName}
        onChange={(e) => setArtistName(e.target.value)}
        disabled={loading}
      />
      <input
        type="number"
        placeholder="Age"
        value={childAge}
        onChange={(e) => setChildAge(e.target.value)}
        min="2"
        max="18"
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Analyzing..." : "Upload & Analyze"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

### **Latency & Performance**

| Step | Time | Notes |
|------|------|-------|
| File upload | 1-5s | Depends on file size + user bandwidth |
| Image optimization | 5-10s | MozJPEG compression on Vercel |
| RunPod inference | 3-5s | LLaVA-NeXT + fine-tuned LoRA |
| Database writes | <1s | Postgres + indexes |
| **Total E2E** | **9-21s** | User sees success screen, gallery updates |

**User experience:**
- Upload starts, shows progress bar
- "Analyzing..." spinner while RunPod processes
- Gallery updates with animation on success
- User can then record audio for discovery dots

---

## 3. Image Storage & Print-On-Demand Strategy

### **Critical Question: Where Are Images Stored?**

You need **multiple versions** of each image:

| Version | Size | Purpose | Storage | Cost |
|---------|------|---------|---------|------|
| **Archive Master** | 3000×3000px JPEG | Print quality, high-res backup | Supabase Storage | $0.10/GB/mo |
| **Web Display** | 1200×1200px WEBP | Gallery gallery, fast loading | Vercel CDN | Included |
| **Thumbnail** | 400×400px WEBP | Grid previews | Vercel CDN | Included |
| **Optimized** | ≤2MB JPEG | LLM analysis, fast | Supabase Storage | $0.10/GB/mo |

### **Storage Architecture**

```
Supabase Storage Structure:
┌─ artwork/ (primary archive)
│  ├─ user-uuid-1/
│  │  ├─ gato-cubista-master.jpeg (3000×3000, 2.5MB)
│  │  └─ gato-cubista-optimized.jpeg (1500×1500, 500KB)
│  └─ user-uuid-2/
│     └─ ...
│
└─ artwork-backups/ (automated backup)
   ├─ 2026-05-29/
   │  ├─ gato-cubista-master.jpeg
   │  └─ ...
   └─ 2026-06-05/
      └─ ...
```

**Why multiple versions?**

1. **Master (3000px):** Preserves original quality. If print demand increases, you have raw material for high-quality prints.
2. **Optimized (1500px):** What you send to the LLM (smaller = faster inference + lower bandwidth cost)
3. **Web thumbnails (400px):** Gallery previews (cached by Vercel CDN, ultra-fast)

### **Image Storage Costs at Different Scales**

**Assumptions:**
- Average artwork: 2.5MB master + 500KB optimized = 3MB per artwork
- 100 users × 20 artworks/year = 2,000 artworks/year
- 2,000 artworks × 3MB = 6GB/year

| Scale | Artworks/Year | Storage/Month | Cost/Month | Annual Cost |
|-------|---------------|---------------|-----------|------------|
| **100 users (Phase 1)** | 2,000 | 6GB | $0.60 | $7 |
| **1,000 users (Phase 2)** | 20,000 | 60GB | $6 | $72 |
| **10,000 users (Phase 3)** | 200,000 | 600GB | $60 | $720 |

**Backup strategy:**
- Supabase auto-backs up to S3 (included in Pro tier, $25/mo)
- Manual backup to AWS S3 Glacier (long-term, $0.004/GB/mo for deep archive)

---

### **Print-On-Demand: Image Requirements**

This is crucial. Your stored images **must** meet print specs:

#### **For Physical Books (Museum Book)**

```
Required specs:
• Minimum resolution: 1200×1200px @ 300 DPI
• Your 3000×3000px master ✅ exceeds this
• File format: JPEG (sRGB color profile)
• Color space: sRGB (web safe)

Example: Museum Book page layout
┌─────────────────────────────┐
│                             │
│     Artwork Image           │  ← 6×8 inches @ 300 DPI = 1800×2400px
│    (center, bleed)          │
│                             │
├─────────────────────────────┤
│ Title: Gato Cubista         │  ← Dynamic text from metadata
│ by Miguel, age 5, 2026      │
│                             │
│ Description: Miguel's brave │  ← Auto-generated description
│ exploration of abstraction  │
│ transforms a familiar...    │
└─────────────────────────────┘

Print cost (via Printful or Gelato):
• 200-page hardcover: $25-35 production cost
• Retail price: $80-120
• Your margin: $45-95 per book
```

#### **For Framed Prints (Giclée)**

```
Required specs:
• Minimum resolution: 2400×3000px @ 300 DPI (for 8×10 print)
• Your 3000×3000px master ✅ can handle 10×10 max

Giclée print specs:
┌──────────────────────────┐
│                          │
│    Artwork (100%)        │  ← Full image, museum quality
│                          │
├──────────────────────────┤
│   NFC-enabled title card │  ← Links to digital animation
│   "Gato Cubista"         │
│   Miguel, age 5, 2026    │
└──────────────────────────┘

Print cost (via Printful):
• 8×10 Giclée print: $15-20 production
• NFC title card: $0.50-1.00 production
• Retail price: $49-79
• Your margin: $30-65 per print
```

### **Image Delivery Pipeline (Vercel → Print)**

```
When user orders a print:

1. User selects artwork → clicks "Print This"
   ↓
2. Vercel API fetches master image from Supabase Storage
   ├─ GET /artwork/user-uuid/gato-cubista-master.jpeg
   └─ File: 3000×3000px, 2.5MB
   ↓
3. Vercel resizes to print spec (e.g., 2400×2400 @ 300 DPI for 8×8)
   ├─ Use Sharp library (Node.js image processing)
   └─ Output: Print-ready JPEG + color profile
   ↓
4. Send to POD provider API (Printful/Gelato)
   ├─ POST /api/print-orders
   ├─ Body: { image_url, product_id, shipping_address, etc. }
   └─ Provider returns order confirmation + tracking
   ↓
5. Printful manufactures + ships
   ├─ Quality check, color matching
   └─ Delivery to customer
   ↓
6. Webhook: Printful → Vercel → Supabase
   ├─ Update order status in DB
   ├─ Email customer with tracking
   └─ Record fulfillment metrics
```

### **POD Integration: API Example**

```typescript
// /api/create-print-order (Vercel)
import Printful from "printful-sdk"; // Placeholder library
import sharp from "sharp";

export async function POST(req: NextRequest) {
  const { artworkId, productType, size } = await req.json();

  // 1. Fetch artwork master image
  const { data: artwork } = await supabase
    .from("artwork")
    .select("file_path, title, palette")
    .eq("id", artworkId)
    .single();

  // 2. Get signed URL
  const { data: signedUrl } = await supabase.storage
    .from("artwork")
    .createSignedUrl(artwork.file_path, 3600);

  // 3. Download image
  const imageBuffer = await fetch(signedUrl.signedUrl).then(r => r.buffer());

  // 4. Resize for print (example: 8×10 @ 300 DPI = 2400×3000px)
  const printReady = await sharp(imageBuffer)
    .resize(2400, 3000, {
      fit: "cover",
      position: "center",
    })
    .withMetadata() // Preserve color profile
    .jpeg({ quality: 95 })
    .toBuffer();

  // 5. Create Printful order
  const printful = new Printful({
    apiKey: process.env.PRINTFUL_API_KEY,
  });

  const order = await printful.createOrder({
    external_id: artworkId,
    items: [
      {
        product_id: getProductId(productType, size),
        variant_id: getVariantId(size),
        quantity: 1,
        files: [
          {
            url: `data:image/jpeg;base64,${printReady.toString("base64")}`,
            type: "front",
          },
        ],
      },
    ],
    shipping: "STANDARD",
    address: {
      name: req.user.name,
      address1: req.user.address1,
      // ... full address
    },
  });

  // 6. Store order in database
  await supabase.from("orders").insert({
    artwork_id: artworkId,
    external_id: order.id,
    user_id: req.user.id,
    product_type: productType,
    status: "pending",
    created_at: new Date(),
  });

  // 7. Return confirmation
  return NextResponse.json({
    success: true,
    order_id: order.id,
    estimated_delivery: order.estimated_delivery_date,
  });
}
```

### **Storage Costs by Phase**

| Phase | Users | Artworks/Year | Storage | Cost | Print Revenue Potential |
|-------|-------|---------------|---------|------|----------------------|
| **Phase 1** | 100 | 2,000 | 6GB | $7/mo | Low (beta only) |
| **Phase 2** | 1,000 | 20,000 | 60GB | $60/mo | $100K-300K/year* |
| **Phase 3** | 10,000 | 200,000 | 600GB | $600/mo | $1M-3M/year* |

**\* Print revenue potential calculation:**
- 10% of users order 1 print/year
- 10,000 users × 10% × $50 margin = $500K/year
- Scale to $1M+ with books, multiple prints

---

## 4. Complete Database Schema

```sql
-- artwork table
CREATE TABLE artwork (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- File references
  file_path TEXT NOT NULL, -- s3 path in Supabase Storage
  file_size_bytes INT,
  file_format TEXT, -- jpeg, webp, etc.
  
  -- Metadata (from LLM)
  title TEXT NOT NULL,
  description TEXT,
  palette TEXT[], -- Array of hex colors
  animation_hint TEXT,
  
  -- Context
  artist_name TEXT,
  child_age INT,
  year_created INT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexing
  CONSTRAINT valid_child_age CHECK (child_age BETWEEN 2 AND 18)
);

-- discovery_dots table (hotspots with audio)
CREATE TABLE discovery_dots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artwork(id) ON DELETE CASCADE,
  
  x_percent FLOAT CHECK (x_percent BETWEEN 0 AND 100),
  y_percent FLOAT CHECK (y_percent BETWEEN 0 AND 100),
  
  -- Text description
  description TEXT NOT NULL,
  
  -- Audio (10-15 seconds)
  audio_url TEXT, -- Signed URL to Supabase Storage
  audio_duration INT, -- seconds
  
  -- Optional accessibility
  transcript TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- orders table (print orders)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artwork(id),
  user_id UUID REFERENCES auth.users(id),
  
  external_id TEXT, -- Printful order ID
  product_type TEXT, -- book, print, frame, etc.
  
  status TEXT, -- pending, completed, shipped, etc.
  
  price_total DECIMAL(10, 2),
  margin DECIMAL(10, 2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_artwork_user ON artwork(user_id);
CREATE INDEX idx_discovery_artwork ON discovery_dots(artwork_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_artwork ON orders(artwork_id);
```

---

## Summary: Upload → Storage → Print

| Step | Technology | Storage | Cost |
|------|-----------|---------|------|
| 1. User uploads photo | Vercel form → Supabase Storage | 3000px master | $0.10/GB |
| 2. Optimize (resize, compress) | Node.js Sharp | 1500px optimized | $0.10/GB |
| 3. Send to LLM | RunPod API | Signed URL | $0 (bandwidth free) |
| 4. Store metadata | Supabase Postgres | Title, palette, dots | Included |
| 5. Record audio hotspots | Web Audio API | WebM 10-15s clips | $0.10/GB |
| 6. Display in gallery | Next.js Image + CDN | Vercel CDN cached | Included |
| 7. Order print | Printful API | Print-ready JPEG | Printful handles |
| **TOTAL** | | **6GB/100 users** | **$1/user/year** |

**Key insight for print fulfillment:** Storing the high-res master (3000px) enables future physical products without re-asking users for images.

