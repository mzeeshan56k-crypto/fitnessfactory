"use client";

import {
  Droplets, GlassWater, Beef, Drumstick, Fish, Egg, Salad, Carrot, Apple,
  Wheat, Soup, ChefHat, Utensils, CupSoda, Coffee, Footprints, Dumbbell,
  Bike, PersonStanding, Activity, Moon, BedDouble, Sun, Brain, Heart,
  HeartHandshake, Smile, BookOpen, Sparkles, PartyPopper, Hand, Users, Star,
  Target, Leaf, Flower2, Timer, Bell, CheckCircle2,
} from "lucide-react";

type IconComponent = React.ComponentType<{ className?: string }>;

// Registry of habit icons, keyed by a stable string stored on each habit.
export const habitIconRegistry: Record<string, IconComponent> = {
  droplets: Droplets, water: GlassWater, protein: Beef, drumstick: Drumstick,
  fish: Fish, egg: Egg, salad: Salad, carrot: Carrot, apple: Apple,
  carbs: Wheat, soup: Soup, cook: ChefHat, utensils: Utensils, drink: CupSoda,
  coffee: Coffee, steps: Footprints, dumbbell: Dumbbell, bike: Bike,
  stretch: PersonStanding, activity: Activity, moon: Moon, sleep: BedDouble,
  sun: Sun, brain: Brain, heart: Heart, selfcare: HeartHandshake, smile: Smile,
  journal: BookOpen, sparkles: Sparkles, celebrate: PartyPopper, hand: Hand,
  social: Users, star: Star, target: Target, leaf: Leaf, mindful: Flower2,
  timer: Timer, reminder: Bell, check: CheckCircle2,
};

// The order shown in the icon picker.
export const habitIconKeys = Object.keys(habitIconRegistry);

export function habitIconFor(key: string | undefined): IconComponent {
  return (key && habitIconRegistry[key]) || CheckCircle2;
}

// Renders a habit's icon by key, falling back to a check mark.
export function HabitIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = habitIconFor(icon);
  return <Icon className={className} />;
}
