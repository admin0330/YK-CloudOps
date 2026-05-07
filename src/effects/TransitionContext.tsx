import { createContext, useContext, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

// Re-export so consumers can use this
export { runParticleTransition } from '../effects/ParticleTransitionManager';
export type { TransitionType } from '../effects/ParticleTransitionManager';

const NavContext = createContext<(path: string) => void>(() => {});

export function useTransitionNavigate() {
  return useContext(NavContext);
}

interface Props { children: ReactNode; }

export function TransitionProvider({ children }: Props) {
  const navigate = useNavigate();
  return (
    <NavContext.Provider value={navigate}>
      {children}
    </NavContext.Provider>
  );
}
