import { Camera, Color, Draw } from "./Draw";
import * as geom from "./Geom";
import { Control } from "./Control";


export enum SettingsMode {
    None = 0,
    Edge,
    Vertex
}

// vertex Object
export class Vertex {
    public startingAngle = 0;
    public endAngle = 2 * Math.PI;
    public x: number;
    public y: number;
    public r: number;

    public text: string;
    public fill: Color;
    public stroke: Color;

    constructor(x: number, y: number, r: number, text: string, fill: Color, stroke: Color) {
        this.x = x;
        this.y = y;
        this.r = r;

        this.text = text;
        this.fill = fill;
        this.stroke = stroke;
    }

    public draw(drawObj: Draw) {
        drawObj.fillCircle(new geom.Vector(this.x, this.y), this.r, this.fill);
        drawObj.strokeCircle(new geom.Vector(this.x, this.y), this.r, this.stroke, 3);
        drawObj.drawText(this.text, drawObj.transform(new geom.Vector(this.x, this.y)),
            "20px serif", new Color(255, 255, 255), false, undefined,
            undefined, undefined, drawObj.cam.scale * this.r * 2);
    }
}
export class Edge {
    public begin: Vertex;
    public end: Vertex;

    constructor(begin: Vertex, end: Vertex) {
        this.begin = begin;
        this.end = end;
    }

    public draw(drawObj: Draw) {
        if (this.begin.text == this.end.text) {
            return;
        }
        let fromx = this.begin.x;
        let fromy = this.begin.y;
        let dx = this.end.x - this.begin.x;
        let dy = this.end.y - this.begin.y;
        let angle = Math.atan2(dy, dx);
        let tox = this.end.x - this.end.r * Math.cos(angle);
        let toy = this.end.y - this.end.r * Math.sin(angle);
        drawObj.arrow(new geom.Vector(fromx, fromy), new geom.Vector(tox, toy));
    }
}

export class globalEditor {
    private mousePrev: geom.Vector;
    private static addVert = false;
    private static addEdge = false;
    private settingsMode = SettingsMode.None;
    private buttonFunc = null;
    private curVertex = null;
    private getName(name : string, k = 0){
        let n = name;
        if (k != 0) {
            n += "(" + k.toString() + ")";
        } 
        for (let i = 0; i < this.circles.length; i++) {
            if (n == this.circles[i].text) {
                return this.getName(name, k + 1);
            }
        }
        return n;
    }

    public circles: Vertex[];
    public edges: Edge[];
    //track mouse position on mousemove
    public mousePosition;
    //track state of mousedown and up
    public isMouseDown;

    //reference to the canvas element
    public c = document.getElementById("gameCanvas") as HTMLCanvasElement;
    //reference to 2d context
    public ctx = this.c.getContext("2d");

    public focused = {
        key: 0,
        state: false
    }

    public drawObj: Draw;

    public changeSettingsMode(mode : SettingsMode) {
        switch(this.settingsMode) {
            case SettingsMode.Edge: {
                document.getElementById("edgeSettings")["style"].visibility = "hidden";
                break;
            }
            case SettingsMode.Vertex: {
                document.getElementById("vertexSettings")["style"].visibility = "hidden";
                break;
            }
            default:
                break;
        }
        switch(mode) {
            case SettingsMode.Edge: {
                document.getElementById("edgeSettings")["style"].visibility = "visible";
                break;
            }
            case SettingsMode.Vertex: {
                document.getElementById("vertexSettings")["style"].visibility = "visible";
                break;
            }
            default:
                break;
        }
        this.settingsMode = mode;
    }

    private addVertex() {       
        let pos = this.drawObj.transformBack(this.drawObj.cam.center);
        let vertex = new Vertex(pos.x, pos.y, 50, this.getName("New vertex"),
        new Color(100, 100, 0), new Color(0, 0, 0));
        this.circles.push(vertex);
        this.arrmove(this.circles, this.circles.length - 1, 0);
        this.changeSettingsMode(SettingsMode.Vertex);
        let e = document.getElementById("vertexColor") as HTMLInputElement;
        this.curVertex = vertex;
        e.value = vertex.fill.toHEX();
        e = document.getElementById("vertexText") as HTMLInputElement;
        e.value = vertex.text;
    }

    private addEdge() {
        if (this.circles.length == 0) {
            return;
        }
        let vertex = this.circles[0];
        let edge = new Edge(vertex, vertex);
        this.edges.push(edge);
        this.changeSettingsMode(SettingsMode.Edge);
        let x = document.getElementById("edgeBeginInput") as HTMLInputElement;
        x.value = edge.begin.text;
        let y = document.getElementById("edgeEndInput") as HTMLInputElement; 
        y.value = edge.end.text;

        let changeBeginInput = () => {
            let newName = x.value;
            
            for(let i = 0; i < this.circles.length; i++) {
                if (this.circles[i].text == newName) {
                    edge.begin = this.circles[i];
                    return;
                }
            }
            x.value = edge.begin.text;
        }

        x.addEventListener("focusout", changeBeginInput);
        x.addEventListener("keydown", (evt) => {
            if (evt.keyCode == 13) {
                x.blur();
            }
        });

        let changeEndInput = () => {
            let newName = y.value;
            for(let i = 0; i < this.circles.length; i++) {
                if (this.circles[i].text == newName) {
                    edge.end = this.circles[i];
                    return;
                }
            }
            y.value = edge.end.text;
        }

        y.addEventListener("focusout", changeEndInput);
        y.addEventListener("keydown", (evt) => {
            if (evt.keyCode == 13) {
                y.blur();
            }
        });

        document.getElementById("edgeBeginClick").onclick = () => {
            this.buttonFunc = (text) => {
                x.value = text;
                changeBeginInput();
                return;
            }
        };

        document.getElementById("edgeEndClick").onclick = () => {
            this.buttonFunc = (text) => {
                y.value = text;
                changeEndInput();
                return;
            }
        };
    }

    public initHTML() {
        document.getElementById("addVertex").addEventListener("click", () => { globalEditor.addVert = true });
        document.getElementById("addEdge").addEventListener("click", () => { globalEditor.addEdge = true });

        document.getElementById("tools")["style"].left = window.innerHeight + 20 + "px";
        document.getElementById("edgeSettings")["style"].left = window.innerHeight + 20 + "px";
        document.getElementById("vertexSettings")["style"].left = window.innerHeight + 20 + "px";

        document.getElementById("edgeSettings")["style"].top = 110 + "px";
        document.getElementById("vertexSettings")["style"].top = 110 + "px";

        let vcolor = document.getElementById("vertexColor") as HTMLInputElement;
        vcolor.addEventListener("input", () => {
            this.curVertex.fill.fromHEX(vcolor.value);
        }, false);

        let vtext = document.getElementById("vertexText") as HTMLInputElement;

        let changeName = () => {
            if (vtext.value == this.curVertex.text) {
                return;
            }
            console.log(vtext.value, this.getName(vtext.value));
            
            vtext.value = this.getName(vtext.value);
            this.curVertex.text = vtext.value;
        };

        vtext.addEventListener("focusout", changeName);
        vtext.addEventListener("keydown", (evt) => {
            if (evt.keyCode == 13) {
                vtext.blur();
            }
        });

        let e = document.getElementById("chooseElem") as HTMLInputElement;
        e.addEventListener("click", () => {
            this.buttonFunc = (elem) => {
                if (!(elem instanceof Edge)) {
                    let vertex : Vertex = null;
                    for (let i = 0; i < this.circles.length; i++) {
                        if (elem == this.circles[i].text) {
                            vertex = this.circles[i];
                            break;
                        }
                    }
                    if (vertex == null) {
                        return;
                    }
                    let e = document.getElementById("vertexColor") as HTMLInputElement;
                    this.curVertex = vertex;
                    e.value = vertex.fill.toHEX();
                    e = document.getElementById("vertexText") as HTMLInputElement;
                    e.value = vertex.text;
                    this.changeSettingsMode(SettingsMode.Vertex);
                }
            }
        })
    }

    constructor(drawObj: Draw) {
        this.drawObj = drawObj;

        this.drawObj.cam.scale = 0.5;
        this.mousePrev = Control.mousePos();

        //make some circles
        let c1 = new Vertex(50, 50, 50, "c1 veeery looooong text", new Color(255, 0, 0), new Color(0, 0, 0));
        //let c2 = new Vertex(200, 50, 50, "c2 text", new Color(0, 255, 0), new Color(0, 0, 0));
        let c3 = new Vertex(350, 50, 50, "c3", new Color(0, 0, 255), new Color(0, 0, 0));
        //let e1 = new Edge(c1, c2);
        let e2 = new Edge(c1, c3);

        //initialise our circles
        this.circles = [c1, c3];
        this.edges = [e2];

        this.initHTML();
    }

    private isInCanvas(mouseCoords: geom.Vector): boolean {
        if (document.getElementById("gameCanvas").clientLeft <= mouseCoords.x
            && mouseCoords.x <= document.getElementById("gameCanvas")["height"]
            && document.getElementById("gameCanvas").clientTop <= mouseCoords.y
            && mouseCoords.y <= document.getElementById("gameCanvas")["width"]) {
            return true;
        }
        return false;
    }

    // Двигает камеру в соответствии с движениями мышки
    private moveCamera() {
        // Сохраняем текущие координаты мыши
        let mouseCoords = Control.mousePos().clone();
        // Двигаем камеру
        if (this.isInCanvas(mouseCoords)) {
            this.drawObj.cam.scale *= Math.pow(1.001, -Control.wheelDelta());
        } else {
            Control.clearWheelDelta();
        }
        if (Control.isMouseRightPressed() && this.isInCanvas(mouseCoords)) {
            let delta = mouseCoords.sub(this.mousePrev);
            this.drawObj.cam.pos = this.drawObj.cam.pos.sub(delta.mul(1 / this.drawObj.cam.scale));
        }
        // Сохраняем предыдущие координаты мыши
        this.mousePrev = mouseCoords.clone();
    }

    //detects whether the mouse cursor is between x and y relative to the radius specified
    public intersects(circle: Vertex) {
        // subtract the x, y coordinates from the mouse position to get coordinates 
        // for the hotspot location and check against the area of the radius
        let coords = this.drawObj.transform(new geom.Vector(circle.x, circle.y))
        let r = circle.r * this.drawObj.cam.scale;
        let areaX = this.mousePosition.x - coords.x;
        let areaY = this.mousePosition.y - coords.y;
        //return true if x^2 + y^2 <= radius squared.
        return areaX * areaX + areaY * areaY <= r * r;
    }

    private move() {

        this.isMouseDown = Control.isMouseLeftPressed();
        if (!this.isMouseDown) {
            this.focused.state = false;
            return;
        }
        this.getMousePosition();

        //if any circle is focused
        if (this.focused.state) {
            let pos = this.drawObj.transformBack(new geom.Vector(this.mousePosition.x, this.mousePosition.y));
            let min = new geom.Vector(document.getElementById("gameCanvas").clientLeft, document.getElementById("gameCanvas").clientTop);
            let max = new geom.Vector(document.getElementById("gameCanvas")["width"], document.getElementById("gameCanvas")["height"]);
            min = this.drawObj.transformBack(min);
            max = this.drawObj.transformBack(max);

            this.circles[this.focused.key].x = Math.max(min.x, Math.min(pos.x, max.x));
            this.circles[this.focused.key].y = Math.max(min.y, Math.min(pos.y, max.y));
            return;
        }
        //no circle currently focused check if circle is hovered
        for (let i = 0; i < this.circles.length; i++) {
            if (this.intersects(this.circles[i])) {
                this.arrmove(this.circles, i, 0);
                this.focused.state = true;
                if (this.buttonFunc != null) {
                    this.buttonFunc(this.circles[0].text);
                    this.buttonFunc = null;
                }
                this.curVertex = this.circles[0];
                break;
            }
        }
    }

    public step() {
        //clear canvas
        this.ctx.clearRect(0, 0, this.c.width, this.c.height);

        this.drawEdges();
        this.drawVertex();
        this.moveCamera();
        this.move();

        if (globalEditor.addVert) {
            globalEditor.addVert = false;
            this.addVertex();
        }

        if (globalEditor.addEdge) {
            globalEditor.addEdge = false;
            this.addEdge();
        }
    }

    public arrmove(arr, old_index, new_index) {
        if (new_index >= arr.length) {
            let k = new_index - arr.length;
            while ((k--) + 1) {
                arr.push(undefined);
            }
        }
        arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    }

    //draw circles
    public drawVertex() {
        for (let i = this.circles.length - 1; i >= 0; i--) {
            this.circles[i].draw(this.drawObj);
        }
    }

    public drawEdges() {
        for (let i = this.edges.length - 1; i >= 0; i--) {
            this.edges[i].draw(this.drawObj);
        }
    }

    public releaseFocus() {
        this.focused.state = false;
    }

    public getMousePosition() {
        let rect = this.c.getBoundingClientRect();
        this.mousePosition = {
            x: Control.mousePos().x,
            y: Control.mousePos().y
        }
    }
}