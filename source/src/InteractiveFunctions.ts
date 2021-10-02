import exp = require("constants");
import { Game } from "./Game";

export class Action {
    public description: string;
    public argsNum: number;
    public func: (args: any[]) => any;
    public args: any[];
    constructor(description: string, argsNum: number, func: (args: any[]) => any, args: any[]) {
        this.description = description;
        this.argsNum = argsNum;
        this.func = func;
        this.args = args;
    }
    public clone() {
        return new Action(this.description, this.argsNum, this.func, this.args);
    }
    public run() {
        this.func(this.args);
    }
}

export let functions: Map<string, Action> = new Map();

export function actionsInit() {
    // Функция перехода на другой уровень
    let action = new Action("Функция перехода на другой уровень. 1 аргумент - название нового уровня.", 1,
    function func(args: any[]) {
        let name = args[0] as string;
        Game.currentGame.currentLevelName = name;
        Game.currentGame.startGame();
    }, []);
    functions["transition"] = action;
}

