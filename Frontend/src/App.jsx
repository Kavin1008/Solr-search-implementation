import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Auth from "./pages/Auth";
import CustomerTable from "./pages/CategoryPage";
import Cookies from 'js-cookie';
import { useEffect, useState } from "react";
import ProductTable from "./pages/ProductPage";
import { jwtDecode } from 'jwt-decode';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkToken = () => {
      const token = Cookies.get('jwt_token');
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          const currentTime = Date.now() / 1000; 
          
          if (decodedToken.exp < currentTime) {
            Cookies.remove('jwt_token');
            setIsAuthenticated(false);
          } else {
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error("Invalid token:", error);
          Cookies.remove('jwt_token');
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkToken(); 
    const intervalId = setInterval(checkToken, 10000); 

    return () => clearInterval(intervalId); 
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/ctable" replace /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="/auth"
          element={!isAuthenticated ? <Auth /> : <Navigate to="/ctable" replace />}
        />
        <Route
          path="/ctable"
          element={isAuthenticated ? <CustomerTable /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="/ptable"
          element={isAuthenticated ? <ProductTable /> : <Navigate to="/auth" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
