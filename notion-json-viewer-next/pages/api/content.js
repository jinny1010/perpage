import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pageId } = req.query;

  if (!pageId) {
    return res.status(400).json({ error: 'pageId is required' });
  }

  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  try {
    const page = await notion.pages.retrieve({ page_id: pageId });
    
    // jsonFile 속성에서 파일 URL 가져오기
    const fileProperty = page.properties['jsonFile'];
    
    if (!fileProperty || !fileProperty.files || fileProperty.files.length === 0) {
      return res.status(404).json({ error: 'No file found' });
    }

    const file = fileProperty.files[0];
    const fileUrl = file.file?.url || file.external?.url;

    if (!fileUrl) {
      return res.status(404).json({ error: 'File URL not found' });
    }

    // 파일 내용 가져오기
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`);
    }

    const text = await response.text();
    
    // JSONL 파싱
    let messages;
    try {
      const lines = text.trim().split('\n');
      messages = lines.map(line => JSON.parse(line));
    } catch {
      // 일반 JSON 시도
      const json = JSON.parse(text);
      messages = Array.isArray(json) ? json : [json];
    }

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Content API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch content',
      message: error.message 
    });
  }
}
