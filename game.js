const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");
context.scale(20, 20);

const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");
nextCtx.scale(20, 20);

let scoreElement = document.getElementById("score");

const colors = ["#E0BA31", "#35B9DB", "#BE3AD6", "#EB433F", "#3ED936"];

function createMatrix(w, h) {
    const matrix = [];
    while (h--) matrix.push(new Array(w).fill(0));
    return matrix;
}

function createPiece() {
    const pieces = "TJLOSZI";
    const type = pieces[(pieces.length * Math.random()) | 0];

    switch (type) {
        case "T": return [[0,1,0],[1,1,1]];
        case "O": return [[1,1],[1,1]];
        case "L": return [[1,0],[1,0],[1,1]];
        case "J": return [[0,1],[0,1],[1,1]];
        case "I": return [[1],[1],[1],[1]];
        case "S": return [[0,1,1],[1,1,0]];
        case "Z": return [[1,1,0],[0,1,1]];
    }
}

function drawMatrix(matrix, offset, ctx = context, white = false) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = white ? "#ffffff" : value;
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = "#ffffff";
            }
        });
    });
}

function rotate(matrix) {
    return matrix[0].map((_, i) => matrix.map(r => r[i]).reverse());
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y >= 0; y--) {
        if (arena[y].every(v => v !== 0)) {

            lightningEffect();

            arena.splice(y, 1);
            arena.unshift(new Array(arena[0].length).fill(0));
            score += rowCount * 10;
            rowCount *= 2;
            scoreElement.textContent = score;
        }
    }
}

function lightningEffect() {
    const flash = document.createElement("div");
    flash.style.position = "absolute";
    flash.style.top = 0;
    flash.style.left = 0;
    flash.style.width = "100%";
    flash.style.height = "100%";
    flash.style.background = "rgba(255,255,0,0.4)";
    flash.style.pointerEvents = "none";
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 150);
}

function draw() {
    context.fillStyle = "#4C5375";
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, {x:0, y:0});
    drawMatrix(player.matrix, player.pos);
}

function update() {
    if (!running) return;

    dropCounter += 16;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        resetPiece();
        arenaSweep();
    }
    dropCounter = 0;
}

function resetPiece() {
    player.matrix = nextPiece;
    nextPiece = createPiece().map(row => row.map(v => v ? colors[(Math.random()*colors.length)|0] : 0));

    player.pos.y = 0;
    player.pos.x = ((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);

    drawNext();

    if (collide(arena, player)) endGame();
}

function drawNext() {
    nextCtx.fillStyle = "#4C5375";
    nextCtx.fillRect(0,0,nextCanvas.width,nextCanvas.height);
    drawMatrix(nextPiece, {x:0, y:0}, nextCtx);
}

function endGame() {
    running = false;
    document.getElementById("game-screen").classList.add("d-none");
    document.getElementById("gameover-screen").classList.remove("d-none");
}

let arena = createMatrix(12, 20);
let player = {pos: {x:0, y:0}, matrix: null};
let nextPiece = createPiece();
nextPiece = nextPiece.map(r => r.map(v => v ? colors[(Math.random()*colors.length)|0] : 0));
let dropCounter = 0;
let dropInterval = 500;
let score = 0;
let running = false;

document.querySelectorAll(".control-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        if (action === "left") player.pos.x--;
        if (action === "right") player.pos.x++;
        if (action === "down") playerDrop();
        if (action === "rotate") player.matrix = rotate(player.matrix);

        if (collide(arena, player)) {
            if (action === "left") player.pos.x++;
            if (action === "right") player.pos.x--;
            if (action === "rotate") player.matrix = rotate(rotate(rotate(player.matrix)));
        }
    });
});

document.getElementById("startBtn").onclick = () => {
    document.getElementById("start-screen").classList.add("d-none");
    document.getElementById("game-screen").classList.remove("d-none");

    running = true;
    resetPiece();
    update();
};
