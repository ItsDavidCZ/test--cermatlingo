import React, { useState, useEffect } from 'react';
import { Question, Subject, Difficulty, PowerUpType } from '../types';
import { generateLessonQuestions } from '../services/geminiService';
import { playCorrectSound, playWrongSound, playFinishSound, playPopSound } from '../utils/audio';

interface QuizProps {
  subject: Subject;
  topic: string;
  difficulty?: Difficulty;
  onComplete: (xpEarned: number, correctCount: number, subject: Subject) => void;
  onExit: () => void;
  loseHeart: () => void;
  hearts: number;
  activePowerUp?: PowerUpType | null; // Added prop
}

type QuizStatus = 'LOADING' | 'IDLE' | 'SELECTED' | 'CORRECT' | 'WRONG' | 'FINISHED';

const Quiz: React.FC<QuizProps> = ({ subject, topic, difficulty = Difficulty.MEDIUM, onComplete, onExit, loseHeart, hearts, activePowerUp }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [status, setStatus] = useState<QuizStatus>('LOADING');
  const [xp, setXp] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [markedForReview, setMarkedForReview] = useState(false);
  
  // Hint System
  const [mistakesInLesson, setMistakesInLesson] = useState(0);
  const [showHint, setShowHint] = useState(false);

  // Initial load
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await generateLessonQuestions(subject, topic, difficulty);
        if (mounted) {
          setQuestions(data);
          setStatus('IDLE');
        }
      } catch (e) {
        if (mounted) onExit(); // Fail safe
      }
    };
    load();
    return () => { mounted = false; };
  }, [subject, topic, difficulty, onExit]);

  // Handle Logic
  const handleSelect = (option: string) => {
    if (status !== 'IDLE' && status !== 'SELECTED') return;
    playPopSound();
    setSelectedOption(option);
    setStatus('SELECTED');
  };

  const checkAnswer = () => {
    if (!selectedOption) return;

    const currentQ = questions[currentIndex];
    const isCorrect = selectedOption === currentQ.correctAnswer;

    if (isCorrect) {
      setStatus('CORRECT');
      setXp(prev => prev + 10);
      setCorrectCount(prev => prev + 1);
      playCorrectSound();
    } else {
      setStatus('WRONG');
      loseHeart();
      setMistakesInLesson(prev => prev + 1);
      playWrongSound();
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setStatus('IDLE');
      setMarkedForReview(false);
      setShowHint(false);
    } else {
      setStatus('FINISHED');
      playFinishSound();
      // Delay completion to show the celebration
      setTimeout(() => onComplete(xp, correctCount, subject), 2500); 
    }
  };

  if (status === 'LOADING') {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in">
        <div className="relative">
             <div className="text-6xl animate-bounce">🤔</div>
             <div className="absolute -bottom-2 w-full h-2 bg-black/10 rounded-full blur-sm animate-pulse"></div>
        </div>
        <div className="flex flex-col items-center gap-2">
            <div className="text-xl font-bold text-gray-700">Připravuji cvičení...</div>
            <div className="w-48 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-cermat-blue animate-shine shine-overlay w-full"></div>
            </div>
            <div className="text-sm text-gray-400 font-medium mt-2 text-center max-w-xs">
                AI generuje otázky na téma: <br/><span className="text-cermat-blue">{topic}</span>
            </div>
        </div>
      </div>
    );
  }

  if (status === 'FINISHED') {
    const isDoubleXp = activePowerUp === 'DOUBLE_XP';
    const finalXp = isDoubleXp ? xp * 2 : xp;

    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 animate-slide-up bg-yellow-50/50 relative">
        <div className="text-8xl animate-bounce">🎉</div>
        <h2 className="text-3xl font-bold text-cermat-yellow">Lekce dokončena!</h2>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
            <div className="bg-white p-4 rounded-2xl border-2 border-cermat-yellow shadow-sm flex flex-col items-center relative overflow-hidden">
                 <span className="text-gray-400 text-xs font-bold uppercase">Celkem XP</span>
                 <p className="text-2xl font-bold text-cermat-yellow">+{finalXp}</p>
                 {isDoubleXp && (
                    <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] px-2 py-0.5 font-bold rounded-bl-lg">2x BOOST</div>
                 )}
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-cermat-green shadow-sm flex flex-col items-center">
                 <span className="text-gray-400 text-xs font-bold uppercase">Úspěšnost</span>
                 <p className="text-2xl font-bold text-cermat-green">
                    {Math.round((correctCount / questions.length) * 100)}%
                 </p>
            </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
             <div className="w-full flex justify-between gap-3">
                 <button onClick={onExit} className="flex-1 py-3 rounded-2xl font-bold uppercase text-gray-500 bg-gray-100 border-b-4 border-gray-200 active:border-b-0 active:translate-y-1">
                    Zpět
                 </button>
                 <button disabled className="flex-1 py-3 rounded-2xl font-bold uppercase tracking-widest bg-cermat-green text-white border-b-4 border-cermat-green-dark shadow-lg">
                    Pokračovat
                 </button>
             </div>
        </div>
      </div>
    );
  }

  if (hearts <= 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full space-y-6 animate-slide-up">
        <div className="text-8xl animate-shake">💔</div>
        <h2 className="text-2xl font-bold text-cermat-red">Došly ti životy!</h2>
        <p className="text-lg text-gray-600">Dej si pauzu nebo si procvič starší látku.</p>
        <button 
            onClick={onExit}
            className="w-full max-w-xs py-3 rounded-2xl font-bold uppercase tracking-widest bg-cermat-blue text-white border-b-4 border-cermat-blue-dark active:border-b-0 active:translate-y-1"
        >
            Zpět
        </button>
      </div>
    )
  }

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto relative animate-fade-in overflow-hidden">
      
      {/* Correct Answer Celebration Overlay */}
      {status === 'CORRECT' && (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center overflow-hidden">
               <div className="w-full h-full absolute animate-ping bg-green-100/30"></div>
               <div className="text-9xl animate-pop opacity-0" style={{animationDelay: '0.1s', animationFillMode: 'forwards'}}>✨</div>
          </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 p-4 z-10 bg-white/80 backdrop-blur-sm">
        <button onClick={onExit} className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-cermat-green transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center text-cermat-red font-bold">
           <span className="mr-1 animate-pulse">❤️</span> {hearts}
        </div>
      </div>

      {/* Question Content */}
      <div key={currentIndex} className="flex-1 overflow-y-auto p-4 pb-48 animate-slide-in-right relative">
        <div className="flex justify-between items-start mb-4">
             <h2 className="text-2xl font-bold text-gray-700">{currentQ.questionText}</h2>
             {/* Hint Button - Appears if struggling */}
             {mistakesInLesson >= 2 && status === 'IDLE' && (
                 <button 
                    onClick={() => setShowHint(true)}
                    className="ml-2 p-2 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors animate-pop"
                    title="Zobrazit nápovědu"
                 >
                    💡
                 </button>
             )}
        </div>

        {/* Hint Display */}
        {showHint && currentQ.hint && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-xl text-sm font-medium animate-fade-in flex items-start gap-2">
                <span className="text-xl">💡</span>
                <div>
                    <span className="font-bold uppercase text-xs opacity-70 block">Nápověda</span>
                    {currentQ.hint}
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {currentQ.options?.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isCorrectAnswer = currentQ.correctAnswer === option;
            
            // Determine styles based on state
            let borderClass = 'border-b-4 border-gray-200';
            let bgClass = 'bg-white';
            let textClass = 'text-gray-700';
            let animationClass = 'hover:bg-gray-50';

            if (status === 'CORRECT' && isCorrectAnswer) {
                bgClass = 'bg-green-100';
                borderClass = 'border-b-4 border-green-500';
                textClass = 'text-green-700';
                animationClass = 'animate-bounce-short ring-2 ring-green-300 border-transparent';
            } else if (status === 'WRONG' && isSelected) {
                // Wrong answer selected: Shake animation
                bgClass = 'bg-red-100';
                borderClass = 'border-b-4 border-red-500';
                textClass = 'text-red-700';
                animationClass = 'animate-shake'; 
            } else if (status === 'WRONG' && isCorrectAnswer) {
                // Correct answer reveal: Pulse animation
                textClass = 'text-green-700 font-extrabold';
                animationClass = 'animate-pulse-strong'; 
            } else if (isSelected) {
                bgClass = 'bg-blue-100';
                borderClass = 'border-b-4 border-cermat-blue';
                textClass = 'text-cermat-blue';
                animationClass = 'animate-pop';
            }

            // Dim others
            const isDimmed = (status === 'CORRECT' || status === 'WRONG') && !isCorrectAnswer && !isSelected;

            return (
              <button
                key={idx}
                disabled={status === 'CORRECT' || status === 'WRONG'}
                onClick={() => handleSelect(option)}
                className={`
                  p-4 rounded-xl text-left font-semibold text-lg transition-all
                  border-2 ${isSelected || (status === 'CORRECT' && isCorrectAnswer) ? 'border-transparent' : 'border-gray-200'}
                  ${borderClass} ${bgClass} ${textClass}
                  ${isDimmed ? 'opacity-40 grayscale' : 'opacity-100'}
                  active:scale-[0.98] ${animationClass}
                `}
              >
                <div className="flex items-center">
                    <div className={`
                        w-6 h-6 border-2 rounded-md mr-4 flex items-center justify-center transition-colors
                        ${isSelected ? 'border-current' : 'border-gray-300'}
                    `}>
                        {isSelected && <div className="w-3 h-3 bg-current rounded-sm" />}
                    </div>
                    {option}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer / Feedback Area */}
      <div className={`
        fixed bottom-0 left-0 right-0 p-4 border-t-2 z-50 transition-all duration-500 ease-out pb-safe
        ${status === 'CORRECT' || status === 'WRONG' ? 'translate-y-0' : 'translate-y-0'}
        ${status === 'CORRECT' ? 'bg-green-100 border-green-200' : ''}
        ${status === 'WRONG' ? 'bg-red-100 border-red-200' : 'bg-white border-gray-200'}
      `}>
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
            
          {/* Feedback Text - Slided Up */}
          {status === 'CORRECT' && (
            <div className="flex items-center gap-2 text-green-700 font-bold text-xl animate-slide-up">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-sm animate-pop">✓</div>
              <div className="flex flex-col">
                  <span>Skvělá práce!</span>
                  <span className="text-xs font-normal opacity-80 uppercase tracking-wider">Správná odpověď</span>
              </div>
            </div>
          )}
          
          {status === 'WRONG' && (
             <div className="flex flex-col gap-2 animate-slide-up">
                <div className="flex items-center gap-2 text-red-700 font-bold text-xl">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-sm">✕</div>
                     <div className="flex flex-col">
                        <span>Chyba!</span>
                        <span className="text-xs font-normal opacity-80 uppercase tracking-wider">Nevadí, zkus to příště</span>
                     </div>
                </div>
                
                <div className="text-sm bg-white/60 p-3 rounded-xl border border-red-200 shadow-sm backdrop-blur-sm">
                    <div className="text-red-600 font-bold text-xs uppercase mb-1">Správná odpověď:</div>
                    <div className="text-gray-800 font-bold mb-2">{currentQ.correctAnswer}</div>
                    
                    <div className="border-t border-red-100 pt-2 mt-1">
                         <div className="text-gray-500 font-bold text-xs uppercase mb-1">Vysvětlení:</div>
                         <div className="text-gray-700 text-sm leading-snug">{currentQ.explanation}</div>
                    </div>
                </div>

                <button 
                  onClick={() => {
                      playPopSound();
                      setMarkedForReview(!markedForReview);
                  }}
                  className={`
                    flex items-center justify-center gap-2 py-2 px-4 rounded-xl border-2 font-bold text-sm transition-all active:scale-95
                    ${markedForReview 
                        ? 'bg-cermat-yellow/20 border-cermat-yellow text-yellow-700' 
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}
                  `}
                >
                   {/* Checkbox Icon */}
                   <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${markedForReview ? 'bg-yellow-500 border-yellow-500 text-white' : 'border-gray-400'}`}>
                        {markedForReview && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                   </div>
                   <span>Naučit se to znovu</span>
                </button>
             </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3">
              <button
                onClick={status === 'CORRECT' || status === 'WRONG' ? nextQuestion : checkAnswer}
                disabled={status === 'IDLE'}
                className={`
                  flex-1 py-3 rounded-2xl font-bold uppercase tracking-widest text-white transition-all
                  ${status === 'IDLE' 
                    ? 'bg-gray-200 text-gray-400 border-b-4 border-gray-300 cursor-not-allowed' 
                    : status === 'WRONG'
                        ? 'bg-red-500 border-b-4 border-red-700 active:border-b-0 active:translate-y-1 shadow-lg'
                        : status === 'CORRECT'
                            ? 'bg-green-500 border-b-4 border-green-700 active:border-b-0 active:translate-y-1 shadow-lg'
                            : 'bg-cermat-green border-b-4 border-cermat-green-dark active:border-b-0 active:translate-y-1 shadow-lg hover:brightness-105'
                  }
                `}
              >
                {status === 'CORRECT' || status === 'WRONG' ? 'Pokračovat' : 'Zkontrolovat'}
              </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Quiz;