import { AdMob } from '@capgo/capacitor-admob';

window.testEcho = () => {
    const inputValue = document.getElementById("echoInput").value;
    AdMob.echo({ value: inputValue })
}
