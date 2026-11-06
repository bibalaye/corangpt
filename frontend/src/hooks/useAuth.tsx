import { useState, createContext, useContext } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface UserProfile {
    subscription_plan: {
        name: string;
        price: string;
        daily_request_limit: number;
        features: any;
    };
    subscription_end_date: string | null;
    requests_today: number;
    last_request_date: string;
}

export interface User {
    id: number;
    username: string;
    email: string;
    profile: UserProfile;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Read the saved session synchronously: the first render already knows who is signed in
    const [token, setToken] = useState<string | null>(() => {
        try { return localStorage.getItem('token') } catch { return null }
    });
    const [user, setUser] = useState<User | null>(() => {
        try {
            const stored = localStorage.getItem('user');
            return stored && localStorage.getItem('token') ? JSON.parse(stored) : null
        } catch { return null }
    });

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
