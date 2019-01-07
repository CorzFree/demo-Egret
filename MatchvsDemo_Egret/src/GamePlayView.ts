class GamePlayView extends egret.DisplayObjectContainer{
	private _egretBird0:egret.Bitmap;
	private _egretBird1:egret.Bitmap;
	private _egretBird2:egret.Bitmap;
	private _star:egret.Bitmap;
	private _starObject:egret.DisplayObject;
	private _score:number;
	private _scoreLabel:eui.Label;
	private _delayLabel:eui.Label;
	private _minDelayValue:number;
	private _maxDelayValue:number;
	private _receiveCountValue:number;
	private _receiveMsgCountLabel:eui.Label;
	private _countDownLabel:eui.Label;
	private _netWorkNoticeLabel:eui.Label;
	private _roomID:string;
	private _fontSize = 22;

	private _gameTime:number;

	private moveTimeer:egret.Timer = new egret.Timer(100, 0);
	private moveDire:number = 0; // 0-left  1-rgith
	
	constructor() {
		super();
		this.addEventListener(egret.Event.ADDED_TO_STAGE,this.onAddToStage,this);
	}
	private onAddToStage(event:egret.Event){
		GameData.width = this.stage.stageWidth;
		GameData.height = this.stage.stageHeight;
		this.startLoad();
	}
	private startLoad():void {
		GameData.starPositionX = 0;
        if (GameData.syncFrame === true && GameData.isRoomOwner === true) {
			let result = mvs.MsEngine.getInstance.setFrameSync(GameData.frameRate);
            if (result !== 0){
				console.log('设置帧同步率失败,错误码:' + result);
			}
        }

		// GameData.userScoreAll = [];
		/**
		 * 游戏结束标记置空
		 */
		GameData.isGameOver = false;
		this._gameTime = GameData.playerTime;
		this._score = 0;
		this._receiveCountValue = 0;

		/**
		 * 这里添加地图背景
		 */
		let image = new  eui.Image();
		image.source = "resource/assets/Game/gamebackground.jpg";
		image.height = GameData.height;
		image.width = GameData.width;
		this.addChild(image);

		this.createStar()
		/**
		 * 如果是灰色地主，地图颜色改为灰色
		 */
		if(GameData.roomPropertyValue === GameData.roomPropertyType.mapB){
			let colorMatrix = [
			0.3,0.6,0,0,0,
			0.3,0.6,0,0,0,
			0.3,0.6,0,0,0,
			0,0,0,1,0
			];
			let colorFlilter = new egret.ColorMatrixFilter(colorMatrix);
			image.filters = [colorFlilter];
		}

		/**
		 * 顶部显示自己的 用户信息
		 */
        let userIdLabel = new eui.Label();
        userIdLabel.textColor = 0xffffff;
        userIdLabel.fontFamily = "Tahoma";  //设置字体
		userIdLabel.text = "用户id:" + GameData.gameUser.id+"["+GameData.gameUser.name+"]";
		userIdLabel.size = this._fontSize;
        userIdLabel.x = 20;
        userIdLabel.y = 20;
        this.addChild(userIdLabel);

		/**
		 * 房间号显示控件
		 */
        let roomIdLabel = new eui.Label();
        roomIdLabel.textColor = 0xffffff;
        roomIdLabel.fontFamily = "Tahoma";  //设置字体
		roomIdLabel.text = "房间号:" + GameData.roomID;
		this._roomID = GameData.roomID;
		roomIdLabel.size = this._fontSize;
        roomIdLabel.x = 20;
        roomIdLabel.y = 60;
        this.addChild(roomIdLabel);

		/**
		 * 所有角色的分数显示控件 
		 */
        let scoreLabel = new eui.Label();
        scoreLabel.textColor = 0xffffff;
        scoreLabel.fontFamily = "Tahoma";  //设置字体
		scoreLabel.size = this._fontSize;
        scoreLabel.x = 20;
        scoreLabel.y = 100;
		this._scoreLabel = scoreLabel;
        this.addChild(this._scoreLabel);

		/**
		 * 当前延迟显示控件
		 */
        let delayLabel = new eui.Label();
        delayLabel.textColor = 0xffffff;
        delayLabel.fontFamily = "Tahoma";  //设置字体
		delayLabel.size = this._fontSize;
        delayLabel.x = 20;
        delayLabel.y = GameData.height - 200;
		this._delayLabel = delayLabel;
        this.addChild(this._delayLabel);		

		/**
		 * 收到消息数量显示控件
		 */
        let receiveMsgCountLabel = new eui.Label();
        receiveMsgCountLabel.textColor = 0xffffff;
        receiveMsgCountLabel.fontFamily = "Tahoma";  //设置字体
		receiveMsgCountLabel.size = this._fontSize;
        receiveMsgCountLabel.x = 20;
        receiveMsgCountLabel.y = GameData.height - 80;
		this._receiveMsgCountLabel = receiveMsgCountLabel;
        this.addChild(this._receiveMsgCountLabel);		

		/**
		 * 计时控件
		 */
        let countDownLabel = new eui.Label();
        countDownLabel.textColor = 0xffffff;
        countDownLabel.fontFamily = "Tahoma";  //设置字体
		countDownLabel.size = this._fontSize;
        countDownLabel.x = GameData.width/2;
        countDownLabel.y = 20;
		countDownLabel.text = this._gameTime.toString();
		this._countDownLabel = countDownLabel;
        this.addChild(this._countDownLabel);

		/**
		 * 有人离开时提示控件
		 */
		let netWorkNoticeLabel = new eui.Label();
        netWorkNoticeLabel.textColor = 0xff0000;
        netWorkNoticeLabel.fontFamily = "Tahoma";  //设置字体
		netWorkNoticeLabel.size = this._fontSize;
        netWorkNoticeLabel.x = GameData.width/2;
        netWorkNoticeLabel.y = 50;
		netWorkNoticeLabel.text = "";
		this._netWorkNoticeLabel = netWorkNoticeLabel;
        this.addChild(this._netWorkNoticeLabel);	

		if(GameData.syncFrame === true){
			let fs = new eui.Label();
			fs.textColor = 0xffffff;
			fs.fontFamily = "Tahoma";  //设置字体
			fs.size = this._fontSize;
			fs.text = "FrameRate:"+GameData.frameRate.toString();
			fs.x = GameData.width-200;
			fs.y = 20;
			this.addChild(fs);
		}

		/**
		 * 初始化并且设置分数
		 */
		this.initUserScore();

		if (GameData.isRoomOwner == true) {
			//如果是房主就创建第一个球
			this.createStarFirst();
		}

		let loader:egret.ImageLoader = new egret.ImageLoader();
		loader.addEventListener(egret.Event.COMPLETE, this.onLoadComplete, this);
		let url:string = "resource/assets/Game/cartoon-egret_01.png";
		loader.load(url);

		let loader2:egret.ImageLoader = new egret.ImageLoader();
		loader2.addEventListener(egret.Event.COMPLETE, this.onLoadComplete2, this);
		let url2:string = "resource/assets/Game/cartoon-egret_02.png";
		loader2.load(url2);

		let loader3:egret.ImageLoader = new egret.ImageLoader();
		loader3.addEventListener(egret.Event.COMPLETE, this.onLoadComplete3, this);
		let url3:string = "resource/assets/Game/cartoon-egret_03.png";
		loader3.load(url3);
		
		//注册matchvs网络监听事件
		this.addMsResponseListen();
	}

	/**
	 * 注册 matchvs 组件监听事件
	 */
	private addMsResponseListen(){
		this.moveTimeer.addEventListener(egret.TimerEvent.TIMER,this.RoleMoveFun,this);
        //发送消息
        mvs.MsResponse.getInstance.addEventListener(mvs.MsEvent.EVENT_SENDEVENT_NTFY, this.sendEventNotify,this);
        //离开房间
        mvs.MsResponse.getInstance.addEventListener(mvs.MsEvent.EVENT_LEAVEROOM_NTFY, this.leaveRoomNotify,this);

		mvs.MsResponse.getInstance.addEventListener(mvs.MsEvent.EVENT_NETWORKSTATE_NTFY, this.networkStateNotify,this);

		mvs.MsResponse.getInstance.addEventListener(mvs.MsEvent.EVENT_SETFRAMESYNC_RSP, this.setFrameSyncResponse,this);
		mvs.MsResponse.getInstance.addEventListener(mvs.MsEvent.EVENT_FRAMEUPDATE, this.frameUpdate,this);
		mvs.MsResponse.getInstance.addEventListener(mvs.MsEvent.EVENT_OFFLINEDATE_RSP, this.getOffLineDataResponse, this);
    }

    public release(){
		this.moveTimeer.removeEventListener(egret.TimerEvent.TIMER,this.RoleMoveFun,this);
        mvs.MsResponse.getInstance.removeEventListener(mvs.MsEvent.EVENT_SENDEVENT_NTFY, this.sendEventNotify,this);

        mvs.MsResponse.getInstance.removeEventListener(mvs.MsEvent.EVENT_LEAVEROOM_NTFY, this.leaveRoomNotify,this);

		mvs.MsResponse.getInstance.removeEventListener(mvs.MsEvent.EVENT_NETWORKSTATE_NTFY, this.networkStateNotify,this);

		mvs.MsResponse.getInstance.removeEventListener(mvs.MsEvent.EVENT_SETFRAMESYNC_RSP, this.setFrameSyncResponse,this);
		mvs.MsResponse.getInstance.removeEventListener(mvs.MsEvent.EVENT_FRAMEUPDATE, this.frameUpdate,this);
		mvs.MsResponse.getInstance.removeEventListener(mvs.MsEvent.EVENT_OFFLINEDATE_RSP, this.getOffLineDataResponse, this);
    }

	private initUserScore() {
		let i:number = 0;
		for(i = 0; i < GameData.playerUserIds.length; i++) {
			GameData.playerUserIds[i].pValue = 0;
		}
		this.setScoreLabel();
	}

	private setUserScore(userID:number, score:number) {
		let isFind:boolean = false;
		let i:number = 0;
		for(i = 0; i < GameData.playerUserIds.length; i++) {
			if (GameData.playerUserIds[i].id == userID) {
				isFind = true;
				GameData.playerUserIds[i].pValue = score;
				break;
			}
		}
		this.bubbleSort();
		this.setScoreLabel();
	}

	private setScoreLabel() {
		GameData.number1 = (GameData.playerUserIds[0].name != "" ? GameData.playerUserIds[0].name : GameData.playerUserIds[0].id) + ': ' + GameData.playerUserIds[0].pValue;
		GameData.number2 = (GameData.playerUserIds[1].name != "" ? GameData.playerUserIds[1].name : GameData.playerUserIds[1].id) + ': ' + GameData.playerUserIds[1].pValue;
		GameData.number3 = (GameData.playerUserIds[2].name != "" ? GameData.playerUserIds[2].name : GameData.playerUserIds[2].id) + ': ' + GameData.playerUserIds[2].pValue;
		this._scoreLabel.text = GameData.number1 + "\n" + GameData.number2 + "\n" + GameData.number3;
	}

    private bubbleSort() {
        let len = GameData.playerUserIds.length;
        for (let i = 0; i < len; i++) {
            for (let j = 0; j < len - 1 - i; j++) {
                if (GameData.playerUserIds[j].pValue > GameData.playerUserIds[j+1].pValue) {        //相邻元素两两对比
                    let temp = GameData.playerUserIds[j+1];        //元素交换
                    GameData.playerUserIds[j+1] = GameData.playerUserIds[j];
                    GameData.playerUserIds[j] = temp;
                }
            }
        }
    }

	// 左边移动
	private moveLeft(){
		if(this._egretBird0.x <= 0){
			this._egretBird0.x = 0;
		}else{
			this._egretBird0.x -= 20;
		}
		
		this.processStar();
	}

	// 右边移动
	private moveRight(){
		if(this._egretBird0.x >= GameData.width){
			this._egretBird0.x = GameData.width;
		}else{
			this._egretBird0.x += 20;
		}
		
		this.processStar();
	}

	private RoleMoveFun(){
		if(this.moveDire == 0){
			this.moveLeft();
		}else if(this.moveDire == 1){
			this.moveRight();
		}
	}

	/**
	 * 设置帧同步
	 */
	private setFrameSyncResponse(ev:egret.Event) {
		let rsp = ev.data;
		if(rsp.mStatus == 200) {
			console.log("设置帧同步率成功");
		} else {
			console.log("设置帧同步率失败");
		}
	}

	/**
	 * 玩家1 加载完成
	 */
	private onLoadComplete(event:egret.Event):void {
		let loader:egret.ImageLoader = <egret.ImageLoader>event.target;
		let bitmapData:egret.BitmapData = loader.data;
		let texture = new egret.Texture();
		texture.bitmapData = bitmapData;
		this._egretBird0 = new egret.Bitmap(texture);
        this._egretBird0.anchorOffsetX = this._egretBird0.width/2;
        this._egretBird0.anchorOffsetY = this._egretBird0.height/2;
        this._egretBird0.x = this.stage.stageWidth/2;
        this._egretBird0.y = GameData.defaultHeight;
		this._egretBird0.name = GameData.playerUserIds[0].id.toString();
        this.addChild(this._egretBird0);		

        let buttonLeft = new eui.Button();
        buttonLeft.label = "按住向左";
        buttonLeft.x = 300;
        buttonLeft.y = this.stage.stageHeight - 100;
		buttonLeft.width = 200;
        this.addChild(buttonLeft);
		buttonLeft.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onButtonClickLeftBegin, this);
		buttonLeft.addEventListener(egret.TouchEvent.TOUCH_END, this.onButtonClickLeftEnd, this);
		buttonLeft.addEventListener(egret.TouchEvent.TOUCH_RELEASE_OUTSIDE, this.onButtonClickLeftEnd, this);

        let buttonRight = new eui.Button();
        buttonRight.label = "按住向右";
        buttonRight.x = this.stage.stageWidth- 450;
        buttonRight.y = this.stage.stageHeight - 100;
		buttonRight.width = 200;
        this.addChild(buttonRight);
		buttonRight.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onButtonClickRightBegin, this);
		buttonRight.addEventListener(egret.TouchEvent.TOUCH_END, this.onButtonClickRightEnd, this);
		buttonRight.addEventListener(egret.TouchEvent.TOUCH_RELEASE_OUTSIDE, this.onButtonClickRightEnd, this);

        let buttonLeave = new eui.Button();
        buttonLeave.label = "离开游戏";
        buttonLeave.x = this.stage.stageWidth - 120;
        buttonLeave.y = this.stage.stageHeight - 50;
        this.addChild(buttonLeave);
		buttonLeave.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onButtonLeaveRoom, this);

		if(GameData.syncFrame === true ){
			let buttonGetData = new eui.Button();
			buttonGetData.label = "断线帧数据";
			buttonGetData.x = this.stage.stageWidth - 120;
			buttonGetData.y = this.stage.stageHeight - 100;
			this.addChild(buttonGetData);
			buttonGetData.addEventListener(egret.TouchEvent.TOUCH_TAP, this.getOffLineData, this);
		}
		

		//计时
		let idCountDown = setInterval(() => {
			this._countDownLabel.text = (this._gameTime--).toString();
			if(this._gameTime == 0) {
				this.release();
				GameData.isGameOver = true;
				console.log("1结束房间ID：",  GameData.roomID,GameData.playerUserIds);
				GameSceneView._gameScene.showResult(GameData.playerUserIds, this._roomID);
			}
			if (GameData.isGameOver === true) {
				clearInterval(idCountDown);
			}
		}, 1000);

		GameData.intervalList.push(idCountDown);

		//发送位置信息
        if (GameData.syncFrame === false) {

			let userids = [];
			
			 GameData.playerUserIds.forEach((user)=>{
				 userids.push(user.id);
			 });

            let id = setInterval(() => {
				//console.log("当前位置：", this._egretBird0.x);
				mvs.MsEngine.getInstance.sendEventEx(0, JSON.stringify({
                    action: GameData.playerPositionEvent,
					x: this._egretBird0.x,
					y: GameData.defaultHeight,
                    ts: new Date().getTime(),
					uid: GameData.gameUser.id
                }), 0, userids);
                if (GameData.isGameOver === true) {
                    clearInterval(id);
                }
            }, 200);
			GameData.intervalList.push(id);
        } else {
			let first = false;
            let id = setInterval(() => {
				if(first == false){
					first = true;
					console.log("测试帧同步数据：", JSON.stringify({
                    action: GameData.playerPositionEvent,
					x: this._egretBird0.x,
					y: GameData.defaultHeight,
                    ts: new Date().getTime(),
					uid: GameData.gameUser.id
                }));
				}
				mvs.MsEngine.getInstance.sendFrameEvent(JSON.stringify({
                    action: GameData.playerPositionEvent,
					x: this._egretBird0.x,
					y: GameData.defaultHeight,
                    ts: new Date().getTime(),
					uid: GameData.gameUser.id
                }));
                if (GameData.isGameOver === true) {
                    clearInterval(id);
                }
            }, 200);
			GameData.intervalList.push(id);
		}
	}

	/**
	 * 离开房间异步回调
	 */
	private leaveRoomNotify(ev:egret.Event) {
		GameData.isGameOver = true;
		this.release();
		console.log("2结束房间ID：",  GameData.roomID, GameData.playerUserIds);
		GameSceneView._gameScene.showResult(GameData.playerUserIds,this._roomID);
	}

	/**
	 * 玩家2加载完成
	 */
	private onLoadComplete2(event:egret.Event):void {
		let loader:egret.ImageLoader = <egret.ImageLoader>event.target;
		let bitmapData:egret.BitmapData = loader.data;
		let texture = new egret.Texture();
		texture.bitmapData = bitmapData;
		this._egretBird1 = new egret.Bitmap(texture);
        this._egretBird1.anchorOffsetX = this._egretBird1.width/2;
        this._egretBird1.anchorOffsetY = this._egretBird1.height/2;
        this._egretBird1.x = this.stage.stageWidth/2;
        this._egretBird1.y = GameData.defaultHeight;
		this._egretBird1.name = GameData.playerUserIds[1].id.toString();
        this.addChild(this._egretBird1);
	}

	/**
	 * 玩家3加载完成
	 */
	private onLoadComplete3(event:egret.Event):void {
		let loader:egret.ImageLoader = <egret.ImageLoader>event.target;
		let bitmapData:egret.BitmapData = loader.data;
		let texture = new egret.Texture();
		texture.bitmapData = bitmapData;
		this._egretBird2 = new egret.Bitmap(texture);
        this._egretBird2.anchorOffsetX = this._egretBird2.width/2;
        this._egretBird2.anchorOffsetY = this._egretBird2.height/2;
        this._egretBird2.x = this.stage.stageWidth/2;
        this._egretBird2.y = GameData.defaultHeight;
		this._egretBird2.name = GameData.playerUserIds[2].id.toString();
        this.addChild(this._egretBird2);
	}

	private processStar() {
		let length:number = Math.abs(this._egretBird0.x - this._star.x);
		console.log("length:" + length);
		if (length <= (this._star.width + this._egretBird0.width)/2) {
			this._score++;
			this.setUserScore(GameData.gameUser.id, this._score);

			let newX:number = 0;
			newX = Math.random() * this.stage.width;
			this.changeStarPosition(newX, GameData.defaultHeight);
			let eventTemp = {
				action: GameData.changeStarEvent,
				x: this._star.x,
				y: GameData.defaultHeight,
				score: this._score,
			}
			let result = mvs.MsEngine.getInstance.sendEvent(JSON.stringify(eventTemp));
			if (!result || result.result !== 0)
				return console.log('足球位置变更事件发送失败:' + JSON.stringify(result));			
		}
	}

	/**
	 * 左边移动
	 */
    private onButtonClickLeftBegin(e: egret.TouchEvent) {
		console.log("按钮事件：",e.target.currentState);
		if(e.target.currentState == "down"){
			this.moveDire = 0;
			console.log("开始移动");
			this.moveTimeer.start();
		}else{
			console.log("结束移动");
			this.moveDire = 3;
			this.moveTimeer.stop();
		}
		
	}
	/**
	 * 左边移动
	 */
    private onButtonClickLeftEnd(e: egret.TouchEvent) {
		console.log("按钮事件：",e.target.currentState);
		console.log("结束移动");
		this.moveDire = 3;
		this.moveTimeer.stop();
	}


	/**
	 * 右边移动
	 */
    private onButtonClickRightBegin(e: egret.TouchEvent) {
		if(e.target.currentState == "down"){
			console.log("开始移动");
			this.moveDire = 1;
			this.moveTimeer.start();
		}else{
			console.log("结束移动");
			this.moveDire = 3;
			this.moveTimeer.stop();
		}
	}

	/**
	 * 右边移动
	 */
    private onButtonClickRightEnd(e: egret.TouchEvent) {
		console.log("结束移动");
		this.moveDire = 3;
		this.moveTimeer.stop();
	}

	private onButtonLeaveRoom(e: egret.TouchEvent) {
		this.release();
		mvs.MsEngine.getInstance.leaveRoom("踢球好累");
		GameSceneView._gameScene.lobby();
		GameData.isGameOver = true;
		GameData.isRoomOwner = false;
		GameData.syncFrame = false;
	}
	private createStar() {
		let loader:egret.ImageLoader = new egret.ImageLoader();
		loader.addEventListener(egret.Event.COMPLETE, this.onLoadStar, this);
		let url:string = "resource/assets/Game/star1.png";
		loader.load(url);
	}
	/**
	 * 第一次生成小足球
	 */
	private createStarFirst() {
		let loader:egret.ImageLoader = new egret.ImageLoader();
		loader.addEventListener(egret.Event.COMPLETE, this.onLoadStarFirst, this);
		let url:string = "resource/assets/Game/star1.png";
		loader.load(url);
	}	

	/**
	 * 小足球图片加载完成事件
	 */
	private onLoadStarFirst(event:egret.Event):void {
		GameData.starPositionX = Math.random() * this.stage.width;
		GameData.starPositionY = GameData.defaultHeight;		
		let loader:egret.ImageLoader = <egret.ImageLoader>event.target;
		let bitmapData:egret.BitmapData = loader.data;
		let texture = new egret.Texture();
		texture.bitmapData = bitmapData;
		this.deleteStar();
		this._star = new egret.Bitmap(texture);
        this._star.anchorOffsetX = this._star.width/2;
        this._star.anchorOffsetY = this._star.height/2;
		this._star.x = GameData.starPositionX;
        this._star.y = GameData.starPositionY;
		console.log("球创建的位置：", GameData.starPositionX, GameData.starPositionY);
        this._starObject = this.addChild(this._star);
		if (GameData.isRoomOwner === true) {
			let eventTemp = {
				action: GameData.newStarEvent,
				x: this._star.x,
				y: GameData.defaultHeight
			}
			let result = mvs.MsEngine.getInstance.sendEvent(JSON.stringify(eventTemp));
			if (!result || result.result !== 0) {
				return console.log('创建足球事件发送失败');
			}
			console.log('创建足球事件发送成功');
		}
	}	
	private onLoadStar(event:egret.Event):void {	
		let loader:egret.ImageLoader = <egret.ImageLoader>event.target;
		let bitmapData:egret.BitmapData = loader.data;
		let texture = new egret.Texture();
		texture.bitmapData = bitmapData;
		this.deleteStar();
		this._star = new egret.Bitmap(texture);
        this._star.anchorOffsetX = this._star.width/2;
        this._star.anchorOffsetY = this._star.height/2;
		this._star.x = GameData.starPositionX;
        this._star.y = GameData.starPositionY;
        this._starObject = this.addChild(this._star);

	}
	private deleteStar() {
		if(this.contains(this._star)){
			console.log("删除原有的 boll");
			this.removeChild(this._star);
		}
	}
	private changeStarPosition(x:number, y:number) {
		this._star.x = x;
		this._star.y = y;
	}

	/**
	 * 收到消息事件，用于控制小鸭子的情况
	 */
	private sendEventNotify(event:egret.Event) {
		let sdnotify = event.data;
        if (sdnotify && sdnotify.cpProto) {
            if (sdnotify.cpProto.indexOf(GameData.newStarEvent) >= 0) {
				if(sdnotify.srcUserId != GameData.gameUser.id) {
					//console.log("new star event");
					let info = JSON.parse(sdnotify.cpProto);
					GameData.starPositionX = info.x;
					GameData.starPositionY = info.y;
					this.deleteStar();
					this.createStar();
				}
            } else if (sdnotify.cpProto.indexOf(GameData.playerPositionEvent) >= 0) {
                // 收到其他玩家的位置速度加速度信息，根据消息中的值更新状态
                this._receiveCountValue++;
				this._receiveMsgCountLabel.text = "receive msg count: " + this._receiveCountValue;
                let cpProto = JSON.parse(sdnotify.cpProto);
                if (sdnotify.srcUserId == GameData.gameUser.id) {
                    let delayValue = new Date().getTime() - cpProto.ts;
                    if (this._minDelayValue === undefined || delayValue < this._minDelayValue) {
                        this._minDelayValue = delayValue;
                    }
                    if (this._maxDelayValue === undefined || delayValue > this._maxDelayValue) {
                        this._maxDelayValue = delayValue;
                    }
					this._delayLabel.text = "delay: " + delayValue + "\n" + "minDelay: " + this._minDelayValue + "\n" + "maxDelay: " + this._maxDelayValue; 
                } else {
					//console.log("cpProto=" + JSON.stringify(cpProto) + " name1=" + this._egretBird1.name + "name2=" + this._egretBird2.name);
					if (this._egretBird1.name == cpProto.uid) {
						this._egretBird1.x = cpProto.x;
						this._egretBird1.y = cpProto.y;
					} else if (this._egretBird2.name == cpProto.uid) {
						this._egretBird2.x = cpProto.x;
						this._egretBird2.y = cpProto.y;
					}
                }
            } else if (sdnotify.cpProto.indexOf(GameData.reconnectStartEvent) >= 0) {
				let info = JSON.parse(sdnotify.cpProto);
				if(info.userID === GameData.gameUser.id && GameData.starPositionX == 0) {
					GameData.starPositionX = info.x;
					GameData.starPositionY = info.y;
					GameData.playerUserIds = info.PlayerScoreInfos;
					info.PlayerScoreInfos.forEach((value)=>{
						//取出我自己原来的分数
						if(value.id === info.userID){
							this._score = value.pValue;
						}
					});

					this._gameTime = info.timeCount;
					console.log("重连倒计时时间：", sdnotify.cpProto);
					this.deleteStar();
					this.createStar();
					this.setScoreLabel();
				}
			} else if (sdnotify.cpProto.indexOf(GameData.changeStarEvent) >= 0) {
				if(sdnotify.srcUserId != GameData.gameUser.id) {
					let info = JSON.parse(sdnotify.cpProto);
					this.changeStarPosition(info.x, info.y);
					this.setUserScore(sdnotify.srcUserId, info.score);
				}
			}else if(sdnotify.cpProto.indexOf(GameData.reconnectReadyEvent) >= 0){
				console.log("重新连接收到消息 this._countDownLabel.text",this._gameTime);
				setTimeout(()=>{
						let eventTemp = {
						action: GameData.reconnectStartEvent,
						userID: sdnotify.srcUserId,
						PlayerScoreInfos:GameData.playerUserIds,
						timeCount:Number(this._gameTime),
						x: this._star.x,
						y: GameData.defaultHeight
					}
					//发送游戏数据
					let result = mvs.MsEngine.getInstance.sendEvent(JSON.stringify(eventTemp));
					if (!result || result.result !== 0) {
						return console.log('重连创建足球事件发送失败');
					}
					console.log('重连创建足球事件发送成功');
				},1000);
			}
        }
	}

	/**
	 * 帧同步更新
	 */
	private frameUpdate(ev:egret.Event) {
		let data = ev.data;
		for (let i = 0 ; i < data.frameItems.length; i++) {
			let info:MsFrameItem = data.frameItems[i];
			if (info.cpProto.indexOf(GameData.playerPositionEvent) >= 0) {
					// 收到其他玩家的位置速度加速度信息，根据消息中的值更新状态
					this._receiveCountValue++;
					this._receiveMsgCountLabel.text = "receive msg count: " + this._receiveCountValue;
					let cpProto = JSON.parse(info.cpProto);
					
					if (info.srcUserID == GameData.gameUser.id) {
						let delayValue = new Date().getTime() - cpProto.ts;
						if (this._minDelayValue === undefined || delayValue < this._minDelayValue) {
							this._minDelayValue = delayValue;
						}
						if (this._maxDelayValue === undefined || delayValue > this._maxDelayValue) {
							this._maxDelayValue = delayValue;
						}
						this._delayLabel.text = "delay: " + delayValue + "\n" + "minDelay: " + this._minDelayValue + "\n" + "maxDelay: " + this._maxDelayValue; 
					} else {
						//console.log("cpProto=" + JSON.stringify(cpProto) + " name1=" + this._egretBird1.name + "name2=" + this._egretBird2.name);
						if (this._egretBird1.name == cpProto.uid) {
							this._egretBird1.x = cpProto.x;
							this._egretBird1.y = cpProto.y;
						} else if (this._egretBird2.name == cpProto.uid) {
							this._egretBird2.x = cpProto.x;
							this._egretBird2.y = cpProto.y;
						}
					}
			}
		}
	}


	/**
	 * 收到其他玩家的网络状态情况
	 */
	private networkStateNotify(ev:egret.Event){
		let netnotify = ev.data;
		console.log("玩家："+netnotify.userID+" state:"+netnotify.state);
		if(netnotify.state === 1){
			this._netWorkNoticeLabel.text = "玩家掉线:"+netnotify.userID;
			console.log("玩家掉线:"+netnotify.userID);
		}else if(netnotify.state === 2 ){
			console.log("玩家已经重连进来");
			this._netWorkNoticeLabel.text = "";
		}else{
			console.log("玩家："+ netnotify.userID+" 重新连接失败！离开房间，游戏结束");
			mvs.MsEngine.getInstance.leaveRoom("玩累了");
			this.release();
			GameSceneView._gameScene.lobby();
			GameData.isGameOver = true;
			GameData.isRoomOwner = false;
			GameData.syncFrame = false;
		}

	}

	private getOffLineDataResponse(ev:egret.Event){
		let netnotify = ev.data;
		console.log("获取断线帧数据：",netnotify);
	}

	/**
	 * 获取断线数据
	 */
	private getOffLineData(e: egret.TouchEvent){
		mvs.MsEngine.getInstance.getOffLineData(-1);
	}
}