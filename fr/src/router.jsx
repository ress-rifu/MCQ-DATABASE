import React from 'react';
import {
    createBrowserRouter,
} from "react-router-dom";
import MainStructure from './MainStructure';
import Overview from './Pages/Overview';
import Upload from './Pages/Upload';
import UploadTest from './Pages/UploadTest';
import QuestionBank from './Pages/QuestionBank';
import MyQuestion from './Pages/MyQuestion';
import Users from './Pages/Users';
import Curriculum from './Pages/Curriculum';
import Courses from './Pages/Courses';
import CreateExam from './Pages/CreateExam';
import ExamsList from './Pages/ExamsList';
import ExamPortal from './Pages/ExamPortal';
import ExamLeaderboard from './Pages/ExamLeaderboard';
import StudentLeaderboard from './Pages/StudentLeaderboard';
import TailwindTest from './components/TailwindTest';
import TailwindShowcase from './components/TailwindShowcase';
import UntitledUIShowcase from './Pages/UntitledUIShowcase';
import PrivateRoute from './Authentications/PrivateRoute';
import Login from './Login/Login';
import { RouteErrorBoundary } from './components/ErrorBoundary';
import ErrorPage from './Pages/ErrorPage';
import ExamplesPage from './Pages/ExamplesPage';
import LatexTableConverter from './components/LatexTableConverter';
import { AuthProvider } from './hooks/useAuth.jsx';
import { AdminRoute, AdminTeacherRoute, NonStudentRoute } from './components/ProtectedRoutes';

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
        path: "/tailwind",
        element: <TailwindTest />,
        errorElement: <RouteErrorBoundary />,
    },
    {
        path: "/tailwind-showcase",
        element: <TailwindShowcase />,
        errorElement: <RouteErrorBoundary />,
    },
    {
        path: "/ui",
        element: <UntitledUIShowcase />,
        errorElement: <RouteErrorBoundary />,
    },
    {
        path: "/",
        element: withAuth(<PrivateRoute><MainStructure /></PrivateRoute>),
        children: [
            {
                path:"/" ,
                element: <NonStudentRoute><Overview /></NonStudentRoute>,
                errorElement: <RouteErrorBoundary />,
            },
            {
                path:"/overview" ,
                element: <NonStudentRoute><Overview /></NonStudentRoute>,
                errorElement: <RouteErrorBoundary />,
            },
            {
                path:"/leaderboard" ,
                element: <PrivateRoute><StudentLeaderboard /></PrivateRoute>,
                errorElement: <RouteErrorBoundary />,
            },
            {
                path:"/upload" ,
                element: <UploadTest></UploadTest>,
                errorElement: <RouteErrorBoundary />,
            },
            {
                path:"/tailwind-test" ,
                element: <TailwindTest />,
                errorElement: <RouteErrorBoundary />,
            },
            {
                path:"/upload-test" ,
                element: <UploadTest></UploadTest>,
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
                element: <AdminRoute><Curriculum /></AdminRoute>,
                errorElement: <RouteErrorBoundary />,
            },
            {
                path:"/courses" ,
                element: <PrivateRoute requiredRole="admin"><Courses></Courses></PrivateRoute>,
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
                element: <AdminTeacherRoute><LatexTableConverter></LatexTableConverter></AdminTeacherRoute>,
                errorElement: <RouteErrorBoundary />,
            },
            {
                path:"/exams" ,
                element: <ExamsList></ExamsList>,
                errorElement: <RouteErrorBoundary />,
            },
            {
                path:"/exams/create" ,
                element: <AdminTeacherRoute><CreateExam /></AdminTeacherRoute>,
                errorElement: <RouteErrorBoundary />,
            },
            {
                path:"/exams/edit/:id" ,
                element: <AdminTeacherRoute><CreateExam /></AdminTeacherRoute>,
                errorElement: <RouteErrorBoundary />,
            },
            {
                path:"/exams/:id" ,
                element: <PrivateRoute><ExamPortal></ExamPortal></PrivateRoute>,
                errorElement: <RouteErrorBoundary />,
            },
            {
                path:"/exams/:id/leaderboard" ,
                element: <PrivateRoute><ExamLeaderboard></ExamLeaderboard></PrivateRoute>,
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