import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Common/Sidebar';
import { ComponentErrorBoundary } from './components/ErrorBoundary';
import GlobalErrorHandler from './components/GlobalErrorHandler';

const MainStructure = () => {
    return (
        <GlobalErrorHandler>
            <ComponentErrorBoundary>
                <Sidebar>
                    <Outlet />
                </Sidebar>
            </ComponentErrorBoundary>
        </GlobalErrorHandler>
    );
};

export default MainStructure;