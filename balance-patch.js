// 12-DICE 이벤트 조건 밸런스 패치
// 조건을 더 넓게 수정해서 이벤트 발생 확률 증가

const fs = require('fs');

let content = fs.readFileSync('game.js', 'utf8');

// 긍정적 이벤트 조건 완화
const positivePatches = [
  // p01: 용기 북돋우기 - p<=4 && d<=2 → p<=6 && d<=3
  { old: `cond: (p,d,t) => p<=4 && d<=2,`, new: `cond: (p,d,t) => p<=6 && d<=3,` },
  // p02: 주사위 복제 - p<=3 && d===1 → p<=4 && d<=1
  { old: `cond: (p,d,t) => p<=3 && d===1,`, new: `cond: (p,d,t) => p<=4 && d<=1,` },
  // p03: 천국의 축복 - t>=4 && p<=2 → t>=3 && p<=3
  { old: `cond: (p,d,t) => t>=4 && p<=2,`, new: `cond: (p,d,t) => t>=3 && p<=3,` },
  // p05: 황금 주사위 - p===0 && d===6 → p<=1 && d>=5
  { old: `cond: (p,d,t) => p===0 && d===6,`, new: `cond: (p,d,t) => p<=1 && d>=5,` },
  // p06: 지름길 - p>=2 && p<=5 && d===3 → p>=1 && p<=6 && d<=4
  { old: `cond: (p,d,t) => p>=2 && p<=5 && d===3,`, new: `cond: (p,d,t) => p>=1 && p<=6 && d<=4,` },
  // p07: 행운의 별 - p<=5 && d===2 && t<=2 → p<=6 && d<=2 && t<=3
  { old: `cond: (p,d,t) => p<=5 && d===2 && t<=2,`, new: `cond: (p,d,t) => p<=6 && d<=2 && t<=3,` },
  // p08: 스프링 보드 - p>=1 && p<=4 && d===4 → p>=1 && p<=5 && d>=4
  { old: `cond: (p,d,t) => p>=1 && p<=4 && d===4,`, new: `cond: (p,d,t) => p>=1 && p<=5 && d>=4,` },
  // p09: 요정의 가루 - p<=3 && d<=3 → p<=5 && d<=3
];

positivePatches.forEach(patch => {
  content = content.replace(patch.old, patch.new);
});

// 부정적 이벤트 조건 완화
const negativePatches = [
  // e01: 기본 망치 - p>=5 && d>=5 && p<10 → p>=4 && d>=4 && p<10
  { old: `cond: (p,d,t) => p>=5 && d>=5 && p<10,`, new: `cond: (p,d,t) => p>=4 && d>=4 && p<10,` },
  // e02: 1~3 조항 - p>=6 && p<=9 && d>=5 → p>=5 && p<=10 && d>=4
  { old: `cond: (p,d,t) => p>=6 && p<=9 && d>=5,`, new: `cond: (p,d,t) => p>=5 && p<=10 && d>=4,` },
  // e04: 바람 폭풍 - p>=8 && p<=11 && d>=4 → p>=6 && p<=11 && d>=3
  { old: `cond: (p,d,t) => p>=8 && p<=11 && d>=4,`, new: `cond: (p,d,t) => p>=6 && p<=11 && d>=3,` },
  // e05: 지진 - p>=9 && d>=5 → p>=8 && d>=4
  { old: `cond: (p,d,t) => p>=9 && d>=5,`, new: `cond: (p,d,t) => p>=8 && d>=4,` },
  // e06: 블랙홀 - p>=10 && t>=3 → p>=9 && t>=2
  { old: `cond: (p,d,t) => p>=10 && t>=3,`, new: `cond: (p,d,t) => p>=9 && t>=2,` },
];

negativePatches.forEach(patch => {
  content = content.replace(patch.old, patch.new);
});

// 초기 장애물 조건 완화
const earlyPatches = [
  // r01: 시작의 저주 - p===0 && t===1 && d<=3 → p<=1 && t<=2 && d<=3
  { old: `cond: (p,d,t) => p===0 && t===1 && d<=3,`, new: `cond: (p,d,t) => p<=1 && t<=2 && d<=3,` },
  // r03: 미끄러운 시작선 - p<=1 && d>=4 → p<=2 && d>=3
  { old: `cond: (p,d,t) => p<=1 && d>=4,`, new: `cond: (p,d,t) => p<=2 && d>=3,` },
];

earlyPatches.forEach(patch => {
  content = content.replace(patch.old, patch.new);
});

// blocker 조건 완화
const blockerPatches = [
  // b01: 골인저부 - (12-p)<=2 && d>=4 → (12-p)<=3 && d>=3
  { old: `cond: (p,d,t) => this.goalPosition-p<=2 && d>=4,`, new: `cond: (p,d,t) => this.goalPosition-p<=3 && d>=3,` },
  // b07: 거의 다 왔는데 - (12-p)===2 && d>=5 → (12-p)<=3 && d>=4
  { old: `cond: (p,d,t) => this.goalPosition-p===2 && d>=5,`, new: `cond: (p,d,t) => this.goalPosition-p<=3 && d>=4,` },
];

blockerPatches.forEach(patch => {
  content = content.replace(patch.old, patch.new);
});

fs.writeFileSync('game.js', content);
console.log('✅ 이벤트 조건 밸런스 패치 완료!');
console.log('📝 수정된 내용:');
console.log('  - 긍정적 이벤트: 조건 완화 (위치/주사위 범위 확대)');
console.log('  - 부정적 이벤트: 조건 완화 (위치/주사위 범위 확대)');
console.log('  - 초기 장애물: 조건 완화');
console.log('  - blocker: 조건 완화');