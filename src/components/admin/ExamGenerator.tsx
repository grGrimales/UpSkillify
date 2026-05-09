"use client";

import { useState, useEffect } from "react";
import { generateExamQuestions } from "@/lib/actions/gemini";
import { saveExamAction } from "@/lib/actions/exam";
import { Topic, TopicTranslation } from "@prisma/client";
import { useToast } from "@/context/ToastContext";
import ConfirmationModal from "@/components/layout/ConfirmationModal";

interface TopicWithTranslations extends Topic {
  translations: TopicTranslation[];
}

interface GeneratedQuestion {
  questionEn: string;
  questionEs: string;
  optionsEn: string[];
  optionsEs: string[];
  correctOption: number;
  explanationEn: string;
  explanationEs: string;
}

interface ExamGeneratorProps {
  topics: TopicWithTranslations[];
  moduleId: string;
}

export default function ExamGenerator({ topics, moduleId }: ExamGeneratorProps) {
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(5);
  const [instructions, setInstructions] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Modal states
  const [showConfirmNew, setShowConfirmNew] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const { showToast } = useToast();

  // 1. Browser-level confirm (Tab close/Refresh)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (generatedQuestions.length > 0) {
        e.preventDefault();
        e.returnValue = "Tienes preguntas sin guardar.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [generatedQuestions]);

  // 2. Client-side navigation confirm (Back button/Link clicks)
  useEffect(() => {
    if (generatedQuestions.length > 0) {
      // Add a dummy entry to history so "back" triggers popstate instead of leaving
      window.history.pushState(null, "", window.location.href);

      const handlePopState = () => {
        // When back is pressed, show our styled modal
        setShowExitConfirm(true);
        // Push again to keep user on the same "page" while modal is open
        window.history.pushState(null, "", window.location.href);
      };

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [generatedQuestions]);

  const toggleTopic = (id: string) => {
    setSelectedTopicIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedTopicIds.length === topics.length) {
      setSelectedTopicIds([]);
    } else {
      setSelectedTopicIds(topics.map(t => t.id));
    }
  };

  const handleGenerateClick = () => {
    if (selectedTopicIds.length === 0) {
      setError("Selecciona al menos un tema");
      return;
    }

    if (generatedQuestions.length > 0) {
      setShowConfirmNew(true);
    } else {
      startGeneration();
    }
  };

  const startGeneration = async () => {
    setIsLoading(true);
    setError(null);
    setShowConfirmNew(false);

    try {
      const selectedContents = topics
        .filter(t => selectedTopicIds.includes(t.id))
        .map(t => t.translations.find(tr => tr.language === "EN")?.content || "");

      const result = await generateExamQuestions(selectedContents, questionCount, instructions);
      
      if (result.success) {
        setGeneratedQuestions(result.data);
        showToast("Examen generado con éxito. Revisa las preguntas antes de guardar.", "success");
      } else {
        setError(result.error || "Error desconocido");
      }
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (generatedQuestions.length === 0) return;
    
    setIsSaving(true);
    try {
      const result = await saveExamAction(moduleId, generatedQuestions);
      if (result.success) {
        showToast("Examen guardado correctamente.", "success");
        setGeneratedQuestions([]); 
        setSelectedTopicIds([]);
        setInstructions("");
      } else {
        showToast(result.error || "Error al guardar el examen.", "error");
      }
    } catch (err: any) {
      showToast("Error de conexión al guardar.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = (index: number) => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditQuestion = (index: number, updatedQuestion: GeneratedQuestion) => {
    setGeneratedQuestions(prev => prev.map((q, i) => i === index ? updatedQuestion : q));
    setEditingIndex(null);
  };

  return (
    <div className="space-y-8">
      {/* Modals */}
      <ConfirmationModal 
        isOpen={showConfirmNew}
        title="¿Generar nuevo examen?"
        message="Ya tienes preguntas en pantalla. Si generas un nuevo examen ahora, las preguntas actuales se perderán permanentemente."
        confirmLabel="Sí, generar de nuevo"
        onConfirm={startGeneration}
        onCancel={() => setShowConfirmNew(false)}
      />

      <ConfirmationModal 
        isOpen={showExitConfirm}
        title="Cambios sin guardar"
        message="Tienes preguntas generadas que no han sido guardadas. Si sales de la página perderás todo el trabajo actual."
        confirmLabel="Salir sin guardar"
        cancelLabel="Quedarme aquí"
        variant="danger"
        onConfirm={() => {
          setGeneratedQuestions([]); // Clear to allow navigation
          window.history.back(); // Now it will actually go back
        }}
        onCancel={() => setShowExitConfirm(false)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Selection Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">1. Seleccionar Temas</h3>
            <button 
              onClick={selectAll}
              className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-widest"
            >
              {selectedTopicIds.length === topics.length ? "Deseleccionar todos" : "Seleccionar todos"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
            {topics.length > 0 ? (
              topics.map(topic => {
                const title = topic.translations.find(t => t.language === "ES")?.title || "Sin título";
                const isSelected = selectedTopicIds.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    onClick={() => toggleTopic(topic.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                      isSelected 
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-900 dark:text-blue-100" 
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      isSelected ? "bg-blue-600 border-blue-600" : "border-zinc-300 dark:border-zinc-700"
                    }`}>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium text-sm line-clamp-1">{title}</span>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl text-zinc-400">
                <p className="text-sm font-bold">No hay temas en este módulo</p>
                <p className="text-xs">Crea temas primero para poder generar un examen.</p>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Column */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold">2. Configuración</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-zinc-500">
                Cantidad de preguntas
              </label>
              <input 
                type="number"
                min="1"
                max="20"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-zinc-500">
                Instrucciones adicionales (opcional)
              </label>
              <textarea 
                placeholder="Ej: Enfócate en conceptos avanzados, incluye preguntas de código, etc."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleGenerateClick}
                disabled={isLoading || selectedTopicIds.length === 0}
                className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg ${
                  isLoading || selectedTopicIds.length === 0
                    ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed shadow-none"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/25 active:scale-[0.98]"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generando...
                  </span>
                ) : (
                  "Generar Examen con IA"
                )}
              </button>
              {selectedTopicIds.length === 0 && !isLoading && (
                <p className="text-[10px] text-center mt-2 text-zinc-400 font-bold uppercase tracking-tighter">
                  Selecciona al menos un tema para habilitar el botón
                </p>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {generatedQuestions.length > 0 && (
        <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="text-2xl font-black">Previsualización del Examen</h3>
              <p className="text-sm text-zinc-500 font-medium">Revisa, edita o elimina preguntas antes de guardar.</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3 bg-green-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-green-700 shadow-lg shadow-green-500/25 transition-all disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : "Guardar Examen Final"}
            </button>
          </div>

          <div className="space-y-6">
            {generatedQuestions.map((q, i) => (
              <div key={i} className="group relative p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                {/* Actions Toolbar */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingIndex(i)}
                    className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg hover:text-blue-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDeleteQuestion(i)}
                    className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg hover:text-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {editingIndex === i ? (
                  <QuestionEditor 
                    question={q} 
                    onSave={(updated) => handleEditQuestion(i, updated)}
                    onCancel={() => setEditingIndex(null)}
                  />
                ) : (
                  <>
                    <div className="flex items-start gap-4 mb-4 pr-20">
                      <span className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm shrink-0">
                        {i + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-lg mb-1">{q.questionEs}</h4>
                        <p className="text-sm text-zinc-500 italic">{q.questionEn}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-12">
                      {q.optionsEs.map((opt: string, idx: number) => (
                        <div 
                          key={idx}
                          className={`p-3 rounded-xl border text-sm transition-all ${
                            idx === q.correctOption 
                              ? "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-300"
                              : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800"
                          }`}
                        >
                          <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                          {opt}
                          <p className="text-[10px] opacity-60 mt-1">{q.optionsEn[idx]}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 ml-12 p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Explicación:</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{q.explanationEs}</p>
                      <p className="text-xs text-zinc-500 italic mt-1">{q.explanationEn}</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionEditor({ question, onSave, onCancel }: { question: GeneratedQuestion, onSave: (q: GeneratedQuestion) => void, onCancel: () => void }) {
  const [edited, setEdited] = useState(question);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-400">Pregunta (ES)</label>
          <textarea 
            className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm"
            value={edited.questionEs}
            onChange={(e) => setEdited({...edited, questionEs: e.target.value})}
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-400">Pregunta (EN)</label>
          <textarea 
            className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm italic"
            value={edited.questionEn}
            onChange={(e) => setEdited({...edited, questionEn: e.target.value})}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-zinc-400">Opciones (ES)</label>
          {edited.optionsEs.map((opt, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input 
                type="radio" 
                checked={edited.correctOption === idx}
                onChange={() => setEdited({...edited, correctOption: idx})}
                name={`correct-${edited.questionEn}`}
              />
              <input 
                className="flex-1 p-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg text-xs"
                value={opt}
                onChange={(e) => {
                  const newOpts = [...edited.optionsEs];
                  newOpts[idx] = e.target.value;
                  setEdited({...edited, optionsEs: newOpts});
                }}
              />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-zinc-400">Opciones (EN)</label>
          {edited.optionsEn.map((opt, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input 
                className="flex-1 p-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg text-xs italic"
                value={opt}
                onChange={(e) => {
                  const newOpts = [...edited.optionsEn];
                  newOpts[idx] = e.target.value;
                  setEdited({...edited, optionsEn: newOpts});
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onCancel} className="text-sm font-bold text-zinc-500 hover:text-black">Cancelar</button>
        <button 
          onClick={() => onSave(edited)}
          className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold"
        >
          Aplicar Cambios
        </button>
      </div>
    </div>
  );
}
