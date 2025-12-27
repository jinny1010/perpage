import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_BOOKMARK_DB_ID,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    });

    const bookmarks = response.results.map(page => {
      const props = page.properties;
      
      // text
      const textProp = props['text'];
      const text = textProp?.rich_text?.[0]?.plain_text || '';
      
      // sourceTitle
      const sourceProp = props['sourceTitle'];
      const sourceTitle = sourceProp?.rich_text?.[0]?.plain_text || '';
      
      // image
      const imageProp = props['image'];
      const imageUrl = imageProp?.files?.[0]?.file?.url || imageProp?.files?.[0]?.external?.url || null;

      return {
        id: page.id,
        text,
        sourceTitle,
        imageUrl,
        createdAt: page.created_time,
      };
    });

    res.status(200).json({ bookmarks });
  } catch (error) {
    console.error('Bookmarks Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bookmarks',
      message: error.message 
    });
  }
}
