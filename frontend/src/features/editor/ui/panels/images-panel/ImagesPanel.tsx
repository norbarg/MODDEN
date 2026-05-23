//src/features/editor/ui/panels/images-panel/ImagesPanel.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent, SyntheticEvent } from 'react';
import searchIcon from '../../../../../assets/workspace-sidebar/s.svg';
import type {
    EditorOption,
    EditorUploadedImage,
} from '../../../model/editorTypes';
import {
    stockImagesApi,
    type StockImage,
} from '../../../../../shared/api/stockImagesApi';
import '../uploads-panel/UploadsPanel.css';
import './ImagesPanel.css';

type ImagesPanelProps = {
    activeOption: EditorOption;
    onOptionChange: (option: EditorOption) => void;
    onImagePlace: (image: EditorUploadedImage) => Promise<void>;
};

type ImageRatios = Record<string, number>;

const COLUMN_COUNT = 2;
const TILE_GAP = 14;
const DEFAULT_TILE_HEIGHT = 128;
const STOCK_IMAGE_MIME = 'application/modden-stock-image';

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
    images: StockImage[],
    imageRatios: ImageRatios,
) {
    const columns: StockImage[][] = Array.from(
        { length: COLUMN_COUNT },
        () => [],
    );

    const columnHeights = Array.from({ length: COLUMN_COUNT }, () => 0);

    images.forEach((image) => {
        const shortestColumnIndex = columnHeights[0] <= columnHeights[1] ? 0 : 1;
        const imageId = getStockImageId(image);

        columns[shortestColumnIndex].push(image);
        columnHeights[shortestColumnIndex] +=
            getTileHeight(imageId, imageRatios) + TILE_GAP;
    });

    return columns;
}

function getStockImageId(image: StockImage) {
    return `stock-${image.id}`;
}

function toEditorImage(image: StockImage): EditorUploadedImage {
    return {
        id: getStockImageId(image),
        src: image.imageUrl || image.previewUrl || image.thumbnailUrl,
        fileName:
            image.alt ||
            `Photo by ${image.photographer.name}` ||
            'Stock image',
    };
}

export function ImagesPanel({
    activeOption,
    onOptionChange,
    onImagePlace,
}: ImagesPanelProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [appliedQuery, setAppliedQuery] = useState('');
    const [images, setImages] = useState<StockImage[]>([]);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [imageRatios, setImageRatios] = useState<ImageRatios>({});

    const searchTimerRef = useRef<number | null>(null);


    const isActive =
        activeOption?.panel === 'images' && activeOption.id === 'image';

    const imageColumns = useMemo(
        () => distributeImagesToColumns(images, imageRatios),
        [images, imageRatios],
    );

    useEffect(() => {
        if (searchTimerRef.current) {
            window.clearTimeout(searchTimerRef.current);
        }

        searchTimerRef.current = window.setTimeout(() => {
            setPage(1);
            setAppliedQuery(searchQuery.trim());
        }, 450);

        return () => {
            if (searchTimerRef.current) {
                window.clearTimeout(searchTimerRef.current);
            }
        };
    }, [searchQuery]);

    useEffect(() => {
        let isMounted = true;

        async function loadImages() {
            try {
                setIsLoading(true);

                const response = appliedQuery
                    ? await stockImagesApi.search({
                          query: appliedQuery,
                          page,
                          perPage: 20,
                      })
                    : await stockImagesApi.curated({
                          page,
                          perPage: 20,
                      });

                if (!isMounted) {
                    return;
                }

                setHasNextPage(response.hasNextPage);

                setImages((currentImages) =>
                    page === 1
                        ? response.items
                        : [...currentImages, ...response.items],
                );
            } catch (err) {
                console.error(err);

                if (isMounted && page === 1) {
                    setImages([]);
                    setHasNextPage(false);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadImages();

        return () => {
            isMounted = false;
        };
    }, [appliedQuery, page]);

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

    const handleDragStart = (
        event: DragEvent<HTMLButtonElement>,
        image: StockImage,
    ) => {
        const editorImage = toEditorImage(image);

        event.dataTransfer.setData(
            STOCK_IMAGE_MIME,
            JSON.stringify(editorImage),
        );
        event.dataTransfer.effectAllowed = 'copy';
    };

    const handleMasonryScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;

    const distanceToBottom =
        element.scrollHeight - element.scrollTop - element.clientHeight;

    if (distanceToBottom > 180) {
        return;
    }

    if (isLoading || !hasNextPage) {
        return;
    }

    setPage((currentPage) => currentPage + 1);
};

    const renderImage = (image: StockImage) => {
        const imageId = getStockImageId(image);
        const editorImage = toEditorImage(image);

        return (
            <button
                key={image.id}
                className="editor-uploads-panel__thumb"
                type="button"
                draggable
                style={{
                    height: getTileHeight(imageId, imageRatios),
                }}
                onClick={() =>
                    onOptionChange({
                        panel: 'images',
                        id: 'image',
                    })
                }
                onDragStart={(event) => handleDragStart(event, image)}
                onDoubleClick={() => {
                    void onImagePlace(editorImage);
                }}
                title={editorImage.fileName}
            >
                <span className="editor-uploads-panel__image-wrap">
                    <img
                        src={image.thumbnailUrl || image.previewUrl}
                        alt={image.alt ?? 'Stock image'}
                        loading="lazy"
                        onLoad={(event) => handleImageLoad(event, imageId)}
                    />
                </span>
            </button>
        );
    };

    return (
        <div className="editor-images-panel">
            <h3>Images</h3>
            <form
    className="editor-images-panel__search"
    onSubmit={(event) => {
        event.preventDefault();
        setPage(1);
        setAppliedQuery(searchQuery.trim());
    }}
>
    <img
        className="editor-images-panel__search-icon"
        src={searchIcon}
        alt=""
        aria-hidden="true"
    />

    <input
        type="search"
        placeholder="Search photos"
        value={searchQuery}
        onFocus={() =>
            onOptionChange({
                panel: 'images',
                id: 'image',
            })
        }
        onChange={(event) => setSearchQuery(event.target.value)}
    />
</form>

            <p className="editor-images-panel__hint">
                Search by theme or drag a photo to the canvas
            </p>

            {images.length === 0 && isLoading ? (
                <p className="editor-images-panel__state">Loading images...</p>
            ) : (
                <div
    className="editor-uploads-panel__masonry editor-images-panel__masonry"
    onScroll={handleMasonryScroll}
>
                    <div className="editor-uploads-panel__column">
                        {imageColumns[0].map(renderImage)}
                    </div>

                    <div className="editor-uploads-panel__column">
                        {imageColumns[1].map(renderImage)}
                    </div>

                    {images.length === 0 && !isLoading && (
                        <p className="editor-images-panel__state">
                            No images found
                        </p>
                    )}

{images.length > 0 && isLoading && (
    <p className="editor-images-panel__state">
        Loading more images...
    </p>
)}
                </div>
            )}

            {isActive && null}
        </div>
    );
}
