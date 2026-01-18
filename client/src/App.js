import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from './pages/RootLayout';
import Home from './pages/Home';
import NewsDetails from './pages/NewsDetails';
import Login from './pages/Login';
import ErrorPage from './pages/ErrorPage';
import Registration from './pages/Registration';
import Results from './pages/Results';
import Elections from './pages/Elections';
import ElectionDetails from './pages/ElectionDetails';
import Congrates from './pages/Congrates';
import Logout from './pages/Logout';
import Candidates from './pages/Candidates';
import About from './pages/About';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './Components/ProtectedRoute';

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: "register", element: <Registration /> },
      { path: "login", element: <Login /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <Home /> },
          { path: "results", element: <Results /> },
          { path: "news/:id", element: <NewsDetails /> },
          { path: "elections", element: <Elections /> },
          { path: "elections/:id", element: <ElectionDetails /> },
          { path: "elections/:id/candidates", element: <Candidates /> },
          { path: "congrates", element: <Congrates /> },
          { path: "logout", element: <Logout /> },
          { path: "about", element: <About /> }
        ]
      },
      {
        path: "*",
        element: (
          <ErrorPage
            code="404"
            message="Page not found"
            description="The page you are looking for does not exist."
          />
        )
      }
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
