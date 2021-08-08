import * as geom from "../../Geom";
import { Body } from "./Body";
import { Game } from "../../Game";
import { MimicMap } from "../../Game";
import { Commands } from "./Commands";
import path = require("path/posix");
import * as aux from "../../AuxLib";
import { Debug } from "../../Debug";
import { Color } from "../../Draw";

export class AI {
    private destination : geom.Vector = new geom.Vector(0, 0); // конечная точка, куда направляется персонаж(нужна для дебага)
    private activationTime : number; // время, с которого объект перестаёт ждать и становится активным

    private body : Body; // тело объекта
    public Path : geom.Vector[]; // путь к конечной точке
    public game : Game;
    public commands : Commands; // набор команд, генерируемых AI

    constructor(game : Game, body : Body) {
        this.game = game;
        this.body = body;
        this.commands = new Commands();
        this.Path = [];
    }

    private stop() { // функция остановки
        this.commands["MoveRight"] = false;
        this.commands["MoveLeft"] = false;
        this.commands["MoveDown"] = false;
        this.commands["MoveUp"] = false;
    }

    private go(point : geom.Vector) { // функция движения в направлении к точке
        if (this.body.center.x < point.x) {
            this.commands["MoveRight"] = true;
        }
        else {
            this.commands["MoveRight"] = false;
        }
        if (this.body.center.x > point.x) {
            this.commands["MoveLeft"] = true;
        }
        else {
            this.commands["MoveLeft"] = false;
        }
        if (this.body.center.y < point.y) {
            this.commands["MoveDown"] = true;
        }
        else {
            this.commands["MoveDown"] = false;
        }
        if (this.body.center.y > point.y) {
            this.commands["MoveUp"] = true;
        }
        else {
            this.commands["MoveUp"] = false;
        }
    }

    // возвращает координату точки коллизионной сетки по её положению в этой сетке
    private getPointCoordinate(place : geom.Vector) : geom.Vector {
        return new geom.Vector(place.y * this.game.tileSize / 2, place.x * this.game.tileSize / 2);
    }

    // находит ближайшую точку коллизионной сетки
    private chooseMeshPoint(currentPoint : geom.Vector) : geom.Vector {
        let CollisionMesh = Game.grids[this.game.currentGridName].CollisionMesh;
        let Grid = Game.grids[this.game.currentGridName].Grid;
        let posRound = new geom.Vector(
            Math.floor(this.body.center.x / this.game.tileSize), 
            Math.floor(this.body.center.y / this.game.tileSize)
        );
        let place = new geom.Vector(posRound.y * 2 + 1, posRound.x * 2 + 1);
        let answer = new geom.Vector(0, 0);
        console.log("here");
        
        for(let i = -5; i <= 5; i++) {
            for (let j = -5; j <= 5; j++) {
                if (place.x + i < CollisionMesh.length && place.x + i > 0) {
                    if (place.y + j < CollisionMesh[place.x + i].length && place.y + j > 0) {                      
                        if (CollisionMesh[place.x + i][place.y + j] == false &&
                            currentPoint.sub(this.getPointCoordinate(new geom.Vector(answer.x, answer.y))).abs() >
                            currentPoint.sub(this.getPointCoordinate(new geom.Vector(place.x + i, place.y + j))).abs()) {
                            
                            answer = new geom.Vector(place.x + i, place.y + j);
                        }
                    }
                }
            }
        }
        return answer;
    }

    // рекурсивная функция создающая путь по точкам коллизионной сетки
    private makePath(start : geom.Vector, finish : geom.Vector) : geom.Vector[] { 
        let pathMatrix = Game.grids[this.game.currentGridName].PathMatrix;
        //console.log(pathMatrix.get(JSON.stringify(start)), pathMatrix.get(JSON.stringify(start)).get(JSON.stringify(finish)));

        // если до точки нельзя добраться или точка начала совпадает с финальной, то возвращается пустой путь
        if (JSON.stringify(start) == JSON.stringify(finish) || pathMatrix.get(JSON.stringify(start)).get(JSON.stringify(finish)) == undefined) {
            return [];
        }

        // если точки находятся рядом то путь состоит из одной финальной вершины
        if (pathMatrix.get(JSON.stringify(start)).get(JSON.stringify(finish)) == JSON.stringify(finish)) {
            let answer : geom.Vector[];
            answer = [];
            answer[0] = this.getPointCoordinate(finish);
            //console.log("Path from ", start, " to ", finish, " is ", answer);
            
            return answer;
        }

        // middlePoint - третья точка точка лежащая на кратчайшем пути
        let middlePoint = JSON.parse(pathMatrix.get(JSON.stringify(start)).get(JSON.stringify(finish)));
        let a1 = this.makePath(start, middlePoint);
        let a2 = this.makePath(middlePoint, finish);
        let answer = a1.concat(a2);
        //console.log("Path from ", start, " to ", finish, " is ", a1.concat(a2), answer);
        
        return answer;
    }

    public goToPoint(point : geom.Vector) { // функция, прокладывающая путь до точки
        this.destination = point;   
        this.Path = [];
        let startMeshPoint = this.chooseMeshPoint(this.body.center);
        let finishMeshPoint = this.chooseMeshPoint(point);        
        
        let localPath = this.makePath(startMeshPoint, finishMeshPoint);
        for (let i = 0; i < localPath.length; i++) {
            this.Path[i] = localPath[i].clone();
        }
    }

    // функция, определяющая когда активируется персонаж(чтобы сбросить время ожидания вызвать wait(0))
    public wait(milliseconds : number) {
        this.activationTime = aux.getMilliCount() + milliseconds;
    }

    // функция преследования мимика со всеми вытекающими
    public pursuit() {
        this.goToPoint(this.game.ghost);
        // TODO сделать поиск в окрестности точки ghost
    }

    step() {
        if (this.activationTime > aux.getMilliCount()) { // проверк активности персонажа
            return;
        }
        if (this.Path.length != 0) { // если путь не пустой, то идти по направлению следующей точки
            this.go(this.Path[0]);
            //console.log(this.body.center.sub(this.Path[0]).abs(), geom.eps * 150);
            if (this.body.center.sub(this.Path[0]).abs() < geom.eps * 150) {                
                this.Path.shift();
            }
        } else { // иначе остановится
            this.stop();
        }

        // Debug коллизионной сетки
        let CollisionMesh = Game.grids[this.game.currentGridName].CollisionMesh;
        
        for (let i = 0; i < CollisionMesh.length; i++) {
            for (let j = 0; j < CollisionMesh[i].length; j++) {                
                let coordinate = this.getPointCoordinate(new geom.Vector(i, j));
                let color = new Color(0, 255, 0);
                if (CollisionMesh[i][j] == true) {
                    color = new Color(255, 0, 0);
                } 
                Debug.addPoint(coordinate, color);
            }
        }

        Debug.addPoint(this.destination, new Color(0, 0, 255));
    }
}