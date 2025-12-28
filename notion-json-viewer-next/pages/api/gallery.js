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
    const filter = sub ? {
      property: 'sub',
      rich_text: { equals: sub }
    } : undefined;

    const response = await notion.databases.query({
      database_id: process.env.NOTION_GALLERY_DB_ID,
      filter
    });

    const gallery = response.results.map(page => {
      const props = page.properties;
      const name = props['이름']?.title?.[0]?.plain_text || '';
      const subValue = props['sub']?.rich_text?.[0]?.plain_text || '';
      const favorite = props['즐겨찾기']?.checkbox || false;
      const file = props['파일과 미디어']?.files?.[0];
      let fileUrl = file?.file?.url || file?.external?.url || null;
      const fileName = file?.name || '';
      const isZip = fileName.toLowerCase().endsWith('.zip');

      // Google Drive URL 변환
      if (fileUrl && fileUrl.includes('drive.google.com/file/d/')) {
        const match = fileUrl.match(/\/d\/([^\/]+)/);
        if (match) {
          fileUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
        }
      }

      return {
        id: page.id,
        name,
        sub: subValue,
        favorite,
        fileUrl,
        fileName,
        isZip
      };
    });

    res.status(200).json({ gallery });
  } catch (error) {
    console.error('Gallery API Error:', error);
    res.status(500).json({ error: 'Failed to fetch gallery', message: error.message });
  }
}
