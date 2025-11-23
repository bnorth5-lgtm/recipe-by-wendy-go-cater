"use client";

import React from 'react';

const TestComponent = () => {
  console.log("TestComponent rendering");
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-100 text-blue-800">
      <h1 className="text-4xl font-bold">If you see this, basic rendering works!</h1>
    </div>
  );
};

export default TestComponent;