import { Link } from 'react-router-dom';

import ConnectButton from '../Connect/ConnectButton';

import './header.scss';

export default function HeaderHome() {
    return (
        <header className="header-home">
            <h1>
                <img src="/logo.svg" alt="Logo" />
            </h1>
            <div className="links">
                <Link to="/">Home</Link>
                <a href="https://docs.payrock.me" target="_blank">Docs</a>
            </div>
            <ConnectButton />
        </header>
    )
}