import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pageId, fileName } = req.query;
  
  // URL 디코딩
  const decodedFileName = fileName ? decodeURIComponent(fileName) : null;
  
  console.log('Request params:', { pageId, fileName, decodedFileName });

  if (!pageId) {
    return res.status(400).json({ error: 'pageId is required' });
  }

  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  try {
    // 페이지에서 최신 파일 URL 가져오기 (노션 파일 URL은 1시간 후 만료됨)
    const page = await notion.pages.retrieve({ page_id: pageId });
    
    let fileUrl = null;
    
    // 파일 속성에서 URL 찾기
    for (const [key, value] of Object.entries(page.properties)) {
      if (value.type === 'files' && value.files.length > 0) {
        for (const file of value.files) {
          const name = file.name || '';
          const url = file.file?.url || file.external?.url;
          
          // fileName이 있으면 매칭, 없으면 첫 번째 json 파일
          if (decodedFileName) {
            if (name === decodedFileName && url) {
              fileUrl = url;
              console.log('Found matching file:', name);
              break;
            }
          } else if ((name.endsWith('.json') || name.endsWith('.jsonl')) && url) {
            fileUrl = url;
            break;
          }
        }
        if (fileUrl) break;
      }
    }

    if (!fileUrl) {
      // 디버깅용: 어떤 속성들이 있는지 확인
      const props = Object.entries(page.properties).map(([key, value]) => ({
        name: key,
        type: value.type,
        hasFiles: value.type === 'files' ? value.files.length : 'N/A'
      }));
      return res.status(404).json({ 
        error: 'File not found',
        debug: { pageId, fileName, decodedFileName, properties: props }
      });
    }

    // 파일 내용 가져오기
    console.log('Fetching file from URL:', fileUrl.substring(0, 100) + '...');
    
    const response = await fetch(fileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fetch error response:', errorText.substring(0, 200));
      throw new Error(`Failed to fetch file: ${response.status}`);
    }

    const text = await response.text();
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(text);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch file content',
      message: error.message 
    });
  }
}
