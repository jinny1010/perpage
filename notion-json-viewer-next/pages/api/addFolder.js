import { Client } from '@notionhq/client';
import { put } from '@vercel/blob';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024,
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
    const color = Array.isArray(fields.color) ? fields.color[0] : fields.color || '#8B0000';
    const imageFile = files.image ? (Array.isArray(files.image) ? files.image[0] : files.image) : null;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    let imageUrl = null;

    // 이미지가 있으면 Blob에 업로드
    if (imageFile) {
      const fileBuffer = fs.readFileSync(imageFile.filepath);
      const fileName = `folder_${Date.now()}_${imageFile.originalFilename || 'image.jpg'}`;
      
      const blob = await put(fileName, fileBuffer, {
        access: 'public',
        contentType: imageFile.mimetype || 'image/jpeg',
      });
      
      imageUrl = blob.url;
    }

    const properties = {
      '이름': {
        title: [{ text: { content: name } }],
      },
      'sub': {
        rich_text: [{ text: { content: name } }],
      },
      'color': {
        rich_text: [{ text: { content: color } }],
      },
    };

    // 이미지 URL이 있으면 추가
    if (imageUrl) {
      properties['파일과 미디어'] = {
        files: [{
          name: 'folder_image',
          type: 'external',
          external: { url: imageUrl },
        }],
      };
    }

    await notion.pages.create({
      parent: { database_id: process.env.NOTION_FOLDERS_DB_ID },
      properties,
    });

    res.status(200).json({ success: true, imageUrl });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({ error: 'Failed to add folder', message: error.message });
  }
}
