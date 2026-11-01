// Main menu. Phase 0 only: the buttons are placeholders until the screens they
// open are built in later phases.
const MENU_ITEMS = [
  { label: "New Life", phase: 5 },
  { label: "Continue", phase: 5 },
  { label: "Settings", phase: 9 },
] as const;

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-stone-900 p-6 text-stone-100">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Mayor of the Lake</h1>
        <p className="mt-2 text-stone-400">Lake Elsinore, California · working title</p>
      </header>

      <nav aria-label="Main menu" className="flex w-64 flex-col gap-3">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.label}
            type="button"
            disabled
            title={`Arrives in Phase ${item.phase}`}
            className="rounded-lg bg-stone-800 px-4 py-3 text-left text-stone-500 disabled:cursor-not-allowed"
          >
            {item.label}
          </button>
        ))}
      </nav>
    </main>
  );
}
