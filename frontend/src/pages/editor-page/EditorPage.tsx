// src/pages/editor-page/EditorPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { projectsApi } from '../../shared/api/projectsApi';
import { ApiError } from '../../shared/api/apiClient';
import { authStorage } from '../../shared/auth/authStorage';
import { ROUTES } from '../../shared/routes/routes';
import type { WorkspaceProject } from '../../shared/types/workspace';
import { EditorLayout } from '../../layouts/editor-layout/EditorLayout';
import { normalizeEditorScene } from '../../features/editor/model/editorDefaults';
import type { EditorPanel } from '../../features/editor/model/editorTypes';
import './EditorPage.css';

export function EditorPage() {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();

    const [project, setProject] = useState<WorkspaceProject | null>(null);
    const [activePanel, setActivePanel] = useState<EditorPanel>(null);
    const [zoom, setZoom] = useState(100);
    const [isLoading, setIsLoading] = useState(true);

    const accessToken = authStorage.getAccessToken();
    const refreshToken = authStorage.getRefreshToken();

    useEffect(() => {
        if (!projectId) {
            return;
        }

        const currentProjectId = projectId;
        let isMounted = true;

        async function loadProject() {
            try {
                setIsLoading(true);

                const loadedProject =
                    await projectsApi.getProject(currentProjectId);

                if (!isMounted) {
                    return;
                }

                setProject(loadedProject);
            } catch (err) {
                console.error(err);

                if (err instanceof ApiError && err.status === 401) {
                    authStorage.clear();
                    navigate(ROUTES.LOGIN, { replace: true });
                    return;
                }

                if (err instanceof ApiError && err.status === 404) {
                    navigate(ROUTES.PROJECTS, { replace: true });
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadProject();

        return () => {
            isMounted = false;
        };
    }, [navigate, projectId]);

    const scene = useMemo(
        () => normalizeEditorScene(project?.sceneJson),
        [project?.sceneJson],
    );

    if (!accessToken && !refreshToken) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    if (!projectId) {
        return <Navigate to={ROUTES.PROJECTS} replace />;
    }

    if (isLoading) {
        return <main className="editor-page-loader">Loading editor...</main>;
    }

    if (!project) {
        return <Navigate to={ROUTES.PROJECTS} replace />;
    }

    return (
        <EditorLayout
            project={project}
            scene={scene}
            activePanel={activePanel}
            zoom={zoom}
            onPanelChange={setActivePanel}
            onZoomChange={setZoom}
        />
    );
}
