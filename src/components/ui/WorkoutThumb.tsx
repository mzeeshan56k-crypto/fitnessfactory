"use client";

import { Play, Video, Dumbbell } from "lucide-react";
import type { Workout } from "@/lib/data";
import { ExerciseAnimation, patternFor } from "@/components/ui/ExerciseAnimation";
import { cn } from "@/lib/utils";

/**
 * A workout thumbnail. Video workouts get a poster + play badge; everything
 * else gets an animated figure derived from the first exercise's movement
 * pattern — so every workout has a lively, recognisable tile.
 */
export function WorkoutThumb({
  workout,
  className,
  showPlay = true,
  paused = false,
}: {
  workout: Workout;
  className?: string;
  showPlay?: boolean;
  paused?: boolean;
}) {
  const first = workout.exercises[0];
  const isVideo = !!workout.video;

  if (isVideo) {
    return (
      <div className={cn("relative overflow-hidden rounded-xl bg-gradient-to-br from-ink-200 to-ink-100", className)}>
        <div className="absolute inset-0 flex items-center justify-center text-ink-300">
          <Video className="h-8 w-8" />
        </div>
        {showPlay && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white shadow-glow">
              <Play className="h-4 w-4 fill-current" />
            </span>
          </span>
        )}
      </div>
    );
  }

  if (!first) {
    return (
      <div className={cn("relative flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-ink-200 to-ink-100 text-ink-300", className)}>
        <Dumbbell className="h-7 w-7" />
      </div>
    );
  }

  return (
    <ExerciseAnimation
      name={first.name}
      pattern={patternFor(first.name)}
      className={cn("h-full w-full", className)}
      paused={paused}
    />
  );
}
