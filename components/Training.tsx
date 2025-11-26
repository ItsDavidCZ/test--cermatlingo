import React, { useState } from 'react';
import { Subject, Difficulty } from '../types';

interface TrainingProps {
  startPractice: (subject: Subject, difficulty: Difficulty) => void;
}

const Training: React.FC<TrainingProps> = ({ startPractice }) => {
  const [startingSubject, setStartingSubject] = useState<Subject | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);

  const handleStart = (subject: Subject) => {
    setStartingSubject(subject);
    // Simulate a brief loading/preparation phase for visual feedback
    setTimeout(() => {
      startPractice(subject, difficulty);
      // Reset is handled by unmount, but good practice to reset if we returned
      setStartingSubject(null);
    }, 600);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 animate-fade-in text-center">
      <div className="text-8xl mb-6">💪</div>
      <h1 className="text-2xl font-bold text-gray-700 mb-2">Tréninkové centrum</h1>
      <p className="text-gray-500 mb-6 max-w-xs">
        Procvičuj své slabé stránky a získej jistotu k přijímačkám.
      </p>

      {/* Difficulty Selector */}
      <div className="w-full max-w-sm bg-gray-100 p-1 rounded-xl flex mb-8">
        {[
            { id: Difficulty.EASY, label: 'Lehká' },
            { id: Difficulty.MEDIUM, label: 'Střední' },
            { id: Difficulty.HARD, label: 'Těžká' }
        ].map((level) => (
            <button
                key={level.id}
                onClick={() => setDifficulty(level.id)}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    difficulty === level.id 
                    ? 'bg-white text-cermat-blue shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
            >
                {level.label}
            </button>
        ))}
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* Czech Button */}
        <button 
          onClick={() => handleStart(Subject.CZECH)}
          disabled={startingSubject !== null}
          className={`
            w-full bg-white border-2 border-gray-200 rounded-2xl p-4 flex items-center gap-4 transition-all
            ${startingSubject === Subject.CZECH ? 'scale-105 border-cermat-red shadow-lg bg-red-50' : 'hover:bg-gray-50 active:scale-95 border-b-4 active:border-b-2'}
            ${startingSubject && startingSubject !== Subject.CZECH ? 'opacity-50 grayscale' : ''}
          `}
        >
           <div className="w-12 h-12 bg-cermat-red rounded-xl flex items-center justify-center text-2xl relative">
             {startingSubject === Subject.CZECH ? (
               <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin w-8 h-8 m-auto"></div>
             ) : '📖'}
           </div>
           <div className="text-left flex-1">
             <div className="font-bold text-gray-700">
               {startingSubject === Subject.CZECH ? 'Připravuji cvičení...' : 'Rychlé opakování Češtiny'}
             </div>
             <div className="text-sm text-gray-400">Náhodný mix otázek</div>
           </div>
        </button>

        {/* Math Button */}
        <button 
          onClick={() => handleStart(Subject.MATH)}
          disabled={startingSubject !== null}
          className={`
            w-full bg-white border-2 border-gray-200 rounded-2xl p-4 flex items-center gap-4 transition-all
            ${startingSubject === Subject.MATH ? 'scale-105 border-cermat-blue shadow-lg bg-blue-50' : 'hover:bg-gray-50 active:scale-95 border-b-4 active:border-b-2'}
            ${startingSubject && startingSubject !== Subject.MATH ? 'opacity-50 grayscale' : ''}
          `}
        >
           <div className="w-12 h-12 bg-cermat-blue rounded-xl flex items-center justify-center text-2xl relative">
            {startingSubject === Subject.MATH ? (
               <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin w-8 h-8 m-auto"></div>
             ) : '📐'}
           </div>
           <div className="text-left flex-1">
             <div className="font-bold text-gray-700">
               {startingSubject === Subject.MATH ? 'Připravuji cvičení...' : 'Rychlé opakování Matiky'}
             </div>
             <div className="text-sm text-gray-400">Náhodný mix otázek</div>
           </div>
        </button>

         <button 
          disabled
          className="w-full bg-gray-100 border-2 border-gray-200 rounded-2xl p-4 flex items-center gap-4 opacity-60 cursor-not-allowed"
        >
           <div className="w-12 h-12 bg-cermat-yellow rounded-xl flex items-center justify-center text-2xl">
             🎯
           </div>
           <div className="text-left">
             <div className="font-bold text-gray-700">Test chyb</div>
             <div className="text-sm text-gray-400">Pouze pro CermatLingo Plus (Brzy)</div>
           </div>
        </button>
      </div>
    </div>
  );
};

export default Training;