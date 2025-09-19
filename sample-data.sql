-- 런텐(RUN10) 예시 데이터 삽입
-- 최적화된 스키마 적용 후 실행

-- =============================================================================
-- 1. 회원 데이터 (users)
-- =============================================================================

-- 관리자 계정
INSERT INTO users (user_id, password, name, email, phone, birth_date, gender, address1, address2, postal_code, phone_marketing_agree, email_marketing_agree, grade, record_time, etc, role) VALUES
('admin', 'admin2024!', '관리자', 'admin@run10.kr', '010-1234-5678', '850315', 'male', '서울특별시 강남구 테헤란로 123', '런텐빌딩 5층', '06234', false, false, 'bolt', 1500, '관리자 계정입니다.', 'admin');

-- 일반 회원들
INSERT INTO users (user_id, password, name, email, phone, birth_date, gender, address1, address2, postal_code, phone_marketing_agree, email_marketing_agree, grade, record_time, etc, role) VALUES
('runner01', 'password123', '김러너', 'runner01@email.com', '010-1111-1111', '901025', 'male', '서울특별시 송파구 올림픽로 300', '올림픽공원 근처', '05540', true, true, 'cheetah', 2100, '러닝을 좋아합니다.', 'user'),
('runner02', 'password123', '이달리기', 'runner02@email.com', '010-2222-2222', '920812', 'female', '부산광역시 해운대구 해운대해변로 200', '해운대 센텀시티', '48099', false, true, 'horse', 2520, '바다를 보며 달리는 것을 좋아해요.', 'user'),
('runner03', 'password123', '박마라톤', 'runner03@email.com', '010-3333-3333', '880204', 'male', '대구광역시 중구 동성로 150', '동성로 중앙', '41911', true, false, 'wolf', 3480, '꾸준히 달리고 있습니다.', 'user'),
('runner04', 'password123', '최조거', 'runner04@email.com', '010-4444-4444', '951130', 'female', '인천광역시 연수구 센트럴로 123', '송도국제도시', '22006', false, false, 'turtle', 4320, '천천히 하지만 꾸준히!', 'user'),
('runner05', 'password123', '정빠름', 'runner05@email.com', '010-5555-5555', '870618', 'male', '광주광역시 서구 상무중앙로 100', '상무지구 중심가', '61949', true, true, 'cheetah', 1980, '빠르게 달리는 것이 목표입니다.', 'user');

-- =============================================================================
-- 2. 대회 데이터 (competitions)
-- =============================================================================

INSERT INTO competitions (title, description, date, location, registration_start, registration_end, organizer, entry_fee, max_participants, current_participants, status, course_description, prizes) VALUES
('2024 서울 봄맞이 마라톤', '따뜻한 봄날, 서울 한강공원에서 펼쳐지는 마라톤 대회입니다. 초보자부터 전문가까지 모두 참여할 수 있는 다양한 종목을 준비했습니다.', '2024-04-20T08:00', '서울 한강공원 여의도지구', '2024-03-01T00:00', '2024-04-15T23:59', '런텐 주최', 30000, 1000, 0, 'published', '한강공원 여의도지구를 출발하여 반포대교를 거쳐 돌아오는 아름다운 코스입니다. 완주 후에는 한강의 멋진 경치를 감상하며 휴식을 취하실 수 있습니다.', '1등: 트로피 + 상금 50만원, 2등: 트로피 + 상금 30만원, 3등: 트로피 + 상금 20만원, 완주자 전원: 완주메달 + 기념품'),

('2024 부산 바다 마라톤', '시원한 바다 바람과 함께하는 부산 해운대 마라톤입니다. 바다를 보며 달리는 특별한 경험을 선사합니다.', '2024-05-18T07:30', '부산 해운대해수욕장', '2024-04-01T00:00', '2024-05-13T23:59', '부산러닝클럽', 35000, 800, 0, 'published', '해운대해수욕장에서 출발하여 광안대교를 거쳐 다시 해운대로 돌아오는 해안 코스입니다. 푸른 바다와 함께하는 환상적인 달리기를 경험하세요.', '종목별 시상: 1-3위 트로피 및 상금, 나이대별 특별상, 완주자 전원 완주메달'),

('2024 대구 힐링 숲속 마라톤', '대구 앞산공원에서 펼쳐지는 자연친화적 마라톤입니다. 맑은 공기와 아름다운 자연을 만끽하세요.', '2024-06-15T06:30', '대구 앞산공원', '2024-05-01T00:00', '2024-06-10T23:59', '대구시체육회', 25000, 600, 0, 'published', '앞산공원 내 숲길과 산책로를 활용한 힐링 코스입니다. 완만한 언덕과 울창한 숲이 어우러진 자연 친화적인 코스로 구성되어 있습니다.', '환경보호 실천상, 완주 인증서, 친환경 기념품, 지역 특산품');

-- =============================================================================
-- 3. 참가 그룹 데이터 (participation_groups)
-- =============================================================================

-- 서울 봄맞이 마라톤 그룹들
INSERT INTO participation_groups (competition_id, name, distance, entry_fee, max_participants, current_participants, description)
SELECT
    id,
    '3km 체험부',
    '3km',
    15000,
    200,
    0,
    '마라톤 입문자를 위한 부담 없는 3km 코스입니다.'
FROM competitions WHERE title = '2024 서울 봄맞이 마라톤';

INSERT INTO participation_groups (competition_id, name, distance, entry_fee, max_participants, current_participants, description)
SELECT
    id,
    '5km 일반부',
    '5km',
    20000,
    300,
    0,
    '적당한 거리감의 5km 코스로 일반인에게 인기가 많습니다.'
FROM competitions WHERE title = '2024 서울 봄맞이 마라톤';

INSERT INTO participation_groups (competition_id, name, distance, entry_fee, max_participants, current_participants, description)
SELECT
    id,
    '10km 도전부',
    '10km',
    25000,
    300,
    0,
    '본격적인 러닝을 경험할 수 있는 10km 코스입니다.'
FROM competitions WHERE title = '2024 서울 봄맞이 마라톤';

INSERT INTO participation_groups (competition_id, name, distance, entry_fee, max_participants, current_participants, description)
SELECT
    id,
    '하프마라톤',
    'half',
    30000,
    150,
    0,
    '21km 하프마라톤으로 마라톤의 진정한 묘미를 느낄 수 있습니다.'
FROM competitions WHERE title = '2024 서울 봄맞이 마라톤';

INSERT INTO participation_groups (competition_id, name, distance, entry_fee, max_participants, current_participants, description)
SELECT
    id,
    '풀마라톤',
    'full',
    40000,
    50,
    0,
    '42.195km 풀마라톤으로 최고의 도전을 경험하세요.'
FROM competitions WHERE title = '2024 서울 봄맞이 마라톤';

-- 부산 바다 마라톤 그룹들
INSERT INTO participation_groups (competition_id, name, distance, entry_fee, max_participants, current_participants, description)
SELECT
    id,
    '5km 바다부',
    '5km',
    25000,
    250,
    0,
    '바다를 보며 달리는 5km 코스입니다.'
FROM competitions WHERE title = '2024 부산 바다 마라톤';

INSERT INTO participation_groups (competition_id, name, distance, entry_fee, max_participants, current_participants, description)
SELECT
    id,
    '10km 해안부',
    '10km',
    30000,
    300,
    0,
    '해안선을 따라 달리는 아름다운 10km 코스입니다.'
FROM competitions WHERE title = '2024 부산 바다 마라톤';

INSERT INTO participation_groups (competition_id, name, distance, entry_fee, max_participants, current_participants, description)
SELECT
    id,
    '하프마라톤',
    'half',
    35000,
    200,
    0,
    '부산의 바다와 도시를 모두 경험할 수 있는 하프마라톤입니다.'
FROM competitions WHERE title = '2024 부산 바다 마라톤';

INSERT INTO participation_groups (competition_id, name, distance, entry_fee, max_participants, current_participants, description)
SELECT
    id,
    '풀마라톤',
    'full',
    45000,
    50,
    0,
    '부산 전체를 달리는 풀마라톤 코스입니다.'
FROM competitions WHERE title = '2024 부산 바다 마라톤';

-- 대구 힐링 숲속 마라톤 그룹들
INSERT INTO participation_groups (competition_id, name, distance, entry_fee, max_participants, current_participants, description)
SELECT
    id,
    '3km 힐링부',
    '3km',
    12000,
    150,
    0,
    '숲속에서 힐링하며 달리는 3km 코스입니다.'
FROM competitions WHERE title = '2024 대구 힐링 숲속 마라톤';

INSERT INTO participation_groups (competition_id, name, distance, entry_fee, max_participants, current_participants, description)
SELECT
    id,
    '5km 자연부',
    '5km',
    18000,
    200,
    0,
    '자연과 함께하는 5km 숲속 코스입니다.'
FROM competitions WHERE title = '2024 대구 힐링 숲속 마라톤';

INSERT INTO participation_groups (competition_id, name, distance, entry_fee, max_participants, current_participants, description)
SELECT
    id,
    '10km 트레킹부',
    '10km',
    25000,
    200,
    0,
    '앞산의 아름다운 트레킹 코스를 달리는 10km입니다.'
FROM competitions WHERE title = '2024 대구 힐링 숲속 마라톤';

INSERT INTO participation_groups (competition_id, name, distance, entry_fee, max_participants, current_participants, description)
SELECT
    id,
    '하프마라톤',
    'half',
    30000,
    50,
    0,
    '앞산 전체를 도는 하프마라톤 코스입니다.'
FROM competitions WHERE title = '2024 대구 힐링 숲속 마라톤';

-- =============================================================================
-- 4. 커뮤니티 게시글 예시 (community_posts)
-- =============================================================================

INSERT INTO community_posts (title, content, is_notice, user_id)
SELECT
    '런텐 공식 런칭을 축하합니다!',
    '안녕하세요! 런텐(RUN10) 공식 웹사이트가 오픈되었습니다. 앞으로 다양한 마라톤 대회 정보와 러닝 관련 소식을 공유해나가겠습니다. 많은 관심과 참여 부탁드립니다!',
    true,
    id
FROM users WHERE user_id = 'admin';

INSERT INTO community_posts (title, content, is_notice, user_id)
SELECT
    '마라톤 초보자를 위한 팁',
    '마라톤을 처음 시작하시는 분들을 위한 몇 가지 팁을 공유합니다:\n\n1. 충분한 워밍업과 쿨다운\n2. 본인 페이스 유지하기\n3. 적절한 수분 보충\n4. 편안한 러닝화 착용\n5. 점진적인 거리 늘리기\n\n함께 건강한 러닝 라이프를 즐겨요!',
    false,
    id
FROM users WHERE user_id = 'runner01';

INSERT INTO community_posts (title, content, is_notice, user_id)
SELECT
    '서울 한강 러닝 코스 추천',
    '서울에서 러닝하기 좋은 한강 코스를 추천드립니다. 특히 여의도와 반포 구간이 야경도 아름답고 달리기에도 좋아요. 주말에 함께 뛰실 분들 모집합니다!',
    false,
    id
FROM users WHERE user_id = 'runner02';

-- =============================================================================
-- 5. 대회 게시글 예시 (competition_posts)
-- =============================================================================

INSERT INTO competition_posts (competition_id, title, content, user_id)
SELECT
    c.id,
    '서울 봄맞이 마라톤 참가 문의',
    '안녕하세요! 이번 서울 봄맞이 마라톤에 처음 참가하려고 하는데, 초보자도 5km 코스 완주가 가능할까요? 평소 운동을 많이 하지 않아서 걱정됩니다.',
    u.id
FROM competitions c, users u
WHERE c.title = '2024 서울 봄맞이 마라톤' AND u.user_id = 'runner04';

INSERT INTO competition_posts (competition_id, title, content, author_name, password)
SELECT
    id,
    '주차장 정보 문의',
    '대회 당일 주차장 이용이 가능한지 궁금합니다. 미리 예약이 필요한지도 알려주세요.',
    '익명의러너',
    '1234'
FROM competitions WHERE title = '2024 서울 봄맞이 마라톤';

-- =============================================================================
-- 6. 댓글 예시 (post_comments)
-- =============================================================================

INSERT INTO post_comments (post_id, post_type, user_id, content)
SELECT
    cp.id,
    'community',
    u.id,
    '좋은 정보 감사합니다! 특히 페이스 유지 부분이 도움이 많이 되었어요.'
FROM community_posts cp, users u
WHERE cp.title = '마라톤 초보자를 위한 팁' AND u.user_id = 'runner03';

INSERT INTO post_comments (post_id, post_type, user_id, content)
SELECT
    cp.id,
    'community',
    u.id,
    '한강 러닝 정말 좋죠! 저도 자주 뛰는데 다음에 같이 뛰어요~'
FROM community_posts cp, users u
WHERE cp.title = '서울 한강 러닝 코스 추천' AND u.user_id = 'runner05';

-- =============================================================================
-- 완료 메시지
-- =============================================================================

-- 데이터 삽입 완료 확인
SELECT
    '사용자' as 테이블, COUNT(*) as 데이터수 FROM users
UNION ALL
SELECT
    '대회' as 테이블, COUNT(*) as 데이터수 FROM competitions
UNION ALL
SELECT
    '참가그룹' as 테이블, COUNT(*) as 데이터수 FROM participation_groups
UNION ALL
SELECT
    '커뮤니티게시글' as 테이블, COUNT(*) as 데이터수 FROM community_posts
UNION ALL
SELECT
    '대회게시글' as 테이블, COUNT(*) as 데이터수 FROM competition_posts
UNION ALL
SELECT
    '댓글' as 테이블, COUNT(*) as 데이터수 FROM post_comments;