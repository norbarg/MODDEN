import { useState } from 'react';
import type { WorkspaceProject } from '../../../../../shared/types/workspace';
import type { EditorScene } from '../../../model/editorTypes';
import {
    type EditorShareTarget,
    prepareEditorShareImage,
    shareEditorImageToTarget,
} from '../../../export/shareEditorScene';

import './ShareProjectModal.css';

type ShareProjectModalProps = {
    isOpen: boolean;
    project: WorkspaceProject;
    scene: EditorScene;
    onClose: () => void;
};

const SHARE_TARGETS: {
    id: EditorShareTarget;
    label: string;
    description: string;
}[] = [
    {
        id: 'pinterest',
        label: 'Pinterest',
        description: 'Create a pin with your design',
    },
    {
        id: 'facebook',
        label: 'Facebook',
        description: 'Share image link to Facebook',
    },
    {
        id: 'x',
        label: 'X / Twitter',
        description: 'Post image link to X',
    },
    {
        id: 'instagram',
        label: 'Instagram',
        description: 'Use system share when supported',
    },
    {
        id: 'copy',
        label: 'Copy link',
        description: 'Copy image URL',
    },
];

export function ShareProjectModal({
    isOpen,
    project,
    scene,
    onClose,
}: ShareProjectModalProps) {
    const [isPreparing, setIsPreparing] = useState(false);
    const [shareData, setShareData] = useState<{
        imageUrl: string;
        file: File;
    } | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) {
        return null;
    }

    const getShareData = async () => {
        if (shareData) {
            return shareData;
        }

        setIsPreparing(true);
        setError(null);
        setMessage(null);

        try {
            const prepared = await prepareEditorShareImage({
                project,
                scene,
            });

            setShareData(prepared);
            return prepared;
        } finally {
            setIsPreparing(false);
        }
    };

    const handleShare = async (target: EditorShareTarget) => {
        try {
            const prepared = await getShareData();

            await shareEditorImageToTarget({
                target,
                project,
                imageUrl: prepared.imageUrl,
                file: prepared.file,
            });

            if (target === 'copy') {
                setMessage('Link copied.');
            } else if (target === 'instagram') {
                setMessage(
                    'If Instagram sharing is not available, image link was copied.',
                );
            } else {
                setMessage('Share window opened.');
            }
        } catch (err) {
            console.error(err);

            if (err instanceof Error) {
                setError(err.message);
                return;
            }

            setError('Could not prepare image for sharing.');
        }
    };

    return (
        <div className="share-project-modal" role="dialog" aria-modal="true">
            <button
                className="share-project-modal__backdrop"
                type="button"
                aria-label="Close share modal"
                onClick={onClose}
            />

            <div className="share-project-modal__content">
                <div className="share-project-modal__header">
                    <div>
                        <h2>Share project</h2>
                        <p>Choose where to share your design.</p>
                    </div>

                    <button
                        className="share-project-modal__close"
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className="share-project-modal__list">
                    {SHARE_TARGETS.map((target) => (
                        <button
                            key={target.id}
                            type="button"
                            disabled={isPreparing}
                            onClick={() => void handleShare(target.id)}
                        >
                            <span>
                                <strong>{target.label}</strong>
                                <small>{target.description}</small>
                            </span>

                            <em>{isPreparing ? 'Preparing...' : 'Share'}</em>
                        </button>
                    ))}
                </div>

                {message ? (
                    <p className="share-project-modal__status">{message}</p>
                ) : null}

                {error ? (
                    <p className="share-project-modal__error">{error}</p>
                ) : null}
            </div>
        </div>
    );
}
