const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const flash = document.getElementById('flash');

document.getElementById('start-btn').onclick = () => {
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  startGame();
};

const canvas = document.getElementById('tetris');
const nextCanvas = document.getElementById('next');
const ctx = canvas.getContext('2d');
const nextCtx = nextCanvas.getContext('2d');

const grid = 20;
const COLS = canvas.width / grid;
const ROWS = canvas.height / grid;

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
let score = 0;

const COLORS = { 1:'orange',2:'cyan',3:'pink',4:'red',5:'lightgreen' };

const SHAPES = [
  [[1,1,1,1]],
  [[2,2],[2,2]],
  [[0,3,0],[3,3,3]],
  [[4,0,0],[4,4,4]],
  [[0,0,5],[5,5,5]]
];

function randomPiece(){ return { shape: SHAPES[Math.floor(Math.random()*SHAPES.length)], x:3, y:0 }; }

let piece=null, nextPiece=randomPiece();
let dropCounter=0, dropInterval=500, lastTime=0;

function collide(board,piece){
  for(let y=0;y<piece.shape.length;y++){
    for(let x=0;x<piece.shape[y].length;x++){
      if(piece.shape[y][x] && (board[piece.y+y] && board[piece.y+y][piece.x+x])!==0)
        return true;
    }
  }
  return false;
}

function rotate(piece){
  const rotated = piece.shape[0].map((_,i)=>piece.shape.map(row=>row[i]).reverse());
  const prev = piece.shape;
  piece.shape = rotated;
  if(collide(board,piece)) piece.shape = prev;
}

function merge(board,piece){
  piece.shape.forEach((row,y)=>{
    row.forEach((v,x)=>{ if(v) board[piece.y+y][piece.x+x]=99; });
  });
}

function drawNext(){
  nextCtx.fillStyle='#000';
  nextCtx.fillRect(0,0,nextCanvas.width,nextCanvas.height);
  nextPiece.shape.forEach((row,y)=>{
    row.forEach((v,x)=>{
      if(v){
        nextCtx.fillStyle = COLORS[v];
        nextCtx.fillRect(x*15,y*15,14,14);
      }
    });
  });
}

function lightningFlash(){
  flash.classList.add('show');
  setTimeout(()=>flash.classList.remove('show'),150);
}

function clearLines(){
  let cleared=false;
  for(let y=ROWS-1;y>=0;y--){
    if(board[y].every(v=>v!==0)){
      board.splice(y,1);
      board.unshift(Array(COLS).fill(0));
      score+=100;
      cleared=true;
    }
  }
  if(cleared) lightningFlash();
  document.getElementById('score').textContent=score;
}

function draw(){
  ctx.fillStyle='#000';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  board.forEach((row,y)=>{
    row.forEach((v,x)=>{
      if(v){
        ctx.fillStyle = v===99 ? 'white' : COLORS[v];
        ctx.fillRect(x*grid,y*grid,grid-1,grid-1);
      }
    });
  });

  if(piece){
    piece.shape.forEach((row,y)=>{
      row.forEach((v,x)=>{
        if(v){
          ctx.fillStyle = COLORS[v];
          ctx.fillRect((piece.x+x)*grid,(piece.y+y)*grid,grid-1,grid-1);
        }
      });
    });
  }
}

function update(t=0){
  const delta=t-lastTime;
  lastTime=t;
  dropCounter+=delta;

  if(dropCounter>dropInterval){
    piece.y++;
    if(collide(board,piece)){
      piece.y--;
      merge(board,piece);
      clearLines();
      piece=nextPiece;
      nextPiece=randomPiece();
      drawNext();
      if(collide(board,piece)) return endGame();
    }
    dropCounter=0;
  }

  draw();
  requestAnimationFrame(update);
}

function startGame(){
  piece=randomPiece();
  nextPiece=randomPiece();
  drawNext();
  update();
}

function endGame(){
  gameScreen.classList.add('hidden');
  gameoverScreen.classList.remove('hidden');
}

document.getElementById('left').onclick=()=>{piece.x--;if(collide(board,piece))piece.x++;};
document.getElementById('right').onclick=()=>{piece.x++;if(collide(board,piece))piece.x--;};
document.getElementById('down').onclick=()=>{piece.y++;if(collide(board,piece))piece.y--;};
document.getElementById('rotate').onclick=()=>rotate(piece);
