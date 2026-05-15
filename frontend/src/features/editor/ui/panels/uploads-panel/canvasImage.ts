// src/features/editor/ui/panels/uploads-panel/canvasImage.ts
import type {
    EditorImageFilterValues,
    EditorImageObject,
    EditorUploadedImage,
} from '../../../model/editorTypes';

export const DEFAULT_IMAGE_FILTERS: EditorImageFilterValues = {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    grayscale: 0,
    sepia: 0,
    blur: 0,
    invert: 0,
};

export function createEditorImageId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }

    return `image-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getImageSize(src: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => {
            resolve({
                width: image.naturalWidth || image.width,
                height: image.naturalHeight || image.height,
            });
        };

        image.onerror = () => {
            reject(new Error('Could not load image.'));
        };

        image.src = src;
    });
}

type CreateImageObjectParams = {
    upload: EditorUploadedImage;
    canvasWidth: number;
    canvasHeight: number;
    dropPoint?: {
        x: number;
        y: number;
    };
};

export async function createImageObject({
    upload,
    canvasWidth,
    canvasHeight,
    dropPoint,
}: CreateImageObjectParams): Promise<EditorImageObject> {
    const imageSize = await getImageSize(upload.src);

    const maxWidth = canvasWidth * 0.45;
    const maxHeight = canvasHeight * 0.45;

    const scale = Math.min(
        maxWidth / imageSize.width,
        maxHeight / imageSize.height,
        1,
    );

    const width = Math.max(1, imageSize.width * scale);
    const height = Math.max(1, imageSize.height * scale);

    const centerX = dropPoint?.x ?? canvasWidth / 2;
    const centerY = dropPoint?.y ?? canvasHeight / 2;

    return {
        id: createEditorImageId(),
        type: 'image',
        assetId: upload.id,
        src: upload.src,
        fileName: upload.fileName,
        x: centerX - width / 2,
        y: centerY - height / 2,
        width,
        height,
        rotation: 0,
        filters: DEFAULT_IMAGE_FILTERS,
    };
}
