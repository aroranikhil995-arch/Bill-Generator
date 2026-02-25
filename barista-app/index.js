/**
 * @format
 */

// Must be imported first — Supabase requires a WHATWG-compliant URL implementation that supports setters
import 'react-native-url-polyfill/auto';

import { AppRegistry } from 'react-native';

import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
