// 게임 흐름 테스트

// 게임 시뮬레이션
let position = 0;
let turn = 1;
let dice = 3;

const events = [
    { id: 'p01', name: '용기 북돋우기', cond: (p,d,t) => p<=6 && d<=3 },
    { id: 'r01', name: '시작의 저주', cond: (p,d,t) => p===0 && t===1 && d>=2 },
    { id: 'e01', name: '기본 망치', cond: (p,d,t) => p>=5 && d>=5 }
];

console.log('=== 게임 시뮬레이션 ===');
console.log(`초기 상태: position=${position}, turn=${turn}, dice=${dice}`);

// 이벤트 조건 확인
const matching = events.filter(e => {
    try {
        const result = e.cond(position, dice, turn);
        console.log(`${e.id} ${e.name}: cond = ${result}`);
        return result;
    } catch (err) {
        console.log(`${e.id} ${e.name}: ERROR - ${err.message}`);
        return false;
    }
});

console.log(`\n매칭된 이벤트: ${matching.length}개`);
matching.forEach(e => console.log(`  - ${e.id}: ${e.name}`));

if (matching.length > 0) {
    console.log('\n✅ 이벤트 발생 가능!');
} else {
    console.log('\n❌ 이벤트 없음 - movePlayer 직접 호출');
}
