import { Client } from '@notionhq/client';
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pageId, messageIndex } = req.body;

  if (!pageId || messageIndex === undefined) {
    return res.status(400).json({ error: 'pageId and messageIndex are required' });
  }

  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  try {
    // 1. 페이지에서 현재 파일 URL 가져오기
    const page = await notion.pages.retrieve({ page_id: pageId });
    
    const fileProperty = page.properties['jsonFile'];
    if (!fileProperty || !fileProperty.files || fileProperty.files.length === 0) {
      return res.status(404).json({ error: 'No file found' });
    }

    const file = fileProperty.files[0];
    const fileUrl = file.file?.url || file.external?.url;
    const fileName = file.name || 'chat.jsonl';

    if (!fileUrl) {
      return res.status(404).json({ error: 'File URL not found' });
    }

    // 2. 파일 내용 가져오기
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`);
    }

    const text = await response.text();
    
    // 3. JSONL 파싱
    const lines = text.trim().split('\n');
    const messages = lines.map(line => JSON.parse(line));

    // 4. 해당 메시지 삭제
    if (messageIndex < 0 || messageIndex >= messages.length) {
      return res.status(400).json({ error: 'Invalid message index' });
    }

    messages.splice(messageIndex, 1);

    // 5. 새 JSONL 생성
    const newContent = messages.map(msg => JSON.stringify(msg)).join('\n');

    // 6. Blob에 새 파일 업로드
    const blob = await put(`updated_${Date.now()}_${fileName}`, newContent, {
      access: 'public',
      contentType: 'application/json',
    });

    // 7. 노션 페이지 업데이트 (새 파일 URL로)
    await notion.pages.update({
      page_id: pageId,
      properties: {
        'jsonFile': {
          files: [{
            name: fileName,
            type: 'external',
            external: { url: blob.url },
          }],
        },
      },
    });

    res.status(200).json({ 
      success: true,
      message: '메시지가 삭제되었습니다.',
      newFileUrl: blob.url,
    });

  } catch (error) {
    console.error('Delete Message Error:', error);
    res.status(500).json({ 
      error: 'Failed to delete message',
      message: error.message 
    });
  }
}
