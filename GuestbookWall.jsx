import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

const STORAGE_KEY = 'guestbook-wall-dnd-kit-v1';
const NOTE_WIDTH = 184;
const NOTE_HEIGHT = 168;
const PIN_SIZE = 28;
const DOCK_WIDTH = 82;
const MAX_NOTES = 40;

const COLORS = {
  yellow: '#fef08a',
  purple: '#e9d5ff',
};

const DEFAULT_PINS = Array.from({ length: 6 }, (_, index) => ({
  id: `pin-${index + 1}`,
  x: 0,
  y: 0,
  attachedNoteId: null,
  offsetX: NOTE_WIDTH * 0.5,
  offsetY: 16,
}));

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function dateLabel() {
  return new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function boardLocalFromClient(boardRef, clientX, clientY) {
  const rect = boardRef.current?.getBoundingClientRect();
  if (!rect) return null;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
    width: rect.width,
    height: rect.height,
  };
}

function BoardDropZone() {
  const { setNodeRef } = useDroppable({ id: 'board-drop' });
  return <div ref={setNodeRef} className="absolute inset-0" aria-hidden="true" />;
}

function NoteDropZone({ noteId }) {
  const { setNodeRef } = useDroppable({ id: `note-drop-${noteId}` });
  return <div ref={setNodeRef} className="absolute inset-0" aria-hidden="true" />;
}

function DraftPostit({ draftName, draftMessage, draftColor, setDraftName, setDraftMessage }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: 'draft-note',
    data: { type: 'draft' },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.38 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="mt-3 h-[232px] w-full rounded-md border border-stone-700/50 p-3 shadow-[4px_5px_0_0_rgba(0,0,0,0.2)]"
      data-testid="draft-note"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-stone-700">post-it</span>
        <button
          type="button"
          className="cursor-grab rounded-md border border-stone-700/60 bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-stone-800 active:cursor-grabbing"
          {...listeners}
          {...attributes}
          aria-label="Drag draft post-it to board"
        >
          drag to board
        </button>
      </div>

      <input
        value={draftName}
        onChange={(event) => setDraftName(event.target.value)}
        maxLength={40}
        placeholder="your name"
        className="w-full border-0 bg-transparent text-[11px] font-extrabold uppercase tracking-[0.08em] text-stone-800 placeholder:text-stone-500 focus:outline-none"
      />
      <textarea
        value={draftMessage}
        onChange={(event) => setDraftMessage(event.target.value)}
        maxLength={200}
        rows={7}
        placeholder="write your note then drag to the board"
        className="mt-2 h-[166px] w-full resize-none border-0 bg-transparent text-[15px] leading-6 text-stone-800 placeholder:text-stone-500 focus:outline-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent, transparent 23px, rgba(120,120,120,0.24) 23px, rgba(120,120,120,0.24) 24px)',
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          inset: 0,
          backgroundColor: draftColor,
          borderRadius: 6,
          zIndex: -1,
        }}
      />
    </article>
  );
}

function BoardNote({ note, noteBounds, onMove }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `note-drag-${note.id}`,
    disabled: note.pinned,
    data: { type: 'note', noteId: note.id },
  });

  const moveX = note.x + (transform?.x || 0);
  const moveY = note.y + (transform?.y || 0);

  const style = {
    transform: `translate3d(${moveX}px, ${moveY}px, 0) rotate(${note.rotation || 0}deg)`,
    transition: isDragging
      ? undefined
      : note.falling
        ? 'transform 750ms cubic-bezier(0.2, 0.8, 0.2, 1)'
        : 'transform 220ms ease-out',
    width: NOTE_WIDTH,
    height: NOTE_HEIGHT,
    backgroundColor: note.color,
    touchAction: 'none',
    willChange: 'transform',
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`absolute select-none rounded-md border border-stone-800/30 p-3 shadow-[4px_5px_0_0_rgba(0,0,0,0.16)] ${note.pinned ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
      {...attributes}
      {...listeners}
      onDoubleClick={() => {
        if (!note.pinned) {
          onMove(note.id, clamp(note.x + 12, 12, noteBounds.maxX), note.y, false);
        }
      }}
    >
      <NoteDropZone noteId={note.id} />
      <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-stone-800">{note.name}</p>
      <p className="mt-2 max-h-[105px] overflow-auto whitespace-pre-wrap text-[15px] leading-5 text-stone-800">{note.message}</p>
      <p className="absolute bottom-2 left-3 text-[10px] font-bold text-stone-600">{note.date}</p>
    </article>
  );
}

function PushPin({ pin, pinX, pinY, attached }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `pin-drag-${pin.id}`,
    data: { type: 'pin', pinId: pin.id },
  });

  const moveX = pinX + (transform?.x || 0);
  const moveY = pinY + (transform?.y || 0);

  return (
    <button
      ref={setNodeRef}
      type="button"
      className="absolute flex h-7 w-7 cursor-grab items-center justify-center rounded-full border border-stone-900 bg-white text-[14px] shadow-[2px_2px_0_0_rgba(0,0,0,0.25)] active:cursor-grabbing"
      style={{
        transform: `translate3d(${moveX}px, ${moveY}px, 0)`,
        transition: isDragging ? undefined : 'transform 180ms ease-out',
        touchAction: 'none',
      }}
      {...attributes}
      {...listeners}
      aria-label={attached ? 'Pinned pushpin' : 'Drag pushpin'}
    >
      📍
    </button>
  );
}

export default function GuestbookWallDndKit() {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const boardRef = useRef(null);

  const [boardSize, setBoardSize] = useState({ width: 920, height: 520 });
  const [ready, setReady] = useState(false);

  const [draftName, setDraftName] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [draftColor, setDraftColor] = useState('yellow');

  const [notes, setNotes] = useState([]);
  const [pins, setPins] = useState(DEFAULT_PINS);
  const [activeDrag, setActiveDrag] = useState(null);

  const noteBounds = useMemo(() => {
    const maxX = Math.max(12, boardSize.width - DOCK_WIDTH - NOTE_WIDTH - 12);
    const maxY = Math.max(12, boardSize.height - NOTE_HEIGHT - 12);
    return { maxX, maxY };
  }, [boardSize.height, boardSize.width]);

  const floorY = noteBounds.maxY;

  function dockPosition(index, size = boardSize) {
    const x = Math.max(8, size.width - DOCK_WIDTH + (DOCK_WIDTH - PIN_SIZE) / 2);
    const y = clamp(54 + index * 56, 28, Math.max(28, size.height - PIN_SIZE - 10));
    return { x, y };
  }

  function getPinPosition(pin, currentNotes) {
    if (!pin.attachedNoteId) {
      return { x: pin.x, y: pin.y };
    }
    const note = currentNotes.find((item) => item.id === pin.attachedNoteId);
    if (!note) return { x: pin.x, y: pin.y };
    return {
      x: note.x + pin.offsetX - PIN_SIZE / 2,
      y: note.y + pin.offsetY - PIN_SIZE / 2,
    };
  }

  function addNoteAtBoardPoint(point) {
    if (!point || point.x < 0 || point.y < 0 || point.y > point.height || point.x > point.width - DOCK_WIDTH) {
      return;
    }
    const message = draftMessage.trim();
    if (!message) return;

    const x = clamp(point.x - NOTE_WIDTH / 2, 12, noteBounds.maxX);
    const y = clamp(point.y - NOTE_HEIGHT / 2, 12, noteBounds.maxY);

    const newNote = {
      id: `note-${Date.now()}`,
      name: draftName.trim() || 'anonymous',
      message,
      date: dateLabel(),
      color: COLORS[draftColor] || COLORS.yellow,
      x,
      y,
      rotation: Number((Math.random() * 6 - 3).toFixed(1)),
      pinned: false,
      pinId: null,
      falling: false,
    };

    setNotes((prev) => [newNote, ...prev].slice(0, MAX_NOTES));
    setDraftMessage('');

    window.setTimeout(() => {
      setNotes((prev) =>
        prev.map((note) => (note.id === newNote.id && !note.pinned ? { ...note, y: floorY, falling: true } : note)),
      );
    }, 35);
  }

  function placeOnBoard() {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    addNoteAtBoardPoint({ x: 72, y: 96, width: rect.width, height: rect.height });
  }

  function moveNote(noteId, x, y, falling) {
    setNotes((prev) => prev.map((note) => (note.id === noteId ? { ...note, x, y, falling } : note)));
  }

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const update = () => {
      const rect = board.getBoundingClientRect();
      setBoardSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(board);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setPins(DEFAULT_PINS.map((pin, index) => ({ ...pin, ...dockPosition(index) })));
      setReady(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const restoredNotes = Array.isArray(parsed.notes) ? parsed.notes : [];
      const restoredPins = Array.isArray(parsed.pins) && parsed.pins.length ? parsed.pins : DEFAULT_PINS;
      setNotes(restoredNotes);
      setPins(
        restoredPins.map((pin, index) => {
          const fallback = dockPosition(index);
          return {
            ...pin,
            x: typeof pin.x === 'number' ? pin.x : fallback.x,
            y: typeof pin.y === 'number' ? pin.y : fallback.y,
          };
        }),
      );
    } catch {
      setPins(DEFAULT_PINS.map((pin, index) => ({ ...pin, ...dockPosition(index) })));
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes, pins }));
  }, [ready, notes, pins]);

  useEffect(() => {
    setNotes((prev) =>
      prev.map((note) => {
        if (note.pinned) {
          return {
            ...note,
            x: clamp(note.x, 12, noteBounds.maxX),
            y: clamp(note.y, 12, noteBounds.maxY),
          };
        }
        return {
          ...note,
          x: clamp(note.x, 12, noteBounds.maxX),
          y: floorY,
          falling: true,
        };
      }),
    );

    setPins((prev) =>
      prev.map((pin, index) => {
        if (pin.attachedNoteId) return pin;
        return { ...pin, ...dockPosition(index) };
      }),
    );
  }, [floorY, noteBounds.maxX]);

  function onDragStart(event) {
    const dragType = event.active.data.current?.type;
    if (!dragType) return;

    if (dragType === 'pin') {
      const pinId = event.active.data.current.pinId;
      const pin = pins.find((item) => item.id === pinId);
      if (!pin || !pin.attachedNoteId) {
        setActiveDrag({ type: dragType, id: pinId });
        return;
      }

      const currentPos = getPinPosition(pin, notes);
      const attachedId = pin.attachedNoteId;

      setNotes((prev) =>
        prev.map((note) =>
          note.id === attachedId ? { ...note, pinned: false, pinId: null, y: floorY, falling: true } : note,
        ),
      );

      setPins((prev) =>
        prev.map((item) =>
          item.id === pinId
            ? { ...item, attachedNoteId: null, x: currentPos.x, y: currentPos.y }
            : item,
        ),
      );

      setActiveDrag({ type: dragType, id: pinId });
      return;
    }

    if (dragType === 'note') {
      setActiveDrag({ type: dragType, id: event.active.data.current.noteId });
      return;
    }

    if (dragType === 'draft') {
      setActiveDrag({ type: dragType, id: 'draft-note' });
    }
  }

  function onDragEnd(event) {
    const dragType = event.active.data.current?.type;
    setActiveDrag(null);
    if (!dragType) return;

    if (dragType === 'draft') {
      const translated = event.active.rect.current.translated || event.active.rect.current.initial;
      if (!translated) return;

      const centerX = translated.left + translated.width / 2;
      const centerY = translated.top + translated.height / 2;
      const point = boardLocalFromClient(boardRef, centerX, centerY);
      addNoteAtBoardPoint(point);
      return;
    }

    if (dragType === 'note') {
      const noteId = event.active.data.current.noteId;
      const note = notes.find((item) => item.id === noteId);
      if (!note || note.pinned) return;

      const nextX = clamp(note.x + event.delta.x, 12, noteBounds.maxX);
      const nextY = clamp(note.y + event.delta.y, 12, noteBounds.maxY);

      moveNote(noteId, nextX, nextY, false);
      window.setTimeout(() => {
        setNotes((prev) =>
          prev.map((item) =>
            item.id === noteId && !item.pinned ? { ...item, y: floorY, falling: true } : item,
          ),
        );
      }, 25);
      return;
    }

    if (dragType === 'pin') {
      const pinId = event.active.data.current.pinId;
      const pin = pins.find((item) => item.id === pinId);
      if (!pin) return;

      const translated = event.active.rect.current.translated || event.active.rect.current.initial;
      const centerX = translated ? translated.left + translated.width / 2 : 0;
      const centerY = translated ? translated.top + translated.height / 2 : 0;
      const local = boardLocalFromClient(boardRef, centerX, centerY);
      if (!local) return;

      const overId = typeof event.over?.id === 'string' ? event.over.id : '';
      if (overId.startsWith('note-drop-')) {
        const targetId = overId.replace('note-drop-', '');
        const target = notes.find((item) => item.id === targetId);

        if (target && !target.pinned) {
          const offsetX = clamp(local.x - target.x, NOTE_WIDTH * 0.12, NOTE_WIDTH * 0.88);
          const offsetY = clamp(local.y - target.y, 10, NOTE_HEIGHT * 0.34);

          setNotes((prev) =>
            prev.map((item) =>
              item.id === target.id
                ? { ...item, pinned: true, pinId, falling: false }
                : item,
            ),
          );

          setPins((prev) =>
            prev.map((item) =>
              item.id === pinId
                ? { ...item, attachedNoteId: target.id, offsetX, offsetY }
                : item,
            ),
          );
          return;
        }
      }

      const freeX = clamp(local.x - PIN_SIZE / 2, 6, Math.max(6, boardSize.width - PIN_SIZE - 6));
      const freeY = clamp(local.y - PIN_SIZE / 2, 6, Math.max(6, boardSize.height - PIN_SIZE - 6));
      const pinIndex = pins.findIndex((item) => item.id === pinId);
      const dock = dockPosition(pinIndex);
      const nearDock = local.x > boardSize.width - DOCK_WIDTH;

      setPins((prev) =>
        prev.map((item) =>
          item.id === pinId
            ? {
                ...item,
                attachedNoteId: null,
                x: nearDock ? dock.x : freeX,
                y: nearDock ? dock.y : freeY,
              }
            : item,
        ),
      );
    }
  }

  return (
    <section className="mx-auto mt-16 w-full max-w-6xl px-4 sm:px-6">
      <div className="rounded-[28px] border-2 border-stone-900 bg-[#fff6e8] p-5 shadow-[10px_10px_0_0_#1f1f1f] md:p-7">
        <header className="text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight text-stone-900 md:text-5xl">Guestbook Wall</h2>
          <p className="mt-1 text-sm font-medium text-stone-700 md:text-base">Write on a post-it, drag it around, and pin it down.</p>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
            <aside className="rounded-2xl border-2 border-stone-900 bg-[#fff3a6] p-3 shadow-[6px_6px_0_0_rgba(31,31,31,0.35)]">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-stone-700">Write here</p>
              <p className="mt-1 text-[11px] font-semibold text-stone-600">Write a message and pin it below</p>

              <DraftPostit
                draftName={draftName}
                draftMessage={draftMessage}
                draftColor={COLORS[draftColor] || COLORS.yellow}
                setDraftName={setDraftName}
                setDraftMessage={setDraftMessage}
              />

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDraftColor('yellow')}
                  className={`h-6 w-6 rounded-full border-2 ${draftColor === 'yellow' ? 'border-stone-900' : 'border-stone-500'} bg-[#fef08a]`}
                  aria-label="Set post-it color to yellow"
                />
                <button
                  type="button"
                  onClick={() => setDraftColor('purple')}
                  className={`h-6 w-6 rounded-full border-2 ${draftColor === 'purple' ? 'border-stone-900' : 'border-stone-500'} bg-[#e9d5ff]`}
                  aria-label="Set post-it color to purple"
                />
              </div>

              <button
                type="button"
                onClick={placeOnBoard}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl border-2 border-green-900 bg-green-600 px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-white shadow-[3px_3px_0_0_#14532d] transition-colors hover:bg-green-700"
              >
                Place On Board
              </button>
            </aside>

            <div
              ref={boardRef}
              className="relative min-h-[500px] overflow-hidden rounded-3xl border-2 border-stone-900"
              style={{
                background:
                  'radial-gradient(circle at 12% 16%, rgba(255,255,255,0.26), transparent 30%), radial-gradient(circle at 86% 72%, rgba(255,255,255,0.18), transparent 30%), repeating-linear-gradient(24deg, rgba(97,61,34,0.11), rgba(97,61,34,0.11) 2px, transparent 2px, transparent 16px), linear-gradient(180deg, #d4a06d 0%, #ba814f 100%)',
              }}
            >
              <BoardDropZone />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-[82px] border-l-2 border-dashed border-amber-100/70 bg-[linear-gradient(180deg,rgba(82,54,31,0.48),rgba(67,44,26,0.62))]">
                <p className="mt-3 text-center text-[10px] font-black uppercase tracking-[0.12em] text-amber-100">Pins</p>
              </div>

              {notes.map((note) => (
                <BoardNote
                  key={note.id}
                  note={note}
                  noteBounds={noteBounds}
                  onMove={moveNote}
                />
              ))}

              {pins.map((pin) => {
                const attached = !!pin.attachedNoteId;
                const pos = getPinPosition(pin, notes);
                return (
                  <PushPin
                    key={pin.id}
                    pin={pin}
                    pinX={pos.x}
                    pinY={pos.y}
                    attached={attached}
                  />
                );
              })}
            </div>
          </div>

          <DragOverlay>
            {activeDrag?.type === 'draft' ? (
              <article
                className="h-[168px] w-[184px] rounded-md border border-stone-800/40 p-3 shadow-[5px_6px_0_0_rgba(0,0,0,0.2)]"
                style={{ backgroundColor: COLORS[draftColor] || COLORS.yellow }}
              >
                <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-stone-800">{draftName.trim() || 'anonymous'}</p>
                <p className="mt-2 max-h-[105px] overflow-hidden whitespace-pre-wrap text-[15px] leading-5 text-stone-800">
                  {draftMessage.trim() || '...'}
                </p>
                <p className="absolute bottom-2 left-3 text-[10px] font-bold text-stone-600">{dateLabel()}</p>
              </article>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </section>
  );
}
