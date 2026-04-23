import 'dotenv/config';
import { PrismaClient, TemplateCategory } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const templates = [
    {
      title: 'Empty Poster',
      category: TemplateCategory.POSTERS,
      canvasWidth: 1080,
      canvasHeight: 1350,
      isSystem: true,
      isPublic: false,
      sceneJson: {
        background: '#ffffff',
        elements: [],
      },
      thumbnailUrl: null,
    },
    {
      title: 'Empty Banner',
      category: TemplateCategory.BANNERS,
      canvasWidth: 1200,
      canvasHeight: 628,
      isSystem: true,
      isPublic: false,
      sceneJson: {
        background: '#ffffff',
        elements: [],
      },
      thumbnailUrl: null,
    },
    {
      title: 'Empty Logo',
      category: TemplateCategory.LOGOS,
      canvasWidth: 500,
      canvasHeight: 500,
      isSystem: true,
      isPublic: false,
      sceneJson: {
        background: '#ffffff',
        elements: [],
      },
      thumbnailUrl: null,
    },
    {
      title: 'Empty Social Media',
      category: TemplateCategory.SOCIAL_MEDIA,
      canvasWidth: 1080,
      canvasHeight: 1080,
      isSystem: true,
      isPublic: false,
      sceneJson: {
        background: '#ffffff',
        elements: [],
      },
      thumbnailUrl: null,
    },
    {
      title: 'Empty Infographic',
      category: TemplateCategory.INFOGRAPHICS,
      canvasWidth: 800,
      canvasHeight: 2000,
      isSystem: true,
      isPublic: false,
      sceneJson: {
        background: '#ffffff',
        elements: [],
      },
      thumbnailUrl: null,
    },
    {
      title: 'Empty Book Cover',
      category: TemplateCategory.BOOK_COVERS,
      canvasWidth: 1600,
      canvasHeight: 2560,
      isSystem: true,
      isPublic: false,
      sceneJson: {
        background: '#ffffff',
        elements: [],
      },
      thumbnailUrl: null,
    },
    {
      title: 'Empty Menu',
      category: TemplateCategory.MENUS,
      canvasWidth: 1080,
      canvasHeight: 1920,
      isSystem: true,
      isPublic: false,
      sceneJson: {
        background: '#ffffff',
        elements: [],
      },
      thumbnailUrl: null,
    },
    {
      title: 'Empty Wallpaper',
      category: TemplateCategory.WALLPAPERS,
      canvasWidth: 1920,
      canvasHeight: 1080,
      isSystem: true,
      isPublic: false,
      sceneJson: {
        background: '#ffffff',
        elements: [],
      },
      thumbnailUrl: null,
    },
    {
      title: 'Custom Size',
      category: TemplateCategory.CUSTOM_SIZE,
      canvasWidth: 1000,
      canvasHeight: 1000,
      isSystem: true,
      isPublic: false,
      sceneJson: {
        background: '#ffffff',
        elements: [],
      },
      thumbnailUrl: null,
    },
    {
      title: 'Modern Poster',
      category: TemplateCategory.POSTERS,
      canvasWidth: 1080,
      canvasHeight: 1350,
      isSystem: true,
      isPublic: false,
      sceneJson: {
        background: '#f5f5f5',
        elements: [
          {
            id: 'title-1',
            type: 'text',
            x: 100,
            y: 120,
            text: 'Modern Poster',
            fontSize: 48,
            color: '#111111',
          },
          {
            id: 'shape-1',
            type: 'rectangle',
            x: 80,
            y: 250,
            width: 920,
            height: 400,
            color: '#d9d9d9',
          },
        ],
      },
      thumbnailUrl: null,
    },
    {
      title: 'Sale Banner',
      category: TemplateCategory.BANNERS,
      canvasWidth: 1200,
      canvasHeight: 628,
      isSystem: true,
      isPublic: false,
      sceneJson: {
        background: '#fff4e5',
        elements: [
          {
            id: 'title-1',
            type: 'text',
            x: 100,
            y: 100,
            text: 'Big Sale',
            fontSize: 56,
            color: '#ff6600',
          },
        ],
      },
      thumbnailUrl: null,
    },
  ];

  for (const template of templates) {
    const exists = await prisma.template.findFirst({
      where: {
        title: template.title,
        isSystem: true,
      },
    });

    if (!exists) {
      await prisma.template.create({
        data: template,
      });
    }
  }

  console.log('System templates seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
