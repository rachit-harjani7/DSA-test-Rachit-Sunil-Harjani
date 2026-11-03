import React, { useState } from 'react';
import { X, Code, Copy, Check } from 'lucide-react';

interface PythonSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PYTHON_CODE = `class Song:
    def __init__(self, title, duration):
        self.title = title
        self.duration = duration
        self.next = self
        self.prev = self

class Playlist:
    def __init__(self):
        self.head = None          # first song; the last song is head.prev

    # helper: find first song with this title, or None
    def find(self, title):
        if self.head is None:
            return None
        cur = self.head
        while True:
            if cur.title == title:
                return cur
            cur = cur.next
            if cur is self.head:
                return None

    # B(a) addSong: add at the end
    def addSong(self, title, duration):
        node = Song(title, duration)
        if self.head is None:                 # empty playlist
            self.head = node
        else:
            tail = self.head.prev
            node.prev = tail
            node.next = self.head
            tail.next = node
            self.head.prev = node

    # B(b) insertAfter
    def insertAfter(self, key, title, duration):
        k = self.find(key)
        if k is None:
            print(f"Song '{key}' not found. Cannot insert '{title}'.")
            return
        node = Song(title, duration)
        node.prev = k
        node.next = k.next
        k.next.prev = node
        k.next = node

    # B(c) removeSong
    def removeSong(self, title):
        node = self.find(title)
        if node is None:
            print(f"Song '{title}' not found. Nothing removed.")
            return
        if node.next is node:                 # only song in the playlist
            self.head = None
        else:
            node.prev.next = node.next
            node.next.prev = node.prev
            if node is self.head:             # removing the first song
                self.head = node.next
        print(f"Removed: {title}")

    # B(d) displayForward / displayBackward
    def displayForward(self):
        if self.head is None:
            print("Playlist is empty.")
            return
        titles = []
        cur = self.head
        while True:
            titles.append(cur.title)
            cur = cur.next
            if cur is self.head:
                break
        print("Forward :", " -> ".join(titles))

    def displayBackward(self):
        if self.head is None:
            print("Playlist is empty.")
            return
        titles = []
        tail = self.head.prev
        cur = tail
        while True:
            titles.append(cur.title)
            cur = cur.prev
            if cur is tail:
                break
        print("Backward:", " -> ".join(titles))

    # B(e) playNext
    def playNext(self, current):
        if current is None:
            return None
        return current.next                   # circular: last -> first


# ---------- Part C: main program ----------
if __name__ == "__main__":
    p = Playlist()

    p.addSong("Sunrise", 210)
    p.addSong("Desert Rain", 185)
    p.addSong("Marina Lights", 240)

    p.insertAfter("Sunrise", "Skyline", 200)
    p.insertAfter("Marina Lights", "Night Drive", 195)

    print("--- Before removal ---")
    p.displayForward()
    p.displayBackward()

    print("--- Removing songs ---")
    p.removeSong("Sunrise")
    p.removeSong("Desert Rain")
    p.removeSong("Night Drive")
    p.removeSong("Unknown")

    print("--- After removal ---")
    p.displayForward()
    p.displayBackward()

    # Part C Step 7: Starting from Marina Lights, call playNext
    cur = p.find("Marina Lights")
    nxt = p.playNext(cur)
    if nxt:
        print(f"playNext({cur.title}) returned: {nxt.title}")
`;

export const PythonSourceModal: React.FC<PythonSourceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(PYTHON_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative">
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-stone-100">
              dsa_test.py · Python Implementation Source
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto font-mono text-xs text-stone-300 bg-stone-950/70">
          <pre className="whitespace-pre-wrap">{PYTHON_CODE}</pre>
        </div>
      </div>
    </div>
  );
};
