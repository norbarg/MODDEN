// src/features/editor/ui/color-picker/useRecentColors.ts
import { useState } from 'react';

const DEFAULT_RECENT_COLORS = [
    '#5ED99A',
    '#48D8FE',
    '#F8A1C4',
    '#FF5C8A',
    '#98BA61',
    '#FFD166',
];

const MAX_RECENT_COLORS = 8;

function normalizeColor(color: string) {
    return color.trim().toUpperCase();
}

function createRecentColors(colors: string[]) {
    const uniqueColors: string[] = [];

    colors.forEach((color) => {
        const normalizedColor = normalizeColor(color);

        if (!normalizedColor) {
            return;
        }

        const alreadyExists = uniqueColors.some(
            (currentColor) => currentColor.toUpperCase() === normalizedColor,
        );

        if (!alreadyExists) {
            uniqueColors.push(normalizedColor);
        }
    });

    return uniqueColors.slice(0, MAX_RECENT_COLORS);
}

export function useRecentColors(initialColors = DEFAULT_RECENT_COLORS) {
    const [recentColors, setRecentColors] = useState<string[]>(
        createRecentColors(initialColors),
    );

    const addRecentColor = (color: string) => {
        setRecentColors((prevColors) =>
            createRecentColors([color, ...prevColors]),
        );
    };

    const restoreRecentColors = (colors: string[]) => {
        setRecentColors(createRecentColors(colors));
    };

    return {
        recentColors,
        addRecentColor,
        restoreRecentColors,
    };
}
