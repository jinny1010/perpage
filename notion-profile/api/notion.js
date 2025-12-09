const { Client } = require('@notionhq/client');

// 노션 클라이언트 초기화
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// 데이터베이스 ID들
const DB_IDS = {
  profiles: process.env.NOTION_PROFILES_DB,
  posts: process.env.NOTION_POSTS_DB,
  memory: process.env.NOTION_MEMORY_DB,
  bgm: process.env.NOTION_BGM_DB,
};

// 프로필 데이터 가져오기
async function getProfiles() {
  const response = await notion.databases.query({
    database_id: DB_IDS.profiles,
    sorts: [{ property: 'order', direction: 'ascending' }],
  });

  return response.results.map((page) => {
    const props = page.properties;
    return {
      id: page.id,
      bigImg: getFileUrl(props.bigImg),
      topCircle: getFileUrl(props.topCircle),
      smallImg: getFileUrl(props.smallImg),
      gothicTitle: getRichText(props.gothicTitle),
      gothicSub: getRichText(props.gothicSub),
      pillText: getRichText(props.pillText),
      charDesc: getRichText(props.charDesc),
      charType: getRichText(props.charType),
      charElement: getRichText(props.charElement),
      charOrigin: getRichText(props.charOrigin),
      shapeColor: getRichText(props.shapeColor) || '#ffffff',
      isFlipped: props.isFlipped?.checkbox || false,
    };
  });
}

// 게시글 데이터 가져오기
async function getPosts() {
  const response = await notion.databases.query({
    database_id: DB_IDS.posts,
    sorts: [{ property: 'date', direction: 'descending' }],
  });

  return response.results.map((page) => {
    const props = page.properties;
    return {
      id: page.id,
      title: getTitle(props.title),
      date: props.date?.date?.start || '',
      image: getFileUrl(props.image),
      preview: getRichText(props.preview),
      body: getRichText(props.body),
      tags: props.tags?.multi_select?.map((tag) => tag.name) || [],
      likes: props.likes?.number || 0,
      comments: props.comments?.number || 0,
      profileId: props.profileId?.relation?.[0]?.id || null,
    };
  });
}

// 메모리(갤러리) 데이터 가져오기
async function getMemory() {
  const response = await notion.databases.query({
    database_id: DB_IDS.memory,
    sorts: [{ property: 'order', direction: 'ascending' }],
  });

  return response.results.map((page) => {
    const props = page.properties;
    return {
      id: page.id,
      image: getFileUrl(props.image),
      caption: getRichText(props.caption),
    };
  });
}

// BGM 데이터 가져오기
async function getBgm() {
  const response = await notion.databases.query({
    database_id: DB_IDS.bgm,
    sorts: [{ property: 'order', direction: 'ascending' }],
  });

  return response.results.map((page) => {
    const props = page.properties;
    return {
      id: page.id,
      title: getTitle(props.title),
      artist: getRichText(props.artist),
      url: getFileUrl(props.url) || getRichText(props.urlText),
      profileId: props.profileId?.relation?.[0]?.id || null,
    };
  });
}

// 헬퍼 함수들
function getTitle(prop) {
  return prop?.title?.[0]?.plain_text || '';
}

function getRichText(prop) {
  return prop?.rich_text?.[0]?.plain_text || '';
}

function getFileUrl(prop) {
  if (!prop) return '';
  
  // Files & media 타입
  if (prop.files && prop.files.length > 0) {
    const file = prop.files[0];
    if (file.type === 'file') {
      return file.file.url;
    } else if (file.type === 'external') {
      return file.external.url;
    }
  }
  
  // URL 타입
  if (prop.url) {
    return prop.url;
  }
  
  return '';
}

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { type } = req.query;

    let data;

    switch (type) {
      case 'profiles':
        data = await getProfiles();
        break;
      case 'posts':
        data = await getPosts();
        break;
      case 'memory':
        data = await getMemory();
        break;
      case 'bgm':
        data = await getBgm();
        break;
      case 'all':
      default:
        data = {
          profiles: await getProfiles(),
          posts: await getPosts(),
          memory: await getMemory(),
          bgm: await getBgm(),
        };
        break;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data from Notion',
      message: error.message 
    });
  }
};
