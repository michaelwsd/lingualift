# LinguaLift - AI VCE English Assistant

LinguaLift is a comprehensive, AI-powered educational platform designed to assist VCE (Victorian Certificate of Education) English students and teachers. It generates tailored reading passages, vocabulary exercises, and multimedia worksheets using Google's Gemini API.

## 🌟 Key Features

### 1. 📚 AI Passage Generation
- **Customizable Content**: Generate unique text based on themes (Science, History, Society, etc.) or custom topics.
- **VCE Standards**: Supports distinct difficulty levels:
  - **Easy (Unit 1/2)**: Foundational skills and standard academic vocabulary.
  - **Medium (Unit 3/4)**: Sophisticated vocabulary, complex sentence structures, and high-level analysis.
- **Diverse Formats**: Creates Essays, Short Stories, News Articles, Opinion Pieces, Biographies, and Poems.
- **Comprehensive Analysis**: Every passage automatically includes:
  - 5-8 Key Vocabulary words with definitions.
  - 5 Reading Comprehension questions with explanations.
  - A Creative Writing Prompt.
  - A full "Band 6" Sample Essay Response (TEEL structure).

### 2. 🧠 Interactive Vocabulary Builder
- **Contextual Lookup**: Click any word in the generated text to get an instant, AI-generated definition.
- **Smart Collection**: Select text to save it to your personal vocabulary bank with synonyms and usage examples.
- **Pronunciation**: Built-in Text-to-Speech for learning correct pronunciation.
- **Practice Generation**: Automatically generates new short stories that incorporate your saved words to reinforce learning.

### 3. 📄 Dynamic Worksheet Generator
Transform any generated topic into a complete, printable PDF lesson plan.
- **Dual Modes**: 
  - **Student View**: Clean layout with writing lines and hidden answers.
  - **Teacher Key**: Full answer keys for all questions.
- **Multimedia Integration**: Uses Google Search Grounding to find real, relevant educational YouTube videos (5-15 mins) and generates:
  - 5 Multiple Choice Questions.
  - 5 True/False Questions.
- **Vocabulary Cloze**: Auto-generates "fill-in-the-blank" exercises using the passage's vocabulary.
- **Print Optimization**: Custom CSS specifically tuned for perfect A4/Letter printing without browser clutter.

### 4. 🔒 Secure Access
- Simple authentication gateway to restrict access to authorized educators/students.

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript
- **AI**: Google Gemini API (`gemini-2.5-flash`) via `@google/genai` SDK
- **Styling**: Tailwind CSS
- **Tools**: Google Search Tool (for video discovery)