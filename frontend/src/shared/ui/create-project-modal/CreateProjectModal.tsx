// src/shared/ui/create-project-modal/CreateProjectModal.tsx
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import './CreateProjectModal.css';

export type CreateProjectFormValues = {
    title: string;
    canvasWidth: number;
    canvasHeight: number;
};

type CreateProjectModalProps = {
    isOpen: boolean;
    isCreating: boolean;
    mode?: 'create' | 'edit';
    initialValues?: CreateProjectFormValues;
    onClose: () => void;
    onCreate: (values: CreateProjectFormValues) => Promise<void>;
};

export function CreateProjectModal({
    isOpen,
    isCreating,
    mode = 'create',
    initialValues,
    onClose,
    onCreate,
}: CreateProjectModalProps) {
    const [title, setTitle] = useState('Untitled Design');
    const [canvasWidth, setCanvasWidth] = useState('1000');
    const [canvasHeight, setCanvasHeight] = useState('1000');
    const [formError, setFormError] = useState('');

    const modalText = useMemo(() => {
        const isEditMode = mode === 'edit';

        return {
            title: isEditMode ? 'Edit project' : 'Create custom template',
            description: isEditMode
                ? 'Update project name and canvas size.'
                : 'Set project name and canvas size.',
            submit: isCreating
                ? isEditMode
                    ? 'Saving...'
                    : 'Creating...'
                : isEditMode
                  ? 'Save changes'
                  : 'Create project',
            error: isEditMode
                ? 'Could not update project. Try again.'
                : 'Could not create project. Try again.',
        };
    }, [isCreating, mode]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setTitle(initialValues?.title ?? 'Untitled Design');
        setCanvasWidth(String(initialValues?.canvasWidth ?? 1000));
        setCanvasHeight(String(initialValues?.canvasHeight ?? 1000));
        setFormError('');
    }, [isOpen, initialValues]);

    if (!isOpen) {
        return null;
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const normalizedTitle = title.trim();
        const width = Number(canvasWidth);
        const height = Number(canvasHeight);

        if (!normalizedTitle) {
            setFormError('Enter project name.');
            return;
        }

        if (!Number.isFinite(width) || width < 100 || width > 10000) {
            setFormError('Width must be from 100 to 10000 px.');
            return;
        }

        if (!Number.isFinite(height) || height < 100 || height > 10000) {
            setFormError('Height must be from 100 to 10000 px.');
            return;
        }

        setFormError('');

        try {
            await onCreate({
                title: normalizedTitle,
                canvasWidth: width,
                canvasHeight: height,
            });
        } catch {
            setFormError(modalText.error);
        }
    };

    return (
        <div className="create-project-modal" role="dialog" aria-modal="true">
            <button
                className="create-project-modal__backdrop"
                type="button"
                aria-label="Close modal"
                onClick={onClose}
            />

            <form
                className="create-project-modal__card"
                onSubmit={handleSubmit}
            >
                <div className="create-project-modal__head">
                    <div>
                        <h3>{modalText.title}</h3>
                        <p>{modalText.description}</p>
                    </div>

                    <button
                        className="create-project-modal__close"
                        type="button"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <label className="create-project-modal__field">
                    <span>Project name</span>

                    <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Untitled Design"
                    />
                </label>

                <div className="create-project-modal__row">
                    <label className="create-project-modal__field">
                        <span>Width, px</span>

                        <input
                            value={canvasWidth}
                            onChange={(event) =>
                                setCanvasWidth(event.target.value)
                            }
                            inputMode="numeric"
                            placeholder="1000"
                        />
                    </label>

                    <label className="create-project-modal__field">
                        <span>Height, px</span>

                        <input
                            value={canvasHeight}
                            onChange={(event) =>
                                setCanvasHeight(event.target.value)
                            }
                            inputMode="numeric"
                            placeholder="1000"
                        />
                    </label>
                </div>

                {formError && (
                    <p className="create-project-modal__error">{formError}</p>
                )}

                <div className="create-project-modal__actions">
                    <button
                        className="create-project-modal__secondary"
                        type="button"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="create-project-modal__primary"
                        type="submit"
                        disabled={isCreating}
                    >
                        {modalText.submit}
                    </button>
                </div>
            </form>
        </div>
    );
}
