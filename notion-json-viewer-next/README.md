# 📄 Notion JSON Viewer (게시판 형식)

노션 DB의 JSON 파일을 **폴더별 게시판** 형식으로 보여주는 웹앱

## 노션 DB 구조

| 속성명 | 타입 | 설명 |
|--------|------|------|
| 이름 | Title | 기본 이름 |
| sub | Text | 폴더 (카테고리) |
| title | Text | 게시글 제목 |
| jsonFile | Files & media | JSON/JSONL 파일 |

## Vercel 배포

1. GitHub에 Push
2. Vercel에서 Import
3. Environment Variables 설정:
   - `NOTION_TOKEN` = ntn_...
   - `NOTION_DATABASE_ID` = 32자리 ID
4. Deploy!

## 사용법

1. 노션 DB에 새 항목 추가
2. `sub`에 폴더명 입력 (예: "바론", "킬리언")
3. `title`에 제목 입력
4. `jsonFile`에 .jsonl 파일 업로드
5. 웹사이트에서 새로고침하면 게시판에 표시됨!
