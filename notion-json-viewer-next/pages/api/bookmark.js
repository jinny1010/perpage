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
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const text = Array.isArray(fields.text) ? fields.text[0] : fields.text;
    const sourceTitle = Array.isArray(fields.sourceTitle) ? fields.sourceTitle[0] : fields.sourceTitle;
    const sub = Array.isArray(fields.sub) ? fields.sub[0] : fields.sub;
    const imageFile = files.image ? (Array.isArray(files.image) ? files.image[0] : files.image) : null;
    const existingImageUrl = Array.isArray(fields.imageUrl) ? fields.imageUrl[0] : fields.imageUrl;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    let imageUrl = null;

    // 이미지 파일이 있으면 Blob에 업로드
    if (imageFile) {
      const fileBuffer = fs.readFileSync(imageFile.filepath);
      const fileName = `bookmark_${Date.now()}_${imageFile.originalFilename || 'image.jpg'}`;
      
      const blob = await put(fileName, fileBuffer, {
        access: 'public',
        contentType: imageFile.mimetype || 'image/jpeg',
      });
      
      imageUrl = blob.url;
    } else if (existingImageUrl) {
      // 갤러리에서 선택한 URL 사용
      imageUrl = existingImageUrl;
    }

    // 노션 책갈피 DB에 저장
    const properties = {
      '이름': {
        title: [{ text: { content: text.substring(0, 50) + (text.length > 50 ? '...' : '') } }],
      },
      'text': {
        rich_text: [{ text: { content: text } }],
      },
      'sourceTitle': {
        rich_text: [{ text: { content: sourceTitle || '' } }],
      },
      'sub': {
        rich_text: [{ text: { content: sub || '' } }],
      },
    };

    // 이미지 URL이 있으면 추가
    if (imageUrl) {
      properties['image'] = {
        files: [{
          name: 'bookmark_image',
          type: 'external',
          external: { url: imageUrl },
        }],
      };
    }

    const page = await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_BOOKMARK_DB_ID,
      },
      properties,
    });

    res.status(200).json({ 
      success: true, 
      pageId: page.id,
      imageUrl,
    });

  } catch (error) {
    console.error('Bookmark Error:', error);
    res.status(500).json({ 
      error: 'Failed to save bookmark',
      message: error.message 
    });
  }
}
