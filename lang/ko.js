// Korean Language Pack
const LANG_KO = {
    // 메타
    lang: 'ko',
    langName: '한국어',
    
    // 게임 타이틀
    title: '12 DICE',
    subtitle: '100 Events Edition',
    version: 'v15f - 156 Events',
    
    // 게임 규칙
    rulesTitle: '📋 게임 규칙',
    rules: {
        goal: '목표:',
        goalText: '5턴 안에',
        goalHighlight: '12칸',
        goalReach: '에 도달하세요!',
        dice: '주사위:',
        diceText: '기본 1~6, 이벤트로 변경될 수 있습니다',
        events: '이벤트:',
        eventsText: '매 턴 다양한 이벤트가 발생합니다',
        bypass: '우회 루트:',
        bypassText: '12칸 초과 시 3~6칸 우회로가 생성됩니다'
    },
    
    // 이벤트 카테고리
    categoriesTitle: '🎯 이벤트 카테고리',
    categories: {
        positive: { icon: '✅', name: '긍정적', count: '20개' },
        neutral: { icon: '⚖️', name: '중립적', count: '20개' },
        negative: { icon: '❌', name: '부정적', count: '38개' },
        despair: { icon: '😱', name: '절망', count: '12개' },
        special: { icon: '⭐', name: '특별', count: '12개' },
        blocker: { icon: '🛑', name: '방해', count: '44개' }
    },
    
    // 팁
    tipsTitle: '💡 팁',
    tips: [
        '초반에는 초기 장애물 이벤트가 많이 나옵니다',
        '종반에는 클리어 방해 이벤트가 강해집니다',
        '주사위가 바뀌면 전략이 달라집니다!',
        '이벤트 팝업을 클릭하면 빠르게 넘길 수 있습니다'
    ],
    
    // 버튼
    buttons: {
        startGame: '🎮 게임 시작',
        dontShowAgain: '다시 보지 않기',
        rollDice: '🎲 주사위 굴리기',
        restart: '🔄 다시 시작',
        challengeAgain: '다시 도전'
    },
    
    // 상태
    status: {
        turn: '턴:',
        position: '위치:',
        of: '/',
        space: '칸',
        spaces: '칸',
        distanceLeft: '🎯 남은 거리',
        eventChance: '📊 발동 확률',
        eventCount: '📜 이벤트',
        events: '회'
    },
    
    // 주사위 타입
    diceTypes: {
        normal: '기본 주사위 (1~6)',
        golden: '황금 주사위 (4~6)',
        gambler: '도박꾼 주사위 (1~6)',
        broken: '부서진 주사위',
        limited: '제한된 주사위',
        cursed: '저주받은 주사위',
        frozen: '얼어붙은 주사위',
        shocked: '충격 주사위',
        heavy: '무거운 주사위 (1~2)',
        light: '경량 주사위 (5~6)',
        refined: '연마된 주사위 (3~5)',
        up: '업그레이드 주사위',
        small: '작은 주사위',
        big: '큰 주사위',
        fusion: '융합 주사위',
        minus: '마이너스 주사위',
        thorn: '가시 주사위',
        poison: '독 주사위',
        wall: '벽 주사위'
    },
    
    // 결과
    result: {
        victory: '승리!',
        defeat: '패배...',
        congratulations: '축하합니다!',
        tryAgain: '다음 기회에...',
        stats: {
            turns: '사용한 턴',
            events: '발생한 이벤트',
            totalRolls: '주사위 굴린 횟수',
            finalPosition: '최종 위치'
        }
    },
    
    // 이벤트 기록
    history: {
        title: '📜 이벤트 기록',
        empty: '아직 이벤트가 없습니다',
        turn: '턴'
    },
    
    // 네비게이션
    nav: {
        game: '🎮 게임',
        guide: '📖 가이드',
        faq: '❓ FAQ',
        language: '🌐 언어'
    },
    
    // 푸터
    footer: {
        copyright: '© 2026 12 DICE. All rights reserved.',
        developer: '개발자',
        legal: {
            privacy: '개인정보처리방침',
            terms: '이용약관',
            cookies: '쿠키 정책'
        }
    },
    
    // 시스템 메시지
    messages: {
        welcome: '"안녕! 5턴 안에 12칸 도달하면 승리야... 아, 참고로 난 친절하지 않아." 😈',
        tapToSkip: '클릭하여 넘기기',
        tapFast: '연타하세요!!'
    },
    
    // 가이드 페이지
    guide: {
        title: '📖 12 DICE 가이드',
        sections: {
            basics: {
                title: '기본 규칙',
                content: '5턴 안에 정확히 12칸에 도달하면 승리합니다. 매 턴 주사위를 굴리고, 다양한 이벤트가 발생합니다.'
            },
            dice: {
                title: '주사위 시스템',
                content: '기본 주사위는 1~6이지만, 이벤트를 통해 다양한 주사위로 변경될 수 있습니다. 상황에 따라 유리하거나 불리할 수 있습니다.'
            },
            bypass: {
                title: '우회 루트',
                content: '12칸을 초과하면 3~6칸의 우회 루트가 생성됩니다. 우회 루트에서 후퇴 이벤트로 12칸에 도달해도 승리!'
            },
            tips: {
                title: '전략 팁',
                content: '초반에는 긍정적 이벤트가 자주 발생하고, 종반에는 방해 이벤트가 강해집니다. 주사위 변경 이벤트를 잘 활용하세요!'
            }
        }
    },
    
    // FAQ 페이지
    faq: {
        title: '❓ 자주 묻는 질문',
        items: [
            {
                q: '승리 확률이 얼마인가요?',
                a: '평균적으로 20% 내외입니다. 운과 전략이 모두 중요합니다.'
            },
            {
                q: '주사위가 왜 바뀌나요?',
                a: '특정 이벤트가 발생하면 주사위의 범위나 속성이 변경됩니다. 이는 게임의 전략적 요소입니다.'
            },
            {
                q: '우회 루트는 무엇인가요?',
                a: '12칸을 초과하면 생성되는 추가 경로입니다. 3~6칸 랜덤 생성됩니다.'
            },
            {
                q: '이벤트가 너무 많이 발생해요!',
                a: '위치에 따라 이벤트 발생 확률이 달라집니다. 종반으로 갈수록 방해 이벤트가 많아집니다.'
            },
            {
                q: '모바일에서도 플레이 가능한가요?',
                a: '네! 반응형 디자인으로 모든 기기에서 플레이 가능합니다.'
            }
        ]
    },
    
    // 법적 페이지
    privacy: {
        title: '🔐 개인정보처리방침',
        lastUpdated: '최종 수정일: 2026년 2월 17일'
    },
    terms: {
        title: '📜 이용약관',
        lastUpdated: '최종 수정일: 2026년 2월 17일'
    },
    cookies: {
        title: '🍪 쿠키 정책',
        lastUpdated: '최종 수정일: 2026년 2월 17일'
    }
};
