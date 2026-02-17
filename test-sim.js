// 12-DICE 시뮬레이션 테스트 v3
// 수정: 정확히 12칸에 도착해야 승리 (초과 시 제자리)

const r = (min, max) => Math.floor(Math.random() * (min, max + 1)) + min;

// 이벤트 라이브러리 (조건 완화)
const events = {
  positive: [
    { id: 'p01', name: '용기 북돋우기', icon: '✨', check: (p,d,t) => p<=7 && d<=4, fx: () => ({ bonus: r(1,3), msg: '+1~3칸 보너스!' })},
    { id: 'p05', name: '황금 주사위', icon: '🪙', check: (p,d,t) => p<=2 && d>=4, fx: () => ({ newMax: 6, msg: '주사위 4~6!' })},
    { id: 'p16', name: '행운의 네잎클로버', icon: '🍀', check: (p,d,t) => p<=7 && d<=3, fx: () => ({ bonus: r(2,4), msg: '+2~4칸!' })},
    { id: 'p19', name: '별똥별', icon: '🌠', check: (p,d,t) => t>=2 && d<=3, fx: () => ({ bonus: 3, msg: '+3칸!' })},
  ],
  neutral: [
    { id: 'n01', name: '무반응', icon: '😐', check: (p,d,t) => true, fx: () => ({ msg: '아무 일 없음' })},
    { id: 'n09', name: '동전 던지기', icon: '🪙', check: (p,d,t) => p>=2 && p<=7, fx: () => Math.random()<0.5 ? { bonus: 2, msg: '앞! +2칸' } : { noMove: true, msg: '뒤! 제자리' }},
  ],
  negative: [
    { id: 'e01', name: '기본 망치', icon: '🔨', check: (p,d,t) => p>=3 && d>=3 && p<10, fx: () => ({ newMax: 3, msg: '주사위 1~3로!' })},
    { id: 'e05', name: '지진', icon: '🌋', check: (p,d,t) => p>=6 && d>=3, fx: () => ({ pushBack: 3, msg: '3칸 후퇴!' })},
    { id: 'e06', name: '블랙홀', icon: '🕳️', check: (p,d,t) => p>=7 && t>=1, fx: () => ({ pushBack: 6, msg: '블랙홀! 6칸 후퇴!' })},
    { id: 'e13', name: '함정 문', icon: '🪤', check: (p,d,t) => p>=6 && d>=3, fx: () => ({ pushBack: 4, msg: '4칸 후퇴!' })},
    { id: 'e27', name: '낙석', icon: '🪨', check: (p,d,t) => p>=5 && d>=2, fx: () => ({ pushBack: 3, msg: '3칸 후퇴!' })},
    { id: 'e31', name: '거미줄', icon: '🕸️', check: (p,d,t) => p>=3 && d>=2, fx: () => ({ moveReduce: 3, msg: '이동 -3!' })},
    { id: 'e33', name: '화염 구덩이', icon: '🔥🕳️', check: (p,d,t) => p>=6 && d>=2, fx: () => ({ pushBack: 4, msg: '4칸 후퇴!' })},
  ],
  despair: [
    { id: 'd01', name: '우회로 생성', icon: '🚧', check: (p,d,t) => p+d>12, fx: () => ({ extendGoal: true, msg: '골→18칸!' })},
    { id: 'd05', name: '최종 보스', icon: '🎮', check: (p,d,t) => (12-p)<=5, fx: () => ({ tapGame: true, msg: '연타게임!' })},
  ],
  early: [
    { id: 'r01', name: '시작의 저주', icon: '👻', check: (p,d,t) => p<=2 && t<=2 && d<=4, fx: () => ({ noMove: true, msg: '이동 없이 턴 소모!' })},
    { id: 'r03', name: '미끄러운 시작선', icon: '🧊', check: (p,d,t) => p<=3 && d>=3, fx: () => ({ pushBack: 1, msg: '1칸 뒤로!' })},
    { id: 'r08', name: '거짓 지름길', icon: '🚧', check: (p,d,t) => p>=1 && p<=4 && d>=4, fx: () => ({ pushBack: 3, msg: '3칸 뒤로!' })},
  ],
  turnPressure: [
    { id: 't01', name: '모래시계 역전', icon: '⏳', check: (p,d,t) => t>=2 && p<=9 && d>=2, fx: () => ({ subTurn: 1, msg: '턴 1개 감소!' })},
    { id: 't10', name: '서두름의 대가', icon: '🏃💨', check: (p,d,t) => t>=2 && p>=3 && d>=2, fx: () => ({ pushBack: 3, msg: '3칸 후퇴!' })},
  ],
  curse: [
    { id: 'c01', name: '무거운 발걸음', icon: '🥾', check: (p,d,t) => p>=2 && d<=4, fx: () => ({ penalty: 2, msg: '다음 이동 -2!' })},
    { id: 'c06', name: '위축', icon: '😰', check: (p,d,t) => p>=4 && d>=2, fx: () => ({ nextMax: 3, msg: '다음 주사위 max 3!' })},
  ],
  blocker: [
    { id: 'b01', name: '골인저부', icon: '🛑', check: (p,d,t) => (12-p)<=5, fx: () => ({ pushBack: 4, msg: '4칸 후퇴!' })},
    { id: 'b02', name: '마지막 관문', icon: '🚪🔒', check: (p,d,t) => (12-p)<=4, fx: () => ({ pushBack: 3, newMax: 2, msg: '관문 잠김! 3칸 후퇴+주사위1~2!' })},
    { id: 'b03', name: '승리의 미끄럼', icon: '🏆', check: (p,d,t) => (12-p)<=4 && d>=2, fx: () => ({ exactOnly: true, msg: '초과하면 제자리!' })},
    { id: 'b07', name: '거의 다 왔는데', icon: '😫', check: (p,d,t) => (12-p)<=5 && d>=2, fx: () => ({ pushBack: 5, msg: '5칸 후퇴!' })},
    { id: 'b08', name: '승리 조건 추가', icon: '✅+', check: (p,d,t) => p>=7 && t>=1, fx: () => ({ oddWin: true, msg: '홀수로만 승리가능!' })},
  ]
};

function selectEvent(p, d, t) {
  const all = [...events.positive, ...events.neutral, ...events.negative, ...events.despair, ...events.early, ...events.turnPressure, ...events.curse, ...events.blocker];
  
  const baseChance = p <= 3 ? 0.85 : (p <= 6 ? 0.90 : (p <= 9 ? 0.95 : 0.98));
  if (Math.random() > baseChance) return null;
  
  const diceHigh = d >= 5;
  const diceLow = d <= 2;
  
  const weights = {
    positive: diceLow ? 0.15 : (diceHigh ? 0.02 : 0.05),
    neutral: 0.03,
    negative: diceHigh ? 0.70 : (diceLow ? 0.35 : 0.55),
    despair: p >= 8 ? 0.25 : 0.05,
    early: p <= 3 ? (diceHigh ? 0.45 : 0.30) : 0,
    turnPressure: t >= 2 ? (diceHigh ? 0.45 : 0.30) : 0,
    curse: p >= 2 ? (diceHigh ? 0.35 : 0.25) : 0,
    blocker: p >= 5 ? (diceHigh ? 0.55 : 0.40) : 0,
  };
  
  const matching = all.filter(e => {
    if (!e.check(p, d, t)) return false;
    const category = Object.keys(events).find(k => events[k].includes(e));
    if (weights[category] && Math.random() > weights[category]) return false;
    return true;
  });
  
  if (matching.length === 0) return null;
  return matching[Math.floor(Math.random() * matching.length)];
}

// 시뮬레이션 테스트 5회
console.log('='.repeat(50));
console.log('🎲 12-DICE 시뮬레이션 테스트 v3 (정확히 12칸 도착 필수)');
console.log('='.repeat(50));

let success = 0;

for (let test = 1; test <= 5; test++) {
  let position = 0;
  let turn = 1;
  const maxTurns = 5;
  let goal = 12;
  let diceMax = 6;
  let penalty = 0;
  let nextMaxBonus = 0;
  let oddWin = false;
  const logs = [];
  
  console.log('\n' + '-'.repeat(50));
  console.log(`📊 테스트 #${test}`);
  console.log('-'.repeat(50));
  
  while (turn <= maxTurns && position !== goal) {
    const roll = r(1, diceMax);
    let move = Math.max(0, roll - penalty);
    move = Math.min(move, diceMax);
    
    const event = selectEvent(position, roll, turn);
    
    if (event) {
      const fx = event.fx();
      let eventLog = `T${turn}: 🎲${roll}`;
      let newPos = position + move;
      
      if (fx.pushBack) {
        // pushBack: 이동 후 초과 시 제자리, 그 후 pushBack 적용
        let afterMove = position + move;
        if (afterMove > goal && goal === 12) {
          // 초과 시 제자리
          afterMove = position;
          eventLog += ` → ${event.icon} ${event.name}: ${fx.msg} [초과! 제자리에서 ${fx.pushBack}칸 후퇴]`;
          position = Math.max(0, afterMove - fx.pushBack);
          eventLog += ` [${position} → ${position}]`;
        } else {
          newPos = Math.max(0, afterMove - fx.pushBack);
          eventLog += ` → ${event.icon} ${event.name}: ${fx.msg}`;
          eventLog += ` [${position} → ${newPos}]`;
          position = newPos;
        }
      } else if (fx.setPos !== undefined) {
        position = fx.setPos;
        eventLog += ` → ${event.icon} ${event.name}: ${fx.msg} [→ ${position}]`;
      } else if (fx.bonus) {
        newPos = position + move + fx.bonus;
        // 초과 시 제자리
        if (newPos > goal && goal === 12) {
          eventLog += ` → ${event.icon} ${event.name}: ${fx.msg} [초과! 제자리]`;
        } else {
          eventLog += ` → ${event.icon} ${event.name}: ${fx.msg} [${position} → ${newPos}]`;
          position = newPos;
        }
      } else if (fx.noMove) {
        eventLog += ` → ${event.icon} ${event.name}: ${fx.msg}`;
        eventLog += ` [위치: ${position}]`;
      } else if (fx.newMax) {
        diceMax = fx.newMax;
        // 초과 시 제자리
        if (newPos > goal && goal === 12) {
          eventLog += ` → ${event.icon} ${event.name}: ${fx.msg} [초과! 제자리]`;
        } else {
          eventLog += ` → ${event.icon} ${event.name}: ${fx.msg} [${position} → ${newPos}]`;
          position = newPos;
        }
      } else if (fx.nextMax) {
        nextMaxBonus = fx.nextMax;
        if (newPos > goal && goal === 12) {
          eventLog += ` → ${event.icon} ${event.name}: ${fx.msg} [초과! 제자리]`;
        } else {
          eventLog += ` → ${event.icon} ${event.name}: ${fx.msg} [${position} → ${newPos}]`;
          position = newPos;
        }
      } else if (fx.oddWin) {
        oddWin = true;
        if (newPos > goal && goal === 12) {
          eventLog += ` → ${event.icon} ${event.name}: ${fx.msg} [초과! 제자리]`;
        } else {
          eventLog += ` → ${event.icon} ${event.name}: ${fx.msg} [${position} → ${newPos}]`;
          position = newPos;
        }
      } else if (fx.exactOnly) {
        if (newPos > goal) {
          eventLog += ` → ${event.icon} ${event.name}: ${fx.msg} [초과! 제자리]`;
        } else if (newPos === goal) {
          eventLog += ` → ${event.icon} ${event.name}: 정확히 도달! [${position} → ${newPos}]`;
          position = newPos;
        } else {
          eventLog += ` → ${event.icon} ${event.name}: ${fx.msg} [${position} → ${newPos}]`;
          position = newPos;
        }
      } else if (fx.extendGoal) {
        goal = 18;
        eventLog += ` → ${event.icon} ${event.name}: ${fx.msg}`;
        eventLog += ` [${position} → ${newPos}, 골: 18]`;
        position = newPos;
      } else if (fx.tapGame) {
        const win = Math.random() > 0.5;
        if (win) {
          if (newPos > goal && goal === 12) {
            eventLog += ` → ${event.icon} ${event.name}: 연타성공! [초과! 제자리]`;
          } else {
            eventLog += ` → ${event.icon} ${event.name}: 연타성공! [${position} → ${newPos}]`;
            position = newPos;
          }
        } else {
          eventLog += ` → ${event.icon} ${event.name}: 연타실패! [위치: ${position}]`;
        }
      } else if (fx.subTurn) {
        turn += fx.subTurn;
        if (newPos > goal && goal === 12) {
          eventLog += ` → ${event.icon} ${event.name}: ${fx.msg} [초과! 제자리]`;
        } else {
          eventLog += ` → ${event.icon} ${event.name}: ${fx.msg} [${position} → ${newPos}]`;
          position = newPos;
        }
      } else if (fx.moveReduce) {
        move = Math.max(0, move - fx.moveReduce);
        newPos = position + move;
        if (newPos > goal && goal === 12) {
          eventLog += ` → ${event.icon} ${event.name}: ${fx.msg} [초과! 제자리]`;
        } else {
          eventLog += ` → ${event.icon} ${event.name}: ${fx.msg} [${position} → ${newPos}]`;
          position = newPos;
        }
      } else {
        if (newPos > goal && goal === 12) {
          eventLog += ` → ${event.icon} ${event.name}: ${fx.msg || '효과 없음'} [초과! 제자리]`;
        } else {
          eventLog += ` → ${event.icon} ${event.name}: ${fx.msg || '효과 없음'} [${position} → ${newPos}]`;
          position = newPos;
        }
      }
      
      logs.push(eventLog);
    } else {
      // 이벤트 없음 - 초과 시 제자리
      if (position + move > goal) {
        logs.push(`T${turn}: 🎲${roll} → 초과! 제자리 [${position} → ${position}]`);
      } else {
        const newPos = position + move;
        logs.push(`T${turn}: 🎲${roll} → ${move}칸 이동 [${position} → ${newPos}]`);
        position = newPos;
      }
    }
    
    if (nextMaxBonus > 0 && turn < maxTurns) {
      diceMax = nextMaxBonus;
      nextMaxBonus = 0;
    }
    
    turn++;
    penalty = 0;
    
    // 홀수 승리 체크
    if (oddWin && position === goal) {
      if (move % 2 === 0) {
        logs.push(`⚠️ 홀수 조건 불충족! (짝수 ${move})`);
        position = position - move; // 롤백
      }
    }
    
    if (position === goal) break;
  }
  
  logs.forEach(l => console.log(l));
  
  console.log('-'.repeat(50));
  if (position === goal) {
    console.log(`✅ 성공! (${turn-1}턴 만에 클리어)`);
    success++;
  } else {
    console.log(`❌ 실패! (최종: ${position}/${goal}, 턴 ${turn-1}/${maxTurns})`);
  }
}

console.log('\n' + '='.repeat(50));
console.log(`📈 결과: ${success}/5 성공 (${(success/5*100)}%)`);
console.log('='.repeat(50));