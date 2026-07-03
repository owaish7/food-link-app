import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

    const login = async (userData) => {
        try {
            const response = await axios.post(`${API_URL}/login`, userData);
            const { user } = response.data;
            setUser(user);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('accessToken', response.data.accessToken);
            return user; // Return user on successful login
        } catch (error) {
            console.error('Login error:', error.response?.data?.message || error.message);
            throw error; // Re-throw the error
        }
    };

    const register = async (userData) => {
        try {
            await axios.post(`${API_URL}/register`, userData);
            await login({ email: userData.email, password: userData.password });
        } catch (error) {
            console.error('Registration error:', error.response?.data?.message || error.message);
            throw error; // Re-throw so the page can show the reason
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
