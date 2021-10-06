import { Camera, Color, Draw } from "./Draw";
import * as geom from "./Geom";
import { Control } from "./Control";

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

    private addVertex() {
        console.log("vertex added");
        
        let pos = this.drawObj.transformBack(this.drawObj.cam.center);
        this.circles.push(new Vertex(pos.x, pos.y, 50, "New vertex",
            new Color(100, 100, 0), new Color(0, 0, 0)));
        this.arrmove(this.circles, this.circles.length - 1, 0);
    }

    constructor(drawObj: Draw) {
        this.drawObj = drawObj;

        this.drawObj.cam.scale = 0.5;
        this.mousePrev = Control.mousePos();

        //make some circles
        let c1 = new Vertex(50, 50, 50, "c1 veeery looooong text", new Color(255, 0, 0), new Color(0, 0, 0));
        let c2 = new Vertex(200, 50, 50, "c2 text", new Color(0, 255, 0), new Color(0, 0, 0));
        let c3 = new Vertex(350, 50, 50, "c3", new Color(0, 0, 255), new Color(0, 0, 0));
        let e1 = new Edge(c1, c2);
        let e2 = new Edge(c1, c3);

        //initialise our circles
        this.circles = [c1, c2, c3];
        this.edges = [e1, e2];

        document.getElementById("addVertex").addEventListener("click", () => { globalEditor.addVert = true });
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
            let left = (-this.drawObj.cam.center.x) / this.drawObj.cam.scale;
            let right = (this.drawObj.canvas.width - this.drawObj.cam.center.x) / this.drawObj.cam.scale;
            let up = (-this.drawObj.cam.center.y) / this.drawObj.cam.scale;
            let down = (this.drawObj.canvas.height - this.drawObj.cam.center.y) / this.drawObj.cam.scale;

            this.circles[this.focused.key].x = Math.max(left, Math.min(pos.x, right));
            this.circles[this.focused.key].y = Math.max(up, Math.min(pos.y, down));
            return;
        }
        //no circle currently focused check if circle is hovered
        for (let i = 0; i < this.circles.length; i++) {
            if (this.intersects(this.circles[i])) {
                this.arrmove(this.circles, i, 0);
                this.focused.state = true;
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