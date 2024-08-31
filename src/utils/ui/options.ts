import { Button } from "./button";

interface IOption {
    text: string
    value: number
}

export class Options
{
    public container: Phaser.GameObjects.Container;
    public text: Phaser.GameObjects.Text;

    private _optionDisplaySize: number = 150;

    public onOptionChange?: Function;

    private _options: IOption[] = [];
    private _currentOptionIndex: number = 0;

    constructor(scene: Phaser.Scene, displaySize: number)
    {
        this._optionDisplaySize = displaySize;

        this.container = scene.add.container(0, 0);
        this.container.setPosition(200, 200);

        const background = scene.add.rectangle(0, 0, displaySize, 30, 0xffffff);
        this.container.add(background);

        const leftButton = new Button(scene, "<", -this._optionDisplaySize/2, 0, 30, 30, "button");
        leftButton.onClick = () => {
            this.addOptionBy(-1);
        };
        this.container.add(leftButton.container);

        const rightButton = new Button(scene, ">", this._optionDisplaySize/2, 0, 30, 30, "button");
        rightButton.onClick = () => {
            this.addOptionBy(1);
        };
        this.container.add(rightButton.container);

        this.text = scene.add.text(0, 0, "OPTIONS_DISPLAY", { font: '16px Arial', color: '#000000' });
        this.text.setOrigin(0.5);
        this.container.add(this.text);
    }

    public addOption(text: string, value: number)
    {
        const option: IOption = {
            text: text,
            value: value
        }

        this._options.push(option);
    }

    public getCurrentOption()
    {
        return this._options[this._currentOptionIndex];
    }

    public getCurrentOptionValue()
    {
        return this.getCurrentOption().value;
    }

    public addOptionBy(by: number)
    {
        const prevValue = this._currentOptionIndex;

        this._currentOptionIndex += by;

        const max = this._options.length-1;

        if(this._currentOptionIndex > max) this._currentOptionIndex = max;
        if(this._currentOptionIndex < 0) this._currentOptionIndex = 0;

        const newValue = this._currentOptionIndex;
        if(prevValue != newValue)
        {
            this.onOptionChange?.();
        }
    }

    public update()
    {
        const option = this.getCurrentOption();

        this.text.setText(option.text);
    }
}