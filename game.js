// 12 DICE - 100 Events Edition with Witty Dialogues
// 각 이밴트에 센스 있는 대사 추가

class Game {
    constructor() {
        this.position = 0;
        this.turn = 1;
        this.maxTurns = 5;
        this.goalPosition = 12;
        this.totalCells = 18; // 12 + 우회 루트 (최대 6칸)
        
        this.currentDice = { min:1, max:6, name:'기본 주사위', type:'normal', values:null };
        this.forceDice = null;
        
        this.gameOver = false;
        this.isRolling = false;
        this.isInBypass = false; // 우회 루트 진입 여부
        this.bypassLength = 0; // 우회 루트 길이 (3~6칸 랜덤)
        
        this.eventHistory = [];
        this.lastEventId = null;
        this.lastDiceValue = null;
        this.totalRolls = 0;
        this.extendedGoal = false;
        
        // 지속 효과 추적
        this.activeEffects = []; // [{id, name, icon, turnsLeft, type}]
        
        // 전략 카드 시스템
        this.hand = []; // 손패 (최대 3장)
        this.maxHandSize = 3;
        this.pendingEvent = null; // 대기 중인 이벤트
        this.cardUsedThisTurn = false; // 이번 턴 카드 사용 여부
        
        this.elements = {};
        this.taps = 0;
        this.targetTaps = 0;
        
        this.init();
    }
    
    // ==================== 전략 카드 라이브러리 ====================
    getCardLibrary() {
        return [
            // 🎲 주사위 카드 (4장) - 이벤트 발생 시 사용
            {
                id: 'reroll',
                name: '🎲 리롤',
                icon: '🎲',
                desc: '주사위 다시 굴리기',
                timing: '이벤트 발생 시',
                type: 'dice',
                effect: 'reroll'
            },
            {
                id: 'manipulate',
                name: '🎲 조작',
                icon: '🎲',
                desc: '주사위 값 ±1 조정',
                timing: '이벤트 발생 시',
                type: 'dice',
                effect: 'manipulate'
            },
            {
                id: 'range',
                name: '🎲 범위',
                icon: '🎲',
                desc: '다음 주사위 4~6만 나옴',
                timing: '주사위 굴리기 전',
                type: 'dice',
                effect: 'range'
            },
            {
                id: 'duplicate',
                name: '🎲 복제',
                icon: '🎲',
                desc: '주사위 값만큼 추가 이동',
                timing: '이벤트 발생 시',
                type: 'dice',
                effect: 'duplicate'
            },
            
            // 🛡️ 이벤트 방어 카드 (3장) - 이벤트 발생 시 사용
            {
                id: 'block',
                name: '🛡️ 차단',
                icon: '🛡️',
                desc: '이번 이벤트 무시',
                timing: '이벤트 발생 시',
                type: 'defense',
                effect: 'block'
            },
            {
                id: 'convert',
                name: '🛡️ 전환',
                icon: '🛡️',
                desc: '부정→긍정 이벤트로 변경',
                timing: '이벤트 발생 시',
                type: 'defense',
                effect: 'convert'
            },
            {
                id: 'reduce',
                name: '🛡️ 감소',
                icon: '🛡️',
                desc: '이벤트 효과 절반으로 감소',
                timing: '이벤트 발생 시',
                type: 'defense',
                effect: 'reduce'
            },
            
            // 🍀 운 강화 카드 (3장) - 언제든 사용
            {
                id: 'lucky',
                name: '🍀 행운',
                icon: '🍀',
                desc: '다음 턴 긍정 이벤트 100%',
                timing: '언제든',
                type: 'luck',
                effect: 'lucky'
            },
            {
                id: 'reverse',
                name: '🍀 역전',
                icon: '🍀',
                desc: '후퇴→전진으로 변경',
                timing: '언제든',
                type: 'luck',
                effect: 'reverse'
            },
            {
                id: 'bless',
                name: '🍀 축복',
                icon: '🍀',
                desc: '이동 후 +1~2칸 추가',
                timing: '이벤트 발생 시',
                type: 'luck',
                effect: 'bless'
            }
        ];
    }
    
    // 랜덤 카드 뽑기
    drawCard() {
        if (this.hand.length >= this.maxHandSize) return null;
        
        const library = this.getCardLibrary();
        const card = library[this.r(0, library.length - 1)];
        this.hand.push({ ...card, uid: Date.now() + Math.random() });
        
        this.updateHandUI();
        return card;
    }
    
    // 카드 사용
    useCard(cardUid) {
        // 한 턴에 한 장만 사용 가능
        if (this.cardUsedThisTurn) {
            this.addLog('system', '⚠️ 이번 턴에는 이미 카드를 사용했습니다!');
            return false;
        }
        
        const cardIndex = this.hand.findIndex(c => c.uid === cardUid);
        if (cardIndex === -1) return false;
        
        const card = this.hand[cardIndex];
        
        // 카드 타입에 따른 효과 적용
        switch (card.effect) {
            case 'reroll':
                // 주사위 다시 굴리기
                this.addLog('event', `🎴 ${card.name} 사용! 주사위 다시 굴리기`);
                this.cardUsedThisTurn = true;
                this.hand.splice(cardIndex, 1);
                this.updateHandUI();
                this.rerollDice();
                return true;
                
            case 'manipulate':
                // 주사위 값 조정 (UI에서 선택)
                this.addLog('event', `🎴 ${card.name} 사용! ±1 조정`);
                this.cardUsedThisTurn = true;
                this.hand.splice(cardIndex, 1);
                this.updateHandUI();
                this.showManipulateUI();
                return true;
                
            case 'range':
                // 다음 주사위 4~6
                this.addLog('event', `🎴 ${card.name} 사용! 다음 주사위 4~6`);
                this.forceDice = { min: 4, max: 6 };
                this.cardUsedThisTurn = true;
                this.hand.splice(cardIndex, 1);
                this.updateHandUI();
                return true;
                
            case 'duplicate':
                // 주사위 값만큼 추가 이동
                if (this.lastDiceValue) {
                    this.addLog('event', `🎴 ${card.name} 사용! +${this.lastDiceValue}칸 이동`);
                    this.cardUsedThisTurn = true;
                    this.hand.splice(cardIndex, 1);
                    this.updateHandUI();
                    this.movePlayer(this.lastDiceValue);
                }
                return true;
                
            case 'block':
                // 이벤트 무시
                if (this.pendingEvent) {
                    this.addLog('event', `🎴 ${card.name} 사용! 이벤트 무시!`);
                    this.pendingEvent = null;
                    this.cardUsedThisTurn = true;
                    this.hand.splice(cardIndex, 1);
                    this.updateHandUI();
                    this.elements.eventArea.classList.add('hidden');
                    this.endTurn();
                }
                return true;
                
            case 'convert':
                // 부정→긍정 이벤트로 변경
                if (this.pendingEvent) {
                    this.addLog('event', `🎴 ${card.name} 사용! 이벤트 변경!`);
                    this.cardUsedThisTurn = true;
                    this.hand.splice(cardIndex, 1);
                    this.updateHandUI();
                    this.convertEventToPositive();
                }
                return true;
                
            case 'reduce':
                // 이벤트 효과 절반
                if (this.pendingEvent) {
                    this.addLog('event', `🎴 ${card.name} 사용! 효과 절반!`);
                    this.cardUsedThisTurn = true;
                    this.hand.splice(cardIndex, 1);
                    this.updateHandUI();
                    this.reduceEventEffect();
                }
                return true;
                
            case 'lucky':
                // 다음 턴 긍정 이벤트 100%
                this.addLog('event', `🎴 ${card.name} 사용! 다음 턴 행운!`);
                this.addActiveEffect('lucky', '🍀 행운', '🍀', 2, 'luck');
                this.cardUsedThisTurn = true;
                this.hand.splice(cardIndex, 1);
                this.updateHandUI();
                return true;
                
            case 'reverse':
                // 후퇴→전진
                this.activeEffects.push({ id: 'reverse', name: '🍀 역전', icon: '🍀', turnsLeft: 1, type: 'reverse' });
                this.addLog('event', `🎴 ${card.name} 사용! 후퇴→전진`);
                this.cardUsedThisTurn = true;
                this.hand.splice(cardIndex, 1);
                this.updateHandUI();
                return true;
                
            case 'bless':
                // 이동 후 +1~2칸
                const bonus = this.r(1, 2);
                this.addLog('event', `🎴 ${card.name} 사용! +${bonus}칸 추가!`);
                this.cardUsedThisTurn = true;
                this.hand.splice(cardIndex, 1);
                this.updateHandUI();
                this.movePlayer(bonus);
                return true;
        }
        
        return false;
    }
    
    // 이벤트를 긍정으로 변경
    convertEventToPositive() {
        if (!this.pendingEvent) return;
        
        // 긍정 이벤트로 교체
        const positiveEvents = this.getEventLibrary().positive;
        const newEvent = positiveEvents[this.r(0, positiveEvents.length - 1)];
        
        // 기존 이벤트 닫기
        this.elements.eventArea.classList.add('hidden');
        
        // 새 이벤트 실행
        setTimeout(() => {
            this.executeEvent(newEvent, this.lastDiceValue);
        }, 300);
    }
    
    // 이벤트 효과 절반
    reduceEventEffect() {
        if (!this.pendingEvent) return;
        
        // 효과 절반 플래그 설정 후 이벤트 적용
        this.effectReducer = 0.5;
        
        // 기존 이벤트 닫기
        this.elements.eventArea.classList.add('hidden');
        
        // 이벤트 다시 적용
        setTimeout(() => {
            this.executeEvent(this.pendingEvent, this.lastDiceValue);
            this.effectReducer = null;
        }, 300);
    }
    
    // 주사위 다시 굴리기
    rerollDice() {
        this.isRolling = false;
        this.elements.rollButton.disabled = false;
        this.addLog('system', '주사위를 다시 굴리세요!');
        // 주사위 굴리기 버튼 활성화
        this.elements.rollButton.classList.add('pulse');
    }
    
    // 주사위 조작 UI
    showManipulateUI() {
        const choiceArea = this.elements.choiceArea;
        choiceArea.innerHTML = `
            <div class="manipulate-ui">
                <span>주사위 값 조정:</span>
                <button class="choice-btn" onclick="game.applyManipulate(-1)">-1</button>
                <span id="currentDiceVal">${this.lastDiceValue}</span>
                <button class="choice-btn" onclick="game.applyManipulate(1)">+1</button>
            </div>
        `;
        choiceArea.classList.remove('hidden');
    }
    
    applyManipulate(delta) {
        const newValue = Math.max(1, Math.min(6, this.lastDiceValue + delta));
        this.lastDiceValue = newValue;
        this.elements.diceValue.textContent = newValue;
        this.elements.choiceArea.classList.add('hidden');
        this.addLog('system', `주사위 값: ${newValue}`);
        
        // 이동 재계산
        this.elements.eventArea.classList.add('hidden');
        this.movePlayer(newValue);
    }
    
    // 손패 UI 업데이트
    updateHandUI() {
        const handArea = document.getElementById('handArea');
        if (!handArea) return;
        
        handArea.innerHTML = '';
        
        this.hand.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = `strategy-card card-${card.type}`;
            cardEl.dataset.type = card.type;
            cardEl.innerHTML = `
                <div class="card-icon">${card.icon}</div>
                <div class="card-name">${card.name}</div>
                <div class="card-desc">${card.desc}</div>
                <div class="card-timing">⏱️ ${card.timing}</div>
            `;
            cardEl.onclick = () => this.onCardClick(card.uid);
            handArea.appendChild(cardEl);
        });
        
        // 손패 개수 표시
        const handCount = document.getElementById('handCount');
        if (handCount) {
            handCount.textContent = `${this.hand.length}/${this.maxHandSize}`;
        }
    }
    
    // 카드 클릭 핸들러
    onCardClick(cardUid) {
        const card = this.hand.find(c => c.uid === cardUid);
        if (!card) return;
        
        // 이미 카드를 사용했으면 불가
        if (this.cardUsedThisTurn) {
            this.addLog('system', '⚠️ 이번 턴에는 이미 카드를 사용했습니다.');
            return;
        }
        
        // 카드 타이밍 체크
        const timing = card.timing;
        
        // 이벤트 발생 시 카드
        if (timing === '이벤트 발생 시') {
            if (this.pendingEvent) {
                this.useCard(cardUid);
            } else {
                this.addLog('system', '⚠️ 이벤트 발생 시에만 사용할 수 있습니다.');
            }
            return;
        }
        
        // 주사위 굴리기 전 카드
        if (timing === '주사위 굴리기 전') {
            if (!this.isRolling && !this.pendingEvent) {
                this.useCard(cardUid);
            } else {
                this.addLog('system', '⚠️ 주사위를 굴리기 전에만 사용할 수 있습니다.');
            }
            return;
        }
        
        // 언제든 사용 가능
        if (timing === '언제든') {
            this.useCard(cardUid);
            return;
        }
        
        // 기본: 이벤트 발생 시
        if (this.pendingEvent) {
            this.useCard(cardUid);
        } else {
            this.addLog('system', '⚠️ 지금은 사용할 수 없습니다.');
        }
    }
    
    init() {
        this.elements = {
            board: document.getElementById('board'),
            currentTurn: document.getElementById('currentTurn'),
            currentPosition: document.getElementById('currentPosition'),
            diceDisplay: document.getElementById('diceDisplay'),
            diceValue: document.getElementById('diceValue'),
            diceType: document.getElementById('diceType'),
            diceInfo: document.getElementById('diceInfo'),
            logArea: document.getElementById('logArea'),
            eventArea: document.getElementById('eventArea'),
            eventContent: document.getElementById('eventContent'),
            tapArea: document.getElementById('tapArea'),
            tapBar: document.getElementById('tapBar'),
            tapButton: document.getElementById('tapButton'),
            choiceArea: document.getElementById('choiceArea'),
            rollButton: document.getElementById('rollButton'),
            restartButton: document.getElementById('restartButton'),
            resultScreen: document.getElementById('resultScreen'),
            resultIcon: document.getElementById('resultIcon'),
            resultText: document.getElementById('resultText'),
            resultDetail: document.getElementById('resultDetail'),
            resultButton: document.getElementById('resultButton'),
            activeEffects: document.getElementById('activeEffects')
        };
        
        this.elements.rollButton.addEventListener('click', () => this.rollDice());
        this.elements.restartButton.addEventListener('click', () => this.restart());
        this.elements.resultButton.addEventListener('click', () => this.restart());
        this.elements.tapButton.addEventListener('click', () => this.handleTap());
        
        this.updateBoard();
        this.addLog('system', '"안녕! 5턴 안에 12칸 도달하면 승리야... 아, 참고로 난 친절하지 않아." 😈');
        
        // 게임 시작 시 카드 1장 지급
        this.drawCard();
        this.addLog('system', '🎴 전략 카드 1장을 받았습니다!');
    }
    
    // ==================== 이밴트 라이브러리 (100개 + 센스 대사) ====================
    
    getEventLibrary() {
        return {
            
            // ===== 긍정적 이밴트 (20개) - 따뜻한 척 하는 장난 =====
            positive: [
                {
                    id: 'p01', name: '용기 북돋우기', icon: '✨',
                    cond: (p,d,t) => p<=6 && d<=3,
                    msg: d => `"${d}칸? ...뭐, 나쁘지 않네. 용기 내서 1~3칸 더 가."`,
                    fx: d => ({ bonus: this.r(1,3) })
                },
                {
                    id: 'p02', name: '주사위 복제', icon: '🎲🎲',
                    cond: (p,d,t) => p<=4 && d<=1,
                    msg: `"주사위 1! 우연히도... 아주 우연히도... 두 번 더 굴릴 수 있어."`,
                    fx: () => ({ extraRolls: 2 })
                },
                {
                    id: 'p03', name: '천국의 축복', icon: '👼',
                    cond: (p,d,t) => t>=3 && p<=3,
                    msg: `"힘들지? 내가 봐줬어. 5칸 전진. ...이건 빚이야."`,
                    fx: () => ({ setPos: this.position + 5 })
                },
                {
                    id: 'p04', name: '자비의 턴', icon: '🙏',
                    cond: (p,d,t) => t===this.maxTurns && d<=2,
                    msg: `"마지막 턴에 1~2라니... 불쌍해서 턴 2개 더 줄게. 꼭 성공해."`,
                    fx: () => ({ addTurns: 2 })
                },
                {
                    id: 'p05', name: '황금 주사위', icon: '🪙',
                    cond: (p,d,t) => p<=1 && d>=5,
                    msg: `"첫 굴리기에 6? 운이 좋네! 황금 주사위(4~6)로 바꿔줄게. 운을 낭비하지 마."`,
                    fx: () => ({ newDice: { min:4, max:6, name:'황금 주사위', type:'golden' }})
                },
                {
                    id: 'p06', name: '지름길', icon: '🗺️',
                    cond: (p,d,t) => p>=1 && p<=6 && d<=4,
                    msg: `"지름길 발견! ...물론 내가 숨겨둔 거지만. 3칸 점프!"`,
                    fx: () => ({ bonus: 3 })
                },
                {
                    id: 'p07', name: '행운의 별', icon: '⭐',
                    cond: (p,d,t) => p<=6 && d<=2 && t<=3,
                    msg: `"별 떨어졌어! 다음 이밴트는... 아마 좋을 거야. 아마."`,
                    fx: () => ({ lucky: true })
                },
                {
                    id: 'p08', name: '스프링 보드', icon: '🎯',
                    cond: (p,d,t) => p>=1 && p<=5 && d>=4,
                    msg: `"스프링 보드! 2배로 튀어올라! ...착지는 알아서 해."`,
                    fx: d => ({ bonus: d })
                },
                {
                    id: 'p09', name: '요정의 가루', icon: '🧚',
                    cond: (p,d,t) => p<=3 && d<=3,
                    msg: `"요정이 지나가다 가루를 흘렸어. 다음 주사위 +2!"`,
                    fx: () => ({ nextBonus: 2 })
                },
                {
                    id: 'p10', name: '마법 포털', icon: '🌀',
                    cond: (p,d,t) => p===3 && d===3,
                    msg: `"3번 칸 3번 주사위... 포털이 열렸어! 어디로 갈래? (내 추천은 없어)"`,
                    choices: [
                        { text: '6칸으로', fx: () => ({ setPos: 6 }) },
                        { text: '8칸으로', fx: () => ({ setPos: 8 }) }
                    ]
                },
                {
                    id: 'p11', name: '갬블러 주사위', icon: '🎰',
                    cond: (p,d,t) => p===4 && d<=2,
                    msg: `"도박꾼의 주사위(1~8)! 한 번 굴려보면... 알게 될 거야."`,
                    fx: () => ({ newDice: { min:1, max:8, name:'갬블러 주사위', type:'gambler' }})
                },
                {
                    id: 'p12', name: '축복의 비', icon: '🌧️✨',
                    cond: (p,d,t) => p<=2 && t===1,
                    msg: `"첫 턴에 비가 와... 축복의 비! 2턴 동안 이동 +1!"`,
                    fx: () => ({ moveBonus: 2 })
                },
                {
                    id: 'p13', name: '무지개 다리', icon: '🌈',
                    cond: (p,d,t) => p===5 && d===5,
                    msg: `"무지개 다리! 5번 칸에서 5번 주사위... 바로 9칸으로!"`,
                    fx: () => ({ setPos: 9 })
                },
                {
                    id: 'p14', name: '주사위 업그레이드', icon: '⬆️',
                    cond: (p,d,t) => p<=3 && this.totalRolls>=3,
                    msg: `"주사위가 레벨업! 이제 2~6만 나와. ...1은 이제 없어."`,
                    fx: () => ({ newDice: { min:2, max:6, name:'업그레이드 주사위', type:'up' }})
                },
                {
                    id: 'p15', name: '부활 부적', icon: '📿',
                    cond: (p,d,t) => p<=2 && d===2,
                    msg: `"부활 부적! 한 번만 뒤로 안 밀려날 수 있어. ...한 번만."`,
                    fx: () => ({ shield: 1 })
                },
                {
                    id: 'p16', name: '행운의 네잎클로버', icon: '🍀',
                    cond: (p,d,t) => p<=4 && Math.random()<0.1,
                    msg: `"네잎클로버! ...찾은 거 아니고 내가 뿌린 거야. 4칸 전진!"`,
                    fx: () => ({ bonus: 4 })
                },
                {
                    id: 'p17', name: '천사의 날개', icon: '👼',
                    cond: (p,d,t) => t===1 && d>=4,
                    msg: `"첫 턴부터 고점수! 날개를 줄게. 3칸 추가 비행!"`,
                    fx: () => ({ bonus: 3 })
                },
                {
                    id: 'p18', name: '복주머니', icon: '🧧',
                    cond: (p,d,t) => p===0 && t<=2,
                    msg: `"복주머니! 다음 3번 이동할 때마다 +1! 새해 복 많이."`,
                    fx: () => ({ moveBonus: 3 })
                },
                {
                    id: 'p19', name: '별똥별', icon: '🌠',
                    cond: (p,d,t) => p<=5 && t>=3 && d<=2,
                    msg: `"별똥별! 소원을 들어줘... 3칸 전진! ...다른 소원은 안 들어줘."`,
                    fx: () => ({ bonus: 3 })
                },
                {
                    id: 'p20', name: '마법 카펫', icon: '🧞',
                    cond: (p,d,t) => p>=2 && p<=4 && d===6,
                    msg: `"마법 카펫! 원하는 만큼... 이라고 하면 재밌을 것 같아서 1~4칸 랜덤!"`,
                    fx: () => ({ bonus: this.r(1,4) })
                }
            ],
            
            // ===== 중립적 이밴트 (20개) - 무심한 관찰자 =====
            neutral: [
                {
                    id: 'n01', name: '무반응', icon: '😐',
                    cond: (p,d,t) => d===3,
                    msg: `"..." (아무 일도 일어나지 않았다. 정말로.)`,
                    fx: () => ({})
                },
                {
                    id: 'n02', name: '수수께끼의 상자', icon: '📦',
                    cond: (p,d,t) => d===4 && p>=3 && p<=8,
                    msg: `"상자다. 열어? 안 열어? ...내 책임은 아니야."`,
                    choices: [
                        { text: '연다', fx: () => this.mysteryBox() },
                        { text: '무시', fx: () => ({}) }
                    ]
                },
                {
                    id: 'n03', name: '주사위 상점', icon: '🏪',
                    cond: (p,d,t) => p===5 && t>=2,
                    msg: `"주사위 상점! 원하는 성격의 주사위로 바꿔... 돈은 안 받아."`,
                    choices: [
                        { text: '소심 주사위(1~3)', fx: () => ({ newDice: { min:1, max:3, name:'소심 주사위', type:'small' }}) },
                        { text: '대담 주사위(4~6)', fx: () => ({ newDice: { min:4, max:6, name:'대담 주사위', type:'big' }}) },
                        { text: '안 산다', fx: () => ({}) }
                    ]
                },
                {
                    id: 'n04', name: '거울의 주사위', icon: '🪞',
                    cond: (p,d,t) => d===4,
                    msg: d => `"거울을 봐... ${d}가 ${7-d}로! 대칭이지."`,
                    fx: d => ({ changeDice: 7-d })
                },
                {
                    id: 'n05', name: '순간이동 스테이션', icon: '🚀',
                    cond: (p,d,t) => p===6 && (d===3||d===4),
                    msg: `"순간이동 스테이션! 빨리 타. 어디로 갈 건데?"`,
                    choices: [
                        { text: '2칸(뒤로)', fx: () => ({ setPos: 2 }) },
                        { text: '10칸(앞으로)', fx: () => ({ setPos: 10 }) },
                        { text: '안 탄다', fx: () => ({}) }
                    ]
                },
                {
                    id: 'n06', name: '가챠 머신', icon: '🎰',
                    cond: (p,d,t) => p>=4 && p<=7 && d>=4,
                    msg: `"가챠 머신! 뭐가 나올지 모름. ...확률은 공개 안 해."`,
                    fx: () => this.gacha()
                },
                {
                    id: 'n07', name: '날씨 예보', icon: '🌤️',
                    cond: (p,d,t) => t===3 && p>=4 && p<=8,
                    msg: `"오늘 날씨... 다음 주사위에 영향을 줄 거야. 뭔지는 모르지만."`,
                    fx: () => this.weather()
                },
                {
                    id: 'n08', name: '기억 테스트', icon: '🧠',
                    cond: (p,d,t) => p===7 && d===5,
                    msg: `"기억력 테스트! 전에 뭘 굴렸지? ...알면 좋은 거야."`,
                    fx: () => ({ repeatLast: true })
                },
                {
                    id: 'n09', name: '동전 던지기', icon: '🪙',
                    cond: (p,d,t) => p===4,
                    msg: `"동전 던지기! 앞: 2칸 전진, 뒤: 제자리. ...동전은 이미 던졌어."`,
                    fx: () => Math.random()<0.5 ? { bonus: 2 } : {}
                },
                {
                    id: 'n10', name: '미니룰렛', icon: '🎡',
                    cond: (p,d,t) => p>=3 && p<=6 && t>=2,
                    msg: `"미니룰렛! 돌려돌려~ 결과는...!"`,
                    fx: () => this.miniRoulette()
                },
                {
                    id: 'n11', name: '퀴즈', icon: '❓',
                    cond: (p,d,t) => p===5 && t===2,
                    msg: `"퀴즈! 1+1=? ...틀려도 답은 알려줄게."`,
                    fx: () => Math.random()<0.5 ? { bonus: 2 } : { pushBack: 1 }
                },
                {
                    id: 'n12', name: '요술거울', icon: '🪞✨',
                    cond: (p,d,t) => p>=5 && p<=8 && d===3,
                    msg: `"요술거울! 50% 확률로 이동 방향이 뒤집혀!"`,
                    fx: () => Math.random()<0.5 ? { reverse: true } : {}
                },
                {
                    id: 'n13', name: '신비의 크리스탈', icon: '🔮',
                    cond: (p,d,t) => p===6 && t>=2,
                    msg: `"크리스탈 구슬... 미래가 보여... 다음 이밴트는... (화면이 흐려진다)"`,
                    fx: () => ({ reveal: true })
                },
                {
                    id: 'n14', name: '주사위 병원', icon: '🏥',
                    cond: (p,d,t) => p===4 && this.currentDice.type!=='normal',
                    msg: `"주사위가 아파 보이네. 병원에서 기본 주사위로 복구해줄까?"`,
                    choices: [
                        { text: '복구', fx: () => ({ newDice: { min:1, max:6, name:'기본 주사위', type:'normal' }}) },
                        { text: '안 함', fx: () => ({}) }
                    ]
                },
                {
                    id: 'n15', name: '복불복 박스', icon: '🎁',
                    cond: (p,d,t) => p>=4 && p<=8 && t>=2,
                    msg: `"복불복 박스! 열면 좋은 건지 나쁜 건지 모름!"`,
                    fx: () => Math.random()<0.5 ? { bonus: 3 } : { pushBack: 2 }
                },
                {
                    id: 'n16', name: '숫자 카드', icon: '🃏',
                    cond: (p,d,t) => p===7,
                    msg: `"숫자 카드! 다음 주사위에 +1 아니면 -1!"`,
                    fx: () => Math.random()<0.5 ? { nextBonus: 1 } : { nextBonus: -1 }
                },
                {
                    id: 'n17', name: '시간 정지', icon: '⏸️',
                    cond: (p,d,t) => t===3 && p>=5 && p<=7,
                    msg: `"시간 정지! 이번 턴은 카운트 안 될 거야. ...시간은 소중하니까."`,
                    fx: () => ({ noTurnCount: true })
                },
                {
                    id: 'n18', name: '행운의 바람개비', icon: '🎋',
                    cond: (p,d,t) => p===3 && d===3,
                    msg: `"바람개비가 돌아간다! 다음 굴리기가 2번 연속!"`,
                    fx: () => ({ doubleNext: true })
                },
                {
                    id: 'n19', name: '주사위 카지노', icon: '🎰🎲',
                    cond: (p,d,t) => p===6 && t>=3,
                    msg: `"카지노! 짝수면 승! 홀수면 패! ...그냥 운이야."`,
                    fx: () => this.lastDiceValue%2===0 ? { bonus: 2 } : { pushBack: 1 }
                },
                {
                    id: 'n20', name: '신비의 숫자', icon: '🔢✨',
                    cond: (p,d,t) => d===t,
                    msg: d => `"주사위와 턴 번호가 같아! ${d}! 이거 우연 아니야!"`,
                    fx: () => ({ bonus: this.turn })
                }
            ],
            
            // ===== 부정적 이밴트 (40개) - 장난스러운 장애물 =====
            negative: [
                {
                    id: 'e01', name: '기본 망치', icon: '🔨',
                    cond: (p,d,t) => p>=4 && d>=4 && p<10,
                    msg: `"주사위가 너무 좋네? (쾅!) 1~4 주사위로 바꿔줄게."`,
                    fx: () => ({ newDice: { min:1, max:4, name:'깨진 주사위', type:'broken' }})
                },
                {
                    id: 'e02', name: '1~3 조항', icon: '📜',
                    cond: (p,d,t) => p>=5 && p<=10 && d>=4,
                    msg: `"6칸 이상부터는 1~3 주사위만 사용 가능하다는 조항이 있어. 읽어봤어?"`,
                    fx: () => ({ newDice: { min:1, max:3, name:'제한 주사위', type:'limited' }})
                },
                {
                    id: 'e03', name: '마이너스 함정', icon: '➖',
                    cond: (p,d,t) => p>=7 && p<=10 && d>=4,
                    msg: `"마이너스 함정! 다음 주사위는 -1~-3! ...앞으로 가는 거 아냐."`,
                    fx: () => ({ forceNext: { min:-3, max:-1, name:'마이너스 주사위', type:'minus' }})
                },
                {
                    id: 'e04', name: '바람 폭풍', icon: '🌪️',
                    cond: (p,d,t) => p>=6 && p<=11 && d>=3,
                    msg: `"바람이 불어! 연타로 저항해! 안 하면 뒤로 날아갈 거야!"`,
                    fx: () => ({ miniGame: 'tap' })
                },
                {
                    id: 'e05', name: '지진', icon: '🌋',
                    msg: `"지진! (화면이 흔들린다) 3칸 뒤로! ...발생 진원지는 내 방이야."`,
                    cond: (p,d,t) => p>=7 && d>=4, // v13.1: 조건 조정
                    fx: () => ({ pushBack: 3, shake: true })
                },
                {
                    id: 'e06', name: '블랙홀', icon: '🕳️',
                    cond: (p,d,t) => p>=8 && t>=2, // v13.2: 조건 완화
                    msg: `"블랙홀이 나타났어! 7칸 후퇴! ...물리학적으로 맞는 말이야."`,
                    fx: () => ({ pushBack: 7 })
                },
                {
                    id: 'e07', name: '골이 도망', icon: '🏃',
                    cond: (p,d,t) => this.goalPosition-p<=3 && d>=4,
                    msg: `"골이 도망갔어! (어이쿠!) 5칸 뒤로! ...자다가 뒤집혔나 봐."`,
                    fx: () => ({ moveGoal: this.goalPosition+5 })
                },
                {
                    id: 'e08', name: '골 실종', icon: '👻',
                    cond: (p,d,t) => this.goalPosition-p<=1 && d>=3,
                    msg: `"골이... 사라졌어? 유령인가? 잠시 후 다시 나타날 거야."`,
                    fx: () => ({ hideGoal: true, addTurns: 1 })
                },
                {
                    id: 'e09', name: '시간 역행', icon: '⏪',
                    cond: (p,d,t) => t>=4 && p>=6,
                    msg: `"시간 역행! 4~6턴 전으로... 하지만 안 좋은 쪽으로."`,
                    fx: () => ({ setPos: Math.max(0, this.position-this.r(4,6)) })
                },
                {
                    id: 'e10', name: '주사위 포식', icon: '👹',
                    cond: (p,d,t) => p>=11 && d>=5,
                    msg: `"괴물이 나타났어! (냠!) 주사위를 먹었어! 1턴 쉬어!"`,
                    fx: () => ({ skipTurns: 1 })
                },
                {
                    id: 'e11', name: '끈적한 바닥', icon: '🍯',
                    cond: (p,d,t) => p>=8 && d>=3 && d<=5,
                    msg: `"바닥이 끈적끈적! 절반만 이동해... 다리가 붙었어."`,
                    fx: () => ({ halfMove: true })
                },
                {
                    id: 'e12', name: '얼음 바닥', icon: '🧊',
                    cond: (p,d,t) => p>=7 && d>=4,
                    msg: `"얼음! 미끄러워서 1~3칸 더 감! 멈출 수 없어!"`,
                    fx: () => ({ extraSlide: this.r(1,3) })
                },
                {
                    id: 'e13', name: '함정 문', icon: '🪤',
                    cond: (p,d,t) => p>=9 && d===6,
                    msg: `"함정 문! (쾅!) 3칸 뒤로! ...발 뻗지 마."`,
                    fx: () => ({ pushBack: 3 })
                },
                {
                    id: 'e14', name: '중력 반전', icon: '⬆️',
                    cond: (p,d,t) => p>=10 && d>=5,
                    msg: `"중력 반전! 주사위 결과가 반대 방향! ...물리 법칙이 바뀌었어."`,
                    fx: () => ({ reverseMove: true })
                },
                {
                    id: 'e15', name: '짙은 안개', icon: '🌫️',
                    cond: (p,d,t) => p>=8 && t>=3,
                    msg: `"안개가 꼈어! 다음 주사위 값이 보이지 않아! ...신비롭네."`,
                    fx: () => ({ hidden: true })
                },
                {
                    id: 'e16', name: '역주행 길', icon: '↩️',
                    cond: (p,d,t) => p>=6 && d>=5,
                    msg: `"역주행 길! 2턴 동안 앞으로 못 가! 일방통행이야."`,
                    fx: () => ({ reverseMode: 2 })
                },
                {
                    id: 'e17', name: '번개', icon: '⚡',
                    cond: (p,d,t) => p>=9 && d===6,
                    msg: `"벼락! (지릉!) 주사위가 충격받아서 1~2만 나와!"`,
                    fx: () => ({ newDice: { min:1, max:2, name:'충격 주사위', type:'shocked' }})
                },
                {
                    id: 'e18', name: '스파이크 함정', icon: '📍',
                    cond: (p,d,t) => p>=8 && d>=5,
                    msg: `"스파이크! 2칸 후퇴 + 주사위가 작아짐! 날카로워!"`,
                    fx: () => ({ pushBack: 2, newDice: { min:1, max:3, name:'작은 주사위', type:'small' }})
                },
                {
                    id: 'e19', name: '달팽이 저주', icon: '🐌',
                    cond: (p,d,t) => p>=7 && d>=4 && t>=2,
                    msg: `"달팽이 저주! 느려져서 주사위가 -2! ...천천히 가자."`,
                    fx: d => ({ changeDice: Math.max(1,d-2) })
                },
                {
                    id: 'e20', name: '사막의 모래', icon: '🏜️',
                    cond: (p,d,t) => p>=8 && d>=4,
                    msg: `"사막! 모래 때문에 이동이 -1! 발이 푹푹 빠져."`,
                    fx: d => ({ changeDice: d-1 })
                },
                {
                    id: 'e21', name: '폭설', icon: '❄️',
                    cond: (p,d,t) => p>=9 && t>=3,
                    msg: `"폭설! 2턴 동안 이동 -1! 눈이 무릎까지!"`,
                    fx: () => ({ movePenalty: 2 })
                },
                {
                    id: 'e22', name: '화산 폭발', icon: '🌋🔥',
                    cond: (p,d,t) => p>=10 && d>=5,
                    msg: `"화산 폭발! (쿠아아앙!) 5칸 후퇴! 용암을 피해!"`,
                    fx: () => ({ pushBack: 5 })
                },
                {
                    id: 'e23', name: '심연', icon: '🌑',
                    cond: (p,d,t) => p>=9 && d===6 && t>=3,
                    msg: `"심연에 빠졌어! (으악!) 4칸 후퇴! 어둡고 깊어."`,
                    fx: () => ({ pushBack: 4 })
                },
                {
                    id: 'e24', name: '혼란의 미로', icon: '🌀',
                    cond: (p,d,t) => p>=8 && d>=4,
                    msg: `"혼란의 미로! (돌고 돌고) 랜덤 위치로! 길을 잃었어."`,
                    fx: () => ({ setPos: this.r(0,8) })
                },
                {
                    id: 'e25', name: '저주의 돌', icon: '🗿',
                    cond: (p,d,t) => p>=7 && d>=5,
                    msg: `"저주의 돌! 이제 주사위에서 1만 나와! ...영원히."`,
                    fx: () => ({ newDice: { min:1, max:1, name:'저주 돌', type:'cursed' }})
                },
                {
                    id: 'e26', name: '독 구름', icon: '☁️☠️',
                    cond: (p,d,t) => p>=9 && t>=3,
                    msg: `"독 구름! 숨이 막혀서 1턴 쉬어! 콜록콜록."`,
                    fx: () => ({ skipTurns: 1 })
                },
                {
                    id: 'e27', name: '낙석', icon: '🪨',
                    cond: (p,d,t) => p>=8 && d>=5,
                    msg: `"낙석! (쾅!) 2칸 후퇴! 하늘을 조심해."`,
                    fx: () => ({ pushBack: 2 })
                },
                {
                    id: 'e28', name: '수렁', icon: '🟤',
                    cond: (p,d,t) => p>=7 && d>=4,
                    msg: `"수렁! 발이 푹! 이동 거리가 반토로!"`,
                    fx: () => ({ halfMove: true })
                },
                {
                    id: 'e29', name: '가시 덤불', icon: '🌵',
                    cond: (p,d,t) => p>=8 && d>=3,
                    msg: `"가시 덤불! (찌릿!) 1칸 후퇴 + 주사위가 작아짐!"`,
                    fx: () => ({ pushBack: 1, newDice: { min:1, max:4, name:'가시 주사위', type:'thorn' }})
                },
                {
                    id: 'e30', name: '번개 폭풍', icon: '⛈️',
                    cond: (p,d,t) => p>=10 && d>=5,
                    msg: `"번개 폭풍! 연타로 피해! 안 하면 튕겨나가!"`,
                    fx: () => ({ miniGame: 'tap' })
                },
                {
                    id: 'e31', name: '거미줄', icon: '🕸️',
                    cond: (p,d,t) => p>=6 && d>=4,
                    msg: `"거미줄에 걸렸어! (버둥버둥) 이동이 -2!"`,
                    fx: d => ({ changeDice: Math.max(1,d-2) })
                },
                {
                    id: 'e32', name: '안개 늪', icon: '🌫️🌿',
                    cond: (p,d,t) => p>=7 && t>=2,
                    msg: `"안개 늪! 방향 감각 상실! 3칸 뒤로... 혹은 앞으로?"`,
                    fx: () => ({ setPos: Math.max(0, this.position-3) })
                },
                {
                    id: 'e33', name: '화염 구덩이', icon: '🔥🕳️',
                    cond: (p,d,t) => p>=8 && d>=4, // v13.1: 조건 조정
                    msg: `"화염 구덩이! (화륀!) 3칸 후퇴! 꺼지지 않아!"`,
                    fx: () => ({ pushBack: 3 })
                },
                // 중복 제거됨: e34 (혹한) - e01과 동일 (1~3 주사위)
                {
                    id: 'e35', name: '모래 폭풍', icon: '🌪️🏜️',
                    cond: (p,d,t) => p>=7 && d>=5,
                    msg: `"모래 폭풍! (휘이익!) 2칸 밀려남! 눈을 떠!"`,
                    fx: () => ({ pushBack: 2 })
                },
                {
                    id: 'e36', name: '유령의 손길', icon: '👻✋',
                    cond: (p,d,t) => p>=10 && t>=3,
                    msg: `"유령의 손길! (스슥...) 뒤로 끌려가! 2~4칸 후퇴!"`,
                    fx: () => ({ pushBack: this.r(2,4) })
                },
                {
                    id: 'e37', name: '어둠의 터널', icon: '🌑🕳️',
                    cond: (p,d,t) => p>=8 && d>=4,
                    msg: `"어둠의 터널! 2턴 동안 아무것도 안 보여! 손전등 없어."`,
                    fx: () => ({ blind: 2 })
                },
                {
                    id: 'e38', name: '지뢰', icon: '💣',
                    cond: (p,d,t) => p>=9 && d===6,
                    msg: `"지뢰! (퍼엉!) 폭발! 4칸 후퇴! 발밑을 봐!"`,
                    fx: () => ({ pushBack: 4 })
                },
                // 중복 제거됨: e39 (독침) - e01과 동일 (1~3 주사위)
                {
                    id: 'e40', name: '역습', icon: '⚔️',
                    cond: (p,d,t) => p>=10 && d>=4 && t>=4,
                    msg: `"역습! 개발자의 필승수! 5칸 후퇴! ...진짜로."`,
                    fx: () => ({ pushBack: 5 })
                }
            ],
            
            // ===== 절망 이밴트 (12개) - 필사적인 조언 =====
            despair: [
                {
                    id: 'd01', name: '우회로 생성', icon: '🚧',
                    cond: (p,d,t) => p+d>this.goalPosition && !this.extendedGoal,
                    msg: `"12칸을 넘어가 버렸네! 친절하게 우회로를 만들어줄게... 골이 18로!"`,
                    fx: () => ({ extendGoal: true })
                },
                {
                    id: 'd02', name: '함정 도로', icon: '⚠️',
                    cond: (p,d,t) => p>=10 && t===this.maxTurns,
                    msg: `"함정 도로! 매 턴 1칸씩 뒤로 밀려나! ...악순환이야."`,
                    fx: () => ({ pushBackPerTurn: 1 })
                },
                {
                    id: 'd03', name: '저주 주사위', icon: '💀',
                    cond: (p,d,t) => this.goalPosition-p<=2 && d>=2,
                    msg: `"거의 다 왔는데... 저주! 주사위에서 이제 0만 나와!"`,
                    fx: () => ({ newDice: { min:0, max:0, name:'저주 주사위', type:'cursed' }})
                },
                {
                    id: 'd04', name: '개발자 피로', icon: '😴',
                    cond: (p,d,t) => t>=this.maxTurns-1 && p>=10,
                    msg: `"제가 좀 피곤해서... 게임을 잠시 멈출게요... (3초간 정지)"`,
                    fx: () => ({ pause: 3 })
                },
                {
                    id: 'd05', name: '최종 보스', icon: '🎮',
                    cond: (p,d,t) => this.goalPosition-p<=3 && d>=3,
                    msg: `"최종 보스가 나타났어! 연타로 물리쳐! 안 하면 패배야!"`,
                    fx: () => ({ miniGame: 'boss' })
                },
                {
                    id: 'd06', name: '거울 미로', icon: '🪞',
                    cond: (p,d,t) => this.goalPosition-p<=3 && d>=3,
                    msg: `"거울 미로! (이게 원래 길이었나?) 랜덤 위치!"`,
                    fx: () => ({ setPos: this.r(0,10) })
                },
                {
                    id: 'd07', name: '시간 왜곡', icon: '🌀',
                    cond: (p,d,t) => this.goalPosition-p<=2 && t>=3,
                    msg: `"시간이 왜곡되었어! 턴이 1턴으로 리셋! ...하지만 위치는 유지."`,
                    fx: () => ({ resetTurn: true })
                },
                {
                    id: 'd08', name: '골 보호막', icon: '🛡️',
                    cond: (p,d,t) => this.goalPosition-p===1 && d>=3,
                    msg: `"골에 보호막이 생겼어! 2턴 후에 사라져! 기다려."`,
                    fx: () => ({ goalShield: 2 })
                },
                {
                    id: 'd09', name: '불가능의 벽', icon: '🧱',
                    cond: (p,d,t) => this.goalPosition-p<=3 && d>=4,
                    msg: `"불가능의 벽! 주사위가 0~1만 나와! ...거의 불가능해."`,
                    fx: () => ({ newDice: { min:0, max:1, name:'벽 주사위', type:'wall' }})
                },
                {
                    id: 'd10', name: '운명의 룰렛', icon: '🎯',
                    cond: (p,d,t) => this.goalPosition-p<=1 && t>=4,
                    msg: `"운명의 룰렛! 1/6 확률로 승리! 나머지는 시작점으로!"`,
                    fx: () => Math.random()<1/6 ? { setPos: this.goalPosition } : { setPos: 0 }
                },
                {
                    id: 'd11', name: '무한 회랑', icon: '♾️',
                    cond: (p,d,t) => p>=11 && d>=4,
                    msg: `"무한 회랑! (빙글빙글) 같은 자리에서 반복!"`,
                    fx: () => ({ setPos: this.position })
                },
                {
                    id: 'd12', name: '최후의 시련', icon: '⚔️💀',
                    cond: (p,d,t) => this.goalPosition-p===1 && t===this.maxTurns,
                    msg: `"최후의 시련! 타이밍 게임을 깨야 승리! 실패하면 패배!"`,
                    fx: () => ({ miniGame: 'timing', bonus: 0, mustWin: true })
                }
            ],
            
            // ===== 특별 이밴트 (8개) - 신비로운 운명 =====
            special: [
                {
                    id: 's01', name: '럭키 7', icon: '🍀',
                    cond: (p,d,t) => p===7 && d===1,
                    msg: `"7번 칸에서 1이 나오다니! 럭키 7! 위치를 선택해!"`,
                    choices: [
                        { text: '10칸으로', fx: () => ({ setPos: 10 }) },
                        { text: '시작점으로', fx: () => ({ setPos: 0 }) }
                    ]
                },
                {
                    id: 's02', name: '완벽한 타이밍', icon: '⏱️',
                    cond: (p,d,t) => t===3 && p===6,
                    msg: `"완벽한 타이밍! 3턴째 6번 칸! 타이밍 게임 성공 시 4칸 보너스!"`,
                    fx: () => ({ miniGame: 'timing', bonus: 4 })
                },
                {
                    id: 's03', name: '주사위 융합', icon: '⚗️',
                    cond: (p,d,t) => this.eventHistory.length>=3 && d===5,
                    msg: `"여러 이밴트를 겪었군! 주사위 에너지를 융합! 1~8!"`,
                    fx: () => ({ newDice: { values:[1,2,3,4,5,6,7,8], name:'융합 주사위', type:'fusion' }})
                },
                {
                    id: 's04', name: '주사위 분신', icon: '👥',
                    cond: (p,d,t) => d===6 && Math.random()<0.2,
                    msg: `"주사위가 분열! 분신이 생겨서 2번 더 굴릴 수 있어!"`,
                    fx: () => ({ extraRolls: 2 })
                },
                {
                    id: 's05', name: '턴 복권', icon: '🎫',
                    cond: (p,d,t) => t===2 && d===2,
                    msg: `"턴 복권! 긁어보세요! 50% 확률로 턴 3개 추가!"`,
                    fx: () => Math.random()<0.5 ? { addTurns: 3 } : { pushBack: 2 }
                },
                {
                    id: 's06', name: '미스터리 텔레포트', icon: '✨',
                    cond: (p,d,t) => p===4 && t===4,
                    msg: `"미스터리 텔레포트! 어디로 갈지 모름! 2~12 중 하나!"`,
                    fx: () => ({ setPos: this.r(2,12) })
                },
                {
                    id: 's07', name: '더블 오어 낫띵', icon: '🎰',
                    cond: (p,d,t) => t===this.maxTurns && p>=8,
                    msg: `"마지막 턴! 더블 오어 낫락! 50% 확률로 골 or 시작점!"`,
                    fx: () => Math.random()<0.5 ? { setPos: this.goalPosition } : { setPos: 0 }
                },
                {
                    id: 's08', name: '행운의 숫자', icon: '🔢',
                    cond: (p,d,t) => p===d && d<=5,
                    msg: d => `"위치와 주사위가 같아! ${d}! 우연인가 운명인가? 그만큼 보너스!"`,
                    fx: d => ({ bonus: d })
                },
                {
                    id: 's09', name: '주사위 파손', icon: '💔',
                    cond: (p,d,t) => d>=5 && p>=3 && Math.random()<0.15,
                    msg: `"으악! 주사위가 부서졌어! 0판정... 대신 새 주사위를 줄게!"`,
                    fx: () => {
                        const newDice = Math.random() < 0.5 
                            ? { min:1, max:3, name:'부서진 조각(1~3)', type:'broken_low' }
                            : { min:4, max:6, name:'날카로운 파편(4~6)', type:'broken_high' };
                        return { changeDice: 0, newDice };
                    }
                },
                {
                    id: 's10', name: '연마된 주사위', icon: '✨🎲',
                    cond: (p,d,t) => p<=2 && d<=2 && Math.random()<0.2,
                    msg: `"주사위를 연마했어! 3~5만 나오는 정밀 주사위!"`,
                    fx: () => ({ newDice: { min:3, max:5, name:'연마된 주사위(3~5)', type:'refined' } })
                },
                {
                    id: 's11', name: '무거운 주사위', icon: '🪨🎲',
                    cond: (p,d,t) => t>=3 && d>=4 && Math.random()<0.1,
                    msg: `"무거운 주사위를 얻었어! 1~2만 나오지만... 뭐, 느린 게 좋을 수도 있지."`,
                    fx: () => ({ newDice: { min:1, max:2, name:'무거운 주사위(1~2)', type:'heavy' } })
                },
                {
                    id: 's12', name: '경량 주사위', icon: '🎈🎲',
                    cond: (p,d,t) => p<=4 && t<=2 && Math.random()<0.1,
                    msg: `"가벼운 주사위! 5~6만 나오지만... 너무 가벼워서 날아갈 수도?"`,
                    fx: () => ({ newDice: { min:5, max:6, name:'경량 주사위(5~6)', type:'light' } })
                },
            ],
            
            // ===== 초기 장애물 (10개) - 시작부터 압박 =====
            early: [
                {
                    id: 'r01', name: '시작의 저주', icon: '👻',
                    cond: (p,d,t) => p<=1 && t<=2 && d<=3,
                    msg: d => `"첫 주사위가 ${d}라니... 시작부터 뭔가 잘못됐어. 턴 1개 소모!"`,
                    fx: () => ({ turnConsume: true, noMove: true })
                },
                {
                    id: 'r02', name: '배웅 없는 출발', icon: '🚶',
                    cond: (p,d,t) => p===0 && d>=5,
                    msg: `"좋은 출발이군... 하지만 너무 빠르면 넘어져. 다음 주사위 -2!"`,
                    fx: () => ({ nextBonus: -2 })
                },
                {
                    id: 'r03', name: '미끄러운 시작선', icon: '🧊',
                    cond: (p,d,t) => p<=2 && d>=3,
                    msg: `"출발선이 미끄러워! 1칸 뒤로!"`,
                    fx: () => ({ pushBack: 1 })
                },
                {
                    id: 'r04', name: '의심의 그림자', icon: '👤',
                    cond: (p,d,t) => p<=2 && t===1,
                    msg: `"누군가 지켜보는 느낌... 다음 주사위 최대 5!"`,
                    fx: () => ({ nextMax: 5 })
                },
                {
                    id: 'r05', name: '잃어버린 약속', icon: '📜',
                    cond: (p,d,t) => p<=3 && t<=2 && d===2,
                    msg: `"2칸... 어떤 약속을 잊은 것 같은데? 이동 없이 턴만 지나감!"`,
                    fx: () => ({ skipTurns: 0, noMove: true })
                },
                {
                    id: 'r06', name: '지연의 안개', icon: '🌫️',
                    cond: (p,d,t) => p<=2 && t>=2 && d<=2,
                    msg: `"안개가 꼈어... 다음 굴리기가 주사위 1~4로 제한!"`,
                    fx: () => ({ nextDiceLimit: { min:1, max:4 } })
                },
                {
                    id: 'r07', name: '첫발의 주저', icon: '😰',
                    cond: (p,d,t) => p===0 && t===2,
                    msg: `"두 번째 턴에도 시작점? 자신감 -50%! 다음 주사위 -1!"`,
                    fx: () => ({ nextBonus: -1 })
                },
                {
                    id: 'r08', name: '거짓 지름길', icon: '🚧',
                    cond: (p,d,t) => p===2 && d===6,
                    msg: `"지름길인 줄 알았는데... 막다른 골! 3칸 뒤로!"`,
                    fx: () => ({ pushBack: 3 })
                },
                {
                    id: 'r09', name: '주사위 녹슴', icon: '🔩',
                    cond: (p,d,t) => p<=3 && this.totalRolls===1 && d<=3,
                    msg: `"첫 주사위가 녹슬었어... 다음은 최대 4만!"`,
                    fx: () => ({ nextMax: 4 })
                },
                {
                    id: 'r10', name: '느린 시작', icon: '🐢',
                    cond: (p,d,t) => p<=1 && t>=2 && d<=2,
                    msg: `"아직도 1칸대? 너무 느려! 턴 소모!"`,
                    fx: () => ({ turnConsume: true })
                }
            ],
            
            // ===== 턴 압박 이벤트 (12개) - 시간 부족 =====
            turnPressure: [
                {
                    id: 't01', name: '모래시계 역전', icon: '⏳',
                    cond: (p,d,t) => t>=3 && p<=6 && d>=5,
                    msg: `"모래시계가 거꾸로! 턴이 1개 줄어들었어!"`,
                    fx: () => ({ subtractTurns: 1 })
                },
                {
                    id: 't02', name: '새로고침', icon: '🔄',
                    cond: (p,d,t) => t>=2 && p>=4 && d===1,
                    msg: `"1이 나오면... 제자리로 새로고침!"`,
                    fx: () => ({ setPos: this.position })
                },
                {
                    id: 't03', name: '턴 도난', icon: '🦹',
                    cond: (p,d,t) => t>=3 && p>=8 && d>=4,
                    msg: `"턴 도둑이 습격! 마지막 턴이 사라져!"`,
                    fx: () => ({ subtractTurns: 1 })
                },
                {
                    id: 't04', name: '타임오버 경고', icon: '⚠️',
                    cond: (p,d,t) => t===this.maxTurns-1 && this.goalPosition-p>=3,
                    msg: `"타임오버 임박! 마지막 턴에 주사위 1~3만!"`,
                    fx: () => ({ lastTurnLimit: 3 })
                },
                {
                    id: 't05', name: '시간의 구멍', icon: '🕳️⏰',
                    cond: (p,d,t) => t>=2 && d===6 && p>=5,
                    msg: `"시간에 구멍! 이동했지만 턴 2개 소모!"`,
                    fx: () => ({ extraTurnConsume: 1 })
                },
                {
                    id: 't06', name: '미래 빚', icon: '💳',
                    cond: (p,d,t) => t<=2 && p<=4 && d>=5,
                    msg: `"좋은 주사위... 하지만 나중에 갚아야 해. 다음 2턴 주사위 -2!"`,
                    fx: () => ({ nextBonus: -2, nextBonus2: -2 })
                },
                {
                    id: 't07', name: '턴 역전', icon: '↩️',
                    cond: (p,d,t) => t===this.maxTurns && p<10,
                    msg: `"마지막 턴인데 10칸 전? 2칸 뒤로!"`,
                    fx: () => ({ pushBack: 2 })
                },
                {
                    id: 't08', name: '초시계 멈춤', icon: '⏱️',
                    cond: (p,d,t) => t>=4 && d<=2,
                    msg: `"초침이 멈췄어! 이동 없이 턴만 소모!"`,
                    fx: () => ({ noMove: true })
                },
                {
                    id: 't09', name: '데드라인 축소', icon: '📐',
                    cond: (p,d,t) => t>=3 && p>=6 && d>=5,
                    msg: `"데드라인이 앞당겨졌어! 골이 한 칸 멀어져!"`,
                    fx: () => ({ extendGoal: 1 })
                },
                {
                    id: 't10', name: '서두름의 대가', icon: '🏃💨',
                    cond: (p,d,t) => t>=3 && p>=6 && d>=4,
                    msg: `"서두르다가 넘어졌어! 2칸 후퇴!"`,
                    fx: () => ({ pushBack: 2 })
                },
                {
                    id: 't11', name: '최후통지', icon: '📨',
                    cond: (p,d,t) => t===this.maxTurns-1 && d<=2,
                    msg: `"최후통지! 마지막 턴에 6이 아니면 실패!"`,
                    fx: () => ({ mustSix: true })
                },
                {
                    id: 't12', name: '시간 폭탄', icon: '💣⏰',
                    cond: (p,d,t) => t<=2 && p<=3 && d===1,
                    msg: `"시간 폭탄! 3턴 후 폭발! (폭발 시 3칸 후퇴)"`,
                    fx: () => ({ timeBomb: 3 })
                }
            ],
            
            // ===== 누적 저주 (10개) - 지속 디버프 =====
            curse: [
                {
                    id: 'c01', name: '무거운 발걸음', icon: '🥾',
                    cond: (p,d,t) => p>=4 && d<=2,
                    msg: `"발이 무거워... 다음 3턴간 이동 -1!"`,
                    fx: () => ({ movePenalty: 3 })
                },
                {
                    id: 'c02', name: '저주받은 주사위', icon: '🎲💀',
                    cond: (p,d,t) => this.totalRolls>=5 && d===1,
                    msg: `"주사위가 저주받았어... 홀수만 나와!"`,
                    fx: () => ({ diceOdd: true })
                },
                {
                    id: 'c03', name: '역주행 징조', icon: '⬅️',
                    cond: (p,d,t) => p>=6 && d<=3,
                    msg: `"역주행 징조! 다음 주사위 결과가 뒤로!"`,
                    fx: () => ({ reverseNext: true })
                },
                {
                    id: 'c04', name: '마법 억제', icon: '✨❌',
                    cond: (p,d,t) => p>=5 && t>=2 && d<=2,
                    msg: `"긍정적 이벤트 3턴간 발동 안 돼!"`,
                    fx: () => ({ blockPositive: 3 })
                },
                {
                    id: 'c05', name: '불안정 주사위', icon: '🎲↔️',
                    cond: (p,d,t) => this.totalRolls>=4 && d>=5,
                    msg: `"주사위가 불안정해! 다음 굴림 50% 확률로 반대값!"`,
                    fx: () => ({ unstableDice: true })
                },
                {
                    id: 'c06', name: '위축', icon: '😰',
                    cond: (p,d,t) => p>=7 && d>=4,
                    msg: `"위축됐어! 다음 주사위 최대 4!"`,
                    fx: () => ({ nextMax: 4 })
                },
                {
                    id: 'c07', name: '망각의 안개', icon: '🌫️🧠',
                    cond: (p,d,t) => p>=5 && t>=3 && d<=2,
                    msg: `"기억이 흐려져... 주사위 값이 안 보여!"`,
                    fx: () => ({ hidden: 2 })
                },
                {
                    id: 'c08', name: '불행의 사슐', icon: '⛓️',
                    cond: (p,d,t) => p>=6 && d>=4 && t>=2,
                    msg: `"불행 연쇄! 다음 이벤트도 부정적!"`,
                    fx: () => ({ forceNegative: true })
                },
                {
                    id: 'c09', name: '주사위 부식', icon: '🎲🧪',
                    cond: (p,d,t) => this.totalRolls>=6 && d>=3,
                    msg: `"주사위가 부식해! 다음 굴림 최대값 -1!"`,
                    fx: () => ({ diceDecay: true })
                },
                {
                    id: 'c10', name: '운명의 빚', icon: '📋💸',
                    cond: (p,d,t) => p>=8 && t>=3 && d<=3,
                    msg: `"이동이 부족해... 다음 이동의 절반이 빚 갚음!"`,
                    fx: () => ({ debtMode: true })
                }
            ],
            
            // ===== 클리어 방해 (10개) - 골 앞에서 장애 (v15c: 밸런스 강화, 5% 목표) =====
            blocker: [
                {
                    id: 'b01', name: '골인저부', icon: '🛑',
                    cond: (p,d,t) => this.goalPosition-p<=7 && d>=1, // v15c: 조건 완화 (7칸 이내)
                    msg: '"골인저부: 7칸 후퇴"',
                    fx: () => ({ pushBack: 7 })
                },
                {
                    id: 'b02', name: '마지막 관문', icon: '🚪🔒',
                    cond: (p,d,t) => this.goalPosition-p<=6 && d>=1, // v15c: 조건 완화
                    msg: '"마지막 관문: 6칸 후퇴 + 주사위 1~2"',
                    fx: () => ({ pushBack: 6, newDice: { min:1, max:2, name:'무거운 주사위', type:'heavy' }})
                },
                {
                    id: 'b03', name: '승리의 미끄럼', icon: '🏆',
                    cond: (p,d,t) => this.goalPosition-p<=4 && p>=8, // v15c: 조건 완화
                    msg: '"승리의 미끄럼: 초과하면 제자리"',
                    fx: () => ({ exactOnly: true })
                },
                {
                    id: 'b04', name: '감시의 눈', icon: '👁️',
                    cond: (p,d,t) => p>=6 && d>=1 && t>=2, // v15c: 조건 완화
                    msg: '"감시의 눈: 홀수 굴림 시 2칸 후퇴"',
                    fx: () => ({ oddPushback: 2 })
                },
                {
                    id: 'b05', name: '피니쉬 라인 이동', icon: '🏁🏃',
                    cond: (p,d,t) => this.goalPosition-p<=6 && d>=1, // v15c: 조건 완화
                    msg: '"피니쉬 라인 이동: 골 +7칸"',
                    fx: () => ({ extendGoal: 7 })
                },
                {
                    id: 'b06', name: '최종 테스트', icon: '📋',
                    cond: (p,d,t) => this.goalPosition-p<=4 && t>=2, // v15c: 조건 완화
                    msg: '"최종 테스트: 연타 게임!"',
                    fx: () => ({ miniGame: 'tap' })
                },
                {
                    id: 'b07', name: '거의 다 왔는데', icon: '😫',
                    cond: (p,d,t) => this.goalPosition-p<=6 && d>=1, // v15c: 조건 완화
                    msg: '"거의 다 왔는데: 8칸 후퇴"',
                    fx: () => ({ pushBack: 8 })
                },
                {
                    id: 'b08', name: '승리 조건 추가', icon: '✅+',
                    cond: (p,d,t) => p>=7 && t>=2 && d>=1, // v15c: 조건 완화
                    msg: '"승리 조건 추가: 홀수로만 승리"',
                    fx: () => ({ oddWinOnly: true })
                },
                {
                    id: 'b09', name: '벽', icon: '🧱',
                    cond: (p,d,t) => this.goalPosition-p<=5 && d>=1, // v15c: 조건 완화
                    msg: '"벽: 10칸 후퇴"',
                    fx: () => ({ pushBack: 10 })
                },
                {
                    id: 'b10', name: '시간 압박', icon: '⏰',
                    cond: (p,d,t) => this.goalPosition-p<=6 && t>=2, // v15c: 조건 완화
                    msg: '"시간 압박: 턴 1 소모"',
                    fx: () => ({ turnConsume: true })
                }
            ],
            
            // ===== 우회 루트 이벤트 (10개) - 12칸 초과 시 =====
            bypass: [
                { id: 'bp01', name: '블랙홀', icon: '🕳️', cond: () => true, msg: '"블랙홀: 8칸 후퇴"', fx: () => ({ pushBack: 8 }) },
                { id: 'bp02', name: '화염구덩이', icon: '🔥🕳️', cond: () => true, msg: '"화염구덩이: 5칸 후퇴"', fx: () => ({ pushBack: 5 }) },
                { id: 'bp03', name: '우회의 저주', icon: '👻', cond: () => true, msg: '"저주: 4칸 후퇴"', fx: () => ({ pushBack: 4 }) },
                { id: 'bp04', name: '순환 정체', icon: '⏳', cond: () => true, msg: '"정체: 턴+2"', fx: () => ({ addTurns: 2 }) },
                { id: 'bp05', name: '미로', icon: '🌀', cond: () => true, msg: '"미로: 5칸 후퇴"', fx: () => ({ setPos: Math.max(12, this.position - 5) }) },
                { id: 'bp06', name: '순환 역행', icon: '↩️', cond: () => true, msg: '"역행: 3칸 후퇴"', fx: () => ({ pushBack: 3 }) },
                { id: 'bp07', name: '지진', icon: '🌋', cond: () => true, msg: '"지진: 6칸 후퇴"', fx: () => ({ pushBack: 6 }) },
                { id: 'bp08', name: '낙석', icon: '🪨', cond: () => true, msg: '"낙석: 4칸 후퇴"', fx: () => ({ pushBack: 4 }) },
                { id: 'bp09', name: '심연', icon: '⚫', cond: () => true, msg: '"심연: 10칸 후퇴"', fx: () => ({ pushBack: 10 }) },
                { id: 'bp10', name: '돌풍', icon: '🌪️', cond: () => true, msg: '"돌풍: 7칸 후퇴"', fx: () => ({ pushBack: 7 }) }
            ]
        };
    }
    
    // ==================== 이밴트 선택 (밸런스 v11 - 다양성 강화) ====================
    
    selectEvent(diceValue) {
        console.log('selectEvent 호출됨, position:', this.position, 'dice:', diceValue, 'turn:', this.turn);
        const lib = this.getEventLibrary();
        const all = [...lib.positive, ...lib.neutral, ...lib.negative, ...lib.despair, ...lib.special,
                     ...lib.early, ...lib.turnPressure, ...lib.curse, ...lib.blocker];
        
        console.log('전체 이벤트 수:', all.length);
        
        // ===== 행운 효과 체크 (긍정 이벤트 100%) =====
        const hasLucky = this.activeEffects.some(e => e.id === 'lucky');
        if (hasLucky) {
            console.log('🍀 행운 효과 활성화 - 긍정 이벤트 강제!');
            const positiveEvents = lib.positive.filter(e => {
                const recentIds = this.eventHistory.slice(-5);
                if (recentIds.includes(e.id)) return false;
                try { return e.cond(this.position, diceValue, this.turn); } catch { return false; }
            });
            if (positiveEvents.length > 0) {
                return positiveEvents[this.r(0, positiveEvents.length - 1)];
            }
        }
        
        // 최근 5개 이벤트는 제외 (다양성 강화)
        const recentIds = this.eventHistory.slice(-5);
        const matching = all.filter(e => {
            if (recentIds.includes(e.id)) return false; // 최근 이벤트 제외
            try { return e.cond(this.position, diceValue, this.turn); } catch { return false; }
        });
        
        console.log('매칭된 이벤트 수:', matching.length);
        if (matching.length > 0) {
            console.log('첫 번째 매칭:', matching[0].id, matching[0].name);
        }
        
        if (matching.length === 0) return null;
        
        // ===== 우회 루트 이벤트 (우회 루트 전체, 13~bypassEnd) =====
        // 주의: this.position > 12일 때만 우회 루트로 간주
        if (this.isInBypass) {
            if (Math.random() > 0.01) { // 99% 확률로 이벤트 발생 (v15: 밸런스 강화)
                const bypassEvents = lib.bypass;
                return bypassEvents[this.r(0, bypassEvents.length - 1)];
            }
            return null;
        }
        
        // ===== 이벤트 발생 확률 (v15: 밸런스 조정 - 더 높임) =====
        const baseChance = this.position <= 3 ? 0.92 : (this.position <= 6 ? 0.96 : (this.position <= 9 ? 0.99 : 0.995));
        if (Math.random() > baseChance) return null;
        
        // ===== 카테고리별 가중치 밸런스 =====
        const diceHigh = diceValue >= 5;
        const diceLow = diceValue <= 2;
        
        // 각 카테고리에서 적어도 하나는 나오도록 보장
        const categories = {
            positive: matching.filter(e => e.id.startsWith('p')),
            neutral: matching.filter(e => e.id.startsWith('n')),
            negative: matching.filter(e => e.id.startsWith('e')),
            despair: matching.filter(e => e.id.startsWith('d')),
            special: matching.filter(e => e.id.startsWith('s')),
            early: matching.filter(e => e.id.startsWith('r')),
            turnPressure: matching.filter(e => e.id.startsWith('t')),
            curse: matching.filter(e => e.id.startsWith('c')),
            blocker: matching.filter(e => e.id.startsWith('b'))
        };
        
        // 위치별 카테고리 우선순위 (v15f: 5% 목표 강화 - 최종)
        let categoryWeights = {};
        
        if (this.position >= 9) {
            // 종반: blocker > despair > curse (v15f: 최대 강화)
            categoryWeights = {
                positive: 0.0000001, neutral: 0.00001, negative: 20,
                despair: 35, special: 0.000001, early: 0, turnPressure: 20, curse: 35, blocker: 60
            };
        } else if (this.position >= 7) {
            // 중후반: blocker > curse > negative (v15f)
            categoryWeights = {
                positive: 0.000001, neutral: 0.0001, negative: 18,
                despair: 25, special: 0.00001, early: 0, turnPressure: 18, curse: 30, blocker: 55
            };
        } else if (this.position >= 4) {
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
        
        // 전체 가중치 계산
        const weights = matching.map(e => {
            const cat = Object.keys(categories).find(k => e.id.startsWith(k.charAt(0))) || 'neutral';
            return categoryWeights[cat] || 1;
        });
        
        const total = weights.reduce((a,b) => a+b, 0);
        let rand = Math.random() * total;
        
        for (let i = 0; i < matching.length; i++) {
            rand -= weights[i];
            if (rand <= 0) return matching[i];
        }
        return matching[0];
    }
    
    // ==================== 이밴트 실행 ====================
    
    executeEvent(event, diceValue) {
        console.log('⚡ executeEvent 호출됨:', event.id, event.name);
        this.lastEventId = event.id;
        this.eventHistory.push(event.id);
        const msg = typeof event.msg === 'function' ? event.msg(diceValue) : event.msg;
        console.log('이벤트 메시지:', msg);
        
        if (event.choices) {
            this.showChoices(event, diceValue, msg);
            return;
        }
        
        // 이벤트 효과 미리 계산
        const fxResult = event.fx(diceValue);
        console.log('fx 결과:', fxResult);
        
        if (fxResult.miniGame === 'tap' || fxResult.miniGame === 'boss') {
            this.startTapGame(diceValue);
            return;
        }
        
        // 카드 사용 대기 상태로 이벤트 저장
        this.pendingEvent = { event, diceValue, fxResult, msg };
        
        // 카드 사용 가능한 이벤트 팝업 표시
        this.showEventWithCardOption(event, msg, fxResult);
    }
    
    showEventWithCardOption(event, msg, fxResult) {
        const typeClass = this.lastEventId ? this.getEventType(this.lastEventId) : 'neutral';
        
        // 이벤트 효과 미리보기
        let effectPreview = '';
        if (fxResult.bonus) effectPreview += `<div class="effect-preview positive">➕ ${fxResult.bonus}칸 전진</div>`;
        if (fxResult.recoil) effectPreview += `<div class="effect-preview negative">➖ ${Math.abs(fxResult.recoil)}칸 후퇴</div>`;
        if (fxResult.setPos !== undefined) effectPreview += `<div class="effect-preview neutral">📍 ${fxResult.setPos}칸으로 이동</div>`;
        if (fxResult.extraRolls) effectPreview += `<div class="effect-preview positive">🎲 주사위 ${fxResult.extraRolls}회 추가</div>`;
        
        // 카드 사용 안내
        const cardHint = this.hand.length > 0 ? 
            `<div class="card-hint">🎴 카드를 사용하려면 아래 손패에서 클릭!</div>` : '';
        
        this.elements.eventContent.innerHTML = `
            <div class="event-popup ${typeClass}">
                <div class="event-header">
                    <span class="event-icon-large">${event.icon}</span>
                </div>
                <div class="event-message-large">${msg}</div>
                ${effectPreview}
                ${cardHint}
                <button class="event-confirm-btn" id="eventConfirmBtn">✅ 확인</button>
            </div>
        `;
        this.elements.tapArea.classList.add('hidden');
        this.elements.choiceArea.classList.add('hidden');
        this.elements.eventArea.classList.remove('hidden');
        this.elements.eventArea.classList.add('event-active');
        
        // 손패 하이라이트
        this.highlightHand(true);
        
        // 확인 버튼 클릭 시 진행
        const confirmBtn = document.getElementById('eventConfirmBtn');
        confirmBtn.onclick = () => {
            this.highlightHand(false);
            this.elements.eventArea.classList.add('hidden');
            this.elements.eventArea.classList.remove('event-active');
            this.applyEventResult();
        };
        
        // 이벤트 영역 클릭으로도 가능
        this.elements.eventArea.onclick = (e) => {
            if (e.target === this.elements.eventArea || e.target.classList.contains('event-popup')) {
                confirmBtn.click();
            }
        };
    }
    
    // 저장된 이벤트 결과 적용
    applyEventResult() {
        if (!this.pendingEvent) return;
        
        const { fxResult, diceValue } = this.pendingEvent;
        this.pendingEvent = null;
        this.applyResult(fxResult, diceValue);
    }
    
    // 손패 하이라이트
    highlightHand(active) {
        const handArea = document.getElementById('handArea');
        if (!handArea) return;
        
        if (active) {
            handArea.classList.add('highlight');
        } else {
            handArea.classList.remove('highlight');
        }
    }
    
    showChoices(event, diceValue, msg) {
        // 이벤트 타입에 따른 스타일
        const typeClass = this.getEventType(event.id);
        
        this.elements.eventContent.innerHTML = `
            <div class="event-popup ${typeClass}">
                <div class="event-header">
                    <span class="event-icon-large">${event.icon}</span>
                </div>
                <div class="event-message-large">${msg}</div>
            </div>
        `;
        this.elements.choiceArea.innerHTML = '';
        this.elements.choiceArea.classList.remove('hidden');
        this.elements.tapArea.classList.add('hidden');
        this.elements.eventArea.classList.remove('hidden');
        this.elements.eventArea.classList.add('event-active');
        
        // 버튼에 호버 사운드 느낌의 효과
        event.choices.forEach((c, i) => {
            const btn = document.createElement('button');
            btn.className = 'choice-button fancy-hover';
            btn.style.animationDelay = `${i * 0.1}s`;
            btn.textContent = c.text;
            btn.onclick = () => {
                this.elements.eventArea.classList.add('event-closing');
                setTimeout(() => {
                    this.elements.eventArea.classList.add('hidden');
                    this.elements.eventArea.classList.remove('event-active', 'event-closing');
                    this.applyResult(c.fx(), diceValue);
                }, 200);
            };
            this.elements.choiceArea.appendChild(btn);
        });
    }
    
    showEvent(icon, msg, callback) {
        // 이벤트 타입 감지
        const typeClass = this.lastEventId ? this.getEventType(this.lastEventId) : 'neutral';
        
        this.elements.eventContent.innerHTML = `
            <div class="event-popup ${typeClass}">
                <div class="event-header">
                    <span class="event-icon-large">${icon}</span>
                </div>
                <div class="event-message-large">${msg}</div>
                <button class="event-confirm-btn" id="eventConfirmBtn">✅ 확인</button>
            </div>
        `;
        this.elements.tapArea.classList.add('hidden');
        this.elements.choiceArea.classList.add('hidden');
        this.elements.eventArea.classList.remove('hidden');
        this.elements.eventArea.classList.add('event-active');
        
        // 확인 버튼 클릭 시 진행
        const confirmBtn = document.getElementById('eventConfirmBtn');
        confirmBtn.onclick = () => {
            this.elements.eventArea.classList.add('hidden');
            this.elements.eventArea.classList.remove('event-active');
            this.elements.eventArea.onclick = null;
            callback();
        };
        
        // 이벤트 영역 클릭으로도 가능
        this.elements.eventArea.onclick = (e) => {
            if (e.target === this.elements.eventArea || e.target.classList.contains('event-popup')) {
                confirmBtn.click();
            }
        };
    }
    
    getEventType(eventId) {
        if (!eventId) return 'neutral';
        const prefix = eventId.charAt(0);
        switch(prefix) {
            case 'p': return 'positive';
            case 'n': return 'neutral';
            case 'e': return 'negative';
            case 'd': return 'despair';
            case 's': return 'special';
            case 'r': return 'early';
            case 't': return 'turnPressure';
            case 'c': return 'curse';
            case 'b': return 'blocker';
            default: return 'neutral';
        }
    }
    
    applyResult(r, dice) {
        if (r.setPos !== undefined) {
            this.position = r.setPos;
            this.updateBoard();
            this.addLog('event', `위치 → ${this.position}칸`);
            this.endTurn();
        } else if (r.bonus) {
            this.addLog('event', `+${r.bonus}칸 보너스!`);
            this.movePlayer(dice + r.bonus);
        } else if (r.pushBack) {
            this.addLog('event', `${r.pushBack}칸 후퇴...`);
            // 주사위 값에서 pushBack을 뺀 만큼 이동
            const netMove = dice - r.pushBack;
            if (netMove > 0) {
                this.movePlayer(netMove);
            } else {
                // 후퇴이면 현재 위치에서 후퇴
                this.position = Math.max(0, this.position - r.pushBack);
                this.updateBoard();
                this.updateStatus();
                this.addLog('player', `${r.pushBack}칸 후퇴 → ${this.position}`);
                this.endTurn();
            }
        } else if (r.newDice) {
            this.currentDice = { ...r.newDice };
            this.updateDiceInfo();
            this.animateDiceChange(); // 주사위 변경 애니메이션
            this.addLog('event', `주사위: "${this.currentDice.name}"`);
            this.movePlayer(dice);
        } else if (r.forceNext) {
            this.forceDice = { ...r.forceNext };
            this.addLog('event', `다음: ${this.forceDice.name}`);
            this.movePlayer(dice);
        } else if (r.addTurns) {
            const oldMaxTurns = this.maxTurns;
            this.maxTurns += r.addTurns;
            this.animateTurnChange(oldMaxTurns, this.maxTurns); // 턴 변경 애니메이션
            this.addLog('event', `턴 +${r.addTurns}! (${this.maxTurns}턴)`);
            this.movePlayer(dice);
        } else if (r.extendGoal) {
            this.extendedGoal = true;
            this.goalPosition = 18;
            this.addLog('event', '골→18칸!');
            this.updateBoard();
            // 골 변경 애니메이션
            setTimeout(() => {
                const goalCell = document.querySelector('.cell.goal');
                if (goalCell) {
                    goalCell.classList.add('goal-extended');
                }
            }, 100);
            this.movePlayer(dice);
        } else if (r.skipTurns) {
            this.turn += r.skipTurns;
            this.addLog('event', `${r.skipTurns}턴 스킵!`);
            this.endTurn();
        } else if (r.halfMove) {
            const half = Math.floor(dice / 2);
            this.addLog('event', `반토! ${half}칸만!`);
            this.movePlayer(half);
        } else if (r.reverseMove) {
            this.addLog('event', '거리 반전!');
            this.movePlayer(-dice);
        } else if (r.extraSlide) {
            this.addLog('event', `미끄러짐! +${r.extraSlide}칸!`);
            this.movePlayer(dice + r.extraSlide);
        } else if (r.changeDice !== undefined) {
            this.elements.diceValue.textContent = r.changeDice;
            this.addLog('event', `주사위 → ${r.changeDice}`);
            this.movePlayer(r.changeDice);
        } else if (r.pause) {
            this.addLog('event', `${r.pause}초 정지...`);
            setTimeout(() => this.movePlayer(dice), r.pause * 1000);
        } else if (r.movePenalty) {
            // 이동 페널티 (지속 효과)
            this.addActiveEffect('movePenalty', '무거운 발걸음', '🥾', r.movePenalty, 'debuff');
            this.addLog('event', `🥾 ${r.movePenalty}턴간 이동 -1!`);
            this.movePlayer(dice - 1);
        } else if (r.blockPositive) {
            // 긍정적 이벤트 차단 (지속 효과)
            this.addActiveEffect('blockPositive', '마법 억제', '✨❌', r.blockPositive, 'debuff');
            this.addLog('event', `✨❌ ${r.blockPositive}턴간 긍정 이벤트 차단!`);
            this.movePlayer(dice);
        } else if (r.diceOdd) {
            // 홀수만 나오는 주사위 (지속 효과)
            this.addActiveEffect('diceOdd', '저주받은 주사위', '🎲💀', 5, 'debuff');
            this.addLog('event', `🎲💀 5턴간 홀수만!`);
            this.movePlayer(dice);
        } else if (r.reverseNext) {
            // 다음 주사위 역전 (1회성)
            this.addActiveEffect('reverseNext', '역주행 징조', '⬅️', 2, 'debuff');
            this.addLog('event', `⬅️ 다음 2턴 주사위 반대!`);
            this.movePlayer(dice);
        } else if (r.unstableDice) {
            // 불안정 주사위 (지속 효과)
            this.addActiveEffect('unstableDice', '불안정 주사위', '🎲↔️', 3, 'debuff');
            this.addLog('event', `🎲↔️ 3턴간 50% 반전!`);
            this.movePlayer(dice);
        } else if (r.goalShield) {
            // 골 보호막 (N턴 후 해제)
            this.addActiveEffect('goalShield', '골 보호막', '🛡️', r.goalShield, 'buff');
            this.addLog('event', `🛡️ ${r.goalShield}턴간 골 보호!`);
            this.movePlayer(dice);
        } else if (r.timeBomb) {
            // 시간 폭탄 (N턴 후 폭발)
            this.addActiveEffect('timeBomb', '시간 폭탄', '💣⏰', r.timeBomb, 'debuff');
            this.addLog('event', `💣⏰ ${r.timeBomb}턴 후 폭발! (3칸 후퇴)`);
            this.movePlayer(dice);
        } else if (r.nextBonus !== undefined) {
            // 다음 턴 주사위 보너스/페널티
            const turns = r.nextBonus2 ? 2 : 1;
            const sign = r.nextBonus > 0 ? '+' : '';
            const type = r.nextBonus > 0 ? 'buff' : 'debuff';
            this.addActiveEffect('nextBonus', `주사위 ${sign}${r.nextBonus}`, '🎯', turns, type);
            this.addLog('event', `🎯 다음 ${turns}턴 주사위 ${sign}${r.nextBonus}!`);
            this.movePlayer(dice);
        } else if (r.nextMax) {
            // 다음 턴 주사위 최대값 제한
            this.addActiveEffect('nextMax', `주사위 최대 ${r.nextMax}`, '🎲⬇️', 1, 'debuff');
            this.addLog('event', `🎲⬇️ 다음 턴 최대 ${r.nextMax}!`);
            this.movePlayer(dice);
        } else if (r.nextDiceLimit) {
            // 다음 턴 주사위 범위 제한
            this.addActiveEffect('nextDiceLimit', `주사위 ${r.nextDiceLimit.min}~${r.nextDiceLimit.max}`, '🎲🔒', 1, 'debuff');
            this.addLog('event', `🎲🔒 다음 턴 ${r.nextDiceLimit.min}~${r.nextDiceLimit.max}만!`);
            this.movePlayer(dice);
        } else if (r.doubleNext) {
            // 다음 턴 두 배
            this.addActiveEffect('doubleNext', '다음 턴 두 배', '✖️2️⃣', 1, 'buff');
            this.addLog('event', `✖️2️⃣ 다음 턴 두 배!`);
            this.movePlayer(dice);
        } else if (r.lucky) {
            // 럭키 모드
            this.addActiveEffect('lucky', '럭키 모드', '🍀', 3, 'buff');
            this.addLog('event', `🍀 3턴간 럭키!`);
            this.movePlayer(dice);
        } else if (r.shield) {
            // 실드
            this.addActiveEffect('shield', '실드', '🛡️', r.shield, 'buff');
            this.addLog('event', `🛡️ ${r.shield}회 보호!`);
            this.movePlayer(dice);
        } else if (r.reverseMode) {
            // 역전 모드
            this.addActiveEffect('reverseMode', '역전 모드', '🔄', r.reverseMode, 'buff');
            this.addLog('event', `🔄 ${r.reverseMode}턴간 역전!`);
            this.movePlayer(dice);
        } else if (r.blind) {
            // 블라인드
            this.addActiveEffect('blind', '블라인드', '🙈', r.blind, 'debuff');
            this.addLog('event', `🙈 ${r.blind}턴간 블라인드!`);
            this.movePlayer(dice);
        } else if (r.hidden) {
            // 숨김 모드
            const turns = typeof r.hidden === 'number' ? r.hidden : 2;
            this.addActiveEffect('hidden', '숨김 모드', '👁️❌', turns, 'debuff');
            this.addLog('event', `👁️❌ ${turns}턴간 숨김!`);
            this.movePlayer(dice);
        } else if (r.noMove) {
            // 이동 없음
            this.addLog('event', `🚫 이동 없이 턴 소모!`);
            this.endTurn();
        } else if (r.noTurnCount) {
            // 턴 카운트 안 함
            this.addActiveEffect('noTurnCount', '턴 카운트 안 함', '⏭️', 1, 'buff');
            this.addLog('event', `⏭️ 이번 턴 카운트 안 함!`);
            this.movePlayer(dice);
        } else if (r.turnConsume) {
            // 턴 소모만
            this.addLog('event', `⏳ 이동 없이 턴만 소모!`);
            this.endTurn();
        } else {
            this.movePlayer(dice);
        }
    }
    
    // ==================== 주사위 굴리기 ====================
    
    rollDice() {
        if (this.gameOver || this.isRolling) return;
        this.isRolling = true;
        this.elements.rollButton.disabled = true;
        this.totalRolls++;
        
        // 주사위 연출 개선
        this.elements.diceDisplay.classList.add('rolling');
        this.elements.diceValue.classList.add('dice-rolling-number');
        
        let count = 0;
        const maxCount = 20;
        const interval = setInterval(() => {
            // 점점 느려지는 효과
            const value = this.getDiceValue();
            this.elements.diceValue.textContent = value;
            this.elements.diceValue.style.transform = `scale(${1 + Math.sin(count * 0.5) * 0.2})`;
            
            if (++count >= maxCount) {
                clearInterval(interval);
                this.elements.diceDisplay.classList.remove('rolling');
                this.elements.diceValue.classList.remove('dice-rolling-number');
                this.elements.diceValue.style.transform = 'scale(1)';
                this.showDiceResult(this.getDiceValue());
            }
        }, 50 + count * 2);
    }
    
    showDiceResult(diceValue) {
        this.elements.diceValue.textContent = diceValue;
        this.elements.diceValue.classList.add('dice-result-pop');
        
        setTimeout(() => {
            this.elements.diceValue.classList.remove('dice-result-pop');
            this.onDiceRolled(diceValue);
        }, 400);
    }
    
    getDiceValue() {
        if (this.forceDice) {
            const dice = { ...this.forceDice };
            this.forceDice = null;
            this.currentDice = dice;
        }
        if (this.currentDice.values) {
            return this.currentDice.values[this.r(0, this.currentDice.values.length-1)];
        }
        return this.r(this.currentDice.min, this.currentDice.max);
    }
    
    onDiceRolled(diceValue) {
        console.log('🎲 onDiceRolled 호출됨, diceValue:', diceValue);
        this.lastDiceValue = diceValue;
        this.updateDiceInfo();
        
        const event = this.selectEvent(diceValue);
        console.log('선택된 이벤트:', event ? `${event.id} - ${event.name}` : 'null');
        
        if (event) {
            this.addLog('player', `🎲 ${diceValue}!`);
            this.executeEvent(event, diceValue);
        } else {
            this.addLog('player', `${diceValue}! (이벤트 없음)`);
            this.movePlayer(diceValue);
        }
    }
    
    // ==================== 이동 ====================
    
    // 슬라이딩 애니메이션 실행 - 한 칸씩 순차 이동
    async animateBoardSlide(fromPos, toPos, isEventMove = false) {
        const track = document.querySelector('.board-track');
        const player = document.querySelector('.player-character');
        const positionNumber = document.querySelector('.position-number');
        
        if (!track) return;
        
        const diff = toPos - fromPos;
        const steps = Math.abs(diff);
        const direction = diff > 0 ? 'left' : 'right';
        
        // 한 칸씩 순차적으로 이동
        for (let i = 0; i < steps; i++) {
            const currentStep = fromPos + (diff > 0 ? i + 1 : -(i + 1));
            
            // 애니메이션 클래스 추가
            track.classList.remove('sliding-left', 'sliding-right', 'event-move-left', 'event-move-right');
            
            // 이벤트 후 이동은 더 강한 효과
            if (isEventMove) {
                track.classList.add(`event-move-${direction}`);
                if (player) {
                    player.classList.remove('moving', 'event-moving', 'recoil');
                    player.classList.add(diff > 0 ? 'event-moving' : 'recoil');
                }
            } else {
                track.classList.add(`sliding-${direction}`);
                if (player) {
                    player.classList.remove('moving', 'event-moving', 'recoil');
                    player.classList.add('moving');
                }
            }
            
            // 위치 숫자 변경 애니메이션
            if (positionNumber) {
                positionNumber.classList.remove('changing');
                positionNumber.classList.add('changing');
            }
            
            // 보드 즉시 업데이트 (현재 스텝 위치)
            this.updateBoardAtPosition(currentStep);
            
            // 애니메이션 대기
            await this.sleep(isEventMove ? 400 : 350);
        }
    }
    
    // 특정 위치에서 보드 업데이트 (애니메이션용)
    updateBoardAtPosition(pos) {
        const positionDisplay = document.querySelector('.board-position-display');
        const track = document.querySelector('.board-track');
        
        if (!track) return;
        
        const isKorean = (typeof currentLang === 'undefined' || currentLang === 'ko');
        const currentPosition = pos;
        const goalPosition = this.goalPosition;
        const isGoal = currentPosition >= goalPosition && !this.isInBypass;
        
        // 위치 표시 업데이트
        if (positionDisplay) {
            const numEl = positionDisplay.querySelector('.position-number');
            if (numEl) {
                numEl.textContent = currentPosition;
                numEl.className = `position-number ${isGoal ? 'goal' : ''}`;
            }
        }
        
        // 트랙 업데이트
        const visibleRange = 2;
        let cells = [];
        
        if (this.isInBypass) {
            const bypassEnd = 12 + this.bypassLength;
            for (let i = 13; i <= bypassEnd; i++) {
                cells.push({ num: i, type: 'bypass' });
            }
        } else {
            for (let i = 0; i <= 12; i++) {
                let type = '';
                if (i === 0) type = 'start';
                else if (i === this.goalPosition) type = 'goal';
                else if (i <= 6) type = 'safe';
                else type = 'danger';
                cells.push({ num: i, type: type });
            }
        }
        
        const currentIndex = cells.findIndex(c => c.num === pos);
        const startIndex = Math.max(0, currentIndex - visibleRange);
        const endIndex = Math.min(cells.length - 1, currentIndex + visibleRange);
        
        // 기존 칸 제거
        track.innerHTML = '';
        
        // 새 칸 생성
        for (let i = startIndex; i <= endIndex; i++) {
            const cellData = cells[i];
            const cell = document.createElement('div');
            cell.className = 'track-cell';
            cell.textContent = cellData.num;
            
            if (cellData.type) cell.classList.add(cellData.type);
            if (cellData.num === pos) cell.classList.add('current');
            
            const distance = Math.abs(i - currentIndex);
            if (distance >= visibleRange) cell.classList.add('blurred');
            
            track.appendChild(cell);
        }
        
        // 화살표 힌트 업데이트
        const hints = document.querySelector('.board-hints');
        if (hints) {
            const leftHint = hints.querySelector('.hint-left');
            const rightHint = hints.querySelector('.hint-right');
            const maxPos = this.isInBypass ? (12 + this.bypassLength) : this.goalPosition;
            
            if (leftHint) leftHint.className = `hint-left ${pos > 0 ? 'visible' : ''}`;
            if (rightHint) rightHint.className = `hint-right ${pos < maxPos ? 'visible' : ''}`;
        }
    }
    
    // 유틸리티: sleep
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    movePlayer(spaces, isEventRecoil = false) {
        // 비동기 이동 처리
        this._doMovePlayer(spaces, isEventRecoil);
    }
    
    async _doMovePlayer(spaces, isEventRecoil) {
        const fromPos = this.position;
        const direction = spaces > 0 ? 1 : -1;
        const steps = Math.abs(spaces);
        
        // 한 칸씩 순차적으로 이동
        for (let i = 0; i < steps; i++) {
            // 다음 위치 계산
            let nextPos = this.position + direction;
            
            // ===== 이벤트 후퇴 체크 =====
            if (isEventRecoil) {
                this.position = Math.max(0, nextPos);
                
                // 12칸 도착 시 승리
                if (this.position === 12) {
                    await this.animateBoardSlide(this.position - direction, 12, true);
                    this.addLog('event', '🎉 이벤트 후퇴로 12칸 도착!');
                    this.victory();
                    return;
                }
                
                // 12칸 이하로 내려가면 우회로에서 벗어남
                if (this.position < 12) {
                    this.isInBypass = false;
                    this.bypassLength = 0;
                }
                
                await this.animateBoardSlide(this.position - direction, this.position, true);
                continue;
            }
            
            // ===== 현재 위치 업데이트 =====
            this.position = nextPos;
            
            // ===== 12칸 도착 승리 판정 =====
            if (this.position === 12 && !this.isInBypass) {
                await this.animateBoardSlide(this.position - direction, 12);
                this.victory();
                return;
            }
            
            // ===== 12칸 초과 시 우회 루트 생성 =====
            if (this.position > 12 && !this.isInBypass) {
                // 우회 루트 생성 (한 번만)
                if (this.bypassLength === 0) {
                    this.bypassLength = this.r(3, 6);
                    this.isInBypass = true;
                    this.addLog('event', `🚧 우회 루트 ${this.bypassLength}칸 생성! (12→${12 + this.bypassLength}→12)`);
                }
            }
            
            // ===== 우회 루트에서 이동 =====
            if (this.isInBypass) {
                const currentBypassEnd = 12 + this.bypassLength;
                
                // 순환 처리
                if (this.position > currentBypassEnd) {
                    const overflow = this.position - currentBypassEnd;
                    this.position = 12 + overflow;
                    
                    if (this.position === 12) {
                        await this.animateBoardSlide(currentBypassEnd, 12);
                        this.isInBypass = false;
                        this.bypassLength = 0;
                        this.addLog('event', '🔄 우회 루트 순환 완료!');
                        this.victory();
                        return;
                    }
                }
                
                // 12칸 이하로 내려가면 우회 루트 종료
                if (this.position <= 12) {
                    this.isInBypass = false;
                    this.bypassLength = 0;
                    if (this.position === 12) {
                        await this.animateBoardSlide(this.position - direction, 12);
                        this.addLog('event', '🎉 12칸 도착!');
                        this.victory();
                        return;
                    }
                }
            }
            
            // 슬라이딩 애니메이션 (한 칸)
            await this.animateBoardSlide(this.position - direction, this.position);
        }
        
        // 최종 상태 업데이트
        this.updateBoard();
        this.updateStatus();
        
        if (spaces > 0) {
            if (this.isInBypass && fromPos <= 12) {
                this.addLog('event', `⚠️ 우회 루트 진입! (${this.position}칸)`);
            }
            this.addLog('player', `${spaces}칸 → ${this.position}`);
        } else if (spaces < 0) {
            this.addLog('player', `${Math.abs(spaces)}칸 후퇴 → ${this.position}`);
        }
        
        this.endTurn();
    }
    
    endTurn() {
        // 지속 효과 턴 감소
        this.tickActiveEffects();
        
        // 카드 사용 플래그 리셋
        this.cardUsedThisTurn = false;
        
        this.turn++;
        if (this.turn > this.maxTurns) { this.defeat(); return; }
        this.updateStatus();
        this.isRolling = false;
        this.elements.rollButton.disabled = false;
        
        // 턴마다 카드 1장 뽑기
        if (this.hand.length < this.maxHandSize) {
            const drawn = this.drawCard();
            if (drawn) {
                this.addLog('system', `🎴 ${drawn.name} 카드를 뽑았습니다!`);
            }
        }
        
        // 다음 턴 예고
        this.showNextTurnPreview();
    }
    
    // 다음 턴에 발생할 수 있는 특별 이벤트 예고
    showNextTurnPreview() {
        const previews = [];
        const lib = this.getEventLibrary();
        
        // 턴 압박 이벤트 체크
        lib.turnPressure.forEach(e => {
            try {
                if (e.cond(this.position, 1, this.turn) || e.cond(this.position, 6, this.turn)) {
                    previews.push(`⚠️ ${e.name}: 이번 턴 가능`);
                }
            } catch {}
        });
        
        // 특수 이벤트 체크
        lib.special.forEach(e => {
            try {
                if (e.cond(this.position, 1, this.turn) || e.cond(this.position, 6, this.turn)) {
                    previews.push(`✨ ${e.name}: 이번 턴 가능`);
                }
            } catch {}
        });
        
        // 저주 이벤트 체크
        lib.curse.forEach(e => {
            try {
                if (e.cond(this.position, 1, this.turn) || e.cond(this.position, 6, this.turn)) {
                    previews.push(`👻 ${e.name}: 이번 턴 가능`);
                }
            } catch {}
        });
        
        // 미리보기 표시 (최대 3개)
        if (previews.length > 0) {
            const display = previews.slice(0, 3);
            display.forEach(p => this.addLog('system', p));
        }
    }
    
    // ==================== 지속 효과 관리 ====================
    
    // 지속 효과 추가
    addActiveEffect(id, name, icon, turns, type = 'buff') {
        // 이미 있는 효과면 턴 갱신
        const existing = this.activeEffects.find(e => e.id === id);
        if (existing) {
            existing.turnsLeft = turns;
        } else {
            this.activeEffects.push({ id, name, icon, turnsLeft: turns, type });
        }
        this.updateActiveEffectsUI();
    }
    
    // 지속 효과 제거
    removeActiveEffect(id) {
        this.activeEffects = this.activeEffects.filter(e => e.id !== id);
        this.updateActiveEffectsUI();
    }
    
    // 지속 효과 턴 감소
    tickActiveEffects() {
        const expired = [];
        this.activeEffects.forEach(e => {
            e.turnsLeft--;
            if (e.turnsLeft <= 0) {
                expired.push(e);
            }
        });
        // 만료된 효과 처리
        expired.forEach(e => {
            // 만료 시 효과 발동 (팝업 포함)
            if (e.id === 'timeBomb') {
                this.position = Math.max(0, this.position - 3);
                this.updateBoard();
                this.showEvent('💣', '시간 폭탄 폭발! 3칸 후퇴!', () => {
                    this.addLog('event', '💣 폭발! 3칸 후퇴!');
                });
            } else if (e.id === 'goalShield') {
                this.showEvent('🛡️', '골 보호막이 사라졌어!', () => {
                    this.addLog('event', '🛡️ 골 보호막 해제!');
                });
            } else if (e.id === 'movePenalty') {
                this.showEvent('🥾', '발이 가벼워졌어! 페널티 해제!', () => {
                    this.addLog('system', '🥾 이동 페널티 종료');
                });
            } else if (e.id === 'blockPositive') {
                this.showEvent('✨', '마법 억제 해제! 긍정 이벤트 가능!', () => {
                    this.addLog('system', '✨ 마법 억제 종료');
                });
            } else if (e.id === 'lucky') {
                this.showEvent('🍀', '럭키 모드 종료!', () => {
                    this.addLog('system', '🍀 럭키 모드 종료');
                });
            } else if (e.id === 'blind') {
                this.showEvent('🙈', '블라인드 해제! 이제 보여!', () => {
                    this.addLog('system', '🙈 블라인드 종료');
                });
            } else {
                this.addLog('system', `${e.icon} ${e.name} 효과 종료`);
            }
            this.activeEffects = this.activeEffects.filter(ae => ae.id !== e.id);
        });
        this.updateActiveEffectsUI();
    }
    
    // 지속 효과 UI 업데이트
    updateActiveEffectsUI() {
        if (!this.elements.activeEffects) return;
        
        if (this.activeEffects.length === 0) {
            this.elements.activeEffects.innerHTML = '<div class="no-effects">현재 활성 효과 없음</div>';
            return;
        }
        
        this.elements.activeEffects.innerHTML = this.activeEffects.map(e => `
            <div class="effect-item ${e.type}" data-effect-id="${e.id}" title="${this.getEffectDescription(e.id)}">
                <span class="effect-icon">${e.icon}</span>
                <span class="effect-name">${e.name}</span>
                <span class="effect-turns">${e.turnsLeft}턴</span>
            </div>
        `).join('');
    }
    
    // 이펙트 설명 가져오기
    getEffectDescription(effectId) {
        const descriptions = {
            movePenalty: '毎 턴 이동 -1',
            blockPositive: '긍정적 이벤트 발동 안 됨',
            diceOdd: '주사위가 홀수만 나옴',
            reverseNext: '주사위 결과가 반대로',
            unstableDice: '50% 확률로 주사위 반전',
            goalShield: '골 도달 시 보호됨',
            timeBomb: '만료 시 3칸 후퇴',
            nextBonus: '다음 주사위에 보너스/페널티 적용',
            nextMax: '다음 주사위 최대값 제한',
            nextDiceLimit: '다음 주사위 범위 제한',
            doubleNext: '다음 이동 두 배',
            lucky: '긍정적 이벤트 확률 증가',
            shield: '부정적 효과 1회 차단',
            reverseMode: '후퇴가 전진으로 변경',
            blind: '주사위 결과 안 보임',
            hidden: '보드 상태 안 보임',
            noTurnCount: '이번 턴 카운트 제외'
        };
        return descriptions[effectId] || '효과 설명 없음';
    }
    
    // ==================== 미니게임 ====================
    
    startTapGame(diceValue) {
        this.taps = 0;
        this.targetTaps = this.r(25, 40);
        
        this.elements.eventContent.innerHTML = `<div class="event-icon">🌪️</div><div class="event-message">연타로 저항! (${this.targetTaps}회)</div>`;
        this.elements.tapArea.classList.remove('hidden');
        this.elements.choiceArea.classList.add('hidden');
        this.elements.eventArea.classList.remove('hidden');
        this.elements.tapBar.style.width = '0%';
        this.tapDice = diceValue;
    }
    
    handleTap() {
        this.taps++;
        const progress = Math.min(100, (this.taps / this.targetTaps) * 100);
        this.elements.tapBar.style.width = `${progress}%`;
        
        if (this.taps >= this.targetTaps) {
            this.elements.eventArea.classList.add('hidden');
            const pushback = Math.max(0, 3 - Math.floor(this.taps / 12));
            if (pushback === 0) this.addLog('event', '완벽 저항! 안 밀려남!');
            else this.addLog('event', `${pushback}칸 밀려남`);
            this.movePlayer(this.tapDice - pushback);
        }
    }
    
    // ==================== 헬퍼 ====================
    
    mysteryBox() {
        const items = [
            { icon: '🎁', msg: '3칸 전진!', fx: { bonus: 3 } },
            { icon: '💣', msg: '3칸 후퇴...', fx: { pushBack: 3 } },
            { icon: '🎲', msg: '주사위 업!', fx: { newDice: { min: 3, max: 6, name:'업 주사위', type:'up' }}},
            { icon: '👻', msg: '아무것도 없음', fx: {} },
            { icon: '🦟', msg: '벌레! 1칸 후퇴', fx: { pushBack: 1 } },
            { icon: '✨', msg: '마법! 다음 +2!', fx: { nextBonus: 2 } }
        ];
        return items[this.r(0, items.length-1)].fx;
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
        const w = [
            { bonus: 2 }, { pushBack: 1 },
            { skipTurns: 1 }, { addTurns: 1 }
        ];
        return w[this.r(0, w.length-1)];
    }
    
    miniRoulette() {
        const n = this.r(0, 5);
        if (n < 2) return { bonus: 2 };
        if (n < 4) return { pushBack: 1 };
        return { addTurns: 1 };
    }
    
    // ==================== 게임 상태 ====================
    
    victory() {
        this.gameOver = true;
        this.updateBoard();
        this.updateStatus();
        
        // 언어 팩 사용
        const LANG = (typeof currentLang !== 'undefined' && currentLang === 'en') ? (typeof LANG_EN !== 'undefined' ? LANG_EN : null) : (typeof LANG_KO !== 'undefined' ? LANG_KO : null);
        const isKorean = !LANG || currentLang === 'ko';
        
        const victoryMsg = isKorean 
            ? '"축하해... 이거 쉬운 거야." 😈' 
            : '"Congrats... that was easy." 😈';
        this.addLog('system', `🎉 ${LANG ? LANG.result.victory : '승리!'} ${this.turn}${isKorean ? '턴 만에 클리어!' : ' turns to clear!'} ${victoryMsg}`);
        
        this.elements.resultIcon.textContent = '🎉';
        this.elements.resultText.textContent = LANG ? LANG.result.victory : '🎉 승리!';
        this.elements.resultText.className = 'result-text victory';
        this.elements.resultDetail.textContent = isKorean 
            ? `${this.turn}턴 만에 클리어!` 
            : `Cleared in ${this.turn} turns!`;
        
        // 통계 표시 (라벨과 값 분리)
        const stats = LANG ? LANG.result.stats : null;
        const statsHtml = `
            <div class="stat-row"><span class="stat-label">${stats ? stats.totalRolls : '총 주사위 굴림'}</span><span class="stat-value">${this.totalRolls}${isKorean ? '회' : ' times'}</span></div>
            <div class="stat-row"><span class="stat-label">${stats ? stats.events : '발생한 이벤트'}</span><span class="stat-value">${this.eventHistory.length}${isKorean ? '회' : ' times'}</span></div>
            <div class="stat-row"><span class="stat-label">${stats ? stats.finalPosition : '최종 위치'}</span><span class="stat-value">${this.position}${isKorean ? '칸' : ''}</span></div>
            <div class="stat-row"><span class="stat-label">${isKorean ? '최종 주사위' : 'Final Dice'}</span><span class="stat-value">${this.currentDice.name}</span></div>
        `;
        const statsEl = document.getElementById('resultStats');
        if (statsEl) statsEl.innerHTML = statsHtml;
        
        this.elements.resultScreen.classList.remove('hidden');
        // 애니메이션 트리거 (약간의 지연 추가)
        setTimeout(() => {
            this.elements.resultScreen.classList.add('result-show');
        }, 10);
    }
    
    defeat() {
        this.gameOver = true;
        
        // 언어 팩 사용
        const LANG = (typeof currentLang !== 'undefined' && currentLang === 'en') ? (typeof LANG_EN !== 'undefined' ? LANG_EN : null) : (typeof LANG_KO !== 'undefined' ? LANG_KO : null);
        const isKorean = !LANG || currentLang === 'ko';
        
        const defeatMsg = isKorean 
            ? '"힘내... 다음엔 운이 좋을지도."' 
            : '"Hang in there... maybe next time."';
        this.addLog('system', `💀 ${LANG ? LANG.result.defeat : '패배...'} ${defeatMsg}`);
        
        this.elements.resultIcon.textContent = '😢';
        this.elements.resultText.textContent = LANG ? LANG.result.defeat : '패배';
        this.elements.resultText.className = 'result-text defeat';
        this.elements.resultDetail.textContent = isKorean 
            ? `${this.maxTurns}턴 내 도달 실패` 
            : `Failed to reach goal in ${this.maxTurns} turns`;
        
        // 통계 표시 (라벨과 값 분리)
        const stats = LANG ? LANG.result.stats : null;
        const statsHtml = `
            <div class="stat-row"><span class="stat-label">${stats ? stats.totalRolls : '총 주사위 굴림'}</span><span class="stat-value">${this.totalRolls}${isKorean ? '회' : ' times'}</span></div>
            <div class="stat-row"><span class="stat-label">${stats ? stats.events : '발생한 이벤트'}</span><span class="stat-value">${this.eventHistory.length}${isKorean ? '회' : ' times'}</span></div>
            <div class="stat-row"><span class="stat-label">${stats ? stats.finalPosition : '최종 위치'}</span><span class="stat-value">${this.position}${isKorean ? '칸' : ''}</span></div>
            <div class="stat-row"><span class="stat-label">${isKorean ? '남은 거리' : 'Distance Left'}</span><span class="stat-value">${this.goalPosition - this.position}${isKorean ? '칸' : ''}</span></div>
        `;
        const statsEl = document.getElementById('resultStats');
        if (statsEl) statsEl.innerHTML = statsHtml;
        
        this.elements.resultScreen.classList.remove('hidden');
        // 애니메이션 트리거 (약간의 지연 추가)
        setTimeout(() => {
            this.elements.resultScreen.classList.add('result-show');
        }, 10);
    }
    
    restart() {
        this.position = 0;
        this.turn = 1;
        this.maxTurns = 5;
        this.goalPosition = 12;
        this.isInBypass = false;
        this.bypassLength = 0;
        this.extendedGoal = false;
        this.gameOver = false;
        this.isRolling = false;
        this.eventHistory = [];
        this.lastEventId = null;
        this.totalRolls = 0;
        this.lastDiceValue = null;
        this.currentDice = { min:1, max:6, name:'기본 주사위', type:'normal', values:null };
        this.forceDice = null;
        
        // 카드 시스템 초기화
        this.hand = [];
        this.pendingEvent = null;
        this.cardUsedThisTurn = false;
        
        this.elements.resultScreen.classList.add('hidden');
        this.elements.eventArea.classList.add('hidden');
        this.elements.logArea.innerHTML = '';
        this.elements.rollButton.disabled = false;
        
        this.updateBoard();
        this.updateStatus();
        this.updateDiceInfo();
        this.updateHandUI();
        
        // 시작 카드 지급
        this.drawCard();
        
        this.addLog('system', '"다시 시작? 좋아. 이번엔 조심해." 😈');
        this.addLog('system', '🎴 전략 카드 1장을 받았습니다!');
    }
    
    // ==================== UI ====================
    
    updateBoard() {
        this.elements.board.innerHTML = '';
        
        const isKorean = (typeof currentLang === 'undefined' || currentLang === 'ko');
        
        // ========== 현재 위치 표시 ==========
        const positionDisplay = document.createElement('div');
        positionDisplay.className = 'board-position-display';
        
        const currentPosition = this.isInBypass ? this.position : this.position;
        const goalPosition = this.goalPosition;
        const isGoal = currentPosition >= goalPosition && !this.isInBypass;
        
        positionDisplay.innerHTML = `
            <span class="position-label">${isKorean ? '현재 위치' : 'Position'}</span>
            <span class="position-number ${isGoal ? 'goal' : ''}">${currentPosition}</span>
            <span class="position-suffix">${isKorean ? '칸' : ''}</span>
            ${this.isInBypass ? `<div class="position-info">↪️ ${isKorean ? '우회 루트' : 'Bypass'}</div>` : ''}
        `;
        this.elements.board.appendChild(positionDisplay);
        
        // ========== 폰 영역 (중앙 고정) ==========
        const playerArea = document.createElement('div');
        playerArea.className = 'board-player-area';
        playerArea.innerHTML = '<div class="player-character">👤</div>';
        this.elements.board.appendChild(playerArea);
        
        // ========== 슬라이드 트랙 ==========
        const trackWrapper = document.createElement('div');
        trackWrapper.className = 'board-track-wrapper';
        
        const trackContainer = document.createElement('div');
        trackContainer.className = 'board-track-container';
        
        const track = document.createElement('div');
        track.className = 'board-track';
        
        // 표시할 칸 계산 (현재 위치 기준 좌우 2칸씩 = 최대 5칸)
        const visibleRange = 2; // 좌우로 볼 칸 수
        let cells = [];
        
        if (this.isInBypass) {
            // 우회 루트: 13칸부터 현재 위치까지
            const bypassEnd = 12 + this.bypassLength;
            for (let i = 13; i <= bypassEnd; i++) {
                cells.push({ num: i, type: 'bypass' });
            }
        } else {
            // 메인 루트: 0~12칸
            for (let i = 0; i <= 12; i++) {
                let type = '';
                if (i === 0) type = 'start';
                else if (i === this.goalPosition) type = 'goal';
                else if (i <= 6) type = 'safe';
                else type = 'danger';
                cells.push({ num: i, type: type });
            }
        }
        
        // 현재 위치의 인덱스 찾기
        const currentIndex = cells.findIndex(c => c.num === this.position);
        
        // 표시할 칸 범위 계산
        const startIndex = Math.max(0, currentIndex - visibleRange);
        const endIndex = Math.min(cells.length - 1, currentIndex + visibleRange);
        
        // 칸 생성
        for (let i = startIndex; i <= endIndex; i++) {
            const cellData = cells[i];
            const cell = document.createElement('div');
            cell.className = 'track-cell';
            cell.textContent = cellData.num;
            
            // 타입 클래스 추가
            if (cellData.type) {
                cell.classList.add(cellData.type);
            }
            
            // 현재 위치 강조
            if (cellData.num === this.position) {
                cell.classList.add('current');
            }
            
            // 블러 처리 (중심에서 멀수록)
            const distance = Math.abs(i - currentIndex);
            if (distance >= visibleRange) {
                cell.classList.add('blurred');
            }
            
            track.appendChild(cell);
        }
        
        trackContainer.appendChild(track);
        trackWrapper.appendChild(trackContainer);
        this.elements.board.appendChild(trackWrapper);
        
        // ========== 양 끝 화살표 힌트 ==========
        const hints = document.createElement('div');
        hints.className = 'board-hints';
        
        const leftHint = document.createElement('div');
        leftHint.className = `hint-left ${this.position > 0 ? 'visible' : ''}`;
        leftHint.textContent = '◀';
        
        const rightHint = document.createElement('div');
        const maxPos = this.isInBypass ? (12 + this.bypassLength) : this.goalPosition;
        rightHint.className = `hint-right ${this.position < maxPos ? 'visible' : ''}`;
        rightHint.textContent = '▶';
        
        hints.appendChild(leftHint);
        hints.appendChild(rightHint);
        this.elements.board.appendChild(hints);
        
        // ========== 우회 루트 안내 ==========
        if (this.isInBypass) {
            const bypassInfo = document.createElement('div');
            bypassInfo.className = 'bypass-info';
            bypassInfo.innerHTML = `
                <span class="bypass-info-arrow">🔄</span>
                <span>${isKorean ? `우회 루트 ${this.bypassLength}칸 (12칸 순환)` : `Bypass ${this.bypassLength} spaces (loops to 12)`}</span>
            `;
            this.elements.board.appendChild(bypassInfo);
        }
        
        // 진행률 업데이트
        this.updateProgress();
    }
    
    // 진행률 업데이트
    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const distanceLeft = document.getElementById('distanceLeft');
        const eventCount = document.getElementById('eventCount');
        
        if (!progressFill) return;
        
        const position = this.position;
        const goal = this.goalPosition;
        const progress = Math.min(100, Math.round((position / goal) * 100));
        
        progressFill.style.width = progress + '%';
        if (progressText) progressText.textContent = progress + '%';
        
        if (distanceLeft) {
            const distance = Math.max(0, goal - position);
            const isKorean = (typeof currentLang === 'undefined' || currentLang === 'ko');
            distanceLeft.textContent = distance + (isKorean ? '칸' : '');
        }
        
        if (eventCount) {
            const isKorean = (typeof currentLang === 'undefined' || currentLang === 'ko');
            eventCount.textContent = (this.eventHistory ? this.eventHistory.length : 0) + (isKorean ? '회' : '');
        }
    }
    
    updateStatus() {
        // 턴 카운터 업데이트 (maxTurns 반영)
        this.elements.currentTurn.textContent = this.turn;
        const turnCounter = document.querySelector('.turn-counter');
        if (turnCounter) {
            turnCounter.innerHTML = `턴: <span id="currentTurn">${this.turn}</span>/${this.maxTurns}`;
        }
        this.elements.currentPosition.textContent = this.position;
    }
    
    updateDiceInfo() {
        this.elements.diceType.textContent = this.currentDice.name + ` (${this.currentDice.min}~${this.currentDice.max})`;
        
        // 기존 타입 클래스 모두 제거
        const diceClasses = ['normal', 'golden', 'gambler', 'broken', 'limited', 'cursed', 
                            'frozen', 'shocked', 'heavy', 'light', 'refined', 'up', 
                            'small', 'big', 'fusion', 'minus', 'thorn', 'poison', 'wall'];
        diceClasses.forEach(cls => this.elements.diceDisplay.classList.remove(cls));
        
        // 현재 타입 클래스 추가
        if (this.currentDice.type) {
            this.elements.diceDisplay.classList.add(this.currentDice.type);
        }
    }
    
    // 숫자 변경 애니메이션
    animateValue(element, newValue, type = 'default') {
        if (!element) return;
        
        element.textContent = newValue;
        element.classList.add('value-changed', `change-${type}`);
        
        // 1초 후 클래스 제거
        setTimeout(() => {
            element.classList.remove('value-changed', `change-${type}`);
        }, 1000);
    }
    
    // 턴 변경 애니메이션
    animateTurnChange(oldTurns, newTurns) {
        const turnCounter = document.querySelector('.turn-counter');
        if (turnCounter) {
            turnCounter.classList.add('turn-changed');
            turnCounter.innerHTML = `턴: <span id="currentTurn">${this.turn}</span>/<span class="max-turns">${this.maxTurns}</span>`;
            
            // 애니메이션 효과
            const maxTurnsSpan = turnCounter.querySelector('.max-turns');
            if (maxTurnsSpan) {
                maxTurnsSpan.classList.add('value-increase');
            }
            
            setTimeout(() => {
                turnCounter.classList.remove('turn-changed');
                if (maxTurnsSpan) maxTurnsSpan.classList.remove('value-increase');
            }, 1000);
        }
    }
    
    // 주사위 변경 애니메이션
    animateDiceChange() {
        this.elements.diceDisplay.classList.add('dice-changed');
        this.elements.diceInfo.classList.add('dice-info-changed');
        
        setTimeout(() => {
            this.elements.diceDisplay.classList.remove('dice-changed');
            this.elements.diceInfo.classList.remove('dice-info-changed');
        }, 1000);
    }
    
    addLog(type, msg) {
        const log = document.createElement('div');
        log.className = `log-item ${type}`;
        const avatar = type === 'system' ? '👨‍💻' : (type === 'player' ? '👤' : '⚡');
        log.innerHTML = `<span class="developer-avatar">${avatar}</span><span class="log-text">${msg}</span>`;
        this.elements.logArea.appendChild(log);
        this.elements.logArea.scrollTop = this.elements.logArea.scrollHeight;
    }
    
    r(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
}

document.addEventListener('DOMContentLoaded', () => { window.game = new Game(); });