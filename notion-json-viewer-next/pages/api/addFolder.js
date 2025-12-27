import { Client } from '@notionhq/client';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Form parse error', message: err.message });
    }

    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
    const color = Array.isArray(fields.color) ? fields.color[0] : fields.color || '#8B0000';

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const notion = new Client({
      auth: process.env.NOTION_TOKEN,
    });

    try {
      await notion.pages.create({
        parent: { database_id: process.env.NOTION_FOLDERS_DB_ID },
        properties: {
          '이름': {
            title: [{ text: { content: name } }],
          },
          'sub': {
            rich_text: [{ text: { content: name } }],
          },
          'color': {
            rich_text: [{ text: { content: color } }],
          },
        },
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Notion API Error:', error);
      res.status(500).json({ error: 'Failed to add folder', message: error.message });
    }
  });
}
