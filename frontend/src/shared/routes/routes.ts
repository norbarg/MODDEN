//src/shared/routes/routes.ts
export const routes = {
    landing: '/',
    login: '/login',
    register: '/register',
    verifyEmail: '/verify-email',
    help: '/help',

    app: '/app',
    projects: '/app/projects',
    newProject: '/app/projects/new',
    project: (projectId: string) => `/app/projects/${projectId}`,
    templates: '/app/templates',
    profile: '/app/profile',
} as const;
