import { Route, Routes } from 'react-router-dom';

import Pay from './Pay';
import Home from './Home';
import NotFound from './NotFound';
import Dashboard from './Dashboard';
import Connect from '../components/Connect';

import { useUserStore, useWalletStore } from '../lib/states';

import '../styles/app.scss';

export default function App() {
    const user = useUserStore(s => s.user);
    const loading = useWalletStore(s => s.loading);

    return (
        <>
            <Connect />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/p/*" element={<Pay />} />

                { (user || loading) && (
                    <Route path="/dashboard/*" element={<Dashboard />} />
                )}

                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    )
}