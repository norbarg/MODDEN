// src/shared/api/projectsApi.ts
import { apiRequest } from './apiClient';
import type {
    CreateProjectRequest,
    WorkspaceProject,
} from '../types/workspace';

export type UpdateProjectRequest = {
    title?: string;
    canvasWidth?: number;
    canvasHeight?: number;
    sceneJson?: Record<string, unknown>;
    thumbnailUrl?: string | null;
};

export const projectsApi = {
    getMyProjects() {
        return apiRequest<WorkspaceProject[]>('/projects', {
            method: 'GET',
            auth: true,
        });
    },

    getProject(projectId: string) {
        return apiRequest<WorkspaceProject>(`/projects/${projectId}`, {
            method: 'GET',
            auth: true,
        });
    },

    createProject(dto: CreateProjectRequest) {
        return apiRequest<WorkspaceProject>('/projects', {
            method: 'POST',
            auth: true,
            body: JSON.stringify(dto),
        });
    },

    updateProject(projectId: string, dto: UpdateProjectRequest) {
        return apiRequest<WorkspaceProject>(`/projects/${projectId}`, {
            method: 'PATCH',
            auth: true,
            body: JSON.stringify(dto),
        });
    },

    deleteProject(projectId: string) {
        return apiRequest<void>(`/projects/${projectId}`, {
            method: 'DELETE',
            auth: true,
        });
    },
};
