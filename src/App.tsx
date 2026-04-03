import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe2, 
  MapPin, 
  Flag, 
  Trophy, 
  RotateCcw, 
  ChevronRight, 
  CheckCircle2, 
  XCircle,
  Home,
  Flame,
  LayoutGrid,
  Settings2
} from 'lucide-react';
import { countries, Country } from './data/countries';
import { Toaster, toast } from 'sonner';
import confetti from 'canvas-confetti';

type GameMode = 'flag-to-country' | 'country-to-capital' | 'country-to-flag';
type Region = 'Africa' | 'Asia' | 'Europe' | 'Americas' | 'Oceania' | 'All';

interface GameState {
  currentQuestionIndex: number;
  score: number;
  streak: number;
  maxStreak: number;
  answers: { country: Country; isCorrect: boolean }[];
  status: 'menu' | 'playing' | 'results';
  mode: GameMode;
  region: Region;
  shuffledCountries: Country[];
}

const HERO_IMAGE = "https://storage.googleapis.com/dala-prod-public-storage/generated-images/0c745f8a-ad10-4b97-be22-0fc5794f0274/hero-b0f207a1-1775204848352.webp";

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    currentQuestionIndex: 0,
    score: 0,
    streak: 0,
    maxStreak: 0,
    answers: [],
    status: 'menu',
    mode: 'flag-to-country',
    region: 'All',
    shuffledCountries: [],
  });

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const currentCountry = gameState.shuffledCountries[gameState.currentQuestionIndex];

  const options = useMemo(() => {
    if (!currentCountry || gameState.status !== 'playing') return [];
    
    const pool = countries.filter(c => c.code !== currentCountry.code);
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    const wrongAnswers = shuffledPool.slice(0, 3);
    
    return [...wrongAnswers, currentCountry].sort(() => Math.random() - 0.5);
  }, [currentCountry, gameState.status]);

  const startGame = (mode: GameMode, region: Region) => {
    let filteredCountries = region === 'All' 
      ? [...countries] 
      : countries.filter(c => c.region === region);
    
    if (filteredCountries.length < 4) {
      toast.error("Not enough countries in this region yet!");
      return;
    }

    const shuffled = filteredCountries.sort(() => Math.random() - 0.5).slice(0, 10);
    
    setGameState({
      status: 'playing',
      mode,
      region,
      currentQuestionIndex: 0,
      score: 0,
      streak: 0,
      maxStreak: 0,
      answers: [],
      shuffledCountries: shuffled,
    });
    setIsAnswered(false);
    setSelectedAnswer(null);
  };

  const handleAnswer = (answer: string) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    
    const isCorrect = gameState.mode === 'flag-to-country' 
      ? answer === currentCountry.name
      : gameState.mode === 'country-to-capital'
      ? answer === currentCountry.capital
      : answer === currentCountry.code;

    if (isCorrect) {
      const newStreak = gameState.streak + 1;
      setGameState(prev => ({
        ...prev,
        score: prev.score + 1,
        streak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak),
        answers: [...prev.answers, { country: currentCountry, isCorrect: true }]
      }));
      toast.success('Brilliant!', { duration: 800 });
      
      if (newStreak > 0 && newStreak % 5 === 0) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#2563eb', '#10b981', '#f59e0b']
        });
      }
    } else {
      setGameState(prev => ({
        ...prev,
        streak: 0,
        answers: [...prev.answers, { country: currentCountry, isCorrect: false }]
      }));
      toast.error('Not quite!', { duration: 1000 });
    }

    setTimeout(() => {
      if (gameState.currentQuestionIndex < gameState.shuffledCountries.length - 1) {
        setGameState(prev => ({
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1
        }));
        setIsAnswered(false);
        setSelectedAnswer(null);
      } else {
        setGameState(prev => ({ ...prev, status: 'results' }));
        if (gameState.score >= 7) {
           confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.5 }
          });
        }
      }
    }, 1500);
  };

  const resetGame = () => {
    setGameState(prev => ({ ...prev, status: 'menu' }));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans overflow-x-hidden">
      <Toaster position="top-center" richColors />
      
      <main className="max-w-2xl mx-auto px-4 py-6 md:py-12 min-h-screen flex flex-col">
        {gameState.status === 'menu' && (
          <MenuView onStart={startGame} />
        )}

        {gameState.status === 'playing' && currentCountry && (
          <div className="flex-1 flex flex-col gap-6">
            {/* Nav */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-zinc-100">
              <button 
                onClick={resetGame}
                className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-500"
              >
                <Home className="w-5 h-5" />
              </button>
              
              <div className="flex-1 flex justify-center px-4">
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-blue-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${((gameState.currentQuestionIndex) / gameState.shuffledCountries.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-orange-600 font-bold text-sm">
                  <Flame className="w-4 h-4 fill-orange-600" />
                  <span>{gameState.streak}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCountry.code + gameState.mode + gameState.currentQuestionIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-zinc-200/50 border border-zinc-100 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-20" />
                  <QuestionDisplay mode={gameState.mode} country={currentCountry} />
                </motion.div>
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map((option, idx) => {
                  const val = gameState.mode === 'flag-to-country' 
                    ? option.name 
                    : gameState.mode === 'country-to-capital'
                    ? option.capital
                    : option.code;
                  
                  const isCorrect = gameState.mode === 'flag-to-country'
                    ? option.name === currentCountry.name
                    : gameState.mode === 'country-to-capital'
                    ? option.capital === currentCountry.capital
                    : option.code === currentCountry.code;

                  return (
                    <OptionButton
                      key={option.code + idx}
                      label={gameState.mode === 'country-to-flag' ? null : (gameState.mode === 'flag-to-country' ? option.name : option.capital)}
                      code={option.code}
                      mode={gameState.mode}
                      onClick={() => handleAnswer(val)}
                      isSelected={selectedAnswer === val}
                      isCorrect={isCorrect}
                      showResult={isAnswered}
                      disabled={isAnswered}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {gameState.status === 'results' && (
          <ResultsView 
            state={gameState} 
            onReset={resetGame} 
            onRetry={() => startGame(gameState.mode, gameState.region)} 
          />
        )}
      </main>
    </div>
  );
}

function MenuView({ onStart }: { onStart: (mode: GameMode, region: Region) => void }) {
  const [selectedMode, setSelectedMode] = useState<GameMode>('flag-to-country');
  const [selectedRegion, setSelectedRegion] = useState<Region>('All');

  const modes: { id: GameMode; label: string; icon: any; color: string; desc: string }[] = [
    { id: 'flag-to-country', label: 'Guess the Country', icon: Flag, color: 'text-indigo-600 bg-indigo-50', desc: 'Identify nations by their unique flags.' },
    { id: 'country-to-capital', label: 'Guess the Capital', icon: MapPin, color: 'text-emerald-600 bg-emerald-50', desc: 'Can you name the administrative heart?' },
    { id: 'country-to-flag', label: 'Guess the Flag', icon: Globe2, color: 'text-amber-600 bg-amber-50', desc: 'Match the name to its colorful standard.' },
  ];

  const regions: Region[] = ['All', 'Africa', 'Asia', 'Europe', 'Americas', 'Oceania'];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-8 pb-12"
    >
      <div className="relative h-48 md:h-64 rounded-[3rem] overflow-hidden mb-4 group shadow-2xl">
        <img 
          src={HERO_IMAGE} 
          alt="GeoFlash Hero" 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8 text-white">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none mb-2">
            GeoFlash
          </h1>
          <p className="text-white/80 font-medium text-sm md:text-base">Level up your global knowledge.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
          <LayoutGrid className="w-5 h-5 text-zinc-400" />
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Mission Select</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`flex items-start gap-5 p-6 rounded-[2rem] border-2 transition-all duration-300 text-left ${
                selectedMode === mode.id 
                ? 'border-blue-600 bg-white shadow-xl shadow-blue-100 ring-1 ring-blue-600' 
                : 'border-zinc-100 bg-white hover:border-zinc-300 hover:shadow-md'
              }`}
            >
              <div className={`p-4 rounded-2xl ${mode.color} transition-colors shrink-0`}>
                <mode.icon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="font-black text-lg block">{mode.label}</span>
                <span className="text-zinc-400 text-xs font-medium leading-relaxed">{mode.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
          <Settings2 className="w-5 h-5 text-zinc-400" />
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Region Focus</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {regions.map((region) => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-6 py-3 rounded-2xl font-black text-sm border-2 transition-all ${
                selectedRegion === region
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-lg shadow-zinc-300'
                : 'bg-white text-zinc-500 border-zinc-100 hover:border-zinc-300'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={() => onStart(selectedMode, selectedRegion)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xl py-7 rounded-[2.5rem] shadow-xl shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
        >
          START CHALLENGE 
          <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}

function QuestionDisplay({ mode, country }: { mode: GameMode, country: Country }) {
  if (mode === 'flag-to-country') {
    return (
      <div className="flex flex-col items-center gap-8">
        <div className="relative group">
          <div className="absolute -inset-4 bg-blue-500/10 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <img 
            src={`https://flagcdn.com/w640/${country.code}.png`} 
            alt="Flag"
            className="w-64 md:w-80 h-auto rounded-2xl shadow-2xl border border-zinc-100 relative z-10"
          />
        </div>
        <div className="text-center space-y-2">
          <p className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[10px]">Challenge</p>
          <h2 className="text-2xl font-black text-zinc-800">Identify this nation</h2>
        </div>
      </div>
    );
  }

  if (mode === 'country-to-capital') {
    return (
      <div className="text-center space-y-6">
        <p className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[10px]">What is the capital of</p>
        <h2 className="text-5xl md:text-6xl font-black text-blue-600 tracking-tight leading-tight px-2 drop-shadow-sm">
          {country.name}
        </h2>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      <p className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[10px]">Find the flag of</p>
      <h2 className="text-5xl md:text-6xl font-black text-amber-600 tracking-tight leading-tight px-2 drop-shadow-sm">
        {country.name}
      </h2>
    </div>
  );
}

function OptionButton({ 
  label, 
  code, 
  mode, 
  onClick, 
  isSelected, 
  isCorrect, 
  showResult, 
  disabled 
}: { 
  label: string | null; 
  code: string;
  mode: GameMode;
  onClick: () => void; 
  isSelected: boolean; 
  isCorrect: boolean;
  showResult: boolean;
  disabled: boolean;
}) {
  let baseClasses = "relative w-full p-6 rounded-[2rem] border-2 font-black text-lg transition-all duration-300 flex items-center justify-center gap-4 bg-white";
  let statusClasses = 'border-zinc-100 text-zinc-700 hover:border-zinc-300 hover:shadow-lg hover:-translate-y-0.5';
  
  if (showResult) {
    if (isCorrect) {
      statusClasses = 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-100 z-10';
    } else if (isSelected) {
      statusClasses = 'border-rose-500 bg-rose-50 text-rose-700 ring-4 ring-rose-100 z-10';
    } else {
      statusClasses = 'border-zinc-50 bg-white opacity-40 grayscale-[0.5]';
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${statusClasses}`}
    >
      {mode === 'country-to-flag' ? (
        <img 
          src={`https://flagcdn.com/w320/${code}.png`} 
          alt="Flag Option"
          className="w-24 md:w-32 h-auto rounded-lg shadow-sm border border-zinc-100"
        />
      ) : (
        <span className="text-center break-words">{label}</span>
      )}
      
      {showResult && isCorrect && (
        <CheckCircle2 className="w-6 h-6 text-emerald-600 absolute right-6 md:right-8" />
      )}
      {showResult && isSelected && !isCorrect && (
        <XCircle className="w-6 h-6 text-rose-600 absolute right-6 md:right-8" />
      )}
    </button>
  );
}

function ResultsView({ state, onReset, onRetry }: { state: GameState; onReset: () => void; onRetry: () => void }) {
  const percentage = Math.round((state.score / state.shuffledCountries.length) * 100);
  
  const feedback = percentage >= 90 ? 'Absolute Legend!' 
                 : percentage >= 70 ? 'Great Explorer!'
                 : percentage >= 50 ? 'Steady Traveler'
                 : 'Keep Practicing!';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 flex flex-col items-center"
    >
      <div className="bg-white rounded-[3.5rem] p-10 md:p-16 text-center shadow-2xl border border-zinc-100 w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        
        <div className="w-28 h-24 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
          <Trophy className="w-12 h-12 text-amber-600" />
        </div>
        
        <h2 className="text-4xl font-black mb-2 tracking-tight">{feedback}</h2>
        <p className="text-zinc-400 font-bold mb-12 uppercase tracking-widest text-xs">
          {state.region === 'All' ? 'Global' : state.region} Expedition Complete
        </p>
        
        <div className="grid grid-cols-2 gap-6 mb-12">
          <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100">
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2">Final Score</p>
            <p className="text-4xl font-black text-blue-700">{state.score}/{state.shuffledCountries.length}</p>
          </div>
          <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100">
            <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mb-2">Best Streak</p>
            <p className="text-4xl font-black text-orange-700">{state.maxStreak}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end px-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Global Proficiency</span>
            <span className="text-2xl font-black text-zinc-800">{percentage}%</span>
          </div>
          <div className="h-4 bg-zinc-50 rounded-full overflow-hidden border border-zinc-100 p-1">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.5, ease: "circOut" }}
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 w-full">
        <button
          onClick={onRetry}
          className="flex-1 bg-white border-2 border-zinc-100 hover:border-zinc-300 p-6 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95"
        >
          <RotateCcw className="w-5 h-5" /> RE-CHALLENGE
        </button>
        <button
          onClick={onReset}
          className="flex-1 bg-[#1A1A1A] text-white p-6 rounded-[2rem] font-black text-lg transition-all hover:bg-black active:scale-95 shadow-xl shadow-zinc-300"
        >
          BACK TO MENU
        </button>
      </div>
    </motion.div>
  );
}