import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  try {
    const { sub, title } = req.body;

    if (!sub || !title) {
      return res.status(400).json({ error: 'sub, title are required' });
    }

    // 노션 페이지 생성 (파일 없이)
    const page = await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_DATABASE_ID,
      },
      properties: {
        '이름': {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
        'sub': {
          rich_text: [
            {
              text: {
                content: sub,
              },
            },
          ],
        },
      },
    });

    // 노션 페이지 URL 생성
    const notionUrl = `https://notion.so/${page.id.replace(/-/g, '')}`;

    res.status(200).json({ 
      success: true, 
      pageId: page.id,
      notionUrl,
      message: '등록 완료! 노션에서 jsonFile에 파일을 직접 업로드해주세요.'
    });

  } catch (error) {
    console.error('Create Error:', error);
    res.status(500).json({ 
      error: 'Failed to create post',
      message: error.message 
    });
  }
}
