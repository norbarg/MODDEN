// src/features/editor/model/editorDraftStorage.ts
import type { EditorOption, EditorPanel, EditorScene } from './editorTypes';

type EditorProjectDraft = {
    projectId: string;
    scene: EditorScene;
    pastScenes: EditorScene[];
    futureScenes: EditorScene[];
    recentColors: string[];
    activePanel: EditorPanel;
    activeOption: EditorOption;
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
            const draft = JSON.parse(rawDraft) as EditorProjectDraft & {
                recentCanvasColors?: string[];
                recentToolColors?: string[];
                activePanel?: EditorPanel;
                activeOption?: EditorOption;
            };

            const recentColors =
                draft.recentColors ??
                draft.recentCanvasColors ??
                draft.recentToolColors ??
                [];

            return {
                projectId: draft.projectId,
                scene: draft.scene,
                pastScenes: draft.pastScenes ?? [],
                futureScenes: draft.futureScenes ?? [],
                recentColors,
                activePanel: draft.activePanel ?? null,
                activeOption: draft.activeOption ?? null,
                updatedAt: draft.updatedAt,
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
        recentColors: string[];
        activePanel: EditorPanel;
        activeOption: EditorOption;
    }) {
        const MAX_SAVED_HISTORY_ITEMS = 10;

        const draft: EditorProjectDraft = {
            projectId: data.projectId,
            scene: data.scene,
            pastScenes: data.pastScenes.slice(-MAX_SAVED_HISTORY_ITEMS),
            futureScenes: data.futureScenes.slice(-MAX_SAVED_HISTORY_ITEMS),
            recentColors: data.recentColors,
            activePanel: data.activePanel,
            activeOption: data.activeOption,
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
