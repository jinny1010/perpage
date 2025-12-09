# Profile Page with Notion DB

노션 데이터베이스와 연동되는 프로필 페이지입니다.

## 🚀 배포 방법

### 1. GitHub에 업로드
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Vercel에 배포
1. [Vercel](https://vercel.com)에 로그인
2. "New Project" 클릭
3. GitHub 저장소 연결
4. Environment Variables 설정 (아래 참고)
5. Deploy!

---

## 📝 노션 데이터베이스 설정

### Step 1: 노션 Integration 생성
1. [Notion Integrations](https://www.notion.so/my-integrations) 접속
2. "New integration" 클릭
3. 이름 입력 후 생성
4. **Secret Key** 복사 → `NOTION_API_KEY`

### Step 2: 데이터베이스 생성 & 연결

각 데이터베이스를 노션에서 생성하고, 우측 상단 `...` → `Add connections` → 생성한 Integration 연결

---

## 📊 데이터베이스 스키마

### 1. Profiles DB (프로필)
| Property | Type | 설명 |
|----------|------|------|
| `order` | Number | 정렬 순서 (1, 2...) |
| `bigImg` | Files & media | 배경 이미지 |
| `topCircle` | Files & media | 원형 프로필 이미지 |
| `smallImg` | Files & media | 스왑용 작은 이미지 |
| `gothicTitle` | Rich text | 메인 타이틀 (고딕체) |
| `gothicSub` | Rich text | 서브 타이틀 |
| `pillText` | Rich text | 상단 태그 텍스트 (HTML 가능) |
| `charDesc` | Rich text | 캐릭터 설명 |
| `charType` | Rich text | 타입 |
| `charElement` | Rich text | 엘리먼트 |
| `charOrigin` | Rich text | 출신 |
| `shapeColor` | Rich text | 배경 색상 (#ffffff) |
| `isFlipped` | Checkbox | 좌우 반전 여부 |

### 2. Posts DB (게시글)
| Property | Type | 설명 |
|----------|------|------|
| `title` | Title | 게시글 제목 |
| `date` | Date | 작성일 |
| `image` | Files & media | 대표 이미지 |
| `preview` | Rich text | 미리보기 텍스트 |
| `body` | Rich text | 본문 내용 |
| `tags` | Multi-select | 태그들 |
| `likes` | Number | 좋아요 수 |
| `comments` | Number | 댓글 수 |
| `profileId` | Relation → Profiles | 연결된 프로필 |

### 3. Memory DB (갤러리)
| Property | Type | 설명 |
|----------|------|------|
| `order` | Number | 정렬 순서 |
| `image` | Files & media | 이미지 |
| `caption` | Rich text | 설명 (선택) |

### 4. BGM DB (배경음악)
| Property | Type | 설명 |
|----------|------|------|
| `title` | Title | 곡 제목 |
| `artist` | Rich text | 아티스트 |
| `url` | Files & media | 오디오 파일 |
| `urlText` | Rich text | 또는 외부 URL |
| `order` | Number | 정렬 순서 |
| `profileId` | Relation → Profiles | 연결된 프로필 |

---

## 🔧 환경 변수

Vercel 대시보드에서 설정:

```
NOTION_API_KEY=secret_xxxxx
NOTION_PROFILES_DB=xxxxx (32자)
NOTION_POSTS_DB=xxxxx
NOTION_MEMORY_DB=xxxxx
NOTION_BGM_DB=xxxxx
```

### DB ID 찾는 법
노션 데이터베이스 페이지 URL:
```
https://notion.so/workspace/[DATABASE_ID]?v=xxx
                            ^^^^^^^^^^^^
                            이 부분이 DB ID (32자)
```

---

## 📁 프로젝트 구조

```
├── api/
│   └── notion.js      # Notion API 연동
├── public/
│   └── index.html     # 메인 페이지
├── vercel.json        # Vercel 설정
├── package.json
└── .env.example       # 환경 변수 예제
```

---

## 💡 팁

- **이미지**: 노션에 직접 업로드하거나 Unsplash/외부 URL 사용
- **BGM**: mp3 파일 업로드 또는 외부 호스팅 URL
- **HTML in pillText**: `<i>enjoy</i> the silence` 형태로 작성 가능
- **색상**: shapeColor에 `#e8d5c4` 같은 HEX 코드 입력

---

## 🎨 커스터마이징

`public/index.html`에서:
- CSS 스타일 수정
- 레이아웃 변경
- 추가 기능 구현

Enjoy! ✨
