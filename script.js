const canvas = document.getElementById("tetris");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("nextPiece");
const nextCtx = nextCanvas.getContext("2d");
ctx.scale(20, 20);
nextCtx.scale(20, 20);
const colors = ["#FFD700", "#00FFFF", "#FF00FF", "#FF3333", "#39FF14"]; // Neon: Gold, Cyan, Magenta, Red, Green
const white = "rgba(255, 255, 255, 0.5)"; // Semi-transparent white for locked pieces
function createPiece(type) {
    if (type === "T") return [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
    if (type === "O") return [[1, 1], [1, 1]];
    if (type === "L") return [[1, 0, 0], [1, 1, 1], [0, 0, 0]];
    if (type === "J") return [[0, 0, 1], [1, 1, 1], [0, 0, 0]];
    if (type === "I") return [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]];
    if (type === "S") return [[0, 1, 1], [1, 1, 0], [0, 0, 0]];
    if (type === "Z") return [[1, 1, 0], [0, 1, 1], [0, 0, 0]];
}
const pieces = "TOJLISZ";
function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) continue outer;
        }
        canvas.classList.add("flash");
        setTimeout(() => canvas.classList.remove("flash"), 150);
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        player.score += rowCount * 10;
        rowCount *= 2;
    }
}
function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}
function merge(arena, player) {
    player.matrix.forEach((row, y) => { row.forEach((value, x) => { if (value !== 0) { arena[y + player.pos.y][x + player.pos.x] = white; } }); });
}
function rotate(matrix) {
    return matrix.map((_, i) => matrix.map(row => row[i]).reverse());
}
function generateRandomPiece() {
    const type = pieces[(Math.random() * pieces.length) | 0];
    return {
        matrix: createPiece(type),
        color: colors[(Math.random() * colors.length) | 0]
    };
}

function playerReset() {
    if (!nextPieceData) {
        nextPieceData = generateRandomPiece();
    }

    player.matrix = nextPieceData.matrix;
    player.color = nextPieceData.color;

    // Generate the NEXT piece
    nextPieceData = generateRandomPiece();

    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix.length / 2 | 0);

    drawNextPiece();

    if (collide(arena, player)) {
        gameOver = true;
        document.getElementById("gameover-screen").classList.remove("d-none");
    }
}
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}
function drawMatrix(matrix, offset, context, colorOverride = null) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colorOverride || player.color;
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}
function drawNextPiece() {
    nextCtx.clearRect(0, 0, 4, 4);
    if (nextPieceData) {
        drawMatrix(nextPieceData.matrix, { x: 0.5, y: 0.5 }, nextCtx, nextPieceData.color);
    }
}
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, { x: 0, y: 0 }, ctx);
    drawMatrix(player.matrix, player.pos, ctx);
}
function update(time = 0) {
    if (gameOver) return;
    dropCounter += time - lastTime;
    lastTime = time;
    if (dropCounter > dropInterval) { playerDrop(); }
    draw();
    requestAnimationFrame(update);
}
const arena = Array.from({ length: 24 }, () => Array(12).fill(0));
const player = { pos: { x: 0, y: 0 }, matrix: null, color: null, score: 0 };
let nextPieceData = null;
const nextPiece = { matrix: null }; // Keeping for compatibility if referenced elsewhere, but nextPieceData is the source of truth
let lastTime = 0;
let dropInterval = 700;
let dropCounter = 0;
let gameOver = false;

function updateScore() { document.getElementById("score").textContent = player.score; }
function resetGame() {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    updateScore();
    gameOver = false;
    document.getElementById("gameover-screen").classList.add("d-none");
    playerReset();
    update();
}

function playerRotate() {
    const r = rotate(player.matrix);
    const p = player.matrix;
    player.matrix = r;
    if (collide(arena, player)) {
        player.matrix = p;
    }
}

function addRepeatListener(elementId, action) {
    const element = document.getElementById(elementId);
    let interval;
    let timeout;

    const start = (e) => {
        if (e.cancelable) e.preventDefault(); // Prevent default touch behavior if needed
        action();
        clearTimeout(timeout);
        clearInterval(interval);

        timeout = setTimeout(() => {
            interval = setInterval(action, 80); // Repeat every 80ms
        }, 200); // Wait 200ms before starting repeat
    };

    const stop = () => {
        clearTimeout(timeout);
        clearInterval(interval);
    };

    element.addEventListener('mousedown', start);
    element.addEventListener('touchstart', start, { passive: false });

    element.addEventListener('mouseup', stop);
    element.addEventListener('mouseleave', stop);
    element.addEventListener('touchend', stop);
    element.addEventListener('touchcancel', stop);
}

addRepeatListener("left", () => { player.pos.x--; if (collide(arena, player)) player.pos.x++; });
addRepeatListener("right", () => { player.pos.x++; if (collide(arena, player)) player.pos.x--; });
addRepeatListener("down", playerDrop);
addRepeatListener("rotate", playerRotate);
document.getElementById("startBtn").onclick = () => {
    document.getElementById("start-screen").classList.add("d-none");
    document.getElementById("game-screen").classList.remove("d-none");
    playerReset();
    updateScore();
    update();
};
document.getElementById("restartBtn").onclick = resetGame;

// Prevent double tap zoom and other default touch actions
document.addEventListener('touchstart', function (event) {
    if (event.touches.length > 1) {
        event.preventDefault(); // Prevent multi-touch zoom
    }
}, { passive: false });

document.addEventListener('touchmove', function (event) {
    event.preventDefault(); // Prevent scrolling/panning
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault(); // Prevent double-tap zoom
    }
    lastTouchEnd = now;
}, { passive: false });

// Prevent context menu on long press
document.addEventListener('contextmenu', function (event) {
    event.preventDefault();
});
