// src/features/editor/model/useEditorProjectSave.ts
import { useState } from 'react';
import { projectsApi } from '../../../shared/api/projectsApi';
import { templatesApi } from '../../../shared/api/templatesApi';
import type {
    WorkspaceProject,
    WorkspaceTemplate,
} from '../../../shared/types/workspace';
import type { EditorScene } from './editorTypes';
import { editorDraftStorage } from './editorDraftStorage';

export type EditorSaveProjectOptions = {
    saveAsTemplate: boolean;
    isPublic: boolean;
};

type UseEditorProjectSaveParams = {
    project: WorkspaceProject | null;
    linkedTemplate: WorkspaceTemplate | null;
    scene: EditorScene;
    onProjectSaved: (project: WorkspaceProject) => void;
    onTemplateSaved: (template: WorkspaceTemplate | null) => void;
    onSceneSaved: () => void;
    onSaveModalClose: () => void;
};

export function useEditorProjectSave({
    project,
    linkedTemplate,
    scene,
    onProjectSaved,
    onTemplateSaved,
    onSceneSaved,
    onSaveModalClose,
}: UseEditorProjectSaveParams) {
    const [isSaving, setIsSaving] = useState(false);

    const saveProject = async (options: EditorSaveProjectOptions) => {
        if (!project) {
            return;
        }

        try {
            setIsSaving(true);

            const updatedProject = await projectsApi.updateProject(project.id, {
                title: project.title,
                canvasWidth: project.canvasWidth,
                canvasHeight: project.canvasHeight,
                sceneJson: scene,
            });

            onProjectSaved(updatedProject);

            if (options.saveAsTemplate) {
                const baseTemplatePayload = {
                    title: updatedProject.title,
                    category: updatedProject.category,
                    canvasWidth: updatedProject.canvasWidth,
                    canvasHeight: updatedProject.canvasHeight,
                    sceneJson: scene,
                    thumbnailUrl: updatedProject.thumbnailUrl ?? null,
                    isPublic: options.isPublic,
                };

                if (linkedTemplate) {
                    const updatedTemplate = await templatesApi.updateTemplate(
                        linkedTemplate.id,
                        baseTemplatePayload,
                    );

                    onTemplateSaved(updatedTemplate);
                } else {
                    const createdTemplate = await templatesApi.createTemplate({
                        ...baseTemplatePayload,
                        sourceProjectId: updatedProject.id,
                    });

                    onTemplateSaved(createdTemplate);
                }
            } else if (linkedTemplate) {
                await templatesApi.deleteTemplate(linkedTemplate.id);
                onTemplateSaved(null);
            }

            onSceneSaved();
            editorDraftStorage.remove(project.id);
            onSaveModalClose();
        } finally {
            setIsSaving(false);
        }
    };

    return {
        isSaving,
        saveProject,
    };
}
