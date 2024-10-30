export class MsgBox
{
    public static onResponse?: Function;

    public static init()
    {
        document.getElementById("msg-box-ok")!.addEventListener("click", () => {
            let input = document.getElementById("msg-box-input") as HTMLInputElement;
            let text = input.value;

            this.simulateResponse(0, text);
        });
    }

    public static simulateResponse(buttonId: number, inputtext: string)
    {
        if(this.onResponse) this.onResponse(buttonId, inputtext);
        this.onResponse = undefined;

        this.setVisible(false);
    }   

    public static setVisible(visible: boolean)
    {
        document.getElementById("msg-box")!.style.display = visible ? "" : "none";
    }

    public static setInputVisible(visible: boolean)
    {
        document.getElementById("msg-box-input-area")!.style.display = visible ? "" : "none";
    }

    public static setButtonVisible(buttonId: string, visible: boolean)
    {
        const parent = document.getElementById(buttonId)!.parentElement!;

        parent.style.display = visible ? "" : "none";
    }

    public static createMsgBox(title: string, content: string, okButton: string, cancelButton: string)
    {
        this.setVisible(true);
        this.setInputVisible(false);

        document.getElementById("msg-box-title")!.innerHTML = `<b>${title}</b>`;
        document.getElementById("msg-box-content")!.innerHTML = `${content}`;
        document.getElementById("msg-box-ok")!.textContent = okButton;
        document.getElementById("msg-box-cancel")!.textContent = cancelButton;

        this.setButtonVisible("msg-box-ok", okButton.length > 0);
        this.setButtonVisible("msg-box-cancel", cancelButton.length > 0);
    }

    public static createMsgBoxWithInput(title: string, content: string, okButton: string, cancelButton: string)
    {
        this.createMsgBox(title, content, okButton, cancelButton);
        this.setInputVisible(true);
    }
}