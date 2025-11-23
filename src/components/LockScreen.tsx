import React from 'react';

// Simple placeholder LockScreen component that just renders its children.
// In the future you can add authentication or lock logic here.
const LockScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <>{children}</>;
};

export default LockScreen;
