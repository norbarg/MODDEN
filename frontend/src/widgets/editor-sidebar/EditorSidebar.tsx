// src/widgets/editor-sidebar/EditorSidebar.tsx
import {
    ChevronLeft,
    CloudUpload,
    Image,
    PenTool,
    Shapes,
    Type,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../shared/routes/routes';
import type { EditorPanel } from '../../features/editor/model/editorTypes';
import './EditorSidebar.css';

type EditorSidebarProps = {
    activePanel: EditorPanel;
    onPanelChange: (panel: EditorPanel) => void;
};

type EditorSidebarItem = {
    label: string;
    panel: Exclude<EditorPanel, null>;
    icon: typeof PenTool;
};

const EDITOR_ITEMS: EditorSidebarItem[] = [
    {
        label: 'Tools',
        panel: 'tools',
        icon: PenTool,
    },
    {
        label: 'Shapes',
        panel: 'shapes',
        icon: Shapes,
    },
    {
        label: 'Text',
        panel: 'text',
        icon: Type,
    },
    {
        label: 'Images',
        panel: 'images',
        icon: Image,
    },
    {
        label: 'Uploads',
        panel: 'uploads',
        icon: CloudUpload,
    },
];

export function EditorSidebar({
    activePanel,
    onPanelChange,
}: EditorSidebarProps) {
    const navigate = useNavigate();

    return (
        <aside className="editor-sidebar" aria-label="Editor navigation">
            <button
                className="editor-sidebar__back"
                type="button"
                onClick={() => navigate(ROUTES.PROJECTS)}
            >
                <ChevronLeft size={24} />
                <span>Back</span>
            </button>

            <nav className="editor-sidebar__nav">
                {EDITOR_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePanel === item.panel;

                    return (
                        <button
                            className={`editor-sidebar__link ${
                                isActive ? 'editor-sidebar__link--active' : ''
                            }`}
                            type="button"
                            key={item.panel}
                            onClick={() =>
                                onPanelChange(isActive ? null : item.panel)
                            }
                        >
                            <Icon size={22} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
