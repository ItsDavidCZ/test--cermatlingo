import React, { useState, useEffect } from 'react';
import { Lesson, Subject } from '../types';
import { playWrongSound, playClickSound, playCorrectSound } from '../utils/audio';

interface DashboardProps {
  lessons: Lesson[];
  subject: Subject;
  startLesson: (lessonId: string) => void;
  switchSubject: (subject: Subject) => void;
  onChestFound: (xp: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ lessons, subject, startLesson, switchSubject, onChestFound }) => {
  const [lockedToast, setLockedToast] = useState<{show: boolean, msg: string, x: number, y: number} | null>(null);
  const [showShareModal, setShowShareModal] = useState<Lesson | null>(null);
  const [exitingLessonId, setExitingLessonId] = useState<string | null>(null); // For transition
  
  // Mystery Chest State
  const [showMysteryChest, setShowMysteryChest] = useState(false);
  const [chestPositionIndex, setChestPositionIndex] = useState(2); // Position near the start

  // Chance to spawn a mystery chest on mount
  useEffect(() => {
    const chance = Math.random();
    if (chance < 0.2) { // 20% chance on load
        setShowMysteryChest(true);
        // Random position between 1 and 3
        setChestPositionIndex(Math.floor(Math.random() * 3) + 1);
    }
  }, []);

  const getPositionClass = (index: number) => {
    const pos = index % 4;
    switch(pos) {
      case 0: return 'translate-x-0';
      case 1: return 'translate-x-12';
      case 2: return 'translate-x-0';
      case 3: return '-translate-x-12';
      default: return 'translate-x-0';
    }
  };

  const handleLockedClick = (e: React.MouseEvent, index: number, filteredLessons: Lesson[]) => {
    playWrongSound();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    
    let msg = "Nejdřív dokonči předchozí lekci!";
    
    // Check if the previous lesson exists and has enough stars
    if (index > 0) {
        const prevLesson = filteredLessons[index - 1];
        if (prevLesson.isCompleted && prevLesson.stars < 2) {
            msg = "Získej alespoň 2 hvězdy v minulé lekci!";
        }
    }

    setLockedToast({
        show: true,
        msg: msg,
        x: rect.left + rect.width / 2,
        y: rect.top
    });

    setTimeout(() => setLockedToast(null), 2500);
  };

  const handleStartWithTransition = (lessonId: string) => {
      setExitingLessonId(lessonId);
      // Wait for visual effect before switching component in parent
      setTimeout(() => {
          startLesson(lessonId);
      }, 300);
  };

  const handleShare = (e: React.MouseEvent, lesson: Lesson) => {
      e.stopPropagation();
      playClickSound();
      setShowShareModal(lesson);
  };

  const handleOpenChest = () => {
      playCorrectSound();
      setShowMysteryChest(false);
      const bonus = Math.floor(Math.random() * 20) + 10; // 10-30 XP
      onChestFound(bonus);
  };

  const themeColor = subject === Subject.CZECH ? 'cermat-red' : 'cermat-blue';
  const themeDark = subject === Subject.CZECH ? 'border-cermat-red-dark' : 'border-cermat-blue-dark';
  const themeBg = subject === Subject.CZECH ? 'bg-cermat-red' : 'bg-cermat-blue';

  const currentSubjectLessons = lessons.filter(l => l.subject === subject);

  return (
    <div className={`flex flex-col pb-24 relative transition-all duration-300 ${exitingLessonId ? 'opacity-0 scale-95 filter blur-sm' : 'opacity-100 scale-100'}`}>
      {/* Subject Switcher Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-30 border-b-2 border-gray-200 p-4 flex justify-center gap-4 shadow-sm">
        <button 
          onClick={() => switchSubject(Subject.CZECH)}
          className={`px-4 py-2 rounded-xl font-bold border-b-4 transition-all ${subject === Subject.CZECH ? 'bg-cermat-red text-white border-cermat-red-dark' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
        >
          Čeština
        </button>
        <button 
          onClick={() => switchSubject(Subject.MATH)}
          className={`px-4 py-2 rounded-xl font-bold border-b-4 transition-all ${subject === Subject.MATH ? 'bg-cermat-blue text-white border-cermat-blue-dark' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
        >
          Matika
        </button>
      </div>

      {/* Unit Header */}
      <div className={`p-6 mb-8 text-white ${themeBg} rounded-b-3xl shadow-md transition-colors duration-500`}>
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold">Lekce 1</h1>
                <p className="opacity-90">Základy pro přijímačky 2025</p>
            </div>
            <div className="text-4xl opacity-50">📚</div>
        </div>
      </div>

      {/* Locked Toast Overlay */}
      {lockedToast && (
          <div 
            className="fixed z-50 transform -translate-x-1/2 -translate-y-12 animate-bounce-short pointer-events-none"
            style={{ left: lockedToast.x, top: lockedToast.y }}
          >
              <div className="bg-gray-800 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-xl whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-gray-800">
                  {lockedToast.msg}
              </div>
          </div>
      )}

      {/* Path */}
      <div className="flex flex-col items-center gap-8 px-4">
        {currentSubjectLessons.map((lesson, index) => {
          const isLocked = lesson.isLocked;
          const isCompleted = lesson.isCompleted;
          
          let btnBg = isLocked ? 'bg-gray-200' : (isCompleted ? 'bg-cermat-yellow' : themeBg);
          let btnBorder = isLocked ? 'border-gray-300' : (isCompleted ? 'border-yellow-600' : themeDark);
          const shineEffect = isCompleted ? 'overflow-hidden' : '';

          return (
            <div key={lesson.id} className={`relative flex flex-col items-center ${getPositionClass(index)}`}>
               
               {/* Mystery Chest floating near path */}
               {showMysteryChest && index === chestPositionIndex && (
                   <div className="absolute -right-16 top-0 z-20 animate-bounce cursor-pointer" onClick={handleOpenChest}>
                        <div className="text-5xl drop-shadow-xl filter hover:brightness-110 transition-all">🎁</div>
                        <div className="bg-white px-2 py-0.5 rounded-lg text-[10px] font-bold text-gray-500 border border-gray-200 shadow absolute -top-2 -right-2">Klikni!</div>
                   </div>
               )}

               {/* Clickable Circle */}
              <button
                onClick={(e) => isLocked ? handleLockedClick(e, index, currentSubjectLessons) : handleStartWithTransition(lesson.id)}
                className={`
                  w-20 h-20 rounded-full border-b-[6px] flex items-center justify-center text-3xl text-white shadow-xl transition-transform relative group
                  ${btnBg} ${btnBorder} ${shineEffect}
                  ${!isLocked ? 'active:border-b-0 active:translate-y-[6px] hover:brightness-110' : 'cursor-default'}
                `}
              >
                {/* Shine Animation Layer for Completed */}
                {isCompleted && (
                    <div className="absolute inset-0 w-full h-full animate-shine shine-overlay pointer-events-none"></div>
                )}
                
                <span className="relative z-10 drop-shadow-md">
                    {isCompleted ? '👑' : (isLocked ? '🔒' : '★')}
                </span>

                {/* Share Button (Only for Completed) */}
                {isCompleted && (
                    <div 
                        onClick={(e) => handleShare(e, lesson)}
                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-sm shadow-md text-blue-500 hover:scale-110 transition-transform active:scale-90"
                    >
                        🔗
                    </div>
                )}
              </button>
              
              {/* Stars display */}
              {isCompleted && (
                  <div className="absolute -top-2 -right-2 flex pointer-events-none">
                      {[1,2,3].map(s => (
                          <span key={s} className={`text-sm drop-shadow-sm animate-bounce-short ${s <= lesson.stars ? 'text-cermat-yellow' : 'text-gray-300'}`} style={{animationDelay: `${s * 0.2}s`}}>★</span>
                      ))}
                  </div>
              )}
              
              {/* Title Tooltip-ish */}
              <div className="mt-2 text-center">
                 <span className={`font-bold text-sm ${isCompleted ? 'text-cermat-yellow' : 'text-gray-400'}`}>{lesson.title}</span>
              </div>
            </div>
          );
        })}
        
        {/* Mascot at the end */}
        <div className="mt-8 flex flex-col items-center opacity-50">
           <div className="text-6xl mb-2 grayscale">🎓</div>
           <p className="text-gray-400 font-bold">Více lekcí již brzy...</p>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-in flex flex-col items-center text-center relative">
                  <button onClick={() => setShowShareModal(null)} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 text-xl font-bold">✕</button>
                  
                  <div className="text-6xl mb-4 animate-bounce">🏆</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Sdílej svůj úspěch!</h2>
                  <p className="text-gray-500 mb-6">
                      Dokončil jsi lekci <span className="font-bold text-cermat-blue">{showShareModal.title}</span>.
                      Pochlub se kamarádům!
                  </p>
                  
                  <div className="flex gap-2 w-full">
                      <button 
                        onClick={() => {
                            // Mock share
                            playClickSound();
                            alert("Odkaz zkopírován do schránky!");
                            setShowShareModal(null);
                        }}
                        className="flex-1 py-3 bg-cermat-blue text-white rounded-xl font-bold border-b-4 border-cermat-blue-dark active:border-b-0 active:translate-y-1"
                      >
                          Kopírovat
                      </button>
                      <button 
                         onClick={() => setShowShareModal(null)}
                         className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold border-b-4 border-gray-200 active:border-b-0 active:translate-y-1"
                      >
                          Zavřít
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;