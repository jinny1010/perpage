import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sub, favoritesOnly } = req.query;

  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  try {
    const filter = {
      and: []
    };

    if (sub) {
      filter.and.push({
        property: 'sub',
        rich_text: { equals: sub }
      });
    }

    if (favoritesOnly === 'true') {
      filter.and.push({
        property: '즐겨찾기',
        checkbox: { equals: true }
      });
    }

    const response = await notion.databases.query({
      database_id: process.env.NOTION_GALLERY_DB_ID,
      filter: filter.and.length > 0 ? filter : undefined,
      sorts: [{ property: '생성일', direction: 'descending' }]
    });

    const gallery = response.results.map(page => {
      const props = page.properties;
      const name = props['이름']?.title?.[0]?.plain_text || '';
      const subValue = props['sub']?.rich_text?.[0]?.plain_text || '';
      const favorite = props['즐겨찾기']?.checkbox || false;
      const tags = props['태그']?.multi_select?.map(t => t.name) || [];
      const imageFile = props['파일과 미디어']?.files?.[0];
      const imageUrl = imageFile?.file?.url || imageFile?.external?.url || null;
      const createdAt = props['생성일']?.created_time || page.created_time;

      return {
        id: page.id,
        name,
        sub: subValue,
        favorite,
        tags,
        imageUrl,
        createdAt
      };
    });

    res.status(200).json({ gallery });
  } catch (error) {
    console.error('Gallery API Error:', error);
    res.status(500).json({ error: 'Failed to fetch gallery', message: error.message });
  }
}
