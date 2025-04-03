import React from 'react';
import {
    createBrowserRouter,
} from "react-router-dom";
import MainStructure from './MainStructure';
import Overview from './Pages/Overview';
import Upload from './Pages/Upload';
import QuestionBank from './Pages/QuestionBank';
import MyQuestion from './Pages/MyQuestion';
import Users from './Pages/Users';
import Curriculum from './Pages/Curriculum';
import PrivateRoute from './Authentications/PrivateRoute';
import Login from './Login/Login';
import { RouteErrorBoundary } from './components/ErrorBoundary';
import ErrorPage from './Pages/ErrorPage';
import ExamplesPage from './Pages/ExamplesPage';
import LatexTableConverter from './components/LatexTableConverter';
import { AuthProvider } from './hooks/useAuth.jsx';

// Wrap components that need AuthProvider
const withAuth = (Component) => {
    return (
        <AuthProvider>
            {Component}
        </AuthProvider>
    );
};

const router = createBrowserRouter([
    {
        path: "/",
        element: withAuth(<PrivateRoute><MainStructure></MainStructure></PrivateRoute>),
        errorElement: <RouteErrorBoundary />,
        children: [
            {
                path:"/" ,
                element: <Overview></Overview>,
                errorElement: <RouteErrorBoundary />,
            },
            {
                path:"/overview" ,
                element: <Overview></Overview>,
                errorElement: <RouteErrorBoundary />,
            },
            {
                path:"/upload" ,
                element: <Upload></Upload>,
                errorElement: <RouteErrorBoundary />,
            },
            {
                path:"/questionbank" ,
                element: <QuestionBank></QuestionBank>,
                errorElement: <RouteErrorBoundary />,
            },
            {
                path:"/myquestion" ,
                element: <MyQuestion></MyQuestion>,
                errorElement: <RouteErrorBoundary />,
            },
            {
                path:"/curriculum" ,
                element: <PrivateRoute requiredRole="admin"><Curriculum></Curriculum></PrivateRoute>,
                errorElement: <RouteErrorBoundary />,
            },
            {
                path:"/admin" ,
                element: <PrivateRoute requiredRole="admin"><Users></Users></PrivateRoute>,
                errorElement: <RouteErrorBoundary />,
            },
            {
                path:"/examples" ,
                element: <ExamplesPage></ExamplesPage>,
                errorElement: <RouteErrorBoundary />,
            },
            {
                path:"/latex-converter" ,
                element: <LatexTableConverter></LatexTableConverter>,
                errorElement: <RouteErrorBoundary />,
            },
        ]
    },
    {
        path:"login",
        element: withAuth(<Login></Login>),
        errorElement: <RouteErrorBoundary />,
    },
    {
        path: "/error",
        element: <ErrorPage />,
        errorElement: <RouteErrorBoundary />,
    },
    {
        path:"*",
        element: <RouteErrorBoundary />,
    }
]);

export default router;