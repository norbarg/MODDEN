import { assetsApi } from '../../../shared/api/assetsApi';
import type { WorkspaceProject } from '../../../shared/types/workspace';
import type { EditorScene } from '../model/editorTypes';
import { exportEditorSceneAsFile } from './exportEditorScene';

export type EditorShareTarget =
    | 'pinterest'
    | 'facebook'
    | 'x'
    | 'instagram'
    | 'copy';

type PrepareEditorShareImageParams = {
    project: WorkspaceProject;
    scene: EditorScene;
};

function toAbsoluteUrl(url: string) {
    return new URL(url, window.location.origin).href;
}

function openShareWindow(url: string) {
    window.open(url, '_blank', 'width=720,height=720,noreferrer');
}

export async function prepareEditorShareImage({
    project,
    scene,
}: PrepareEditorShareImageParams) {
    const file = await exportEditorSceneAsFile({
        project,
        scene,
        format: 'png',
    });

    const { asset } = await assetsApi.uploadAsset(file);

    return {
        file,
        imageUrl: toAbsoluteUrl(asset.fileUrl),
    };
}

function isLocalShareUrl(url: string) {
    // try {
    //     const parsedUrl = new URL(url);
    // } catch {
    //     return true;
    // }
    try {
        const parsedUrl = new URL(url);

        return (
            parsedUrl.hostname === 'localhost' ||
            parsedUrl.hostname === '127.0.0.1' ||
            parsedUrl.hostname === '0.0.0.0'
        );
    } catch {
        return true;
    }
}

export async function shareEditorImageToTarget({
    target,
    project,
    imageUrl,
    file,
}: {
    target: EditorShareTarget;
    project: WorkspaceProject;
    imageUrl: string;
    file: File;
}) {
    const title = project.title || 'MODDEN project';
    const encodedTitle = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(imageUrl);

    const isExternalShareTarget =
        target === 'pinterest' || target === 'facebook' || target === 'x';

    if (isExternalShareTarget && isLocalShareUrl(imageUrl)) {
        throw new Error(
            'This image is saved on localhost. Pinterest, Facebook and X can share only public image URLs.',
        );
    }

    if (target === 'pinterest') {
        openShareWindow(
            `https://www.pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedUrl}&description=${encodedTitle}`,
        );
        return;
    }

    if (target === 'facebook') {
        openShareWindow(
            `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        );
        return;
    }

    if (target === 'x') {
        openShareWindow(
            `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
        );
        return;
    }

    if (target === 'instagram') {
        if (
            navigator.share &&
            navigator.canShare?.({
                files: [file],
            })
        ) {
            await navigator.share({
                title,
                text: `Created in MODDEN: ${title}`,
                files: [file],
            });

            return;
        }

        await navigator.clipboard.writeText(imageUrl);
        return;
    }

    if (target === 'copy') {
        await navigator.clipboard.writeText(imageUrl);
    }
}
