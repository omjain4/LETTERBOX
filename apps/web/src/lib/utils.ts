import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function renderStars(rating: number): string {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

export function getMediaTypeColor(type: string): string {
    const colors: Record<string, string> = {
        MOVIE: "#6366f1",
        TV_SHOW: "#8b5cf6",
        SHORT_FILM: "#f59e0b",
        YOUTUBE_VIDEO: "#ef4444",
        YOUTUBE_STREAM: "#ef4444",
        SONG: "#10b981",
        ALBUM: "#10b981",
    };
    return colors[type] || "#6366f1";
}
