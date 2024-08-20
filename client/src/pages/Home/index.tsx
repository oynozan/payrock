import HeaderHome from "../../components/Header/HeaderHome";
import ChangingText from "../../components/ChangingText";

import "./home.scss";

export default function Home() {
    return (
        <>
            <HeaderHome />
            <div id="home">
                <div className='shadow'></div>
                <nav>
                    <h1>
                        The <ChangingText /> Payment Gateway
                    </h1>
                </nav>
            </div>
        </>
    );
}
