import { useMemo, useState } from 'react';
import { Brain, CheckCircle2, RotateCcw, Sparkles, XCircle } from 'lucide-react';

type QuizQuestion = {
  prompt: string;
  options: string[];
  answer: number;
  insight: string;
};

const QUESTIONS: QuizQuestion[] = [
  {
    prompt: 'Which token is used for checkout in The Daily Cup?',
    options: ['ETH', 'RITUAL', 'USDC', 'BTC'],
    answer: 1,
    insight: 'The shop is built around native RITUAL settlement on Ritual.',
  },
  {
    prompt: 'What is the Ritual chain ID used in this project?',
    options: ['1', '8453', '1979', '42161'],
    answer: 2,
    insight: 'The app targets Ritual with chain ID 1979.',
  },
  {
    prompt: 'What does “Publish to Site” do for merchants?',
    options: [
      'Only updates local browser data',
      'Deletes old products',
      'Publishes products and images to the live storefront',
      'Only changes the admin screen',
    ],
    answer: 2,
    insight: 'Publishing writes product data into the repo-backed live storefront flow.',
  },
  {
    prompt: 'Where can users get test tokens before paying on Ritual?',
    options: ['A faucet', 'An NFT marketplace', 'A random wallet', 'Email support'],
    answer: 0,
    insight: 'Ritual onboarding includes a faucet for testnet funds.',
  },
  {
    prompt: 'Which page is meant for builder onboarding and network guidance?',
    options: ['Order Tracking', 'Ritual Lab', 'Kitchen View', 'Customer Profile'],
    answer: 1,
    insight: 'Ritual Lab brings together deploy help, docs, faucet links, and builder context.',
  },
];

export default function RitualDinoGame() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  const currentQuestion = QUESTIONS[currentIndex];

  const progressLabel = useMemo(
    () => `Question ${Math.min(currentIndex + 1, QUESTIONS.length)} / ${QUESTIONS.length}`,
    [currentIndex]
  );

  const restart = () => {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setLocked(false);
    setScore(0);
    setShowSummary(false);
  };

  const chooseOption = (optionIndex: number) => {
    if (locked || showSummary) return;

    setSelectedIndex(optionIndex);
    setLocked(true);

    if (optionIndex === currentQuestion.answer) {
      setScore(prev => prev + 1);
    }
  };

  const goNext = () => {
    if (!locked) return;

    if (currentIndex === QUESTIONS.length - 1) {
      setShowSummary(true);
      return;
    }

    setCurrentIndex(prev => prev + 1);
    setSelectedIndex(null);
    setLocked(false);
  };

  if (showSummary) {
    const passed = score >= Math.ceil(QUESTIONS.length * 0.6);

    return (
      <div className="card p-5 bg-slate-950 text-white overflow-hidden">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-bold">Ritual Quick Quiz</h3>
            </div>
            <p className="text-xs text-slate-400">A lighter, friendlier game for builders and customers.</p>
          </div>
          <button onClick={restart} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/5">
            <RotateCcw className="w-3.5 h-3.5" />
            Play Again
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.16),_transparent_40%),linear-gradient(180deg,_#0f172a,_#020617)] p-6 text-center">
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${passed ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
            <Sparkles className="w-7 h-7" />
          </div>
          <h4 className="text-xl font-extrabold text-white">{passed ? 'Ritual Ready' : 'Nice Warm-Up'}</h4>
          <p className="mt-2 text-sm text-slate-300">
            You scored <span className="font-bold text-white">{score}</span> out of <span className="font-bold text-white">{QUESTIONS.length}</span>.
          </p>
          <p className="mt-3 text-xs text-slate-400">
            {passed
              ? 'You know the shop, the chain, and the publish flow pretty well.'
              : 'One more round and you will know the Ritual storefront flow by heart.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 bg-slate-950 text-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold">Ritual Quick Quiz</h3>
          </div>
          <p className="text-xs text-slate-400">Fun Q&A while the next Ritual block settles.</p>
        </div>
        <button onClick={restart} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/5">
          <RotateCcw className="w-3.5 h-3.5" />
          Restart
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.16),_transparent_40%),linear-gradient(180deg,_#0f172a,_#020617)] p-5">
        <div className="mb-4 flex items-center justify-between text-[11px] font-mono text-slate-300">
          <span>{progressLabel}</span>
          <span>score {score}</span>
        </div>

        <h4 className="text-lg font-bold leading-snug text-white">{currentQuestion.prompt}</h4>

        <div className="mt-5 space-y-3">
          {currentQuestion.options.map((option, optionIndex) => {
            const isCorrect = optionIndex === currentQuestion.answer;
            const isSelected = selectedIndex === optionIndex;

            let optionClass = 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10';
            if (locked && isCorrect) {
              optionClass = 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100';
            } else if (locked && isSelected && !isCorrect) {
              optionClass = 'border-red-400/40 bg-red-500/15 text-red-100';
            }

            return (
              <button
                key={option}
                type="button"
                onClick={() => chooseOption(optionIndex)}
                disabled={locked}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${optionClass}`}
              >
                <span>{option}</span>
                {locked && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
                {locked && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-300" />}
              </button>
            );
          })}
        </div>

        {locked && (
          <div className="mt-4 rounded-xl bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">Insight</p>
            <p className="mt-2 text-sm text-slate-200">{currentQuestion.insight}</p>
            <button onClick={goNext} className="mt-4 inline-flex items-center rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-orange-400">
              {currentIndex === QUESTIONS.length - 1 ? 'See Results' : 'Next Question'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
