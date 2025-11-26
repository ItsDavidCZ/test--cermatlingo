import React, { useState, useEffect } from 'react';
import { UserState, Subject, Lesson, Badge, Difficulty, PowerUpType } from './types';
import Dashboard from './components/Dashboard';
import Quiz from './components/Quiz';
import Training from './components/Training';
import Profile from './components/Profile';
import Login from './components/Login';
import { AuthService, INITIAL_USER_STATE_TEMPLATE } from './services/authService';
import { playClickSound, playLevelUpSound, playWrongSound, playFinishSound } from './utils/audio';

// Initial Mock Data Structure
const INITIAL_LESSONS: Lesson[] = [
  // CZECH
  { id: 'cz-1', title: 'Pravopis I/Y', subject: Subject.CZECH, topic: 'pravopis i/y ve vyjmenovaných slovech a koncovkách', isCompleted: false, isLocked: false, stars: 0 },
  { id: 'cz-2', title: 'Větný rozbor', subject: Subject.CZECH, topic: 'větné členy, podmět a přísudek', isCompleted: false, isLocked: true, stars: 0 },
  { id: 'cz-3', title: 'Literatura', subject: Subject.CZECH, topic: 'čeští autoři 19. a 20. století', isCompleted: false, isLocked: true, stars: 0 },
  { id: 'cz-4', title: 'Porozumění', subject: Subject.CZECH, topic: 'porozumění textu a stylistika', isCompleted: false, isLocked: true, stars: 0 },
  
  // MATH
  { id: 'm-1', title: 'Zlomky', subject: Subject.MATH, topic: 'sčítání, odčítání a krácení zlomků', isCompleted: false, isLocked: false, stars: 0 },
  { id: 'm-2', title: 'Rovnice', subject: Subject.MATH, topic: 'lineární rovnice o jedné neznámé', isCompleted: false, isLocked: true, stars: 0 },
  { id: 'm-3', title: 'Geometrie', subject: Subject.MATH, topic: 'obvody a obsahy rovinných útvarů', isCompleted: false, isLocked: true, stars: 0 },
  { id: 'm-4', title: 'Procenta', subject: Subject.MATH, topic: 'výpočty s procenty a trojčlenka', isCompleted: false, isLocked: true, stars: 0 },
];

enum Tab {
  LEARN = 'LEARN',
  TRAINING = 'TRAINING',
  PROFILE = 'PROFILE'
}

function App() {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // App State
  const [activeTab, setActiveTab] = useState<Tab>(Tab.LEARN);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>(INITIAL_LESSONS);
  
  // Placeholder initial state - will be overwritten on login
  const [user, setUser] = useState<UserState>({
      ...INITIAL_USER_STATE_TEMPLATE,
      username: 'Guest',
      createdAt: Date.now()
  });
  
  // For standard lessons
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  
  // For practice mode
  const [practiceContext, setPracticeContext] = useState<{subject: Subject, topic: string, difficulty: Difficulty} | null>(null);

  const [showHeartToast, setShowHeartToast] = useState(false);
  const [showLevelUpToast, setShowLevelUpToast] = useState<{show: boolean, level: number}>({show: false, level: 1});
  const [showBadgeToast, setShowBadgeToast] = useState<{show: boolean, badgeName: string}>({show: false, badgeName: ''});
  const [showNoHeartsModal, setShowNoHeartsModal] = useState(false);
  const [showChestRewardToast, setShowChestRewardToast] = useState<{show: boolean, xp: number}>({show: false, xp: 0});

  // --- AUTH Handlers ---

  const handleRegister = async (username: string, password: string) => {
      const response = AuthService.register(username, password, INITIAL_LESSONS);
      if (response.success && response.user && response.lessons) {
          setUser(response.user);
          setLessons(response.lessons);
          setCurrentUser(response.user.username);
          setIsLoggedIn(true);
          return { success: true };
      }
      return { success: false, message: response.message };
  };

  const handleLogin = async (username: string, password: string) => {
      const response = AuthService.login(username, password);
      if (response.success && response.user && response.lessons) {
          setUser(response.user);
          setLessons(response.lessons);
          setCurrentUser(response.user.username);
          setIsLoggedIn(true);
          return { success: true };
      }
      return { success: false, message: response.message };
  };

  const handleLogout = () => {
      setIsLoggedIn(false);
      setCurrentUser(null);
      setActiveTab(Tab.LEARN);
      setIsQuizMode(false);
  };

  // Save on change (Persistence)
  useEffect(() => {
      if (isLoggedIn && currentUser) {
          AuthService.saveProgress(currentUser, user, lessons);
      }
  }, [user, lessons, isLoggedIn, currentUser]);


  // --- HEART REGENERATION ---
  useEffect(() => {
    if (!isLoggedIn) return;

    const timer = setInterval(() => {
      setUser(prev => {
        if (prev.hearts < 5) {
            const newHearts = Math.min(prev.hearts + 1, 5);
            if (prev.hearts === 0 && newHearts === 1) {
                setShowHeartToast(true);
            }
            return { ...prev, hearts: newHearts };
        }
        return prev;
      });
    }, 300000); // 5 minutes in ms
    
    return () => clearInterval(timer);
  }, [isLoggedIn]);

  // Auto-hide toasts
  useEffect(() => {
    if (showHeartToast) {
        const t = setTimeout(() => setShowHeartToast(false), 4000);
        return () => clearTimeout(t);
    }
  }, [showHeartToast]);

  useEffect(() => {
    if (showLevelUpToast.show) {
        const t = setTimeout(() => setShowLevelUpToast({show: false, level: showLevelUpToast.level}), 5000);
        return () => clearTimeout(t);
    }
  }, [showLevelUpToast.show]);

  useEffect(() => {
    if (showBadgeToast.show) {
        const t = setTimeout(() => setShowBadgeToast({show: false, badgeName: ''}), 5000);
        return () => clearTimeout(t);
    }
  }, [showBadgeToast.show]);

  useEffect(() => {
    if (showChestRewardToast.show) {
        const t = setTimeout(() => setShowChestRewardToast({show: false, xp: 0}), 4000);
        return () => clearTimeout(t);
    }
  }, [showChestRewardToast.show]);

  const handleTabChange = (tab: Tab) => {
    playClickSound();
    setActiveTab(tab);
  };

  const checkHeartsAndStart = (callback: () => void) => {
    if (user.hearts > 0) {
        callback();
    } else {
        playWrongSound();
        setShowNoHeartsModal(true);
    }
  };

  const startLesson = (id: string) => {
    // Note: Click sound handled in Dashboard now
    checkHeartsAndStart(() => {
        setActiveLessonId(id);
        setIsQuizMode(true);
    });
  };

  const startPractice = (subject: Subject, difficulty: Difficulty) => {
    // Note: Click sound and delay handled in Training component
    checkHeartsAndStart(() => {
        setPracticeContext({
            subject,
            topic: 'mix otázek k přijímacím zkouškám, všeobecný přehled učiva',
            difficulty
          });
          setIsQuizMode(true);
    });
  };

  const completeLesson = (baseEarnedXp: number, correctCount: number, subject: Subject) => {
    const totalQuestionsInLesson = 5;

    // --- POWER UP LOGIC ---
    let finalXp = baseEarnedXp;
    let powerUpConsumed = false;
    
    if (user.activePowerUp === 'DOUBLE_XP') {
        finalXp = baseEarnedXp * 2;
        powerUpConsumed = true;
    }

    // --- LEVEL UP LOGIC ---
    const currentLevel = Math.floor(user.xp / 500) + 1;
    const newTotalXp = user.xp + finalXp;
    const newLevel = Math.floor(newTotalXp / 500) + 1;
    
    if (newLevel > currentLevel) {
        playLevelUpSound();
        setShowLevelUpToast({show: true, level: newLevel});
    }

    // Determine topic to update count
    let currentTopic = 'Obecný mix';
    if (activeLessonId) {
        const l = lessons.find(l => l.id === activeLessonId);
        if (l) currentTopic = l.topic;
    }

    // Calculate stars (5/5 = 3, 4/5 = 2, 3/5 = 1, else 0)
    let starsEarned = 0;
    if (correctCount === 5) starsEarned = 3;
    else if (correctCount === 4) starsEarned = 2;
    else if (correctCount === 3) starsEarned = 1;

    // Lesson unlocking logic
    if (activeLessonId) {
        setLessons(prev => {
            const newLessons = [...prev];
            const currentIndex = newLessons.findIndex(l => l.id === activeLessonId);
            
            if (currentIndex !== -1) {
                // Update completion status and stars (keep highest stars)
                newLessons[currentIndex].isCompleted = true;
                const oldStars = newLessons[currentIndex].stars;
                newLessons[currentIndex].stars = Math.max(oldStars, starsEarned);
                
                // UNLOCK RULE: Unlock next lesson ONLY if current has >= 2 stars
                if (newLessons[currentIndex].stars >= 2) {
                    const nextLessonIndex = newLessons.findIndex((l, idx) => 
                        idx > currentIndex && l.subject === newLessons[currentIndex].subject
                    );
                    if (nextLessonIndex !== -1) {
                        newLessons[nextLessonIndex].isLocked = false;
                    }
                }
            }
            return newLessons;
        });
    }

    // --- BADGE & REWARD LOGIC ---
    const newBadges: string[] = [];
    let potionsEarned = 0;

    // 1. First Lesson Badge
    if (user.completedLessons.length === 0 && activeLessonId && !user.badges.includes('first_lesson')) {
        newBadges.push('first_lesson');
        setShowBadgeToast({show: true, badgeName: 'Začátečník'});
    }

    // 2. Perfect Score Badge
    if (correctCount === totalQuestionsInLesson && !user.badges.includes('perfect_score')) {
        newBadges.push('perfect_score');
        setShowBadgeToast({show: true, badgeName: 'Ostrostřelec'});
    }

    // 3. Subject Mastery
    const currentSubjectLessons = lessons.filter(l => l.subject === subject);
    const completedSubjectCount = user.completedLessons.filter(id => lessons.find(l => l.id === id)?.subject === subject).length + (activeLessonId ? 1 : 0);
    
    if (completedSubjectCount >= currentSubjectLessons.length) {
         if (subject === Subject.MATH && !user.badges.includes('math_master')) {
             newBadges.push('math_master');
             setShowBadgeToast({show: true, badgeName: 'Pythagoras'});
         }
         if (subject === Subject.CZECH && !user.badges.includes('czech_master')) {
             newBadges.push('czech_master');
             setShowBadgeToast({show: true, badgeName: 'Karel Čapek'});
         }
    }

    // 4. Streak Badges & Potion Rewards (Simulated check)
    if (user.streak >= 3 && !user.badges.includes('streak_3')) {
        newBadges.push('streak_3');
    }
    // Every 7 days, grant a potion
    if (user.streak > 0 && user.streak % 7 === 0) {
        potionsEarned = 1; 
    }
    
    if (user.streak >= 30 && !user.badges.includes('streak_30')) {
        newBadges.push('streak_30');
    }

    // Update User
    setUser(prev => ({
      ...prev,
      xp: prev.xp + finalXp,
      weeklyProgress: prev.weeklyProgress + finalXp,
      badges: [...prev.badges, ...newBadges],
      completedLessons: (activeLessonId && !prev.completedLessons.includes(activeLessonId)) ? [...prev.completedLessons, activeLessonId] : prev.completedLessons,
      activePowerUp: powerUpConsumed ? null : prev.activePowerUp,
      inventory: {
          ...prev.inventory,
          doubleXpPotions: prev.inventory.doubleXpPotions + potionsEarned
      },
      stats: {
          ...prev.stats,
          totalQuestions: prev.stats.totalQuestions + totalQuestionsInLesson,
          totalCorrect: prev.stats.totalCorrect + correctCount,
          lessonsCompleted: prev.stats.lessonsCompleted + (activeLessonId ? 1 : 0),
          czechXp: subject === Subject.CZECH ? prev.stats.czechXp + finalXp : prev.stats.czechXp,
          mathXp: subject === Subject.MATH ? prev.stats.mathXp + finalXp : prev.stats.mathXp,
          topicCounts: {
              ...prev.stats.topicCounts,
              [currentTopic]: (prev.stats.topicCounts[currentTopic] || 0) + 1
          }
      }
    }));

    if (potionsEarned > 0) {
        setTimeout(() => alert(`🎉 Gratulujeme! Za udržení streaku získáváš ${potionsEarned}x XP Lektvar!`), 500);
    }

    setIsQuizMode(false);
    setActiveLessonId(null);
    setPracticeContext(null);
  };

  const handleLoseHeart = () => {
    setUser(prev => ({ ...prev, hearts: Math.max(0, prev.hearts - 1) }));
  };

  const handleChangeAvatar = (avatarId: string) => {
      playClickSound();
      setUser(prev => ({...prev, avatar: avatarId}));
  };

  const handleThemeChange = (theme: 'light' | 'warm' | 'dark') => {
      playClickSound();
      setUser(prev => ({...prev, theme}));
  }

  const handleGoalChange = (goal: number) => {
      setUser(prev => ({...prev, weeklyGoal: goal}));
  }

  const handleActivatePowerUp = (type: PowerUpType) => {
      if (type === 'DOUBLE_XP' && user.inventory.doubleXpPotions > 0) {
          playLevelUpSound();
          setUser(prev => ({
              ...prev,
              inventory: { ...prev.inventory, doubleXpPotions: prev.inventory.doubleXpPotions - 1 },
              activePowerUp: 'DOUBLE_XP'
          }));
      }
  }

  // Handle Mystery Chest Found in Dashboard
  const handleChestFound = (bonusXp: number) => {
      setUser(prev => ({ ...prev, xp: prev.xp + bonusXp, weeklyProgress: prev.weeklyProgress + bonusXp }));
      setShowChestRewardToast({ show: true, xp: bonusXp });
  }

  if (!isLoggedIn) {
      return <Login onLogin={handleLogin} onRegister={handleRegister} />;
  }

  // Determine active quiz props
  const activeLesson = activeLessonId ? lessons.find(l => l.id === activeLessonId) : null;
  const quizSubject = activeLesson ? activeLesson.subject : practiceContext?.subject;
  const quizTopic = activeLesson ? activeLesson.topic : practiceContext?.topic;
  const quizDifficulty = practiceContext?.difficulty || Difficulty.MEDIUM;

  // Determine theme class
  let themeClass = 'bg-gray-50'; // default light
  if (user.theme === 'warm') themeClass = 'bg-orange-50';
  if (user.theme === 'dark') themeClass = 'bg-gray-900 text-white';

  return (
    <div className={`${themeClass} min-h-screen flex justify-center font-sans transition-colors duration-500`}>
      {/* Mobile Container Limit */}
      <div className={`w-full max-w-lg min-h-screen relative shadow-2xl flex flex-col overflow-hidden ${user.theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white'}`}>
        
        {/* TOP BAR (Visible on Dashboard/Tabs) */}
        {!isQuizMode && (
          <div className={`flex justify-between items-center px-4 py-3 border-b-2 sticky top-0 z-40 ${user.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-2" title="Streak">
               <span className="text-xl">🔥</span> 
               <span className="font-bold text-gray-400">{user.streak}</span>
            </div>
            
            {/* XP and Active PowerUp Display */}
            <div className="flex items-center gap-2 relative" title="XP">
               {user.activePowerUp === 'DOUBLE_XP' && (
                   <span className="absolute -top-3 -right-3 bg-purple-500 text-white text-[10px] font-bold px-1.5 rounded-full animate-bounce">2x</span>
               )}
               <span className="text-xl">💎</span> 
               <span className={`font-bold ${user.activePowerUp === 'DOUBLE_XP' ? 'text-purple-500' : 'text-cermat-blue'}`}>
                   {user.xp}
               </span>
            </div>

            <div className="flex items-center gap-2" title="Životy">
               <span className="text-xl text-cermat-red">❤️</span> 
               <span className="font-bold text-cermat-red">{user.hearts}</span>
            </div>
          </div>
        )}

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto">
          {!isQuizMode ? (
            <>
              {activeTab === Tab.LEARN && (
                <Dashboard 
                  lessons={lessons} 
                  subject={user.currentSubject}
                  startLesson={startLesson}
                  switchSubject={(s) => {
                    playClickSound();
                    setUser(prev => ({ ...prev, currentSubject: s }))
                  }}
                  onChestFound={handleChestFound}
                />
              )}
              {activeTab === Tab.TRAINING && (
                <Training startPractice={startPractice} />
              )}
              {activeTab === Tab.PROFILE && (
                <Profile 
                    user={user} 
                    onChangeAvatar={handleChangeAvatar} 
                    onThemeChange={handleThemeChange}
                    onGoalChange={handleGoalChange}
                    onActivatePowerUp={handleActivatePowerUp}
                    onLogout={handleLogout}
                />
              )}
            </>
          ) : (
            (quizSubject && quizTopic) ? (
              <Quiz 
                subject={quizSubject}
                topic={quizTopic}
                difficulty={quizDifficulty}
                onComplete={completeLesson}
                onExit={() => {
                    playClickSound();
                    setIsQuizMode(false);
                    setActiveLessonId(null);
                    setPracticeContext(null);
                }}
                loseHeart={handleLoseHeart}
                hearts={user.hearts}
                activePowerUp={user.activePowerUp}
              />
            ) : null
          )}
        </div>

        {/* --- MODALS & TOASTS --- */}

        {/* No Hearts Modal */}
        {showNoHeartsModal && (
            <div className="absolute inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white w-full max-w-sm m-4 p-6 rounded-3xl shadow-2xl animate-scale-in flex flex-col items-center text-center">
                    <div className="text-8xl mb-4 animate-shake">💔</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Došly ti životy!</h2>
                    <p className="text-gray-500 mb-6">Nemůžeš začít novou lekci. Počkej, až se ti doplní zdraví, nebo si procvič starší poznámky.</p>
                    
                    <button 
                        onClick={() => setShowNoHeartsModal(false)}
                        className="w-full py-3 bg-cermat-blue text-white rounded-xl font-bold uppercase tracking-wider border-b-4 border-cermat-blue-dark active:border-b-0 active:translate-y-1"
                    >
                        Rozumím
                    </button>
                </div>
            </div>
        )}

        {showHeartToast && (
            <div className="absolute top-16 left-4 right-4 bg-cermat-red text-white p-4 rounded-xl shadow-xl z-50 animate-bounce-short flex items-center justify-between border-b-4 border-cermat-red-dark">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">❤️</span>
                    <div>
                        <div className="font-bold">Život doplněn!</div>
                        <div className="text-sm opacity-90">Můžeš se dál učit.</div>
                    </div>
                </div>
                <button onClick={() => setShowHeartToast(false)} className="opacity-75 hover:opacity-100">✕</button>
            </div>
        )}

        {showChestRewardToast.show && (
            <div className="absolute top-24 left-0 right-0 z-[55] flex justify-center pointer-events-none">
                 <div className="bg-purple-100 text-purple-800 p-4 rounded-2xl shadow-xl animate-bounce-short flex items-center gap-3 border-b-4 border-purple-300 mx-4 max-w-sm pointer-events-auto">
                    <div className="text-3xl">🎁</div>
                    <div>
                        <div className="font-bold text-sm uppercase opacity-70">Tajemná odměna!</div>
                        <div className="font-extrabold text-lg leading-tight">+{showChestRewardToast.xp} XP</div>
                    </div>
                 </div>
            </div>
        )}

        {showLevelUpToast.show && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div className="bg-cermat-yellow text-yellow-900 p-6 rounded-3xl shadow-2xl animate-pop border-b-8 border-yellow-600 mx-6 text-center pointer-events-auto">
                    <div className="text-6xl mb-4 animate-bounce">🆙</div>
                    <div className="text-2xl font-bold mb-2">LEVEL UP!</div>
                    <div className="text-lg">Dosáhl jsi úrovně {showLevelUpToast.level}</div>
                </div>
            </div>
        )}

        {showBadgeToast.show && (
            <div className="absolute top-24 left-0 right-0 z-[55] flex justify-center pointer-events-none">
                 <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white p-4 rounded-2xl shadow-xl animate-bounce-short flex items-center gap-3 border-b-4 border-yellow-600 mx-4 max-w-sm pointer-events-auto">
                    <div className="text-3xl bg-white/20 rounded-lg p-1">🏅</div>
                    <div>
                        <div className="font-bold text-sm uppercase text-yellow-50">Nový odznak!</div>
                        <div className="font-extrabold text-lg leading-tight">{showBadgeToast.badgeName}</div>
                    </div>
                 </div>
            </div>
        )}

        {/* BOTTOM NAV (Only tabs view) */}
        {!isQuizMode && (
          <div className={`sticky bottom-0 border-t-2 px-2 py-2 flex justify-around items-center z-40 pb-safe ${user.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            
            <button 
                onClick={() => handleTabChange(Tab.LEARN)}
                className={`flex flex-1 flex-col items-center p-2 rounded-xl transition-colors ${activeTab === Tab.LEARN ? 'bg-blue-50 text-cermat-blue border-t-2 border-cermat-blue' : 'text-gray-400 hover:text-gray-500'}`}
            >
              <svg className="w-7 h-7 mb-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
              <span className="text-xs font-bold uppercase tracking-wide">Učit se</span>
            </button>

            <button 
                onClick={() => handleTabChange(Tab.TRAINING)}
                className={`flex flex-1 flex-col items-center p-2 rounded-xl transition-colors ${activeTab === Tab.TRAINING ? 'bg-blue-50 text-cermat-blue border-t-2 border-cermat-blue' : 'text-gray-400 hover:text-gray-500'}`}
            >
              <svg className="w-7 h-7 mb-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
              <span className="text-xs font-bold uppercase tracking-wide">Trénink</span>
            </button>

            <button 
                onClick={() => handleTabChange(Tab.PROFILE)}
                className={`flex flex-1 flex-col items-center p-2 rounded-xl transition-colors ${activeTab === Tab.PROFILE ? 'bg-blue-50 text-cermat-blue border-t-2 border-cermat-blue' : 'text-gray-400 hover:text-gray-500'}`}
            >
              <svg className="w-7 h-7 mb-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 011.827.954L15.962 6.872a8 8 0 11-11.924 0l-2.518-3.195a1 1 0 011.827-.954L5.046 5.905 9 4.323V3a1 1 0 011-1z" clipRule="evenodd" /></svg>
              <span className="text-xs font-bold uppercase tracking-wide">Profil</span>
            </button>
            
          </div>
        )}
      </div>
    </div>
  );
}

export default App;