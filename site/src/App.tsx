import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header, Footer } from './components';
import Home from './pages/Home';
import Documentation from './pages/Documentation';

function App() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-[#f8fbfc]">
        <Header onOpenConfig={() => setIsConfigOpen(true)} />
        
        <Routes>
          <Route 
            path="/" 
            element={
              <Home 
                onOpenConfig={() => setIsConfigOpen(true)}
                isConfigOpen={isConfigOpen}
                onCloseConfig={() => setIsConfigOpen(false)}
              />
            } 
          />
          <Route path="/documentation" element={<Documentation />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
