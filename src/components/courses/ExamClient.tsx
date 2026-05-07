"use client";

import { useState } from "react";
import Link from "next/link";

interface Question {
  id: string;
  text: string;
  options: any;
  correctOption: number;
  explanation?: string | null;
}

interface SavedAnswer {
  questionId: string;
  selectedOption: number;
}

export default function ExamClient({ 
  examId,
  examTitle, 
  questions, 
  courseSlug,
  initialQuestionIndex = 0,
  initialScore = 0,
}: { 
  examId: string;
  examTitle: string; 
  questions: Question[]; 
  courseSlug: string;
  initialQuestionIndex?: number;
  initialScore?: number;
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(initialScore);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const options = currentQuestion.options as string[];
  const progress = Math.round(((currentQuestionIndex) / questions.length) * 100);

  const handleCheck = () => {
    if (selectedOption === null) return;
    setHasChecked(true);
  };

  const handleNext = async () => {
    if (selectedOption === null) return;

    setLoading(true);
    const isCorrect = selectedOption === currentQuestion.correctOption;
    const newScore = isCorrect ? score + 1 : score;
    const isLastQuestion = currentQuestionIndex + 1 === questions.length;

    try {
      await fetch("/api/exams/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId,
          questionId: currentQuestion.id,
          selectedOption,
          isCorrect,
          isFinished: isLastQuestion,
          score: isLastQuestion ? Math.round((newScore / questions.length) * 100) : null
        }),
      });

      if (isCorrect) setScore(newScore);

      if (!isLastQuestion) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOption(null);
        setHasChecked(false);
        setShowExplanation(false);
      } else {
        setIsFinished(true);
      }
    } catch (error) {
      console.error("Failed to save exam progress", error);
    } finally {
      setLoading(false);
    }
  };

  if (isFinished) {
    const finalScore = (score / questions.length) * 100;
    const passed = finalScore >= 70;

    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-6">{passed ? "🎉" : "😕"}</div>
        <h2 className="text-3xl font-bold mb-2">Exam Finished!</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          You scored <span className="font-bold text-black dark:text-white">{score}</span> out of <span className="font-bold text-black dark:text-white">{questions.length}</span>
        </p>
        
        <div className={`inline-block px-8 py-4 rounded-3xl mb-10 ${
          passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
        }`}>
          <span className="text-4xl font-black">{Math.round(finalScore)}%</span>
          <p className="text-sm font-bold uppercase tracking-widest mt-1">
            {passed ? "Passed" : "Failed - Try again"}
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link 
            href={`/courses/${courseSlug}`}
            className="px-8 py-3 bg-black text-white rounded-full font-bold"
          >
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Top Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Question {currentQuestionIndex + 1} of {questions.length}</h2>
            <h1 className="text-2xl font-bold">{examTitle}</h1>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-blue-600">{progress}%</span>
          </div>
        </div>
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
        <h3 className="text-xl font-medium mb-8">{currentQuestion.text}</h3>
        
        <div className="space-y-3">
          {options.map((option, index) => {
            let variant = "default";
            if (hasChecked) {
              if (index === currentQuestion.correctOption) variant = "correct";
              else if (selectedOption === index) variant = "incorrect";
            } else if (selectedOption === index) {
              variant = "selected";
            }

            const styles = {
              default: "border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
              selected: "border-black bg-zinc-50 dark:border-white dark:bg-zinc-800",
              correct: "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
              incorrect: "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 opacity-70"
            };

            return (
              <button
                key={index}
                disabled={hasChecked}
                onClick={() => setSelectedOption(index)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${styles[variant as keyof typeof styles]}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                    variant === "selected" || (variant === "correct" && selectedOption === index)
                      ? "bg-black border-black text-white dark:bg-white dark:text-black" 
                      : variant === "correct"
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : variant === "incorrect"
                      ? "bg-red-500 border-red-500 text-white"
                      : "border-zinc-200"
                  }`}>
                    {variant === "correct" ? "✓" : variant === "incorrect" ? "✕" : String.fromCharCode(65 + index)}
                  </div>
                  {option}
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback Section */}
        {hasChecked && (
          <div className="mt-8 p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
            <div className="flex justify-between items-center mb-4">
              <span className={`font-bold px-3 py-1 rounded-full text-xs uppercase tracking-widest ${
                selectedOption === currentQuestion.correctOption 
                  ? "bg-emerald-100 text-emerald-700" 
                  : "bg-red-100 text-red-700"
              }`}>
                {selectedOption === currentQuestion.correctOption ? "Correct Answer" : "Incorrect Answer"}
              </span>
              
              {currentQuestion.explanation && (
                <button 
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  {showExplanation ? "Hide Explanation" : "View Explanation"}
                </button>
              )}
            </div>

            {showExplanation && currentQuestion.explanation && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 animate-in fade-in slide-in-from-top-2 duration-300">
                {currentQuestion.explanation}
              </p>
            )}
          </div>
        )}

        {!hasChecked ? (
          <button
            onClick={handleCheck}
            disabled={selectedOption === null}
            className="w-full mt-10 py-4 bg-black text-white rounded-xl font-bold disabled:opacity-50 transition-opacity"
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={loading}
            className="w-full mt-4 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            {loading ? "Saving..." : currentQuestionIndex + 1 === questions.length ? "Finish Exam" : "Next Question"}
          </button>
        )}
      </div>
    </div>
  );
}
