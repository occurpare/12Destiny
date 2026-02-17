// 12-DICE 우회 루트 시뮬레이션 테스트 v6
// v6 버그 수정:
// 1. 경량 주사위 diceMin 적용
// 2. 거미줄 moveReduce → 실제 후퇴로 변경
// 3. 보너스 실제 값 표시

const r = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// 이벤트 라이브러리
const events = {
  positive: [
    { id: 'p01', name: '용기 북돋우기', icon: '✨', check: (p,d,t) => p<=7 && d<=4, fx: () => { const b=r(1,3); return { bonus: b, msg: `+${b}칸 보너스!` }; }},
    { id: 'p05', name: '황금 주사위', icon: '🪙', check: (p,d,t) => p<=2 && d>=4, fx: () => ({ newMin: 4, newMax: 6, msg: '주사위 4~6!' })},
    { id: 'p16', name: '행운의 네잎클로버', icon: '🍀', check: (p,d,t) => p<=7 && d<=3, fx: () => { const b=r(2,4); return { bonus: b, msg: `+${b}칸!` }; }},
    { id: 'p19', name: '별똥별', icon: '🌠', check: (p,d,t) => t>=2 && d<=3, fx: () => ({ bonus: 3, msg: '+3칸!' })},
  ],
  neutral: [
    { id: 'n01', name: '무반응', icon: '😐', check: (p,d,t) => Math.random() < 0.3, fx: () => ({ noMove: true, msg: '아무 일 없음' })},
    { id: 'n09', name: '동전 던지기', icon: '🪙', check: (p,d,t) => p>=2 && p<=7 && Math.random() < 0.3, fx: () => Math.random()<0.5 ? { bonus: 2, msg: '앞! +2칸' } : { noMove: true, msg: '뒤! 제자리' }},
  ],
  dice: [
    { id: 'dc01', name: '주사위 파손', icon: '💔', check: (p,d,t) => d>=5 && p>=3 && Math.random()<0.2, fx: () => {
      const newDice = Math.random() < 0.5 ? 3 : 6;
      return { changeDice: 0, newMax: newDice, msg: `주사위 부서짐! 0판정. 새 주사위(1~${newDice})` };
    }},
    { id: 'dc02', name: '연마된 주사위', icon: '✨🎲', check: (p,d,t) => p<=2 && d<=2 && Math.random()<0.3, fx: () => ({ newMin: 3, newMax: 5, msg: '3~5 주사위!' })},
    { id: 'dc03', name: '무거운 주사위', icon: '🪨🎲', check: (p,d,t) => t>=3 && d>=4, fx: () => ({ newMin: 1, newMax: 2, msg: '1~2 주사위!' })},
    { id: 'dc04', name: '경량 주사위', icon: '🎈🎲', check: (p,d,t) => p<=3 && t<=2, fx: () => ({ newMin: 5, newMax: 6, msg: '5~6 주사위!' })},
  ],
  negative: [
    { id: 'e01', name: '기본 망치', icon: '🔨', check: (p,d,t) => p>=3 && d>=3 && p<10, fx: () => ({ newMin: 1, newMax: 3, msg: '주사위 1~3로!' })},
    { id: 'e05', name: '지진', icon: '🌋', check: (p,d,t) => p>=6 && d>=3, fx: () => ({ pushBack: 3, msg: '3칸 후퇴!' })},
    { id: 'e06', name: '블랙홀', icon: '🕳️', check: (p,d,t) => p>=7 && t>=1, fx: () => ({ pushBack: 6, msg: '6칸 후퇴!' })},
    { id: 'e13', name: '함정 문', icon: '🪤', check: (p,d,t) => p>=6 && d>=3, fx: () => ({ pushBack: 4, msg: '4칸 후퇴!' })},
    { id: 'e27', name: '낙석', icon: '🪨', check: (p,d,t) => p>=5 && d>=2, fx: () => ({ pushBack: 3, msg: '3칸 후퇴!' })},
    { id: 'e31', name: '거미줄', icon: '🕸️', check: (p,d,t) => p>=3 && d>=2, fx: () => ({ moveReduce: 3, msg: '이동 -3!' })},
    { id: 'e33', name: '화염 구덩이', icon: '🔥🕳️', check: (p,d,t) => p>=6 && d>=2, fx: () => ({ pushBack: 4, msg: '4칸 후퇴!' })},
  ],
  blocker: [
    { id: 'b01', name: '골인저부', icon: '🛑', check: (p,d,t) => (12-p)<=5 && p<=12, fx: () => ({ pushBack: 4, msg: '4칸 후퇴!' })},
    { id: 'b02', name: '마지막 관문', icon: '🚪🔒', check: (p,d,t) => (12-p)<=4 && p<=12, fx: () => ({ pushBack: 3, newMin: 1, newMax: 2, msg: '관문 잠김! 3칸 후퇴+주사위1~2!' })},
    { id: 'b07', name: '거의 다 왔는데', icon: '😫', check: (p,d,t) => (12-p)<=5 && d>=2 && p<=12, fx: () => ({ pushBack: 5, msg: '5칸 후퇴!' })},
  ]
};

function selectEvent(p, d, t, inBypass) {
  // 우회 루트에서는 특별 이벤트
  if (inBypass) {
    if (Math.random() > 0.85) return null; // 15% 확률로 이벤트 없음 (낮춤)
    const bypassEvents = [
      { id: 'bp01', name: '순환 가속', icon: '🔄', msg: '+1칸', fx: () => ({ bonus: 1 }) },
      { id: 'bp02', name: '지름길 발견', icon: '🚀', msg: '바로 12로!', fx: () => ({ setPos: 12, victory: true }) },
      { id: 'bp03', name: '우회의 저주', icon: '👻', msg: '1칸 후퇴', fx: () => ({ pushBack: 1 }) },
      { id: 'bp04', name: '순환 정체', icon: '⏳', msg: '턴 +1', fx: () => ({ addTurn: 1 }) }
    ];
    return bypassEvents[r(0, 3)];
  }
  
  const all = [...events.positive, ...events.neutral, ...events.negative, ...events.blocker, ...events.dice];
  
  // v11: 이벤트 발생 확률 상향
  const baseChance = p <= 3 ? 0.75 : (p <= 6 ? 0.85 : (p <= 9 ? 0.92 : 0.97));
  if (Math.random() > baseChance) return null;
  
  const diceHigh = d >= 5;
  const diceLow = d <= 2;
  
  // v11: 카테고리별 가중치 (다양성 강화)
  const categoryWeights = {
    positive: diceLow ? 1.5 : 0.8,
    neutral: 0.5,  // 아무 일 없음 확률 낮춤
    negative: p >= 7 ? 2.5 : 1.8,
    blocker: p >= 5 ? (diceHigh ? 2.5 : 2) : 0.5,
    dice: 1.2, // 주사위 이벤트 추가 가중치
  };
  
  const matching = all.filter(e => {
    if (!e.check(p, d, t)) return false;
    const category = Object.keys(events).find(k => events[k].includes(e));
    if (Math.random() > (categoryWeights[category] || 1) * 0.3) return false;
    return true;
  });
  
  if (matching.length === 0) return null;
  return matching[Math.floor(Math.random() * matching.length)];
}

// 시뮬레이션 테스트 v6
console.log('='.repeat(60));
console.log('🎲 12-DICE 우회 루트 시뮬레이션 테스트 v6');
console.log('🔄 12칸 초과 시 3~6칸 랜덤 우회로 생성');
console.log('🐛 버그 수정: 경량주사위, 거미줄, 보너스 표시');
console.log('='.repeat(60));

let success = 0;
const results = [];

for (let test = 1; test <= 10; test++) {
  let position = 0;
  let turn = 1;
  let maxTurns = 5;
  let diceMin = 1;  // ⭐ 추가: 주사위 최소값
  let diceMax = 6;
  let inBypass = false;
  let bypassLength = 0;
  const logs = [];
  
  console.log('\n' + '-'.repeat(60));
  console.log(`📊 테스트 #${test}`);
  console.log('-'.repeat(60));
  
  while (turn <= maxTurns) {
    const roll = r(diceMin, diceMax);  // ⭐ 수정: diceMin 적용
    let move = roll;
    const event = selectEvent(position, roll, turn, inBypass);
    
    let eventLog = `T${turn}: 🎲${roll}`;
    
    if (event) {
      const fx = event.fx();
      
      // 우회 루트 이벤트
      if (event.id.startsWith('bp')) {
        if (fx.setPos === 12 && fx.victory) {
          logs.push(`${eventLog} → ${event.icon} ${event.name}: ${event.msg}`);
          logs.push(`   🎉 우회 루트 지름길로 승리!`);
          position = 12;
          inBypass = false;
          break;
        } else if (fx.pushBack) {
          const prevPos = position;
          position = position - fx.pushBack;
          // ⭐ 우회 루트에서 후퇴로 12칸 도착 시 승리!
          if (position === 12) {
            logs.push(`${eventLog} → ${event.icon} ${event.name}: ${event.msg} [${prevPos} → 12]`);
            logs.push(`   🎉 우회 루트 후퇴로 12칸 도착! 승리!`);
            position = 12;
            inBypass = false;
            bypassLength = 0;
            break;
          }
          // 12칸 이하로 내려가면 우회로 종료
          if (position < 12) {
            inBypass = false;
            bypassLength = 0;
          }
          logs.push(`${eventLog} → ${event.icon} ${event.name}: ${event.msg} [${position}칸]`);
        } else if (fx.bonus) {
          const newPos = position + fx.bonus;
          if (newPos > 12 + bypassLength) {
            // 순환
            position = 12 + (newPos - (12 + bypassLength));
            if (position === 12) {
              logs.push(`${eventLog} → ${event.icon} ${event.name}: ${event.msg}`);
              logs.push(`   🎉 우회 루트 순환 후 12칸 도달! 승리!`);
              inBypass = false;
              break;
            }
          } else {
            position = newPos;
          }
          logs.push(`${eventLog} → ${event.icon} ${event.name}: ${event.msg} [${position}칸]`);
        } else if (fx.addTurn) {
          maxTurns += fx.addTurn;
          logs.push(`${eventLog} → ${event.icon} ${event.name}: ${event.msg} [턴 ${maxTurns}]`);
        } else {
          logs.push(`${eventLog} → ${event.icon} ${event.name}: ${event.msg} [${position}칸]`);
        }
      }
      // 일반 이벤트
      else {
        // 이동 계산
        let afterMove = position + move;
        
        // 보너스/후퇴 이벤트 적용
        if (fx.bonus) {
          afterMove = position + move + fx.bonus;
          logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg} [${position}→${afterMove}칸]`);
        } else if (fx.pushBack) {
          // ⭐ 핵심: 후퇴 이벤트는 12칸 이하로 가면 우회로 생성 X
          const tempPos = Math.max(0, afterMove - fx.pushBack);
          logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg} [${afterMove} → ${tempPos}]`);
          
          if (tempPos === 12) {
            logs.push(`   🎉 이벤트 후퇴로 12칸 도착! 승리!`);
            position = 12;
            break;
          }
          position = tempPos;
          inBypass = false;
          turn++;
          continue;
        } else if (fx.newMin !== undefined || fx.newMax !== undefined) {
          // ⭐ 주사위 변경 (최소/최대 모두)
          if (fx.newMin !== undefined) diceMin = fx.newMin;
          if (fx.newMax !== undefined) diceMax = fx.newMax;
          logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg} [주사위 ${diceMin}~${diceMax}]`);
        } else if (fx.changeDice !== undefined) {
          logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg}`);
          if (fx.newMax) diceMax = fx.newMax;
        } else if (fx.noMove) {
          logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg} [제자리]`);
          turn++;
          continue;
        } else if (fx.moveReduce) {
          // ⭐ 버그 수정: 이동 감소 → 실제 후퇴로 변경
          const actualMove = move - fx.moveReduce;
          if (actualMove < 0) {
            // 후퇴
            const backAmount = Math.abs(actualMove);
            afterMove = position - backAmount;
            logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg} → ${backAmount}칸 후퇴! [${position}→${afterMove}칸]`);
          } else {
            afterMove = position + actualMove;
            logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg} → ${actualMove}칸 이동 [${position}→${afterMove}칸]`);
          }
        } else {
          logs.push(`${eventLog} → ${event.icon} ${event.name}: ${fx.msg}`);
        }
        
        // 12칸 초과 시 우회 루트 생성 (전진한 경우만)
        if (afterMove > 12 && !fx.pushBack) {
          if (!inBypass) {
            // 새 우회 루트 생성
            bypassLength = r(3, 6);
            const bypassEnd = 12 + bypassLength;
            inBypass = true;
            logs.push(`   🚧 우회 루트 ${bypassLength}칸 생성! (12→${bypassEnd}→12)`);
            
            if (afterMove > bypassEnd) {
              // 순환
              position = 12 + (afterMove - bypassEnd);
              if (position === 12) {
                logs.push(`   🎉 우회 루트 순환으로 12칸 도달! 승리!`);
                position = 12;
                inBypass = false;
                break;
              }
            } else {
              position = afterMove;
            }
            logs.push(`   ⚠️ 우회 루트 진입: ${position}칸`);
          } else {
            // 이미 우회 루트에 있음
            const bypassEnd = 12 + bypassLength;
            if (afterMove > bypassEnd) {
              position = 12 + (afterMove - bypassEnd);
              if (position === 12) {
                logs.push(`   🎉 우회 루트 순환으로 12칸 도달! 승리!`);
                inBypass = false;
                break;
              }
            } else {
              position = afterMove;
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
      }
    } else {
      // 이벤트 없음
      let afterMove = position + move;
      
      // 12칸 초과 시 우회 루트
      if (afterMove > 12) {
        if (!inBypass) {
          bypassLength = r(3, 6);
          const bypassEnd = 12 + bypassLength;
          inBypass = true;
          logs.push(`${eventLog} → ${move}칸 이동 [${afterMove}칸]`);
          logs.push(`   🚧 우회 루트 ${bypassLength}칸 생성! (12→${bypassEnd}→12)`);
          
          if (afterMove > bypassEnd) {
            position = 12 + (afterMove - bypassEnd);
            if (position === 12) {
              logs.push(`   🎉 우회 루트 순환으로 12칸 도달! 승리!`);
              inBypass = false;
              break;
            }
          } else {
            position = afterMove;
          }
          logs.push(`   ⚠️ 우회 루트 진입: ${position}칸`);
        } else {
          const bypassEnd = 12 + bypassLength;
          if (afterMove > bypassEnd) {
            position = 12 + (afterMove - bypassEnd);
            if (position === 12) {
              logs.push(`${eventLog} → ${move}칸 이동`);
              logs.push(`   🎉 우회 루트 순환으로 12칸 도달! 승리!`);
              inBypass = false;
              break;
            }
          } else {
            position = afterMove;
          }
          logs.push(`${eventLog} → ${move}칸 이동 [${position}칸]`);
        }
      } else if (afterMove === 12) {
        logs.push(`${eventLog} → ${move}칸 이동 [12칸]`);
        logs.push(`   🎉 정확히 12칸 도달! 승리!`);
        position = 12;
        break;
      } else {
        logs.push(`${eventLog} → ${move}칸 이동 [${afterMove}칸]`);
        position = afterMove;
      }
    }
    
    turn++;
  }
  
  // 로그 출력
  logs.forEach(l => console.log(l));
  
  console.log('-'.repeat(60));
  
  const lastLog = logs[logs.length - 1] || '';
  const isVictory = lastLog.includes('승리');
  
  if (isVictory) {
    console.log(`✅ 성공! (${turn}턴 만에 클리어)`);
    success++;
    results.push({ test, result: '성공', turns: turn, position: 12 });
  } else {
    const bypassStatus = inBypass ? ` (우회 루트, ${bypassLength}칸)` : '';
    console.log(`❌ 실패! (최종: ${position}칸${bypassStatus}, 턴 ${turn-1}/${maxTurns})`);
    results.push({ test, result: '실패', turns: turn-1, position: position + bypassStatus });
  }
}

console.log('\n' + '='.repeat(60));
console.log(`📈 결과: ${success}/5 성공 (${(success/5*100)}%)`);
console.log('='.repeat(60));

// 결과 요약표
console.log('\n📋 결과 요약:');
console.log('| 테스트 | 결과 | 턴 | 최종 위치 |');
console.log('|--------|------|-----|-----------|');
results.forEach(r => {
  console.log(`| #${r.test}    | ${r.result === '성공' ? '✅' : '❌'} ${r.result} | ${r.turns}   | ${r.position} |`);
});