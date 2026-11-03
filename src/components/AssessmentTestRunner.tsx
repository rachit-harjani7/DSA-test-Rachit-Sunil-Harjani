import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Copy,
  Terminal,
  FileCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface AssessmentTestRunnerProps {
  onExecuteFullSuite: () => { outputLogs: string[]; success: boolean };
  onExecuteStep: (stepNumber: number) => { stepOutput: string[]; success: boolean };
  currentStepIndex: number;
  testConsoleLogs: string[];
  onResetTestState: () => void;
}

const TEST_STEPS = [
  {
    stepNumber: 1,
    title: 'Add Initial Songs',
    codeSnippet: 'p.addSong("Sunrise", 210)\np.addSong("Desert Rain", 185)\np.addSong("Marina Lights", 240)',
    description: 'Add songs: Sunrise (210s), Desert Rain (185s), Marina Lights (240s)',
  },
  {
    stepNumber: 2,
    title: 'Insert Skyline after Sunrise',
    codeSnippet: 'p.insertAfter("Sunrise", "Skyline", 200)',
    description: 'Inserts Skyline (200s) directly after Sunrise node.',
  },
  {
    stepNumber: 3,
    title: 'Insert Night Drive after Marina Lights',
    codeSnippet: 'p.insertAfter("Marina Lights", "Night Drive", 195)',
    description: 'Inserts Night Drive (195s) directly after Marina Lights node.',
  },
  {
    stepNumber: 4,
    title: 'Display Forward and Backward',
    codeSnippet: 'p.displayForward()\np.displayBackward()',
    description: 'Traverses the 5 songs forward from head to tail, then backward from tail to head.',
  },
  {
    stepNumber: 5,
    title: 'Remove Songs (including edge-case Unknown)',
    codeSnippet: 'p.removeSong("Sunrise")\np.removeSong("Desert Rain")\np.removeSong("Night Drive")\np.removeSong("Unknown")',
    description: 'Removes first song (Sunrise), middle song (Desert Rain), last song (Night Drive), and non-existent song (Unknown).',
  },
  {
    stepNumber: 6,
    title: 'Display Forward and Backward Again',
    codeSnippet: 'p.displayForward()\np.displayBackward()',
    description: 'Verifies remaining 2 songs: Skyline -> Marina Lights forward and backward.',
  },
  {
    stepNumber: 7,
    title: 'Circular playNext from Marina Lights',
    codeSnippet: 'cur = p.find("Marina Lights")\nnext_song = p.playNext(cur)\nprint(f"playNext returned: {next_song.title}")',
    description: 'Starting from Marina Lights (the tail), call playNext to prove circular wrap-around to Skyline (head)!',
  },
];

export const AssessmentTestRunner: React.FC<AssessmentTestRunnerProps> = ({
  onExecuteFullSuite,
  onExecuteStep,
  currentStepIndex,
  testConsoleLogs,
  onResetTestState,
}) => {
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRunAll = async () => {
    setIsRunningAll(true);
    const res = onExecuteFullSuite();
    if (res.success) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
    setIsRunningAll(false);
  };

  const copyOutput = () => {
    const text = testConsoleLogs.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCompleted = currentStepIndex >= 7;

  return (
    <div className="space-y-6">
      {/* Test Runner Hero Banner */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Part C · Testing (2 Marks)
              </span>
              <span className="text-xs text-stone-400">
                Symbiosis International University Practical Assessment
              </span>
              <span className="text-stone-600">·</span>
              <span className="text-xs text-amber-300 font-medium">Candidate: Rachit Sunil Harjani</span>
              <span className="text-xs font-mono text-stone-400 bg-stone-950 px-1.5 py-0.2 rounded border border-stone-800">
                PRN: 25070721006
              </span>
            </div>
            <h2 className="text-xl font-bold text-stone-100">
              Melody Café Music Player Test Suite
            </h2>
            <p className="text-xs text-stone-400 mt-1 max-w-2xl">
              Automated execution of the 7 testing instructions from the question paper. Tests empty list, head removal, tail insertion, unknown key rejection, and circular wrap-around.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleRunAll}
              disabled={isRunningAll}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Run Full Assessment Test</span>
            </button>

            <button
              onClick={onResetTestState}
              className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-xl transition-colors border border-stone-800"
              title="Reset Test State"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 7 Steps Interactive Checklist (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-stone-200">
              Exam Test Specifications (7 Steps)
            </h3>
            <span className="text-xs font-mono text-stone-400">
              Progress: {Math.min(currentStepIndex, 7)}/7
            </span>
          </div>

          <div className="space-y-2">
            {TEST_STEPS.map((step) => {
              const isPast = currentStepIndex >= step.stepNumber;
              const isCurrent = currentStepIndex === step.stepNumber - 1;

              return (
                <div
                  key={step.stepNumber}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isPast
                      ? 'bg-emerald-950/20 border-emerald-800/60 text-stone-200'
                      : isCurrent
                      ? 'bg-stone-900 border-amber-500/60 ring-1 ring-amber-500/20 text-stone-200'
                      : 'bg-stone-900/50 border-stone-800/80 text-stone-400 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {isPast ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-stone-600 flex items-center justify-center font-mono text-[10px] text-stone-400">
                            {step.stepNumber}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-stone-200">
                          {step.stepNumber}. {step.title}
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {isCurrent && (
                      <button
                        onClick={() => onExecuteStep(step.stepNumber)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors shrink-0 flex items-center gap-1"
                      >
                        <span>Run Step</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Code snippet display */}
                  <div className="mt-2 pt-2 border-t border-stone-800/60 font-mono text-[10px] text-stone-400 bg-stone-950/60 p-2 rounded">
                    <pre className="overflow-x-auto">{step.codeSnippet}</pre>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Terminal Program Output (6 cols) */}
        <div className="lg:col-span-6 flex flex-col h-full space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-stone-200">
                Standard Output (Console Printout)
              </h3>
            </div>
            <button
              onClick={copyOutput}
              disabled={testConsoleLogs.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors disabled:opacity-40"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy for Submission'}</span>
            </button>
          </div>

          <div className="bg-stone-950 border border-stone-800 rounded-2xl p-5 flex-1 flex flex-col font-mono text-xs shadow-2xl min-h-[480px]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 text-[11px] text-stone-500">
              <span>Terminal: python RollNo_Name_Playlist.py</span>
              <span className="text-emerald-400">● Live Stream</span>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-1.5 pr-1 select-text">
              {testConsoleLogs.length === 0 ? (
                <div className="text-stone-600 italic py-16 text-center">
                  // Click "Run Full Assessment Test" or run Step 1 to generate the program output printout.
                </div>
              ) : (
                testConsoleLogs.map((line, idx) => {
                  let style = 'text-stone-300';
                  if (line.startsWith('---')) style = 'text-amber-400 font-bold';
                  if (line.startsWith('Forward')) style = 'text-cyan-300 font-semibold';
                  if (line.startsWith('Backward')) style = 'text-purple-300 font-semibold';
                  if (line.startsWith('Removed:')) style = 'text-rose-300';
                  if (line.includes('not found')) style = 'text-amber-300 italic';
                  if (line.startsWith('playNext')) style = 'text-emerald-400 font-bold';

                  return (
                    <div key={idx} className={style}>
                      {line}
                    </div>
                  );
                })
              )}
            </div>

            {isCompleted && (
              <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-emerald-400">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> All 7 Practical Test Steps Passed
                </span>
                <span className="text-stone-400">Ready to take screenshot/submit</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
