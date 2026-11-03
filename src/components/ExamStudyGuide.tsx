import React, { useState } from 'react';
import { BookOpen, CheckCircle, Code, HelpCircle, Layers, FileText } from 'lucide-react';

export const ExamStudyGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'partA' | 'partD' | 'comparison'>('partA');

  return (
    <div className="space-y-6">
      <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                CLO 4 · Theory & Solutions
              </span>
              <span className="text-xs text-stone-400">
                Symbiosis International University, Dubai
              </span>
              <span className="text-stone-600">·</span>
              <span className="text-xs text-amber-300 font-medium">Rachit Sunil Harjani</span>
              <span className="text-xs font-mono text-stone-400 bg-stone-950 px-1.5 py-0.2 rounded border border-stone-800">
                PRN: 25070721006
              </span>
            </div>
            <h2 className="text-xl font-bold text-stone-100">
              Melody Café Assessment Solution & Study Guide
            </h2>
            <p className="text-xs text-stone-400 mt-1 max-w-2xl">
              Model answers for Part A (Design - 1.5 Marks) and Part D (Types of Linked Lists and Use Cases - 1 Mark).
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-stone-950 rounded-xl border border-stone-800">
            <button
              onClick={() => setActiveTab('partA')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'partA'
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Part A: Design
            </button>
            <button
              onClick={() => setActiveTab('partD')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'partD'
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Part D: Use Cases
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'comparison'
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Array vs List Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Part A Solutions */}
      {activeTab === 'partA' && (
        <div className="space-y-4">
          {/* Question a */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold flex items-center justify-center">
                a
              </span>
              <h3 className="text-sm font-semibold text-stone-200">
                Explain why a linked list is a better choice than an array for this use case. (0.5 mark)
              </h3>
            </div>
            <div className="space-y-2 text-xs text-stone-300 leading-relaxed bg-stone-950/60 p-4 rounded-xl border border-stone-800/80">
              <p>
                <strong>1. Dynamic Resizing & Memory Efficiency:</strong> In a café environment, songs are continuously added throughout the day and removed upon customer complaints. Arrays have a fixed capacity, requiring expensive dynamic resizing ($O(N)$ reallocations and memory copies). A linked list allocates memory dynamically per song node as needed.
              </p>
              <p>
                <strong>2. Efficient Insertions and Deletions ($O(1)$ Pointer Updates):</strong> Inserting a song after a given key (<code className="text-cyan-400">insertAfter</code>) or deleting a song (<code className="text-rose-400">removeSong</code>) in an array requires shifting up to $N$ elements backward or forward ($O(N)$ worst-case time complexity). In a linked list, once the node is identified, inserting or removing requires only reassigning neighboring <code className="text-amber-400">next</code> and <code className="text-amber-400">prev</code> pointers in $O(1)$ constant time.
              </p>
              <p>
                <strong>3. Seamless Circular Playback:</strong> The requirement specifies that when the last song finishes, the player repeats from the first song. In a circular linked list, the tail's next pointer points directly to the head (<code className="text-emerald-400">tail.next = head</code>), eliminating bounds checks or modulo operations ($i = (i + 1) \% N$).
              </p>
            </div>
          </div>

          {/* Question b */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold flex items-center justify-center">
                b
              </span>
              <h3 className="text-sm font-semibold text-stone-200">
                Choose the type of linked list (singly, doubly or circular) that best suits the player, and justify your choice. (0.5 mark)
              </h3>
            </div>
            <div className="space-y-2 text-xs text-stone-300 leading-relaxed bg-stone-950/60 p-4 rounded-xl border border-stone-800/80">
              <p className="font-semibold text-amber-300">
                Recommended Structure: Circular Doubly Linked List
              </p>
              <p>
                <strong>Justification based on required operations:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-stone-300">
                <li>
                  <strong className="text-purple-300">Doubly Linked (prev and next pointers):</strong> The scenario states that "the staff move forward and backward through the songs" and requires <code className="text-cyan-400">displayBackward()</code>. A singly linked list only has forward pointers, making backward navigation require $O(N)$ re-traversal from the head for each step. A doubly linked list allows immediate bidirectional movement in $O(1)$ time via <code className="text-stone-200">current.prev</code>.
                </li>
                <li>
                  <strong className="text-cyan-300">Circular Linked (connecting tail and head):</strong> The scenario specifies: "When the last song finishes, the player repeats the playlist from the first song" and <code className="text-amber-400">playNext(current)</code> must return the first song after the last song. Making the list circular connects <code className="text-stone-200">tail.next = head</code> and <code className="text-stone-200">head.prev = tail</code>, providing natural infinite loop playback and $O(1)$ access to the tail node directly via <code className="text-stone-200">head.prev</code> without maintaining a separate tail pointer variable.
                </li>
              </ul>
            </div>
          </div>

          {/* Question c */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold flex items-center justify-center">
                c
              </span>
              <h3 className="text-sm font-semibold text-stone-200">
                Write the node structure (or class) for a song. (0.5 mark)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 font-mono text-xs">
                <div className="text-amber-400 font-semibold mb-2">// Python Implementation</div>
                <pre className="text-stone-300 leading-relaxed overflow-x-auto">
{`class Song:
    def __init__(self, title, duration):
        self.title = title        # up to 30 chars
        self.duration = duration  # seconds
        self.next = self          # circular pointer
        self.prev = self          # circular pointer`}
                </pre>
              </div>

              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 font-mono text-xs">
                <div className="text-cyan-400 font-semibold mb-2">// C++ / Java Equivalent</div>
                <pre className="text-stone-300 leading-relaxed overflow-x-auto">
{`struct SongNode {
    char title[31];
    int duration;
    SongNode* next;
    SongNode* prev;

    SongNode(const char* t, int d) {
        strncpy(title, t, 30);
        title[30] = '\\0';
        duration = d;
        next = prev = this;
    }
};`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Part D Solutions */}
      {activeTab === 'partD' && (
        <div className="space-y-4">
          {/* Question D(a) */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center">
                a
              </span>
              <h3 className="text-sm font-semibold text-stone-200">
                Song-Request Queue: State the type of linked list that best suits this queue and explain why. (0.5 mark)
              </h3>
            </div>
            <div className="space-y-2 text-xs text-stone-300 leading-relaxed bg-stone-950/60 p-4 rounded-xl border border-stone-800/80">
              <p className="font-semibold text-cyan-300">
                Recommended Structure: Singly Linked List with Head and Tail Pointers (or Circular Singly Linked List)
              </p>
              <p>
                <strong>Justification:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-stone-300">
                <li>
                  <strong>FIFO Behavior (First-In, First-Out):</strong> The problem specifies: "Requests are added at the end (enqueue) and served from the front (dequeue)."
                </li>
                <li>
                  <strong>Unidirectional Flow:</strong> The problem notes: "the list is never read backward." Therefore, backward (<code className="text-amber-400">prev</code>) pointers are redundant and would waste memory (saving one pointer per node across large request backlogs).
                </li>
                <li>
                  <strong>$O(1)$ Time Complexity for Both Operations:</strong> With a <code className="text-emerald-400">head</code> pointer, dequeue from the front takes $O(1)$ time (<code className="text-stone-300">head = head.next</code>). With a <code className="text-sky-400">tail</code> pointer, enqueue at the end takes $O(1)$ time (<code className="text-stone-300">tail.next = newNode; tail = newNode</code>).
                </li>
              </ul>
            </div>
          </div>

          {/* Question D(b) */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center">
                b
              </span>
              <h3 className="text-sm font-semibold text-stone-200">
                Doubly circular linked list pointers linking ends, and two changes to functions. (0.5 mark)
              </h3>
            </div>
            <div className="space-y-3 text-xs text-stone-300 leading-relaxed bg-stone-950/60 p-4 rounded-xl border border-stone-800/80">
              <div>
                <p className="font-semibold text-amber-300 mb-1">
                  Pointers Linking the Two Ends:
                </p>
                <div className="font-mono bg-stone-900 p-2.5 rounded border border-stone-800 space-y-1">
                  <div>1. <code className="text-cyan-400">tail.next = head</code> (or <code className="text-cyan-400">head.prev.next = head</code>)</div>
                  <div>2. <code className="text-purple-400">head.prev = tail</code></div>
                </div>
              </div>

              <div>
                <p className="font-semibold text-amber-300 mb-1">
                  Two Changes This Makes to Your Functions:
                </p>
                <ol className="list-decimal pl-5 space-y-1.5">
                  <li>
                    <strong>Loop Termination Condition in Traversals:</strong> In a linear linked list, traversals terminate when reaching <code className="text-stone-400">cur == NULL / None</code>. In a circular list, there is no null terminator; the traversal must stop when returning to the starting node (<code className="text-amber-400">cur.next == head</code> for forward, or <code className="text-amber-400">cur.prev == tail</code> for backward). Failing to update this condition results in an infinite loop!
                  </li>
                  <li>
                    <strong>Simplified Tail Access & Add Operations:</strong> In a non-circular singly/doubly linked list without a separate tail pointer, adding at the end requires traversing $O(N)$ elements to locate the end. In a doubly circular linked list, the tail is directly accessible in $O(1)$ time via <code className="text-amber-400">head.prev</code>. Any insertion/deletion at either end only requires updating the circular links between <code className="text-stone-300">head</code> and <code className="text-stone-300">head.prev</code>.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Detailed Comparison */}
      {activeTab === 'comparison' && (
        <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6 shadow-md overflow-x-auto">
          <h3 className="text-sm font-semibold text-stone-200 mb-3">
            Algorithmic Complexity: Array vs Circular Doubly Linked List
          </h3>

          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-800 text-stone-400 font-mono">
                <th className="py-2.5 px-3">Operation</th>
                <th className="py-2.5 px-3">Static/Dynamic Array</th>
                <th className="py-2.5 px-3">Circular Doubly Linked List</th>
                <th className="py-2.5 px-3">Why CDLL Wins in Melody Café</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 font-mono">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-stone-200">insertAfter(key, ...)</td>
                <td className="py-2.5 px-3 text-rose-400">O(N) [requires shifting items]</td>
                <td className="py-2.5 px-3 text-emerald-400">O(1) [relink pointers]</td>
                <td className="py-2.5 px-3 font-sans text-stone-300">Instant insertion between songs without shifting whole memory block</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-stone-200">removeSong(title)</td>
                <td className="py-2.5 px-3 text-rose-400">O(N) [requires shifting items]</td>
                <td className="py-2.5 px-3 text-emerald-400">O(1) [relink prev and next]</td>
                <td className="py-2.5 px-3 font-sans text-stone-300">Customer complaints remove song immediately without leaving empty gaps</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-stone-200">playNext(current)</td>
                <td className="py-2.5 px-3 text-amber-400">O(1) [needs (i + 1) % N]</td>
                <td className="py-2.5 px-3 text-emerald-400">O(1) [current.next]</td>
                <td className="py-2.5 px-3 font-sans text-stone-300">Circular pointer seamlessly loops from last song to first song</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-stone-200">playPrev(current)</td>
                <td className="py-2.5 px-3 text-amber-400">O(1) [needs (i - 1 + N) % N]</td>
                <td className="py-2.5 px-3 text-emerald-400">O(1) [current.prev]</td>
                <td className="py-2.5 px-3 font-sans text-stone-300">Staff navigates backward easily with direct pointer reference</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-stone-200">Memory Allocation</td>
                <td className="py-2.5 px-3 text-rose-400">Fixed block / Doubling copies</td>
                <td className="py-2.5 px-3 text-emerald-400">Dynamic node per song</td>
                <td className="py-2.5 px-3 font-sans text-stone-300">Zero wasted memory overhead; scales dynamically with café day</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
