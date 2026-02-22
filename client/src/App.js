import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from './pages/RootLayout';
import Home from './pages/Home';
import NewsDetail from './pages/NewsDetail';
import Login from './pages/Login';
import ErrorPage from './pages/ErrorPage';
import Registration from './pages/Registration';
import Results from './pages/Results';
import ResultsDetail from './pages/ResultsDetail';
import Elections from './pages/Elections';
import ElectionDetails from './pages/ElectionDetails';
import Congrates from './pages/Congrates';
import Logout from './pages/Logout';
import Candidates from './pages/Candidates';
import About from './pages/About';
import ForgotPassword from './pages/ForgotPassword';
import { RequireAuth } from './Components/RouteGuard';

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: "register", element: <Registration /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "results", element: <Results /> },
      { path: "results/:id", element: <ResultsDetail /> },
      { path: "news/:id", element: <NewsDetail /> },
      {
        path: "elections",
        element: (
          <RequireAuth>
            <Elections />
          </RequireAuth>
        ),
      },
      {
        path: "elections/:id",
        element: (
          <RequireAuth>
            <ElectionDetails />
          </RequireAuth>
        ),
      },
      {
        path: "elections/:id/candidates",
        element: (
          <RequireAuth>
            <Candidates />
          </RequireAuth>
        ),
      },
      {
        path: "congrates",
        element: (
          <RequireAuth>
            <Congrates />
          </RequireAuth>
        ),
      },
      {
        path: "logout",
        element: (
          <RequireAuth>
            <Logout />
          </RequireAuth>
        ),
      },
      { path: "about", element: <About /> },
      { path: "login", element: <Login /> }
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
