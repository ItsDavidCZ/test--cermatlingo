import React, { useState } from 'react';
import { UserState, Badge, PowerUpType } from '../types';
import { playClickSound } from '../utils/audio';

interface ProfileProps {
  user: UserState;
  onChangeAvatar: (avatarId: string) => void;
  onThemeChange: (theme: 'light' | 'warm' | 'dark') => void;
  onGoalChange: (goal: number) => void;
  onActivatePowerUp: (type: PowerUpType) => void;
  onLogout: () => void;
}

// Static definition of Badges for display
const BADGES_LIST: Badge[] = [
    { id: 'first_lesson', name: 'Začátečník', description: 'Dokonči svou první lekci', icon: '🐣' },
    { id: 'perfect_score', name: 'Ostrostřelec', description: '100% úspěšnost v lekci', icon: '🎯' },
    { id: 'streak_3', name: 'Zápal', description: 'Udrž streak 3 dny', icon: '🔥' },
    { id: 'streak_30', name: 'Legenda', description: 'Udrž streak 30 dní', icon: '👑' },
    { id: 'math_master', name: 'Pythagoras', description: 'Dokonči všechny lekce matematiky', icon: '📐' },
    { id: 'czech_master', name: 'Karel Čapek', description: 'Dokonči všechny lekce češtiny', icon: '✍️' },
];

const Profile: React.FC<ProfileProps> = ({ user, onChangeAvatar, onThemeChange, onGoalChange, onActivatePowerUp, onLogout }) => {
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [customGoalInput, setCustomGoalInput] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Calculate Levels
  const currentLevel = Math.floor(user.xp / 500) + 1;
  const nextLevelXp = currentLevel * 500;
  const currentLevelProgressXp = user.xp - ((currentLevel - 1) * 500);
  const progressPercent = (currentLevelProgressXp / 500) * 100;

  // Calculate Accuracy
  const totalAccuracy = user.stats.totalQuestions > 0 
    ? Math.round((user.stats.totalCorrect / user.stats.totalQuestions) * 100) 
    : 0;

  // Topics for Pie Chart
  const topics = Object.entries(user.stats.topicCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);
  const totalTopicCount = topics.reduce((acc, curr) => acc + curr[1], 0);
  
  // Generate Conic Gradient for Pie Chart
  let gradientStr = '';
  let currentAngle = 0;
  const colors = ['#58cc02', '#1cb0f6', '#ff4b4b', '#ffc800', '#afafaf'];
  
  topics.forEach((topic, idx) => {
      const percentage = (topic[1] / totalTopicCount) * 100;
      const start = currentAngle;
      const end = currentAngle + percentage;
      gradientStr += `${colors[idx % colors.length]} ${start}% ${end}%, `;
      currentAngle = end;
  });
  if (topics.length === 0) gradientStr = '#e5e5e5 0% 100%';
  else gradientStr = gradientStr.slice(0, -2); // remove last comma


  // Avatars Config
  const avatars = [
      { id: 'default', emoji: '🧑‍🎓', name: 'Student', unlockDay: 0 },
      { id: 'fire', emoji: '🔥', name: 'Zápal', unlockDay: 3 },
      { id: 'smart', emoji: '🧠', name: 'Myslitel', unlockDay: 7 },
      { id: 'king', emoji: '👑', name: 'Legenda', unlockDay: 30 },
  ];

  const streakMilestones = [
    { day: 1, reward: '🔥', label: 'Start' },
    { day: 3, reward: '🥉', label: '3 Dny' },
    { day: 7, reward: '🧪', label: 'Lektvar' },
    { day: 14, reward: '🥇', label: '2 Týdny' },
    { day: 30, reward: '👑', label: '30 Dní' },
  ];

  const currentAvatarEmoji = avatars.find(a => a.id === user.avatar)?.emoji || '🧑‍🎓';

  // Cosmetic Frame Logic
  const hasGoldenFrame = user.streak >= 10;

  const handleCustomGoalSubmit = () => {
    const val = parseInt(customGoalInput);
    if (!isNaN(val) && val > 0) {
      onGoalChange(val);
      setEditingGoal(false);
      setCustomGoalInput('');
    }
  };

  return (
    <div className="flex flex-col p-6 animate-fade-in pb-24 space-y-8">
      
      {/* Weekly Goal - Top Banner */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center mb-2 z-10 relative">
              <h3 className="font-bold text-gray-700">Můj týdenní cíl</h3>
              <button 
                onClick={() => setEditingGoal(!editingGoal)} 
                className="text-xs text-cermat-blue font-bold uppercase tracking-wider hover:underline"
              >
                {editingGoal ? 'Zavřít' : 'Upravit'}
              </button>
          </div>
          
          {editingGoal ? (
              <div className="flex flex-col gap-3 animate-fade-in z-10 relative mt-2">
                  <div className="flex gap-2">
                    {[200, 500, 1000].map(goal => (
                        <button
                            key={goal}
                            onClick={() => {
                                onGoalChange(goal);
                                setEditingGoal(false);
                            }}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 ${user.weeklyGoal === goal ? 'border-cermat-blue bg-blue-50 text-cermat-blue' : 'border-gray-200 text-gray-400'}`}
                        >
                            {goal} XP
                        </button>
                    ))}
                  </div>
                  
                  {/* Custom Goal Input */}
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Vlastní cíl..." 
                      className="flex-1 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:border-cermat-blue focus:outline-none"
                      value={customGoalInput}
                      onChange={(e) => setCustomGoalInput(e.target.value)}
                    />
                    <button 
                      onClick={handleCustomGoalSubmit}
                      className="bg-cermat-blue text-white font-bold px-4 rounded-xl text-sm hover:brightness-110 active:scale-95 transition-transform"
                    >
                      OK
                    </button>
                  </div>
              </div>
          ) : (
             <div className="z-10 relative">
                 <div className="flex justify-between items-end mb-1">
                     <span className="text-3xl font-extrabold text-cermat-blue">{user.weeklyProgress}</span>
                     <span className="text-sm font-bold text-gray-400 mb-1">/ {user.weeklyGoal} XP</span>
                 </div>
                 <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-cermat-yellow transition-all duration-1000"
                        style={{ width: `${Math.min(100, (user.weeklyProgress / user.weeklyGoal) * 100)}%` }}
                     ></div>
                 </div>
             </div>
          )}
          {/* Decor */}
          <div className="absolute -right-4 -bottom-4 text-8xl opacity-5 grayscale pointer-events-none">🎯</div>
      </div>

      {/* User Header & Level */}
      <div className="flex flex-col items-center">
         <div className="relative mb-4 group">
             {/* Main Avatar Display */}
             <div className={`w-32 h-32 bg-white rounded-full border-[6px] flex items-center justify-center text-7xl shadow-xl z-10 relative overflow-hidden ${hasGoldenFrame ? 'border-yellow-400 ring-4 ring-yellow-200' : 'border-cermat-blue'}`}>
                {currentAvatarEmoji}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 w-full h-full animate-shine shine-overlay opacity-50"></div>
             </div>

             {/* Edit Avatar Button */}
             <button 
                onClick={() => {
                    playClickSound();
                    setShowAvatarModal(true);
                }}
                className="absolute top-0 right-0 bg-white text-gray-400 border-2 border-gray-200 w-10 h-10 rounded-full hover:bg-gray-50 hover:text-cermat-blue hover:border-cermat-blue transition-all z-30 shadow-sm flex items-center justify-center active:scale-95 group-hover:scale-105"
                aria-label="Upravit avatara"
             >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
                </svg>
             </button>

             {/* Level Badge */}
             <div className="absolute -bottom-3 -right-3 bg-cermat-yellow border-4 border-white text-yellow-900 font-bold px-4 py-1 rounded-full text-sm z-20 shadow-md uppercase tracking-wider">
                Lvl {currentLevel}
             </div>
         </div>
         <h1 className="text-2xl font-bold text-gray-800">{user.username}</h1>
         <div className="text-gray-400 font-bold text-sm">
            Uživatel od {new Date(user.createdAt || Date.now()).getFullYear()}
         </div>
         
         <div className="w-full max-w-xs mt-6">
             <div className="flex justify-between text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                <span>XP {user.xp}</span>
                <span>Cíl: {nextLevelXp}</span>
             </div>
             <div className="h-5 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-inner">
                 <div 
                    className="h-full bg-gradient-to-r from-cermat-blue to-cermat-blue-dark transition-all duration-1000 ease-out relative"
                    style={{ width: `${progressPercent}%` }}
                 >
                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-shine shine-overlay"></div>
                 </div>
             </div>
         </div>
      </div>

      {/* Inventory Section */}
      <div>
         <h2 className="text-xl font-bold text-gray-800 mb-4">Tvůj Inventář</h2>
         <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-4 flex gap-4">
             {/* Double XP Potion */}
             <div className="flex-1 bg-purple-50 border border-purple-100 rounded-2xl p-3 flex flex-col items-center text-center relative overflow-hidden">
                 <div className="text-4xl mb-2 animate-bounce-short">🧪</div>
                 <h4 className="font-bold text-gray-700 text-sm">XP Lektvar (2x)</h4>
                 <p className="text-xs text-gray-400 mb-3">Zdvojnásobí XP v příští lekci.</p>
                 
                 <div className="mt-auto w-full">
                     {user.activePowerUp === 'DOUBLE_XP' ? (
                        <div className="text-xs font-bold text-green-600 bg-green-100 py-2 rounded-xl border border-green-200">
                             AKTIVNÍ
                        </div>
                     ) : (
                        <button
                            onClick={() => onActivatePowerUp('DOUBLE_XP')}
                            disabled={user.inventory.doubleXpPotions <= 0}
                            className={`w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wide border-b-2 active:border-b-0 active:translate-y-px transition-all
                                ${user.inventory.doubleXpPotions > 0 
                                    ? 'bg-purple-500 text-white border-purple-700 hover:brightness-105 shadow-md' 
                                    : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'}
                            `}
                        >
                            {user.inventory.doubleXpPotions > 0 ? `Použít (${user.inventory.doubleXpPotions})` : 'Žádné lektvary'}
                        </button>
                     )}
                 </div>
             </div>
             {/* Placeholder slot */}
             <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl p-3 flex flex-col items-center justify-center text-center opacity-60">
                 <div className="text-3xl grayscale mb-2">🛡️</div>
                 <p className="text-xs text-gray-400">Štít streaku (Brzy)</p>
             </div>
         </div>
      </div>

      {/* Badges Section */}
      <div>
         <h2 className="text-xl font-bold text-gray-800 mb-4">Síň Slávy (Odznaky)</h2>
         <div className="grid grid-cols-3 gap-3">
             {BADGES_LIST.map((badge) => {
                 const isUnlocked = user.badges.includes(badge.id);
                 return (
                     <div key={badge.id} className={`
                        flex flex-col items-center p-3 rounded-2xl border transition-all text-center h-full
                        ${isUnlocked 
                            ? 'bg-yellow-50 border-yellow-200 shadow-sm' 
                            : 'bg-gray-50 border-gray-200 opacity-60 grayscale'}
                     `}>
                        <div className={`text-4xl mb-2 ${isUnlocked ? 'animate-bounce-short' : ''}`}>
                            {isUnlocked ? badge.icon : '🔒'}
                        </div>
                        <div className={`text-xs font-bold mb-1 ${isUnlocked ? 'text-gray-800' : 'text-gray-500'}`}>
                            {badge.name}
                        </div>
                        <div className="text-[10px] leading-tight text-gray-400">
                            {badge.description}
                        </div>
                     </div>
                 )
             })}
         </div>
      </div>

      {/* Streak Rewards Roadmap */}
      <div>
         <h2 className="text-xl font-bold text-gray-800 mb-4">Cesta Streaku</h2>
         <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-5 overflow-x-auto">
            <div className="flex gap-6 min-w-max px-2 pt-2">
                {streakMilestones.map((milestone) => {
                    const isUnlocked = user.streak >= milestone.day;
                    const isCurrent = user.streak === milestone.day;
                    const isLegend = milestone.day === 30;
                    
                    return (
                        <div key={milestone.day} className={`flex flex-col items-center gap-3 relative ${isUnlocked ? 'opacity-100' : 'opacity-40'}`}>
                             {milestone.day !== 1 && (
                                 <div className={`absolute top-8 -left-8 w-8 h-1 ${isUnlocked ? 'bg-orange-200' : 'bg-gray-200'}`}></div>
                             )}

                             <div className={`relative
                                w-20 h-20 rounded-2xl flex items-center justify-center text-4xl border-b-[6px] transition-all
                                ${isLegend 
                                    ? (isUnlocked ? 'bg-gradient-to-br from-yellow-100 to-yellow-300 border-yellow-500 text-yellow-700' : 'bg-gray-100 border-gray-300 grayscale')
                                    : (isUnlocked ? 'bg-orange-100 border-orange-300 text-orange-600' : 'bg-gray-100 border-gray-300')
                                }
                                ${isCurrent ? 'animate-bounce-short ring-4 ring-orange-200 scale-105' : ''}
                             `}>
                                {/* Special visual effect for 30-day streak if unlocked */}
                                {isLegend && isUnlocked && (
                                    <div className="absolute -inset-2 bg-yellow-400/30 rounded-3xl blur-md animate-pulse z-0 pointer-events-none"></div>
                                )}
                                <span className="relative z-10">{milestone.reward}</span>
                             </div>
                             <span className={`text-xs font-bold uppercase ${isLegend ? 'text-cermat-yellow' : 'text-gray-500'}`}>{milestone.label}</span>
                        </div>
                    )
                })}
            </div>
         </div>
      </div>

      {/* Detailed Stats with Graphs */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Tvoje Statistiky</h2>
        <div className="grid grid-cols-2 gap-4">
            
            {/* Pie Chart for Topics */}
            <div className="col-span-2 bg-white border border-gray-100 shadow-md rounded-3xl p-5 flex items-center gap-6">
                 <div className="relative w-24 h-24 rounded-full shrink-0" 
                      style={{ background: `conic-gradient(${gradientStr})` }}>
                      <div className="absolute inset-0 m-auto w-16 h-16 bg-white rounded-full flex items-center justify-center font-bold text-gray-400 text-xs">
                          Témata
                      </div>
                 </div>
                 <div className="flex flex-col gap-2 flex-1">
                     <div className="text-xs font-bold uppercase text-gray-400 mb-1">Nejčastější</div>
                     {topics.slice(0, 3).map((t, idx) => (
                         <div key={idx} className="flex items-center gap-2 text-xs">
                             <div className="w-2 h-2 rounded-full" style={{background: colors[idx]}}></div>
                             <span className="font-bold text-gray-600 truncate max-w-[120px]">{t[0]}</span>
                             <span className="text-gray-400">({t[1]})</span>
                         </div>
                     ))}
                     {topics.length === 0 && <span className="text-gray-400 text-sm">Zatím žádná data</span>}
                 </div>
            </div>

            {/* XP Bar Chart */}
            <div className="col-span-2 bg-white border border-gray-100 shadow-md rounded-3xl p-5">
                 <div className="flex justify-between items-center mb-6">
                    <div className="text-xs text-gray-400 font-bold uppercase">XP v předmětech</div>
                 </div>
                 
                 <div className="flex gap-4 items-end h-32 px-4 pb-2 border-b border-gray-100">
                     {/* Czech Bar */}
                     <div className="flex-1 flex flex-col items-center gap-2 group relative">
                         <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                            {user.stats.czechXp} XP
                         </div>
                         <div 
                            className="w-full bg-cermat-red rounded-t-xl transition-all duration-1000 min-h-[10%]" 
                            style={{ height: `${user.xp > 0 ? (user.stats.czechXp / (user.xp || 1)) * 100 : 10}%` }}
                         ></div>
                         <div className="text-xs font-bold uppercase text-cermat-red">Čeština</div>
                     </div>
                     {/* Math Bar */}
                     <div className="flex-1 flex flex-col items-center gap-2 group relative">
                         <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                            {user.stats.mathXp} XP
                         </div>
                         <div 
                            className="w-full bg-cermat-blue rounded-t-xl transition-all duration-1000 min-h-[10%]" 
                            style={{ height: `${user.xp > 0 ? (user.stats.mathXp / (user.xp || 1)) * 100 : 10}%` }}
                         ></div>
                         <div className="text-xs font-bold uppercase text-cermat-blue">Matika</div>
                     </div>
                 </div>
            </div>

            <div className="bg-white border border-gray-100 shadow-md rounded-3xl p-4 flex flex-col gap-2 relative overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center text-2xl shadow-inner mb-1">
                    🎯
                </div>
                <div>
                    <div className="font-extrabold text-2xl text-gray-800">{totalAccuracy}%</div>
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wide">Úspěšnost</div>
                </div>
            </div>
            
            <div className="bg-white border border-gray-100 shadow-md rounded-3xl p-4 flex flex-col gap-2">
                <div className="w-12 h-12 rounded-xl bg-red-100 text-cermat-red flex items-center justify-center text-2xl shadow-inner mb-1">
                    ❤️
                </div>
                <div>
                    <div className="font-extrabold text-2xl text-gray-800">
                        {user.stats.lessonsCompleted > 0 ? (4.5).toFixed(1) : '-'}
                    </div>
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wide">Životy / Lekce</div>
                </div>
            </div>
        </div>

        <div className="mt-8">
            <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full py-4 bg-white text-cermat-red rounded-2xl font-bold uppercase tracking-widest text-lg shadow-sm border-2 border-cermat-red hover:bg-red-50 transition-all active:scale-95"
            >
                ODHLÁSIT
            </button>
        </div>

        {/* Avatar & Theme Selection Modal */}
        {showAvatarModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
                <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-in relative max-h-[90vh] overflow-y-auto">
                    <button
                        onClick={() => setShowAvatarModal(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Nastavení Profilu</h2>

                    {/* Theme Selector */}
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Barevné schéma</h3>
                        <div className="flex gap-2">
                            <button onClick={() => onThemeChange('light')} className={`flex-1 h-12 rounded-xl bg-gray-100 border-2 ${user.theme === 'light' ? 'border-cermat-blue ring-2 ring-blue-100' : 'border-gray-200'} flex items-center justify-center`}>☀️</button>
                            <button onClick={() => onThemeChange('warm')} className={`flex-1 h-12 rounded-xl bg-orange-50 border-2 ${user.theme === 'warm' ? 'border-orange-400 ring-2 ring-orange-100' : 'border-orange-100'} flex items-center justify-center`}>🌅</button>
                            <button onClick={() => onThemeChange('dark')} className={`flex-1 h-12 rounded-xl bg-gray-800 border-2 ${user.theme === 'dark' ? 'border-gray-600 ring-2 ring-gray-400' : 'border-gray-700'} flex items-center justify-center`}>🌑</button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Tvoji Avataři</h3>
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded">SBÍRKA</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-6 bg-gray-50 p-2 rounded-xl border border-gray-100">
                        {avatars.map((av) => {
                            const isUnlocked = user.streak >= av.unlockDay;
                            const isSelected = user.avatar === av.id;

                            return (
                                <button
                                    key={av.id}
                                    disabled={!isUnlocked}
                                    onClick={() => onChangeAvatar(av.id)}
                                    className={`
                                        flex flex-col items-center p-4 rounded-2xl border-4 transition-all relative overflow-hidden group
                                        ${isSelected 
                                            ? 'bg-blue-50 border-cermat-blue ring-2 ring-blue-200 shadow-md scale-105 z-10' 
                                            : 'bg-white border-gray-100 hover:border-gray-300'
                                        }
                                        ${!isUnlocked ? 'opacity-60 bg-gray-50 cursor-not-allowed' : 'active:scale-95'}
                                    `}
                                >
                                    <div className={`text-5xl mb-3 transition-transform ${isUnlocked ? 'group-hover:scale-110' : 'grayscale blur-[1px]'}`}>
                                        {av.emoji}
                                    </div>
                                    <div className="text-xs font-bold uppercase text-gray-500">{av.name}</div>
                                    {!isUnlocked && (
                                        <div className="absolute top-2 right-2 text-gray-400 text-xs font-bold bg-gray-100 px-1 rounded">🔒 {av.unlockDay}d</div>
                                    )}
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 w-6 h-6 bg-cermat-blue text-white rounded-full flex items-center justify-center text-xs shadow-sm animate-pop">✓</div>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    <button
                        onClick={() => {
                            playClickSound();
                            setShowAvatarModal(false);
                        }}
                        className="w-full py-3 bg-cermat-blue text-white rounded-xl font-bold uppercase tracking-wider border-b-4 border-cermat-blue-dark active:border-b-0 active:translate-y-1"
                    >
                        Uložit změny
                    </button>
                </div>
            </div>
        )}

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
                <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-in text-center">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Opravdu se chceš odhlásit?</h2>
                    <p className="text-gray-500 mb-6">Tvůj postup je uložen, ale budeš se muset příště znovu přihlásit.</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowLogoutConfirm(false)}
                            className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold uppercase"
                        >
                            Zrušit
                        </button>
                        <button
                            onClick={() => {
                                playClickSound();
                                onLogout();
                            }}
                            className="flex-1 py-3 bg-cermat-red text-white rounded-xl font-bold uppercase shadow-lg border-b-4 border-cermat-red-dark active:border-b-0 active:translate-y-1"
                        >
                            Odhlásit
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default Profile;