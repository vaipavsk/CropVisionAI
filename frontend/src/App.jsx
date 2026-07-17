import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './theme';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;