// 12-DICE 이벤트 테스트 스크립트
// 각 이벤트의 조건과 효과가 올바르게 작동하는지 테스트

// 가상의 Game 클래스 (브라우저 없이 테스트용)
class MockGame {
    constructor() {
        this.position = 0;
        this.turn = 1;
        this.maxTurns = 5;
        this.goalPosition = 12;
        this.eventHistory = [];
        this.totalRolls = 0;
        this.lastDiceValue = null;
        this.currentDice = { min: 1, max: 6, name: '기본 주사위', type: 'normal' };
        this.forceDice = null;
        this.isInBypass = false;
        this.bypassLength = 0;
        this.extendedGoal = false;
    }
    
    r(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    mysteryBox() {
        return Math.random() < 0.5 ? { bonus: 3 } : { pushBack: 3 };
    }
    
    gacha() {
        const outcomes = [
            { bonus: 4 }, { pushBack: 2 },
            { newDice: { min:1, max:4, name:'작은 주사위', type:'small' }},
            { newDice: { min:5, max:6, name:'큰 주사위', type:'big' }},
            { addTurns: 1 }, { skipTurns: 1 }
        ];
        return outcomes[this.r(0, outcomes.length-1)];
    }
    
    weather() {
        const w = [{ bonus: 2 }, { pushBack: 1 }, { skipTurns: 1 }, { addTurns: 1 }];
        return w[this.r(0, w.length-1)];
    }
    
    miniRoulette() {
        const n = this.r(0, 5);
        if (n < 2) return { bonus: 2 };
        if (n < 4) return { pushBack: 1 };
        return { addTurns: 1 };
    }
    
    // 게임 상태 설정 헬퍼
    setState(position, turn, dice, totalRolls = 1) {
        this.position = position;
        this.turn = turn;
        this.lastDiceValue = dice;
        this.totalRolls = totalRolls;
    }
}

// 이벤트 라이브러리 (game.js에서 추출)
function getEventLibrary(game) {
    return {
        positive: [
            { id: 'p01', name: '용기 북돋우기', cond: (p,d,t) => p<=6 && d<=3, fx: d => ({ bonus: game.r(1,3) }) },
            { id: 'p02', name: '주사위 복제', cond: (p,d,t) => p<=4 && d<=1, fx: () => ({ extraRolls: 2 }) },
            { id: 'p03', name: '천국의 축복', cond: (p,d,t) => t>=3 && p<=3, fx: () => ({ setPos: game.position + 5 }) },
            { id: 'p04', name: '자비의 턴', cond: (p,d,t) => t===game.maxTurns && d<=2, fx: () => ({ addTurns: 2 }) },
            { id: 'p05', name: '황금 주사위', cond: (p,d,t) => p<=1 && d>=5, fx: () => ({ newDice: { min:4, max:6, name:'황금 주사위', type:'golden' }}) },
            { id: 'p06', name: '지름길', cond: (p,d,t) => p>=1 && p<=6 && d<=4, fx: () => ({ bonus: 3 }) },
            { id: 'p07', name: '행운의 별', cond: (p,d,t) => p<=6 && d<=2 && t<=3, fx: () => ({ lucky: true }) },
            { id: 'p08', name: '스프링 보드', cond: (p,d,t) => p>=1 && p<=5 && d>=4, fx: d => ({ bonus: d }) },
            { id: 'p09', name: '요정의 가루', cond: (p,d,t) => p<=3 && d<=3, fx: () => ({ nextBonus: 2 }) },
            { id: 'p10', name: '마법 포털', cond: (p,d,t) => p===3 && d===3, fx: () => ({ setPos: 6 }), choices: true },
            { id: 'p11', name: '갬블러 주사위', cond: (p,d,t) => p===4 && d<=2, fx: () => ({ newDice: { min:1, max:8, name:'갬블러 주사위', type:'gambler' }}) },
            { id: 'p12', name: '축복의 비', cond: (p,d,t) => p<=2 && t===1, fx: () => ({ moveBonus: 2 }) },
            { id: 'p13', name: '무지개 다리', cond: (p,d,t) => p===5 && d===5, fx: () => ({ setPos: 9 }) },
            { id: 'p14', name: '주사위 업그레이드', cond: (p,d,t) => p<=3 && game.totalRolls>=3, fx: () => ({ newDice: { min:2, max:6, name:'업그레이드 주사위', type:'up' }}) },
            { id: 'p15', name: '부활 부적', cond: (p,d,t) => p<=2 && d===2, fx: () => ({ shield: 1 }) },
            { id: 'p16', name: '행운의 네잎클로버', cond: (p,d,t) => p<=4 && Math.random()<0.1, fx: () => ({ bonus: 4 }) },
            { id: 'p17', name: '천사의 날개', cond: (p,d,t) => t===1 && d>=4, fx: () => ({ bonus: 3 }) },
            { id: 'p18', name: '복주머니', cond: (p,d,t) => p===0 && t<=2, fx: () => ({ moveBonus: 3 }) },
            { id: 'p19', name: '별똥별', cond: (p,d,t) => p<=5 && t>=3 && d<=2, fx: () => ({ bonus: 3 }) },
            { id: 'p20', name: '마법 카펫', cond: (p,d,t) => p>=2 && p<=4 && d===6, fx: () => ({ bonus: game.r(1,4) }) }
        ],
        neutral: [
            { id: 'n01', name: '무반응', cond: (p,d,t) => d===3, fx: () => ({}) },
            { id: 'n02', name: '수수께끼의 상자', cond: (p,d,t) => d===4 && p>=3 && p<=8, fx: () => game.mysteryBox(), choices: true },
            { id: 'n03', name: '주사위 상점', cond: (p,d,t) => p===5 && t>=2, fx: () => ({ newDice: { min:1, max:3, name:'소심 주사위', type:'small' }}), choices: true },
            { id: 'n04', name: '거울의 주사위', cond: (p,d,t) => d===4, fx: d => ({ changeDice: 7-d }) },
            { id: 'n05', name: '순간이동 스테이션', cond: (p,d,t) => p===6 && (d===3||d===4), fx: () => ({ setPos: 2 }), choices: true },
            { id: 'n06', name: '가챠 머신', cond: (p,d,t) => p>=4 && p<=7 && d>=4, fx: () => game.gacha() },
            { id: 'n07', name: '날씨 예보', cond: (p,d,t) => t===3 && p>=4 && p<=8, fx: () => game.weather() },
            { id: 'n08', name: '기억 테스트', cond: (p,d,t) => p===7 && d===5, fx: () => ({ repeatLast: true }) },
            { id: 'n09', name: '동전 던지기', cond: (p,d,t) => p===4, fx: () => Math.random()<0.5 ? { bonus: 2 } : {} },
            { id: 'n10', name: '미니룰렛', cond: (p,d,t) => p>=3 && p<=6 && t>=2, fx: () => game.miniRoulette() },
            { id: 'n11', name: '퀴즈', cond: (p,d,t) => p===5 && t===2, fx: () => Math.random()<0.5 ? { bonus: 2 } : { pushBack: 1 } },
            { id: 'n12', name: '요술거울', cond: (p,d,t) => p>=5 && p<=8 && d===3, fx: () => Math.random()<0.5 ? { reverse: true } : {} },
            { id: 'n13', name: '신비의 크리스탈', cond: (p,d,t) => p===6 && t>=2, fx: () => ({ reveal: true }) },
            { id: 'n14', name: '주사위 병원', cond: (p,d,t) => p===4 && game.currentDice.type!=='normal', fx: () => ({ newDice: { min:1, max:6, name:'기본 주사위', type:'normal' }}), choices: true },
            { id: 'n15', name: '복불복 박스', cond: (p,d,t) => p>=4 && p<=8 && t>=2, fx: () => Math.random()<0.5 ? { bonus: 3 } : { pushBack: 2 } },
            { id: 'n16', name: '숫자 카드', cond: (p,d,t) => p===7, fx: () => Math.random()<0.5 ? { nextBonus: 1 } : { nextBonus: -1 } },
            { id: 'n17', name: '시간 정지', cond: (p,d,t) => t===3 && p>=5 && p<=7, fx: () => ({ noTurnCount: true }) },
            { id: 'n18', name: '행운의 바람개비', cond: (p,d,t) => p===3 && d===3, fx: () => ({ doubleNext: true }) },
            { id: 'n19', name: '주사위 카지노', cond: (p,d,t) => p===6 && t>=3, fx: () => game.lastDiceValue%2===0 ? { bonus: 2 } : { pushBack: 1 } },
            { id: 'n20', name: '신비의 숫자', cond: (p,d,t) => d===t, fx: () => ({ bonus: game.turn }) }
        ],
        negative: [
            { id: 'e01', name: '기본 망치', cond: (p,d,t) => p>=4 && d>=4 && p<10, fx: () => ({ newDice: { min:1, max:4, name:'깨진 주사위', type:'broken' }}) },
            { id: 'e02', name: '1~3 조항', cond: (p,d,t) => p>=5 && p<=10 && d>=4, fx: () => ({ newDice: { min:1, max:3, name:'제한 주사위', type:'limited' }}) },
            { id: 'e03', name: '마이너스 함정', cond: (p,d,t) => p>=7 && p<=10 && d>=4, fx: () => ({ forceNext: { min:-3, max:-1, name:'마이너스 주사위', type:'minus' }}) },
            { id: 'e04', name: '바람 폭풍', cond: (p,d,t) => p>=6 && p<=11 && d>=3, fx: () => ({ miniGame: 'tap' }) },
            { id: 'e05', name: '지진', cond: (p,d,t) => p>=7 && d>=4, fx: () => ({ pushBack: 3, shake: true }) },
            { id: 'e06', name: '블랙홀', cond: (p,d,t) => p>=8 && t>=2, fx: () => ({ pushBack: 7 }) },
            { id: 'e07', name: '골이 도망', cond: (p,d,t) => game.goalPosition-p<=3 && d>=4, fx: () => ({ moveGoal: game.goalPosition+5 }) },
            { id: 'e08', name: '골 실종', cond: (p,d,t) => game.goalPosition-p<=1 && d>=3, fx: () => ({ hideGoal: true, addTurns: 1 }) },
            { id: 'e09', name: '시간 역행', cond: (p,d,t) => t>=4 && p>=6, fx: () => ({ setPos: Math.max(0, game.position-game.r(4,6)) }) },
            { id: 'e10', name: '주사위 포식', cond: (p,d,t) => p>=11 && d>=5, fx: () => ({ skipTurns: 1 }) },
            { id: 'e11', name: '끈적한 바닥', cond: (p,d,t) => p>=8 && d>=3 && d<=5, fx: () => ({ halfMove: true }) },
            { id: 'e12', name: '얼음 바닥', cond: (p,d,t) => p>=7 && d>=4, fx: () => ({ extraSlide: game.r(1,3) }) },
            { id: 'e13', name: '함정 문', cond: (p,d,t) => p>=9 && d===6, fx: () => ({ pushBack: 3 }) },
            { id: 'e14', name: '중력 반전', cond: (p,d,t) => p>=10 && d>=5, fx: () => ({ reverseMove: true }) },
            { id: 'e15', name: '짙은 안개', cond: (p,d,t) => p>=8 && t>=3, fx: () => ({ hidden: true }) },
            { id: 'e16', name: '역주행 길', cond: (p,d,t) => p>=6 && d>=5, fx: () => ({ reverseMode: 2 }) },
            { id: 'e17', name: '번개', cond: (p,d,t) => p>=9 && d===6, fx: () => ({ newDice: { min:1, max:2, name:'충격 주사위', type:'shocked' }}) },
            { id: 'e18', name: '스파이크 함정', cond: (p,d,t) => p>=8 && d>=5, fx: () => ({ pushBack: 2, newDice: { min:1, max:3, name:'작은 주사위', type:'small' }}) },
            { id: 'e19', name: '달팽이 저주', cond: (p,d,t) => p>=7 && d>=4 && t>=2, fx: d => ({ changeDice: Math.max(1,d-2) }) },
            { id: 'e20', name: '사막의 모래', cond: (p,d,t) => p>=8 && d>=4, fx: d => ({ changeDice: d-1 }) },
            { id: 'e21', name: '폭설', cond: (p,d,t) => p>=9 && t>=3, fx: () => ({ movePenalty: 2 }) },
            { id: 'e22', name: '화산 폭발', cond: (p,d,t) => p>=10 && d>=5, fx: () => ({ pushBack: 5 }) },
            { id: 'e23', name: '심연', cond: (p,d,t) => p>=9 && d===6 && t>=3, fx: () => ({ pushBack: 4 }) },
            { id: 'e24', name: '혼란의 미로', cond: (p,d,t) => p>=8 && d>=4, fx: () => ({ setPos: game.r(0,8) }) },
            { id: 'e25', name: '저주의 돌', cond: (p,d,t) => p>=7 && d>=5, fx: () => ({ newDice: { min:1, max:1, name:'저주 돌', type:'cursed' }}) },
            { id: 'e26', name: '독 구름', cond: (p,d,t) => p>=9 && t>=3, fx: () => ({ skipTurns: 1 }) },
            { id: 'e27', name: '낙석', cond: (p,d,t) => p>=8 && d>=5, fx: () => ({ pushBack: 2 }) },
            { id: 'e28', name: '수렁', cond: (p,d,t) => p>=7 && d>=4, fx: () => ({ halfMove: true }) },
            { id: 'e29', name: '가시 덤불', cond: (p,d,t) => p>=8 && d>=3, fx: () => ({ pushBack: 1, newDice: { min:1, max:4, name:'가시 주사위', type:'thorn' }}) },
            { id: 'e30', name: '번개 폭풍', cond: (p,d,t) => p>=10 && d>=5, fx: () => ({ miniGame: 'tap' }) },
            { id: 'e31', name: '거미줄', cond: (p,d,t) => p>=6 && d>=4, fx: d => ({ changeDice: Math.max(1,d-2) }) },
            { id: 'e32', name: '안개 늪', cond: (p,d,t) => p>=7 && t>=2, fx: () => ({ setPos: Math.max(0, game.position-3) }) },
            { id: 'e33', name: '화염 구덩이', cond: (p,d,t) => p>=8 && d>=4, fx: () => ({ pushBack: 3 }) },
            { id: 'e35', name: '모래 폭풍', cond: (p,d,t) => p>=7 && d>=5, fx: () => ({ pushBack: 2 }) },
            { id: 'e36', name: '유령의 손길', cond: (p,d,t) => p>=10 && t>=3, fx: () => ({ pushBack: game.r(2,4) }) },
            { id: 'e37', name: '어둠의 터널', cond: (p,d,t) => p>=8 && d>=4, fx: () => ({ blind: 2 }) },
            { id: 'e38', name: '지뢰', cond: (p,d,t) => p>=9 && d===6, fx: () => ({ pushBack: 4 }) },
            { id: 'e40', name: '역습', cond: (p,d,t) => p>=10 && d>=4 && t>=4, fx: () => ({ pushBack: 5 }) }
        ],
        despair: [
            { id: 'd01', name: '우회로 생성', cond: (p,d,t) => p+d>game.goalPosition && !game.extendedGoal, fx: () => ({ extendGoal: true }) },
            { id: 'd02', name: '함정 도로', cond: (p,d,t) => p>=10 && t===game.maxTurns, fx: () => ({ pushBackPerTurn: 1 }) },
            { id: 'd03', name: '저주 주사위', cond: (p,d,t) => game.goalPosition-p<=2 && d>=2, fx: () => ({ newDice: { min:0, max:0, name:'저주 주사위', type:'cursed' }}) },
            { id: 'd04', name: '개발자 피로', cond: (p,d,t) => t>=game.maxTurns-1 && p>=10, fx: () => ({ pause: 3 }) },
            { id: 'd05', name: '최종 보스', cond: (p,d,t) => game.goalPosition-p<=3 && d>=3, fx: () => ({ miniGame: 'boss' }) },
            { id: 'd06', name: '거울 미로', cond: (p,d,t) => game.goalPosition-p<=3 && d>=3, fx: () => ({ setPos: game.r(0,10) }) },
            { id: 'd07', name: '시간 왜곡', cond: (p,d,t) => game.goalPosition-p<=2 && t>=3, fx: () => ({ resetTurn: true }) },
            { id: 'd08', name: '골 보호막', cond: (p,d,t) => game.goalPosition-p===1 && d>=3, fx: () => ({ goalShield: 2 }) },
            { id: 'd09', name: '불가능의 벽', cond: (p,d,t) => game.goalPosition-p<=3 && d>=4, fx: () => ({ newDice: { min:0, max:1, name:'벽 주사위', type:'wall' }}) },
            { id: 'd10', name: '운명의 룰렛', cond: (p,d,t) => game.goalPosition-p<=1 && t>=4, fx: () => Math.random()<1/6 ? { setPos: game.goalPosition } : { setPos: 0 } },
            { id: 'd11', name: '무한 회랑', cond: (p,d,t) => p>=11 && d>=4, fx: () => ({ setPos: game.position }) },
            { id: 'd12', name: '최후의 시련', cond: (p,d,t) => game.goalPosition-p===1 && t===game.maxTurns, fx: () => ({ miniGame: 'timing', bonus: 0, mustWin: true }) }
        ],
        special: [
            { id: 's01', name: '럭키 7', cond: (p,d,t) => p===7 && d===1, fx: () => ({ setPos: 10 }), choices: true },
            { id: 's02', name: '완벽한 타이밍', cond: (p,d,t) => t===3 && p===6, fx: () => ({ miniGame: 'timing', bonus: 4 }) },
            { id: 's03', name: '주사위 융합', cond: (p,d,t) => game.eventHistory.length>=3 && d===5, fx: () => ({ newDice: { values:[1,2,3,4,5,6,7,8], name:'융합 주사위', type:'fusion' }}) },
            { id: 's04', name: '주사위 분신', cond: (p,d,t) => d===6 && Math.random()<0.2, fx: () => ({ extraRolls: 2 }) },
            { id: 's05', name: '턴 복권', cond: (p,d,t) => t===2 && d===2, fx: () => Math.random()<0.5 ? { addTurns: 3 } : { pushBack: 2 } },
            { id: 's06', name: '미스터리 텔레포트', cond: (p,d,t) => p===4 && t===4, fx: () => ({ setPos: game.r(2,12) }) },
            { id: 's07', name: '더블 오어 낫락', cond: (p,d,t) => t===game.maxTurns && p>=8, fx: () => Math.random()<0.5 ? { setPos: game.goalPosition } : { setPos: 0 } },
            { id: 's08', name: '행운의 숫자', cond: (p,d,t) => p===d && d<=5, fx: d => ({ bonus: d }) },
            { id: 's09', name: '주사위 파손', cond: (p,d,t) => d>=5 && p>=3 && Math.random()<0.15, fx: () => ({ changeDice: 0, newDice: Math.random() < 0.5 ? { min:1, max:3, name:'부서진 조각(1~3)', type:'broken_low' } : { min:4, max:6, name:'날카로운 파편(4~6)', type:'broken_high' }}) },
            { id: 's10', name: '연마된 주사위', cond: (p,d,t) => p<=2 && d<=2 && Math.random()<0.2, fx: () => ({ newDice: { min:3, max:5, name:'연마된 주사위(3~5)', type:'refined' }}) },
            { id: 's11', name: '무거운 주사위', cond: (p,d,t) => t>=3 && d>=4 && Math.random()<0.1, fx: () => ({ newDice: { min:1, max:2, name:'무거운 주사위(1~2)', type:'heavy' }}) },
            { id: 's12', name: '경량 주사위', cond: (p,d,t) => p<=4 && t<=2 && Math.random()<0.1, fx: () => ({ newDice: { min:5, max:6, name:'경량 주사위(5~6)', type:'light' }}) }
        ],
        early: [
            { id: 'r01', name: '시작의 저주', cond: (p,d,t) => p<=1 && t<=2 && d<=3, fx: () => ({ turnConsume: true, noMove: true }) },
            { id: 'r02', name: '배웅 없는 출발', cond: (p,d,t) => p===0 && d>=5, fx: () => ({ nextBonus: -2 }) },
            { id: 'r03', name: '미끄러운 시작선', cond: (p,d,t) => p<=2 && d>=3, fx: () => ({ pushBack: 1 }) },
            { id: 'r04', name: '의심의 그림자', cond: (p,d,t) => p<=2 && t===1, fx: () => ({ nextMax: 5 }) },
            { id: 'r05', name: '잃어버린 약속', cond: (p,d,t) => p<=3 && t<=2 && d===2, fx: () => ({ skipTurns: 0, noMove: true }) },
            { id: 'r06', name: '지연의 안개', cond: (p,d,t) => p<=2 && t>=2 && d<=2, fx: () => ({ nextDiceLimit: { min:1, max:4 } }) },
            { id: 'r07', name: '첫발의 주저', cond: (p,d,t) => p===0 && t===2, fx: () => ({ nextBonus: -1 }) },
            { id: 'r08', name: '거짓 지름길', cond: (p,d,t) => p===2 && d===6, fx: () => ({ pushBack: 3 }) },
            { id: 'r09', name: '주사위 녹슴', cond: (p,d,t) => p<=3 && game.totalRolls===1 && d<=3, fx: () => ({ nextMax: 4 }) },
            { id: 'r10', name: '느린 시작', cond: (p,d,t) => p<=1 && t>=2 && d<=2, fx: () => ({ turnConsume: true }) }
        ],
        turnPressure: [
            { id: 't01', name: '모래시계 역전', cond: (p,d,t) => t>=3 && p<=6 && d>=5, fx: () => ({ subtractTurns: 1 }) },
            { id: 't02', name: '새로고침', cond: (p,d,t) => t>=2 && p>=4 && d===1, fx: () => ({ setPos: game.position }) },
            { id: 't03', name: '턴 도난', cond: (p,d,t) => t>=3 && p>=8 && d>=4, fx: () => ({ subtractTurns: 1 }) },
            { id: 't04', name: '타임오버 경고', cond: (p,d,t) => t===game.maxTurns-1 && game.goalPosition-p>=3, fx: () => ({ lastTurnLimit: 3 }) },
            { id: 't05', name: '시간의 구멍', cond: (p,d,t) => t>=2 && d===6 && p>=5, fx: () => ({ extraTurnConsume: 1 }) },
            { id: 't06', name: '미래 빚', cond: (p,d,t) => t<=2 && p<=4 && d>=5, fx: () => ({ nextBonus: -2, nextBonus2: -2 }) },
            { id: 't07', name: '턴 역전', cond: (p,d,t) => t===game.maxTurns && p<10, fx: () => ({ pushBack: 2 }) },
            { id: 't08', name: '초시계 멈춤', cond: (p,d,t) => t>=4 && d<=2, fx: () => ({ noMove: true }) },
            { id: 't09', name: '데드라인 축소', cond: (p,d,t) => t>=3 && p>=6 && d>=5, fx: () => ({ extendGoal: 1 }) },
            { id: 't10', name: '서두름의 대가', cond: (p,d,t) => t>=3 && p>=6 && d>=4, fx: () => ({ pushBack: 2 }) },
            { id: 't11', name: '최후통지', cond: (p,d,t) => t===game.maxTurns-1 && d<=2, fx: () => ({ mustSix: true }) },
            { id: 't12', name: '시간 폭탄', cond: (p,d,t) => t<=2 && p<=3 && d===1, fx: () => ({ timeBomb: 3 }) }
        ],
        curse: [
            { id: 'c01', name: '무거운 발걸음', cond: (p,d,t) => p>=4 && d<=2, fx: () => ({ movePenalty: 3 }) },
            { id: 'c02', name: '저주받은 주사위', cond: (p,d,t) => game.totalRolls>=5 && d===1, fx: () => ({ diceOdd: true }) },
            { id: 'c03', name: '역주행 징조', cond: (p,d,t) => p>=6 && d<=3, fx: () => ({ reverseNext: true }) },
            { id: 'c04', name: '마법 억제', cond: (p,d,t) => p>=5 && t>=2 && d<=2, fx: () => ({ blockPositive: 3 }) },
            { id: 'c05', name: '불안정 주사위', cond: (p,d,t) => game.totalRolls>=4 && d>=5, fx: () => ({ unstableDice: true }) },
            { id: 'c06', name: '위축', cond: (p,d,t) => p>=7 && d>=4, fx: () => ({ nextMax: 4 }) },
            { id: 'c07', name: '망각의 안개', cond: (p,d,t) => p>=5 && t>=3 && d<=2, fx: () => ({ hidden: 2 }) },
            { id: 'c08', name: '불행의 사슬', cond: (p,d,t) => p>=6 && d>=4 && t>=2, fx: () => ({ forceNegative: true }) },
            { id: 'c09', name: '주사위 부식', cond: (p,d,t) => game.totalRolls>=6 && d>=3, fx: () => ({ diceDecay: true }) },
            { id: 'c10', name: '운명의 빚', cond: (p,d,t) => p>=8 && t>=3 && d<=3, fx: () => ({ debtMode: true }) }
        ],
        blocker: [
            { id: 'b01', name: '골인저부', cond: (p,d,t) => game.goalPosition-p<=7, fx: () => ({ pushBack: 7 }) },
            { id: 'b02', name: '마지막 관문', cond: (p,d,t) => game.goalPosition-p<=6, fx: () => ({ pushBack: 6, newDice: { min:1, max:2, name:'무거운 주사위', type:'heavy' }}) },
            { id: 'b03', name: '승리의 미끄럼', cond: (p,d,t) => game.goalPosition-p<=4 && p>=8, fx: () => ({ exactOnly: true }) },
            { id: 'b04', name: '감시의 눈', cond: (p,d,t) => p>=6 && d>=1 && t>=2, fx: () => ({ oddPushback: 2 }) },
            { id: 'b05', name: '피니쉬 라인 이동', cond: (p,d,t) => game.goalPosition-p<=6, fx: () => ({ extendGoal: 7 }) },
            { id: 'b06', name: '최종 테스트', cond: (p,d,t) => game.goalPosition-p<=4 && t>=2, fx: () => ({ miniGame: 'tap' }) },
            { id: 'b07', name: '거의 다 왔는데', cond: (p,d,t) => game.goalPosition-p<=6, fx: () => ({ pushBack: 8 }) },
            { id: 'b08', name: '승리 조건 추가', cond: (p,d,t) => p>=7 && t>=2, fx: () => ({ oddWinOnly: true }) },
            { id: 'b09', name: '벽', cond: (p,d,t) => game.goalPosition-p<=5, fx: () => ({ pushBack: 10 }) },
            { id: 'b10', name: '시간 압박', cond: (p,d,t) => game.goalPosition-p<=6 && t>=2, fx: () => ({ turnConsume: true }) }
        ],
        bypass: [
            { id: 'bp01', name: '블랙홀', cond: () => true, fx: () => ({ pushBack: 8 }) },
            { id: 'bp02', name: '화염구덩이', cond: () => true, fx: () => ({ pushBack: 5 }) },
            { id: 'bp03', name: '우회의 저주', cond: () => true, fx: () => ({ pushBack: 4 }) },
            { id: 'bp04', name: '순환 정체', cond: () => true, fx: () => ({ addTurns: 2 }) },
            { id: 'bp05', name: '미로', cond: () => true, fx: () => ({ setPos: Math.max(12, game.position - 5) }) },
            { id: 'bp06', name: '순환 역행', cond: () => true, fx: () => ({ pushBack: 3 }) },
            { id: 'bp07', name: '지진', cond: () => true, fx: () => ({ pushBack: 6 }) },
            { id: 'bp08', name: '낙석', cond: () => true, fx: () => ({ pushBack: 4 }) },
            { id: 'bp09', name: '심연', cond: () => true, fx: () => ({ pushBack: 10 }) },
            { id: 'bp10', name: '돌풍', cond: () => true, fx: () => ({ pushBack: 7 }) }
        ]
    };
}

// 테스트 함수
function testEvents() {
    const game = new MockGame();
    const lib = getEventLibrary(game);
    
    console.log('='.repeat(60));
    console.log('12-DICE 이벤트 테스트 보고서');
    console.log('='.repeat(60));
    console.log('');
    
    const results = {
        total: 0,
        passed: 0,
        failed: 0,
        errors: []
    };
    
    const categories = Object.keys(lib);
    
    for (const cat of categories) {
        console.log(`\n📦 ${cat.toUpperCase()} (${lib[cat].length}개)`);
        console.log('-'.repeat(40));
        
        for (const event of lib[cat]) {
            results.total++;
            
            try {
                // 조건 함수 테스트
                const condStr = event.cond.toString();
                const fxStr = event.fx.toString();
                
                // 다양한 상황에서 조건 테스트
                const testCases = [
                    { pos: 0, dice: 1, turn: 1, rolls: 1 },
                    { pos: 5, dice: 3, turn: 3, rolls: 3 },
                    { pos: 10, dice: 6, turn: 5, rolls: 5 },
                    { pos: 11, dice: 6, turn: 5, rolls: 5 }
                ];
                
                let triggered = false;
                let triggerCount = 0;
                
                for (const tc of testCases) {
                    game.setState(tc.pos, tc.turn, tc.dice, tc.rolls);
                    if (event.cond(tc.pos, tc.dice, tc.turn)) {
                        triggered = true;
                        triggerCount++;
                    }
                }
                
                // 효과 함수 실행 테스트
                game.setState(5, 3, 3, 3);
                const result = typeof event.fx === 'function' ? event.fx(3) : event.fx;
                
                // 결과 검증
                if (result === undefined || result === null) {
                    results.failed++;
                    results.errors.push({
                        id: event.id,
                        name: event.name,
                        error: '효과 함수가 undefined 반환'
                    });
                    console.log(`  ❌ ${event.id}: ${event.name} - 효과 undefined`);
                } else {
                    results.passed++;
                    const effectKeys = Object.keys(result).join(', ');
                    console.log(`  ✅ ${event.id}: ${event.name} - [${effectKeys}]`);
                }
                
            } catch (err) {
                results.failed++;
                results.errors.push({
                    id: event.id,
                    name: event.name,
                    error: err.message
                });
                console.log(`  ❌ ${event.id}: ${event.name} - ERROR: ${err.message}`);
            }
        }
    }
    
    // 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 테스트 요약');
    console.log('='.repeat(60));
    console.log(`총 이벤트: ${results.total}`);
    console.log(`✅ 통과: ${results.passed}`);
    console.log(`❌ 실패: ${results.failed}`);
    console.log(`통과율: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    
    if (results.errors.length > 0) {
        console.log('\n⚠️ 실패한 이벤트:');
        for (const e of results.errors) {
            console.log(`  - ${e.id} (${e.name}): ${e.error}`);
        }
    }
    
    return results;
}

// 조건 검증 테스트
function testSpecificConditions() {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 특정 조건 검증 테스트');
    console.log('='.repeat(60));
    
    const game = new MockGame();
    const lib = getEventLibrary(game);
    
    const tests = [
        // 긍정적 이벤트
        { desc: 'p01 용기 북돋우기: 위치5, 주사위2', pos: 5, dice: 2, turn: 1, expect: 'p01' },
        { desc: 'p03 천국의 축복: 턴3, 위치2', pos: 2, dice: 3, turn: 3, expect: 'p03' },
        { desc: 'p04 자비의 턴: 마지막턴, 주사위1', pos: 5, dice: 1, turn: 5, expect: 'p04' },
        { desc: 'p05 황금 주사위: 위치0, 주사위6', pos: 0, dice: 6, turn: 1, expect: 'p05' },
        
        // 부정적 이벤트
        { desc: 'e01 기본 망치: 위치5, 주사위5', pos: 5, dice: 5, turn: 2, expect: 'e01' },
        { desc: 'e06 블랙홀: 위치8, 턴2', pos: 8, dice: 3, turn: 2, expect: 'e06' },
        { desc: 'e22 화산 폭발: 위치10, 주사위6', pos: 10, dice: 6, turn: 3, expect: 'e22' },
        
        // blocker 이벤트
        { desc: 'b01 골인저부: 골까지5', pos: 7, dice: 3, turn: 3, expect: 'b01' },
        { desc: 'b09 벽: 골까지3', pos: 9, dice: 2, turn: 4, expect: 'b09' },
        
        // early 이벤트
        { desc: 'r01 시작의 저주: 위치0, 턴1, 주사위2', pos: 0, dice: 2, turn: 1, expect: 'r01' },
        { desc: 'r08 거짓 지름길: 위치2, 주사위6', pos: 2, dice: 6, turn: 1, expect: 'r08' }
    ];
    
    for (const test of tests) {
        game.setState(test.pos, test.turn, test.dice, 3);
        game.eventHistory = [];
        
        const all = [...lib.positive, ...lib.negative, ...lib.despair, ...lib.special, 
                     ...lib.early, ...lib.turnPressure, ...lib.curse, ...lib.blocker];
        
        const matching = all.filter(e => {
            try {
                return e.cond(test.pos, test.dice, test.turn);
            } catch { return false; }
        });
        
        const found = matching.find(e => e.id === test.expect);
        const status = found ? '✅' : '❌';
        console.log(`${status} ${test.desc}`);
        if (!found && matching.length > 0) {
            console.log(`   → 매칭된 이벤트: ${matching.map(e => e.id).join(', ')}`);
        }
    }
}

// 실행
console.log('\n🚀 이벤트 테스트 시작...\n');
const results = testEvents();
testSpecificConditions();
console.log('\n✨ 테스트 완료!\n');