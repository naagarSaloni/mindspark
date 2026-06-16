import os
import json
import re
import time
from typing import Dict, Any, List

from dotenv import load_dotenv
from pypdf import PdfReader
from google import genai
from difflib import SequenceMatcher

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set in environment variables.")

client = genai.Client(api_key=GEMINI_API_KEY)

MODEL_CANDIDATES = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
]
def ai_probability(text):

    text = text.lower()

    ai_phrases = [
        "in conclusion",
        "it is important to note",
        "furthermore",
        "moreover",
        "therefore",
        "thus",
        "the fundamental difference",
        "the key distinction",
        "for example",
        "in contrast",
        "on the other hand",
        "specifically designed"
    ]

    score = 0

    for phrase in ai_phrases:
        if phrase in text:
            score += 8

    words = len(text.split())

    if words > 100:
        score += 10

    if words > 200:
        score += 10

    return min(score, 100)

def plagiarism_percentage(student, model):

    student = normalize_text(student)
    model = normalize_text(model)

    if not student or not model:
        return 0

    # basic similarity
    base_score = SequenceMatcher(None, student, model).ratio()

    # keyword overlap boost
    student_words = set(student.split())
    model_words = set(model.split())

    overlap = len(student_words & model_words)
    total = len(model_words) if model_words else 1

    keyword_boost = overlap / total

    final = (0.7 * base_score + 0.3 * keyword_boost) * 100

    return round(min(final, 100), 2)
 
def evaluate_subjective_with_gemini(
    question,
    ideal_answer,
    student_answer
):
    prompt = f"""
You are an expert examiner.

Evaluate the student's answer.

Question:
{question}

Ideal Answer:
{ideal_answer}

Student Answer:
{student_answer}

Rules:
- Focus on conceptual correctness.
- Ignore minor grammar mistakes.
- Ignore spelling mistakes if meaning is clear.
- Give full marks if concepts are correct.
- Detect similarity separately.
- Score from 0 to 100.

Return ONLY valid JSON:

{{
  "score": 85,
  "feedback": "Detailed feedback",
  "plagiarism": 20,
  "result": "Strong Answer"
}}
"""

    for model_name in MODEL_CANDIDATES:

        try:

            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )

            text = response.text.strip()

            # Remove markdown wrappers if Gemini returns them
            text = text.replace("```json", "")
            text = text.replace("```", "")
            text = text.strip()

            try:
                data = json.loads(text)

            except Exception:
                print("Invalid Gemini JSON:", text)

                return {
                    "score": 0,
                    "feedback": "Could not parse Gemini response.",
                    "plagiarism": 0,
                    "result": "Weak Answer"
                }

            return {
                "score": float(data.get("score", 0)),
                "feedback": data.get("feedback", ""),
                "plagiarism": float(data.get("plagiarism", 0)),
                "result": data.get("result", "Weak Answer")
            }

        except Exception as e:

            print(
                f"Gemini evaluation failed using {model_name}:",
                e
            )

            continue

    return {
        "score": 0,
        "feedback": "Evaluation failed.",
        "plagiarism": 0,
        "result": "Weak Answer"
    }

def normalize_text(text: str) -> str:
    if not text:
        return ""

    text = str(text).lower()

    text = re.sub(r"[^\w\s]", " ", text)

    text = re.sub(r"\s+", " ", text)

    return text.strip()


def evaluate_answers(questions, student_answers):

    total = 0

    for q in questions:
        if "options" in q:
            total += 1
        else:
            total += 5

    score = 0
    details = []

    for i, question in enumerate(questions):

        student_answer = ""

        if i < len(student_answers):
            student_answer = str(
                student_answers[i].get("answer", "")
            ).strip()

        correct_answer = str(
            question.get("answer", "")
        ).strip()

        explanation = question.get(
            "explanation",
            "No explanation available."
        )

        # =====================================
        # MCQ EVALUATION
        # =====================================

        if "options" in question:

            is_correct = (
                student_answer.lower().strip()
                ==
                correct_answer.lower().strip()
            )

            obtained_marks = 1 if is_correct else 0

            score += obtained_marks

            details.append({
                "question": question.get("question", ""),
                "student_answer": student_answer,
                "correct_answer": correct_answer,
                "marks_obtained": obtained_marks,
                "max_marks": 1,
                "keyword_match": 100 if is_correct else 0,
                "semantic_score": 100 if is_correct else 0,
                "final_score": 100 if is_correct else 0,
                "matched_keywords": [],
                "expected_keywords": [],
                "plagiarism": 0,
                "ai_probability": 0,
                "result": "Correct" if is_correct else "Incorrect",
                "feedback": (
                    "Correct answer selected."
                    if is_correct
                    else "Incorrect answer selected."
                ),
                "explanation": explanation
            })

            continue

        # =====================================
        # SUBJECTIVE EVALUATION
        # =====================================

        if not student_answer:

            details.append({
                "question": question.get("question", ""),
                "student_answer": "",
                "correct_answer": correct_answer,
                "marks_obtained": 0,
                "max_marks": 5,
                "keyword_match": 0,
                "semantic_score": 0,
                "final_score": 0,
                "matched_keywords": [],
                "expected_keywords": [],
                "plagiarism": 0,
                "ai_probability": 0,
                "result": "Not Attempted",
                "feedback": "No answer provided.",
                "explanation": explanation
            })

            continue

        gemini_eval = evaluate_subjective_with_gemini(
            question.get("question", ""),
            correct_answer,
            student_answer
        )

        if not isinstance(gemini_eval, dict):
            gemini_eval = {}

        gemini_score = float(
            gemini_eval.get("score", 0)
        )

        feedback_text = gemini_eval.get(
            "feedback",
            ""
        )

        subjective_marks = round(
            (gemini_score / 100) * 5,
            2
        )

        # -------------------------------------
        # Plagiarism + AI Detection
        # -------------------------------------

        text_plagiarism = plagiarism_percentage(
            student_answer,
            correct_answer
        )

        ai_score = ai_probability(
            student_answer
        )

        plagiarism = round(
            (0.7 * text_plagiarism) +
            (0.3 * ai_score),
            2
        )

        # -------------------------------------
        # Penalty for high plagiarism
        # -------------------------------------

        if plagiarism >= 90:
            subjective_marks = 0

        elif plagiarism >= 75:
            subjective_marks = round(
                subjective_marks * 0.5,
                2
            )

        # -------------------------------------
        # Result Classification
        # -------------------------------------

        if subjective_marks >= 4.5:
            result = "Strong Answer"

        elif subjective_marks >= 3:
            result = "Good Answer"

        elif subjective_marks >= 2:
            result = "Average Answer"

        else:
            result = "Weak Answer"

        # -------------------------------------
        # Feedback
        # -------------------------------------

        if not feedback_text:

            if subjective_marks >= 4.5:
                feedback_text = (
                    "Excellent understanding of concepts."
                )

            elif subjective_marks >= 3:
                feedback_text = (
                    "Good answer but some details could be improved."
                )

            elif subjective_marks >= 2:
                feedback_text = (
                    "Partially correct answer. Important concepts are missing."
                )

            else:
                feedback_text = (
                    "Answer lacks sufficient conceptual understanding."
                )

        if plagiarism > 80:
            feedback_text += (
                " High similarity detected with the model answer."
            )

        if ai_score >= 40:
            feedback_text += (
                f" AI probability detected ({ai_score}%)."
            )

        score += subjective_marks

        details.append({
            "question": question.get("question", ""),
            "student_answer": student_answer,
            "correct_answer": correct_answer,
            "marks_obtained": subjective_marks,
            "max_marks": 5,
            "keyword_match": 0,
            "semantic_score": round(gemini_score, 2),
            "final_score": round(gemini_score, 2),
            "matched_keywords": [],
            "expected_keywords": [],
            "plagiarism": round(plagiarism, 2),
            "ai_probability": ai_score,
            "result": result,
            "feedback": feedback_text,
            "explanation": explanation
        })

    print(json.dumps(details, indent=2))

    return {
        "score": round(score, 2),
        "total": total,
        "percentage": round(
            (score / total) * 100,
            2
        ) if total else 0,
        "details": details
    }


def concept_similarity(student, answer):
    student_words = extract_keywords(student)
    answer_words = extract_keywords(answer)

    if not answer_words:
        return 0

    overlap = len(student_words & answer_words)

    score = (overlap / len(answer_words)) * 100

    return min(score, 100)
def clean_pdf_text(text: str) -> str:
    if not text:
        return ""

    text = re.sub(r"\r", "\n", text)
    text = re.sub(r"\n{2,}", "\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)

    cleaned_lines = []
    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue
        if re.fullmatch(r"\d+", line):
            continue
        cleaned_lines.append(line)

    return "\n".join(cleaned_lines)[:12000]


def extract_text_from_pdf(pdf_path: str) -> str:
    try:
        reader = PdfReader(pdf_path)
        text_parts = []

        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)

        return clean_pdf_text("\n".join(text_parts))

    except Exception as e:
        print("PDF extraction error:", str(e))
        return ""
def build_prompt(
    content: str,
    question_count: int,
    difficulty: str,
    exam_type: str
) -> str:

    exam_type = exam_type.lower().strip()

    if exam_type == "mcq":

        format_instructions = """
Return ONLY valid JSON.

{
  "questions": [
    {
      "type": "mcq",
      "question": "string",
      "options": [
        "A. option",
        "B. option",
        "C. option",
        "D. option"
      ],
      "answer": "exact correct option",
      "explanation": "why this option is correct"
    }
  ]
}
"""

        question_rules = f"""
Generate exactly {question_count} MCQ questions.

Requirements:
- Generate ONLY MCQ questions.
- Exactly 4 options per question.
- Only one correct answer.
- Options should be realistic and meaningful.
- Avoid obvious answers.
- Focus on conceptual understanding and application.
- Questions should resemble university exams and placement tests.
"""

    elif exam_type == "subjective":

        format_instructions = """
Return ONLY valid JSON.

{
  "questions": [
    {
      "type": "subjective",
      "question": "string",
      "answer": "ideal answer",
      "keywords": [
        "keyword1",
        "keyword2",
        "keyword3",
        "keyword4"
      ],
      "explanation": "why the answer is correct"
    }
  ]
}
"""

        question_rules = f"""
Generate exactly {question_count} subjective questions.

Requirements:
- Generate ONLY subjective questions.
- Do NOT generate MCQs.

Question Style:
- Questions must look like real university examination questions.
- Questions must be concise, direct and professional.
- Questions should sound like they were written by a professor.

Avoid phrases such as:
- What would happen
- What would Prolog answer
- Imagine you are
- Suppose that
- Consider the following
- Could you explain
- Based on the provided information
- Assume that

Prefer phrases such as:
- Explain
- Define
- Differentiate
- Describe
- Discuss
- Evaluate
- State
- Write

Examples:
- Explain the purpose of the is operator in Prolog.
- Differentiate between = and is in Prolog.
- Evaluate the following query and explain the result.
- Write the recursive definition of sum_list/2.
- Describe how arithmetic evaluation works in Prolog.

Ideal Answer Requirements:
- Generate detailed model answers.
- Write answers in clear paragraphs.
- Use bullet points where appropriate.
- Use markdown formatting only when necessary.
- Use code blocks only for actual code examples.
- Avoid excessive backticks around technical terms.
- Avoid AI-style wording.
- Ensure all technical information is factually correct.
- Explain reasoning clearly.
- Generate 6-10 important keywords.
"""

    elif exam_type == "mixed":

        mcq_count = max(1, round(question_count * 0.6))
        subjective_count = question_count - mcq_count

        format_instructions = """
Return ONLY valid JSON.

{
  "questions": [
    {
      "type": "mcq",
      "question": "string",
      "options": [
        "A. option",
        "B. option",
        "C. option",
        "D. option"
      ],
      "answer": "exact correct option",
      "explanation": "why this option is correct"
    },
    {
      "type": "subjective",
      "question": "string",
      "answer": "ideal answer",
      "keywords": [
        "keyword1",
        "keyword2",
        "keyword3",
        "keyword4"
      ],
      "explanation": "why the answer is correct"
    }
  ]
}
"""

        question_rules = f"""
Generate exactly {question_count} questions.

Generate:
- {mcq_count} MCQ questions
- {subjective_count} Subjective questions

Requirements:
- Mix both question types naturally.
- Do not group all MCQs together.
- Do not group all subjective questions together.
- Maintain consistent difficulty.
- Questions should resemble university exams and placement tests.
"""

    else:
        raise ValueError(f"Unsupported exam_type: {exam_type}")

    return f"""
Generate questions from the provided study material.

DIFFICULTY LEVEL:
{difficulty.upper()}

QUESTION RULES:
{question_rules}

IMPORTANT INSTRUCTIONS:

1. Questions must look like they were written by a real teacher, professor or examiner.

2. Questions should resemble:
   - University examinations
   - Semester exams
   - Internal assessments
   - Viva questions
   - Assignments
   - Placement assessments

3. Avoid AI-generated wording such as:
   - Imagine...
   - Suppose...
   - Consider the following...
   - Could you explain...
   - What would happen...
   - Based on the provided information...

4. Use action-oriented wording:
   - Explain
   - Define
   - Differentiate
   - Describe
   - Discuss
   - Evaluate
   - State
   - Write

5. Keep questions concise and easy to understand.

6. Focus on understanding, reasoning, application and analysis.

7. Avoid repetitive terminology.

8. If the content contains code:
   - Ask about output
   - Ask about behavior
   - Ask about implementation
   - Ask about reasoning
   - Ask about practical usage

9. Ensure all answers are technically and factually correct.

10. For code-related questions:
    - Show code in proper code blocks.
    - Ask students to predict output, explain behavior or identify logic.
    - Avoid asking for pure memorization.

11. Ideal answers should be well-structured and readable.

12. Use markdown formatting only when necessary.

13. Use code blocks only for actual code examples.

14. Avoid excessive backticks around technical words.

15. Output ONLY valid JSON.

{format_instructions}

CONTENT:

\"\"\"
{content}
\"\"\"
"""
def extract_json_from_response(text: str) -> Dict[str, Any]:
    text = text.strip()

    # Remove markdown blocks
    text = re.sub(r"^```json", "", text, flags=re.IGNORECASE).strip()
    text = re.sub(r"^```", "", text).strip()
    text = re.sub(r"```$", "", text).strip()

    # Extract JSON only
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        text = match.group(0)

    # Fix trailing commas
    text = re.sub(r",\s*]", "]", text)
    text = re.sub(r",\s*}", "}", text)

    # 🔥 FIX INVALID BACKSLASH ESCAPES (IMPORTANT)
    text = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', text)

    try:
        return json.loads(text)

    except Exception as e:
        print("\n========= GEMINI RAW RESPONSE =========")
        print(text)
        print("=======================================\n")
        raise ValueError(f"Invalid Gemini JSON response: {str(e)}")

def validate_questions(data: Dict[str, Any], exam_type: str) -> Dict[str, Any]:
    if "questions" not in data:
        return {"questions": []}

    return data


def call_gemini_with_retry(prompt: str) -> str:
    last_error = None

    for model_name in MODEL_CANDIDATES:
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )

                if response.text:
                    return response.text

            except Exception as e:
                last_error = str(e)
                time.sleep(2)

    raise ValueError(f"Gemini failed: {last_error}")



def extract_keywords(text):
    text = normalize_text(text)

    words = re.findall(r'\b[a-zA-Z]{3,}\b', text)

    stop_words = {
        "the", "and", "are", "was", "were", "for",
        "with", "that", "this", "from", "into", "have",
        "has", "had", "but", "not", "you", "your"
    }

    return {
        word
        for word in words
        if word not in stop_words and len(word) > 3
    }



 
def generate_questions_from_pdf(
    pdf_path: str,
    question_count: int,
    difficulty: str,
    exam_type: str
) -> Dict[str, Any]:

    content = extract_text_from_pdf(pdf_path)

    if not content:
        content = f"Generate {question_count} questions from general topic."

    prompt = build_prompt(
        content,
        question_count,
        difficulty,
        exam_type
    )

    raw = call_gemini_with_retry(prompt)

    print("\n========== GEMINI RESPONSE ==========\n")
    print(raw)
    print("\n=====================================\n")

    parsed = extract_json_from_response(raw)

    validated = validate_questions(
        parsed,
        exam_type
    )

    return validated