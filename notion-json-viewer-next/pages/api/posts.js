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
      database_id: process.env.NOTION_DATABASE_ID,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    });

    const posts = [];

    for (const page of response.results) {
      const props = page.properties;
      
      // "이름" 속성 (Title 타입) = 제목
      const titleProperty = props['이름'];
      const title = titleProperty?.title?.[0]?.plain_text || '제목 없음';
      
      // sub (폴더)
      const subProperty = props['sub'];
      const postSub = subProperty?.rich_text?.[0]?.plain_text || '미분류';
      
      // sub 필터
      if (sub && postSub !== sub) continue;
      
      // jsonFile 있는지 확인
      const fileProperty = props['jsonFile'];
      const hasFile = fileProperty?.files?.length > 0;
      
      if (hasFile) {
        posts.push({
          id: page.id,
          sub: postSub,
          title,
          createdAt: page.created_time,
        });
      }
    }

    // sub 파라미터가 없으면 폴더별로 그룹화
    if (!sub) {
      const grouped = {};
      for (const post of posts) {
        if (!grouped[post.sub]) {
          grouped[post.sub] = [];
        }
        grouped[post.sub].push(post);
      }
      return res.status(200).json({ posts, grouped });
    }

    res.status(200).json({ posts });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch posts',
      message: error.message 
    });
  }
}
