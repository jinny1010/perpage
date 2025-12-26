# 📄 Notion JSON Viewer

노션 DB에 업로드된 JSON 파일을 채팅 형식으로 예쁘게 보여주는 웹앱입니다.

## 🚀 Vercel 배포 방법

### 1단계: GitHub에 업로드

```bash
# 새 저장소 생성 후
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/notion-json-viewer.git
git push -u origin main
```

### 2단계: Vercel 배포

1. [vercel.com](https://vercel.com)에 접속
2. GitHub으로 로그인
3. "Add New Project" 클릭
4. 방금 만든 저장소 선택
5. **Environment Variables** 설정:

| Name | Value |
|------|-------|
| `NOTION_TOKEN` | `ntn_...` (노션 API 토큰) |
| `NOTION_DATABASE_ID` | `32자리 데이터베이스 ID` |

6. "Deploy" 클릭!

### 3단계: 노션 설정

1. **API 토큰 발급**
   - https://www.notion.so/profile/integrations 접속
   - "New integration" 클릭
   - 이름 입력 → 저장
   - 토큰 복사 (ntn_으로 시작)

2. **데이터베이스 ID 찾기**
   - 노션에서 DB 페이지 열기
   - 우측 상단 ⋯ → 링크 복사
   - URL에서 `?v=` 앞의 32자리가 ID
   ```
   https://notion.so/myworkspace/[이부분이DB_ID]?v=...
   ```

3. **API 연결**
   - DB 페이지에서 ⋯ → 연결 → 연결 추가
   - 만든 Integration 선택

## 📁 노션 DB 구조

DB에 **Files & media** 타입 속성이 있어야 합니다.

| 속성 이름 | 타입 | 설명 |
|----------|------|------|
| 이름 | Title | 파일 제목 (선택) |
| 파일 | Files & media | JSON/JSONL 파일 업로드 |

## 💡 지원하는 JSON 형식

```json
// 단일 메시지
{"role": "user", "content": "안녕!"}
{"role": "assistant", "content": "안녕하세요!"}

// 또는
{"is_user": true, "mes": "안녕!"}
{"is_user": false, "mes": "안녕하세요!"}

// 또는
{"sender": "user", "message": "안녕!"}
{"sender": "assistant", "message": "안녕하세요!"}
```

## 🔒 보안

- API 토큰은 서버에서만 사용됩니다 (클라이언트에 노출 안 됨)
- Next.js 14.2.35 (보안 패치 적용 버전) 사용
- React 18.3.1 (안정 버전) 사용

## 📝 License

MIT
