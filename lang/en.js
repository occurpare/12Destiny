// English Language Pack
const LANG_EN = {
    // Meta
    lang: 'en',
    langName: 'English',
    
    // Game Title
    title: '12 DICE',
    subtitle: '100 Events Edition',
    version: 'v15f - 156 Events',
    
    // Game Rules
    rulesTitle: '📋 Game Rules',
    rules: {
        goal: 'Goal:',
        goalText: 'Reach',
        goalHighlight: 'space 12',
        goalReach: 'within 5 turns!',
        dice: 'Dice:',
        diceText: 'Start with 1-6, can be changed by events',
        events: 'Events:',
        eventsText: 'Various events occur each turn',
        bypass: 'Bypass Route:',
        bypassText: 'If you pass space 12, a 3-6 space bypass is created'
    },
    
    // Event Categories
    categoriesTitle: '🎯 Event Categories',
    categories: {
        positive: { icon: '✅', name: 'Positive', count: '20' },
        neutral: { icon: '⚖️', name: 'Neutral', count: '20' },
        negative: { icon: '❌', name: 'Negative', count: '38' },
        despair: { icon: '😱', name: 'Despair', count: '12' },
        special: { icon: '⭐', name: 'Special', count: '12' },
        blocker: { icon: '🛑', name: 'Blocker', count: '44' }
    },
    
    // Tips
    tipsTitle: '💡 Tips',
    tips: [
        'Early game has more positive events',
        'Late game has stronger blocker events',
        'Changing dice changes your strategy!',
        'Click event popups to skip quickly'
    ],
    
    // Buttons
    buttons: {
        startGame: '🎮 Start Game',
        dontShowAgain: "Don't show again",
        rollDice: '🎲 Roll Dice',
        restart: '🔄 Restart',
        challengeAgain: 'Try Again'
    },
    
    // Status
    status: {
        turn: 'Turn:',
        position: 'Position:',
        of: '/',
        space: 'space',
        spaces: 'spaces',
        distanceLeft: '🎯 Distance Left',
        eventChance: '📊 Event Chance',
        eventCount: '📜 Events',
        events: 'times'
    },
    
    // Dice Types
    diceTypes: {
        normal: 'Basic Dice (1~6)',
        golden: 'Golden Dice (4~6)',
        gambler: 'Gambler Dice (1~6)',
        broken: 'Broken Dice',
        limited: 'Limited Dice',
        cursed: 'Cursed Dice',
        frozen: 'Frozen Dice',
        shocked: 'Shocked Dice',
        heavy: 'Heavy Dice (1~2)',
        light: 'Light Dice (5~6)',
        refined: 'Refined Dice (3~5)',
        up: 'Upgraded Dice',
        small: 'Small Dice',
        big: 'Big Dice',
        fusion: 'Fusion Dice',
        minus: 'Minus Dice',
        thorn: 'Thorn Dice',
        poison: 'Poison Dice',
        wall: 'Wall Dice'
    },
    
    // Results
    result: {
        victory: 'Victory!',
        defeat: 'Defeat...',
        congratulations: 'Congratulations!',
        tryAgain: 'Better luck next time...',
        stats: {
            turns: 'Turns Used',
            events: 'Events Triggered',
            totalRolls: 'Total Rolls',
            finalPosition: 'Final Position'
        }
    },
    
    // Event History
    history: {
        title: '📜 Event History',
        empty: 'No events yet',
        turn: 'Turn'
    },
    
    // Navigation
    nav: {
        game: '🎮 Game',
        guide: '📖 Guide',
        faq: '❓ FAQ',
        language: '🌐 Language'
    },
    
    // Footer
    footer: {
        copyright: '© 2026 12 DICE. All rights reserved.',
        developer: 'Developer',
        legal: {
            privacy: 'Privacy Policy',
            terms: 'Terms of Service',
            cookies: 'Cookie Policy'
        }
    },
    
    // System Messages
    messages: {
        welcome: '"Hey! Reach space 12 within 5 turns to win... By the way, I\'m not nice." 😈',
        tapToSkip: 'Click to skip',
        tapFast: 'Tap fast!!'
    },
    
    // Guide Page
    guide: {
        title: '📖 12 DICE Guide',
        sections: {
            basics: {
                title: 'Basic Rules',
                content: 'Reach exactly space 12 within 5 turns to win. Roll dice each turn and various events will occur.'
            },
            dice: {
                title: 'Dice System',
                content: 'The basic dice rolls 1-6, but events can change it to various types. This can be advantageous or disadvantageous depending on the situation.'
            },
            bypass: {
                title: 'Bypass Route',
                content: 'If you pass space 12, a 3-6 space bypass route is created. Landing on 12 via backward events in bypass also counts as victory!'
            },
            tips: {
                title: 'Strategy Tips',
                content: 'Early game has frequent positive events, while late game has stronger blocker events. Make good use of dice-changing events!'
            }
        }
    },
    
    // FAQ Page
    faq: {
        title: '❓ Frequently Asked Questions',
        items: [
            {
                q: 'What is the win rate?',
                a: 'Average around 20%. Both luck and strategy are important.'
            },
            {
                q: 'Why does the dice change?',
                a: 'Certain events change the dice range or properties. This is a strategic element of the game.'
            },
            {
                q: 'What is the bypass route?',
                a: 'An additional path created when you exceed space 12. Randomly generated with 3-6 spaces.'
            },
            {
                q: 'Too many events are happening!',
                a: 'Event probability varies by position. Blocker events become more frequent in late game.'
            },
            {
                q: 'Can I play on mobile?',
                a: 'Yes! Responsive design allows play on all devices.'
            }
        ]
    },
    
    // Legal Pages
    privacy: {
        title: '🔐 Privacy Policy',
        lastUpdated: 'Last Updated: February 17, 2026'
    },
    terms: {
        title: '📜 Terms of Service',
        lastUpdated: 'Last Updated: February 17, 2026'
    },
    cookies: {
        title: '🍪 Cookie Policy',
        lastUpdated: 'Last Updated: February 17, 2026'
    }
};
