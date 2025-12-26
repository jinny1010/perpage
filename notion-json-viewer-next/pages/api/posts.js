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
      sorts: [
        { property: 'sub', direction: 'ascending' },
        { property: 'title', direction: 'ascending' }
      ]
    });

    const posts = [];

    for (const page of response.results) {
      const props = page.properties;
      
      // 이름 (title 타입)
      const nameProperty = props['이름'];
      const name = nameProperty?.title?.[0]?.plain_text || '';
      
      // sub (폴더)
      const subProperty = props['sub'];
      const sub = subProperty?.rich_text?.[0]?.plain_text || '미분류';
      
      // title (제목)
      const titleProperty = props['title'];
      const title = titleProperty?.rich_text?.[0]?.plain_text || name || '제목 없음';
      
      // jsonFile 있는지 확인
      const fileProperty = props['jsonFile'];
      const hasFile = fileProperty?.files?.length > 0;
      
      if (hasFile) {
        posts.push({
          id: page.id,
          name,
          sub,
          title,
          createdAt: page.created_time,
        });
      }
    }

    // 폴더별로 그룹화
    const grouped = {};
    for (const post of posts) {
      if (!grouped[post.sub]) {
        grouped[post.sub] = [];
      }
      grouped[post.sub].push(post);
    }

    res.status(200).json({ posts, grouped });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch posts',
      message: error.message 
    });
  }
}
