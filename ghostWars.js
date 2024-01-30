"use strict"
const canvas = document.getElementById('canvas');       //找畫布元件
const ctx = canvas.getContext('2d');                    //getContext取得繪製屬性和方法

//全域變數
canvas.width = 900;
canvas.height = 600;

const blockSize = 100;                                  //定義一格尺寸
const blockGap = 3;                                     //格子內縮間隙，讓撞擊判斷不會因為對角線方向誤判
let numberOfResources = 300;                            //初始給定資源
let enemiesInterval = 500;                              //幽靈增加間隔
let frame = 0;                                          //frame紀錄遊戲進行時間，來控制幽靈增加速度
let score = 0;                                          //定義原本分數
let gameOver = false;                                   //定義原本遊戲狀態
let musicPlay = 0;                                      //控制遊戲音樂撥放時間                
let winningScore = 50;                                  //得分大於五十分才能贏

const gameGrid = [];                                    //儲存游標浮動到格子的位置
const warriors = [];                                    //儲存每個守衛資訊的陣列
const enemies = [];                                     //儲存每個幽靈資訊的陣列
const enemyTypes = [];                                  //儲存兩種幽靈
const enemyPositions = [];                              //另外存每個幽靈y位置以便刪除子彈時使用
const projectiles = [];                                 //儲存每個子彈資訊的陣列
const resources = [];                                   //儲存每個資源bonus資訊的陣列
const amounts = [20, 30, 40];                           //資源bonus有三種分數
const floatMessages = [];                               //儲存獲得分數陣列

//建構影像元素
let bgTower = new Image();
bgTower.src = 'bgTower.png';                             //高塔背景
let bgMud = new Image();
bgMud.src = 'bgMud.png';                                 //泥巴背景
let bgYard = new Image();
bgYard.src = 'bgYard.png';                              //後院背景(background  = 1)
let bgPool = new Image();
bgPool.src = 'bgPool.png';                              //水池背景
let bgSnowing = new Image();
bgSnowing.src = 'bgSnowing.png';                        //雪地背景
let background  = 1;                                    //定義初始背景是yard

const warrior1 = new Image();
warrior1.src = 'warrior1.png';                          //守衛影像
const enemy1 = new Image();
enemy1.src = 'ghost1.png';                              //幽靈影像
enemyTypes.push(enemy1);
const enemy2 = new Image();
enemy2.src = 'ghost2.png';
enemyTypes.push(enemy2);

//建構音訊
const audio = new Audio("bgm.mp3");
const success = new Audio("success.mp3");
const fail = new Audio("fail.mp3");

//定義原滑鼠位置
const mouse = {
    x: 10,
    y: 10,
    width: 0.1,
    height: 0.1,
}

//定義遊戲分數顯示區
const controlsBar = {
    width: canvas.width,
    height: blockSize,
}

//取得canvas方法和相對視窗位置
let canvasPosition = canvas.getBoundingClientRect();  

//滑鼠移入移出事件監聽
canvas.addEventListener('mousemove',function(e){
    mouse.x = e.x - canvasPosition.left;                    //設定mouse x位置的值是相對於畫布框內
    mouse.y = e.y - canvasPosition.top;
});
canvas.addEventListener('mouseleave',function(){
    mouse.x = undefined;
    mouse.y = undefined;
});

//建立格子陣列，方便之後游標移動時判斷碰撞位置
function createGrid(){
    for(let y = blockSize; y < canvas.height; y += blockSize){  //用雙層迴圈畫格子把方形畫布填滿
        for(let x = 0; x < canvas.width; x += blockSize){
            gameGrid.push(new Block(x,y));
        }
    }
}
createGrid();

//繪製滑鼠移動到的遊戲區塊
function handleGameGrid(){
    handleBackground();                                         //更新背景
    for(let i = 0; i < gameGrid.length; i++){
        gameGrid[i].draw();                                     //利用物件Block中draw判斷是否碰到格子陣列，有碰到就畫出
    }
}

//背景樣式
function handleBackground(){
    if(background === 1){
        ctx.drawImage(bgYard, 0, 0,bgYard.width, bgYard.height, 3, 103, 894, 494);          //更改body顏色
    }else if(background === 2){
        ctx.drawImage(bgMud, 0, 0,bgMud.width, bgMud.height, 3, 103, 894, 494);
    }else if(background === 3){
        ctx.drawImage(bgTower, 0, 0,bgTower.width, bgTower.height, 3, 103, 894, 494);
    }else if(background === 4){
        ctx.drawImage(bgPool, 0, 0,bgPool.width, bgPool.height, 3, 103, 894, 494);
    }else if(background === 5){
        ctx.drawImage(bgSnowing, 0, 0,bgSnowing.width, bgSnowing.height, 3, 103, 894, 494);
    }
}

//子彈
function handleProjectiles(){
    for(let i = 0; i < projectiles.length; i++){
        projectiles[i].update();                                        //更新子彈位置
        projectiles[i].draw();                                          //把更新物位置後的子彈繪出
        for(let j = 0; j < enemies.length; j++){                        //雙層迴圈判斷每個子彈是否有打中幽靈
            if(enemies[j] && projectiles[i] && collision(projectiles[i], enemies[j])){         //enemies[j]和projectiles[i]要存在
                enemies[j].health -= projectiles[i].power;              //打中幽靈要減少健康度
                projectiles.splice(i, 1);                               //打中幽靈子彈消失
                i--;                                                    //確認下一個元素不會被跳過      
            }
        }
        if(projectiles[i] && projectiles[i].x > canvas.width){          //超過右界的子彈要消失、刪掉
            projectiles.splice(i,1);    
            i--;
        }
    }
}

//事件監聽，當滑鼠點擊新增守衛
canvas.addEventListener('click', function(){                          
    const gridPositionX = mouse.x - (mouse.x % blockSize) + blockGap;           //找最接近斜前方的格子(每個格子x,y位置視正方形左上角)
    const gridPositionY = mouse.y - (mouse.y % blockSize) + blockGap;
    if(gridPositionY < blockSize) return;                                       //點擊分數欄位不能新增
    for(let i = 0; i < warriors.length; i++){                                   //檢查點擊位置是否已設置守衛
        if(warriors[i].x === gridPositionX && warriors[i].y === gridPositionY) return;
    }
    let warriorCost = 100;                                                      //新增一個守衛需要花費的resources
    if(numberOfResources >= warriorCost){                                       //reoureces夠                       
        warriors.push(new Warrior(gridPositionX, gridPositionY));               //把點擊位置當參數，把建立物件存到守衛陣列
        numberOfResources -= warriorCost;
    }else{                                                                      //resources如果不夠則顯示訊息
        floatMessages.push(new floatMessage("Need More Resources", mouse.x, mouse.y, 20, "blue"));
    }
});


//守衛
function handleWarriors(){
    for(let i = 0; i < warriors.length; i++){      
        warriors[i].update();                                                   //更新守衛位置                     
        warriors[i].draw();                                                     //畫守衛
        
        //守衛射射擊判斷
        if(enemyPositions.indexOf(warriors[i].y) !== -1){       //如果enemyPositions(100, 200..)有值(index回傳-1代表沒在陣列找到值)
            warriors[i].shooting = true;                        //shooting = true就要顯示射擊圖樣
        }else{
            warriors[i].shooting = false;                       //沒有幽靈顯示備戰圖樣
        }
        //判斷每個守衛是否碰到幽靈
        for(let j = 0; j < enemies.length; j++){
            if(warriors[i] && collision(warriors[i], enemies[j])){
                warriors[i].health -= 1;                        //守衛碰到幽靈健康值會減少
                enemies[j].movement = 0;                        //幽靈碰到健康度>0的守衛不能動
            }
            if(warriors[i] && warriors[i].health <= 0){         
                warriors.splice(i, 1);                          //守衛陣亡
                i--;                                            //確認下一個元素不會被跳過
                enemies[j].movement = enemies[j].speed;         //守衛陣亡後幽靈已先前速度移動
            }
        }
    }
}

//幽靈 
function handleEnemies(){
    for(let i = 0; i < enemies.length; i++){
        enemies[i].update();                                    //更新幽靈位置                                  
        enemies[i].draw();                                      //畫幽靈
        if(enemies[i].x < 0){                                   //幽靈是否攻陷(碰到左邊界)
            gameOver = true;
        }
        if(enemies[i].health <= 0){                             //是否打敗幽靈
            let gainedResources = enemies[i].maxHealth/10;      //打敗幽靈可以增加resources
            //將打敗僵屍獲得resources時顯示浮動訊息
            floatMessages.push(new floatMessage('+' + gainedResources, enemies[i].x, enemies[i].y, 30, 'black'));       //幽靈位置顯示
            floatMessages.push(new floatMessage('+' + gainedResources, 280, 65, 30, 'gold'));                           //分數顯示區顯示
            numberOfResources += gainedResources;               //打敗幽靈可增加資源
            score += gainedResources;                           //打敗幽靈可增加分數
            const findThisIndex = enemyPositions.indexOf(enemies[i].y);                 //打敗幽靈也要把幽靈位置刪掉
            enemyPositions.splice(findThisIndex, 1);
            enemies.splice(i, 1);
            i--;
        }
    }
    if(frame % enemiesInterval === 0 && score < winningScore){                              //在未贏得遊戲時，敵軍持續增加
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * blockSize + blockGap;    //幽靈位置隨機
        enemies.push(new Enemy(verticalPosition));                                          //紀錄幽靈y位置
        enemyPositions.push(verticalPosition);
        if(enemiesInterval > 120) enemiesInterval -= 50;                                    //幽靈增加間隔隨遊戲進行越來越快
    }
}

//給資源bonus
function handleResources(){
    if(frame % 500 === 0 && score < winningScore){
        resources.push(new Resources());                                                    //未贏得遊戲時，持續給資源
    }
    for(let i = 0; i < resources.length; i++){
        resources[i].draw();
        if(resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)){           //判斷滑鼠有沒有碰到資源bonus
            numberOfResources += resources[i].amount;                                       //碰到Resources欄的值增加
            //分別在bonus位置和Resources欄顯示浮動訊息
            floatMessages.push(new floatMessage('+' + resources[i].amount, resources[i].x, resources[i].y, 30, 'black'));
            floatMessages.push(new floatMessage('+' + resources[i].amount, 280, 80, 30, 'gold'));
            resources.splice(i, 1);
            i--;
        }
    }
}

//遊戲狀態
function handleGameStatus(){
    //最上方bonus和Resources欄固定顯示分數資源
    ctx.fillStyle = 'gold';
    ctx.font = '30px Orbitron';
    ctx.font= '35px Share Tech Mono';
    ctx.fillText('Score:' + score, 20, 40);
    ctx.fillText('Resources:' + numberOfResources, 20, 80);
    if(gameOver){                                                   //遊戲失敗顯示文字
        musicPlay++;
        ctx.fillStyle = 'Crimson';
        ctx.font = '90px Orbitron';
        ctx.fillText('GAME OVER', 135, 330);
        if(musicPlay === 1){
            fail.play();                                            //遊戲失敗播放音效                                   
            audio.pause();
        }else if(musicPlay > 500){
            audio.play();
        }
    }else{
        audio.play();
    }
    if(score >= winningScore && enemies.length  === 0){             //遊戲成功顯示
        musicPlay++;
        ctx.fillStyle = 'black';
        ctx.font = '60px Orbitron';
        ctx.fillText('LEVEL COMPLETE', 130, 300);
        ctx.font = '30px Orbitron';
        ctx.fillText('You win with ' + score + ' points!', 134, 340);
        if(musicPlay === 1){
            success.play();                                         //遊戲成功音效撥放
            audio.pause();
        }else if(musicPlay > 500){
            audio.play();
        }
    }
}

//浮動bonus訊息顯示
function handleFloatMessage(){
    for(let i = 0; i < floatMessages.length; i++){
        floatMessages[i].update();                              //更新位置
        floatMessages[i].draw();
        if(floatMessages[i].lifeSpan >= 50){                    //顯示時間超過50就從陣列移除
            floatMessages.splice(i, 1);
            i--;                                                //確認下一個元素不會被跳過          
        }
    }
}

//碰撞判斷
function collision(first, second){                              //傳入要判斷的兩物件
    if( !(first.x > second.x + second.width ||                      
        first.x + first.width < second.x ||
        first.y > second.y + second.height ||
        first.y + first.height < second.y)                     //透過物件是方形有四點特性判斷撞擊 
    ){
        return true;                    
    };
};


//遊戲執行主程式
function animate(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);           //清掉Block stroke()畫在畫布上軌跡
    ctx.fillStyle = 'DarkBlue';                                 //最上方bonus和Resources欄背景顏色
    ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);  //最上方bonus和Resources欄
    handleGameGrid();                                           //每次呼叫animate()都要更新每種物件，需要各自呼叫
    handleWarriors();
    handleResources();
    handleProjectiles();
    handleEnemies();
    handleGameStatus();
    handleFloatMessage();                                       
    frame++;                                                    //frame紀錄遊戲時間
    if(!gameOver) requestAnimationFrame(animate);               //recursion callback清掉舊畫面
}
animate();

//當調整螢幕大小時，重新計算螢幕大小
window.addEventListener('resize',function(){   
    canvasPosition = canvas.getBoundingClientRect();  
});


//功能表各式功能(onclick事件發生)
function reload(){                                              //遊戲重新整理
    ctx.font = '20px Press Start 2P';
    window.location.reload();
};

function changeBackgroundMud() {                                //功能表的Mud被點擊 
    background = 2;                                             //改變canvas背景
    var elem = document.getElementById("body");                 //改變body背景色
    elem.style.backgroundColor = 'rgb(195, 190, 218)';
}

function changeBackgroundYard() {                               //功能表Theme的Yard被點擊 
    background = 1;                                             
    var elem = document.getElementById("body");
    elem.style.backgroundColor = 'rgb(125, 193, 248)';
}

function changeBackgroundTower() {                              //功能表Theme的Tower被點擊 
    background = 3;
    var elem = document.getElementById("body");
    elem.style.backgroundColor = 'rgb(180, 223, 218)';
}

function changeBackgroundPool() {                               //功能表Theme的Pool被點擊 
    background = 4;
    var elem = document.getElementById("body");
    elem.style.backgroundColor = 'rgb(199, 221, 255)';
}

function changeBackgroundSnowing() {                            //功能表Theme的Snowing被點擊 
    background = 5;
    var elem = document.getElementById("body");
    elem.style.backgroundColor = 'rgb(254, 232, 252)';
}

function changeLevelToEasy(){                                   //功能表Level的Easy被點擊 
    enemiesInterval = 650;                                      //透過改變幽靈出來間隔調整難度
    winningScore = 50;                                          //透過改變遊戲成功分數門檻調整難度
}

function changeLevelToMedium(){
    enemiesInterval = 500;
    winningScore = 80;
}

function changeLevelToHard(){
    winningScore = 100;
    enemiesInterval = 300;
}