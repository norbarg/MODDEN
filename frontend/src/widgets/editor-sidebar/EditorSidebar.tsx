// src/widgets/editor-sidebar/EditorSidebar.tsx
import type { EditorPanel } from '../../features/editor/model/editorTypes';
import './EditorSidebar.css';

import backIcon from '../../assets/editor-sidebar/back.svg';

import toolsIcon from '../../assets/editor-sidebar/tools.svg';
import toolsActiveIcon from '../../assets/editor-sidebar/tools-active.svg';

import shapesIcon from '../../assets/editor-sidebar/shapes.svg';
import shapesActiveIcon from '../../assets/editor-sidebar/shapes-active.svg';

import textIcon from '../../assets/editor-sidebar/text.svg';
import textActiveIcon from '../../assets/editor-sidebar/text-active.svg';

import imagesIcon from '../../assets/editor-sidebar/images.svg';
import imagesActiveIcon from '../../assets/editor-sidebar/images-active.svg';

import uploadsIcon from '../../assets/editor-sidebar/uploads.svg';
import uploadsActiveIcon from '../../assets/editor-sidebar/uploads-active.svg';

type EditorSidebarProps = {
    activePanel: EditorPanel;
    onPanelChange: (panel: EditorPanel) => void;
    onBack: () => void;
};

type EditorSidebarItem = {
    label: string;
    panel: Exclude<EditorPanel, null>;
    icon: string;
    activeIcon: string;
};

const EDITOR_ITEMS: EditorSidebarItem[] = [
    {
        label: 'Tools',
        panel: 'tools',
        icon: toolsIcon,
        activeIcon: toolsActiveIcon,
    },
    {
        label: 'Shapes',
        panel: 'shapes',
        icon: shapesIcon,
        activeIcon: shapesActiveIcon,
    },
    {
        label: 'Text',
        panel: 'text',
        icon: textIcon,
        activeIcon: textActiveIcon,
    },
    {
        label: 'Images',
        panel: 'images',
        icon: imagesIcon,
        activeIcon: imagesActiveIcon,
    },
    {
        label: 'Uploads',
        panel: 'uploads',
        icon: uploadsIcon,
        activeIcon: uploadsActiveIcon,
    },
];

export function EditorSidebar({
    activePanel,
    onPanelChange,
    onBack,
}: EditorSidebarProps) {
    return (
        <aside className="editor-sidebar" aria-label="Editor navigation">
            <button
                className="editor-sidebar__back"
                type="button"
                onClick={onBack}
            >
                <img
                    className="editor-sidebar__icon"
                    src={backIcon}
                    alt=""
                    aria-hidden="true"
                />
                <span>Back</span>
            </button>

            <nav className="editor-sidebar__nav">
                {EDITOR_ITEMS.map((item) => {
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
                            <img
                                className="editor-sidebar__icon"
                                src={isActive ? item.activeIcon : item.icon}
                                alt=""
                                aria-hidden="true"
                            />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
