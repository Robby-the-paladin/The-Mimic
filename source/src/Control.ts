import * as geom from "./Geom";
import * as aux from "./AuxLib";
import { Commands } from "./Entities/EntityAttributes/Commands";

export class Control {
    private static keyMapping: Map<string, string[]>;
    private static _keys: Map<string, boolean> = new Map();
    private static clicked = false;
    private static mouseLeftPressed = false;
    private static mouseRightPressed = false;
    private static currentMousePos = new geom.Vector();
    private static mouseWheelDelta = 0;
    private static commandsCounter: Map<string, number>;
    public static commands: Commands;
    public static commandKeys: Map<string, string>;

    private static async readTextFile(path) {
        const response = await fetch(path);
        const text = await response.text();
        return text;
    }

    public static async loadConfig(path: string) {
        if (true || localStorage.getItem("commands") == undefined) {
            let result = await this.readTextFile(aux.environment + path)
                .then(result => {
                    Control.keyMapping = JSON.parse(result, aux.reviver);
                    localStorage.setItem("commands", result);
                })
                .then(result => {
                    let vals = Array.from(Control.keyMapping.values());
                    let mapKeys = Array.from(Control.keyMapping.keys());
                    for (let i = 0; i < vals.length; i++) {
                        for (let j = 0; j < vals[i].length; j++) {
                            Control.commands.active[vals[i][j]] = false;
                            Control.commandsCounter[vals[i][j]] = 0;
                            Control.commandKeys[vals[i][j]] = mapKeys[i];
                        }
                    }
                });
        } else {
            Control.keyMapping = JSON.parse(localStorage.getItem("commands"), aux.reviver);
            let vals = Array.from(Control.keyMapping.values());
            let mapKeys = Array.from(Control.keyMapping.keys());
            for (let i = 0; i < vals.length; i++) {
                for (let j = 0; j < vals[i].length; j++) {
                    Control.commands.active[vals[i][j]] = false;
                    Control.commandsCounter[vals[i][j]] = 0;
                    Control.commandKeys[vals[i][j]] = mapKeys[i];
                }
            }
        }
    }

    public static init(): void {
        let canvas = document.getElementById("gameCanvas");
        if (!aux.editorMode) {
            window.addEventListener("keydown", Control.onKeyDown);
            window.addEventListener("keyup", Control.onKeyUp);
        }
        canvas.addEventListener("click", Control.onClick);
        window.addEventListener("wheel", Control.onWheel);
        window.addEventListener("mousemove", Control.onMouseMove);
        window.addEventListener("mousedown", Control.onMouseDown);
        window.addEventListener("mouseup", Control.onMouseUp);
        // Блокировка контекстного меню по ПКМ
        window.addEventListener("contextmenu", e => e.preventDefault());
        Control.keyMapping = new Map<string, string[]>();
        Control.commandsCounter = new Map<string, number>();
        Control.commands = new Commands();
        Control.commandKeys = new Map<string, string>();
        Control.loadConfig("keys.json");

    }

    public static isMouseClicked(): boolean {
        return Control.clicked;
    }

    public static lastMouseCoordinates(): geom.Vector {
        Control.clicked = false;
        return Control.commands.pointer.clone();
    }

    public static wheelDelta(): number {
        let delta = this.mouseWheelDelta;
        this.mouseWheelDelta = 0;
        return delta;
    }

    public static clearWheelDelta() {
        this.mouseWheelDelta = 0;
    }

    public static mousePos(): geom.Vector {
        let canvas = document.getElementById("gameCanvas");
        return this.currentMousePos.sub(new geom.Vector(canvas.offsetLeft, canvas.offsetTop));
    }

    public static isMouseLeftPressed() {
        return Control.mouseLeftPressed;
    }

    public static isMouseRightPressed() {
        return Control.mouseRightPressed;
    }

    private static onKeyDown(event: KeyboardEvent): boolean {
        console.log(event.key);
        if (Control._keys[event.key] == undefined) {
            Control._keys[event.key] = false;
        }
        
        if (Control.keyMapping != undefined && Control._keys[event.key] == false) {
            if (Control.keyMapping.get(event.key) == undefined) {
                Control.keyMapping.set(event.key, []);
            }
            for (let i = 0; i < Control.keyMapping.get(event.key).length; i++) {
                let currentCommand = Control.keyMapping.get(event.key)[i];
                Control.commandsCounter[currentCommand] += 1;
                Control.commands.active[currentCommand] = (Control.commandsCounter[currentCommand] != 0);
            }
        }
        Control._keys[event.key] = true;
        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    private static onKeyUp(event: KeyboardEvent): boolean {
        if (Control.keyMapping != undefined && Control._keys[event.key] == true) {
            if (Control.keyMapping.get(event.key) == undefined) {
                Control.keyMapping.set(event.key, []);
            }
            for (let i = 0; i < Control.keyMapping.get(event.key).length; i++) {
                let currentCommand = Control.keyMapping.get(event.key)[i];
                Control.commandsCounter[currentCommand] -= 1;
                Control.commands.active[currentCommand] = (Control.commandsCounter[currentCommand] != 0);
            }
        }
        Control._keys[event.key] = false;
        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    private static onClick(event: MouseEvent): boolean {
        Control.clicked = true;
        Control.commands.pointer = new geom.Vector(event.x, event.y);
        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    private static onMouseDown(event: MouseEvent): boolean {
        if (event.button == 0)
            Control.mouseLeftPressed = true;
        if (event.button == 2)
            Control.mouseRightPressed = true;
        return false;
    }

    private static onMouseUp(event: MouseEvent): boolean {
        if (event.button == 0)
            Control.mouseLeftPressed = false;
        if (event.button == 2)
            Control.mouseRightPressed = false;
        return false;
    }

    private static onWheel(event: WheelEvent): boolean {
        Control.mouseWheelDelta = event.deltaY;
        return false;
    }

    private static onMouseMove(event: MouseEvent): boolean {
        Control.currentMousePos = new geom.Vector(event.x, event.y);
        return false;
    }
}