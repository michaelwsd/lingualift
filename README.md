# LinguaLift

AI-powered learning platform for VCE EAL (English as an Additional Language) students and teachers. Generates tailored reading passages, vocabulary exercises, and interactive homework using Google's Gemini API.

## Features

### Teacher

- **Passage Generation** — Create reading passages on any topic across 4 formats (News Article, Short Story, Opinion Piece, Biography). Each passage includes comprehension questions and key vocabulary.
- **Interactive Learning Stages** — Three-stage workflow: Reading (with word selection and vocabulary building), Comprehension (AI-generated questions), and Practice (fill-in-the-blank, synonym grouping, cross-matching exercises).
- **Send Passage** — Send a passage directly to a student for reading practice.
- **Prepare Homework** — Send a full homework assignment with auto-generated exercises (MC definitions, MC synonyms, word matching, passage fill, synonym baskets). Exercises are pre-generated server-side so students get them instantly.
- **Student Management** — View all students, track homework status per student, inspect assigned exercises, and delete assignments.
- **Session Saving** — Save and resume learning sessions locally.

### Student

- **Homework Dashboard** — View all assigned passages and homework grouped by passage. Passages and homework are visually nested.
- **Passage Reader** — Read assigned passages in a clean, formatted view. Select any word or phrase to get an instant AI-powered explanation.
- **Homework Exercises** — Complete multi-phase homework: vocabulary review, then practice exercises (MC questions, passage fill, word matching, synonym baskets). Progress auto-saves.
- **Vocabulary Tracker** — Browse all learned words across homework assignments. Search, filter by lesson, and view detailed word cards with definitions, examples, and memory tips.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript, React 19 |
| Styling | Tailwind CSS 4 |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| Database | Supabase (PostgreSQL) |
| Auth | Clerk |
| Icons | Lucide React |

## Project Structure

```
app/
  (authenticated)/
    generate/           Teacher passage generator
    learn/              Three-stage learning interface
    sessions/           Saved sessions list
    students/           Student roster + per-student homework view
    student/
      homework/         Student homework list + exercise session
      passage/[id]/     Passage reader with word explanation
      vocabulary/       Vocabulary tracker
    layout.tsx          Auth layout with nav header + route guard
  api/
    generate-passage/   Gemini passage generation
    explain-word/       Gemini word explanation
    generate-synonyms/  Gemini synonym generation
    homework/           CRUD + progress tracking
    passages/           Send/fetch/delete passages
    students/           Student list
    vocabulary/         Aggregated vocabulary endpoint
    set-role/           Role assignment
    admin-password/     Teacher password verification
  choose-role/          Post-signup role selection
  sign-in/, sign-up/    Clerk auth pages

components/
  GeneratorForm.tsx     Passage generation form
  ProfileDropdown.tsx   User menu + password config
  learning/             PassageStage, ComprehensionStage, PracticeStage, StageIndicator
  homework/             PracticeSession, VocabReview, CompletionScreen,
                        HomeworkProgressBar, PassageFill, WordMatching,
                        SynonymBasket, and MC exercise components

contexts/
  LinguaLiftContext.tsx Global state (passage, words, exercises)

services/
  api.ts                Client-side API helpers

lib/
  gemini.ts             Gemini AI functions
  supabase.ts           Supabase client init
  getUserRole.ts        Role extraction from Clerk metadata
```

## Environment Variables

```env
# Google Gemini
GEMINI_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/choose-role
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/choose-role
```

## Database Tables

Create these in your Supabase project:

**homework_assignments**
| Column | Type |
|--------|------|
| id | uuid (PK, default `gen_random_uuid()`) |
| teacher_id | text |
| student_id | text |
| student_name | text |
| passage | jsonb |
| collected_words | jsonb |
| generated_exercises | jsonb |
| status | text (default `'pending'`) |
| assigned_at | timestamptz (default `now()`) |

**homework_progress**
| Column | Type |
|--------|------|
| id | uuid (PK, default `gen_random_uuid()`) |
| homework_id | uuid (FK → homework_assignments) |
| student_id | text |
| current_phase | text |
| exercises_completed | jsonb |
| answers_given | jsonb |
| updated_at | timestamptz (default `now()`) |

**sent_passages**
| Column | Type |
|--------|------|
| id | uuid (PK, default `gen_random_uuid()`) |
| teacher_id | text |
| student_id | text |
| passage | jsonb |
| sent_at | timestamptz (default `now()`) |

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). New users are prompted to select a role (student or teacher). Teachers must verify with an admin password.

## Authentication Flow

1. User signs up/in via Clerk
2. Redirected to `/choose-role` to select **Student** or **Teacher**
3. Teachers enter an admin password for verification
4. Role is stored in Clerk `publicMetadata`
5. Route guard in the authenticated layout enforces role-based access
6. API routes authenticate via Clerk's `auth()` helper; Supabase uses a service role key server-side
