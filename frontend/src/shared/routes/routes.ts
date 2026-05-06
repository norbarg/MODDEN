//src/shared/routes/routes.ts

export const ROUTES = {
    LANDING: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    VERIFY_EMAIL: '/verify-email',
    HOME: '/app',
    PROJECTS: '/app/projects',
    TEMPLATES: '/app/templates',
    ACCOUNT: '/app/account',
    EDITOR: '/app/editor/:projectId',
} as const;

export function getEditorRoute(project: { id: string }) {
    return `/app/editor/${project.id}`;
}
