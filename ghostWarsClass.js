"use strict"

//物件格子模板
class Block{
    constructor(x, y){
        this.x = x;                             //格子相對畫布x位置
        this.y = y;
        this.width = blockSize;                 //每個格子寬度
        this.height = blockSize;
    }
    draw(){
        if(mouse.x && mouse.y && collision(this, mouse)){                           //要確認x y在畫布內 
            ctx.strokeStyle = 'white';                                              //設定勾勒圖形要用的顏色
            ctx.lineWidth = 3;                                                      //勾勒圖形線寬
            ctx.strokeRect(this.x, this.y, this.width, this.height);                //strokeRect()描繪矩形
        }
    }
}

//物件子彈模板
class Projectile{
    constructor(x, y){
        this.x = x;                 //子彈相對畫布x位置                                    
        this.y = y;
        this.width = 10;            //子彈寬             
        this.height = 10;
        this.power = 20;            //子彈打中幽靈要減少的幽靈健康度的力度
        this.speed = 5;             //子彈飛行速度
    }
    update(){
        this.x += this.speed * 1.5; 
    }
    draw(){                                                         //畫子彈
        ctx.fillStyle = 'black';
        ctx.beginPath();                                             //產生一個路徑
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);         //arc(x, y, radius, startAngle, endAngle, anticlockwise)
        ctx.fill();
    }
}

//物件守衛模板
class Warrior{
    constructor(x, y){
        this.x = x; 
        this.y = y;
        this.width = blockSize - blockGap * 2;
        this.height = blockSize - blockGap * 2;
        this.shooting = false;                              //要不要射擊
        this.shootNow = false;
        this.health = 100;
        this.projectiles = [];                              
        this.timer = 0;                                     //存warrior存在時間
        this.frameX = 0;                                    //當前顯示的守衛是第幾個影格
        this.spriteWidth = 378;                             //影格寬度
        this.spriteHeight = 343;
        this.minFrame = 0;
        this.maxFrame = 5;                                  //有影格0~5
    }
    draw(){
        //ctx.fillStyle = 'blue';           
        //ctx.fillRect(this.x, this.y, this.width, this.height);                     //方塊底可判斷撞擊
        ctx.fillStyle = 'DarkRed';                                                   //守衛健康度字形
        ctx.font = '20px Orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 5, this.y + 20);              //顯示守衛健康度
        //繪製當前在影格frameX的圖像
        ctx.drawImage(warrior1, this.frameX * this.spriteWidth, 
                        0, this.spriteWidth, this.spriteHeight, this.x + 10, this.y + 20, this.width * 0.8, this.height * 0.8);
    }
    update(){
        if(frame % 8 === 0){                                                        //影格變換
            if(this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
            if(this.frameX === 5) this.shootNow = true;
        }
        if(this.shooting){                                                          //攻擊狀態影格
            this.minFrame = 3;
            this.maxFrame = 5;
        }else{                                                                      //防禦狀態影格顯示第0~2個
            this.maxFrame = 2;
            this.minFrame = 0;
        }

        if(this.shooting && this.shootNow){                                         //當幽靈出現且影格射擊畫面出現
            projectiles.push(new Projectile(this.x + 70, this.y + 50));             //產生新子彈，讓射擊動作配合子彈射出
            this.shootNow = false;                                                  //顯示完改回原狀態
        }
    }
}

//物件幽靈模板
class Enemy{
    constructor(verticalPosition){                                          //因為幽靈y位置隨機，所以呼叫時要傳值存入
        this.x = canvas.width;  //從左方出
        this.y = verticalPosition;
        this.width = blockSize - blockGap * 2;
        this.height = blockSize - blockGap * 2;
        this.speed = Math.random() * 0.2 + 0.4 ; 
        this.movement = this.speed;                                         //記住原本速度，讓因為碰到守衛而停下來的幽靈，因為擊敗守衛繼續用原本速度前進
        this.health = 100;
        this.maxHealth = this.health;                                       //記住原本健康度，擊敗幽靈時增加score
        this.type = Math.floor(Math.random() * enemyTypes.length);          //隨機選擇要哪個幽靈
        this.enemyType = enemyTypes[this.type];
        this.frameX = 0;                                                    //當前顯示的幽靈是第幾個影格
        this.minFrame = 0;
        this.maxFrame = 6;                                                  //總共有六個影格(動態顯示幽靈動作)
        this.spriteWidth = 39;                                              //每個影格寬度
        this.spriteHeight = 39;
    }
    update(){
        this.x -= this.movement;                                            //更新位置
        if(frame % 5 === 0){                                                //更新影格
            if(this.frameX < this.maxFrame) this.frameX++;                  
            else this.frameX = this.minFrame;
        } 
    }
    draw(){
        //ctx.fillStyle = 'red';                                            //方塊底可判斷撞擊
        //ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'black';
        ctx.font = '20px Orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 5, this.y + 20);     //顯示健康度
        //ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);   destination
        ctx.drawImage(this.enemyType, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x + 10, this.y + 15, this.width/ 1.5, this.height/ 1.5);
    }
}

//物件資源bonus模板
class Resources{
    constructor(){
        this.x = Math.random() * (canvas.width - blockSize);                //隨機放資源bonus x位置
        this.y = (Math.floor(Math.random() * 5) + 1) * blockSize + 25;      //資源bonus y位置要在格子行上
        this.width = blockSize * 0.6;
        this.height = blockSize * 0.6;
        this.amount = amounts[Math.floor(Math.random() * amounts.length)];  //資源bonus的值由amount[]隨機選要20/ 30/ 40
    }
    draw(){                                                                 //顯示資源bonus
        ctx.fillStyle = 'yellow';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'black';
        ctx.font = '20px Orbitron';
        ctx.fillText(this.amount, this.x + 15, this.y + 25);
    }
}

//物件浮動訊息模板
class floatMessage{
    constructor(value, x, y, size, color){          //要顯示吃了多少bonus，所以呼叫時要傳值
        this.value = value;
        this.x = x;                                 //訊息顯示位置
        this.y = y;
        this.size = size;                           //字型大小
        this.lifeSpan = 0;                          //顯示時間
        this.color = color;                         //字型顏色
        this.opacity = 1;                           //字型透明度
    }
    update(){                                                   //更新訊息位置
        this.y -= 0.3;
        this.lifeSpan += 1;                                     
        if(this.opacity > 0.02) this.opacity -= 0.02;           //訊息淡化
    }
    draw(){
        ctx.globalAlpha = this.opacity;                         //globalAlpha: canvas 2d設置透明度屬性
        ctx.fillStyle = this.color;
        this.fillStyle = this.color;
        ctx.font = this.size + 'px Orbitron';
        ctx.fillText(this.value, this.x, this.y);      
        ctx.globalAlpha = 1;                                    //重新設回原透明度
    }
}