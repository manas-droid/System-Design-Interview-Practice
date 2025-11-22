import { useState } from 'react';
import { AuthCredentials, loadStoredCredentials, persistCredentials } from './auth';
import { ChatDashboard } from './components/ChatDashboard';
import { Login } from './components/Login';

function App() {
  const [auth, setAuth] = useState<AuthCredentials | null>(() => loadStoredCredentials());
  const handleLoginSuccess = (credentials: AuthCredentials) => {
    persistCredentials(credentials);
    setAuth(credentials);
  };

  if (!auth) {
    return <Login onSuccess={handleLoginSuccess} />;
  }

  return <ChatDashboard auth={auth} />;
}

export default App;
