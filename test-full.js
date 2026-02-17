// 12-DICE 전체 이벤트 시뮬레이션 테스트 v14
// game.js의 모든 150개 이벤트 + 밸런스 v14 최종 적용 (평균 5% 성공률 목표)

const r = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const maxTurns = 5;

// ==================== 전체 이벤트 라이브러리 (game.js 동기화) ====================

const events = {
  // 긍정 이벤트 (positive) - v14: 확률 대폭 감소
  positive: [
    { id: 'p01', name: '용기 북돋우기', icon: '✨', cond: (p,d,t) => p<=7 && d<=2, fx: () => { const b=r(1,2); return { bonus: b, msg: `+${b}칸!` }; }},
    { id: 'p02', name: '동반자 발견', icon: '👫', cond: (p,d,t) => p===1 && d===1, fx: () => ({ doubleNext: true, msg: '다음 굴리기 2번!' })},
    { id: 'p03', name: '보물 상자', icon: '📦', cond: (p,d,t) => p===2 && d===1, fx: () => ({ bonus: 1, msg: '+1칸!' })},
    { id: 'p04', name: '돌풍', icon: '💨', cond: (p,d,t) => p===3 && d===6, fx: () => ({ bonus: 2, msg: `돌풍! +2칸!` })},
    { id: 'p05', name: '황금 주사위', icon: '🪙', cond: (p,d,t) => p<=1 && d===6, fx: () => ({ newMin: 4, newMax: 6, msg: '주사위 4~6!' })},
    { id: 'p06', name: '비밀 지름길', icon: '🌀', cond: (p,d,t) => p===4 && d===1, fx: () => ({ bonus: 2, msg: '지름길! +2칸!' })},
    { id: 'p07', name: '우연의 발견', icon: '🔍', cond: (p,d,t) => p>=4 && p<=6 && d===1, fx: () => ({ nextBonus: 1, msg: '다음 +1!' })},
    { id: 'p08', name: '축복의 샘', icon: '⛲', cond: (p,d,t) => p===5 && d===5, fx: () => ({ bonus: 3, msg: '축복! +3칸!' })},
    { id: 'p09', name: '천사의 미소', icon: '👼', cond: (p,d,t) => p>=6 && d===1 && t>=3, fx: () => ({ noTurnCount: true, bonus: 1, msg: '턴 안 감! +1칸!' })},
    { id: 'p10', name: '가벼운 발걸음', icon: '🦶', cond: (p,d,t) => p<=6 && d>=5, fx: () => ({ extraSlide: 1, msg: '미끄러짐! +1칸!' })},
    { id: 'p11', name: '별빛 길', icon: '✨🌟', cond: (p,d,t) => p>=7 && d===1, fx: () => ({ bonus: 2, msg: '별빛! +2칸!' })},
    { id: 'p12', name: '용사의 검', icon: '⚔️', cond: (p,d,t) => p===7 && t===1 && d===6, fx: () => ({ nextBonus: 2, msg: '용사! 다음 +2!' })},
    { id: 'p13', name: '가속 부츠', icon: '👢', cond: (p,d,t) => p>=8 && d===1, fx: () => ({ bonus: 1, msg: '부츠! +1칸!' })},
    { id: 'p14', name: '바람의 힘', icon: '🌬️', cond: (p,d,t) => p>=9 && d>=5, fx: () => ({ reverseMove: true, msg: '바람! 반대로!' })},
    { id: 'p15', name: '기적', icon: '🌟', cond: (p,d,t) => p>=10 && d===6, fx: () => ({ setPos: 12, msg: '기적! 12칸으로!' })},
    { id: 'p16', name: '행운의 네잎클로버', icon: '🍀', cond: (p,d,t) => p<=4 && d<=2, fx: () => { const b=r(1,2); return { bonus: b, msg: `+${b}칸!` }; }},
    { id: 'p17', name: '불멸의 의지', icon: '🔥', cond: (p,d,t) => p>=9 && t>=4 && d>=5, fx: () => ({ bonus: 2, msg: '의지! +2칸!' })},
    { id: 'p18', name: '전설의 돌', icon: '💎', cond: (p,d,t) => p===11 && t>=5 && d===6, fx: () => ({ setPos: 12, msg: '전설! 12칸으로!' })},
    { id: 'p19', name: '별똥별', icon: '🌠', cond: (p,d,t) => t>=3 && d===1, fx: () => ({ bonus: 2, msg: '+2칸!' })},
  ],
  
  // 중립 이벤트 (neutral)
  neutral: [
    { id: 'n01', name: '무반응', icon: '😐', cond: (p,d,t) => Math.random() < 0.15, fx: () => ({ noMove: true, msg: '아무 일 없음' })},
    { id: 'n02', name: '길 잃은 여행자', icon: '🚶', cond: (p,d,t) => p===3 && t>=2, fx: () => ({ nextBonus: Math.random()<0.5?1:-1, msg: '길 안내? ±1칸' })},
    { id: 'n03', name: '신비한 상점', icon: '🏪', cond: (p,d,t) => p===4 && d===1, fx: () => ({ special: true, msg: '상점에서 선택!' })},
    { id: 'n04', name: '동전 던지기', icon: '🪙', cond: (p,d,t) => p>=2 && p<=7 && Math.random() < 0.2, fx: () => Math.random()<0.5 ? { bonus: 1, msg: '앞! +1칸' } : { noMove: true, msg: '뒤! 제자리' }},
    { id: 'n05', name: '분기점', icon: '🔀', cond: (p,d,t) => p===5 && t>=2, fx: () => ({ choices: true, msg: '어느 길?' })},
    { id: 'n06', name: '휴식처', icon: '🛖', cond: (p,d,t) => p>=6 && p<=8 && t>=3, fx: () => ({ noTurnCount: true, msg: '쉬는 중...' })},
    { id: 'n07', name: '수상한 안내판', icon: '🪧', cond: (p,d,t) => p>=7 && p<=9, fx: () => ({ bonus: Math.random()<0.2?0:1, msg: '안내판!' })},
    { id: 'n08', name: '갈림길', icon: '⛔', cond: (p,d,t) => p===8 && t===3, fx: () => ({ reverseMove: Math.random()<0.5, msg: '갈림길!' })},
    { id: 'n09', name: '두 번의 기회', icon: '🎲🎲', cond: (p,d,t) => p===9 && d<=2, fx: () => ({ doubleNext: true, msg: '2번 굴리기!' })},
    { id: 'n10', name: '낯선 방', icon: '🚪', cond: (p,d,t) => p===4 && t===2, fx: () => ({ bonus: Math.random()<0.2?2:-1, msg: '낯선 방!' })},
    { id: 'n11', name: '잊힌 우물', icon: '🪣', cond: (p,d,t) => p>=5 && p<=8 && d<=2 && t>=3, fx: () => ({ setPos: Math.random()<0.2?12:p-2, msg: '우물!' })},
    { id: 'n12', name: '고양이', icon: '🐱', cond: (p,d,t) => p===3 && d===3, fx: () => ({ halfMove: true, msg: '냥! 반토!' })},
    { id: 'n13', name: '주사위 토끼', icon: '🐰', cond: (p,d,t) => p>=2 && p<=5 && d===4, fx: () => ({ extraDice: true, msg: '토끼가 굴림!' })},
    { id: 'n14', name: '주사위 병원', icon: '🏥', cond: (p,d,t) => p===4, fx: () => ({ choices: true, msg: '주사위 복구?' })},
    { id: 'n15', name: '복불복 박스', icon: '🎁', cond: (p,d,t) => p>=4 && p<=8 && t>=2, fx: () => Math.random()<0.5 ? { bonus: 2 } : { pushBack: 2 }},
    { id: 'n16', name: '숫자 카드', icon: '🃏', cond: (p,d,t) => p===7, fx: () => ({ nextBonus: Math.random()<0.5?1:-1, msg: '±1칸!' })},
    { id: 'n17', name: '시간 정지', icon: '⏸️', cond: (p,d,t) => t===3 && p>=5 && p<=7, fx: () => ({ noTurnCount: true, msg: '시간 정지!' })},
    { id: 'n18', name: '행운의 바람개비', icon: '🎋', cond: (p,d,t) => p===3 && d===3, fx: () => ({ doubleNext: true, msg: '바람개비! 2회!' })},
  ],
  
  // 부정 이벤트 (negative) - e 접두사 (v14: 확률 증가)
  negative: [
    { id: 'e01', name: '기본 망치', icon: '🔨', cond: (p,d,t) => p>=2 && d>=2 && p<10, fx: () => ({ newMin: 1, newMax: 3, msg: '주사위 1~3!' })},
    { id: 'e02', name: '함정 바닥', icon: '🕳️', cond: (p,d,t) => p>=1 && d>=2, fx: () => ({ pushBack: 3, msg: '3칸 후퇴!' })},
    { id: 'e03', name: '미끄러운 얼음', icon: '🧊', cond: (p,d,t) => p>=3 && p<=5 && d>=4, fx: () => ({ halfMove: true, msg: '반토!' })},
    { id: 'e04', name: '돌림바람', icon: '🌪️', cond: (p,d,t) => p===4 && d>=3, fx: () => ({ reverseMove: true, msg: '반대로!' })},
    { id: 'e05', name: '지진', icon: '🌋', cond: (p,d,t) => p>=6 && d>=3, fx: () => ({ pushBack: 3, msg: '지진: 3칸 후퇴!' })},
    { id: 'e06', name: '블랙홀', icon: '🕳️', cond: (p,d,t) => p>=7 && t>=2, fx: () => ({ pushBack: 7, msg: '블랙홀: 7칸 후퇴!' })},
    { id: 'e07', name: '암석 지대', icon: '🪨', cond: (p,d,t) => p>=4 && t>=2, fx: () => ({ nextMax: 3, msg: '다음 주사위 최대 3!' })},
    { id: 'e08', name: '감옥', icon: '⛓️', cond: (p,d,t) => p===6 && d>=4, fx: () => ({ skipTurns: 1, msg: '1턴 정지!' })},
    { id: 'e09', name: '폭설', icon: '❄️', cond: (p,d,t) => p>=5 && p<=9 && d<=3, fx: () => ({ frozen: 1, msg: '동결! 1턴 정지!' })},
    { id: 'e10', name: '화산 폭발', icon: '🌋🔥', cond: (p,d,t) => p>=7 && d>=3, fx: () => ({ pushBack: 5, msg: '화산: 5칸 후퇴!' })},
    { id: 'e11', name: '독안개', icon: '☠️🌫️', cond: (p,d,t) => p>=6 && d<=3 && t>=2, fx: () => ({ hidden: 2, msg: '주사위 값 안 보여!' })},
    { id: 'e12', name: '수렁', icon: '🤢', cond: (p,d,t) => p>=7 && d>=3, fx: () => ({ turnDrain: true, msg: '턴 1 추가!' })},
    { id: 'e13', name: '함정 문', icon: '🪤', cond: (p,d,t) => p>=4 && d>=1, fx: () => ({ pushBack: 5, msg: '함정: 5칸 후퇴!' })},
    { id: 'e14', name: '악몽', icon: '💤', cond: (p,d,t) => p>=8 && d<=2, fx: () => ({ halfMove: true, msg: '반토!' })},
    { id: 'e15', name: '주사위 둔화', icon: '🎲🐌', cond: (p,d,t) => p>=4 && p<=7 && t>=2, fx: () => ({ nextMax: 4, msg: '다음! 최대 4!' })},
    { id: 'e16', name: '비틀거림', icon: '😵‍💫', cond: (p,d,t) => p>=6 && p<=9 && d<=2, fx: () => ({ doubleMove: false, msg: '비틀!' })},
    { id: 'e17', name: '거미줄 함정', icon: '🕸️', cond: (p,d,t) => p>=4 && d>=3, fx: (d) => ({ changeDice: Math.max(1,d-2), msg: `주사위 -2!` })},
    { id: 'e18', name: '수면 가루', icon: '✨😴', cond: (p,d,t) => p>=7 && t>=2 && d<=3, fx: () => ({ skipTurns: 1, msg: '휴식...' })},
    { id: 'e19', name: '강제 멈춤', icon: '🛑', cond: (p,d,t) => p>=8 && d>=4, fx: () => ({ pause: 2, msg: '2초 정지!' })},
    { id: 'e20', name: '주사위 녹슴', icon: '🔩', cond: (p,d,t) => p>=3 && p<=6 && d<=2, fx: () => ({ unstableDice: true, msg: '불안정!' })},
    { id: 'e21', name: '불안정 지대', icon: '🪨⚡', cond: (p,d,t) => p>=6 && d>=3, fx: () => ({ halfMove: Math.random()<0.5, msg: '불안정!' })},
    { id: 'e22', name: '동굴', icon: '🕳️🦇', cond: (p,d,t) => p===7 && d>=4, fx: () => ({ pushBack: 3, msg: '동굴: 3칸 후퇴!' })},
    { id: 'e23', name: '비 오는 날', icon: '🌧️', cond: (p,d,t) => p>=5 && p<=9 && d>=3, fx: () => ({ nextMax: 4, msg: '미끄러워! 최대 4!' })},
    { id: 'e24', name: '주사위 부식', icon: '🎲🧪', cond: (p,d,t) => t>=4 && d>=2, fx: () => ({ newMin: 1, newMax: 4, msg: '부식! 주사위 1~4!' })},
    { id: 'e25', name: '번개', icon: '⚡', cond: (p,d,t) => p>=8 && d===6, fx: () => ({ pushBack: 4, msg: '번개: 4칸 후퇴!' })},
    { id: 'e26', name: '불길한 그림자', icon: '👤', cond: (p,d,t) => p>=7 && d<=2 && t>=3, fx: () => ({ hidden: 2, msg: '그림자...' })},
    { id: 'e27', name: '낙석', icon: '🪨', cond: (p,d,t) => p>=4 && d>=1, fx: () => ({ pushBack: 3, msg: '낙석: 3칸 후퇴!' })},
    { id: 'e28', name: '바람의 저주', icon: '🌬️💨', cond: (p,d,t) => p>=6 && d>=4, fx: () => ({ reverseMove: true, msg: '바람! 반대!' })},
    { id: 'e29', name: '안개', icon: '🌫️', cond: (p,d,t) => p>=5 && p<=10 && d<=3, fx: () => ({ hidden: 1, msg: '안개!' })},
    { id: 'e30', name: '주사위 오작동', icon: '🎲💥', cond: (p,d,t) => t>=4 && d>=3, fx: () => ({ unstableDice: true, msg: '오작동!' })},
    { id: 'e31', name: '안개 늪', icon: '🌫️🌿', cond: (p,d,t) => p>=6 && t>=2, fx: () => ({ pushBack: Math.floor(Math.random()*3)+1, msg: '늪!' })},
    { id: 'e32', name: '화염 구덩이', icon: '🔥🕳️', cond: (p,d,t) => p>=7 && d>=3, fx: () => ({ pushBack: 3, msg: '화염구덩이: 3칸 후퇴!' })},
  ],
  
  // 절망 이벤트 (despair) - d 접두사 (v14: 확률 대폭 증가)  
  despair: [
    { id: 'd01', name: '심연', icon: '⚫', cond: (p,d,t) => p>=5 && d>=3 && t>=2, fx: () => ({ setPos: 0, msg: '처음으로...' })},
    { id: 'd02', name: '주사위 파손', icon: '💔🎲', cond: (p,d,t) => p>=4 && d>=3 && t>=2, fx: () => ({ changeDice: 0, newMax: Math.random()<0.5?2:3, msg: '주사위 부서짐!' })},
    { id: 'd03', name: '완전 정지', icon: '🛑⏹️', cond: (p,d,t) => p>=8 && d>=3 && t>=3, fx: () => ({ skipTurns: 2, msg: '2턴 정지!' })},
    { id: 'd04', name: '영구 저주', icon: '💀', cond: (p,d,t) => p>=7 && d>=3 && t>=3, fx: () => ({ permanentCurse: true, msg: '영구 저주!' })},
    { id: 'd05', name: '비극', icon: '😢', cond: (p,d,t) => p>=7 && d<=3 && t>=3, fx: () => ({ pushBack: 5, msg: '비극: 5칸 후퇴!' })},
  ],
  
  // 특별 이벤트 (special) - s 접두사 (v14: 확률 감소)
  special: [
    { id: 's01', name: '주사위 파손', icon: '💔', cond: (p,d,t) => p>=2 && d>=4 && Math.random()<0.1, fx: () => ({ changeDice: 0, newMax: Math.random()<0.5?2:3, msg: '주사위 부서짐!' })},
    { id: 's02', name: '연마된 주사위', icon: '✨🎲', cond: (p,d,t) => p<=1 && d===1 && Math.random()<0.05, fx: () => ({ newMin: 3, newMax: 5, msg: '3~5 주사위!' })},
    { id: 's03', name: '무거운 주사위', icon: '🪨🎲', cond: (p,d,t) => t>=3 && d>=4 && Math.random()<0.1, fx: () => ({ newMin: 1, newMax: 2, msg: '1~2 주사위!' })},
    { id: 's04', name: '경량 주사위', icon: '🎈🎲', cond: (p,d,t) => p<=2 && t<=1 && Math.random()<0.05, fx: () => ({ newMin: 5, newMax: 6, msg: '5~6 주사위!' })},
    { id: 's05', name: '도박사의 주사위', icon: '🎰🎲', cond: (p,d,t) => p>=4 && p<=7 && t>=3 && Math.random()<0.05, fx: () => ({ values: [1,6], msg: '도박! 1 or 6!' })},
    { id: 's06', name: '부러진 주사위', icon: '🧩', cond: (p,d,t) => t>=4 && Math.random()<0.1, fx: () => ({ values: [1,1,2,2], msg: '부러짐! 1~2만!' })},
    { id: 's07', name: '황금 주사위', icon: '🪙🎲', cond: (p,d,t) => p<=2 && d===6 && Math.random()<0.05, fx: () => ({ newMin: 4, newMax: 6, msg: '4~6 주사위!' })},
    { id: 's08', name: '저주받은 주사위', icon: '👻🎲', cond: (p,d,t) => p>=7 && d>=3 && Math.random()<0.1, fx: () => ({ newMin: 1, newMax: 3, msg: '1~3 저주!' })},
    { id: 's09', name: '빙결 주사위', icon: '🧊🎲', cond: (p,d,t) => p>=4 && d<=2 && Math.random()<0.1, fx: () => ({ frozen: true, msg: '1턴 동결!' })},
    { id: 's10', name: '번개 주사위', icon: '⚡🎲', cond: (p,d,t) => p>=6 && d===6 && Math.random()<0.1, fx: () => ({ bonus: 1, unstableDice: true, msg: '번개! +1 불안정!' })},
    { id: 's11', name: '가시 주사위', icon: '🎲🦔', cond: (p,d,t) => p>=5 && d>=3 && t>=2 && Math.random()<0.1, fx: () => ({ newMin: 1, newMax: 4, msg: '가시! 1~4!' })},
    { id: 's12', name: '벽돌 주사위', icon: '🧱🎲', cond: (p,d,t) => p>=8 && d>=3 && Math.random()<0.1, fx: () => ({ newMax: 2, msg: '벽돌! 1~2!' })},
  ],
  
  // 초기 장애 (early) - r 접두사 (v14: 확률 증가)
  early: [
    { id: 'r01', name: '시작의 걸림', icon: '🔌', cond: (p,d,t) => p<=2 && d>=4, fx: () => ({ pushBack: 1, msg: '걸림: 1칸 후퇴!' })},
    { id: 'r02', name: '진통', icon: '🔄', cond: (p,d,t) => p===1 && t===1, fx: () => ({ halfMove: true, msg: '반토!' })},
    { id: 'r03', name: '초기 혼란', icon: '😵', cond: (p,d,t) => p<=3 && d<=2, fx: () => ({ reverseMove: true, msg: '혼란! 반대!' })},
    { id: 'r04', name: '시작의 저주', icon: '👻', cond: (p,d,t) => p===0 && d<=2, fx: () => ({ nextMax: 3, msg: '저주! 최대 3!' })},
    { id: 'r05', name: '첫 발판 무너짐', icon: '🪜', cond: (p,d,t) => p<=2 && d>=3, fx: () => ({ halfMove: true, msg: '반토!' })},
  ],
  
  // 턴 압박 (turnPressure) - t 접두사 (v14: 확률 증가)
  turnPressure: [
    { id: 't01', name: '시간 압박', icon: '⏰', cond: (p,d,t) => t>=2 && p>=5, fx: () => ({ turnDrain: true, msg: '턴 +1!' })},
    { id: 't02', name: '마감 임박', icon: '⏱️', cond: (p,d,t) => t>=maxTurns-1, fx: () => ({ nextMax: 4, msg: '마감! 최대 4!' })},
    { id: 't03', name: '마지막 기회', icon: '⏳', cond: (p,d,t) => t>=4 && p>=9, fx: () => ({ exactOnly: true, msg: '정확히만!' })},
    { id: 't04', name: '시간 보너스', icon: '⏰+', cond: (p,d,t) => t>=2 && d>=5 && Math.random()<0.1, fx: () => ({ bonus: 1, turnDrain: true, msg: '+1칸, 턴+1!' })},
  ],
  
  // 저주 (curse) - c 접두사 (v14: 확률 증가)
  curse: [
    { id: 'c01', name: '저주의 그림자', icon: '👤', cond: (p,d,t) => p>=4 && t>=2, fx: () => ({ hidden: 2, msg: '그림자: 2턴 숨김!' })},
    { id: 'c02', name: '역주사위', icon: '🔄🎲', cond: (p,d,t) => p>=5 && d>=3, fx: () => ({ reverseDice: true, msg: '역주사위!' })},
    { id: 'c03', name: '음습한 존재', icon: '🐍', cond: (p,d,t) => p>=6 && t>=2, fx: () => ({ blockPositive: 3, msg: '긍정 3턴 차단!' })},
    { id: 'c04', name: '악의 흐름', icon: '🧿', cond: (p,d,t) => p>=7 && d>=2, fx: () => ({ blockPositive: 3, msg: '긍정 차단!' })},
    { id: 'c05', name: '불안정 주사위', icon: '🎲↔️', cond: (p,d,t) => t>=3 && d>=4, fx: () => ({ unstableDice: true, msg: '불안정!' })},
    { id: 'c06', name: '위축', icon: '😰', cond: (p,d,t) => p>=6 && d>=3, fx: () => ({ nextMax: 4, msg: '다음 최대 4!' })},
    { id: 'c07', name: '망각의 안개', icon: '🌫️🧠', cond: (p,d,t) => p>=4 && t>=2 && d<=2, fx: () => ({ hidden: 2, msg: '숨김!' })},
    { id: 'c08', name: '불행의 사슐', icon: '⛓️', cond: (p,d,t) => p>=5 && d>=3 && t>=2, fx: () => ({ forceNegative: true, msg: '부정 강제!' })},
  ],
  
  // 클리어 방해 (blocker) - b 접두사 (v15c: 밸런스 극대화)
  blocker: [
    { id: 'b01', name: '골인저부', icon: '🛑', cond: (p,d,t) => p>=5, fx: () => ({ pushBack: 7, msg: '골인저부: 7칸 후퇴!' })},
    { id: 'b02', name: '마지막 관문', icon: '🚪🔒', cond: (p,d,t) => p>=6, fx: () => ({ pushBack: 6, newMin: 1, newMax: 2, msg: '관문: 후퇴+1~2!' })},
    { id: 'b03', name: '승리의 미끄럼', icon: '🏆', cond: (p,d,t) => p>=8, fx: () => ({ exactOnly: true, msg: '정확히만!' })},
    { id: 'b04', name: '감시의 눈', icon: '👁️', cond: (p,d,t) => p>=6 && t>=2, fx: () => ({ oddPushback: true, msg: '홀수 후퇴!' })},
    { id: 'b05', name: '피니쉬 라인 이동', icon: '🏁🏃', cond: (p,d,t) => p>=6 && d>=1, fx: () => ({ extendGoal: 7, msg: '골 이동!' })},
    { id: 'b06', name: '최종 테스트', icon: '📋', cond: (p,d,t) => p>=8, fx: () => ({ miniGame: 'tap', msg: '연타!' })},
    { id: 'b07', name: '거의 다 왔는데', icon: '😫', cond: (p,d,t) => p>=6, fx: () => ({ pushBack: 8, msg: '8칸 후퇴!' })},
    { id: 'b08', name: '승리 조건 추가', icon: '✅+', cond: (p,d,t) => p>=7 && t>=2, fx: () => ({ oddWinOnly: true, msg: '홀수만 승리!' })},
    { id: 'b09', name: '벽', icon: '🧱', cond: (p,d,t) => p>=7, fx: () => ({ pushBack: 10, msg: '벽: 10칸 후퇴!' })},
    { id: 'b10', name: '시간 압박', icon: '⏰', cond: (p,d,t) => p>=6 && t>=2, fx: () => ({ turnConsume: true, msg: '턴 1 소모!' })},
  ]
};

// ==================== 이벤트 선택 (밸런스 v14 최종) ====================

const eventHistory = [];

function selectEvent(p, d, t, inBypass) {
  // 우회 루트 이벤트 (v15: 99% 확률로 이벤트 발생, 후퇴 강화)
  if (inBypass) {
    if (Math.random() > 0.01) {
      const bypassEvents = [
        { id: 'bp01', name: '블랙홀', icon: '🕳️', fx: () => ({ pushBack: 8, msg: '블랙홀: 8칸 후퇴!' })},
        { id: 'bp02', name: '화염구덩이', icon: '🔥🗑️', fx: () => ({ pushBack: 5, msg: '화염구덩이: 5칸 후퇴!' })},
        { id: 'bp03', name: '우회의 저주', icon: '👻', fx: () => ({ pushBack: 4, msg: '저주: 4칸 후퇴!' })},
        { id: 'bp04', name: '순환 정체', icon: '⏳', fx: () => ({ addTurns: 2, msg: '정체: 턴+2!' })},
        { id: 'bp05', name: '미로', icon: '🌀', fx: () => ({ setPos: Math.max(12, p-5), msg: '미로: 5칸 후퇴!' })},
        { id: 'bp06', name: '순환 역행', icon: '↩️', fx: () => ({ pushBack: 3, msg: '역행: 3칸 후퇴!' })},
        { id: 'bp07', name: '지진', icon: '🌋', fx: () => ({ pushBack: 6, msg: '지진: 6칸 후퇴!' })},
        { id: 'bp08', name: '낙석', icon: '🪨', fx: () => ({ pushBack: 4, msg: '낙석: 4칸 후퇴!' })},
        { id: 'bp09', name: '심연', icon: '⚫', fx: () => ({ pushBack: 10, msg: '심연: 10칸 후퇴!' })},
        { id: 'bp10', name: '돌풍', icon: '🌪️', fx: () => ({ pushBack: 7, msg: '돌풍: 7칸 후퇴!' })}
      ];
      return bypassEvents[r(0, bypassEvents.length - 1)];
    }
    return null;
  }
  
  // 모든 카테고리 합치기
  const all = [...events.positive, ...events.neutral, ...events.negative, 
               ...events.despair, ...events.special, ...events.early, 
               ...events.turnPressure, ...events.curse, ...events.blocker];
  
  // 최근 5개 이벤트 제외 (다양성 강화)
  const recentIds = eventHistory.slice(-5);
  const matching = all.filter(e => {
    if (recentIds.includes(e.id)) return false;
    try { return e.cond(p, d, t); } catch { return false; }
  });
  
  if (matching.length === 0) return null;
  
  // 이벤트 발생 확률 (v15: 밸런스 조정 - 거의 항상 발생)
  const baseChance = p <= 3 ? 0.92 : (p <= 6 ? 0.96 : (p <= 9 ? 0.99 : 0.995));
  if (Math.random() > baseChance) return null;
  
  // 카테고리별 가중치 (v15f: 5% 목표 강화 - 최종)
  let categoryWeights = {};
  
  if (p >= 9) {
    // 종반: blocker > despair > curse (v15f: 최대 강화)
    categoryWeights = {
      positive: 0.0000001, neutral: 0.00001, negative: 20,
      despair: 35, special: 0.000001, early: 0, turnPressure: 20, curse: 35, blocker: 60
    };
  } else if (p >= 7) {
    // 중후반: blocker > curse > negative (v15f)
    categoryWeights = {
      positive: 0.000001, neutral: 0.0001, negative: 18,
      despair: 25, special: 0.00001, early: 0, turnPressure: 18, curse: 30, blocker: 55
    };
  } else if (p >= 4) {
    // 중반: negative > curse (v15f)
    categoryWeights = {
      positive: 0.0001, neutral: 0.005, negative: 15,
      despair: 15, special: 0.001, early: 0.005, turnPressure: 15, curse: 22, blocker: 30
    };
  } else {
    // 초반: early > negative (v15f)
    categoryWeights = {
      positive: 0.001, neutral: 0.02, negative: 15,
      despair: 8, special: 0.002, early: 20, turnPressure: 12, curse: 15, blocker: 12
    };
  }
  
  const weights = matching.map(e => {
    const prefix = e.id.charAt(0);
    const cat = { p: 'positive', n: 'neutral', e: 'negative', d: 'despair', s: 'special', r: 'early', t: 'turnPressure', c: 'curse', b: 'blocker' }[prefix] || 'neutral';
    return categoryWeights[cat] || 1;
  });
  
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  
  for (let i = 0; i < matching.length; i++) {
    rand -= weights[i];
    if (rand <= 0) {
      eventHistory.push(matching[i].id);
      return matching[i];
    }
  }
  eventHistory.push(matching[0].id);
  return matching[0];
}

// ==================== 시뮬레이션 ====================

console.log('='.repeat(60));
console.log('🎲 12-DICE 전체 이벤트 테스트 v15f');
console.log('📋 148개 이벤트 + 밸런스 v15f (목표 5% 성공률)');
console.log('='.repeat(60));

let success = 0;
const results = [];

for (let test = 1; test <= 10; test++) {
  let position = 0;
  let turn = 1;
  let maxTurns = 5;
  let diceMin = 1;
  let diceMax = 6;
  let inBypass = false;
  let bypassLength = 0;
  const logs = [];
  
  console.log('\n' + '-'.repeat(60));
  console.log(`📊 테스트 #${test}`);
  console.log('-'.repeat(60));
  
  while (turn <= maxTurns) {
    const roll = r(diceMin, diceMax);
    let move = roll;
    const event = selectEvent(position, roll, turn, inBypass);
    
    let eventLog = `T${turn}: 🎲${roll}`;
    
    if (event) {
      const fx = event.fx(roll);
      
      // 우회 루트 이벤트
      if (event.id.startsWith('bp')) {
        if (fx.setPos === 12 && fx.victory) {
          logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg}`);
          logs.push(`   🎉 우회 루트 지름길로 승리!`);
          position = 12;
          inBypass = false;
          break;
        } else if (fx.pushBack) {
          const prevPos = position;
          position = position - fx.pushBack;
          if (position === 12) {
            logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg} [${prevPos}→12]`);
            logs.push(`   🎉 우회 루트 후퇴로 12칸 도착! 승리!`);
            position = 12;
            inBypass = false;
            break;
          }
          logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg} [${prevPos}→${position}칸]`);
        } else if (fx.bonus) {
          position = Math.min(position + fx.bonus, 12);
          logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg} [${position}칸]`);
        } else if (fx.addTurns) {
          maxTurns += fx.addTurns;
          logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg} [턴 ${maxTurns}]`);
        }
        turn++;
        continue;
      }
      
      // 일반 이벤트
      let afterMove = position + move;
      
      if (fx.bonus) {
        afterMove = position + move + fx.bonus;
        logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg} [${position}→${afterMove}칸]`);
      } else if (fx.pushBack) {
        const tempPos = Math.max(0, afterMove - fx.pushBack);
        logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg} [${afterMove}→${tempPos}]`);
        if (tempPos === 12) {
          logs.push(`   🎉 이벤트 후퇴로 12칸 도착! 승리!`);
          position = 12;
          break;
        }
        position = tempPos;
        inBypass = false;
        turn++;
        continue;
      } else if (fx.setPos !== undefined) {
        position = fx.setPos;
        logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg} [→${position}칸]`);
        if (position === 12) {
          logs.push(`   🎉 12칸 도착! 승리!`);
          break;
        }
        turn++;
        continue;
      } else if (fx.newMin !== undefined || fx.newMax !== undefined) {
        if (fx.newMin !== undefined) diceMin = fx.newMin;
        if (fx.newMax !== undefined) diceMax = fx.newMax;
        logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg} [주사위 ${diceMin}~${diceMax}]`);
      } else if (fx.changeDice !== undefined) {
        logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg}`);
        if (fx.newMax !== undefined) diceMax = fx.newMax;
        position += fx.changeDice;
        turn++;
        continue;
      } else if (fx.noMove) {
        logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg} [제자리]`);
        turn++;
        continue;
      } else if (fx.halfMove) {
        afterMove = position + Math.floor(move / 2);
        logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg} [${position}→${afterMove}칸]`);
      } else if (fx.reverseMove) {
        afterMove = position - move;
        logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg} [${position}→${afterMove}칸]`);
      } else if (fx.skipTurns) {
        turn += fx.skipTurns;
        logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg} [턴 +${fx.skipTurns}]`);
        position = afterMove;
        continue;
      } else if (fx.addTurns) {
        maxTurns += fx.addTurns;
        logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg} [최대턴 ${maxTurns}]`);
      } else if (fx.extraSlide) {
        afterMove = position + move + fx.extraSlide;
        logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg} [${position}→${afterMove}칸]`);
      } else {
        logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg || ''}`);
      }
      
      // 12칸 초과 시 우회 루트
      if (afterMove > 12 && !fx.pushBack) {
        if (!inBypass) {
          bypassLength = r(3, 6);
          inBypass = true;
          logs.push(`   🚧 우회 루트 ${bypassLength}칸 생성!`);
          position = afterMove;
          logs.push(`   ⚠️ 우회 루트 진입: ${position}칸`);
        } else {
          const bypassEnd = 12 + bypassLength;
          position = afterMove > bypassEnd ? 12 + (afterMove - bypassEnd) : afterMove;
          if (position === 12) {
            logs.push(`   🎉 우회 루트 순환으로 12칸! 승리!`);
            inBypass = false;
            break;
          }
          logs.push(`   [${position}칸]`);
        }
      } else if (afterMove === 12) {
        logs.push(`   🎉 정확히 12칸 도달! 승리!`);
        position = 12;
        break;
      } else {
        position = afterMove;
      }
    } else {
      // 이벤트 없음 - 주사위 이동
      let afterMove = position + move;
      
      if (afterMove > 12) {
        if (!inBypass) {
          bypassLength = r(3, 6);
          inBypass = true;
          logs.push(`${eventLog} → ${move}칸 이동 [${position}→${afterMove}칸]`);
          logs.push(`   🚧 우회 루트 ${bypassLength}칸 생성!`);
          position = afterMove;
          logs.push(`   ⚠️ 우회 루트 진입: ${position}칸`);
        } else {
          position = afterMove;
          logs.push(`${eventLog} → ${move}칸 이동 [${position}칸]`);
        }
      } else if (afterMove === 12) {
        logs.push(`${eventLog} → ${move}칸 이동 [${position}→12칸]`);
        logs.push(`   🎉 정확히 12칸 도달! 승리!`);
        position = 12;
        break;
      } else {
        logs.push(`${eventLog} → ${move}칸 이동 [${position}→${afterMove}칸]`);
        position = afterMove;
      }
    }
    
    turn++;
  }
  
  // 로그 출력
  logs.forEach(l => console.log(l));
  
  if (position === 12) {
    console.log(`\n✅ 성공! (${turn-1}턴 만에 클리어)`);
    success++;
    results.push({ test, result: '성공', turns: turn-1, position: 12 });
  } else {
    console.log(`\n❌ 실패! (최종: ${position}칸${inBypass ? ` (우회 루트, ${bypassLength}칸)` : ''}, 턴 ${turn-1}/${maxTurns})`);
    results.push({ test, result: '실패', turns: turn-1, position: position + (inBypass ? `(우회)` : '') });
  }
}

console.log('\n' + '='.repeat(60));
console.log(`📈 결과: ${success}/10 성공 (${success * 10}%)`);
console.log('='.repeat(60));

console.log('\n📋 결과 요약:');
console.log('| 테스트 | 결과 | 턴 | 최종 위치 |');
console.log('|--------|------|-----|-----------|');
results.forEach(r => {
  console.log(`| #${r.test}    | ${r.result === '성공' ? '✅ 성공' : '❌ 실패'} | ${r.turns}   | ${r.position} |`);
});