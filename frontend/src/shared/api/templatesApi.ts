// src/shared/api/templatesApi.ts
import { apiRequest } from './apiClient';
import type { TemplateCategory, WorkspaceTemplate } from '../types/workspace';

function buildCategoryQuery(category?: TemplateCategory) {
    return category ? `?category=${category}` : '';
}

export type UpdateTemplateRequest = {
    title?: string;
    canvasWidth?: number;
    canvasHeight?: number;
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
