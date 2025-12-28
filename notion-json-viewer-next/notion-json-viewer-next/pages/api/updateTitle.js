import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pageId, title } = req.body;

  if (!pageId || !title) {
    return res.status(400).json({ error: 'pageId and title are required' });
  }

  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        '이름': {
          title: [{ text: { content: title } }]
        }
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Update Title Error:', error);
    res.status(500).json({ error: 'Failed to update title', message: error.message });
  }
}
