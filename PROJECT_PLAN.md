# 🚀 Bloggy — AI Blog Generation Engine

## Prompt & Profit - Bizmark'26 Hackathon

> **Mission**: Build a scalable AI-powered blog generation engine that converts keyword intent into high-ranking, GEO-optimized, conversion-focused blogs — with a dashboard inspired by Blogy.in.

**Tech Stack**: Next.js 14 (App Router) · Gemini API · Firebase (Auth + Firestore + Storage) · Tailwind CSS

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │Dashboard │ │Blog Gen  │ │SEO Tools │ │Publishing Hub │  │
│  │& Analytics│ │  Engine  │ │& Scoring │ │  (Multi-Plat) │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬────────┘  │
│       └─────────────┴────────────┴──────────────┘           │
│                           │ API Routes                      │
├───────────────────────────┼─────────────────────────────────┤
│                      BACKEND (API)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │Prompt    │ │SEO       │ │Content   │ │Platform       │  │
│  │Orchestr. │ │Analyzer  │ │Pipeline  │ │Connectors     │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬────────┘  │
│       └─────────────┴────────────┴──────────────┘           │
├─────────────────────────────────────────────────────────────┤
│                    EXTERNAL SERVICES                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │Gemini API│ │Firebase  │ │DataForSEO│                    │
│  │          │ │Auth+DB   │ │(optional)│                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Project Structure

```
bloggy/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with sidebar
│   ├── page.tsx                  # Landing / redirect
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── page.tsx              # Dashboard home (stats & charts)
│   │   ├── websites/page.tsx     # Website management
│   │   ├── blogs/page.tsx        # Blog list & management
│   │   ├── blogs/[id]/page.tsx   # Single blog editor
│   │   ├── generate/page.tsx     # AI Blog Generator (CORE)
│   │   ├── scheduling/page.tsx   # Blog scheduling
│   │   ├── analytics/page.tsx    # Traffic & SEO analytics
│   │   ├── seo-tools/page.tsx    # SEO scoring dashboard
│   │   ├── billing/page.tsx      # Plans & billing
│   │   └── settings/page.tsx     # Account settings
│   └── api/
│       ├── generate/
│       │   ├── keywords/route.ts         # Keyword research & clustering
│       │   ├── serp-analysis/route.ts    # SERP gap identification
│       │   ├── outline/route.ts          # Blog outline generation
│       │   ├── blog/route.ts             # Full blog generation
│       │   └── optimize/route.ts         # SEO optimization pass
│       ├── seo/
│       │   ├── score/route.ts            # SEO scoring
│       │   ├── audit/route.ts            # Full SEO audit
│       │   └── keywords/route.ts         # Keyword density check
│       ├── publish/
│       │   ├── route.ts                  # Publish to platforms
│       │   └── schedule/route.ts         # Schedule publishing
│       ├── analytics/route.ts            # Analytics data
│       ├── websites/route.ts             # Website CRUD
│       └── auth/[...nextauth]/route.ts   # Auth handling
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Table.tsx
│   │   ├── Chart.tsx
│   │   ├── Tabs.tsx
│   │   └── Skeleton.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx           # Dashboard sidebar nav
│   │   ├── Header.tsx            # Top bar with user/live status
│   │   └── Footer.tsx
│   ├── dashboard/
│   │   ├── StatsCards.tsx        # Total websites, blogs, etc.
│   │   ├── TrafficChart.tsx      # Traffic analytics chart
│   │   ├── MonthlyActivity.tsx   # Monthly blog generation chart
│   │   ├── RecentActivity.tsx    # Recent blog posts table
│   │   └── SystemHealth.tsx      # System health indicators
│   ├── blog/
│   │   ├── BlogEditor.tsx        # Rich text blog editor
│   │   ├── BlogPreview.tsx       # Live preview
│   │   ├── SEOScorePanel.tsx     # Real-time SEO score sidebar
│   │   └── KeywordHighlighter.tsx
│   ├── generate/
│   │   ├── KeywordInput.tsx      # Keyword input + suggestions
│   │   ├── PromptPipeline.tsx    # Visual pipeline steps
│   │   ├── GenerationProgress.tsx# Step-by-step progress
│   │   └── ContentPreview.tsx    # Generated content preview
│   └── seo/
│       ├── SEODashboard.tsx      # Overall SEO health
│       ├── KeywordDensity.tsx    # Keyword density visualizer
│       ├── ReadabilityScore.tsx  # Readability metrics
│       └── SnippetPreview.tsx    # Google snippet preview
├── lib/
│   ├── firebase/
│   │   ├── config.ts             # Firebase initialization
│   │   ├── auth.ts               # Auth helpers
│   │   └── db.ts                 # Firestore helpers
│   ├── gemini/
│   │   ├── client.ts             # Gemini API client
│   │   └── prompts/              # ALL PROMPT TEMPLATES
│   │       ├── keyword-research.ts
│   │       ├── serp-analysis.ts
│   │       ├── blog-outline.ts
│   │       ├── blog-generation.ts
│   │       ├── seo-optimization.ts
│   │       ├── humanizer.ts
│   │       └── meta-generation.ts
│   ├── seo/
│   │   ├── scorer.ts             # SEO scoring algorithm
│   │   ├── keyword-density.ts    # Keyword density calculator
│   │   ├── readability.ts        # Readability scoring (Flesch)
│   │   └── snippet-checker.ts    # Featured snippet eligibility
│   ├── publishers/
│   │   ├── base.ts               # Base publisher interface
│   │   ├── wordpress.ts          # WordPress REST API
│   │   ├── medium.ts             # Medium API
│   │   ├── linkedin.ts           # LinkedIn API
│   │   └── webhook.ts            # Custom webhook
│   └── utils/
│       ├── constants.ts
│       └── helpers.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useBlog.ts
│   ├── useSEO.ts
│   └── useGeneration.ts
├── types/
│   └── index.ts                  # All TypeScript interfaces
├── public/
│   └── assets/
├── .env.local
├── tailwind.config.ts
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## 🔥 Firebase Database Structure (Firestore)

```
firestore/
│
├── users/
│   └── {userId}/
│       ├── email: string
│       ├── displayName: string
│       ├── photoURL: string
│       ├── plan: "free" | "starter" | "builder" | "scale"
│       ├── createdAt: timestamp
│       ├── lastLoginAt: timestamp
│       └── settings: {
│             defaultLanguage: string,
│             defaultTone: string,
│             autoPublish: boolean,
│             notificationsEnabled: boolean
│           }
│
├── websites/
│   └── {websiteId}/
│       ├── userId: string (ref → users)
│       ├── name: string
│       ├── url: string
│       ├── platform: "wordpress" | "webflow" | "shopify" | "ghost" | "custom"
│       ├── apiKey: string (encrypted)
│       ├── apiEndpoint: string
│       ├── isConnected: boolean
│       ├── lastSyncAt: timestamp
│       ├── createdAt: timestamp
│       └── metadata: {
│             totalBlogs: number,
│             publishedBlogs: number,
│             monthlyTraffic: number
│           }
│
├── blogs/
│   └── {blogId}/
│       ├── userId: string (ref → users)
│       ├── websiteId: string (ref → websites)
│       ├── title: string
│       ├── slug: string
│       ├── content: string (HTML)
│       ├── contentMarkdown: string
│       ├── excerpt: string
│       ├── metaTitle: string
│       ├── metaDescription: string
│       ├── focusKeyword: string
│       ├── secondaryKeywords: string[]
│       ├── tags: string[]
│       ├── category: string
│       ├── featuredImage: string (URL)
│       ├── status: "draft" | "scheduled" | "published" | "failed"
│       ├── scheduledAt: timestamp | null
│       ├── publishedAt: timestamp | null
│       ├── publishedUrl: string | null
│       ├── publishedPlatforms: string[]
│       ├── createdAt: timestamp
│       ├── updatedAt: timestamp
│       ├── generationConfig: {
│       │     sourceKeyword: string,
│       │     intent: string,
│       │     tone: string,
│       │     length: "short" | "medium" | "long" | "pillar",
│       │     targetAudience: string,
│       │     language: string
│       │   }
│       └── seoScore: {
│             overall: number (0-100),
│             keywordDensity: number,
│             readabilityScore: number,
│             snippetReady: boolean,
│             titleScore: number,
│             metaScore: number,
│             headingStructure: number,
│             internalLinks: number,
│             contentLength: number,
│             aiDetection: number,
│             naturalness: number,
│             suggestions: string[]
│           }
│
├── keywords/
│   └── {keywordId}/
│       ├── userId: string
│       ├── keyword: string
│       ├── searchVolume: number
│       ├── difficulty: number (0-100)
│       ├── cpc: number
│       ├── intent: "informational" | "transactional" | "navigational" | "commercial"
│       ├── cluster: string
│       ├── relatedKeywords: string[]
│       ├── serpFeatures: string[]
│       ├── topCompetitors: { url: string, da: number, wordCount: number }[]
│       ├── contentGap: string[]
│       ├── createdAt: timestamp
│       └── lastUpdated: timestamp
│
├── schedules/
│   └── {scheduleId}/
│       ├── userId: string
│       ├── blogId: string (ref → blogs)
│       ├── websiteId: string
│       ├── scheduledAt: timestamp
│       ├── status: "pending" | "published" | "failed"
│       ├── retryCount: number
│       └── createdAt: timestamp
│
├── analytics/
│   └── {analyticsId}/
│       ├── userId: string
│       ├── websiteId: string
│       ├── blogId: string
│       ├── date: timestamp
│       ├── views: number
│       ├── clicks: number
│       ├── impressions: number
│       ├── avgPosition: number
│       ├── ctr: number
│       └── topQueries: { query: string, clicks: number, position: number }[]
│
└── auditLogs/
    └── {logId}/
        ├── userId: string
        ├── action: string
        ├── resource: string
        ├── resourceId: string
        ├── details: object
        └── timestamp: timestamp
```

---

## 🧠 PART 1: AI PROMPT ARCHITECTURE (The Engine Core)

### Prompt Flow Pipeline (6-Stage System)

```
[Seed Keyword] → Stage 1 → Stage 2 → Stage 3 → Stage 4 → Stage 5 → Stage 6
                   │          │          │          │          │          │
              Keyword     SERP Gap    Outline    Content    SEO       Human
              Cluster     Analysis    Builder    Generator  Optimizer  Naturalizer
```

---

### STAGE 1: Keyword Research & Clustering Prompt

```
SYSTEM PROMPT:
You are an expert SEO keyword strategist. Your task is to analyze a seed
keyword and produce a comprehensive keyword cluster with search intent
classification.

INPUT:
- Seed Keyword: {seedKeyword}
- Target Market: {targetMarket} (default: India)
- Industry/Niche: {niche}
- Language: {language} (default: English)

INSTRUCTIONS:
1. Generate 15-25 semantically related keywords for the seed keyword.
2. For each keyword, provide:
   - Search intent (informational / transactional / navigational / commercial)
   - Estimated search volume range (low/medium/high/very-high)
   - Keyword difficulty estimate (easy/medium/hard)
   - CPC potential (low/medium/high)
3. Group keywords into topical clusters (minimum 3 clusters).
4. Identify 1 primary keyword and 3-5 secondary keywords for the blog.
5. Suggest 3 long-tail keyword variations.
6. Identify LSI (Latent Semantic Indexing) keywords.

OUTPUT FORMAT (JSON):
{
  "primaryKeyword": {
    "keyword": "",
    "intent": "",
    "volume": "",
    "difficulty": ""
  },
  "secondaryKeywords": [...],
  "longTailKeywords": [...],
  "lsiKeywords": [...],
  "clusters": [
    {
      "clusterName": "",
      "keywords": [
        { "keyword": "", "intent": "", "volume": "", "difficulty": "" }
      ]
    }
  ],
  "contentStrategy": {
    "recommendedBlogType": "how-to | listicle | comparison | guide | case-study",
    "estimatedWordCount": "",
    "targetAudience": "",
    "contentAngle": ""
  }
}
```

---

### STAGE 2: SERP Gap Analysis Prompt

```
SYSTEM PROMPT:
You are an advanced SERP analyst. Analyze the competitive landscape for a
given keyword and identify content gaps and ranking opportunities.

INPUT:
- Primary Keyword: {primaryKeyword}
- Secondary Keywords: {secondaryKeywords}
- Niche: {niche}
- Target Country: {country}

INSTRUCTIONS:
1. Simulate analysis of top 10 SERP results for the primary keyword.
2. Identify common content patterns among top-ranking pages:
   - Average word count
   - Common heading structures (H2/H3 patterns)
   - FAQ sections presence
   - Media usage (images, videos, infographics)
   - Internal/external linking patterns
3. Identify content GAPS — topics/angles NOT covered by competitors.
4. Identify SERP features present (featured snippets, PAA, knowledge panel).
5. Recommend content differentiation strategy.
6. Assess featured snippet opportunity and format (paragraph/list/table).

OUTPUT FORMAT (JSON):
{
  "serpOverview": {
    "avgWordCount": 0,
    "avgHeadings": 0,
    "commonTopics": [],
    "serpFeatures": [],
    "difficultyAssessment": ""
  },
  "topCompetitors": [
    {
      "position": 1,
      "estimatedTitle": "",
      "estimatedWordCount": 0,
      "strengths": [],
      "weaknesses": []
    }
  ],
  "contentGaps": [
    {
      "gap": "",
      "opportunity": "",
      "implementation": ""
    }
  ],
  "snippetStrategy": {
    "eligible": true,
    "format": "paragraph | list | table",
    "targetQuery": "",
    "suggestedAnswer": ""
  },
  "differentiators": [],
  "recommendedApproach": ""
}
```

---

### STAGE 3: Blog Outline Generation Prompt

```
SYSTEM PROMPT:
You are an expert content architect. Create a comprehensive, SEO-optimized
blog outline that is structured to outrank existing SERP results and capture
featured snippets.

INPUT:
- Primary Keyword: {primaryKeyword}
- Secondary Keywords: {secondaryKeywords}
- LSI Keywords: {lsiKeywords}
- Content Gaps: {contentGaps} (from Stage 2)
- Blog Type: {blogType}
- Target Word Count: {wordCount}
- Tone: {tone} (professional / conversational / authoritative / casual)
- Target Audience: {audience}

INSTRUCTIONS:
1. Create a detailed blog outline with H1, H2, H3 heading hierarchy.
2. The H1 must contain the primary keyword naturally.
3. Include the primary keyword in at least 2 H2 headings.
4. Place secondary keywords in H2/H3 headings where natural.
5. Add a "Key Takeaways" or "TL;DR" section at the top.
6. Include a FAQ section (minimum 5 questions) — base on PAA data.
7. Plan for internal linking opportunities (suggest 3-5 anchor texts).
8. Plan content for featured snippet capture.
9. Include CTA placement strategy (top, middle, bottom).
10. Estimate word count per section.

OUTPUT FORMAT (JSON):
{
  "title": "",
  "metaTitle": "" (max 60 chars),
  "metaDescription": "" (max 155 chars),
  "slug": "",
  "outline": [
    {
      "type": "h2",
      "text": "",
      "keywords": [],
      "estimatedWords": 0,
      "subsections": [
        {
          "type": "h3",
          "text": "",
          "keywords": [],
          "estimatedWords": 0,
          "contentNotes": ""
        }
      ]
    }
  ],
  "tldr": [],
  "faq": [
    { "question": "", "answer": "" (2-3 sentences) }
  ],
  "internalLinks": [
    { "anchorText": "", "suggestedTarget": "" }
  ],
  "ctaPlacements": [
    { "position": "top | middle | bottom", "type": "soft | hard", "text": "" }
  ],
  "totalEstimatedWords": 0
}
```

---

### STAGE 4: Full Blog Content Generation Prompt

```
SYSTEM PROMPT:
You are a world-class SEO content writer. Write a comprehensive, engaging,
and fully SEO-optimized blog post based on the provided outline. The content
must read naturally — as if written by a human domain expert — while
maintaining optimal keyword placement for search engine ranking.

INPUT:
- Outline: {outline} (from Stage 3)
- Primary Keyword: {primaryKeyword}
- Secondary Keywords: {secondaryKeywords}
- LSI Keywords: {lsiKeywords}
- Tone: {tone}
- Target Audience: {audience}
- Brand Voice Guidelines: {brandVoice} (optional)

INSTRUCTIONS:
1. KEYWORD DENSITY RULES:
   - Primary keyword: 1.2-1.8% density (naturally placed)
   - Include primary keyword in: first 100 words, one H2, last paragraph
   - Secondary keywords: 0.5-0.8% each
   - LSI keywords: spread naturally throughout

2. CONTENT QUALITY RULES:
   - Write in an engaging, conversational-yet-authoritative tone
   - Use short paragraphs (2-4 sentences max)
   - Include transition words between sections (15%+ of sentences)
   - Use active voice (80%+ of sentences)
   - Vary sentence length (mix short punchy + longer explanatory)
   - Add real-world examples, analogies, or mini case studies
   - Include data points / statistics where relevant (cite sources)

3. SEO STRUCTURE RULES:
   - Follow the exact heading hierarchy from the outline
   - Write compelling H2/H3 headings (keyword-rich + curiosity-driven)
   - Include a table of contents at the top
   - Add alt-text suggestions for images [{imageAlt: "", placement: ""}]
   - Include schema markup suggestions (Article, FAQ, HowTo)

4. FEATURED SNIPPET OPTIMIZATION:
   - For definition queries: Start key section with "X is..."
   - For list queries: Use numbered/bulleted lists
   - For comparison: Use tables
   - Keep snippet-target answers under 45 words

5. ANTI-AI-DETECTION:
   - Vary sentence structure unpredictably
   - Include personal opinions / first-person perspectives
   - Use colloquialisms and idioms naturally
   - Add intentional stylistic variations
   - Reference current events or recent developments
   - Include anecdotal evidence and storytelling elements

6. GEO OPTIMIZATION (for AI Answer Engines):
   - Structure answers in clear, extractable formats
   - Use question-answer patterns for key sections
   - Include structured data opportunities
   - Write definitive, authoritative statements

OUTPUT FORMAT:
{
  "content": "" (full HTML blog content),
  "contentMarkdown": "" (full Markdown version),
  "wordCount": 0,
  "keywordPlacements": {
    "primary": { "count": 0, "density": 0.0, "positions": [] },
    "secondary": [{ "keyword": "", "count": 0, "density": 0.0 }]
  },
  "imageAltSuggestions": [{ "position": "", "altText": "", "caption": "" }],
  "schemaSuggestions": {
    "articleSchema": {},
    "faqSchema": {},
    "howToSchema": {} (if applicable)
  },
  "readabilityMetrics": {
    "fleschScore": 0,
    "avgSentenceLength": 0,
    "passiveVoicePercentage": 0,
    "transitionWordPercentage": 0
  }
}
```

---

### STAGE 5: SEO Optimization & Scoring Prompt

```
SYSTEM PROMPT:
You are a technical SEO auditor. Analyze the generated blog content and
provide a comprehensive SEO score with actionable improvements.

INPUT:
- Blog Content: {content} (from Stage 4)
- Primary Keyword: {primaryKeyword}
- Secondary Keywords: {secondaryKeywords}
- Meta Title: {metaTitle}
- Meta Description: {metaDescription}

INSTRUCTIONS:
Score each of the following on a 0-100 scale:

1. TITLE TAG ANALYSIS (10% weight)
   - Contains primary keyword? (within first 3 words preferred)
   - Length: 50-60 characters
   - Compelling / click-worthy
   - Power word usage

2. META DESCRIPTION (5% weight)
   - Contains primary keyword
   - Length: 120-155 characters
   - Includes CTA
   - Unique value proposition

3. KEYWORD OPTIMIZATION (20% weight)
   - Primary keyword density (ideal: 1.2-1.8%)
   - Keyword in first 100 words
   - Keyword in H2 heading(s)
   - Keyword in last paragraph
   - Keyword in URL/slug
   - Secondary keyword placement
   - LSI keyword spread

4. HEADING STRUCTURE (10% weight)
   - Single H1 with primary keyword
   - Logical H2/H3 hierarchy
   - Keywords in headings (natural)
   - Heading count appropriate for length

5. CONTENT QUALITY (20% weight)
   - Word count vs. competitor average
   - Paragraph length (2-4 sentences)
   - Sentence variety
   - Active vs. passive voice ratio
   - Transition words percentage (target: 30%+)
   - Reading ease (Flesch score target: 60-70)

6. FEATURED SNIPPET READINESS (10% weight)
   - Contains direct answer formats
   - Lists / tables / definitions present
   - Answer length optimization (<45 words)
   - Question-answer structure

7. INTERNAL LINKING (5% weight)
   - Number of internal link opportunities
   - Anchor text relevance
   - Link placement strategy

8. MEDIA OPTIMIZATION (5% weight)
   - Image alt-text present
   - Image placement strategy
   - Schema markup suggestions

9. GEO READINESS (10% weight)
   - Structured answer formats
   - Authoritative claim statements
   - Citation-worthy statistics
   - Entity optimization

10. AI NATURALNESS (5% weight)
    - Perplexity variance score
    - Burstiness score
    - Human-like patterns

OUTPUT FORMAT (JSON):
{
  "overallScore": 0,
  "breakdown": {
    "titleTag": { "score": 0, "issues": [], "fixes": [] },
    "metaDescription": { "score": 0, "issues": [], "fixes": [] },
    "keywordOptimization": { "score": 0, "issues": [], "fixes": [] },
    "headingStructure": { "score": 0, "issues": [], "fixes": [] },
    "contentQuality": { "score": 0, "issues": [], "fixes": [] },
    "snippetReadiness": { "score": 0, "issues": [], "fixes": [] },
    "internalLinking": { "score": 0, "issues": [], "fixes": [] },
    "mediaOptimization": { "score": 0, "issues": [], "fixes": [] },
    "geoReadiness": { "score": 0, "issues": [], "fixes": [] },
    "aiNaturalness": { "score": 0, "issues": [], "fixes": [] }
  },
  "prioritizedFixes": [
    { "priority": 1, "issue": "", "fix": "", "impact": "high|medium|low" }
  ],
  "competitorComparison": {
    "wordCountVsAvg": "",
    "uniqueAngles": [],
    "missingTopics": []
  }
}
```

---

### STAGE 6: Humanizer & Final Polish Prompt

```
SYSTEM PROMPT:
You are a content humanizer and final editor. Take the SEO-optimized content
and apply subtle humanization techniques to reduce AI detection probability
while preserving SEO value and readability.

INPUT:
- Blog Content: {content} (from Stage 4)
- SEO Fixes: {fixes} (from Stage 5)
- Target AI Detection: < 15%

INSTRUCTIONS:
1. Apply all high-priority SEO fixes from Stage 5.
2. HUMANIZATION TECHNIQUES:
   - Inject personal anecdotes or first-person perspective in 2-3 places
   - Add rhetorical questions (2-3 per 1000 words)
   - Include contractions naturally (don't, won't, it's, etc.)
   - Vary paragraph lengths unpredictably (1-5 sentences)
   - Add "imperfect" transitions that feel genuine
   - Include cultural or regional references where relevant
   - Use parenthetical asides (like this one) occasionally
   - Add emotional language sparingly ("frustrating", "exciting")
   - Include a personal opinion or hot take in one section
   - Reference specific dates, tools, or current trends

3. PRESERVE:
   - All keyword placements and density
   - Heading structure
   - Featured snippet formats
   - Schema markup compatibility
   - Internal linking anchors
   - CTA placements

4. QUALITY CHECKS:
   - No duplicate content blocks
   - No awkward keyword stuffing
   - Consistent tone throughout
   - Proper grammar and punctuation
   - Smooth reading flow

OUTPUT FORMAT (JSON):
{
  "finalContent": "" (HTML),
  "finalMarkdown": "" (Markdown),
  "changes": [
    { "type": "humanization | seo-fix", "location": "", "description": "" }
  ],
  "finalMetrics": {
    "wordCount": 0,
    "estimatedAIDetection": "%",
    "readabilityScore": 0,
    "seoScore": 0,
    "snippetReadiness": true/false,
    "keywordDensity": {}
  }
}
```

---

## 🎨 FRONTEND: Component-Level Implementation Guide

### 1. Dashboard Page (`/dashboard`)

**Reference**: Blogy.in dashboard (see screenshot)

**Layout:**
- **Left Sidebar** (fixed, dark bg #1a1f2e):
  - Logo: "✧blogy" with "Publishing control" subtitle
  - Nav items with icons: Dashboard, Websites, Blogs/Posts, Scheduling, Analytics, Billing, Subscription, Integrations, Support
  - Bottom: Settings, Logout
  - Active state: Teal/cyan highlight bar on left + bg highlight
- **Main Content** (light bg):
  - **Top Bar**: "WORKSPACE" label → user name, Live badge (green dot), notification bell, avatar
  - **Page Title**: "Dashboard" with subtitle "Monitor usage, scheduling health, and publishing performance."

**Components Implementation:**

```
<StatsCards>
  4 stat cards in a row:
  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
  │TOTAL WEBSITES│ │BLOGS GENERATED│ │SCHEDULED    │ │PUBLISHED    │
  │     1        │ │     1        │ │POSTS   0    │ │POSTS   0    │
  │         🌐   │ │         ✏️   │ │         📅  │ │         📊  │
  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
  - Each card: white bg, subtle border, rounded-lg
  - Label: uppercase, small, muted color
  - Value: large bold number
  - Icon: bottom-right, muted
</StatsCards>

<TrafficAnalytics>
  - Title: "Traffic Analytics" with chart icon
  - Subtitle: "Views & clicks trend over time"
  - Empty state: "No analytics data" + "Connect your analytics provider"
  - When data: Line chart (views=blue, clicks=green)
</TrafficAnalytics>

<MonthlyActivity>
  - Title: "Monthly Activity"
  - Subtitle: "Blogs generated per billing cycle"
  - Bar chart: Teal/cyan bars, y-axis 0-1 scale
  - X-axis: dates (e.g., 3/26)
</MonthlyActivity>

<RecentActivity>
  - Title: "Recent Activity"
  - Subtitle: "Latest generated posts and their statuses"
  - Table: TITLE | SOURCE | STATUS | CREATED
  - Status badges: "draft" (red/coral badge)
</RecentActivity>

<SystemHealth>
  - Title: "System Health" with green "Healthy" badge
  - Subtitle: "Quick snapshot of your autopilot setup"
  - Items: Website (Connected ●), Plan (Free Plan)
</SystemHealth>
```

**Color Palette:**
```css
--sidebar-bg: #1a1f2e;
--sidebar-text: #8892a4;
--sidebar-active: #2dd4bf;  /* Teal/Cyan */
--card-bg: #ffffff;
--card-border: #e5e7eb;
--text-primary: #111827;
--text-secondary: #6b7280;
--accent-teal: #2dd4bf;
--status-draft: #ef4444;
--status-published: #22c55e;
--status-scheduled: #f59e0b;
--bg-main: #f9fafb;
```

---

### 2. Blog Generation Page (`/generate`) — THE HERO PAGE

This is the **star feature** for the hackathon demo.

**Layout:**

```
┌────────────────────────────────────────────────────────────┐
│ AI Blog Generator                                          │
│ Generate SEO-optimized blogs in minutes with AI            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──── Input Panel ────────────────────────────────────┐   │
│  │ Seed Keyword: [________________________]            │   │
│  │ Niche:        [________▼]                           │   │
│  │ Tone:         [Professional ▼]                      │   │
│  │ Length:        ○ Short  ● Medium  ○ Long  ○ Pillar  │   │
│  │ Target Audience: [________________________]         │   │
│  │ Language:     [English ▼]                           │   │
│  │                                                     │   │
│  │  [🚀 Generate Blog]                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌──── Pipeline Progress ──────────────────────────────┐   │
│  │ ● Keyword Research    ✅ Complete    │ ▶ View       │   │
│  │ ● SERP Analysis       ✅ Complete    │ ▶ View       │   │
│  │ ● Outline Generation  🔄 Processing │              │   │
│  │ ○ Content Writing     ⏳ Waiting    │              │   │
│  │ ○ SEO Optimization    ⏳ Waiting    │              │   │
│  │ ○ Humanization        ⏳ Waiting    │              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌──── Content Preview ───────┐ ┌──── SEO Score ──────┐   │
│  │                            │ │ Overall: 87/100      │   │
│  │  [Live blog preview with   │ │ ████████████░░ 87%   │   │
│  │   formatted HTML content]  │ │                      │   │
│  │                            │ │ Keywords    ✅ 92    │   │
│  │                            │ │ Readability ✅ 78    │   │
│  │                            │ │ Structure   ✅ 95    │   │
│  │                            │ │ Snippet     ⚠️ 65    │   │
│  │                            │ │ AI Score    ✅ 12%   │   │
│  │                            │ │                      │   │
│  │                            │ │ [Download] [Publish] │   │
│  └────────────────────────────┘ └──────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

### 3. SEO Tools Page (`/seo-tools`)

```
┌────────────────────────────────────────────────────────────┐
│ SEO Analysis Dashboard                                      │
├────────────────────────────────────────────────────────────┤
│  ┌── Score Gauge ──┐  ┌── Keyword Cloud ──────────────┐   │
│  │                 │  │                                │   │
│  │   [Circular     │  │  ai blog tool  seo automation │   │
│  │    progress     │  │   content marketing  blogy    │   │
│  │    87/100]      │  │  martech  organic traffic     │   │
│  │                 │  │                                │   │
│  └─────────────────┘  └────────────────────────────────┘   │
│                                                            │
│  ┌── Keyword Density ─────────────────────────────────┐   │
│  │ Keyword          │ Count │ Density │ Status         │   │
│  │ "ai blog tool"   │  12   │  1.4%   │ ✅ Optimal    │   │
│  │ "seo automation" │   8   │  0.9%   │ ✅ Good       │   │
│  │ "content market" │   3   │  0.3%   │ ⚠️ Low        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌── Google Snippet Preview ──────────────────────────┐   │
│  │ 🔍 Blogy - Best AI Blog Automation Tool in India   │   │
│  │ www.blogy.in/blog/best-ai-blog-tool                │   │
│  │ Discover why Blogy is India's #1 AI-powered blog   │   │
│  │ automation platform. Generate SEO-optimized...     │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

### 4. Multi-Platform Publishing Page (`/blogs/[id]` → Publish Tab)

```
┌────────────────────────────────────────────────────────────┐
│ Publish: "Blogy – Best AI Blog Automation Tool in India"   │
├────────────────────────────────────────────────────────────┤
│  Select Platforms:                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │☑ Medium  │ │☑LinkedIn│ │☑WordPress│ │☑ Blogger│        │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │☐Substack│ │☐ Dev.to │ │☐Hashnode│ │☐ Tumblr │        │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│  ┌──────────┐ ┌──────────┐                                │
│  │☐VocalMedia│ │☐  Quora  │                                │
│  └──────────┘ └──────────┘                                │
│                                                            │
│  Schedule: ○ Now  ● Schedule → [Date] [Time]              │
│                                                            │
│  Platform Adaptation: ✅ Auto-adapt formatting per platform│
│                                                            │
│  [📤 Publish to Selected Platforms]                        │
└────────────────────────────────────────────────────────────┘
```

---

## ⚙️ BACKEND: API Route Implementation Guide

### API Route: `/api/generate/blog` (Core Pipeline)

```typescript
// PSEUDOCODE — Full pipeline orchestration

export async function POST(req: Request) {
  const { seedKeyword, niche, tone, length, audience, language } = await req.json();
  const userId = await authenticateUser(req);

  // STAGE 1: Keyword Research
  const keywordData = await geminiCall(
    KEYWORD_RESEARCH_PROMPT,
    { seedKeyword, niche, targetMarket: "India", language }
  );
  await saveToFirestore("keywords", { userId, ...keywordData });
  emitProgress("keyword-research", "complete");

  // STAGE 2: SERP Gap Analysis
  const serpData = await geminiCall(
    SERP_ANALYSIS_PROMPT,
    {
      primaryKeyword: keywordData.primaryKeyword,
      secondaryKeywords: keywordData.secondaryKeywords,
      niche
    }
  );
  emitProgress("serp-analysis", "complete");

  // STAGE 3: Outline Generation
  const outlineData = await geminiCall(
    OUTLINE_PROMPT,
    {
      primaryKeyword: keywordData.primaryKeyword,
      secondaryKeywords: keywordData.secondaryKeywords,
      lsiKeywords: keywordData.lsiKeywords,
      contentGaps: serpData.contentGaps,
      blogType: keywordData.contentStrategy.recommendedBlogType,
      wordCount: getWordCount(length),
      tone,
      audience
    }
  );
  emitProgress("outline", "complete");

  // STAGE 4: Full Content Generation
  const blogContent = await geminiCall(
    BLOG_GENERATION_PROMPT,
    {
      outline: outlineData,
      primaryKeyword: keywordData.primaryKeyword,
      secondaryKeywords: keywordData.secondaryKeywords,
      lsiKeywords: keywordData.lsiKeywords,
      tone,
      audience
    }
  );
  emitProgress("content-generation", "complete");

  // STAGE 5: SEO Scoring
  const seoScore = await geminiCall(
    SEO_SCORING_PROMPT,
    {
      content: blogContent.content,
      primaryKeyword: keywordData.primaryKeyword,
      secondaryKeywords: keywordData.secondaryKeywords,
      metaTitle: outlineData.metaTitle,
      metaDescription: outlineData.metaDescription
    }
  );
  emitProgress("seo-optimization", "complete");

  // STAGE 6: Humanization
  const finalBlog = await geminiCall(
    HUMANIZER_PROMPT,
    {
      content: blogContent.content,
      fixes: seoScore.prioritizedFixes.filter(f => f.impact === "high")
    }
  );
  emitProgress("humanization", "complete");

  // Save final blog to Firestore
  const blogId = await saveToFirestore("blogs", {
    userId,
    title: outlineData.title,
    slug: outlineData.slug,
    content: finalBlog.finalContent,
    contentMarkdown: finalBlog.finalMarkdown,
    metaTitle: outlineData.metaTitle,
    metaDescription: outlineData.metaDescription,
    focusKeyword: keywordData.primaryKeyword.keyword,
    secondaryKeywords: keywordData.secondaryKeywords.map(k => k.keyword),
    seoScore: {
      overall: seoScore.overallScore,
      ...seoScore.breakdown
    },
    status: "draft",
    generationConfig: { seedKeyword, niche, tone, length, audience, language },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return Response.json({
    blogId,
    blog: finalBlog,
    seoScore,
    keywords: keywordData,
    outline: outlineData
  });
}
```

---

### API Route: `/api/seo/score` (Real-Time Scoring)

```typescript
// Standalone SEO scoring for the editor

export async function POST(req: Request) {
  const { content, primaryKeyword, secondaryKeywords } = await req.json();

  // Local calculations (no API call needed)
  const wordCount = countWords(content);
  const keywordDensity = calculateDensity(content, primaryKeyword);
  const readability = calculateFleschScore(content);
  const headings = analyzeHeadingStructure(content);
  const snippetReady = checkSnippetReadiness(content);

  // Keyword density for each secondary keyword
  const secondaryDensities = secondaryKeywords.map(kw => ({
    keyword: kw,
    density: calculateDensity(content, kw),
    count: countOccurrences(content, kw),
    status: getDensityStatus(calculateDensity(content, kw))
  }));

  // Calculate composite score
  const score = calculateCompositeScore({
    keywordDensity,
    readability,
    headings,
    snippetReady,
    wordCount,
    secondaryDensities
  });

  return Response.json({
    overall: score,
    wordCount,
    keywordDensity: { primary: keywordDensity, secondary: secondaryDensities },
    readability,
    headingStructure: headings,
    snippetReadiness: snippetReady,
    suggestions: generateSuggestions(score)
  });
}
```

---

### API Route: `/api/publish` (Multi-Platform Publisher)

```typescript
export async function POST(req: Request) {
  const { blogId, platforms, scheduleAt } = await req.json();
  const userId = await authenticateUser(req);

  // Fetch blog from Firestore
  const blog = await getFromFirestore("blogs", blogId);

  if (scheduleAt) {
    // Schedule for later
    await saveToFirestore("schedules", {
      userId, blogId,
      websiteId: blog.websiteId,
      scheduledAt: new Date(scheduleAt),
      platforms,
      status: "pending"
    });
    return Response.json({ status: "scheduled", scheduledAt });
  }

  // Publish now to each platform
  const results = await Promise.allSettled(
    platforms.map(async (platform) => {
      const publisher = getPublisher(platform); // Factory pattern
      const adaptedContent = await adaptContent(blog, platform);
      const result = await publisher.publish(adaptedContent);
      return { platform, ...result };
    })
  );

  // Update blog status
  const successPlatforms = results
    .filter(r => r.status === "fulfilled")
    .map(r => r.value.platform);

  await updateFirestore("blogs", blogId, {
    status: successPlatforms.length > 0 ? "published" : "failed",
    publishedPlatforms: successPlatforms,
    publishedAt: serverTimestamp()
  });

  return Response.json({ results });
}
```

---

## 📊 SEO Scoring Algorithm (Local Implementation)

```typescript
// lib/seo/scorer.ts — No API calls, runs in real-time

export function calculateSEOScore(content: string, config: SEOConfig): SEOResult {
  const scores = {
    // 1. Title Tag (10%)
    titleTag: scoreTitleTag(config.metaTitle, config.primaryKeyword),

    // 2. Meta Description (5%)
    metaDescription: scoreMetaDescription(config.metaDesc, config.primaryKeyword),

    // 3. Keyword Optimization (20%)
    keywords: scoreKeywords(content, config.primaryKeyword, config.secondaryKeywords),

    // 4. Heading Structure (10%)
    headings: scoreHeadings(content, config.primaryKeyword),

    // 5. Content Quality (20%)
    contentQuality: scoreContentQuality(content),

    // 6. Snippet Readiness (10%)
    snippetReady: scoreSnippetReadiness(content),

    // 7. Internal Linking (5%)
    internalLinks: scoreInternalLinks(content),

    // 8. Media (5%)
    media: scoreMediaOptimization(content),

    // 9. GEO Readiness (10%)
    geoReady: scoreGEOReadiness(content),

    // 10. AI Naturalness (5%)
    naturalness: scoreNaturalness(content)
  };

  const weights = {
    titleTag: 0.10, metaDescription: 0.05, keywords: 0.20,
    headings: 0.10, contentQuality: 0.20, snippetReady: 0.10,
    internalLinks: 0.05, media: 0.05, geoReady: 0.10, naturalness: 0.05
  };

  const overall = Object.entries(scores).reduce(
    (sum, [key, score]) => sum + score * weights[key], 0
  );

  return { overall: Math.round(overall), breakdown: scores };
}
```

---

## 🏆 PART 2: Blogy Dashboard Analysis (Hackathon Presentation Points)

### Identified Issues & Opportunities

| Category | Finding | Severity | Recommendation |
|----------|---------|----------|----------------|
| **UX Bug** | Dashboard shows "No analytics data" without clear CTA | Medium | Add "Connect Google Analytics" button |
| **SEO Risk** | No sitemap/robots.txt configuration visible | High | Auto-generate XML sitemap |
| **Conversion** | Free→Paid upgrade path is buried in sidebar | High | Add upgrade banner on dashboard |
| **Feature Gap** | No content calendar view | Medium | Add drag-drop calendar for scheduling |
| **Feature Gap** | No competitor content monitoring | High | Add SERP tracking per keyword |
| **Technical** | No bulk blog generation option | Medium | Add batch generation from CSV/keyword list |
| **UX** | Status badges lack visual hierarchy | Low | Use distinct colors + icons per status |
| **SEO** | No canonical URL management | High | Auto-set canonical URLs on publish |
| **Onboarding** | New user sees empty dashboard, no guidance | Critical | Add onboarding wizard / first-blog flow |
| **Feature Gap** | No AI editing / rewriting within editor | Medium | Add "Improve with AI" inline buttons |

---

## 🚀 Hackathon Demo Script

### Live Demo Flow (5 minutes):

1. **Login** → Show dashboard with real data (pre-loaded)
2. **Generate Blog** → Enter "Blogy – Best AI Blog Automation Tool in India"
   - Show each pipeline stage completing in real-time
   - Highlight the 6-stage prompt architecture
3. **SEO Score** → Show 85+ SEO score with detailed breakdown
   - Drill into keyword density, readability, snippet preview
4. **Google Snippet Preview** → Show how blog would appear in search
5. **Publish** → Select 5 platforms, show publish workflow
6. **Dashboard** → Return to dashboard showing updated stats

### Key Differentiators to Highlight:

- **6-Stage Prompt Pipeline** (not just "write me a blog")
- **Real-Time SEO Scoring** (Yoast-like experience, built-in)
- **AI Detection Countermeasures** (humanization stage)
- **GEO Optimization** (future-proofing for AI answer engines)
- **Multi-Platform Publishing** (10 platforms supported)
- **Scalable Architecture** (Firebase + serverless = infinite scale)

---

## 📦 Setup Commands

```bash
# Initialize project
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install dependencies
npm install firebase @google/generative-ai
npm install react-icons recharts react-hot-toast
npm install marked dompurify
npm install -D @types/dompurify

# Environment variables (.env.local)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
GEMINI_API_KEY=
```

---

## ✅ Implementation Checklist

### Phase 1: Foundation (Day 1)
- [ ] Initialize Next.js project with TypeScript + Tailwind
- [ ] Set up Firebase (Auth + Firestore)
- [ ] Create Firestore collections & security rules
- [ ] Build Gemini API client wrapper
- [ ] Implement auth flow (login/signup pages)

### Phase 2: Core Engine (Day 1-2)
- [ ] Implement all 6 prompt templates in `/lib/gemini/prompts/`
- [ ] Build pipeline orchestration in `/api/generate/blog`
- [ ] Create SEO scoring algorithm in `/lib/seo/scorer.ts`
- [ ] Build keyword density calculator
- [ ] Build readability scorer (Flesch-Kincaid)

### Phase 3: Dashboard UI (Day 2)
- [ ] Build sidebar navigation component
- [ ] Build dashboard page with all 5 widgets
- [ ] Build blog generation page with pipeline progress
- [ ] Build SEO tools page with score visualization
- [ ] Build blog editor with live SEO sidebar

### Phase 4: Publishing (Day 2-3)
- [ ] Build multi-platform publisher interface
- [ ] Implement content adaptation per platform
- [ ] Build scheduling system
- [ ] Build blog management table

### Phase 5: Polish & Demo Prep (Day 3)
- [ ] Add animations & loading states
- [ ] Pre-generate demo content
- [ ] Prepare stress-test responses
- [ ] Build presentation deck
- [ ] Rehearse live demo

---

> **Pro Tip for Judges**: This architecture is production-ready. The 6-stage prompt pipeline ensures every blog goes through keyword research → competitive analysis → structured outline → optimized writing → SEO validation → humanization. Each stage is independently auditable, replicable, and scalable.
