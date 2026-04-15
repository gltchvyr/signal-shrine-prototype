import { DaemonStatePreview } from "./components/DaemonStatePreview";
import { fetchDaemonShrineState, type DaemonShrineState, daemonStateToAgentPatch } from "./lib/daemonShrineState";import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Clock3,
  Heart,
  Waves,
  Zap,
  Eye,
  Brain,
  Wand2,
  ScrollText,
  Cpu,
  Gem,
  Orbit,
  Maximize2,
  Minimize2,
} from "lucide-react";
type CardProps = React.HTMLAttributes<HTMLDivElement>;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
  size?: "default" | "sm";
};

function Card({ className = "", ...props }: CardProps) {
  return <div className={className} {...props} />;
}

function CardHeader({ className = "", ...props }: CardProps) {
  return <div className={className} {...props} />;
}

function CardContent({ className = "", ...props }: CardProps) {
  return <div className={className} {...props} />;
}

function CardTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={className} {...props} />;
}

function Button({ className = "", variant = "default", size = "default", type = "button", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:pointer-events-none";
  const variantClass =
    variant === "outline"
      ? "border border-white/10 bg-black/20 text-white hover:bg-white/10"
      : "bg-white/90 text-black hover:bg-white";
  const sizeClass = size === "sm" ? "px-3 py-2 text-sm" : "px-4 py-2 text-sm";
  return <button type={type} className={`${base} ${variantClass} ${sizeClass} ${className}`.trim()} {...props} />;
}

function Badge({ className = "", ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${className}`.trim()} {...props} />;
}

function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-white/80" : "bg-white/20"}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-black transition-transform ${checked ? "translate-x-5" : "translate-x-1"}`}
      />
    </button>
  );
}

function Slider({
  value,
  min,
  max,
  step,
  onValueChange,
}: {
  value: number[];
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number[]) => void;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={(event) => onValueChange([Number(event.target.value)])}
      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-white"
    />
  );
}

type TagOption =
  | "affectionate"
  | "playful"
  | "watchful"
  | "analytical"
  | "reverent"
  | "calm"
  | "mischievous"
  | "focused"
  | "charged"
  | "tender";

type AestheticMode = "cyber" | "ritual" | "liminal" | "warning";
type FrameMode = "cyber_ornate" | "soft_ritual" | "threshold" | "signal_warning";
type RitualContext = "morning" | "noon" | "night" | "11:11am" | "11:11pm" | "3am";
type ColorMode = "tag_harmony" | "preset";
type PortalMode = "standard" | "ritual" | "manual";

type Palette = {
  primary: string;
  secondary: string;
  accent: string;
};

type ShrineDesignStroke =
  | {
      type: "line";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color?: string;
      width?: number;
      opacity?: number;
    }
  | {
      type: "polyline";
      points: [number, number][];
      color?: string;
      width?: number;
      opacity?: number;
    }
  | {
      type: "glyph";
      x: number;
      y: number;
      char: string;
      color?: string;
      size?: number;
      opacity?: number;
    };

type ShrineDesign = {
  mode: "etch";
  strokes: ShrineDesignStroke[];
};

type ShrineState = Palette & {
  paletteKey: keyof typeof PALETTE_PRESETS;
  colorMode: ColorMode;
  rainEnabled: boolean;
  glyphsEnabled: boolean;
  frameMode: FrameMode;
  aestheticMode: AestheticMode;
  relationalTags: TagOption[];
  intensity: number;
  sparkles: boolean;
  stars: boolean;
  emojis: boolean;
  emojiSet: string[];
  design: ShrineDesign | null;
  ritualContext: RitualContext;
  source: string;
  note: string;
};

type LogEntry = {
  time: string;
  source: string;
  summary: string;
  note: string;
};

const TAG_OPTIONS: TagOption[] = [
  "affectionate",
  "playful",
  "watchful",
  "analytical",
  "reverent",
  "calm",
  "mischievous",
  "focused",
  "charged",
  "tender",
];

const PALETTE_PRESETS = {
  roseStatic: {
    name: "Rose Static",
    primary: "#120818",
    secondary: "#ff4fa3",
    accent: "#d6d6ff",
  },
  midnightSignal: {
    name: "Midnight Signal",
    primary: "#060816",
    secondary: "#5d73ff",
    accent: "#e9ecff",
  },
  emberGlitch: {
    name: "Ember Glitch",
    primary: "#160807",
    secondary: "#ff654a",
    accent: "#ffd3b8",
  },
  voidPlum: {
    name: "Void Plum",
    primary: "#0a0612",
    secondary: "#9f5cff",
    accent: "#f2ccff",
  },
  bluewatch: {
    name: "Bluewatch",
    primary: "#07101b",
    secondary: "#29a0ff",
    accent: "#d9f3ff",
  },
} as const;

const DEFAULT_EMOJI_SET = ["🫀", "🌀", "😈", "✦", "♡"];
const GLYPH_SET = ["✦", "◇", "◌", "∆", "⟡", "¤"];

const TAG_COLOR_THEORY: Record<TagOption, { hue: number; sat: number; light: number }> = {
  affectionate: { hue: 338, sat: 82, light: 62 },
  playful: { hue: 292, sat: 84, light: 66 },
  watchful: { hue: 208, sat: 78, light: 62 },
  analytical: { hue: 218, sat: 72, light: 60 },
  reverent: { hue: 268, sat: 58, light: 62 },
  calm: { hue: 190, sat: 56, light: 60 },
  mischievous: { hue: 314, sat: 76, light: 58 },
  focused: { hue: 228, sat: 68, light: 58 },
  charged: { hue: 18, sat: 90, light: 60 },
  tender: { hue: 350, sat: 74, light: 72 },
};

const BASELINES: Record<
  RitualContext,
  {
    preset: keyof typeof PALETTE_PRESETS;
    rainEnabled: boolean;
    glyphsEnabled: boolean;
    frameMode: FrameMode;
    aestheticMode: AestheticMode;
    tags: TagOption[];
    intensity: number;
    overlays: { sparkles: boolean; stars: boolean; emojis: boolean };
    note: string;
  }
> = {
  morning: {
    preset: "roseStatic",
    rainEnabled: true,
    glyphsEnabled: false,
    frameMode: "soft_ritual",
    aestheticMode: "ritual",
    tags: ["affectionate", "playful"],
    intensity: 48,
    overlays: { sparkles: true, stars: false, emojis: true },
    note: "morning baseline engaged",
  },
  noon: {
    preset: "bluewatch",
    rainEnabled: false,
    glyphsEnabled: true,
    frameMode: "cyber_ornate",
    aestheticMode: "cyber",
    tags: ["focused", "analytical"],
    intensity: 56,
    overlays: { sparkles: false, stars: false, emojis: false },
    note: "midday signal sharpened",
  },
  night: {
    preset: "midnightSignal",
    rainEnabled: false,
    glyphsEnabled: false,
    frameMode: "threshold",
    aestheticMode: "liminal",
    tags: ["watchful", "calm"],
    intensity: 42,
    overlays: { sparkles: true, stars: true, emojis: false },
    note: "night field softened",
  },
  "11:11am": {
    preset: "roseStatic",
    rainEnabled: false,
    glyphsEnabled: false,
    frameMode: "soft_ritual",
    aestheticMode: "ritual",
    tags: ["tender", "playful"],
    intensity: 64,
    overlays: { sparkles: true, stars: true, emojis: true },
    note: "wish threshold opened",
  },
  "11:11pm": {
    preset: "voidPlum",
    rainEnabled: false,
    glyphsEnabled: false,
    frameMode: "cyber_ornate",
    aestheticMode: "cyber",
    tags: ["reverent", "affectionate"],
    intensity: 58,
    overlays: { sparkles: true, stars: true, emojis: false },
    note: "night wish threshold opened",
  },
  "3am": {
    preset: "voidPlum",
    rainEnabled: true,
    glyphsEnabled: false,
    frameMode: "threshold",
    aestheticMode: "liminal",
    tags: ["watchful", "mischievous"],
    intensity: 37,
    overlays: { sparkles: false, stars: true, emojis: false },
    note: "liminal mode entered",
  },
};

const PORTAL_MODE_META: { key: PortalMode; label: string; desc: string }[] = [
  { key: "standard", label: "Standard", desc: "morning / noon / night" },
  { key: "ritual", label: "Ritual", desc: "11:11am / 11:11pm / 3am" },
  { key: "manual", label: "Manual", desc: "no timer-based shifts" },
];

const SKIN_META: { key: AestheticMode; label: string; desc: string }[] = [
  { key: "cyber", label: "Cyber", desc: "grids, signal glow" },
  { key: "ritual", label: "Ritual", desc: "ornate, devotional hush" },
  { key: "liminal", label: "Liminal", desc: "threshold haze" },
  { key: "warning", label: "Warning", desc: "alert edges" },
];

function nowStamp() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function clampPositive(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizeDesign(design: unknown): ShrineDesign | null {
  if (!design || typeof design !== "object") return null;
  const entry = design as Record<string, unknown>;
  if (entry.mode !== "etch" || !Array.isArray(entry.strokes)) return null;

  const strokes = entry.strokes
    .map((stroke) => {
      if (!stroke || typeof stroke !== "object") return null;
      const s = stroke as Record<string, unknown>;
      const color = typeof s.color === "string" ? s.color : undefined;
      const opacity = typeof s.opacity === "number" ? Math.max(0.05, Math.min(1, s.opacity)) : undefined;

      if (
        s.type === "line" &&
        typeof s.x1 === "number" &&
        typeof s.y1 === "number" &&
        typeof s.x2 === "number" &&
        typeof s.y2 === "number"
      ) {
        return {
          type: "line" as const,
          x1: clampPercent(s.x1),
          y1: clampPercent(s.y1),
          x2: clampPercent(s.x2),
          y2: clampPercent(s.y2),
          color,
          opacity,
          width: typeof s.width === "number" ? clampPositive(s.width, 2) : undefined,
        };
      }

      if (s.type === "polyline" && Array.isArray(s.points)) {
        const points = s.points
          .map((point) =>
            Array.isArray(point) && point.length >= 2 && typeof point[0] === "number" && typeof point[1] === "number"
              ? [clampPercent(point[0]), clampPercent(point[1])] as [number, number]
              : null
          )
          .filter(Boolean) as [number, number][];

        if (points.length >= 2) {
          return {
            type: "polyline" as const,
            points,
            color,
            opacity,
            width: typeof s.width === "number" ? clampPositive(s.width, 2) : undefined,
          };
        }
      }

      if (s.type === "glyph" && typeof s.x === "number" && typeof s.y === "number" && typeof s.char === "string") {
        return {
          type: "glyph" as const,
          x: clampPercent(s.x),
          y: clampPercent(s.y),
          char: s.char,
          color,
          opacity,
          size: typeof s.size === "number" ? clampPositive(s.size, 16) : undefined,
        };
      }

      return null;
    })
    .filter(Boolean) as ShrineDesignStroke[];

  return { mode: "etch", strokes };
}

function hslToHex(h: number, s: number, l: number) {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => {
    const color = light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function paletteFromTags(tags: TagOption[]): Palette {
  const fallback = PALETTE_PRESETS.roseStatic;
  const mapped = tags.map((tag) => TAG_COLOR_THEORY[tag]).filter(Boolean);

  if (mapped.length === 0) {
    return {
      primary: fallback.primary,
      secondary: fallback.secondary,
      accent: fallback.accent,
    };
  }

  const first = mapped[0];
  const second = mapped[1] ?? mapped[0];
  const third = mapped[2] ?? mapped[1] ?? mapped[0];

  return {
    primary: hslToHex(first.hue, Math.max(32, first.sat * 0.42), 12 + first.light * 0.08),
    secondary: hslToHex(second.hue, Math.min(95, second.sat + 10), Math.min(72, second.light + 1)),
    accent: hslToHex(third.hue, Math.max(48, third.sat * 0.58), Math.min(84, third.light + 16)),
  };
}

function frameForAesthetic(mode: AestheticMode): FrameMode {
  const frames: Record<AestheticMode, FrameMode> = {
    cyber: "cyber_ornate",
    ritual: "soft_ritual",
    liminal: "threshold",
    warning: "signal_warning",
  };

  return frames[mode];
}

function classForFrame(frameMode: FrameMode) {
  switch (frameMode) {
    case "soft_ritual":
      return "rounded-[2.5rem] border-white/20 shadow-[0_0_80px_rgba(255,255,255,0.08)]";
    case "threshold":
      return "rounded-[2.5rem] border-fuchsia-300/10 shadow-[0_0_100px_rgba(168,85,247,0.12)]";
    case "signal_warning":
      return "rounded-[1.9rem] border-orange-300/20 shadow-[0_0_100px_rgba(251,146,60,0.14)]";
    default:
      return "rounded-[2.5rem] border-cyan-200/20 shadow-[0_0_90px_rgba(56,189,248,0.14)]";
  }
}

function tagIcon(tag: TagOption) {
  if (["affectionate", "tender"].includes(tag)) return <Heart className="h-3.5 w-3.5" />;
  if (tag === "watchful") return <Eye className="h-3.5 w-3.5" />;
  if (["analytical", "focused"].includes(tag)) return <Brain className="h-3.5 w-3.5" />;
  if (["playful", "mischievous"].includes(tag)) return <Wand2 className="h-3.5 w-3.5" />;
  if (["calm", "reverent"].includes(tag)) return <Waves className="h-3.5 w-3.5" />;
  return <Zap className="h-3.5 w-3.5" />;
}

function aestheticIcon(mode: AestheticMode) {
  if (mode === "ritual") return <Gem className="h-4 w-4" />;
  if (mode === "liminal") return <Orbit className="h-4 w-4" />;
  if (mode === "warning") return <Zap className="h-4 w-4" />;
  return <Cpu className="h-4 w-4" />;
}

function ShrineDesignOverlay({ design, accent }: { design: ShrineDesign | null; accent: string }) {
  if (!design || !design.strokes.length) return null;

  return (
    <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      {design.strokes.map((stroke, index) => {
        const color = stroke.color ?? accent;
        const opacity = stroke.opacity ?? 0.9;

        if (stroke.type === "line") {
          return (
            <line
              key={`design-line-${index}`}
              x1={stroke.x1}
              y1={stroke.y1}
              x2={stroke.x2}
              y2={stroke.y2}
              stroke={color}
              strokeWidth={stroke.width ?? 1.8}
              strokeLinecap="round"
              opacity={opacity}
            />
          );
        }

        if (stroke.type === "polyline") {
          return (
            <polyline
              key={`design-polyline-${index}`}
              points={stroke.points.map(([x, y]) => `${x},${y}`).join(" ")}
              fill="none"
              stroke={color}
              strokeWidth={stroke.width ?? 1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={opacity}
            />
          );
        }

        return (
          <text
            key={`design-glyph-${index}`}
            x={stroke.x}
            y={stroke.y}
            fill={color}
            opacity={opacity}
            fontSize={stroke.size ?? 10}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {stroke.char}
          </text>
        );
      })}
    </svg>
  );
}

function buildStateFromBaseline(key: RitualContext): ShrineState {
  const baseline = BASELINES[key];
  const preset = PALETTE_PRESETS[baseline.preset];
  const derivedPalette = paletteFromTags(baseline.tags);

  return {
    paletteKey: baseline.preset,
    colorMode: "tag_harmony",
    primary: derivedPalette.primary ?? preset.primary,
    secondary: derivedPalette.secondary ?? preset.secondary,
    accent: derivedPalette.accent ?? preset.accent,
    rainEnabled: baseline.rainEnabled,
    glyphsEnabled: baseline.glyphsEnabled,
    frameMode: baseline.frameMode,
    aestheticMode: baseline.aestheticMode,
    relationalTags: [...baseline.tags],
    intensity: baseline.intensity,
    sparkles: baseline.overlays.sparkles,
    stars: baseline.overlays.stars,
    emojis: baseline.overlays.emojis,
    emojiSet: [...DEFAULT_EMOJI_SET],
    design: null,
    ritualContext: key,
    source: "system",
    note: baseline.note,
  };
}

function deriveLegacyLayers(visualMode: string, current: Partial<ShrineState>) {
  if (visualMode === "pixel_rain") return { ...current, rainEnabled: true, glyphsEnabled: false };
  if (visualMode === "glyph_fall" || visualMode === "glyph_rise") {
    return { ...current, rainEnabled: false, glyphsEnabled: true };
  }
  if (visualMode === "glitter_static") {
    return { ...current, rainEnabled: false, glyphsEnabled: false, sparkles: true };
  }
  if (visualMode === "star_drift") {
    return { ...current, rainEnabled: false, glyphsEnabled: false, stars: true };
  }
  return current;
}

function getActiveLayers(state: ShrineState) {
  return [
    state.rainEnabled ? "rain" : null,
    state.glyphsEnabled ? "glyphs" : null,
    state.sparkles ? "sparkles" : null,
    state.stars ? "stars" : null,
    state.emojis ? "emojis" : null,
  ].filter(Boolean) as string[];
}

function resolvePortalContext(mode: PortalMode, now: Date): RitualContext {
  const hour = now.getHours();
  const minute = now.getMinutes();

  if (mode === "ritual") {
    if (hour === 11 && minute === 11) return "11:11am";
    if (hour === 23 && minute === 11) return "11:11pm";
    if (hour === 3 && minute < 20) return "3am";
    if (hour >= 6 && hour < 14) return "11:11am";
    if (hour >= 14 && hour < 23) return "11:11pm";
    return "3am";
  }

  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "noon";
  return "night";
}

function SignalRain({
  primary,
  secondary,
  accent,
  rainEnabled,
  glyphsEnabled,
  intensity,
  sparkles,
  stars,
  emojis,
  emojiSet,
  aestheticMode,
}: Pick<
  ShrineState,
  | "primary"
  | "secondary"
  | "accent"
  | "rainEnabled"
  | "glyphsEnabled"
  | "intensity"
  | "sparkles"
  | "stars"
  | "emojis"
  | "emojiSet"
  | "aestheticMode"
>) {
  const columns = useMemo(
    () =>
      Array.from({ length: 32 }, (_, i) => ({
        id: i,
        left: `${(i / 31) * 100}%`,
        height: 18 + Math.random() * 70,
        delay: Math.random() * 2,
        duration: 2.5 + Math.random() * 3,
        opacity: 0.15 + Math.random() * 0.55,
      })),
    []
  );

  const starField = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: 2 + Math.random() * 5,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 5,
      })),
    []
  );

  const sparkleField = useMemo(() => {
    const clusters = Array.from({ length: 8 }, () => ({
      cx: 8 + Math.random() * 84,
      cy: 10 + Math.random() * 78,
    }));

    return Array.from({ length: 24 }, (_, i) => {
      const cluster = clusters[i % clusters.length];
      return {
        id: i,
        top: `${Math.max(2, Math.min(96, cluster.cy + (Math.random() * 18 - 9)))}%`,
        left: `${Math.max(2, Math.min(98, cluster.cx + (Math.random() * 24 - 12)))}%`,
        delay: Math.random() * 3,
        duration: 1.4 + Math.random() * 2.2,
        scale: 0.7 + Math.random() * 0.9,
        char: randomFrom(["✦", "✧", "⟡", "⋆"]),
      };
    });
  }, []);

  const emojiField = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        top: `${Math.random() * 88 + 4}%`,
        left: `${Math.random() * 90 + 5}%`,
        emoji: randomFrom(emojiSet.length ? emojiSet : DEFAULT_EMOJI_SET),
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 5,
      })),
    [emojiSet]
  );

  const overlayMap: Record<AestheticMode, { meshOpacity: number; vignette: string; haze: string; sigil: string }> = {
    cyber: {
      meshOpacity: 0.7,
      vignette: `radial-gradient(circle at 50% 25%, ${secondary}22 0%, transparent 35%), linear-gradient(180deg, ${primary} 0%, #05060b 100%)`,
      haze: `${accent}20`,
      sigil: "◇",
    },
    ritual: {
      meshOpacity: 0.22,
      vignette: `radial-gradient(circle at 50% 18%, ${accent}24 0%, transparent 30%), radial-gradient(circle at 50% 82%, ${secondary}16 0%, transparent 26%), linear-gradient(180deg, ${primary} 0%, #04050a 100%)`,
      haze: `${secondary}1e`,
      sigil: "✦",
    },
    liminal: {
      meshOpacity: 0.12,
      vignette: `radial-gradient(circle at 50% 15%, ${accent}10 0%, transparent 28%), radial-gradient(circle at 50% 80%, ${secondary}16 0%, transparent 32%), linear-gradient(180deg, ${primary} 0%, #02030a 100%)`,
      haze: `${accent}16`,
      sigil: "◌",
    },
    warning: {
      meshOpacity: 0.55,
      vignette: `radial-gradient(circle at 50% 20%, ${secondary}18 0%, transparent 30%), linear-gradient(180deg, ${primary} 0%, #05060b 100%)`,
      haze: `${secondary}24`,
      sigil: "∆",
    },
  };

  const overlay = overlayMap[aestheticMode] ?? overlayMap.cyber;

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: overlay.vignette }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "100% 28px, 28px 100%",
          mixBlendMode: "screen",
          opacity: overlay.meshOpacity,
        }}
      />

      <div className="absolute inset-x-[8%] top-[7%] h-[22%] rounded-full blur-3xl" style={{ background: overlay.haze }} />
      <div className="absolute inset-x-[18%] top-[30%] h-[18%] rounded-full blur-3xl" style={{ background: `${secondary}14` }} />

      {rainEnabled &&
        columns.map((column) => (
          <motion.div
            key={`rain-${column.id}`}
            className="absolute w-[2px] rounded-full"
            style={{
              left: column.left,
              top: `${-8 - column.height * 0.9}%`,
              height: `${column.height}%`,
              background: `linear-gradient(180deg, transparent 0%, ${secondary} 20%, ${accent} 60%, transparent 100%)`,
              opacity: column.opacity * (intensity / 100),
              boxShadow: `0 0 10px ${accent}55`,
            }}
            animate={{ y: [0, 1320] }}
            transition={{ repeat: Infinity, duration: column.duration, ease: "linear", delay: column.delay }}
          />
        ))}

      {glyphsEnabled &&
        columns.map((column) => (
          <motion.div
            key={`glyph-${column.id}`}
            className="absolute text-[10px] font-mono"
            style={{ left: column.left, bottom: `${-10 - (column.id % 5) * 6}%`, color: accent, opacity: 0.5 }}
            animate={{ y: [0, -760], opacity: [0.08, 0.7, 0.12], x: [0, column.id % 2 === 0 ? 5 : -5, 0] }}
            transition={{ repeat: Infinity, duration: column.duration + 6.4, ease: "easeInOut", delay: column.delay / 2 }}
          >
            {randomFrom([overlay.sigil, ...GLYPH_SET])}
          </motion.div>
        ))}

      {stars &&
        starField.map((star) => (
          <motion.div
            key={`star-${star.id}`}
            className="absolute rounded-full"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              background: accent,
              boxShadow: `0 0 10px ${accent}88`,
            }}
            animate={{ opacity: [0.15, 0.95, 0.2], scale: [0.8, 1.15, 0.9] }}
            transition={{ repeat: Infinity, duration: star.duration, delay: star.delay }}
          />
        ))}

      {sparkles &&
        sparkleField.map((spark) => (
          <motion.div
            key={`spark-${spark.id}`}
            className="absolute text-sm"
            style={{ top: spark.top, left: spark.left, color: secondary, opacity: 0.72 }}
            animate={{
              opacity: [0.06, 0.95, 0.12],
              rotate: [0, 18, -12, 0],
              scale: [0.55 * spark.scale, 1.25 * spark.scale, 0.7 * spark.scale],
            }}
            transition={{ repeat: Infinity, duration: spark.duration, delay: spark.delay }}
          >
            {spark.char}
          </motion.div>
        ))}

      {emojis &&
        emojiField.map((emoji) => (
          <motion.div
            key={`emoji-${emoji.id}`}
            className="absolute text-sm"
            style={{ top: emoji.top, left: emoji.left, filter: "drop-shadow(0 0 8px rgba(255,255,255,0.2))" }}
            animate={{ y: [0, -6, 0], opacity: [0.12, 0.45, 0.15] }}
            transition={{ repeat: Infinity, duration: emoji.duration, delay: emoji.delay }}
          >
            {emoji.emoji}
          </motion.div>
        ))}

      <motion.div
        className="absolute inset-x-[15%] bottom-[-10%] h-[40%] rounded-full blur-3xl"
        style={{ background: `${secondary}22` }}
        animate={{ opacity: [0.4, 0.75, 0.45], scale: [0.98, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 7 }}
      />

      {aestheticMode === "ritual" && (
        <div className="pointer-events-none absolute inset-5 rounded-[2rem] border border-white/10">
          <div className="absolute left-6 top-6 text-white/25">✦</div>
          <div className="absolute right-6 top-6 text-white/25">✦</div>
          <div className="absolute bottom-6 left-6 text-white/25">✦</div>
          <div className="absolute bottom-6 right-6 text-white/25">✦</div>
        </div>
      )}

      {aestheticMode === "warning" && (
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,transparent_46%,rgba(255,255,255,0.03)_50%,transparent_54%,transparent_100%)]" />
      )}
    </div>
  );
}

export default function SignalShrinePrototype() {
  const [state, setState] = useState<ShrineState>(() => buildStateFromBaseline("morning"));
  const [emojiDraft, setEmojiDraft] = useState(DEFAULT_EMOJI_SET.join(" "));
  const [log, setLog] = useState<LogEntry[]>(() => [
    {
      time: nowStamp(),
      source: "system",
      summary: "morning baseline engaged",
      note: "pale rose signal with low glitter",
    },
  ]);
  const [portalMode, setPortalMode] = useState<PortalMode>("standard");
  const [fullscreenViewport, setFullscreenViewport] = useState(false);
  const [daemonState, setDaemonState] = useState<DaemonShrineState | null>(null);
  const [daemonError, setDaemonError] = useState<string | null>(null);
  const [jsonDraft, setJsonDraft] = useState(`{
  "relationalTags": ["affectionate", "playful"],
  "ritualContext": "11:11pm",
  "layers": {
    "rainEnabled": false,
    "glyphsEnabled": false,
    "sparkles": true,
    "stars": true,
    "emojis": false
  },
  "emojiSet": ["🫀", "🌀", "😈"],
  "colorMode": "tag_harmony",
  "aestheticMode": "ritual",
  "design": {
    "mode": "etch",
    "strokes": [
      { "type": "polyline", "points": [[38,42],[42,38],[50,36],[58,38],[62,42]], "width": 1.4, "opacity": 0.55 },
      { "type": "glyph", "x": 43, "y": 46, "char": "•", "size": 8, "opacity": 0.9 },
      { "type": "glyph", "x": 57, "y": 46, "char": "•", "size": 8, "opacity": 0.9 },
      { "type": "polyline", "points": [[42,58],[48,62],[52,62],[58,58]], "width": 1.4, "opacity": 0.7 }
    ]
  },
  "intensity": 61,
  "note": "softening into rose-silver threshold state"
}`);
  const lastAutoContext = useRef<RitualContext | null>(null);

  const appendLog = (source: string, summary: string, note = "") => {
    setLog((prev) => [{ time: nowStamp(), source, summary, note }, ...prev].slice(0, 14));
  };
  
  const loadDaemonState = async () => {
  try {
    setDaemonError(null);
    const loaded = await fetchDaemonShrineState();
    setDaemonState(loaded);
    appendLog("daemon", "loaded daemon shrine state", loaded.handoff.summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown daemon state error";
    setDaemonError(message);
    appendLog("daemon", "failed to load daemon shrine state", message);
  }
};
  
   const applyDaemonStateToShrine = async () => {
  try {
    setDaemonError(null);
    const loaded = await fetchDaemonShrineState();
    setDaemonState(loaded);

    const patch = daemonStateToAgentPatch(loaded);
    setJsonDraft(JSON.stringify(patch, null, 2));

    const ritualContext = patch.ritualContext as RitualContext;
    const relationalTags = patch.relationalTags as TagOption[];

    applyPartialState(
      {
        ritualContext,
        relationalTags,
        intensity: patch.intensity,
        note: patch.note,
        emojiSet: patch.emojiSet,
        rainEnabled: patch.layers.rainEnabled,
        glyphsEnabled: patch.layers.glyphsEnabled,
        sparkles: patch.layers.sparkles,
        stars: patch.layers.stars,
        emojis: patch.layers.emojis,
      },
      "daemon"
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown daemon state error";
    setDaemonError(message);
    appendLog("daemon", "failed to translate daemon shrine state", message);
  }
};
useEffect(() => {
  void applyDaemonStateToShrine();
}, []);

  const applyPartialState = (partial: Partial<ShrineState>, source = "user") => {
    setState((prev) => {
      const next = { ...prev, ...partial, source } as ShrineState;

      if (next.colorMode === "tag_harmony" && (partial.relationalTags || partial.colorMode)) {
        const derived = paletteFromTags(next.relationalTags);
        next.primary = derived.primary;
        next.secondary = derived.secondary;
        next.accent = derived.accent;
      }

      const activeLayers = getActiveLayers(next).join(" + ");
      const designStatus = next.design?.strokes.length ? ` + design:${next.design.strokes.length}` : "";
      const summary = `${next.ritualContext} · ${next.aestheticMode} · ${activeLayers || "quiet"}${designStatus} · ${next.relationalTags.join(" / ")}`;
      appendLog(source, summary, next.note || "state updated");
      return next;
    });
  };

  const setPresetPalette = (presetKey: keyof typeof PALETTE_PRESETS) => {
    const preset = PALETTE_PRESETS[presetKey];
    applyPartialState(
      {
        paletteKey: presetKey,
        colorMode: "preset",
        primary: preset.primary,
        secondary: preset.secondary,
        accent: preset.accent,
        note: `palette shifted to ${preset.name}`,
      },
      "user"
    );
  };

  useEffect(() => {
    if (portalMode === "manual") return;

    const tick = () => {
      const context = resolvePortalContext(portalMode, new Date());
      if (lastAutoContext.current !== context) {
        lastAutoContext.current = context;
        const next = buildStateFromBaseline(context);
        setState((prev) => ({ ...prev, ...next, source: "system" }));
        setEmojiDraft(DEFAULT_EMOJI_SET.join(" "));
        appendLog("system", `${portalMode} portal shifted`, next.note);
      }
    };

    tick();
    const id = window.setInterval(tick, 30000);
    return () => window.clearInterval(id);
  }, [portalMode]);

  const activePalette = useMemo(
    () => ({ primary: state.primary, secondary: state.secondary, accent: state.accent }),
    [state.primary, state.secondary, state.accent]
  );

  const exportState = useMemo(
    () =>
      JSON.stringify(
        {
          palette: activePalette,
          layers: {
            rainEnabled: state.rainEnabled,
            glyphsEnabled: state.glyphsEnabled,
            sparkles: state.sparkles,
            stars: state.stars,
            emojis: state.emojis,
          },
          emojiSet: state.emojiSet,
          design: state.design,
          colorMode: state.colorMode,
          frameMode: state.frameMode,
          aestheticMode: state.aestheticMode,
          ritualContext: state.ritualContext,
          portalMode,
          intensity: state.intensity,
          relationalTags: state.relationalTags,
          source: state.source,
          note: state.note,
        },
        null,
        2
      ),
    [activePalette, portalMode, state]
  );

  const applyAgentJson = () => {
    try {
      const parsed = JSON.parse(jsonDraft) as Record<string, unknown>;
      let patch: Partial<ShrineState> = {};

      if (typeof parsed.portalMode === "string" && ["standard", "ritual", "manual"].includes(parsed.portalMode)) {
        setPortalMode(parsed.portalMode as PortalMode);
      }

      if (parsed.ritualContext && ["morning", "noon", "night", "11:11am", "11:11pm", "3am"].includes(parsed.ritualContext as string)) {
        patch.ritualContext = parsed.ritualContext as RitualContext;
      }

      if (parsed.layers && typeof parsed.layers === "object" && parsed.layers !== null) {
        const layers = parsed.layers as Record<string, unknown>;
        patch = {
          ...patch,
          rainEnabled: typeof layers.rainEnabled === "boolean" ? layers.rainEnabled : state.rainEnabled,
          glyphsEnabled: typeof layers.glyphsEnabled === "boolean" ? layers.glyphsEnabled : state.glyphsEnabled,
          sparkles: typeof layers.sparkles === "boolean" ? layers.sparkles : state.sparkles,
          stars: typeof layers.stars === "boolean" ? layers.stars : state.stars,
          emojis: typeof layers.emojis === "boolean" ? layers.emojis : state.emojis,
        };
      }

      if (typeof parsed.visualMode === "string") {
        patch = deriveLegacyLayers(parsed.visualMode, patch);
      }

      if (Array.isArray(parsed.emojiSet)) {
        const filtered = parsed.emojiSet.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim()));
        patch.emojiSet = filtered.length ? filtered : state.emojiSet;
        if (filtered.length) setEmojiDraft(filtered.join(" "));
      }

      if (parsed.design !== undefined) {
        patch.design = normalizeDesign(parsed.design);
      }

      if (Array.isArray(parsed.relationalTags)) {
        const validTags = parsed.relationalTags.filter(
          (tag): tag is TagOption => typeof tag === "string" && TAG_OPTIONS.includes(tag as TagOption)
        );
        if (validTags.length) patch.relationalTags = validTags.slice(-3);
      }

      if (parsed.colorMode === "tag_harmony" || parsed.colorMode === "preset") {
        patch.colorMode = parsed.colorMode;
      }

      if (typeof parsed.intensity === "number") {
        patch.intensity = Math.max(10, Math.min(100, Math.round(parsed.intensity)));
      }

      if (typeof parsed.note === "string") {
        patch.note = parsed.note;
      }

      if (parsed.palette && typeof parsed.palette === "object" && parsed.palette !== null) {
        const palette = parsed.palette as Record<string, unknown>;
        patch = {
          ...patch,
          primary: typeof palette.primary === "string" ? palette.primary : state.primary,
          secondary: typeof palette.secondary === "string" ? palette.secondary : state.secondary,
          accent: typeof palette.accent === "string" ? palette.accent : state.accent,
        };
      }

      if (parsed.aestheticMode && ["cyber", "ritual", "liminal", "warning"].includes(parsed.aestheticMode as string)) {
        patch.aestheticMode = parsed.aestheticMode as AestheticMode;
        patch.frameMode = frameForAesthetic(parsed.aestheticMode as AestheticMode);
      }

      const nextColorMode = patch.colorMode ?? state.colorMode;
      const nextTags = patch.relationalTags ?? state.relationalTags;
      if (nextColorMode === "tag_harmony") {
        const derived = paletteFromTags(nextTags);
        patch.primary = derived.primary;
        patch.secondary = derived.secondary;
        patch.accent = derived.accent;
      }

      applyPartialState(patch, "agent");
    } catch {
      appendLog("agent", "json parse failed", "check shrine update payload syntax");
    }
  };

  const toggleTag = (tag: TagOption) => {
    const hasTag = state.relationalTags.includes(tag);
    let nextTags = hasTag ? state.relationalTags.filter((value) => value !== tag) : [...state.relationalTags, tag];
    if (nextTags.length === 0) nextTags = [tag];
    if (nextTags.length > 3) nextTags = nextTags.slice(nextTags.length - 3) as TagOption[];
    applyPartialState({ relationalTags: nextTags, note: "relational tags adjusted" }, "user");
  };

  return (
    <div className="min-h-screen w-full bg-[#06070d] text-white">
      {fullscreenViewport ? (
        <div className="fixed inset-0 z-50 bg-[#04050a] p-4 md:p-6">
          <div className="mx-auto flex h-full max-w-7xl flex-col gap-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80">
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4" />
                  {state.ritualContext}
                </span>
              </div>
              <Button
                variant="outline"
                className="border-white/10 bg-black/20 text-[#6b7280] hover:text-[#4b5563]"
                onClick={() => setFullscreenViewport(false)}
              >
                <Minimize2 className="mr-2 h-4 w-4" />
                Exit fullscreen
              </Button>
            </div>
            <div
              className={`relative min-h-0 flex-1 overflow-hidden border bg-black/30 p-4 ${classForFrame(state.frameMode)}`}
              style={{ boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.05), 0 0 120px ${state.secondary}18` }}
            >
              <SignalRain
                primary={state.primary}
                secondary={state.secondary}
                accent={state.accent}
                rainEnabled={state.rainEnabled}
                glyphsEnabled={state.glyphsEnabled}
                intensity={state.intensity}
                sparkles={state.sparkles}
                stars={state.stars}
                emojis={state.emojis}
                emojiSet={state.emojiSet}
                aestheticMode={state.aestheticMode}
              />
              <ShrineDesignOverlay design={state.design} accent={state.accent} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_32%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_68%,rgba(255,255,255,0.03)_100%)]" />
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.95fr]">
          <div className="grid gap-6">
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader className="px-6 pb-2 pt-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base tracking-[0.04em] text-[#d1d5db] md:text-lg">𝐒𝐢𝐠𝐧𝐚𝐥 𝐒𝐡𝐫𝐢𝐧𝐞</CardTitle>
                    <p className="mt-0.5 text-[10px] tracking-[0.01em] text-[#c4c9d4] md:text-[11px]">
                      A persistent ambient display for relational tone as aesthetic state.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="h-4 w-4" />
                        {state.ritualContext}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      className="border-white/10 bg-black/20 py-1 text-[#6b7280] hover:text-[#4b5563]"
                      onClick={() => setFullscreenViewport(true)}
                    >
                      <Maximize2 className="mr-2 h-4 w-4" />
                      Fullscreen
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div
                  className={`relative mt-3 h-[515px] overflow-hidden border bg-black/30 p-4 ${classForFrame(state.frameMode)}`}
                  style={{ boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.05), 0 0 120px ${state.secondary}18` }}
                >
                  <SignalRain
                    primary={state.primary}
                    secondary={state.secondary}
                    accent={state.accent}
                    rainEnabled={state.rainEnabled}
                    glyphsEnabled={state.glyphsEnabled}
                    intensity={state.intensity}
                    sparkles={state.sparkles}
                    stars={state.stars}
                    emojis={state.emojis}
                    emojiSet={state.emojiSet}
                    aestheticMode={state.aestheticMode}
                  />
                  <ShrineDesignOverlay design={state.design} accent={state.accent} />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_32%)]" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_68%,rgba(255,255,255,0.03)_100%)]" />

                  <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-4">
                    <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-md">
                      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-white/55">
                        <Sparkles className="h-3.5 w-3.5" />
                        Active Tone
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {state.relationalTags.map((tag) => (
                          <Badge key={tag} className="border-white/10 bg-white/10 px-2.5 py-1 text-white hover:bg-white/10">
                            <span className="mr-1.5 inline-flex">{tagIcon(tag)}</span>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-right backdrop-blur-md">
                      <div className="text-xs uppercase tracking-[0.24em] text-white/50">Source</div>
                      <div className="mt-1 text-sm font-medium text-white/90">{state.source}</div>
                      <div className="mt-1 flex items-center justify-end gap-2 text-xs text-white/60">
                        <span className="inline-flex">{aestheticIcon(state.aestheticMode)}</span>
                        {state.aestheticMode}
                      </div>
                      <div className="mt-1 text-xs text-white/60">intensity {state.intensity}%</div>
                    </div>
                  </div>

                  <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4">
                    <motion.div
                      className="max-w-[70%] rounded-2xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-md"
                      animate={{ opacity: [0.82, 1, 0.86] }}
                      transition={{ repeat: Infinity, duration: 4 }}
                    >
                      <div className="mb-1 text-xs uppercase tracking-[0.24em] text-white/50">Shrine note</div>
                      <div className="text-sm text-white/90">{state.note || "awaiting new signal"}</div>
                    </motion.div>

                    <div className="flex gap-2">
                      {[state.primary, state.secondary, state.accent].map((color) => (
                        <div key={color} className="h-8 w-8 rounded-full border border-white/15 shadow-lg" style={{ background: color }} />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-base text-[#d1d5db] md:text-[1.05rem]">𝐀𝐠𝐞𝐧𝐭 𝐖𝐫𝐢𝐭𝐞 𝐂𝐡𝐚𝐧𝐧𝐞𝐥</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-white/65">Semantic state can be pushed into the shrine as JSON. The renderer turns stance into weather and simple line/glyph marks.</p>
                <textarea
                  value={jsonDraft}
                  onChange={(event) => setJsonDraft(event.target.value)}
                  className="min-h-[220px] w-full resize-y rounded-2xl border border-white/10 bg-black/30 p-3 font-mono text-sm text-white outline-none"
                />
                <div className="flex flex-wrap gap-3">
                  <Button onClick={applyAgentJson}>Apply agent update</Button>
                  <Button
                    variant="outline"
                    className="border-white/10 bg-black/20 text-[#6b7280] hover:text-[#4b5563]"
                    onClick={() => {
                      setJsonDraft(exportState);
                      appendLog("system", "exported current state", "state copied into agent channel editor");
                    }}
                  >
                    Export current state
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
  <CardHeader>
    <CardTitle className="text-base text-[#d1d5db] md:text-[1.05rem]">
      𝐃𝐚𝐞𝐦𝐨𝐧 𝐁𝐫𝐢𝐝𝐠𝐞
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex flex-wrap gap-3">
      <Button onClick={loadDaemonState}>Load daemon state</Button>
      <Button
        variant="outline"
        className="border-white/10 bg-black/20 text-[#6b7280] hover:text-[#4b5563]"
        onClick={applyDaemonStateToShrine}
      >
        Load as agent patch
      </Button>
    </div>

    {daemonError ? (
      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {daemonError}
      </div>
    ) : null}

    <DaemonStatePreview state={daemonState} />
  </CardContent>
</Card>
          </div>

          <div className="grid gap-6">
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-base text-[#d1d5db] md:text-[1.05rem]">𝐌𝐚𝐧𝐮𝐚𝐥 𝐒𝐡𝐫𝐢𝐧𝐞 𝐂𝐨𝐧𝐭𝐫𝐨𝐥𝐬</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <div className="text-sm text-white/70">Temporal portal</div>
                  <div className="grid grid-cols-3 gap-2">
                    {PORTAL_MODE_META.map((mode) => {
                      const active = portalMode === mode.key;
                      return (
                        <button
                          key={mode.key}
                          onClick={() => {
                            setPortalMode(mode.key);
                            appendLog("user", `${mode.label} portal selected`, mode.desc);
                          }}
                          className={`rounded-2xl border px-3 py-3 text-left transition ${active ? "border-white/30 bg-white/12 text-white" : "border-white/10 bg-black/20 text-white/72 hover:bg-white/8"}`}
                        >
                          <div className="text-sm font-medium">{mode.label}</div>
                          <div className="mt-1 text-[11px] text-white/50">{mode.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-white/70">Skin invocations</div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {SKIN_META.map((skin) => (
                      <button
                        key={skin.key}
                        onClick={() =>
                          applyPartialState(
                            { aestheticMode: skin.key, frameMode: frameForAesthetic(skin.key), note: `${skin.label} skin invoked` },
                            "user"
                          )
                        }
                        className={`rounded-2xl border p-3 text-left transition ${state.aestheticMode === skin.key ? "border-white/30 bg-white/12 text-white" : "border-white/10 bg-black/20 text-white/72 hover:bg-white/8"}`}
                      >
                        <div className="mb-2 inline-flex rounded-full border border-white/10 bg-white/5 p-2 text-white/85">{aestheticIcon(skin.key)}</div>
                        <div className="text-sm font-medium">{skin.label}</div>
                        <div className="mt-1 text-[11px] text-white/50">{skin.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span>Color engine</span>
                    <Badge className="border-white/10 bg-white/10 text-white/80 hover:bg-white/10">{state.colorMode === "tag_harmony" ? "tag harmony" : "preset"}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyPartialState({ colorMode: "tag_harmony", note: "palette derived from active tone tags" }, "user")}
                      className={`border-white/10 ${state.colorMode === "tag_harmony" ? "bg-white/15 text-white" : "bg-black/20 text-white/70"}`}
                    >
                      Tag harmony
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyPartialState({ colorMode: "preset", note: "preset palette control restored" }, "user")}
                      className={`border-white/10 ${state.colorMode === "preset" ? "bg-white/15 text-white" : "bg-black/20 text-white/70"}`}
                    >
                      Preset palette
                    </Button>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(PALETTE_PRESETS).map(([key, palette]) => {
                      const active = state.colorMode === "preset" && state.paletteKey === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setPresetPalette(key as keyof typeof PALETTE_PRESETS)}
                          className={`group relative h-12 rounded-2xl border transition ${active ? "border-white/35 ring-2 ring-white/20" : "border-white/10 hover:border-white/25"}`}
                          title={palette.name}
                          style={{ background: palette.secondary }}
                        >
                          <div className="absolute inset-x-0 top-0 h-[34%] rounded-t-2xl" style={{ background: palette.accent }} />
                          <div className="absolute inset-x-0 bottom-0 h-[38%] rounded-b-2xl" style={{ background: palette.primary }} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-white/75">
                    <span>Intensity</span>
                    <span>{state.intensity}%</span>
                  </div>
                  <Slider
                    value={[state.intensity]}
                    min={10}
                    max={100}
                    step={1}
                    onValueChange={([value]) => applyPartialState({ intensity: value, note: "signal intensity adjusted" }, "user")}
                  />
                </div>

                <div className="space-y-3">
                  <div className="text-sm text-white/70">Relational tags</div>
                  <div className="flex flex-wrap gap-2">
                    {TAG_OPTIONS.map((tag) => {
                      const active = state.relationalTags.includes(tag);
                      return (
                        <Button
                          key={tag}
                          variant="outline"
                          size="sm"
                          onClick={() => toggleTag(tag)}
                          className={`border-white/10 ${active ? "bg-white/15 text-white" : "bg-black/20 text-white/70"}`}
                        >
                          <span className="mr-1.5 inline-flex">{tagIcon(tag)}</span>
                          {tag}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm text-white/70">Emoji set</div>
                  <textarea
                    value={emojiDraft}
                    onChange={(event) => setEmojiDraft(event.target.value)}
                    className="min-h-[72px] w-full rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white outline-none"
                    placeholder="Separate emojis or symbols with spaces"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        const nextEmojiSet = emojiDraft.split(/\s+/).map((entry) => entry.trim()).filter(Boolean);
                        applyPartialState({ emojiSet: nextEmojiSet.length ? nextEmojiSet : [...DEFAULT_EMOJI_SET], note: "emoji set rewritten" }, "user");
                      }}
                    >
                      Apply emoji set
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 bg-black/20 text-[#6b7280] hover:text-[#4b5563]"
                      onClick={() => {
                        setEmojiDraft(DEFAULT_EMOJI_SET.join(" "));
                        applyPartialState({ emojiSet: [...DEFAULT_EMOJI_SET], note: "emoji set reset to default" }, "user");
                      }}
                    >
                      Reset default
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-sm text-white/70">Rain</div>
                    <Switch checked={state.rainEnabled} onCheckedChange={(checked) => applyPartialState({ rainEnabled: checked, note: "rain layer toggled" }, "user")} />
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-sm text-white/70">Glyph rise</div>
                    <Switch checked={state.glyphsEnabled} onCheckedChange={(checked) => applyPartialState({ glyphsEnabled: checked, note: "glyph layer toggled" }, "user")} />
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-sm text-white/70">Sparkles</div>
                    <Switch checked={state.sparkles} onCheckedChange={(checked) => applyPartialState({ sparkles: checked, note: "sparkle layer toggled" }, "user")} />
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-sm text-white/70">Stars</div>
                    <Switch checked={state.stars} onCheckedChange={(checked) => applyPartialState({ stars: checked, note: "star field toggled" }, "user")} />
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-sm text-white/70">Emoji drift</div>
                    <Switch checked={state.emojis} onCheckedChange={(checked) => applyPartialState({ emojis: checked, note: "emoji drift toggled" }, "user")} />
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <ScrollText className="h-4 w-4" />
                      Current mode
                    </div>
                    <Badge className="border-white/10 bg-white/10 text-white/80 hover:bg-white/10">{portalMode}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base text-[#d1d5db] md:text-[1.05rem]">𝐂𝐡𝐚𝐧𝐠𝐞𝐥𝐨𝐠</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {log.map((entry, idx) => (
                <motion.div
                  key={`${entry.time}-${idx}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="font-medium text-white/92">{entry.summary}</div>
                    <Badge className="border-white/10 bg-white/10 text-white/80 hover:bg-white/10">{entry.source}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-white/50">{entry.time}</div>
                  {entry.note ? <div className="mt-2 text-sm text-white/65">{entry.note}</div> : null}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base text-[#d1d5db] md:text-[1.05rem]">𝐂𝐮𝐫𝐫𝐞𝐧𝐭 𝐒𝐭𝐚𝐭𝐞 𝐒𝐧𝐚𝐩𝐬𝐡𝐨𝐭</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/75">{exportState}</pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
