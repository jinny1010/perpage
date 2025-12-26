# 📄 Notion JSON Viewer (게시판 형식)

노션 DB의 JSON 파일을 **폴더별 게시판** 형식으로 보여주는 웹앱

## 기능

- ✅ 폴더별 게시글 분류
- ✅ 화면에서 직접 파일 등록
- ✅ 테마 1: 기본 스타일 (standalone)
- ✅ 테마 2: SNS 채팅 스타일 (좌우 말풍선)

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
3. **Storage > Create > Blob** 생성
4. Environment Variables 설정:
   - `NOTION_TOKEN` = ntn_...
   - `NOTION_DATABASE_ID` = 32자리 ID
   - `BLOB_READ_WRITE_TOKEN` = (Blob 생성시 자동 연결됨)
5. Deploy!

## 사용법

### 웹에서 등록
1. 우측 하단 **+** 버튼 클릭
2. 폴더, 제목, 파일 입력
3. 등록!

### 노션에서 직접 등록
1. 노션 DB에 새 항목 추가
2. `sub`에 폴더명, `title`에 제목, `jsonFile`에 파일 업로드

### 테마 변경
- 게시글 열람 시 상단에서 테마 선택 가능
