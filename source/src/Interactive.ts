import { Control } from "./Control";
import { Entity } from "./Entities/Entity";
import { Game } from "./Game";
import * as geom from "./Geom";
import { Ray } from "./RayCasting";

export class Interactive {
    public entity : Entity;
    public game : Game;
    public radius : number = 1;
    public text: string;
    public func: () => void;

    private isPointVisible(pos: geom.Vector): boolean {
        return (geom.dist(this.entity.body.center, pos) <= this.radius
            && !Ray.wallIntersection(this.entity.body.center, pos, this.game));
    }
    
    constructor(entity : Entity, game : Game, func : () => void, radius = 1, text = "activate") {
        this.entity = entity;
        this.game = game;
        this.radius = radius;
        this.text = text;
        this.func = func;
    }

    public step() {
        console.log(this.isPointVisible(this.game.mimic.controlledEntity.body.center));
        
        if (this.isPointVisible(this.game.mimic.controlledEntity.body.center)) {
            this.game.draw.drawText("Press " + Control.commandKeys["action"] + " to " + this.text, 
            new geom.Vector(this.game.draw.canvas.width / 2, 30), undefined, undefined, true);
            if (Control.commands["action"]) {
                this.func();
            }
        }
    }
}