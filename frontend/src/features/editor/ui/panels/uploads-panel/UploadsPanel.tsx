// src/features/editor/ui/panels/uploads-panel/UploadsPanel.tsx
import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, MouseEvent, SyntheticEvent } from 'react';
import type {
    EditorOption,
    EditorUploadedImage,
} from '../../../model/editorTypes';
import './UploadsPanel.css';
import customPlusIcon from '../../../../../assets/editor-subheader/plus.svg';

type UploadsPanelProps = {
    activeOption: EditorOption;
    uploadedImages: EditorUploadedImage[];
    isUploadingImages: boolean;
    onOptionChange: (option: EditorOption) => void;
    onImagesUpload: (files: File[]) => Promise<void>;
    onImagePlace: (image: EditorUploadedImage) => Promise<void>;
    onImageDelete: (imageId: string) => Promise<void>;
};

type ImageRatios = Record<string, number>;

const COLUMN_COUNT = 2;
const TILE_GAP = 14;
const DEFAULT_TILE_HEIGHT = 128;
const ADD_TILE_HEIGHT = 128;

function getTileHeight(imageId: string, imageRatios: ImageRatios) {
    const ratio = imageRatios[imageId];

    if (!ratio) {
        return DEFAULT_TILE_HEIGHT;
    }

    const columnWidth = 132;
    const calculatedHeight = columnWidth / ratio;

    return Math.min(Math.max(calculatedHeight, 92), 220);
}

function distributeImagesToColumns(
    images: EditorUploadedImage[],
    imageRatios: ImageRatios,
) {
    const columns: EditorUploadedImage[][] = Array.from(
        { length: COLUMN_COUNT },
        () => [],
    );

    const columnHeights = Array.from({ length: COLUMN_COUNT }, () => 0);

    columnHeights[0] = ADD_TILE_HEIGHT + TILE_GAP;

    images.forEach((image) => {
        const shortestColumnIndex = columnHeights[0] <= columnHeights[1] ? 0 : 1;

        columns[shortestColumnIndex].push(image);
        columnHeights[shortestColumnIndex] +=
            getTileHeight(image.id, imageRatios) + TILE_GAP;
    });

    return columns;
}

export function UploadsPanel({
    activeOption,
    uploadedImages,
    isUploadingImages,
    onOptionChange,
    onImagesUpload,
    onImagePlace,
    onImageDelete,
}: UploadsPanelProps) {
    const [imageRatios, setImageRatios] = useState<ImageRatios>({});
    const [deletingImageIds, setDeletingImageIds] = useState<string[]>([]);

    const scrollTimerRef = useRef<number | null>(null);
    const [isScrolling, setIsScrolling] = useState(false);

    const handleMasonryScroll = () => {
        setIsScrolling(true);

        if (scrollTimerRef.current) {
            window.clearTimeout(scrollTimerRef.current);
        }

        scrollTimerRef.current = window.setTimeout(() => {
            setIsScrolling(false);
        }, 700);
    };

    const isActive =
        activeOption?.panel === 'uploads' && activeOption.id === 'upload';

    const hasUploadedImages = uploadedImages.length > 0;

    const imageColumns = useMemo(
        () => distributeImagesToColumns(uploadedImages, imageRatios),
        [uploadedImages, imageRatios],
    );

    const handleFilesChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []).filter((file) =>
            file.type.startsWith('image/'),
        );

        event.target.value = '';

        if (files.length === 0) {
            return;
        }

        onOptionChange({
            panel: 'uploads',
            id: 'upload',
        });

        await onImagesUpload(files);
    };

    const handleDragStart = (
        event: DragEvent<HTMLButtonElement>,
        image: EditorUploadedImage,
    ) => {
        event.dataTransfer.setData('application/modden-upload-image', image.id);
        event.dataTransfer.effectAllowed = 'copy';
    };

    const handleImageLoad = (
        event: SyntheticEvent<HTMLImageElement>,
        imageId: string,
    ) => {
        const image = event.currentTarget;

        if (!image.naturalWidth || !image.naturalHeight) {
            return;
        }

        const ratio = image.naturalWidth / image.naturalHeight;

        setImageRatios((currentRatios) => {
            if (currentRatios[imageId] === ratio) {
                return currentRatios;
            }

            return {
                ...currentRatios,
                [imageId]: ratio,
            };
        });
    };

    const handleImageDelete = async (
        event: MouseEvent<HTMLSpanElement>,
        imageId: string,
    ) => {
        event.preventDefault();
        event.stopPropagation();

        setDeletingImageIds((currentIds) => [...currentIds, imageId]);

        try {
            await onImageDelete(imageId);

            setImageRatios((currentRatios) => {
                const nextRatios = { ...currentRatios };
                delete nextRatios[imageId];

                return nextRatios;
            });
        } finally {
            setDeletingImageIds((currentIds) =>
                currentIds.filter((id) => id !== imageId),
            );
        }
    };
    const renderUploadButton = () => (
    <label
        className={
            hasUploadedImages
                ? 'editor-uploads-panel__add'
                : `editor-uploads-panel__main ${
                      isActive ? 'editor-uploads-panel__main--active' : ''
                  }`
        }
    >
        <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            disabled={isUploadingImages}
            onChange={handleFilesChange}
        />

        <span
            className={
                hasUploadedImages
                    ? 'editor-uploads-panel__upload-frame editor-uploads-panel__upload-frame--small'
                    : 'editor-uploads-panel__upload-frame editor-uploads-panel__upload-frame--large'
            }
        >
            <svg
                className="editor-uploads-panel__upload-border"
                viewBox="0 0 300 300"
                aria-hidden="true"
            >
                <rect
                    x="1.5"
                    y="1.5"
                    width="297"
                    height="297"
                    rx="21"
                    ry="21"
                />
            </svg>

            {isUploadingImages ? (
                <span className="editor-uploads-panel__upload-loading">
                    ...
                </span>
            ) : (
                <img
                    className="editor-uploads-panel__upload-icon"
                    src={customPlusIcon}
                    alt=""
                    aria-hidden="true"
                />
            )}

            {!hasUploadedImages && <strong>Upload image</strong>}
        </span>
    </label>
);

    const renderImage = (image: EditorUploadedImage) => {
        const isDeleting = deletingImageIds.includes(image.id);

        return (
            <button
                key={image.id}
                className={`editor-uploads-panel__thumb ${
                    isDeleting ? 'editor-uploads-panel__thumb--deleting' : ''
                }`}
                type="button"
                draggable={!isDeleting}
                style={{
                    height: getTileHeight(image.id, imageRatios),
                }}
                onDragStart={(event) => handleDragStart(event, image)}
                onDoubleClick={() => {
                    if (!isDeleting) {
                        void onImagePlace(image);
                    }
                }}
                title={image.fileName}
                disabled={isDeleting}
            >
                <span className="editor-uploads-panel__image-wrap">
    <img
        src={image.src}
        alt={image.fileName}
        onLoad={(event) => handleImageLoad(event, image.id)}
    />

    <span
        className="editor-uploads-panel__delete"
        role="button"
        tabIndex={0}
        aria-label="Delete uploaded image"
        onClick={(event) => void handleImageDelete(event, image.id)}
        onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                void handleImageDelete(event as never, image.id);
            }
        }}
    >
        {isDeleting ? '...' : '×'}
    </span>
</span>
            </button>
        );
    };

    return (
        <div className="editor-uploads-panel">
            <h3>Uploads</h3>

            {hasUploadedImages && (
                <p className="editor-uploads-panel__hint">
                    Drag an image to the canvas or double-click to add it
                </p>
            )}

            {!hasUploadedImages ? (
                <div className="editor-uploads-panel__empty">
                    {renderUploadButton()}
                </div>
            ) : (
                <div
                    className={`editor-uploads-panel__masonry ${
                        isScrolling
                            ? 'editor-uploads-panel__masonry--scrolling'
                            : ''
                    }`}
                    onScroll={handleMasonryScroll}
                >
                    <div className="editor-uploads-panel__column">
                        {renderUploadButton()}
                        {imageColumns[0].map(renderImage)}
                    </div>

                    <div className="editor-uploads-panel__column">
                        {imageColumns[1].map(renderImage)}
                    </div>
                </div>
            )}
        </div>
    );
}
