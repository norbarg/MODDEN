// src/shared/api/templatesApi.ts
import { apiRequest } from './apiClient';
import type { TemplateCategory, WorkspaceTemplate } from '../types/workspace';

function buildCategoryQuery(category?: TemplateCategory) {
    return category ? `?category=${category}` : '';
}

export type CreateTemplateRequest = {
    sourceProjectId?: string | null;
    title: string;
    category: TemplateCategory;
    canvasWidth: number;
    canvasHeight: number;
    sceneJson: Record<string, unknown>;
    thumbnailUrl?: string | null;
    isPublic: boolean;
};

export type UpdateTemplateRequest = {
    title?: string;
    category?: TemplateCategory;
    canvasWidth?: number;
    canvasHeight?: number;
    sceneJson?: Record<string, unknown>;
    thumbnailUrl?: string | null;
    isPublic?: boolean;
};

export const templatesApi = {
    getSystemTemplates(category?: TemplateCategory) {
        return apiRequest<WorkspaceTemplate[]>(
            `/templates/system${buildCategoryQuery(category)}`,
            {
                method: 'GET',
                auth: true,
            },
        );
    },

    getPublicTemplates(category?: TemplateCategory) {
        return apiRequest<WorkspaceTemplate[]>(
            `/templates/public${buildCategoryQuery(category)}`,
            {
                method: 'GET',
                auth: true,
            },
        );
    },

    getMyTemplates(category?: TemplateCategory) {
        return apiRequest<WorkspaceTemplate[]>(
            `/templates/me${buildCategoryQuery(category)}`,
            {
                method: 'GET',
                auth: true,
            },
        );
    },

    async getAvailableTemplates(category?: TemplateCategory) {
        const [systemTemplates, publicTemplates, myTemplates] =
            await Promise.all([
                this.getSystemTemplates(category),
                this.getPublicTemplates(category),
                this.getMyTemplates(category),
            ]);

        const templatesById = new Map<string, WorkspaceTemplate>();

        [...systemTemplates, ...publicTemplates, ...myTemplates].forEach(
            (template) => {
                templatesById.set(template.id, template);
            },
        );

        return Array.from(templatesById.values());
    },

    createTemplate(dto: CreateTemplateRequest) {
        return apiRequest<WorkspaceTemplate>('/templates', {
            method: 'POST',
            auth: true,
            body: JSON.stringify(dto),
        });
    },

    updateTemplate(templateId: string, dto: UpdateTemplateRequest) {
        return apiRequest<WorkspaceTemplate>(`/templates/${templateId}`, {
            method: 'PATCH',
            auth: true,
            body: JSON.stringify(dto),
        });
    },

    deleteTemplate(templateId: string) {
        return apiRequest<{ message: string }>(`/templates/${templateId}`, {
            method: 'DELETE',
            auth: true,
        });
    },
};
