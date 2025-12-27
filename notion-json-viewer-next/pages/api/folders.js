import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  try {
    // 1. 목록 DB에서 폴더 정보 가져오기
    const foldersResponse = await notion.databases.query({
      database_id: process.env.NOTION_FOLDERS_DB_ID,
    });

    const folderMap = {};
    for (const page of foldersResponse.results) {
      const props = page.properties;
      
      // 이름 (sub 이름)
      const nameProperty = props['이름'];
      const name = nameProperty?.title?.[0]?.plain_text || '';
      
      // sub
      const subProperty = props['sub'];
      const sub = subProperty?.rich_text?.[0]?.plain_text || name;
      
      // 이미지
      const imageProperty = props['파일과 미디어'];
      const imageUrl = imageProperty?.files?.[0]?.file?.url || imageProperty?.files?.[0]?.external?.url || null;

      if (sub) {
        folderMap[sub] = {
          name: sub,
          imageUrl,
          count: 0,
        };
      }
    }

    // 2. 게시글 DB에서 각 폴더의 게시글 수 카운트
    const postsResponse = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
    });

    for (const page of postsResponse.results) {
      const props = page.properties;
      const subProperty = props['sub'];
      const sub = subProperty?.rich_text?.[0]?.plain_text || '미분류';
      
      const fileProperty = props['jsonFile'];
      const hasFile = fileProperty?.files?.length > 0;
      
      if (hasFile) {
        if (folderMap[sub]) {
          folderMap[sub].count++;
        } else {
          folderMap[sub] = {
            name: sub,
            imageUrl: null,
            count: 1,
          };
        }
      }
    }

    const folders = Object.values(folderMap)
      .filter(f => f.count > 0 || f.imageUrl)
      .sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json({ folders });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch folders',
      message: error.message 
    });
  }
}
