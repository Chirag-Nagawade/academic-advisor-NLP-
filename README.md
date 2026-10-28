# Intelligent Academic Advisor 🎓

An intelligent, explainable web application designed for engineering students and academic mentors. It provides automated academic performance analytics, skill gap diagnosis, curriculum course recommendations, personalized career roadmaps, and a Retrieval-Augmented Generation (RAG) academic chatbot for syllabus documents.

Built specifically as a B.Tech Computer Science & Engineering (AIML) capstone project.

---

## 1. Project Overview & Features

1. **Academic Dashboard:** Real-time metrics computed directly from institutional datasets — total enrolled students, course catalog volume, aggregate CGPA, average attendance %, placement rates, branch breakdown, and performance distributions.
2. **Student Directory & Profiling:** Comprehensive student dossiers covering academic marks, attendance, coding track (DSA problems solved, competitive programming rating, GitHub/projects), and career goals. Allows instant creation of new student profiles stored safely in MongoDB.
3. **Academic Analytics:** Deep-dive visual analytics including CGPA histograms, attendance distributions, attendance vs CGPA correlation study, subject-wise score averages across departments, and placement outcomes by branch.
4. **Competency Readiness & Skill Gap Analysis:** Automated diagnosis matching a student's technical skills against industry benchmarks for their target career role (e.g., Data Scientist, Software Engineer, Cloud Architect), identifying subject strengths, improvement areas, and skills not listed in their profile.
5. **Course Recommendation Engine:** Explainable TF-IDF Vector Space matching with cosine similarity and career bonus weighting across the 200-course catalog.
6. **3-Stage Career Roadmap:** Actionable, phased timeline (Foundation ➔ Skill Development ➔ Practical Application) with real courses mapped from the catalog and milestone project ideas.
7. **Academic AI Chatbot (RAG):** Document-grounded Q&A assistant for syllabi, academic regulations, and study materials. Uses PyMuPDF text extraction, chunking, TF-IDF vector retrieval, and optional Google Gemini 2.0 generation with source citations.
8. **Interactive NLP Showcase & Viva Suite:** Live demonstrations of text preprocessing (tokenization, stopword removal), TF-IDF keyword extraction, and cosine similarity scoring.

---

## 2. Technology Stack

### Frontend
- **React 19 + TypeScript**
- **Vite 5** (Fast modern build system)
- **Tailwind CSS** (Clean, responsive academic theme)
- **Recharts** (Interactive bar, pie, and scatter charts)
- **Lucide React** (Consistent academic icon set)
- **Axios** (Configured API client with unified base URL)

### Backend
- **Python 3.12**
- **FastAPI** (High-performance asynchronous REST API)
- **Pandas & NumPy** (Vectorized dataset processing)
- **Scikit-learn** (TF-IDF vectorizer, cosine similarity matching)
- **PyMongo** (MongoDB connectivity with bulk upserts)
- **PyMuPDF (fitz)** (PDF document parser and chunk extractor)
- **Uvicorn** (ASGI web server)

### Database
- **MongoDB** (Local instance on `localhost:27017` or MongoDB Atlas cloud connection)

---

## 3. Dataset Information

The application utilizes two datasets located in `data/`:

1. **`data/student_profiles.csv` (1,200 records, 33 columns):**
   - Contains student demographics, branch, college tier, CGPA, attendance percentage, subject marks (Mathematics, Core Branch, Programming, DSA, Communication), DSA problems solved, project counts, internships, certifications, career goals, and target skills.
   - *Academic Integrity Note:* Values for individual subject marks, package LPA, and interests are synthetic seed records curated for academic prototyping and system evaluation.
2. **`data/courses.csv` (200 records, 10 columns):**
   - Curated engineering courses spanning programming languages, artificial intelligence, cloud computing, cybersecurity, web development, data structures, and core engineering disciplines.
   - Includes course IDs, descriptions, categories, prerequisite requirements, difficulty levels, and syllabus URLs.

---

## 4. Project Folder Structure

```text
intelligent-academic-advisor/
├── backend/
│   ├── routes/
│   │   ├── dashboard.py         # Dashboard statistics & distributions
│   │   ├── students.py          # Student CRUD operations
│   │   ├── analytics.py         # Academic analytics aggregations
│   │   ├── recommendations.py   # Course recommendation endpoints
│   │   ├── skill_gap.py         # Skill gap diagnosis
│   │   ├── roadmap.py           # 3-stage roadmap generation
│   │   ├── chatbot.py           # PDF upload & RAG chat endpoint
│   │   └── nlp_features.py      # Live NLP algorithms demo
│   ├── services/
│   │   ├── recommendation_engine.py  # TF-IDF cosine similarity matcher
│   │   ├── skill_gap_service.py      # Career benchmark mapper
│   │   ├── roadmap_service.py        # Phased timeline generator
│   │   ├── rag_service.py            # PDF chunking & document retrieval
│   │   └── nlp_service.py            # Tokenizer, TF-IDF & similarity
│   ├── database.py              # MongoDB connection manager
│   ├── import_data.py           # Idempotent CSV-to-MongoDB import script
│   ├── main.py                  # FastAPI application entry point
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts        # Axios client instance
│   │   ├── components/
│   │   │   ├── Layout.tsx       # Sidebar & navigation frame
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorMessage.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx              # Page 1: Dashboard
│   │   │   ├── StudentProfile.tsx         # Page 2: Student Profile & Directory
│   │   │   ├── Analytics.tsx              # Page 3: Academic Analytics
│   │   │   ├── SkillGap.tsx               # Page 4: Skill Gap Analysis
│   │   │   ├── CourseRecommendations.tsx  # Page 5: Course Recommendations
│   │   │   ├── CareerRoadmap.tsx          # Page 6: Career Roadmap
│   │   │   ├── Chatbot.tsx                # Page 7: Academic AI Chatbot (RAG)
│   │   │   └── About.tsx                  # Page 8: About & NLP viva suite
│   │   ├── App.tsx              # Route configuration
│   │   ├── main.tsx             # React entry point
│   │   └── index.css            # Tailwind styling
│   ├── vite.config.ts           # Vite + Tailwind + Proxy configuration
│   ├── tsconfig.json
│   └── package.json
├── data/
│   ├── student_profiles.csv     # 1,200 student records
│   └── courses.csv              # 200 course catalog records
├── documents/
│   └── sample_academic_regulations_syllabus.pdf  # Sample PDF for RAG
├── .env.example
├── .env
├── .gitignore
└── README.md
```

---

## 5. Setup & Running Instructions (Windows PowerShell)

### Prerequisites
- **Python 3.10+** (Tested on Python 3.12)
- **Node.js 18+** (Tested on Node.js v22.2.0)
- **MongoDB** running locally (or MongoDB Atlas connection string)

---

### Step 1: Configure Environment Variables

The project includes pre-configured `.env` files. If needed, customize your connection:

```powershell
# Copy the example environment file if .env does not exist:
Copy-Item .env.example .env
```

Contents of `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=intelligent_academic_advisor
LLM_API_KEY=
LLM_PROVIDER=gemini
```

> **Note:** The entire application (all analytics, profiling, recommendations, roadmaps, PDF upload, and document passage retrieval) works **100% offline without any API key**. Adding an optional `LLM_API_KEY` (Google Gemini) enables natural-language synthesized answers.

---

### Step 2: Set Up Backend & Import Data

Open a PowerShell terminal:

```powershell
# 1. Navigate to the backend directory
cd d:\intelligent-academic-advisor\backend

# 2. (Optional but recommended) Create and activate a Python virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Import the 1,200 students and 200 courses into MongoDB (idempotent upsert)
python import_data.py

# 5. Start the FastAPI backend server
python main.py
```

The backend server will start on: **`http://localhost:8000`**
- Interactive Swagger API docs: **`http://localhost:8000/docs`**
- API health check: **`http://localhost:8000/api/health`**

---

### Step 3: Set Up & Start Frontend

Open a second PowerShell terminal:

```powershell
# 1. Navigate to the frontend directory
cd d:\intelligent-academic-advisor\frontend

# 2. Install dependencies (if not already installed)
npm install

# 3. Start the Vite development server
npm run dev
```

The frontend dashboard will be available at: **`http://localhost:5173`**

---

## 6. Project Demonstration Walkthrough (Viva / Evaluation)

To present the project during a college viva or evaluation:

1. **Dashboard (`http://localhost:5173`):**
   - Point out the real counts: 1,200 Students, 200 Courses, average CGPA, and placement percentage computed live from MongoDB.
   - Show the dynamic branch distribution and CGPA histogram charts.
   - Enter student ID `ST00030` in the "Quick Recommendations" box to preview instant course matches.
2. **Student Profile (`/students`):**
   - Search for `ST10975` or filter by branch `AIML`.
   - Click "View Profile" to inspect the subject marks bar chart, demographic background, and coding metrics.
   - Demonstrate the "Register New Student" tab to show how a new profile is validated and stored directly into MongoDB without altering the seed CSV.
3. **Academic Analytics (`/analytics`):**
   - Review the seven analytics visualizations: CGPA distribution, average CGPA by branch, attendance distribution, attendance vs CGPA scatter plot, subject averages, and placement outcomes.
   - Change the branch filter dropdown to show real-time filtering of analytics data.
4. **Skill Gap Analysis (`/skill-gap`):**
   - Enter student `ST00030` (Software Engineer goal) or `ST10975` (Data Scientist goal).
   - Explain the Competency Match Score percentage.
   - Walk through the three skill panels: *Current Profile Skills*, *Required for Role*, and *Skills Not Listed in Profile*.
   - Point out the practical improvement suggestions and academic strengths identified from subject marks.
5. **Course Recommendations (`/recommendations`):**
   - Show how courses are retrieved and ranked using TF-IDF cosine similarity.
   - Point out the "Why recommended" badge on each card explaining the algorithmic rationale.
   - Filter by difficulty (*Beginner*, *Intermediate*, *Advanced*).
   - Switch to the "Custom Search Query" tab to demonstrate recommendations for arbitrary career goals or skills.
6. **Career Roadmap (`/roadmap`):**
   - View the 3-stage timeline generated for a student.
   - Explain Stage 1 (Foundation), Stage 2 (Skill Development), and Stage 3 (Practical Application) with catalog-linked courses.
7. **Academic AI Chatbot (`/chatbot`):**
   - Upload the sample PDF located in `documents/sample_academic_regulations_syllabus.pdf`.
   - Ask: *"What is the minimum attendance requirement to avoid detention?"*
   - Show how the RAG pipeline retrieves the exact paragraphs from Page 1 with document and page citations.
8. **About & NLP Viva Suite (`/about`):**
   - Explain the three live NLP interactive tools:
     - **Preprocessing:** Enter any sentence to see lowercase conversion, punctuation removal, and tokenization.
     - **Cosine Similarity:** Compare two sentences to see the calculated cosine score (0.0 to 1.0).
     - **TF-IDF Terms:** Inspect top keywords with the highest Inverse Document Frequency in the course catalog.

---

## 7. Troubleshooting & Common Issues

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **MongoDB connection error** | MongoDB service is not started | Start MongoDB locally via `net start MongoDB` or verify your `MONGODB_URI` in `.env`. |
| **UnicodeEncodeError on console** | Windows console default encoding (cp1252) cannot display emojis | The backend codebase is configured with ASCII console output (`[OK]`, `[ERROR]`) to prevent encoding crashes. |
| **PDF upload fails** | Non-PDF file uploaded | Upload valid `.pdf` documents only. |
| **Chatbot shows passages instead of AI answer** | `LLM_API_KEY` is not configured | This is expected behavior. The system safely falls back to displaying retrieved passages with citations without requiring paid API keys. |
| **Port 8000 or 5173 already in use** | An existing background server is running | Kill the previous process or run backend on port 8001: `uvicorn main:app --port 8001`. |

---

## 8. License & Academic Disclaimer

This project is developed solely for educational and academic assessment purposes as part of the B.Tech Computer Science and Engineering curriculum. Datasets used for student profiles and course seed lists are curated for prototyping and do not represent verified real-world individuals.
