// src/features/editor/ui/unsaved-changes-modal/UnsavedChangesModal.tsx
import './UnsavedChangesModal.css';

type UnsavedChangesModalProps = {
    isOpen: boolean;
    onCancel: () => void;
    onLeave: () => void;
    onSaveAndLeave: () => void;
};

export function UnsavedChangesModal({
    isOpen,
    onCancel,
    onLeave,
    onSaveAndLeave,
}: UnsavedChangesModalProps) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="unsaved-changes-modal" role="dialog" aria-modal="true">
            <button
                className="unsaved-changes-modal__backdrop"
                type="button"
                aria-label="Close modal"
                onClick={onCancel}
            />

            <section className="unsaved-changes-modal__card">
                <h2>Unsaved changes</h2>

                <p>
                    You have unsaved changes in this project. Save them before
                    leaving?
                </p>

                <div className="unsaved-changes-modal__actions">
                    <button
                        className="unsaved-changes-modal__secondary"
                        type="button"
                        onClick={onLeave}
                    >
                        Leave without saving
                    </button>

                    <button
                        className="unsaved-changes-modal__ghost"
                        type="button"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>

                    <button
                        className="unsaved-changes-modal__primary"
                        type="button"
                        onClick={onSaveAndLeave}
                    >
                        Save
                    </button>
                </div>
            </section>
        </div>
    );
}
