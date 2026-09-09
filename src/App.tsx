import { useState } from 'react';
import { Boxes, Cloud, CloudOff, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { HomeView } from './components/HomeView';
import { PanelView } from './components/PanelView';
import { LoginView } from './components/LoginView';
import { LandingPage } from './components/LandingPage';

type Route =
  | { name: 'home' }
  | { name: 'panel'; panelId: string };

type GuestView = 'landing' | 'login' | 'register';

function SyncBadge() {
  const { syncing, syncError } = useApp();
  if (syncError) {
    return (
      <span className="sync-badge sync-badge--error" title={syncError}>
        <CloudOff size={14} /> Error al sincronizar
      </span>
    );
  }
  if (syncing) {
    return (
      <span className="sync-badge">
        <Cloud size={14} /> Guardando en D1…
      </span>
    );
  }
  return (
    <span className="sync-badge sync-badge--ok">
      <Cloud size={14} /> Sincronizado
    </span>
  );
}

function AppShell({ onGoLanding }: { onGoLanding: () => void }) {
  const { user, logout } = useAuth();
  const [route, setRoute] = useState<Route>({ name: 'home' });

  return (
    <div className="app-shell">
      <div className="app-bg" aria-hidden />
      <header className="topbar">
        <button
          type="button"
          className="brand"
          onClick={onGoLanding}
          aria-label="Ir a la página de inicio"
          title="Ir a la landing"
        >
          <span className="brand__mark">
            <Boxes size={20} />
          </span>
          <span className="brand__text">
            <strong>CT Toolkit</strong>
            <small>Accesos rápidos para técnicos</small>
          </span>
        </button>

        <div className="topbar__right">
          <SyncBadge />
          <span className="user-chip" title={user?.email}>
            {user?.email}
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={async () => {
              await logout();
              onGoLanding();
            }}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="app-main">
        {route.name === 'home' ? (
          <HomeView onOpenPanel={(panelId) => setRoute({ name: 'panel', panelId })} />
        ) : (
          <PanelView panelId={route.panelId} onBack={() => setRoute({ name: 'home' })} />
        )}
      </main>

      <footer className="app-footer">
        <span>CT Toolkit · Creada por CarliniTools</span>
      </footer>
    </div>
  );
}

function AuthenticatedApp() {
  const { user, loading } = useAuth();
  const [guestView, setGuestView] = useState<GuestView>('landing');
  const [showLandingWhileLoggedIn, setShowLandingWhileLoggedIn] = useState(false);

  if (loading) {
    return (
      <div className="boot-screen">
        <p>Comprobando sesión…</p>
      </div>
    );
  }

  const enterApp = () => {
    setShowLandingWhileLoggedIn(false);
    setGuestView('landing');
  };

  const openLanding = () => {
    setShowLandingWhileLoggedIn(true);
    setGuestView('landing');
  };

  // Sesión activa: landing sin cerrar sesión, o la app
  if (user) {
    if (showLandingWhileLoggedIn) {
      return (
        <LandingPage
          onLogin={enterApp}
          onRegister={enterApp}
        />
      );
    }

    return (
      <AppProvider user={user}>
        <AppShell onGoLanding={openLanding} />
      </AppProvider>
    );
  }

  // Sin sesión
  if (guestView === 'landing') {
    return (
      <LandingPage
        onLogin={() => setGuestView('login')}
        onRegister={() => setGuestView('register')}
      />
    );
  }

  return (
    <LoginView
      initialMode={guestView === 'register' ? 'register' : 'login'}
      onBack={() => setGuestView('landing')}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
