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
      database_id: process.env.NOTION_DATABASE_ID,
    });

    const files = [];

    for (const page of response.results) {
      // 페이지 속성에서 파일 찾기
      for (const [key, value] of Object.entries(page.properties)) {
        if (value.type === 'files' && value.files.length > 0) {
          for (const file of value.files) {
            const fileName = file.name || 'unknown';
            const fileUrl = file.file?.url || file.external?.url;

            if (fileName.endsWith('.json') || fileName.endsWith('.jsonl')) {
              files.push({
                id: `${page.id}-${fileName}`,
                name: fileName,
                url: fileUrl,
                pageId: page.id,
              });
            }
          }
        }
      }

      // Title 속성에서 이름 가져오기 (선택사항)
      const titleProp = Object.values(page.properties).find(p => p.type === 'title');
      if (titleProp && titleProp.title.length > 0) {
        const lastFile = files[files.length - 1];
        if (lastFile && lastFile.pageId === page.id) {
          lastFile.title = titleProp.title[0].plain_text;
        }
      }
    }

    res.status(200).json({ files });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch files',
      message: error.message 
    });
  }
}
