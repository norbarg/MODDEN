// src/features/editor/export/exportEditorScene.ts
import { StaticCanvas } from 'fabric';
import type { WorkspaceProject } from '../../../shared/types/workspace';
import type { EditorScene } from '../model/editorTypes';
import { createCanvasObject } from '../ui/canvas/canvasObjects';

export type EditorExportFormat =
    | 'png'
    | 'png-transparent'
    | 'jpg'
    | 'webp'
    | 'pdf';

type ExportEditorSceneOptions = {
    project: WorkspaceProject;
    scene: EditorScene;
    format: EditorExportFormat;
};

function sanitizeFileName(value: string) {
    return value
        .trim()
        .replace(/[\\/:*?"<>|]/g, '-')
        .replace(/\s+/g, '-')
        .toLowerCase();
}

function downloadDataUrl(dataUrl: string, fileName: string) {
    const link = document.createElement('a');

    link.href = dataUrl;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();
}

async function createExportCanvas(
    project: WorkspaceProject,
    scene: EditorScene,
    transparentBackground = false,
) {
    const canvasElement = document.createElement('canvas');

const canvas = new StaticCanvas(canvasElement, {
    width: project.canvasWidth,
    height: project.canvasHeight,
    backgroundColor: transparentBackground ? undefined : scene.background.color,
    preserveObjectStacking: true,
    enableRetinaScaling: false,
});

    const canvasObjects = await Promise.all(
        scene.objects.map((object) => createCanvasObject(object)),
    );

    canvasObjects.forEach((object) => {
        object.set({
            selectable: false,
            evented: false,
            hasControls: false,
            hasBorders: false,
        });

        canvas.add(object);
    });

    canvas.renderAll();

    return canvas;
}

function getImageExportOptions(format: EditorExportFormat) {
    if (format === 'jpg') {
        return {
            fabricFormat: 'jpeg',
            extension: 'jpg',
            quality: 0.95,
        };
    }

    if (format === 'webp') {
        return {
            fabricFormat: 'webp',
            extension: 'webp',
            quality: 0.95,
        };
    }

    return {
        fabricFormat: 'png',
        extension: 'png',
        quality: 1,
    };
}

export async function exportEditorScene({
    project,
    scene,
    format,
}: ExportEditorSceneOptions) {
    const isTransparentPng = format === 'png-transparent';

const canvas = await createExportCanvas(project, scene, isTransparentPng);
    const safeTitle = sanitizeFileName(project.title || 'modden-project');

    try {
        if (format === 'pdf') {
            const dataUrl = canvas.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: 2,
            });

            const { jsPDF } = await import('jspdf');

            const orientation =
                project.canvasWidth > project.canvasHeight
                    ? 'landscape'
                    : 'portrait';

            const pdf = new jsPDF({
                orientation,
                unit: 'px',
                format: [project.canvasWidth, project.canvasHeight],
                compress: true,
            });

            pdf.addImage(
                dataUrl,
                'PNG',
                0,
                0,
                project.canvasWidth,
                project.canvasHeight,
            );

            pdf.save(`${safeTitle}.pdf`);
            return;
        }

        const { fabricFormat, extension, quality } =
            getImageExportOptions(format);

        const dataUrl = canvas.toDataURL({
            format: fabricFormat as never,
            quality,
            multiplier: 2,
        });

        downloadDataUrl(dataUrl, `${safeTitle}.${extension}`);
    } finally {
        void canvas.dispose();
    }
}
