// selectEvent 디버깅

const fs = require('fs');
const code = fs.readFileSync('game.js', 'utf8');

// Game 클래스만 추출
const classMatch = code.match(/class Game \{[\s\S]*?\n\}/);
if (!classMatch) {
    console.log('Game class not found');
    process.exit(1);
}

// Mock elements
const mockElements = {
    board: { innerHTML: '' },
    currentTurn: { textContent: '1' },
    currentPosition: { textContent: '0' },
    diceDisplay: { classList: { add: () => {}, remove: () => {} } },
    diceValue: { textContent: '?', classList: { add: () => {}, remove: () => {} }, style: {} },
    diceType: { textContent: '' },
    logArea: { innerHTML: '', appendChild: () => {}, scrollTop: 0 },
    eventArea: { classList: { add: () => {}, remove: () => {} } },
    eventContent: { innerHTML: '' },
    tapArea: { classList: { add: () => {}, remove: () => {} } },
    tapBar: { style: {} },
    tapButton: { addEventListener: () => {} },
    choiceArea: { innerHTML: '', classList: { add: () => {}, remove: () => {} } },
    rollButton: { disabled: false, addEventListener: () => {} },
    restartButton: { classList: { add: () => {}, remove: () => {} }, addEventListener: () => {} },
    resultScreen: { classList: { add: () => {}, remove: () => {} } },
    resultIcon: { textContent: '' },
    resultText: { textContent: '', className: '' },
    resultDetail: { textContent: '' },
    resultButton: { addEventListener: () => {} }
};

// Game 클래스 평가
eval(`const document = { getElementById: (id) => mockElements[id] || mockElements }; ${classMatch[0]}`);

const game = new Game();
console.log('Game created');
console.log('position:', game.position);
console.log('turn:', game.turn);

// selectEvent 테스트
const event = game.selectEvent(3);
console.log('Selected event:', event ? event.id : 'null');

if (event) {
    console.log('Event name:', event.name);
    console.log('Event icon:', event.icon);
}
