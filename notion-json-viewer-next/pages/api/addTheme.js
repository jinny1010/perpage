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
    const cssFile = files.cssFile?.[0] || files.cssFile;

    if (!name || !sub) {
      return res.status(400).json({ error: 'Name and sub are required' });
    }

    let cssUrl = null;

    // CSS 파일 업로드
    if (cssFile) {
      const fileBuffer = fs.readFileSync(cssFile.filepath);
      const fileName = `theme_${Date.now()}_${cssFile.originalFilename}`;
      const blob = await put(fileName, fileBuffer, {
        access: 'public',
        contentType: 'text/css'
      });
      cssUrl = blob.url;
    }

    // Notion에 저장
    const properties = {
      '이름': {
        title: [{ text: { content: name } }]
      },
      'sub': {
        rich_text: [{ text: { content: sub } }]
      }
    };

    if (cssUrl) {
      properties['파일과 미디어'] = {
        files: [{
          type: 'external',
          name: `${name}.css`,
          external: { url: cssUrl }
        }]
      };
    }

    const page = await notion.pages.create({
      parent: { database_id: process.env.NOTION_THEMES_DB_ID },
      properties
    });

    res.status(200).json({ 
      success: true, 
      theme: {
        id: page.id,
        name,
        sub,
        cssUrl
      }
    });
  } catch (error) {
    console.error('Add Theme Error:', error);
    res.status(500).json({ error: 'Failed to add theme', message: error.message });
  }
}
