
const SawState = {
    Idle:      "idle",
    Shoting:   "shoting",
    Preparing: "preparing",
    Returning: "returning",
}

class Saw {

    constructor(parent, radius, offset) {

        this.parent = parent;
        this.offset = offset;
        
        this.target = new Vec2;

        this.start = Vec2Add(this.parent.pos, this.offset);
        this.end = new Vec2;
        this.shotPos = new Vec2;
        
        this.pos = this.start;

        this.speed = 0;
        this.enableTime = 0;
        this.currentTime = 0;

        this.hitOnce = false;

        this.state = SawState.Idle;

        this.radius = radius;
        this.sprite = new Sprite(this.pos, this.radius*2, this.radius*2, c.white);
        
        this.health = 100;
        this.charming = false;

        this.preparingDuration = 0.4;
        this.preparingTime = 0;
        this.firstTimePreparing = true;

        this.angle = 0;
    }

    Reset() {
        this.health = 100;
        this.charming = false;
        this.sprite.color = c.gray1;
    }

    PrepareAndShot(target, speed)  {
        if(speed < 0.001) return;

        if(this.state != SawState.Idle) return; 
        this.state = SawState.Preparing;

        this.speed = speed;
        this.target = target;

    }

    Shot(target, speed) {
        if(speed < 0.001) return;

        if(this.state != SawState.Preparing) return; 
        this.state = SawState.Shoting;
        
        this.speed = speed;
        this.end.x = target.x;
        this.end.y = target.y;
        
        this.shotPos = this.pos;

        this.currentTime = 0;
        this.enableTime = Vec2Sub(this.end, this.start).length() / this.speed;

        g.soundManager.GetSound("saw").Stop();
        g.soundManager.GetSound("saw").Play();

    }

    Update(dt) {
        
        this.start = Vec2Add(this.parent.pos, this.offset);

        switch(this.state) {
            case SawState.Idle:
                this.ProcessIdleState(dt);
                break;
            case SawState.Preparing:
                this.ProcessPreparingState(dt);
                break;
            case SawState.Shoting:
                this.ProcessShottingState(dt);
                break;
            case SawState.Returning:
                this.ProcessReturningState(dt);
                break;
        }

        this.sprite.pos = this.pos;
        this.sprite.Update(dt);

    }

    Render() {
        if(this.charming) {
            g.textureManager.BindTexture("flower");
        } else {
            g.textureManager.BindTexture("saw");
        }
        this.sprite.Render(g.shader);
    }
    
    ProcessIdleState(dt) {
        this.pos = this.start;

        if(!this.hitOnce && TestCircleCircle(this.GetCircle(), g.player.GetCircle()) && this.charming == false) {   
            g.player.DecreaseHealth(1);
            this.hitOnce = true;
        }
        
        this.sprite.rotation = this.angle;
        this.angle -= dt;

    }

    ProcessPreparingState(dt) {
        if(this.preparingTime > this.preparingDuration) {
            this.preparingTime = 0;
            this.firstTimePreparing = true;
            this.Shot(this.target, this.speed);
            return;
        }

        if(this.firstTimePreparing) {
            this.sprite.PlayDamageAnimation(this.preparingDuration, c.blue, 50);
            this.firstTimePreparing = false;
        }

        this.preparingTime += dt;
    }

    ProcessShottingState(dt) {

        if(this.currentTime > this.enableTime) {
            this.currentTime = 0;
            this.enableTime = 0;
            this.end = this.pos;
            this.state = SawState.Returning;
            return;
        }

        let dir = Vec2Normalize(Vec2Sub(this.end, this.shotPos));
        this.pos = Vec2Add(this.shotPos, Vec2MulScalar(dir, this.speed * this.currentTime));
        this.currentTime += dt;

        this.sprite.rotation = this.angle;
        this.angle += dt*15;

        if(!this.hitOnce && TestCircleCircle(this.GetCircle(), g.player.GetCircle()) && this.charming == false) {   
            g.player.DecreaseHealth(1);
            this.hitOnce = true;
        }
    
    }

    ProcessReturningState(dt) {
        
        if(this.currentTime >= 1) {
            this.currentTime = 0;
            this.hitOnce = false;
            this.state = SawState.Idle;
            return;
        }

        this.sprite.rotation = this.angle;
        this.angle -= dt*5;

        let dir = Vec2Sub(this.start, this.end);
        this.pos = Vec2Add(this.end, Vec2MulScalar(dir, this.EaseInOutQuad(this.currentTime)));
        this.currentTime += dt * 1;

    }

    EaseInOutQuad(x) {
        return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    }

    CalculateTragetFromPlayer(dt) {
        let result = Vec2;
        let dir = Vec2Normalize(Vec2Sub(this.pos, g.player.pos));
        result = Vec2Sub(g.player.pos, Vec2MulScalar(dir, 300));
        return result;
    }

    DecreaseHealth(amount) {
        this.health = Math.max(this.health - amount, 0);
        if(this.health == 0) {
            this.charming = true;
        }
        else {
            this.sprite.PlayDamageAnimation(0.2, c.overflow, 100);
        }
    }

    GetCircle() {
        let result = new Circle(this.pos, this.radius*0.95);
        return result;
    }

}