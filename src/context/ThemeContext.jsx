import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../db/database';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(false);
  const [color, setColor] = useState('mint');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await db.settings.get('theme');
      const c = await db.settings.get('color');
      if (t?.value === 'dark') setDark(true);
      if (c?.value) setColor(c.value);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.setAttribute('data-color', color);
    db.settings.put({ key: 'theme', value: dark ? 'dark' : 'light' });
    db.settings.put({ key: 'color', value: color });
  }, [dark, color, ready]);

  return (
    <ThemeContext.Provider value={{ dark, setDark, color, setColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);