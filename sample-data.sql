-- 런텐(RUN10) 통합 게시판 시스템 샘플 데이터
-- 회원게시판 + 대회별게시판 통합 구조

-- =============================================================================
-- 1. 사용자 샘플 데이터
-- =============================================================================

-- 관리자 계정
INSERT INTO users (user_id, password, name, email, phone, birth_date, gender, address1, address2, postal_code, grade, record_time, role) VALUES
('admin', 'admin2024!', '관리자', 'admin@run10.kr', '010-1234-5678', '850101', 'male', '서울특별시 강남구 테헤란로 123', '456호', '06234', 'bolt', 1800, 'admin');

-- 일반 회원 계정들 (다양한 등급)
INSERT INTO users (user_id, password, name, email, phone, birth_date, gender, address1, address2, postal_code, grade, record_time) VALUES
('cheetah01', 'password123', '김치타', 'cheetah@run10.kr', '010-2111-1111', '901201', 'male', '서울특별시 송파구 올림픽로 300', '', '05540', 'cheetah', 2100), -- 35분
('horse01', 'password123', '이홀스', 'horse@run10.kr', '010-2222-2222', '920315', 'female', '부산광역시 해운대구 해운대해변로 264', '101동 502호', '48099', 'horse', 2700), -- 45분
('wolf01', 'password123', '박울프', 'wolf@run10.kr', '010-3333-3333', '880730', 'male', '대구광역시 중구 동성로2가 81', '', '41939', 'wolf', 3300), -- 55분
('turtle01', 'password123', '최터틀', 'turtle@run10.kr', '010-4444-4444', '951110', 'female', '광주광역시 북구 용봉로 77', '202호', '61186', 'turtle', 4500), -- 75분
('runner01', 'password123', '정러너', 'runner@run10.kr', '010-5555-5555', '870622', 'male', '대전광역시 유성구 대학로 99', '', '34141', 'wolf', 3000), -- 50분
('speedy01', 'password123', '김스피드', 'speedy@run10.kr', '010-6666-6666', '931208', 'female', '인천광역시 연수구 송도과학로 123', '301호', '21984', 'horse', 2500), -- 41분40초
('marathoner', 'password123', '이마라톤', 'marathon@run10.kr', '010-7777-7777', '890405', 'male', '울산광역시 남구 삼산로 35', '', '44706', 'cheetah', 1950); -- 32분30초

-- =============================================================================
-- 2. 대회 샘플 데이터
-- =============================================================================

INSERT INTO competitions (title, description, date, location, registration_start, registration_end, entry_fee, course_description, prizes, organizer, supervisor, sponsor, max_participants, status) VALUES
('2024 서울 마라톤 페스티벌', '서울의 아름다운 경치를 감상하며 달리는 대표적인 마라톤 대회입니다.', '2024-05-15T06:00', '서울특별시 종로구 세종대로 175 (광화문광장)', '2024-03-01T00:00', '2024-05-01T23:59', 30000, '광화문광장에서 시작하여 한강을 따라 달리는 10km 코스입니다. 초보자부터 숙련자까지 모두 참여할 수 있는 코스로 설계되었습니다.', '1등 50만원, 2등 30만원, 3등 20만원, 완주메달 제공', '서울특별시', '한국러닝협회', 'RUN10', 1000, 'published'),

('부산 바다 마라톤', '부산의 아름다운 해안선을 따라 달리는 특별한 마라톤 대회입니다.', '2024-06-20T07:00', '부산광역시 해운대구 해운대해변로 264', '2024-04-01T00:00', '2024-06-10T23:59', 25000, '해운대 해수욕장에서 시작하여 광안리까지 이어지는 해안 코스입니다. 시원한 바다 바람과 함께 달리는 즐거움을 만끽할 수 있습니다.', '1등 30만원, 2등 20만원, 3등 10만원, 참가기념품 증정', '부산광역시', '부산러닝클럽', 'RUN10', 800, 'published'),

('대구 치킨 런', '대구의 특색있는 치킨과 함께하는 재미있는 러닝 이벤트입니다.', '2024-07-10T18:00', '대구광역시 중구 동성로2가 81', '2024-05-15T00:00', '2024-06-30T23:59', 20000, '동성로에서 시작하여 대구 시내 주요 명소를 돌아보는 5km 나이트런입니다. 완주 후 치킨 파티가 준비되어 있습니다.', '완주자 전원 치킨 제공, 랜덤 경품 추첨', '대구광역시', '대구러닝모임', '대구치킨협회', 500, 'published'),

('2024 가을 단풍 마라톤', '가을의 아름다운 단풍과 함께하는 힐링 마라톤입니다.', '2024-10-25T08:00', '경기도 가평군 청평면 호반로 818', '2024-08-01T00:00', '2024-10-15T23:59', 35000, '가평 청평호수 주변의 단풍길을 따라 달리는 15km 코스입니다. 가을의 정취를 만끽하며 자연과 함께하는 특별한 경험을 제공합니다.', '1등 100만원, 2등 50만원, 3등 30만원, 완주메달 및 기념품', '경기도 가평군', '한국러닝협회', 'RUN10', 1500, 'published'),

('신년 해돋이 마라톤', '새해 첫 해돋이와 함께하는 의미 있는 마라톤입니다.', '2025-01-01T05:30', '강원도 강릉시 창해로 17', '2024-11-01T00:00', '2024-12-20T23:59', 40000, '정동진 해변에서 일출을 보며 시작하는 새해 첫 마라톤입니다. 바다와 산을 넘나드는 도전적인 하프마라톤 코스입니다.', '완주자 전원 일출 기념품, 상위 입상자 트로피 및 상금', '강원도 강릉시', '강릉러닝클럽', 'RUN10', 2000, 'draft');

-- =============================================================================
-- 3. 참가 그룹 샘플 데이터
-- =============================================================================

-- 서울 마라톤 페스티벌 참가 그룹
INSERT INTO participation_groups (competition_id, name, distance, entry_fee, max_participants, description) VALUES
((SELECT id FROM competitions WHERE title = '2024 서울 마라톤 페스티벌'), '10km 일반부', '10km', 30000, 600, '10km 코스, 만 18세 이상 누구나 참가 가능'),
((SELECT id FROM competitions WHERE title = '2024 서울 마라톤 페스티벌'), '10km 학생부', '10km', 20000, 200, '10km 코스, 중고등학생 대상'),
((SELECT id FROM competitions WHERE title = '2024 서울 마라톤 페스티벌'), '5km 체험부', '5km', 15000, 200, '5km 코스, 초보자 및 가족 단위 참가자 환영');

-- 부산 바다 마라톤 참가 그룹
INSERT INTO participation_groups (competition_id, name, distance, entry_fee, max_participants, description) VALUES
((SELECT id FROM competitions WHERE title = '부산 바다 마라톤'), '15km 일반부', '15km', 25000, 500, '15km 해안 코스, 중급자 이상 추천'),
((SELECT id FROM competitions WHERE title = '부산 바다 마라톤'), '8km 체험부', '8km', 18000, 300, '8km 코스, 바다 마라톤 입문자 대상');

-- =============================================================================
-- 4. 참가 신청 샘플 데이터
-- =============================================================================

-- 서울 마라톤 페스티벌 참가 신청
INSERT INTO registrations (competition_id, user_id, participation_group_id, name, email, phone, birth_date, gender, age, address, shirt_size, depositor_name, password, distance, entry_fee, payment_status, is_member_registration) VALUES
((SELECT id FROM competitions WHERE title = '2024 서울 마라톤 페스티벌'),
 (SELECT id FROM users WHERE user_id = 'cheetah01'),
 (SELECT id FROM participation_groups WHERE name = '10km 일반부' AND competition_id = (SELECT id FROM competitions WHERE title = '2024 서울 마라톤 페스티벌')),
 '김치타', 'cheetah@run10.kr', '010-2111-1111', '901201', 'male', 34, '서울특별시 송파구 올림픽로 300', 'L', '김치타', 'reg123!', '10km', 30000, 'confirmed', true),

((SELECT id FROM competitions WHERE title = '2024 서울 마라톤 페스티벌'),
 (SELECT id FROM users WHERE user_id = 'horse01'),
 (SELECT id FROM participation_groups WHERE name = '10km 일반부' AND competition_id = (SELECT id FROM competitions WHERE title = '2024 서울 마라톤 페스티벌')),
 '이홀스', 'horse@run10.kr', '010-2222-2222', '920315', 'female', 32, '부산광역시 해운대구 해운대해변로 264 101동 502호', 'M', '이홀스', 'reg456!', '10km', 30000, 'confirmed', true);

-- 부산 바다 마라톤 참가 신청
INSERT INTO registrations (competition_id, user_id, participation_group_id, name, email, phone, birth_date, gender, age, address, shirt_size, depositor_name, password, distance, entry_fee, payment_status, is_member_registration) VALUES
((SELECT id FROM competitions WHERE title = '부산 바다 마라톤'),
 (SELECT id FROM users WHERE user_id = 'wolf01'),
 (SELECT id FROM participation_groups WHERE name = '15km 일반부' AND competition_id = (SELECT id FROM competitions WHERE title = '부산 바다 마라톤')),
 '박울프', 'wolf@run10.kr', '010-3333-3333', '880730', 'male', 36, '대구광역시 중구 동성로2가 81', 'L', '박울프', 'reg789!', '15km', 25000, 'pending', true);

-- 비회원 참가 신청 예시
INSERT INTO registrations (competition_id, participation_group_id, name, email, phone, birth_date, gender, age, address, shirt_size, depositor_name, password, distance, entry_fee, payment_status, is_member_registration, notes) VALUES
((SELECT id FROM competitions WHERE title = '대구 치킨 런'),
 (SELECT id FROM participation_groups WHERE name = '5km 체험부' AND competition_id = (SELECT id FROM competitions WHERE title = '2024 서울 마라톤 페스티벌')),
 '홍길동', 'hong@example.com', '010-9999-9999', '850615', 'male', 39, '서울특별시 마포구 홍대입구역 123', 'L', '홍길동', 'nonmember123', '5km', 15000, 'confirmed', false, '첫 마라톤 참가입니다!');

-- =============================================================================
-- 5. 통합 게시판 샘플 데이터 (community_posts)
-- =============================================================================

-- 회원게시판 게시글 (competition_id가 NULL)
INSERT INTO community_posts (user_id, competition_id, title, content, views, is_notice) VALUES
((SELECT id FROM users WHERE user_id = 'admin'), NULL, '[공지] 런텐 커뮤니티 이용 안내',
'안녕하세요! 런텐 커뮤니티를 이용해주셔서 감사합니다.

회원 여러분들이 자유롭게 러닝에 관한 이야기를 나누실 수 있는 공간입니다.

■ 게시판 이용 규칙
1. 상호 존중하는 매너 있는 대화
2. 러닝과 관련된 건전한 내용
3. 광고성 글 금지
4. 개인정보 노출 주의

즐거운 러닝 라이프 되세요! 🏃‍♂️🏃‍♀️', 125, true),

((SELECT id FROM users WHERE user_id = 'cheetah01'), NULL, '첫 마라톤 완주 후기!',
'드디어 인생 첫 마라톤을 완주했습니다! 🎉

3개월 동안 꾸준히 준비해서 목표했던 35분을 달성했어요.
처음에는 5km도 힘들었는데, 꾸준한 연습의 힘이 정말 대단한 것 같습니다.

다음 목표는 30분 안쪽으로 들어가는 것!
같이 훈련하실 분들 연락주세요 😊', 89, false),

((SELECT id FROM users WHERE user_id = 'horse01'), NULL, '러닝화 추천 부탁드려요',
'안녕하세요! 러닝을 시작한지 6개월 정도 된 초보입니다.

지금까지 일반 운동화로 뛰었는데, 슬슬 발이 아픈 것 같아서 러닝화를 사려고 해요.

여성용으로 발폭이 넓은 편인데, 어떤 브랜드가 좋을까요?
추천해주시면 정말 감사하겠습니다! 🙏', 156, false),

((SELECT id FROM users WHERE user_id = 'wolf01'), NULL, '러닝 동호회 모집합니다',
'대구 지역에서 주말 러닝 동호회를 만들려고 합니다!

■ 모집 대상
- 대구 거주자 또는 근무자
- 5km 이상 완주 가능하신 분
- 주말 오전 시간대 가능하신 분

■ 활동 계획
- 매주 토요일 오전 7시
- 대구 시내 다양한 코스 탐방
- 월 1회 친목 도모 시간

관심 있으신 분들 댓글로 연락주세요! 💪', 203, false),

((SELECT id FROM users WHERE user_id = 'turtle01'), NULL, '초보자 러닝 팁 공유해요',
'러닝 시작한지 1년 된 초보지만, 그동안 배운 것들 공유해봅니다!

1. 무리하지 말고 천천히 시작하기
2. 러닝 전후 스트레칭 필수
3. 적절한 장비 투자 (러닝화, 의류)
4. 컨디션 난조일 때는 과감히 쉬기
5. 작은 목표부터 차근차근

처음에는 1km도 힘들었는데, 이제 10km도 완주할 수 있게 되었어요!
포기하지 마시고 꾸준히 하시면 분명 늘어요 😊', 178, false);

-- 대회별 게시판 게시글 (competition_id가 있음)
INSERT INTO community_posts (user_id, competition_id, title, content, views, is_notice) VALUES
((SELECT id FROM users WHERE user_id = 'admin'),
 (SELECT id FROM competitions WHERE title = '2024 서울 마라톤 페스티벌'),
 '[공지] 2024 서울 마라톤 페스티벌 안내사항',
'2024 서울 마라톤 페스티벌 참가자 여러분께 안내드립니다.

■ 대회 당일 일정
- 집결시간: 오전 5:30
- 출발시간: 오전 6:00
- 완주 제한시간: 2시간

■ 준비물
- 참가번호표 (당일 배부)
- 개인 물통
- 여벌 옷

■ 주차 안내
- 광화문광장 주변 공영주차장 이용
- 대중교통 이용 권장

궁금한 사항은 댓글로 문의해주세요!', 234, true),

((SELECT id FROM users WHERE user_id = 'cheetah01'),
 (SELECT id FROM competitions WHERE title = '2024 서울 마라톤 페스티벌'),
 '서울 마라톤 코스 미리 뛰어봤어요!',
'다음 주 대회를 앞두고 코스를 미리 답사해봤습니다!

광화문에서 한강까지 구간이 생각보다 오르막이 많더라고요.
특히 세종대로 구간에서 페이스 조절이 중요할 것 같습니다.

한강 진입 후에는 평지라 괜찮은데, 중간에 바람이 세게 불면 힘들 수도 있겠어요.

같이 참가하시는 분들 파이팅! 🔥', 167, false),

((SELECT id FROM users WHERE user_id = 'horse01'),
 (SELECT id FROM competitions WHERE title = '부산 바다 마라톤'),
 '부산 바다 마라톤 첫 참가!',
'부산 바다 마라톤에 처음 참가하게 되었습니다!

해운대에서 광안리까지의 코스가 정말 아름다울 것 같아요.
바다를 보면서 뛰는 게 처음이라 설레고 떨립니다 😅

15km 코스는 좀 부담스럽지만, 해변의 시원한 바람이 도움이 될 것 같아요.
부산 분들, 코스 꿀팁 있으면 공유해주세요!', 145, false),

((SELECT id FROM users WHERE user_id = 'wolf01'),
 (SELECT id FROM competitions WHERE title = '대구 치킨 런'),
 '치킨런 재밌을 것 같아요!',
'대구 치킨런 참가 신청했습니다!

러닝과 치킨의 조합이라니... 상상만 해도 즐거워요 😂
5km는 부담없는 거리고, 나이트런이라 더 재밌을 것 같아요.

완주 후 치킨 파티가 정말 기대됩니다!
대구 맛집 치킨집에서 준비해주시는 건가요?', 92, false);

-- =============================================================================
-- 6. 댓글 샘플 데이터 (post_comments)
-- =============================================================================

INSERT INTO post_comments (post_id, user_id, content) VALUES
-- 첫 마라톤 완주 후기 댓글들
((SELECT id FROM community_posts WHERE title = '첫 마라톤 완주 후기!'),
 (SELECT id FROM users WHERE user_id = 'horse01'),
 '축하드려요! 35분이면 정말 좋은 기록이네요! 👏'),

((SELECT id FROM community_posts WHERE title = '첫 마라톤 완주 후기!'),
 (SELECT id FROM users WHERE user_id = 'wolf01'),
 '저도 30분대 목표로 열심히 뛰고 있어요. 같이 훈련해요!'),

((SELECT id FROM community_posts WHERE title = '첫 마라톤 완주 후기!'),
 (SELECT id FROM users WHERE user_id = 'turtle01'),
 '대단하세요! 저는 아직 50분대인데 많이 배우고 싶어요.'),

-- 러닝화 추천 댓글들
((SELECT id FROM community_posts WHERE title = '러닝화 추천 부탁드려요'),
 (SELECT id FROM users WHERE user_id = 'cheetah01'),
 '나이키 에어줌 페가수스 추천드려요! 발폭 넓은 분들에게 좋아요.'),

((SELECT id FROM community_posts WHERE title = '러닝화 추천 부탁드려요'),
 (SELECT id FROM users WHERE user_id = 'runner01'),
 '아식스 젤-님버스도 괜찮아요. 쿠션이 좋아서 무릎에도 부담이 적어요.'),

-- 러닝 동호회 모집 댓글들
((SELECT id FROM community_posts WHERE title = '러닝 동호회 모집합니다'),
 (SELECT id FROM users WHERE user_id = 'speedy01'),
 '관심있어요! 시간대도 딱 맞네요. 연락드릴게요 😊'),

-- 서울 마라톤 코스 답사 댓글들
((SELECT id FROM community_posts WHERE title = '서울 마라톤 코스 미리 뛰어봤어요!'),
 (SELECT id FROM users WHERE user_id = 'horse01'),
 '정보 감사해요! 오르막 구간 미리 알고 가니까 도움이 될 것 같아요.'),

((SELECT id FROM community_posts WHERE title = '서울 마라톤 코스 미리 뛰어봤어요!'),
 (SELECT id FROM users WHERE user_id = 'marathoner'),
 '세종대로 구간 정말 주의해야겠네요. 페이스 조절 신경쓸게요!'),

-- 부산 바다 마라톤 댓글들
((SELECT id FROM community_posts WHERE title = '부산 바다 마라톤 첫 참가!'),
 (SELECT id FROM users WHERE user_id = 'wolf01'),
 '부산 코스 정말 예뻐요! 중간에 사진 찍고 싶어질 거예요 📸'),

-- 치킨런 댓글들
((SELECT id FROM community_posts WHERE title = '치킨런 재밌을 것 같아요!'),
 (SELECT id FROM users WHERE user_id = 'turtle01'),
 'BHC에서 협찬한다고 들었어요! 양념치킨 기대해주세요 🍗');

-- =============================================================================
-- 데이터 삽입 후 카운터 업데이트
-- =============================================================================

-- 대회별 참가자 수 업데이트
UPDATE competitions
SET current_participants = (
  SELECT COUNT(*)
  FROM registrations
  WHERE registrations.competition_id = competitions.id
  AND registrations.payment_status = 'confirmed'
);

-- 참가 그룹별 참가자 수 업데이트
UPDATE participation_groups
SET current_participants = (
  SELECT COUNT(*)
  FROM registrations
  WHERE registrations.participation_group_id = participation_groups.id
  AND registrations.payment_status = 'confirmed'
);

-- 게시글 조회수는 이미 설정되어 있음
-- 댓글 수는 뷰(community_posts_with_author)에서 자동 계산됨