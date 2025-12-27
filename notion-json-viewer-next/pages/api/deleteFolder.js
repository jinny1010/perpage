import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pageId } = req.query;

  if (!pageId) {
    return res.status(400).json({ error: 'pageId is required' });
  }

  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  try {
    await notion.pages.update({
      page_id: pageId,
      archived: true,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({ error: 'Failed to delete folder', message: error.message });
  }
}
