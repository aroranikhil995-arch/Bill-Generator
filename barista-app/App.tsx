/**
 * Barista Cafe — Staff App
 * React Native CLI Entry Point
 */
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import CustomAlert from './src/components/CustomAlert';

export default function App() {
  return (
    <>
      <AppNavigator />
      <CustomAlert />
    </>
  );
}
