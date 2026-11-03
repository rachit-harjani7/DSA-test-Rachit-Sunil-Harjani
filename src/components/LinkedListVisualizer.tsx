import React, { useState } from 'react';
import { NodeSnapshot } from '../types/playlist';
import {
  ArrowRight,
  ArrowLeft,
  RotateCw,
  Play,
  Trash2,
  Plus,
  Compass,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface LinkedListVisualizerProps {
  nodes: NodeSnapshot[];
  currentSongId?: string;
  onSelectSong: (title: string) => void;
  onRemoveSong: (title: string) => void;
  onOpenInsertAfterModal: (keyTitle: string) => void;
  onStepForward: () => void;
  onStepBackward: () => void;
}

export const LinkedListVisualizer: React.FC<LinkedListVisualizerProps> = ({
  nodes,
  currentSongId,
  onSelectSong,
  onRemoveSong,
  onOpenInsertAfterModal,
  onStepForward,
  onStepBackward,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes.find((n) => n.id === currentSongId) || nodes[0];

  if (nodes.length === 0) {
    return (
      <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-500 mb-3">
          <RotateCw className="w-6 h-6" />
        </div>
        <h3 className="text-stone-200 font-semibold mb-1">Empty Linked List</h3>
        <p className="text-xs text-stone-500 max-w-sm">
          `head = None`. Add songs or run the assessment test suite to watch memory nodes and circular pointers connect in real-time.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-stone-900/70 border border-stone-800 rounded-2xl p-5 sm:p-6 backdrop-blur-sm shadow-xl">
      {/* Visualizer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-stone-100">
              Circular Doubly Linked List Architecture
            </h3>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
              {nodes.length} {nodes.length === 1 ? 'Node' : 'Nodes'}
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Real-time memory pointer graph with circular wrap: <code className="text-amber-400">tail.next → head</code> and <code className="text-amber-400">head.prev → tail</code>
          </p>
        </div>

        {/* Live Traversal Trigger Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onStepBackward}
            title="Step through prev pointer (backward)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors border border-stone-700"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Step Prev</span>
          </button>
          <button
            onClick={onStepForward}
            title="Step through next pointer (forward)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors border border-stone-700"
          >
            <span>Step Next</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Circular Wrap-around Indicator Strip */}
      <div className="my-3 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-center justify-between text-xs text-amber-300/90 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Circular Connection Active:</span>
        </div>
        <div className="text-[11px] truncate">
          <span>Last song ({nodes[nodes.length - 1]?.title})</span>
          <span className="text-amber-400 mx-1.5">⇄</span>
          <span>First song ({nodes[0]?.title})</span>
        </div>
      </div>

      {/* Horizontal Flowing Linked List Chain */}
      <div className="py-4 overflow-x-auto pb-6 pt-2">
        <div className="flex items-stretch gap-4 min-w-max px-2">
          {nodes.map((node, idx) => {
            const isSelected = node.id === selectedNode?.id;
            const isPlayingThis = node.id === currentSongId;

            return (
              <React.Fragment key={node.id}>
                {/* Node Box */}
                <div
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`w-64 rounded-xl p-4 transition-all cursor-pointer relative border flex flex-col justify-between ${
                    isPlayingThis
                      ? 'bg-stone-800/90 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                      : isSelected
                      ? 'bg-stone-800/80 border-stone-600'
                      : 'bg-stone-900/90 border-stone-800 hover:border-stone-700 hover:bg-stone-800/40'
                  }`}
                >
                  {/* Node Header Badges */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="font-mono text-[11px] text-stone-500">
                      Node [{idx}]
                    </span>
                    <div className="flex items-center gap-1">
                      {node.isHead && (
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          HEAD
                        </span>
                      )}
                      {node.isTail && (
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
                          TAIL (head.prev)
                        </span>
                      )}
                      {isPlayingThis && (
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-500 text-stone-950">
                          CURRENT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title and Duration */}
                  <div className="mb-3">
                    <div className="text-base font-semibold text-stone-100 truncate">
                      {node.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                      <span className="font-mono text-amber-400">{node.duration}s</span>
                      <span>·</span>
                      <span className="truncate">{node.artist}</span>
                    </div>
                  </div>

                  {/* Memory Pointers Box */}
                  <div className="bg-stone-950/80 rounded-lg p-2.5 font-mono text-[11px] border border-stone-800/80 space-y-1 mb-3">
                    <div className="flex items-center justify-between text-stone-400">
                      <span className="text-purple-400 flex items-center gap-1">
                        <ArrowLeft className="w-3 h-3" /> prev:
                      </span>
                      <span className="text-stone-300 font-medium truncate max-w-[120px]" title={node.prevTitle}>
                        "{node.prevTitle}"
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-stone-400">
                      <span className="text-cyan-400 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" /> next:
                      </span>
                      <span className="text-stone-300 font-medium truncate max-w-[120px]" title={node.nextTitle}>
                        "{node.nextTitle}"
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Buttons on Node */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-stone-800/80">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSong(node.title);
                      }}
                      className="flex-1 py-1 px-2 rounded-md bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-300 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                      title="Play this song"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Play</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenInsertAfterModal(node.title);
                      }}
                      className="py-1 px-2 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                      title={`insertAfter('${node.title}', ...)`}
                    >
                      <Plus className="w-3 h-3 text-cyan-400" />
                      <span>After</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveSong(node.title);
                      }}
                      className="p-1 rounded-md bg-stone-800 hover:bg-rose-900/60 text-stone-400 hover:text-rose-200 transition-colors"
                      title={`removeSong('${node.title}')`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Bi-directional pointer connector in linear flow */}
                <div className="flex flex-col items-center justify-center shrink-0 px-1 text-stone-600">
                  <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400/90">
                    <span className="text-[11px]">next</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div className="w-12 h-px bg-stone-700/80 my-1.5" />
                  <div className="flex items-center gap-1 text-[10px] font-mono text-purple-400/90">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-[11px]">prev</span>
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {/* Circular Wrap-around Block connecting Tail back to Head */}
          <div className="w-56 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4 flex flex-col justify-center items-center text-center">
            <RotateCw className="w-6 h-6 text-amber-400 mb-2 animate-spin-slow" />
            <div className="text-xs font-bold text-amber-300 font-mono mb-1">
              Circular Loop Wrap
            </div>
            <p className="text-[11px] text-stone-400 mb-2">
              Tail links back to Head; Head links back to Tail.
            </p>
            <div className="text-[10px] font-mono bg-stone-900/80 rounded px-2 py-1 text-stone-300 border border-stone-800">
              `tail.next = head`
              <br />
              `head.prev = tail`
            </div>
          </div>
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="mt-4 pt-4 border-t border-stone-800/80 bg-stone-950/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-200 text-sm">
                  Selected Node: "{selectedNode.title}"
                </span>
                <span className="font-mono text-xs text-stone-500">
                  Duration: {selectedNode.duration}s
                </span>
              </div>
              <div className="text-xs text-stone-400 flex items-center gap-3 mt-0.5">
                <span>
                  <strong className="text-purple-400 font-mono">prev:</strong> {selectedNode.prevTitle}
                </span>
                <span>·</span>
                <span>
                  <strong className="text-cyan-400 font-mono">next:</strong> {selectedNode.nextTitle}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => onSelectSong(selectedNode.title)}
              className="flex-1 md:flex-initial px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play Now</span>
            </button>
            <button
              onClick={() => onOpenInsertAfterModal(selectedNode.title)}
              className="flex-1 md:flex-initial px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors border border-stone-700 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Insert After</span>
            </button>
            <button
              onClick={() => onRemoveSong(selectedNode.title)}
              className="flex-1 md:flex-initial px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
