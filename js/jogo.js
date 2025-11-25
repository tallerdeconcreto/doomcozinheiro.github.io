// canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1200;
canvas.height = 800;


const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAMEOVER: 'gameover',
    VICTORY: 'victory'
};

let currentState = GameState.MENU;
let score = 0;
let gameSpeed = 2;
let lives = 10;
let bonusLifeGiven = false;

// imagens 
const chefImage = new Image();
chefImage.src = 'img/chiefdoom.jpg';

const laserImage = new Image();
laserImage.src = 'img/laser.jpg';

const backgroundImage = new Image();
backgroundImage.src = 'img/cozinha.jpg';

const enemyImages = {
    '🥕': new Image(),
    '🥬': new Image(),
    '🥦': new Image(),
    '🌽': new Image()
};

enemyImages['🥕'].src = 'img/cenoura.webp';
enemyImages['🥬'].src = 'img/alfaçe.png';
enemyImages['🥦'].src = 'img/Broccoli.webp';
enemyImages['🌽'].src = 'img/milho.png';

const congratsImage = new Image();
congratsImage.src = 'img/congrats-memeland.png';

const menuImage = new Image();
menuImage.src = 'img/pixil-frame-0(1).png';


const player = {
    x: canvas.width / 2 - 40,
    y: canvas.height / 2 - 40,
    width: 80,
    height: 80,
    speed: 4,
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false,
    angle: 0,
    aimUp: false,
    aimDown: false,
    aimLeft: false,
    aimRight: false
};


const projectiles = [];
const projectileSpeed = 10;
let shootCooldown = 0;
const shootCooldownTime = 30;

const enemies = [];
const enemyProjectiles = []; 
let enemySpawnTimer = 0;
const enemySpawnInterval = 150;

//inimigos 
const EnemyType = {
    MELEE: 'melee',    
    SHOOTER: 'shooter', 
    BLOCKER: 'blocker'  
};


document.addEventListener('keydown', (e) => {
    if (currentState === GameState.MENU && e.key === 'Enter') {
        startGame();
    }
    if ((currentState === GameState.GAMEOVER || currentState === GameState.VICTORY) && e.key === 'Enter') {
        resetGame();
    }
    if ((currentState === GameState.GAMEOVER || currentState === GameState.VICTORY) && (e.key === 'r' || e.key === 'R')) {
        startGame();
    }
    if (currentState === GameState.PLAYING) {
        // movimentos
        if (e.key === 'a' || e.key === 'A') player.moveLeft = true;
        if (e.key === 'd' || e.key === 'D') player.moveRight = true;
        if (e.key === 'w' || e.key === 'W') player.moveUp = true;
        if (e.key === 's' || e.key === 'S') player.moveDown = true;
        
        // mirar
        if (e.key === 'ArrowLeft') player.aimLeft = true;
        if (e.key === 'ArrowRight') player.aimRight = true;
        if (e.key === 'ArrowUp') player.aimUp = true;
        if (e.key === 'ArrowDown') player.aimDown = true;
        
        if (e.key === ' ') {
            e.preventDefault();
            if (shootCooldown <= 0) {
                shootProjectile();
                shootCooldown = shootCooldownTime;
            }
        }
    }
});

document.addEventListener('keyup', (e) => {
    // Movimento
    if (e.key === 'a' || e.key === 'A') player.moveLeft = false;
    if (e.key === 'd' || e.key === 'D') player.moveRight = false;
    if (e.key === 'w' || e.key === 'W') player.moveUp = false;
    if (e.key === 's' || e.key === 'S') player.moveDown = false;
    
    //mirar 
    if (e.key === 'ArrowLeft') player.aimLeft = false;
    if (e.key === 'ArrowRight') player.aimRight = false;
    if (e.key === 'ArrowUp') player.aimUp = false;
    if (e.key === 'ArrowDown') player.aimDown = false;
});

// Funcoes
function startGame() {
    currentState = GameState.PLAYING;
    score = 0;
    lives = 10;
    bonusLifeGiven = false;
    enemies.length = 0;
    projectiles.length = 0;
    enemyProjectiles.length = 0;
    player.x = canvas.width / 2 - 40;
    player.y = canvas.height / 2 - 40;
    gameSpeed = 2;
    
    const bgMusic = document.getElementById('bgMusic');
    if (bgMusic) {
        bgMusic.volume = 0.3;
        bgMusic.play().catch(e => console.log('Autoplay bloqueado:', e));
    }
}

function resetGame() {
    currentState = GameState.MENU;
    const bgMusic = document.getElementById('bgMusic');
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
}

function shootProjectile() {
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    
    // direção do tiro de acordo com a mira atual
    let vx = 0, vy = 0;
    
    if (player.aimLeft) vx = -1;
    if (player.aimRight) vx = 1;
    if (player.aimUp) vy = -1;
    if (player.aimDown) vy = 1;
    
    // usa o anguo se não tiver clicando em nada
    if (vx === 0 && vy === 0) {
        vx = Math.cos(player.angle);
        vy = Math.sin(player.angle);
    }
    
    // manter velocidade
    const magnitude = Math.sqrt(vx * vx + vy * vy);
    if (magnitude > 0) {
        vx = (vx / magnitude) * projectileSpeed;
        vy = (vy / magnitude) * projectileSpeed;
        
        //angulo
        const angle = Math.atan2(vy, vx);
        
        projectiles.push({
            x: centerX - 50,
            y: centerY - 8,
            width: 100,
            height: 16,
            vx: vx,
            vy: vy,
            angle: angle
        });
    }
}

function spawnEnemy() {
    const vegetableTypes = ['🥕', '🥬', '🥦', '🍅', '🌽'];
    const side = Math.floor(Math.random() * 4);
    
    const enemyType = Math.random() < 0.7 ? EnemyType.MELEE : EnemyType.SHOOTER;
    
    let x, y;
    
    switch(side) {
        case 0:
            x = Math.random() * canvas.width;
            y = -40;
            break;
        case 1:
            x = canvas.width + 40;
            y = Math.random() * canvas.height;
            break;
        case 2:
            x = Math.random() * canvas.width;
            y = canvas.height + 40;
            break;
        case 3:
            x = -40;
            y = Math.random() * canvas.height;
            break;
    }
    
    enemies.push({
        x: x,
        y: y,
        width: 50,
        height: 50,
        type: vegetableTypes[Math.floor(Math.random() * vegetableTypes.length)],
        enemyType: enemyType,
        speed: enemyType === EnemyType.MELEE ? 2.5 : 1.5,
        shootTimer: 0,
        shootCooldown: 120,
        health: enemyType === EnemyType.MELEE ? 3 : 1
    });
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function update() {
    if (currentState !== GameState.PLAYING) return;

    if (shootCooldown > 0) {
        shootCooldown--;
    }

    if (player.aimLeft || player.aimRight || player.aimUp || player.aimDown) {
        let aimX = 0, aimY = 0;
        if (player.aimLeft) aimX = -1;
        if (player.aimRight) aimX = 1;
        if (player.aimUp) aimY = -1;
        if (player.aimDown) aimY = 1;
        
        player.angle = Math.atan2(aimY, aimX);
    }

    if (player.moveLeft && player.x > 0) player.x -= player.speed;
    if (player.moveRight && player.x < canvas.width - player.width) player.x += player.speed;
    if (player.moveUp && player.y > 0) player.y -= player.speed;
    if (player.moveDown && player.y < canvas.height - player.height) player.y += player.speed;

    // Atualizar projéteis do jogador
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].x += projectiles[i].vx;
        projectiles[i].y += projectiles[i].vy;
        
        // apagr o tiro ao chgaro na borda
        if (projectiles[i].x < -20 || projectiles[i].x > canvas.width + 20 ||
            projectiles[i].y < -20 || projectiles[i].y > canvas.height + 20) {
            projectiles.splice(i, 1);
        }
    }

    // Atualizar projéteis dos inimigos
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        enemyProjectiles[i].x += enemyProjectiles[i].vx;
        enemyProjectiles[i].y += enemyProjectiles[i].vy;
        
        // Colisão 
        if (checkCollision(player, enemyProjectiles[i])) {
            lives--;
            enemyProjectiles.splice(i, 1);
            if (lives <= 0) {
                currentState = GameState.GAMEOVER;
            }
            continue;
        }
        
        // Remover projéteis 
        if (enemyProjectiles[i].x < -20 || enemyProjectiles[i].x > canvas.width + 20 ||
            enemyProjectiles[i].y < -20 || enemyProjectiles[i].y > canvas.height + 20) {
            enemyProjectiles.splice(i, 1);
        }
    }

    // Spawn dos bixos
    enemySpawnTimer++;
    if (enemySpawnTimer >= enemySpawnInterval) {
        spawnEnemy();
        enemySpawnTimer = 0;
    }

    
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Calcular direção para o jogador
        const dx = player.x + player.width / 2 - (enemy.x + enemy.width / 2);
        const dy = player.y + player.height / 2 - (enemy.y + enemy.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // tipos e seus movimentos
            if (enemy.enemyType === EnemyType.MELEE) {
                enemy.x += dirX * enemy.speed;
                enemy.y += dirY * enemy.speed;
            } else if (enemy.enemyType === EnemyType.SHOOTER) {
                enemy.x += dirX * enemy.speed * 0.5;
                enemy.y += dirY * enemy.speed * 0.5;
                
                enemy.shootTimer++;
                if (enemy.shootTimer >= enemy.shootCooldown) {
                    enemyProjectiles.push({
                        x: enemy.x + enemy.width / 2 - 8,
                        y: enemy.y + enemy.height / 2 - 8,
                        width: 16,
                        height: 16,
                        vx: dirX * 3,
                        vy: dirY * 3
                    });
                    enemy.shootTimer = 0;
                }
            }
        }

        if (checkCollision(player, enemy)) {
            lives--;
            enemies.splice(i, 1);
            if (lives <= 0) {
                currentState = GameState.GAMEOVER;
            }
            continue;
        }

        for (let j = projectiles.length - 1; j >= 0; j--) {
            if (checkCollision(projectiles[j], enemy)) {
                enemy.health--;
                projectiles.splice(j, 1);
                
                if (enemy.health <= 0) {
                    enemies.splice(i, 1);
                    score += 30;
                    
                    if (score >= 500 && !bonusLifeGiven) {
                        lives += 10;
                        bonusLifeGiven = true;
                    }
                    
                    if (score >= 500) {
                        currentState = GameState.VICTORY;
                    }
                }
                break;
            }
        }
    }

    if (score > 0 && score % 100 === 0) {
        gameSpeed = Math.min(gameSpeed + 0.1, 5);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentState === GameState.MENU) {
        if (menuImage.complete) {
            ctx.drawImage(menuImage, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    if (currentState === GameState.PLAYING) {
        
        if (backgroundImage.complete) {
            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.rotate(player.angle);
        
        if (chefImage.complete) {
            ctx.drawImage(chefImage, -player.width / 2, -player.height / 2, player.width, player.height);
        } else {
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
        }
        
        ctx.restore();

        projectiles.forEach(p => {
            ctx.save();
            ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
            ctx.rotate(p.angle);
            
            if (laserImage.complete) {
                ctx.drawImage(laserImage, -p.width / 2, -p.height / 2, p.width, p.height);
            } else {
                ctx.fillStyle = '#95a5a6';
                ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
            }
            
            ctx.restore();
        });

        enemyProjectiles.forEach(p => {
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(p.x + p.width/2, p.y + p.height/2, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#cc0000';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        enemies.forEach(e => {
            const enemyImg = enemyImages[e.type];
            
            if (e.enemyType === EnemyType.SHOOTER) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fillRect(e.x, e.y, e.width, e.height);
            }
            
            if (enemyImg && enemyImg.complete) {
                ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);
            } else {
                ctx.font = '35px Arial';
                ctx.fillText(e.type, e.x, e.y + 35);
            }
            
            if (e.enemyType === EnemyType.MELEE && e.health > 1) {
                ctx.fillStyle = 'white';
                ctx.font = '16px Arial';
                ctx.fillText(`❤${e.health}`, e.x + 10, e.y - 5);
            }
        });

        // Pontuação eSS
        ctx.fillStyle = 'black';
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Pontos: ${score} | Vidas: ${lives}`, 10, 30);
    }

    if (currentState === GameState.GAMEOVER) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = '32px Arial';
        ctx.fillText(`Pontuação: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.font = '24px Arial';
        ctx.fillText('Pressione R para jogar novamente', canvas.width / 2, canvas.height / 2 + 60);
        ctx.fillText('Pressione ENTER para voltar ao menu', canvas.width / 2, canvas.height / 2 + 90);
    }

    if (currentState === GameState.VICTORY) {
        if (congratsImage.complete) {
            ctx.drawImage(congratsImage, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = 'rgba(0, 100, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width / 2 - 400, canvas.height / 2 - 150, 800, 300);
        
        ctx.fillStyle = 'gold';
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 VITÓRIA! 🏆', canvas.width / 2, canvas.height / 2 - 60);
        ctx.fillStyle = 'white';
        ctx.font = '32px Arial';
        ctx.fillText(`Você sobreviveu com ${lives} vidas!`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText(`Pontuação Final: ${score}`, canvas.width / 2, canvas.height / 2 + 50);
        ctx.font = '24px Arial';
        ctx.fillText('Pressione R para jogar novamente', canvas.width / 2, canvas.height / 2 + 100);
        ctx.fillText('Pressione ENTER para voltar ao menu', canvas.width / 2, canvas.height / 2 + 130);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Iniciar o jogo
gameLoop();