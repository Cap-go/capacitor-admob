import { AdmobPlus } from '@capgo/admob-plus';

window.testEcho = () => {
    const inputValue = document.getElementById("echoInput").value;
    AdmobPlus.echo({ value: inputValue })
}
