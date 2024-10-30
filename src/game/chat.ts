import { Gameface } from "./gameface/gameface";
import { IPacketData_ChatMessage, PACKET_TYPE } from "./network/packet";
import { GameScene } from "./scenes/gameScene";
import { MainScene } from "./scenes/mainScene";

export class Chat
{
    public static Instance: Chat;

    public messagesDiv?: HTMLElement;
    public input?: HTMLInputElement;
    public sendButton?: HTMLButtonElement;
    public inputVisible: boolean = true;

    constructor()
    {
        Chat.Instance = this;
    }

    public create()
    {
        const scene = GameScene.Instance;

        const container = scene.add.dom(0, 0, 'div', 'width: 600px; height: 200px;');
        container.setOrigin(0);
        container.setClassName("chat-container");

        container.setHTML(`
            <div id="chat-messages" class="chat-messages" style="height: 80%">
            </div>
            <div id="chat-input-row" class="row m-0" style="height: 20%">
                <div class="col p-0">
                    <input id="chat-input" class="chat-input"></input>
                </div>
                <div class="col-1 p-0">
                    <button id="chat-button-send" class="chat-button">Send</button>
                </div>
            </div>
        `);

        this.messagesDiv = document.getElementById("chat-messages")!;
        this.input = document.getElementById("chat-input") as HTMLInputElement;
        this.sendButton = document.getElementById("chat-button-send") as HTMLButtonElement;

        (window as any).messagesDiv = this.messagesDiv;
        (window as any).chatInput = this.input;

        // let i = 0;
        // setInterval(() => {
        //     i++;
        //     this.addMessage("helo my <b>" + i + "</b>");
        // }, 500);
        
        const chat = this;

        const input = this.input;

        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                chat.send();
            }

            console.log(event.key);
            if (event.key === 'Escape') {
                input.value = "";
                chat.send();
            }
        });

        this.messagesDiv.addEventListener('click', () => {
            this.toggleChatInput(true);
        })

        this.sendButton.addEventListener('click', () => {
            chat.send();
        });

        this.toggleChatInput(false);
    }

    public addColorMessage(tag: string, color: string, text: string)
    {
        this.addMessage(`<span style="color:${color};">[${tag}] ${text}</span>`);
    }

    public addMessage(html: string)
    {
        const messageDiv = document.createElement("div");
        messageDiv.className = "chat-message";
        messageDiv.innerHTML = html;

        const diff = (this.messagesDiv!.scrollHeight - this.messagesDiv!.clientHeight) - this.messagesDiv!.scrollTop;

        console.log(this.messagesDiv?.scrollTop, this.messagesDiv?.scrollHeight)
        console.log(this.messagesDiv?.clientHeight)
        console.log(diff)

        this.messagesDiv?.appendChild(messageDiv);

        if(diff == 0 || diff < 10)
        {
            this.scrolToEnd();
        }
        
        //this.scrolToEnd();
    }

    public send()
    {
        const input = this.input!;

        const text = input.value;
        console.log('Text entered:', text);

        // Clear the input field
        input!.value = '';

        if(text.length > 0)
        {
            //this.addMessage(`Player: <span style="color: white";>${text}</span>`);

            Gameface.Instance.network.send<IPacketData_ChatMessage>(PACKET_TYPE.PACKET_CHAT_MESSAGE, {
                message: text
            });
        }

        this.toggleChatInput(false);
    }

    public toggleChatInput(enabled: boolean)
    {
        if(enabled)
        {
            if(this.inputVisible) return;

            Gameface.Instance.setPointerLocked(false);

            this.input!.focus();
            setTimeout(() => {
                this.input!.focus();
            }, 0);
            
        } else {
            Gameface.Instance.setPointerLocked(true);
        }

        this.inputVisible = enabled;

        document.getElementById("chat-input-row")!.style.display = enabled ? "" : "none";

        document.getElementById("chat-messages")!.style.height = enabled ? "80%" : "100%";

        document.getElementById("chat-messages")!.style.overflowY = enabled ? "scroll" : "hidden";

        this.scrolToEnd();
    }

    public scrolToEnd()
    {
        this.messagesDiv?.scrollTo(0, this.messagesDiv.scrollHeight);
    }
}