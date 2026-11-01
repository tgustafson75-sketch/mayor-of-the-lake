import { useEffect } from "react";
import { stamp } from "../sim/calendar";
import { useClock } from "./clockStore";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Pause, 1x, 2x, 4x, and skip to the next monthly loop. Drives the clock once per real second. */
export function TimeControls() {
  const speed = useClock((s) => s.speed);
  const setSpeed = useClock((s) => s.setSpeed);
  const tickSecond = useClock((s) => s.tickSecond);
  const skip = useClock((s) => s.skipToNextEvent);
  const day = useClock((s) => s.city.calendar.day);
  const { year, month, dayOfMonth } = stamp({ day });

  useEffect(() => {
    const id = window.setInterval(tickSecond, 1000);
    return () => window.clearInterval(id);
  }, [tickSecond]);

  const btn = (active: boolean) =>
    `rounded-md px-2.5 py-1 text-sm font-bold ${active ? "bg-[#F4C430] text-stone-900" : "bg-stone-800 text-stone-200 hover:bg-stone-700"}`;

  return (
    <div role="group" aria-label="Time controls" className="flex items-center gap-2">
      <button type="button" className={btn(speed === 0)} aria-pressed={speed === 0} onClick={() => setSpeed(0)}>❚❚</button>
      <button type="button" className={btn(speed === 1)} aria-pressed={speed === 1} onClick={() => setSpeed(1)}>1×</button>
      <button type="button" className={btn(speed === 2)} aria-pressed={speed === 2} onClick={() => setSpeed(2)}>2×</button>
      <button type="button" className={btn(speed === 4)} aria-pressed={speed === 4} onClick={() => setSpeed(4)}>4×</button>
      <button type="button" className={btn(false)} onClick={skip} title="Skip to the next monthly report">Next month ▸▸</button>
      <span className="ml-2 text-sm tabular-nums text-stone-300">
        Year {year + 1} · {MONTHS[month]} {dayOfMonth + 1}
      </span>
    </div>
  );
}
