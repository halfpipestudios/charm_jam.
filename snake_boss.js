const SnakeBossState = {
    Attack: "attack",
    PrepareAttack: "prepareAttack",
    Rest: "rest",
    Seek: "seek",
    Dead: "dead"
}
const gScale = 1.5;

class SnakeBoss {

    

    constructor() {
        

        this.nodes = [];
        this.nodeCount = 30;
        this.nodeDistance = 35 * gScale;

        this.Reset();
        
        this.maxAngVel = 3*Math.PI;
        this.maxAcc = 800;
        this.timeToTarget = 0.5;

        this.prepareAttackPos = 0;
    }

    Reset() {
        let w = 50 * gScale;
        this.nodes = [];
        this.pos = new Vec2(1280/2, 720)
        this.orientation = 0;
        this.linVel = 0;
        this.angVel = 0;
        let currentPos = new Vec2(this.pos.x, this.pos.y);
        for(let i = 0; i < this.nodeCount; ++i) {
            this.nodes.push({
                 pos: new Vec2(currentPos.x, currentPos.y),
                 orientation: 0,
                 sprite: this.sprite = new Sprite(new Vec2(currentPos.x, currentPos.y), w, w, c.white),
                 life: 3,
                 alive: true});
            currentPos.y += this.nodeDistance;
        }

        this.nodes[0].sprite.w *= 1.6;
        this.nodes[0].sprite.h *= 1.6;
        this.nodes[0].life = 40;
        this.nodes[this.nodeCount - 1].sprite.w *= 1.4;
        this.nodes[this.nodeCount - 1].sprite.h *= 1.4;
        this.nodes[this.nodeCount - 1].life = 40;

        this.state = SnakeBossState.Rest;
        this.timer = 0;
    }

    Update(target, dt) {

        let snakeWasKill = 0;
        for(let i = 0; i < this.nodeCount; ++i) {
            if(g.snakeBoss.nodes[i].life == 0 && g.snakeBoss.nodes[i].alive) {
                g.snakeBoss.nodes[i].alive = false;
            }
            if(!g.snakeBoss.nodes[i].life) {
                snakeWasKill++;
            }
        }

        if(snakeWasKill === this.nodeCount && this.state !== SnakeBossState.Dead) {
            this.state = SnakeBossState.Dead;
            this.timer = 0.0;
        }
 
        let tar = new Vec2(target.x, target.y);
        switch(this.state) {
            case SnakeBossState.Attack:
                this.ProcessSnakeAttackState(tar, dt);
                break;
            case SnakeBossState.PrepareAttack:
                this.ProcessSnakePrepareAttackState(tar, dt);
                break;
            case SnakeBossState.Rest:
                this.ProcessSnakeRestState(tar, dt);
                break;
            case SnakeBossState.Seek:
                this.ProcessSnakeSeekState(tar, dt);
                break;
            case SnakeBossState.Dead:
                this.ProcessSnakeDeadState(tar, dt);
        }
        this.ProcessSnakeBody();

        if(snakeWasKill !== this.nodeCount) {
            this.ProcessDamageToPlayer(dt);
        }
        
        this.timer += dt;
    }

    Render(shader) {
        if(this.nodes[this.nodeCount - 1].alive) {
            g.textureManager.BindTexture("snake_bad_tail");
        }
        else {
            g.textureManager.BindTexture("snake_cute_tail");
        }
        this.nodes[this.nodeCount - 1].sprite.pos = this.nodes[this.nodeCount - 1].pos;
        this.nodes[this.nodeCount - 1].sprite.rotation = -(this.nodes[this.nodeCount - 1].orientation + Math.PI/2);
        this.nodes[this.nodeCount - 1].sprite.Update(0.016);
        this.nodes[this.nodeCount - 1].sprite.Render(shader);

        for(let i = this.nodeCount - 2; i >= 1; --i) {
            if(this.nodes[i].alive) {
                g.textureManager.BindTexture("snake_bad_body");
            }
            else {
                g.textureManager.BindTexture("snake_cute_body");
            }
            this.nodes[i].sprite.pos = this.nodes[i].pos;
            this.nodes[i].sprite.rotation = -(this.nodes[i].orientation + Math.PI/2);
            this.nodes[i].sprite.Update(0.016);
            this.nodes[i].sprite.Render(shader);
        }

        if(this.nodes[0].alive) {
            g.textureManager.BindTexture("snake_bad_head");
        }
        else {
            g.textureManager.BindTexture("snake_cute_head");
        }
        this.nodes[0].sprite.pos = this.nodes[0].pos;
        this.nodes[0].sprite.rotation = -(this.nodes[0].orientation + Math.PI/2);
        this.nodes[0].sprite.Update(0.016);
        this.nodes[0].sprite.Render(shader);

    }

    ProcessDamageToPlayer(dt) {
        for(let i = 0; i < this.nodes.length; ++i) {
            if(this.nodes[i].alive || i == 0) {
                let pos = this.nodes[i].pos;
                let sprite = this.nodes[i].sprite;
                let circle = new Circle(pos, 50*0.60);
                if(TestCircleCircle(circle, g.player.GetCircle())) {   
                    g.player.DecreaseHealth(1);
                }
            }
        }
    }

    ProcessSnakeAttackState(tar, dt) {

        let d = Vec2Sub(tar, this.pos);
        if(Vec2Dot(d, d) <= 4000) {
            this.state = SnakeBossState.Rest;
        }

        this.maxAngVel = 30*Math.PI;
        this.maxAcc = 1600;
        this.timeToTarget = 0.2;

        this.ProcessSnakeMovement(tar, dt);
    }

    ProcessSnakePrepareAttackState(tar, dt) {
        
        if(this.timer >= 4.0) {
            this.state = SnakeBossState.Attack;
            this.timer = 0;
        }

        this.maxAngVel = 3*Math.PI;
        this.maxAcc = 800;
        this.timeToTarget = 0.3;
        tar = this.prepareAttackPos;
        this.ProcessSnakeMovement(tar, dt);
    }

    ProcessSnakeRestState(tar, dt) {

        if(this.timer >= 8.0) {
            let rand = Math.floor(Math.random() * 3);
            if(rand % 2 == 0) {
                this.state = SnakeBossState.Seek;
            }
            else
            {
                this.state = SnakeBossState.PrepareAttack;
                let x = Math.cos(Math.random() * 2 * Math.PI) * 10000;
                let y = Math.sin(Math.random() * 2 * Math.PI) * 10000;
                this.prepareAttackPos = new Vec2(x, y);
            }
            this.timer = 0;
        }

        this.maxAngVel = 3*Math.PI;
        this.maxAcc = 800;
        this.timeToTarget = 2.0;
        this.ProcessSnakeMovement(tar, dt);
    }

    ProcessSnakeSeekState(tar, dt) {

        if(this.timer >= 8.0) {
            this.state = SnakeBossState.Rest;
            this.timer = 0;
        }

        this.maxAngVel = 3*Math.PI;
        this.maxAcc = 800;
        this.timeToTarget = 0.5;
        this.ProcessSnakeMovement(tar, dt);
    }


    ProcessSnakeBody() {
        this.nodes[0].pos = this.pos;
        this.nodes[0].orientation = this.orientation;
        for(let i = 1; i < this.nodeCount; ++i) {
            let toMe = Vec2Sub(this.nodes[i].pos, this.nodes[i - 1].pos);
            let sqDist = Vec2Dot(toMe, toMe);
            let newPos = Vec2Add(this.nodes[i - 1].pos, Vec2MulScalar(Vec2Normalize(toMe), this.nodeDistance));
            this.nodes[i].pos = newPos;
            let dir = Vec2Normalize(Vec2Sub(this.nodes[i - 1].pos, this.nodes[i].pos));
            this.nodes[i].orientation = Vec2ToAngle(dir);
        }
    }

    ProcessSnakeMovement(target, dt) {
        let steering = Seek(this.pos, this.orientation, target, this.maxAngVel, this.maxAcc, this.timeToTarget);
        this.linVel += steering.linear * dt;
        this.angVel = steering.angular;
        this.orientation += this.angVel * dt;
        let dir = AngleToVec2(this.orientation);
        let vel = Vec2MulScalar(dir, this.linVel * dt);
        this.pos = Vec2Add(this.pos, vel);
        let damping = Math.pow(0.1, dt);
        this.linVel *= damping;
    }

    ProcessSnakeDeadMovement(target, dt) {
        let steering = Arrive(this.pos, this.orientation, target, this.maxAngVel, this.maxAcc, this.timeToTarget);
        this.linVel += steering.linear * dt;
        this.angVel = steering.angular;
        this.orientation += this.angVel * dt;
        let dir = AngleToVec2(this.orientation);
        let vel = Vec2MulScalar(dir, this.linVel * dt);
        this.pos = Vec2Add(this.pos, vel);
        let damping = Math.pow(0.1, dt);
        this.linVel *= damping;
    }

    ProcessSnakeDeadState(tar, dt) {
        if(this.timer >= 8.0) {
            g.gameStateManager.SetState(GameState.Menu, () => {
                g.soundManager.StopSounds();
            });
            this.timer = 0;
        }

        this.maxAngVel = 3*Math.PI;
        this.maxAcc = 800;
        this.timeToTarget = 0.5;
        this.ProcessSnakeDeadMovement(new Vec2(g.window_w/2, g.window_h/2), dt);

        for(let i = 0; i < this.nodeCount; ++i) {
            this.nodes[i].pos.x = this.nodes[i].pos.x + (Math.random() * 2 - 1) * 2;
            this.nodes[i].pos.y = this.nodes[i].pos.y + (Math.random() * 2 - 1) * 2;
        }
    }
}