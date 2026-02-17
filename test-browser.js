// 브라우저 없이 게임 로직 테스트

class MockGame {
    constructor() {
        this.position = 0;
        this.turn = 1;
        this.maxTurns = 5;
        this.goalPosition = 12;
        this.isInBypass = false;
        this.bypassLength = 0;
        this.gameOver = false;
        this.isRolling = false;
        this.eventHistory = [];
        this.lastEventId = null;
        this.totalRolls = 0;
        this.extendedGoal = false;
        this.currentDice = { min:1, max:6, name:'기본 주사위', type:'normal', values:null };
        this.forceDice = null;
        this.lastDiceValue = null;
    }
    
    r(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    
    rollDice() {
        console.log('🎲 주사위 굴리기 시작...');
        const diceValue = this.r(this.currentDice.min, this.currentDice.max);
        console.log(`🎲 주사위 결과: ${diceValue}`);
        this.onDiceRolled(diceValue);
    }
    
    selectEvent(diceValue) {
        // 간단한 이벤트 선택 로직
        const events = [
            { id: 'p01', name: '용기 북돋우기', msg: '1~3칸 전진!' },
            { id: 'e01', name: '기본 망치', msg: '2칸 후퇴...' }
        ];
        return Math.random() > 0.3 ? events[0] : events[1];
    }
    
    executeEvent(event, diceValue) {
        console.log(`⚡ 이벤트 발생: ${event.name} - ${event.msg}`);
        this.eventHistory.push(event.id);
    }
    
    movePlayer(spaces) {
        this.position += spaces;
        console.log(`📍 이동: ${spaces > 0 ? '+' : ''}${spaces} → 현재 위치: ${this.position}`);
        
        if (this.position >= 12) {
            this.victory();
        }
    }
    
    victory() {
        this.gameOver = true;
        console.log('🎉 승리!');
    }
    
    defeat() {
        this.gameOver = true;
        console.log('💀 패배...');
    }
    
    endTurn() {
        this.isRolling = false;
        this.turn++;
        console.log(`📝 턴 종료. 다음 턴: ${this.turn}`);
        
        if (this.turn > this.maxTurns) {
            this.defeat();
        }
    }
    
    onDiceRolled(diceValue) {
        this.lastDiceValue = diceValue;
        const event = this.selectEvent(diceValue);
        
        if (event) {
            console.log(`🎲 주사위: ${diceValue}!`);
            this.executeEvent(event, diceValue);
            // 이동 처리
            if (event.id.startsWith('p')) {
                this.movePlayer(diceValue + 2);
            } else {
                this.movePlayer(diceValue - 2);
            }
        } else {
            console.log('이벤트 없음');
            this.movePlayer(diceValue);
        }
        
        this.endTurn();
    }
}

const game = new MockGame();
game.rollDice();
console.log('---');
console.log('게임 상태:', {
    position: game.position,
    turn: game.turn,
    gameOver: game.gameOver,
    eventHistory: game.eventHistory
});
