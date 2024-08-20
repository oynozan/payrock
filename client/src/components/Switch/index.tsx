import "./switch.scss";

export default function Switch({ status, set }: { status: boolean; set: any }) {
    return (
        <div className={"switch " + (status ? "on" : "off")} onClick={() => set(!status)}>
            <div className="switch-circle"></div>
        </div>
    );
}
