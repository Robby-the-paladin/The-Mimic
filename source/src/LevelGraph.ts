import { Vector } from "./Geom";
import { Level } from "./Level";

export class Vertex{
    public level : Level;

    constructor(level : Level) {
        this.level = level;
    }
}

export class Edge{ 
    public spawnPlace : Vector;
    public begin : string;
    public end : string;

    constructor(begin : string, end : string) {
        this.begin = begin;
        this.end = end;
    }
}

export class Graph{
    public verticies : Map<string, Vertex>;
    public edges: Edge[];

    public addVertex(levelName : string, level : Level) {
        this.verticies.set(levelName, new Vertex(level));
    }

    public addEdge(begName : string, endName : string) {
        if (this.verticies[begName] != null && this.verticies[endName] != null) {
            this.edges.push(new Edge(begName, endName));
        }
    }
}