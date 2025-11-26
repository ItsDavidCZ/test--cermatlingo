import { UserState, Subject } from '../types';

const DB_KEY = 'CERMAT_USERS_DB';

interface UserDBEntry {
  passwordHash: string; // Simple hash simulation
  data: UserState;
  lessons: any[]; // Store lesson state per user
}

type UserDatabase = Record<string, UserDBEntry>;

export const INITIAL_USER_STATE_TEMPLATE: Omit<UserState, 'username' | 'createdAt'> = {
    hearts: 5,
    xp: 0,
    streak: 0,
    currentSubject: Subject.CZECH,
    completedLessons: [],
    avatar: 'default',
    badges: [],
    theme: 'light',
    weeklyGoal: 500,
    weeklyProgress: 0,
    stats: {
        totalQuestions: 0,
        totalCorrect: 0,
        czechXp: 0,
        mathXp: 0,
        lessonsCompleted: 0,
        topicCounts: {}
    },
    inventory: {
        doubleXpPotions: 1 // Start with 1 free potion
    },
    activePowerUp: null
};

// Helper to simulate hashing (NOT SECURE for real apps, but fine for frontend-only demo)
const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return hash.toString();
};

const getDatabase = (): UserDatabase => {
    try {
        const stored = localStorage.getItem(DB_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        return {};
    }
};

const saveDatabase = (db: UserDatabase) => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
};

export const AuthService = {
    register: (username: string, password: string, initialLessons: any[]): { success: boolean, message?: string, user?: UserState, lessons?: any[] } => {
        const db = getDatabase();
        
        if (db[username]) {
            return { success: false, message: 'Uživatel s tímto jménem již existuje.' };
        }

        const newUser: UserState = {
            ...INITIAL_USER_STATE_TEMPLATE,
            username: username,
            createdAt: Date.now()
        };

        db[username] = {
            passwordHash: simpleHash(password),
            data: newUser,
            lessons: initialLessons
        };

        saveDatabase(db);
        return { success: true, user: newUser, lessons: initialLessons };
    },

    login: (username: string, password: string): { success: boolean, message?: string, user?: UserState, lessons?: any[] } => {
        const db = getDatabase();
        const entry = db[username];

        if (!entry) {
            return { success: false, message: 'Uživatel neexistuje.' };
        }

        if (entry.passwordHash !== simpleHash(password)) {
            return { success: false, message: 'Špatné heslo.' };
        }

        // Merge logic in case new fields were added to types but exist in old DB
        const mergedUser = { ...INITIAL_USER_STATE_TEMPLATE, ...entry.data };

        return { success: true, user: mergedUser, lessons: entry.lessons };
    },

    saveProgress: (username: string, userData: UserState, lessonData: any[]) => {
        const db = getDatabase();
        if (db[username]) {
            db[username].data = userData;
            db[username].lessons = lessonData;
            saveDatabase(db);
        }
    }
};