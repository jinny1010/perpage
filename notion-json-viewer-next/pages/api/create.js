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
      maxFileSize: 50 * 1024 * 1024, // 50MB
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const sub = Array.isArray(fields.sub) ? fields.sub[0] : fields.sub;
    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!sub || !title || !file) {
      return res.status(400).json({ error: 'sub, title, file are required' });
    }

    // 파일을 Vercel Blob에 업로드
    const fileBuffer = fs.readFileSync(file.filepath);
    const fileName = file.originalFilename || 'chat.jsonl';
    
    const blob = await put(fileName, fileBuffer, {
      access: 'public',
      contentType: 'application/json',
    });

    // 노션 페이지 생성 (external file URL 사용)
    const page = await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_DATABASE_ID,
      },
      properties: {
        '이름': {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
        'sub': {
          rich_text: [
            {
              text: {
                content: sub,
              },
            },
          ],
        },
        'title': {
          rich_text: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
        'jsonFile': {
          files: [
            {
              name: fileName,
              type: 'external',
              external: {
                url: blob.url,
              },
            },
          ],
        },
      },
    });

    res.status(200).json({ 
      success: true, 
      pageId: page.id,
      fileUrl: blob.url,
    });

  } catch (error) {
    console.error('Create Error:', error);
    res.status(500).json({ 
      error: 'Failed to create post',
      message: error.message 
    });
  }
}
