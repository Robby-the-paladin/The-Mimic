import * as geom from "./Geom";
import { Level } from "./Level";
import { AnimationState, SpriteAnimation } from "./SpriteAnimation";

export class Camera {
    public center: geom.Vector;
    public pos: geom.Vector;
    public scale: number;
}

export class Color {
    public r: number;
    public g: number;
    public b: number;
    public a: number;

    constructor(r: number, g: number, b: number, a = 255) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    public toString(): string {
        return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
    }

    public setAlpha(a: number): Color {
        return new Color(this.r, this.g, this.b, a);
    }
}

export enum Layer { // Индентификатор текстуры (тайл или персонаж)
    TileLayer,
    EntityLayer,
    HudLayer
}

type hashimages = {
    [key: string]: HTMLImageElement; // Хеш таблица с изображениями
};

interface queue { // Для правильной отрисовки слоев
    image?: HTMLImageElement,
    pos?: geom.Vector,
    box?: geom.Vector,
    angle?: number,
    layer?: Layer,
    transparency?: number,
}

interface barQueue { // Для отрисовки Hp бара

    pos?: geom.Vector,
    box?: geom.Vector,
    percentage?: number,
    frontColor: Color,
    backColor?: Color,
    marks?: number[],
}

interface textQueue {
    text?: string,
    pos?: geom.Vector,
    font?: string,
    color?: Color,
    outline?: boolean,
    outlineColor?: Color,
    align?: CanvasTextAlign,
    baseline?: CanvasTextBaseline
}

export class Draw {
    public canvas: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D;
    private imagequeueEntity: queue[] = []; // Очередь для изображений
    private imagequeueHud: queue[] = []; // Очередь для изображений
    private hpqueue: barQueue[] = []; // Очередь для hp бара
    private textqueue: textQueue[] = [];
    public cam = new Camera();
    private spriteAnimations: SpriteAnimation[] = [];
    private static images: hashimages = { }; // Хеш таблица с изображениями

    constructor(canvas: HTMLCanvasElement, size: geom.Vector = null) {
        this.canvas = canvas;
        if (size) {
            canvas.width = size.x;
            canvas.height = size.y;
        }
        else {
            size = new geom.Vector();
            size.x = canvas.width;
            size.y = canvas.height;
        }
        this.ctx = canvas.getContext("2d");
        this.cam.scale = 1;
        this.cam.pos = new geom.Vector();
        this.cam.center = size.mul(1 / 2);
    }

    public static loadImage(src: string): HTMLImageElement {
        if (this.images[src]) {
            return this.images[src]; // Извлекаем из хеш таблицы
        }
        let image = new Image();
        image.src = src;
        this.images[src] = image;
        return image;
    }
    // Преобразование координат
    public transform(pos: geom.Vector): geom.Vector {
        let posNew = pos.clone();
        posNew = posNew.sub(this.cam.pos);
        posNew = posNew.mul(this.cam.scale);
        posNew = posNew.add(this.cam.center);
        return posNew;
    }
    // Обратное реобразование координат
    public transformBack(pos: geom.Vector): geom.Vector {
        let posNew = pos.clone();
        posNew = posNew.sub(this.cam.center);
        posNew = posNew.mul(1 / this.cam.scale);
        posNew = posNew.add(this.cam.pos);
        return posNew;
    }
    // Изменение 
    public resize(size: geom.Vector) {
        this.cam.center = size.mul(1 / 2);
        this.canvas.width = size.x;
        this.canvas.height = size.y;
    }
    // Натягивание на канвас
    public attachToCanvas() {
        this.cam.pos = this.cam.center;
        this.cam.scale = 1;
    }

    public drawText(text: string, pos: geom.Vector, font?: string, color?: Color, outline?: boolean, outlineColor?: Color,
        align?: CanvasTextAlign, baseline?: CanvasTextBaseline, maxWidth?: number) {
        if (font == undefined) {
            font = "48px serif";
        } 
        if (color == undefined) {
            color = new Color(255, 255, 255);
        }
        if (outline == undefined) {
            outline = false;
        }
        if (outlineColor == undefined) {
            outlineColor = new Color(0, 0, 0);
        }
        if (align == undefined) {
            align = "center";
        }
        if (baseline == undefined) {
            baseline = "middle";
        }
        this.ctx.fillStyle = color.toString();
        this.ctx.strokeStyle = outlineColor.toString();
        this.ctx.fillStyle = color.toString();
        this.ctx.font = font;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        if (maxWidth) {
            this.ctx.fillText(text, pos.x, pos.y, maxWidth);
            if (outline)
                this.ctx.strokeText(text, pos.x, pos.y, maxWidth);
        } else {
            this.ctx.fillText(text, pos.x, pos.y);
            if (outline)
                this.ctx.strokeText(text, pos.x, pos.y);
        }
    }
    // Функция для отрисовки изображения
    public drawimage(image: HTMLImageElement, pos: geom.Vector, box: geom.Vector, angle: number, transparency: number) {
        let posNew = this.transform(pos);
        let boxNew = box.mul(this.cam.scale * 1.01);
        posNew = posNew.sub(boxNew.mul(1 / 2));
        this.ctx.imageSmoothingEnabled = false;
        if (angle % (2 * Math.PI) == 0) {
            this.ctx.globalAlpha = transparency;
            this.ctx.drawImage(image, posNew.x, posNew.y, boxNew.x, boxNew.y); // Без поворота (Много ресурсов на поворот уходит(даже на 0))
        } else {
            let buffer = document.createElement('canvas'); // Поворот
            buffer.width = boxNew.x * 2;
            buffer.height = boxNew.y * 2;
            let bctx = buffer.getContext('2d');
            bctx.imageSmoothingEnabled = false;
            bctx.translate(boxNew.x, boxNew.y);
            bctx.rotate(angle);
            bctx.drawImage(image, -boxNew.x / 2, -boxNew.y / 2, boxNew.x, boxNew.y);
            this.ctx.globalAlpha = transparency;
            this.ctx.drawImage(buffer, posNew.x - boxNew.x / 2, posNew.y - boxNew.y / 2);
        }
        // Восстанавливаем прозрачность
        this.ctx.globalAlpha = 1;
    }
    // Текст (обработка)
    public text(text: string, pos: geom.Vector,  font?: string, color?: Color, outline?: boolean, outlineColor?: Color,
        align?: CanvasTextAlign, baseline?: CanvasTextBaseline) {
            let curelem: textQueue = {text, pos, font, color, outline, outlineColor, align, baseline};
            this.textqueue.push(curelem);
    }
    // Изображение (обработка)
    public image(image: HTMLImageElement, pos: geom.Vector, box: geom.Vector, angle: number, layer: Layer, transparency = 1) {
        if (layer == Layer.TileLayer ) { // Отрисовка сразу
            this.drawimage(image, pos, box, angle, transparency);
        } else {
            if ( Layer.HudLayer == layer) {// Отрисовка после сортировки
                let curqueue: queue = { image, pos, box, angle, layer, transparency};
                this.imagequeueHud.push(curqueue);
            } else {
                let curqueue: queue = { image, pos, box, angle, layer, transparency};
                this.imagequeueEntity.push(curqueue);
            }
        }
    }
    // Отрисовка HTMLCanvasElement
    public displayBuffer(image: HTMLCanvasElement, pos: geom.Vector, box: geom.Vector, angle: number, transparency: number) {
        let posNew = this.transform(pos);
        let boxNew = box.mul(this.cam.scale * 1.01);
        posNew = posNew.sub(boxNew.mul(1 / 2));
        //this.ctx.imageSmoothingEnabled = false;
        if (angle % (2 * Math.PI) == 0) {
            this.ctx.globalAlpha = transparency;
            this.ctx.drawImage(image, posNew.x, posNew.y, boxNew.x, boxNew.y); // Без поворота (Много ресурсов на поворот уходит(даже на 0))
        } else {
            let buffer = document.createElement('canvas'); // Поворот
            buffer.width = boxNew.x * 2;
            buffer.height = boxNew.y * 2;
            let bctx = buffer.getContext('2d');
            bctx.imageSmoothingEnabled = false;
            bctx.translate(boxNew.x, boxNew.y);
            bctx.rotate(angle);
            bctx.drawImage(image, -boxNew.x / 2, -boxNew.y / 2, boxNew.x, boxNew.y);
            this.ctx.globalAlpha = transparency;
            this.ctx.drawImage(buffer, posNew.x - boxNew.x / 2, posNew.y - boxNew.y / 2);
        }
        // Восстанавливаем прозрачность
        this.ctx.globalAlpha = 1;
    }
    // Обработка слоев изображения
    public getimage(curlevel : Level) {
        if (this.imagequeueEntity.length > 0) { // Отрисовка изображений
            this.imagequeueEntity.sort(function (a, b) { // Сортировка
                if (a.layer > b.layer)
                    return -1;
                if (a.layer < b.layer)
                    return 1;
                if (a.pos.y > b.pos.y)
                    return -1;
                if (a.pos.y < b.pos.y)
                    return 1;
                return 0;
            });
            for (; this.imagequeueEntity.length > 0;) {
                let temp = this.imagequeueEntity.pop(); //Извлечение
                this.drawimage(temp.image, temp.pos, temp.box, temp.angle, temp.transparency)
            }
        }
        curlevel.displayLighting(this);
        for (; this.hpqueue.length > 0;) { // Отрисовка hp бара
            let temp = this.hpqueue.pop();
            let pos = temp.pos;
            let box = temp.box;
            let percentage = temp.percentage;
            let frontColor = temp.frontColor;
            let backColor = temp.backColor;
            let marks = temp.marks;
            // hp бар
            let bar = box.clone();
            bar.x *= percentage;
            this.fillRect(pos, box, backColor);
            let posNew = pos.clone();
            posNew.x -= (box.x - bar.x) / 2;
            this.fillRect(posNew, bar, frontColor);
            // Деления
            bar.x = 2 / this.cam.scale;
            pos.x -= box.x / 2;
            for (let i = 0; i < marks.length; i++) {
                posNew = pos.clone();
                posNew.x += box.x * marks[i];
                this.fillRect(posNew, bar, backColor);
            }
        }
        if (this.imagequeueHud.length > 0) { // Отрисовка изображений
            this.imagequeueHud.sort(function (a, b) { // Сортировка
                if (a.layer > b.layer)
                    return -1;
                if (a.layer < b.layer)
                    return 1;
                if (a.pos.y > b.pos.y)
                    return -1;
                if (a.pos.y < b.pos.y)
                    return 1;
                return 0;
            });
            for (; this.imagequeueHud.length > 0;) {
                let temp = this.imagequeueHud.pop(); //Извлечение
                this.drawimage(temp.image, temp.pos, temp.box, temp.angle, temp.transparency);
            }
        }
        for (; this.textqueue.length > 0; ) {
            let temp = this.textqueue.pop();
            this.drawText(temp.text, temp.pos, temp.font, temp.color, temp.outline,
                 temp.outlineColor, temp.align, temp.baseline);   
        }
    }
    // Заполненный прямоугольник
    public fillRect(pos: geom.Vector, box: geom.Vector, color: Color) {
        let posNew = this.transform(pos);
        let boxNew = box.mul(this.cam.scale);
        posNew = posNew.sub(boxNew.mul(1 / 2));
        this.ctx.fillStyle = color.toString(); // цвет заливки
        this.ctx.fillRect(posNew.x, posNew.y, boxNew.x, boxNew.y);
    }
    // Контур прямоугольника
    public strokeRect(pos: geom.Vector, box: geom.Vector, color: Color, lineWidth: number) {
        let posNew = this.transform(pos);
        let boxNew = box.mul(this.cam.scale);
        posNew = posNew.sub(boxNew.mul(1 / 2)); // незаполненный прямоугольник
        this.ctx.strokeStyle = color.toString(); // цвет контура
        this.ctx.lineWidth = lineWidth * this.cam.scale; // ширина контура
        this.ctx.strokeRect(posNew.x, posNew.y, boxNew.x, boxNew.y);
    }
    // Заполненная окружность
    public fillCircle(pos: geom.Vector, radius: number, color: Color) {
        let posNew = this.transform(pos);
        this.ctx.beginPath();
        this.ctx.arc(posNew.x, posNew.y, radius * this.cam.scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = color.toString(); // цвет заливки
        this.ctx.fill();
    }
    // Контур окружности
    public strokeCircle(pos: geom.Vector, radius: number, color: Color, lineWidth: number) {
        let posNew = this.transform(pos);
        this.ctx.beginPath();
        this.ctx.arc(posNew.x, posNew.y, radius * this.cam.scale, 0, Math.PI * 2, false);
        this.ctx.lineWidth = lineWidth * this.cam.scale; // ширина контура
        this.ctx.strokeStyle = color.toString(); // цвет контура
        this.ctx.stroke();
    }
    // Заполненный многоугольник
    public fillPolygon(vertices: Array<geom.Vector>, color: Color) {
        for (let i = 0; i < vertices.length; i++) {
            let posNew = this.transform(vertices[i]);
            this.ctx.lineTo(posNew.x, posNew.y);
        }
        this.ctx.fillStyle = color.toString(); // цвет заливки
        this.ctx.fill();
    }
    public line(begin: geom.Vector, end: geom.Vector, color: Color, lineWidth: number) {
        begin = this.transform(begin);
        end = this.transform(end);
        this.ctx.beginPath();
        this.ctx.moveTo(begin.x, begin.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.closePath();
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = color.toString();
        this.ctx.stroke();
    }
    public arrow(begin: geom.Vector, end: geom.Vector) {
        begin = this.transform(begin);
        end = this.transform(end);
        this.ctx.beginPath();
        this.ctx.moveTo(begin.x, begin.y);
        this.ctx.lineTo(end.x, end.y);
        let headlen = 20 * this.cam.scale;
        var dx = end.x - begin.x;
        var dy = end.y - begin.y;
        var angle = Math.atan2(dy, dx);
        let tox = end.x;
        let toy = end.y;
        this.ctx.moveTo(tox, toy);
        this.ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.moveTo(tox, toy);       
        this.ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        this.ctx.closePath();
        this.ctx.lineWidth = 5 * this.cam.scale;
        this.ctx.strokeStyle = new Color(0, 255, 0).toString();
        this.ctx.stroke();
    }
    // Контур многоугольника
    public strokePolygon(vertices: Array<geom.Vector>, color: Color, lineWidth: number) {
        for (let i = 0; i < vertices.length; i++) {
            let posNew = this.transform(vertices[i]);
            this.ctx.lineTo(posNew.x, posNew.y);
            this.ctx.lineWidth = lineWidth * this.cam.scale; //ширина контура
        }
        this.ctx.strokeStyle = color.toString(); // цвет контура
        this.ctx.stroke();
    }
    // Заполненный сектор
    public fillSector(pos: geom.Vector, radius: number, color: Color, startAngle: number, endAngle: number) {
        let posNew = this.transform(pos);
        this.ctx.beginPath();
        this.ctx.arc(posNew.x, posNew.y, radius * this.cam.scale, startAngle, endAngle, false);
        this.ctx.fillStyle = color.toString(); // цвет заливки
        this.ctx.fill();
    }
    // Контур сектора
    public strokeSector(pos: geom.Vector, radius: number, color: Color, lineWidth: number, startAngle: number, endAngle: number) {
        let posNew = this.transform(pos);
        this.ctx.beginPath();
        this.ctx.arc(posNew.x, posNew.y, radius * this.cam.scale, startAngle, endAngle, false);
        this.ctx.lineWidth = lineWidth * this.cam.scale;  // ширина контура
        this.ctx.strokeStyle = color.toString(); // цвет контура
        this.ctx.stroke();
    }
    // Создание анимации
    public spriteAnimation(
        name: string,
        framesNumber: number,
        initialState: AnimationState,
        finalState: AnimationState,
        duration: number,
        frameDuration: number) {
        let animation = new SpriteAnimation();
        animation.loadFrames(name, framesNumber);
        animation.initialState = initialState;
        animation.finalState = finalState;
        animation.duration = duration;
        animation.frameDuration = frameDuration;
        this.spriteAnimations.push(animation);
    }
    // Step
    public step() {
        // Обработка анимаций
        this.spriteAnimations.forEach(animation => animation.step());
        // Удаление отработавших анимаций
        for (let i = 0; i < this.spriteAnimations.length; i++) {
            if (this.spriteAnimations[i].isOver()) {
                this.spriteAnimations.splice(i, 1);
                i--;
            }
        }
        // Отрисовка
        this.spriteAnimations.forEach(animation => animation.display(this));
    }
    
    public clear() {
        this.ctx.clearRect(-1000, -1000, 10000, 10000);
    }
    // hp бар 
    public bar(pos: geom.Vector, box: geom.Vector, percentage: number, backColor: Color, frontColor: Color, marks: number[]) {
        if (percentage > 1)
            percentage = 1;
        if (percentage < 0)
            percentage = 0;
        let queue: barQueue = { pos, box, percentage, frontColor, backColor, marks };
        this.hpqueue.push(queue); // Добавляем в очередь на отрисовку


    }
}