import { useUserStore } from '../../../lib/states';
import './api.scss';

export default function API() {
    const user = useUserStore(s => s.user);

    if (!user?.accessToken) return <></>

    return (
        <div id="api">
            <h5>Access Token</h5>
            <p>In your API requests, you must set a <i>access-token</i> header. Here is your access token:</p>
            <input value={user.accessToken} />

            <p className='docs'>Read <a href="docs.payrock.me" target="_blank">API Docs</a> to learn how to integrate Payrock into your project.</p>
        </div>
    )
}