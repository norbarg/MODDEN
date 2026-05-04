// src/shared/types/workspace.ts

export type TemplateCategory =
  | 'INFOGRAPHICS'
  | 'POSTERS'
  | 'BANNERS'
  | 'BOOK_COVERS'
  | 'LOGOS'
  | 'MENUS'
  | 'SOCIAL_MEDIA'
  | 'WALLPAPERS'
  | 'CUSTOM_SIZE';

export type WorkspaceTemplate = {
  id: string;
  ownerUserId?: string | null;
  sourceProjectId?: string | null;
  title: string;
  sceneJson: Record<string, unknown>;
  thumbnailUrl?: string | null;
  category: TemplateCategory;
  canvasWidth: number;
  canvasHeight: number;
  isPublic: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceProject = {
  id: string;
  userId: string;
  templateId?: string | null;
  title: string;
  category: TemplateCategory;
  sceneJson: Record<string, unknown>;
  canvasWidth: number;
  canvasHeight: number;
  thumbnailUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectRequest = {
  templateId: string;
  title?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  sceneJson?: Record<string, unknown>;
  thumbnailUrl?: string;
};
