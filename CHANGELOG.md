# 변경 이력

이 프로젝트의 주요 변경 사항을 기록합니다.

형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)를 따르고,
버전은 [유의적 버전](https://semver.org/lang/ko/)을 따릅니다.

버전 표기는 이 저장소가 [carbon](https://github.com/carbon-app/carbon)에서 갈라져 나온
시점을 기준으로 새로 시작하므로, 업스트림 carbon의 버전과는 이어지지 않습니다.

## [1.0.0] - 2026-09-05

Unity 개발자를 위한 코드 이미지 생성기로서 첫 정식 버전.

### 추가

- **Unity C# 구문 강조** — Rider의 색 구성을 따르는 `unity-csharp` CodeMirror 모드.
  타입·메서드·필드·이벤트·열거형 값을 구분해 칠하고, Unity API 레지스트리를 참조해
  엔진 타입을 별도 색으로 표시합니다. C#을 고르면 항상 적용됩니다.
- **Unity API 레지스트리** — `lib/unity-api/`에 패키지별 심볼 목록(엔진, URP, 입력 시스템,
  Addressables, Cinemachine, Netcode, 로컬라이제이션, TextMeshPro 등)을 두고,
  `yarn import:unity-api`로 갱신, `yarn validate:unity-api`로 빌드 전에 검증합니다.
- **`.gitignore` / `.gitattributes` 구문 강조** — 언어 목록에 `Git Ignore`,
  `Git Attributes` 추가. 주석, 부정(`!`), 글롭 메타문자(`**` `*` `?` `[...]`),
  백슬래시 이스케이프, 속성 키워드와 값, `[attr]` 매크로를 구분합니다.
- **테마 드롭다운** — 툴바 맨 왼쪽에서 바로 테마를 바꿀 수 있습니다.
  설정 메뉴의 테마 목록도 그대로 유지되며 양쪽이 동기화됩니다.
- **Rider Islands 테마** — Rider의 Islands Dark / Light 색 구성을 옮긴 테마 2종.
- **Jetendard 폰트** — JetBrains Mono에 Pretendard 한글을 합친 폰트를 기본으로 사용하고,
  UI 문구를 한국어로 정리했습니다.
- **시간대별 인사 문구** — 접속 시각에 따라 상단 문구가 바뀝니다.
- **하이라이트 / Error 텍스트 색** — 선택 영역에 형광펜과 오류 색을 입힐 수 있습니다.
  기본 형광펜 색은 테마를 따라가고(다크 `#4B4310`, 라이트 `#F9EFA9`), 직접 고른 색은
  테마를 바꿔도 유지됩니다.
- **휠 줌** — 에디터 위에서 휠로 글꼴 크기를 조절하고, 현재 크기를 화면 하단에 표시합니다.
- **F1 / F2 / F3 숨은 단축키.**
- **GitHub Pages 정적 배포** — `/Unity-Carbon` 하위 경로로 export 하도록 구성했습니다.
- **하단 버전 표기** — 페이지 아래에 현재 버전을 표시합니다.

### 변경

- 줄 번호 간격이 글꼴 크기에 비례해 늘어나도록 조정했습니다.
- 페이지 콘텐츠를 세로 가운데로 정렬했습니다.
- 버튼과 입력 요소가 앱 폰트를 상속하도록 했습니다. CSS 리셋이 `button`과 `input`을
  건너뛰는 탓에 브라우저 기본 UI 폰트가 남아 있었습니다.

### 수정

- 첫 방문 시 전체 선택 영역이 실제 텍스트보다 짧게 그려지던 문제. 폰트가
  `font-display: swap`으로 늦게 도착해 CodeMirror가 폴백 폰트 기준의 글자 폭을
  캐시한 것이 원인이라, 폰트 적용 후 재측정하도록 했습니다.
- ⌘A/Ctrl+A 같은 키보드 선택에서 Highlight / Error 버튼이 뜨지 않던 문제.
  툴바가 `mouseup`에서만 갱신되고 있었습니다.
- 드롭다운 목록에서 이름이 길면 체크마크와 겹치던 문제.
- 휠 줌 크기 표시가 저장돼 다시 접속했을 때 남아 있던 문제.
- 하위 경로 배포 시 폰트와 manifest가 404 나던 문제, 정적 라우팅의 JSON 파싱 오류.

[1.0.0]: https://github.com/NK-Studio/unity-carbon/releases/tag/v1.0.0
