import * as geom from "../Geom";
import { Body } from "./EntityAttributes/Body";
import { Animation } from "./EntityAttributes/Animation";
import { AI } from "./EntityAttributes/AI";
import { Game } from "../Game";
import { Commands } from "./EntityAttributes/Commands";
import { Draw } from "../Draw";
import { AnimationState } from "../SpriteAnimation";
import { Interactive } from "../Interactive";

export class Entity {
    public game: Game;
    public body: Body;
    public animation: Animation;
    public entityID: number;
    public myAI: AI;
    public commands: Commands = null;
    public alive = true;
    public hpMax = 15; // Максимальное здоровье
    public hp = this.hpMax; // Текущее здоровье
    public interactive: Interactive = undefined;

    constructor(game: Game, body: Body) {
        this.game = game;
        this.body = body;
        this.myAI = new AI(game, body);
        this.animation = new Animation("Scientist", 8); // создание анимации персонажа
        this.commands = this.myAI.commands;
    }

    public die() {
        this.hp = 0;
        this.alive = false;
    }

    public step() {
        if (this.hp <= 0)
            this.die();
        if (!this.commands)
            return;
        this.myAI.step();
        // Восстанавливаем комманды
        this.commands = this.myAI.commands;
        if (this.interactive != undefined) {
            this.interactive.step();
        }
    }

    public display(draw: Draw) {
        draw.image(this.animation.current_state, this.body.center.sub(new geom.Vector(0, 0.5 - this.body.collisionBox.y / 2)), new geom.Vector(1, 1), 0, 1);
    }
}
