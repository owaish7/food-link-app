import React, { createContext, useState, useContext, useEffect } from 'react';

export const DarkModeContext = createContext();

export const useDarkMode = () => {
    return useContext(DarkModeContext);
};

// Apply/remove the `dark` class on <html> so Tailwind's class-based dark mode
// (`dark:` variants) works across the whole app.
const applyDarkClass = (enabled) => {
    const root = document.documentElement;
    if (enabled) root.classList.add('dark');
    else root.classList.remove('dark');
};

export const DarkModeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(
        () => localStorage.getItem('darkMode') === 'true'
    );

    // Keep <html> in sync on mount and whenever the mode changes.
    useEffect(() => {
        applyDarkClass(isDarkMode);
    }, [isDarkMode]);

    const toggleDarkMode = () => {
        setIsDarkMode((prev) => {
            const next = !prev;
            localStorage.setItem('darkMode', next.toString());
            return next;
        });
    };

    return (
        <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
            {children}
        </DarkModeContext.Provider>
    );
};
