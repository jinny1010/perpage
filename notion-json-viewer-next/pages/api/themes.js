import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sub } = req.query;

  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_THEMES_DB_ID,
      filter: sub ? {
        property: 'sub',
        rich_text: { equals: sub }
      } : undefined
    });

    const themes = response.results.map(page => {
      const props = page.properties;
      const name = props['이름']?.title?.[0]?.plain_text || '';
      const subValue = props['sub']?.rich_text?.[0]?.plain_text || '';
      const cssFile = props['파일과 미디어']?.files?.[0];
      const cssUrl = cssFile?.file?.url || cssFile?.external?.url || null;

      return {
        id: page.id,
        name,
        sub: subValue,
        cssUrl
      };
    });

    res.status(200).json({ themes });
  } catch (error) {
    console.error('Themes API Error:', error);
    res.status(500).json({ error: 'Failed to fetch themes', message: error.message });
  }
}
