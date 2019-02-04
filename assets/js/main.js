class Tetris {
    constructor(width, height) {
        this.canvas = document.getElementById('tetris');
        this.ctx = this.canvas.getContext('2d');

        this.resize(width, height);

        this.timeFrame = 10;
        this.lastUpdated = 0;
        this.debugLines = false;

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
            music: new Howl({src: ["assets/sounds/SFX_Music.ogg"], volume: 0, loop: true}),
            fall: new Howl({src: ["assets/sounds/SFX_PieceFall.ogg"], volume: 0}),
            move: new Howl({src: ["assets/sounds/SFX_PieceMoveLR.ogg"], volume: 0}),
            rotate: new Howl({src: ["assets/sounds/SFX_PieceRotateLR.ogg"], volume: 0}),
            lines: [
                0,
                new Howl({src: ["assets/sounds/SFX_SpecialLineClearSingle.ogg"], volume: 0}),
                new Howl({src: ["assets/sounds/SFX_SpecialLineClearDouble.ogg"], volume: 0}),
                new Howl({src: ["assets/sounds/SFX_SpecialLineClearTriple.ogg"], volume: 0}),
                new Howl({src: ["assets/sounds/SFX_SpecialTetris.ogg"], volume: 0})
            ]
        };

        this.tileImage = new Image();
        this.tileImage.src = '/assets/tile.png';
        this.tileImage.loaded = false;
        this.tileImage.onload = () => this.tileImage.loaded = true;


        this.binds();
        this.reset();
    }

    resize(width, height) {
        this.width = width;
        this.height = height;

        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.boardWidth = 10;
        this.boardHeight = 20;

        this.tileWidth = (this.width / this.boardWidth) / 2;
        this.tileHeight = (this.height / this.boardHeight);
    }

    reset() {
        this.running = true;
        this.currentPiece = 0;
        this.currentRotation = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.nextPiece = this.randomPiece;
        this.lines = [];
        this.board = [];
        this.level = 0;
        this.score = 0;

        for(let i = 0; i < this.boardWidth; i++) {
            this.board[i] = [];
            for(let j = 0; j < this.boardHeight; j++) {
                this.board[i][j] = 0;
            }
        }


        this.sounds.music.play();
        this.dropPiece();
    }


    binds() {
        // window.addEventListener('resize', () => this.resize(window.innerWidth, window.innerHeight))
        document.addEventListener('keydown', e => {
            if (e.key === 'w') {
                if(this.testFor("rotate")) {
                    this.rotatePiece(1);
                }
            } else if (e.key === 'a') {
                if(this.testFor("left")) {
                    this.movePieceX(-1);
                }
            } else if (e.key === 's') {
                if(this.testFor("down")) {
                    this.movePieceY(1);
                }
            } else if (e.key === 'd') {
                if(this.testFor("right")) {
                    this.movePieceX(1);
                }
            } else if(e.key === ' ') {
                if(this.running) {
                    this.stop();
                } else {
                    this.start();
                }
            }
        })


        let initialX = null;
        let initialY = null;

        this.canvas.addEventListener("touchstart", e => {
            initialX = e.touches[0].clientX;
            initialY = e.touches[0].clientY;
        }, false);

        this.canvas.addEventListener("touchend", e => {
            if (initialX === null || initialY === null) { return; }
            if(this.testFor("rotate")) {
                this.rotatePiece(1);
            }
        })

        this.canvas.addEventListener("touchmove", e => {
            if (initialX === null || initialY === null) { return; }

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;

            const diffX = initialX - currentX;
            const diffY = initialY - currentY;

            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 0) {
                    if(this.testFor("left")) {
                        this.movePieceX(-1);
                    }
                } else {
                    if(this.testFor("right")) {
                        this.movePieceX(1);
                    }
                }
            } else {
                if (diffY > 0) {
                    //Swiped Up
                } else {
                    if(this.testFor("down")) {
                        this.movePieceY(1);
                    }
                }
            }

            initialX = null;
            initialY = null;
            e.preventDefault();
        }, false);
    }

    get randomPiece() {
        const piece = Math.floor(Math.random() * this.pieces.length);
        return piece === this.nextPiece ? this.randomPiece : piece;
        // return 0;
    }

    get randomRotation() {
        return Math.floor(Math.random() * 3);
    }

    get randomX() {
        return Math.floor(Math.random() * this.boardWidth-1);
    }

    dropPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.randomPiece;
        this.currentX = (this.boardWidth / 2) - 2;
        // this.currentX = this.randomX;
        // this.currentRotation = this.randomRotation;
        this.currentY = -4;
    }

    testFor(type) {
        if(!this.running) return false;
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
                let b = (this.board[tileX] && this.board[tileX][tileY])? this.board[tileX][tileY] : undefined;
                if((a && b) || (a > 0 && b > 0) || (a > 0 && tileY == this.boardHeight)) {
                    fits = false;
                    break;
                }
                // if(tile)
            }
        }
        return fits;
    }


    rotatePiece(n) {
        this.currentRotation += n;
        this.sounds.rotate.play();
    }

    movePieceX(n) {
        this.currentX += n;
        this.sounds.move.play();
    }

    movePieceY(n) {
        this.currentY += n;
        this.sounds.move.play();
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

    tetrisCheck() {
        this.lines = [];
        for(let i = 0; i < this.boardHeight; i++) {
            let line = true;
            for(let j = 0; j < this.boardWidth; j++) {
                let n = this.board[j][i];
                if(!n) {
                    line = false;
                    break;
                }
            }
            if(line) this.lines.push(i)
        }

        if(this.lines.length > 0) {
            this.lines.forEach(i => {
                for(let j = 0; j < this.boardWidth; j++) {
                    // this.board[j][i] = 0;
                    this.board[j].splice(i, 1);   
                    //add a new empty line sub-array to the start of the array
                    this.board[j].unshift(0); 
                }
            })
            this.sounds.lines[this.lines.length].play();
            
            // Single   100 × level
            // Double	300 × level
            // Triple	500 × level
            // Tetris	800 x level


            if(this.lines.length === 1) {
                this.score += 100 * (this.level + 1);
            } else if(this.lines.length === 2) {
                this.score += 300 * (this.level + 1);
            } else if(this.lines.length === 3) {
                this.score += 500 * (this.level + 1);
            } else if(this.lines.length === 4) {
                this.score += 800 * (this.level + 1);
                this.level++;
                console.log("BOOM! TETRIS FOR JEFF");
            }
        }
    }


    update() {
        if (++this.lastUpdated % (25 - this.level) == 0) {
            if(this.pieceFits(
                this.currentPiece,
                this.currentX,
                this.currentY+1,
                this.currentRotation)) {
                    // this.sounds.fall.play();
                    this.currentY++;
                } else {
                    this.makeStatic();
                    this.tetrisCheck();
                    this.dropPiece();
                }
        }
    }


    drawBoard() {
        if(this.lines.length > 0) console.log(this.lines);
        for(let i = 0; i < this.boardWidth; i++) {
            for(let j = 0; j < this.boardHeight; j++) {
                let n = this.board[i][j];
                let x = (i * this.tileWidth) + (this.width / 4);
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
    }

    drawNextPiece(pieceX, pieceY) {
        // console.log(this.nextPiece);
        const tileW = this.tileWidth;
        const tileH = this.tileHeight;
        let currentPiece = this.getPiece(this.nextPiece, 0);
        for(let i = 0; i < currentPiece[0].length; i++) {
            for(let j = 0; j < currentPiece.length; j++) {
                let n = currentPiece[j][i];
                let x = pieceX + (i * (tileW));
                let y = pieceY + (j * (tileH));
                if(n > 0 && this.pieceColors[n] !== 'black') {
                    this.ctx.fillStyle = this.pieceColors[n];
                    this.ctx.fillRect(x, y, tileW, tileH);
                    if(this.tileImage.loaded) {
                        this.ctx.drawImage(this.tileImage, x, y, tileW, tileH);
                    }
                }
            }
        }
    }

    renderScore() {
        return this.score;
    }

    drawStats() {
        const qWidth = this.width / 4;
        const wMqWidth = this.width - qWidth;
        this.ctx.fillStyle = "#212121";
        this.ctx.fillRect(0, 0, qWidth, this.height);

        const boxScoreX = (this.tileWidth);
        const boxScoreY = this.tileHeight;


        this.ctx.fillStyle = "#FFF";
        this.ctx.font = (this.tileHeight / 1.5) + "px Verdana";
        this.ctx.fillText("SCORE", boxScoreX, boxScoreY);

        this.ctx.fillText(this.renderScore(), boxScoreX, boxScoreY * 2)

        this.ctx.fillStyle = "#212121";
        this.ctx.fillRect(wMqWidth, 0, qWidth, this.height);

        const boxNextX = wMqWidth + (qWidth - (this.tileWidth * 3.5));
        const boxNextY = this.tileHeight;

        this.ctx.fillStyle = "#FFF";
        this.ctx.font = (this.tileHeight / 1.5) + "px Verdana";
        this.ctx.fillText("NEXT", boxNextX, boxNextY);

        this.ctx.fillStyle = "black";
        this.drawNextPiece(boxNextX, boxNextY + this.tileHeight);
        
    }

    drawCurrentPiece() {
        let currentPiece = this.piece;
        for(let i = 0; i < currentPiece[0].length; i++) {
            for(let j = 0; j < currentPiece.length; j++) {
                let n = currentPiece[j][i];
                let x = ((this.currentX + i) * this.tileWidth) + (this.width / 4);
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


    draw() {
        this.drawBoard();
        this.drawCurrentPiece();
        this.drawStats();
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