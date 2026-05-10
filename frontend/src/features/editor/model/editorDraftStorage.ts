// src/features/editor/model/editorDraftStorage.ts
import type { EditorScene } from './editorTypes';

type EditorProjectDraft = {
    projectId: string;
    scene: EditorScene;
    pastScenes: EditorScene[];
    futureScenes: EditorScene[];
    recentCanvasColors: string[];
    updatedAt: string;
};

const DRAFT_KEY_PREFIX = 'modden_editor_project_draft_';

function getDraftKey(projectId: string) {
    return `${DRAFT_KEY_PREFIX}${projectId}`;
}

export const editorDraftStorage = {
    get(projectId: string): EditorProjectDraft | null {
        const rawDraft = localStorage.getItem(getDraftKey(projectId));

        if (!rawDraft) {
            return null;
        }

        try {
            const draft = JSON.parse(rawDraft) as EditorProjectDraft;

            return {
                ...draft,
                pastScenes: draft.pastScenes ?? [],
                futureScenes: draft.futureScenes ?? [],
                recentCanvasColors: draft.recentCanvasColors ?? [],
            };
        } catch {
            localStorage.removeItem(getDraftKey(projectId));
            return null;
        }
    },

    set(data: {
        projectId: string;
        scene: EditorScene;
        pastScenes: EditorScene[];
        futureScenes: EditorScene[];
        recentCanvasColors: string[];
    }) {
        const MAX_SAVED_HISTORY_ITEMS = 10;

        const draft: EditorProjectDraft = {
            projectId: data.projectId,
            scene: data.scene,
            pastScenes: data.pastScenes.slice(-MAX_SAVED_HISTORY_ITEMS),
            futureScenes: data.futureScenes.slice(-MAX_SAVED_HISTORY_ITEMS),
            recentCanvasColors: data.recentCanvasColors,
            updatedAt: new Date().toISOString(),
        };

        try {
            localStorage.setItem(
                getDraftKey(data.projectId),
                JSON.stringify(draft),
            );
        } catch (error) {
            if (
                error instanceof DOMException &&
                error.name === 'QuotaExceededError'
            ) {
                const draftWithoutHistory: EditorProjectDraft = {
                    ...draft,
                    pastScenes: [],
                    futureScenes: [],
                };

                localStorage.setItem(
                    getDraftKey(data.projectId),
                    JSON.stringify(draftWithoutHistory),
                );

                return;
            }

            throw error;
        }
    },

    remove(projectId: string) {
        localStorage.removeItem(getDraftKey(projectId));
    },
};
