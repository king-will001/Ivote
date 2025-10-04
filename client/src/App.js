
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from './pages/RootLayout';
import Login from './pages/Login';
import ErrorPage from './pages/ErrorPage'; // Assuming you have an ErrorPage component
import Registration from './pages/Registration'; // Assuming you have a Registration component
import Results from './pages/Results'; // Assuming you have a Results component
import Elections from './pages/Election'; // Assuming you have an Elections component
import ElectionDetails from './pages/ElectionDetials'; // ← correct only if file name has that typo
 // Assuming you have an ElectionDetails component
import Congrates from './pages/Congrates'; // Assuming you have a Congrates component
import Logout from './pages/Logout'; // Assuming you have a Logout component
import Candidates from './pages/Candidates'; // Assuming you have a Candidates component
import About from './pages/About'; // Assuming you have an About component


const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Login />
      },
      {
        path: "register",
        element: <Registration /> // Assuming you have a Register component
      },
      {
        path: "results",
        element: <Results /> // Assuming you have a Results component
      },
      {
        path: "elections",
        element: <Elections /> // Assuming you have an Elections component
      },
      {
        path: "elections/:id",
        element: <ElectionDetails /> // Assuming you have an ElectionDetails component
      },
      {
        path: "elections/:id/candidates",
        element: <Candidates /> // Assuming you have a Candidates component
      },
      {
        path: "congrates",
        element: <Congrates /> // Assuming you have a Congrates component
      },
      {
        path: "logout",
        element: <Logout /> // Assuming you have a Logout component
      },
      {
        path: "about",
        element: <About /> // Assuming you have an About component
      },
      {
        path: "login",
        element: <Login />
      },
    ],
  },
]);



function App() {
  return (<RouterProvider router={router} />);
}

export default App;
