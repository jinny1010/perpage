import { Client } from '@notionhq/client';
import { put } from '@vercel/blob';
import { IncomingForm } from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  try {
    const form = new IncomingForm();
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
    const sub = Array.isArray(fields.sub) ? fields.sub[0] : fields.sub;
    const tags = Array.isArray(fields.tags) ? fields.tags[0] : fields.tags;
    const imageFile = files.image?.[0] || files.image;

    if (!sub || !imageFile) {
      return res.status(400).json({ error: 'Sub and image are required' });
    }

    // 이미지 업로드
    const fileBuffer = fs.readFileSync(imageFile.filepath);
    const fileName = `gallery_${Date.now()}_${imageFile.originalFilename}`;
    const blob = await put(fileName, fileBuffer, {
      access: 'public',
      contentType: imageFile.mimetype
    });

    // Notion에 저장
    const properties = {
      '이름': {
        title: [{ text: { content: name || '' } }]
      },
      'sub': {
        rich_text: [{ text: { content: sub } }]
      },
      '즐겨찾기': {
        checkbox: false
      },
      '파일과 미디어': {
        files: [{
          type: 'external',
          name: imageFile.originalFilename,
          external: { url: blob.url }
        }]
      }
    };

    if (tags) {
      properties['태그'] = {
        multi_select: tags.split(',').map(t => ({ name: t.trim() }))
      };
    }

    const page = await notion.pages.create({
      parent: { database_id: process.env.NOTION_GALLERY_DB_ID },
      properties
    });

    res.status(200).json({ 
      success: true, 
      item: {
        id: page.id,
        name,
        sub,
        imageUrl: blob.url,
        favorite: false
      }
    });
  } catch (error) {
    console.error('Add Gallery Error:', error);
    res.status(500).json({ error: 'Failed to add gallery item', message: error.message });
  }
}
