"use client";

import { cn } from "@/lib/utils";

/**
 * Lightweight, dependency-free animated exercise graphics.
 * Each movement pattern renders a looping CSS/SVG figure that demonstrates
 * the rep — "simple moving images and graphics" that always work offline.
 */

type Pattern =
  | "squat" | "hinge" | "push" | "pull" | "press" | "lunge"
  | "core" | "curl" | "cardio" | "mobility";

const PATTERN_BY_KEYWORD: [RegExp, Pattern][] = [
  [/squat|leg press|lunge step|wall sit/i, "squat"],
  [/deadlift|hinge|romanian|rdl|good morning|swing|hip thrust/i, "hinge"],
  [/bench|push.?up|chest|dip|fly/i, "push"],
  [/pull.?up|row|lat|pulldown|chin/i, "pull"],
  [/overhead|shoulder press|ohp|military|lateral raise/i, "press"],
  [/lunge|split squat|step.?up/i, "lunge"],
  [/plank|crunch|sit.?up|core|ab|hollow|russian/i, "core"],
  [/curl|bicep|tricep|extension|pushdown/i, "curl"],
  [/run|treadmill|bike|row erg|cardio|jump|burpee|sprint|interval|mountain/i, "cardio"],
  [/mobility|stretch|flow|yoga|foam/i, "mobility"],
];

export function patternFor(name: string, explicit?: string): Pattern {
  if (explicit) return explicit as Pattern;
  for (const [re, p] of PATTERN_BY_KEYWORD) if (re.test(name)) return p;
  return "squat";
}

export function ExerciseAnimation({
  name,
  pattern,
  className,
  paused = false,
}: {
  name: string;
  pattern?: string;
  className?: string;
  /** Freeze the figure (calmer in dense grids); it resumes on hover. */
  paused?: boolean;
}) {
  const p = patternFor(name, pattern);
  return (
    <div className={cn("group/anim relative overflow-hidden rounded-xl bg-gradient-to-br from-ink-100 to-ink-50", paused && "is-paused", className)}>
      <div className="absolute inset-0 bg-grid opacity-30" />
      <svg viewBox="0 0 120 120" className="relative h-full w-full">
        <defs>
          <linearGradient id="fig" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f23030" />
            <stop offset="1" stopColor="#f97316" />
          </linearGradient>
        </defs>
        {/* floor */}
        <line x1="20" y1="104" x2="100" y2="104" stroke="#3a3a40" strokeWidth="2" strokeLinecap="round" />
        <Figure pattern={p} />
      </svg>
      <style jsx>{`
        @keyframes squatA { 0%,100% { transform: translateY(0) } 50% { transform: translateY(14px) scaleY(0.9) } }
        @keyframes hingeA { 0%,100% { transform: rotate(0deg) } 50% { transform: rotate(34deg) } }
        @keyframes pushA  { 0%,100% { transform: translateY(0) } 50% { transform: translateY(8px) } }
        @keyframes pullA  { 0%,100% { transform: translateY(6px) } 50% { transform: translateY(-8px) } }
        @keyframes pressA { 0%,100% { transform: translateY(6px) } 50% { transform: translateY(-12px) } }
        @keyframes curlA  { 0%,100% { transform: rotate(0deg) } 50% { transform: rotate(-70deg) } }
        @keyframes coreA  { 0%,100% { transform: rotate(0deg) } 50% { transform: rotate(-18deg) } }
        @keyframes runA   { 0%,100% { transform: translateX(-6px) } 50% { transform: translateX(6px) } }
        @keyframes bobA   { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        .anim { transform-box: fill-box; transform-origin: center; animation-duration: 1.6s; animation-iteration-count: infinite; animation-timing-function: ease-in-out; }
        .squat { animation-name: squatA }
        .hinge { animation-name: hingeA; transform-origin: 60px 70px }
        .push  { animation-name: pushA }
        .pull  { animation-name: pullA }
        .press { animation-name: pressA }
        .curl  { animation-name: curlA; transform-origin: 60px 64px }
        .core  { animation-name: coreA; transform-origin: 60px 86px }
        .cardio{ animation-name: runA }
        .mobility { animation-name: bobA }
        .is-paused .anim { animation-play-state: paused; }
        .is-paused:hover .anim { animation-play-state: running; }
      `}</style>
    </div>
  );
}

function Figure({ pattern }: { pattern: Pattern }) {
  const body = (
    <>
      <circle cx="60" cy="34" r="9" fill="url(#fig)" />
      <rect x="56" y="42" width="8" height="30" rx="4" fill="url(#fig)" />
      <line x1="60" y1="72" x2="50" y2="100" stroke="url(#fig)" strokeWidth="6" strokeLinecap="round" />
      <line x1="60" y1="72" x2="70" y2="100" stroke="url(#fig)" strokeWidth="6" strokeLinecap="round" />
    </>
  );
  const armsUp = (
    <g className={`anim ${pattern}`}>
      <line x1="60" y1="50" x2="44" y2="36" stroke="url(#fig)" strokeWidth="6" strokeLinecap="round" />
      <line x1="60" y1="50" x2="76" y2="36" stroke="url(#fig)" strokeWidth="6" strokeLinecap="round" />
    </g>
  );
  const armsFwd = (
    <g className={`anim ${pattern}`}>
      <line x1="60" y1="52" x2="84" y2="52" stroke="url(#fig)" strokeWidth="6" strokeLinecap="round" />
    </g>
  );

  switch (pattern) {
    case "squat":
    case "lunge":
      return <g className={`anim ${pattern === "lunge" ? "squat" : pattern}`}>{body}<rect x="40" y="26" width="40" height="6" rx="3" fill="#a1a1ab" /></g>;
    case "hinge":
      return <g className={`anim hinge`}>{body}</g>;
    case "push":
      return <g>{body}{armsUp}</g>;
    case "pull":
      return <g className={`anim pull`}>{body}<rect x="50" y="18" width="20" height="5" rx="2" fill="#a1a1ab" /></g>;
    case "press":
      return <g>{body}{armsUp}<rect x="44" y="30" width="32" height="5" rx="2" className="anim press" fill="#a1a1ab" /></g>;
    case "curl":
      return <g>{body}{armsFwd}</g>;
    case "core":
      return <g className="anim core"><circle cx="60" cy="80" r="9" fill="url(#fig)" /><rect x="56" y="60" width="8" height="24" rx="4" fill="url(#fig)" /></g>;
    case "cardio":
      return <g className="anim cardio">{body}</g>;
    case "mobility":
      return <g className="anim mobility">{body}</g>;
    default:
      return <g>{body}</g>;
  }
}
