import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pageId, favorite } = req.body;

  if (!pageId) {
    return res.status(400).json({ error: 'pageId is required' });
  }

  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        '즐겨찾기': {
          checkbox: favorite
        }
      }
    });

    res.status(200).json({ success: true, favorite });
  } catch (error) {
    console.error('Toggle Favorite Error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite', message: error.message });
  }
}
