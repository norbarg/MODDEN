// src/features/editor/ui/save-project-modal/SaveProjectModal.tsx
import { type FormEvent, useEffect, useState } from 'react';
import type { EditorSaveProjectOptions } from '../../../model/useEditorProjectSave';
import './SaveProjectModal.css';

type SaveProjectModalProps = {
    isOpen: boolean;
    isSaving: boolean;
    initialOptions: EditorSaveProjectOptions;
    onClose: () => void;
    onSave: (options: EditorSaveProjectOptions) => Promise<void>;
};

export function SaveProjectModal({
    isOpen,
    isSaving,
    initialOptions,
    onClose,
    onSave,
}: SaveProjectModalProps) {
    const [saveAsTemplate, setSaveAsTemplate] = useState(
        initialOptions.saveAsTemplate,
    );
    const [isPublic, setIsPublic] = useState(initialOptions.isPublic);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setSaveAsTemplate(initialOptions.saveAsTemplate);
        setIsPublic(initialOptions.isPublic);
    }, [isOpen, initialOptions]);

    if (!isOpen) {
        return null;
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        await onSave({
            saveAsTemplate,
            isPublic: saveAsTemplate ? isPublic : false,
        });
    };

    return (
        <div className="save-project-modal" role="dialog" aria-modal="true">
            <button
                className="save-project-modal__backdrop"
                type="button"
                aria-label="Close save modal"
                onClick={onClose}
            />

            <form className="save-project-modal__card" onSubmit={handleSubmit}>
                <h2>Save Project</h2>

                <p className="save-project-modal__subtitle">
                    Save your project and choose whether to use it as a template
                    for future designs.
                </p>

                <label className="save-project-modal__option">
                    <span className="save-project-modal__label">
                        Save as template
                    </span>

                    <span className="save-project-modal__row">
                        <input
                            type="checkbox"
                            checked={saveAsTemplate}
                            onChange={(event) => {
                                const checked = event.target.checked;

                                setSaveAsTemplate(checked);

                                if (!checked) {
                                    setIsPublic(false);
                                }
                            }}
                        />

                        <span>
                            Use this project as a reusable starting point for
                            future designs.
                        </span>
                    </span>
                </label>

                <label
                    className={`save-project-modal__option ${
                        !saveAsTemplate
                            ? 'save-project-modal__option--disabled'
                            : ''
                    }`}
                >
                    <span className="save-project-modal__label">
                        Make template public
                    </span>

                    <span className="save-project-modal__row">
                        <input
                            type="checkbox"
                            checked={isPublic}
                            disabled={!saveAsTemplate}
                            onChange={(event) =>
                                setIsPublic(event.target.checked)
                            }
                        />

                        <span>
                            Allow other users to view and use this template.
                        </span>
                    </span>
                </label>

                <div className="save-project-modal__actions">
                    <button
                        className="save-project-modal__submit"
                        type="submit"
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save Project'}
                    </button>
                </div>
            </form>
        </div>
    );
}
