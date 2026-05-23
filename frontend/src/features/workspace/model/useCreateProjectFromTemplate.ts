// src/features/workspace/model/useCreateProjectFromTemplate.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../../../shared/api/projectsApi';
import { getEditorRoute } from '../../../shared/routes/routes';
import type { WorkspaceTemplate } from '../../../shared/types/workspace';
import type { CreateProjectFormValues } from '../ui/create-project-modal';

export function useCreateProjectFromTemplate() {
    const navigate = useNavigate();

    const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(
        null,
    );

    const createProjectFromTemplate = async (
        template: WorkspaceTemplate,
        values: CreateProjectFormValues,
    ) => {
        if (creatingTemplateId) {
            return;
        }

        try {
            setCreatingTemplateId(template.id);

            const project = await projectsApi.createProject({
                templateId: template.id,
                title: values.title,
                canvasWidth: values.canvasWidth,
                canvasHeight: values.canvasHeight,
                sceneJson: template.sceneJson,
                thumbnailUrl: template.thumbnailUrl ?? undefined,
            });

            navigate(getEditorRoute(project));
        } finally {
            setCreatingTemplateId(null);
        }
    };

    return {
        creatingTemplateId,
        createProjectFromTemplate,
    };
}
