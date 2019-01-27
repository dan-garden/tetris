class Effect {
    constructor(path) {
        this.sound = document.createElement("audio");
        this.sound.src = path;
        this.sound.setAttribute("preload", "auto");
        this.sound.setAttribute("controls", "none");
        this.sound.style.display = "none";

        document.body.appendChild(this.sound);
    }

    play() {
        this.sound.play();
    }

    stop() {
        this.sound.pause();
    }
}



// this.sound = document.createElement("audio");
//     this.sound.src = src;
//     this.sound.setAttribute("preload", "auto");
//     this.sound.setAttribute("controls", "none");
//     this.sound.style.display = "none";
//     document.body.appendChild(this.sound);
//     this.play = function(){
//         this.sound.play();
//     }
//     this.stop = function(){
//         this.sound.pause();
//     }

class Tetris {
    constructor(width, height) {
        this.canvas = document.getElementById('tetris');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = width;
        this.canvas.height = height;

        this.boardWidth = 10;
        this.boardHeight = 20;

        this.tileWidth = width / this.boardWidth;
        this.tileHeight = height / this.boardHeight;

        this.timeFrame = 10;
        this.lastUpdated = 0;
        this.debugLines = false;

        this.level = 10;


        this.pieces = [
            [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],      //[I] Blue,
            [[0,0,0,0],[0,2,2,0],[0,2,2,0],[0,0,0,0]],      //[O] Yellow
            [[3,3,0,0],[0,3,0,0],[0,3,0,0],[0,0,0,0]],      //[L] Orange
            [[0,4,4,0],[0,4,0,0],[0,4,0,0],[0,0,0,0]],      //[J] Magenta
            [[0,5,0,0],[5,5,5,0],[0,0,0,0],[0,0,0,0]],      //[T] Purple
            [[0,6,0,0],[6,6,0,0],[6,0,0,0],[0,0,0,0]],      //[Z] Green
            [[7,0,0,0],[7,7,0,0],[0,7,0,0],[0,0,0,0]],      //[S] Red
        ];

        this.pieceColors = [
            'black',
            'cyan',
            'yellow',
            'orange',
            'magenta',
            'blueviolet',
            'lime',
            'red',
            'white'
        ];

        this.sounds = {
            move: new Effect("sounds/SFX_PieceMoveLR.ogg"),
            rotate: new Effect("sounds/SFX_PieceRotateLR.ogg")
        };

        this.tileImage = new Image();
        this.tileImage.src = '/tile.png';
        this.tileImage.loaded = false;
        this.tileImage.onload = () => this.tileImage.loaded = true;


        this.binds();
        this.reset();
    }

    reset() {
        this.running = false;
        this.currentPiece = 0;
        this.currentRotation = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.nextPiece = this.randomPiece;

        this.board = [];

        for(let i = 0; i < this.boardWidth; i++) {
            this.board[i] = [];
            for(let j = 0; j < this.boardHeight; j++) {
                this.board[i][j] = 0;
            }
        }



        this.dropPiece();
    }

    testFor(type) {
        if (type === "rotate") {
            return this.pieceFits(
                this.currentPiece,
                this.currentX,
                this.currentY,
                this.currentRotation + 1);
        } else if (type === "left") {
            return this.pieceFits(
                this.currentPiece,
                this.currentX - 1,
                this.currentY,
                this.currentRotation)
        } else if (type === "right") {
            return this.pieceFits(
                this.currentPiece,
                this.currentX + 1,
                this.currentY,
                this.currentRotation)
        } else if (type === "down") {
            return this.pieceFits(
                this.currentPiece,
                this.currentX,
                this.currentY + 1,
                this.currentRotation)
        }
    }

    getPiece(pieceType=0, rotation=0) {
        const matrix = Array.from(this.pieces[pieceType]);
        for(let i = 0; i < rotation; i++) {
            const N = matrix.length - 1;
            const result = matrix.map((row, i) => row.map((val, j) => matrix[N - j][i]));
            matrix.length = 0;
            matrix.push(...result);
        }
        return matrix;
    }

    get piece() {
        return this.getPiece(this.currentPiece, this.currentRotation);
    }

    pieceFits(pieceType, x, y, rotation) {
        const piece = this.getPiece(pieceType, rotation);
        let fits = true;

        for(let i = 0; i < piece[0].length; i++) {
            for(let j = 0; j < piece.length; j++) {
                let tileX = i + x;
                let tileY = j + y;
                let a = piece[j][i];
                let b = (this.board[tileX] && this.board[tileX][tileY])? this.board[tileX][tileY] : 0;
                if((a && b) || (a > 0 && b > 0) || (a > 0 && tileY == this.boardHeight)) {
                    fits = false;
                    break;
                }
                // if(tile)
            }
        }
        return fits;
    }

    binds() {
        document.addEventListener('keydown', e => {
            if (e.key === 'w' && this.testFor("rotate")) {

                this.currentRotation++;
                this.sounds.rotate.play();

            } else if (e.key === 'a' && this.testFor("left")) {

                this.currentX--;
                this.sounds.move.play();

            } else if (e.key === 's' && this.testFor("down")) {

                this.currentY++;

            } else if (e.key === 'd' && this.testFor("right")) {

                this.currentX++;
                this.sounds.move.play();
                
            } else {

            }
        })
    }

    makeStatic() {
        const piece = this.piece;
        for(let i = 0; i < piece[0].length; i++) {
            for(let j = 0; j < piece.length; j++) {
                if(this.board[i + this.currentX]
                    && this.board[i + this.currentX][j + this.currentY] !== undefined) {
                        if(this.piece[j][i]) {
                            this.board[i + this.currentX][j + this.currentY] = piece[j][i];
                        }
                    }
            }
        }
    }

    get randomPiece() {
        const piece = Math.floor(Math.random() * this.pieces.length);
        return piece === this.nextPiece ? this.randomPiece : piece;
    }


    dropPiece() {
        const randomPiece = this.randomPiece;
        this.currentPiece = this.nextPiece;
        this.nextPiece = randomPiece;
        this.currentX = 3;
        this.currentY = -4;
    }

    tetrisCheck() {
        let lines = [];
        for(let i = 0; i < this.boardHeight; i++) {
            let line = true;
            for(let j = 0; j < this.boardWidth; j++) {
                let n = this.board[j][i];
                if(!n) {
                    line = false;
                    break;
                }
            }
            if(line) {
                lines.push(i);
            }
            
        }


        if(lines.length > 0) {
            for(let i = 0; i < this.boardHeight; i++) {
                if(lines.indexOf(i) > -1) {
                    for(let j = 0; j < this.boardWidth; j++) {
                        this.board[j][i] = 0;
                    }
                }
            }
        }
    }


    update() {
        if (++this.lastUpdated % (20 - this.level) == 0) {
            if(this.pieceFits(
                this.currentPiece,
                this.currentX,
                this.currentY+1,
                this.currentRotation)) {
                    this.currentY++;
                    if(this.debugLines) {
                        console.log(
                            'p: '+this.currentPiece,
                            'x: '+this.currentX,
                            'y: '+this.currentY,
                            'r: '+this.currentRotation
                        )
                    }
                } else {
                    this.makeStatic();
                    this.tetrisCheck();
                    this.dropPiece();
                }
        }
    }


    draw() {
        for(let i = 0; i < this.boardWidth; i++) {
            for(let j = 0; j < this.boardHeight; j++) {
                let n = this.board[i][j];
                let x = i * this.tileWidth;
                let y = j * this.tileHeight;
                this.ctx.fillStyle = this.pieceColors[n];
                this.ctx.fillRect(x, y, this.tileWidth, this.tileHeight);

                if(n) {
                    if(this.tileImage.loaded) {
                        this.ctx.drawImage(this.tileImage, x, y, this.tileWidth, this.tileHeight);
                    }
                }

                if(this.debugLines) {
                    this.ctx.strokeStyle = "#3B3B3B";
                    this.ctx.strokeRect(x, y, this.tileWidth, this.tileHeight);
                }
            }
        }


        let currentPiece = this.piece;
        for(let i = 0; i < currentPiece[0].length; i++) {
            for(let j = 0; j < currentPiece.length; j++) {
                let n = currentPiece[j][i];
                let x = (this.currentX + i) * this.tileWidth;
                let y = (this.currentY + j) * this.tileHeight;

                if(n > 0 && this.pieceColors[n] !== 'black') {
                    this.ctx.fillStyle = this.pieceColors[n];
                    this.ctx.fillRect(x, y, this.tileWidth, this.tileHeight);
                    if(this.tileImage.loaded) {
                        this.ctx.drawImage(this.tileImage, x, y, this.tileWidth, this.tileHeight);
                    }
                }

                if(this.debugLines) {
                    this.ctx.strokeStyle = "#FF0000";
                    this.ctx.strokeRect(x, y, this.tileWidth, this.tileHeight);
                }
            }
        }

    }




    start() {
        this.running = true;
        requestAnimationFrame(this.loop.bind(this));
    }

    stop() {
        this.running = false;
    }

    loop(timing) {
        if(this.running) {
            this.update();
            this.draw();
            setTimeout(() => requestAnimationFrame(this.loop.bind(this)), this.timeFrame)
        }
    }    
}