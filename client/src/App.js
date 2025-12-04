import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from './pages/RootLayout';
import Home from './pages/Home';
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

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: "register", element: <Registration /> },
      { path: "results", element: <Results /> },
      { path: "elections", element: <Elections /> },
      { path: "elections/:id", element: <ElectionDetails /> },
      { path: "elections/:id/candidates", element: <Candidates /> },
      { path: "congrates", element: <Congrates /> },
      { path: "logout", element: <Logout /> },
      { path: "about", element: <About /> },
      { path: "login", element: <Login /> }
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
