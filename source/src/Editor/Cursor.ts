import { Control } from "../Control";
import { Draw, Color } from "../Draw";
import * as geom from "../Geom";
import { Level } from "../Level";
import { CollisionType, Tile } from "../Tile";

export enum Mode {
    Eraser = 0,
    Wall,
  }

// Курсор для редактора уровней. Хранит в себе позицию и
// информацию о том, как должен вести себя в случае клика
export class Cursor {
    public level : Level;
    public draw : Draw;
    public pos = new geom.Vector();
    public gridPos = new geom.Vector();
    public mode = Mode.Wall;
    public tile = new Tile(CollisionType.Full);
    public drawPreview : Draw;


    constructor(level : Level = null, draw : Draw = null) {
        this.level = level;
        this.draw = draw;
    }

    private setBlock() {
        this.level.Grid[this.gridPos.x][this.gridPos.y] = this.tile.clone();
    }

    public step() {
        this.pos = this.draw.transformBack(Control.mousePos());
        this.gridPos = this.level.gridCoordinates(this.pos);
        if(Control.isMouseLeftPressed() && this.level.isInBounds(this.pos))
            this.setBlock();
    }

    public display() {
        // Preview
        this.drawPreview.image(this.tile.image, new geom.Vector(25, 25), new geom.Vector(50, 50))
        // Cursor on grid
        if(this.level.isInBounds(this.pos))
            this.draw.strokeRect(
                this.gridPos.mul(this.level.tileSize).add(new geom.Vector(this.level.tileSize, this.level.tileSize).mul(1/2)), 
                new geom.Vector(this.level.tileSize, this.level.tileSize), 
                new Color(0, 255, 0),
                0.1
            );
    }
}