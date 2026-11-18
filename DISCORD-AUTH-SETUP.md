# KNL Discord 권한 시스템 설정

이 저장소는 GitHub Pages 정적 사이트이므로 Discord OAuth 자체와 승인 기록은 Supabase가 담당합니다. 브라우저에 관리자 비밀키를 넣지 않습니다.

## 1. Supabase 프로젝트
1. Supabase에서 프로젝트를 생성합니다.
2. Authentication → Providers → Discord를 활성화합니다.
3. Discord Developer Portal에서 OAuth2 애플리케이션을 만들고 Client ID / Client Secret을 Supabase Discord Provider 설정에 입력합니다.
4. Supabase Authentication → URL Configuration에서 Site URL을 `https://cool327000.github.io`로, Redirect URL에 `https://cool327000.github.io/knl-homepage/`를 추가합니다.
5. SQL Editor에서 `supabase-auth.sql` 전체를 실행합니다.

## 2. 브라우저 설정
1. Supabase Project Settings → API에서 Project URL과 anon/publishable key를 확인합니다.
2. 저장소의 `config.js`에서 `KNL_SUPABASE_URL`과 `KNL_SUPABASE_ANON_KEY`를 실제 값으로 교체합니다.
3. service_role / secret key는 절대 넣지 않습니다.

## 3. 소유자 지정 (필수)
1. 본인의 Discord 계정으로 KNL 사이트에서 Discord 로그인을 한 번 완료합니다.
2. Supabase Dashboard → Authentication → Users에서 방금 로그인한 본인의 사용자 UUID를 확인합니다.
3. SQL Editor에서 아래 쿼리의 UUID를 본인 UUID로 바꿔 실행합니다.

```sql
insert into public.knl_admins (user_id)
values ('YOUR-OWN-SUPABASE-AUTH-USER-UUID')
on conflict (user_id) do nothing;
```

소유자 UUID를 등록하는 이 단계는 반드시 본인 계정으로만 진행해야 합니다. 이 테이블에는 사이트 소유자 한 명만 등록하세요. 소유자만 사이트의 권한 요청을 승인/거절/회수할 수 있습니다.

## 4. 동작
- 일반 방문자에게 운영관리 메뉴는 숨겨집니다.
- Discord 로그인 후 운영 권한 요청을 제출할 수 있습니다.
- 요청은 Supabase에 저장되며 브라우저를 바꿔도 유지됩니다.
- 소유자만 운영관리 전체 기능을 보고 요청을 승인/거절/회수할 수 있습니다.
- 승인된 사용자는 운영관리 메뉴에 접근할 수 있습니다.

## 중요 제한
현재 리그 데이터(구단/선수/경기/뉴스)는 기존 코드대로 각 브라우저의 localStorage에 저장됩니다. 이 권한 시스템은 운영관리 화면 접근을 보호하지만, 리그 데이터를 모든 방문자에게 동기화하거나 기존 localStorage 쓰기를 서버 권한으로 바꾸지는 않습니다. 여러 운영진이 같은 데이터를 함께 편집해야 한다면 리그 데이터도 별도 Supabase 테이블로 이전하고 각 테이블에 동일한 승인 정책을 적용해야 합니다.
