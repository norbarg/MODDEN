//src/widgets/workspace-sidebar/WorkspaceSidebar.tsx
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../shared/routes/routes';
import './WorkspaceSidebar.css';

import homeIcon from '../../assets/workspace-sidebar/home.svg';
import homeActiveIcon from '../../assets/workspace-sidebar/home-active.svg';

import projectsIcon from '../../assets/workspace-sidebar/projects.svg';
import projectsActiveIcon from '../../assets/workspace-sidebar/projects-active.svg';

import templatesIcon from '../../assets/workspace-sidebar/templates.svg';
import templatesActiveIcon from '../../assets/workspace-sidebar/templates-active.svg';

import accountIcon from '../../assets/workspace-sidebar/account.svg';
import accountActiveIcon from '../../assets/workspace-sidebar/account-active.svg';

type SidebarItem = {
    label: string;
    to: string;
    icon: string;
    activeIcon: string;
    end?: boolean;
};

const TOP_NAV_ITEMS: SidebarItem[] = [
    {
        label: 'Home',
        to: ROUTES.HOME,
        icon: homeIcon,
        activeIcon: homeActiveIcon,
        end: true,
    },
    {
        label: 'Projects',
        to: ROUTES.PROJECTS,
        icon: projectsIcon,
        activeIcon: projectsActiveIcon,
    },
    {
        label: 'Templates',
        to: ROUTES.TEMPLATES,
        icon: templatesIcon,
        activeIcon: templatesActiveIcon,
    },
];

const BOTTOM_NAV_ITEMS: SidebarItem[] = [
    {
        label: 'Account',
        to: ROUTES.ACCOUNT,
        icon: accountIcon,
        activeIcon: accountActiveIcon,
    },
];

function WorkspaceSidebarLink({ item }: { item: SidebarItem }) {
    return (
        <NavLink
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
                `workspace-sidebar__link ${isActive ? 'workspace-sidebar__link--active' : ''}`
            }
        >
            {({ isActive }) => (
                <>
                    <img
                        className="workspace-sidebar__icon"
                        src={isActive ? item.activeIcon : item.icon}
                        alt=""
                        aria-hidden="true"
                    />

                    <span>{item.label}</span>
                </>
            )}
        </NavLink>
    );
}

export function WorkspaceSidebar() {
    return (
        <aside className="workspace-sidebar" aria-label="Workspace navigation">
            <nav
                className="workspace-sidebar__nav"
                aria-label="Main navigation"
            >
                {TOP_NAV_ITEMS.map((item) => (
                    <WorkspaceSidebarLink key={item.to} item={item} />
                ))}
            </nav>

            <nav
                className="workspace-sidebar__nav workspace-sidebar__nav--bottom"
                aria-label="Account navigation"
            >
                {BOTTOM_NAV_ITEMS.map((item) => (
                    <WorkspaceSidebarLink key={item.to} item={item} />
                ))}
            </nav>
        </aside>
    );
}
